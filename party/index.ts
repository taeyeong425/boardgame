import type { DurableObjectState, WebSocket as CfWebSocket } from "@cloudflare/workers-types";
import { getCatalogEntry } from "../shared/gameCatalog";
import type { ClientMessage, ServerEvent } from "../shared/messages";
import { freshRng } from "../shared/rng";
import { buildScoreEntry, computeTotals } from "../shared/scoring";
import type { GameId, Player, RoomState, StartingDrawEntry } from "../shared/types";
import { getGameModule } from "./games/registry";
import { loadRoomState, saveRoomState } from "./room/persistence";
import {
  createRoomState,
  HOST_REASSIGN_GRACE_MS,
  orderedPlayers,
  promoteHostIfNeeded,
  toPublicRoomState,
  upsertPlayer,
  withHost,
} from "./room/RoomState";
import { parseRoomCodeFromPath } from "./roomRouting";

// WebSocketPair is a Workers runtime global (like `fetch`/`Request`/`Response`), not something
// the @cloudflare/workers-types package's type-only module actually exports at runtime — importing
// it as a value fails to bundle. Declaring it locally gives the type without a real import.
declare const WebSocketPair: new () => { 0: CfWebSocket; 1: CfWebSocket };

const TURN_TIMEOUT_MS = 60_000;

/** Attached to each WebSocket via serializeAttachment — survives the Durable Object hibernating
 * and being re-instantiated between messages, same as PartyKit's connection.state used to. */
interface ConnState {
  connId: string;
  playerId: string | null;
  intent: "create" | "join";
  roomCode: string;
}

function connState(ws: CfWebSocket): ConnState | null {
  return (ws.deserializeAttachment() as ConnState | null) ?? null;
}

function setConnState(ws: CfWebSocket, state: ConnState) {
  ws.serializeAttachment(state);
}

function send(ws: CfWebSocket, event: ServerEvent) {
  ws.send(JSON.stringify(event));
}

/**
 * One Durable Object instance per room (looked up by room code — see party/worker.ts). This is a
 * direct port of the PartyKit-based room server to Cloudflare's own Durable Object + Hibernatable
 * WebSockets API, so it can be deployed straight to a Cloudflare account without going through
 * PartyKit's shared `partykit.dev` hosting.
 */
export class BoardgameRoom {
  constructor(private readonly ctx: DurableObjectState) {}

  private getSockets(): CfWebSocket[] {
    return this.ctx.getWebSockets() as CfWebSocket[];
  }

  private broadcast(event: ServerEvent, excludeConnIds: string[] = []) {
    const payload = JSON.stringify(event);
    for (const ws of this.getSockets()) {
      const cs = connState(ws);
      if (cs && excludeConnIds.includes(cs.connId)) continue;
      ws.send(payload);
    }
  }

  private broadcastPublicState(state: RoomState) {
    this.broadcast({ type: "roomState", state: toPublicRoomState(state) });
  }

  /** Sends every connected player their own per-player redacted view of the active game state. */
  private broadcastGameViews(state: RoomState) {
    if (!state.currentGameId || state.currentGameState === null) return;
    const gameModule = getGameModule(state.currentGameId);
    if (!gameModule) return;
    for (const ws of this.getSockets()) {
      const cs = connState(ws);
      if (!cs?.playerId) continue;
      const view = gameModule.getClientView
        ? gameModule.getClientView(state.currentGameState, cs.playerId)
        : state.currentGameState;
      send(ws, { type: "gameStateUpdated", state: view });
    }
  }

  /**
   * A Durable Object has exactly one alarm slot, shared here between two independent concerns —
   * turn timeouts and the host-reassignment grace period — so this always recomputes the
   * earliest of whichever deadlines are currently pending rather than letting one clobber the
   * other.
   */
  private async rescheduleAlarm(state: RoomState) {
    const deadlines: number[] = [];
    if (state.phase === "in-game" && state.turnDeadline !== null) deadlines.push(state.turnDeadline);
    if (state.hostDisconnectedAt !== null) deadlines.push(state.hostDisconnectedAt + HOST_REASSIGN_GRACE_MS);
    if (deadlines.length === 0) {
      await this.ctx.storage.deleteAlarm();
      return;
    }
    await this.ctx.storage.setAlarm(Math.min(...deadlines));
  }

  /**
   * Applies a single game move (real or auto-played on timeout) and folds in every consequence:
   * turn-timer rescheduling, and — the moment the game ends — converting raw scores into
   * cross-game rank/points via shared/scoring and appending them to the room's score ledger.
   */
  private async applyGameMove(
    state: RoomState,
    playerId: string,
    move: unknown
  ): Promise<{ state: RoomState; error?: string }> {
    if (!state.currentGameId || state.currentGameState === null) {
      return { state, error: "NO_ACTIVE_GAME" };
    }
    const gameModule = getGameModule(state.currentGameId);
    if (!gameModule) return { state, error: "UNKNOWN_GAME" };

    const result = gameModule.applyMove(state.currentGameState, playerId, move);
    if (!result.ok) return { state, error: result.error };

    let next: RoomState = { ...state, currentGameState: result.state };

    if (gameModule.isGameOver(result.state)) {
      const playerIds = orderedPlayers(state).map((p) => p.id);
      const { rawScores, sortOrder, summary } = gameModule.computeResult(result.state);
      const entry = buildScoreEntry(state.currentGameId, rawScores, sortOrder, playerIds, summary);
      const scoreLedger = [...state.scoreLedger, entry];
      // A game can define its own "next dealer" convention (e.g. Skull King: whoever won the
      // final trick); otherwise the rank-1 winner(s) of this game start first next game, ties
      // broken by earliest-joined.
      const nextStartingPlayerId =
        gameModule.getNextStartingPlayerId?.(result.state) ?? playerIds.find((id) => entry.ranks[id] === 1) ?? null;
      next = {
        ...next,
        // Land on "game-over" first (final board still visible, frozen) — the client explicitly
        // asks to move on to "round-end" (the rank/points breakdown) via showResults.
        phase: "game-over",
        scoreLedger,
        totals: computeTotals(scoreLedger, playerIds),
        turnDeadline: null,
        nextStartingPlayerId,
        startingPlayerDraw: null, // only ever relevant for the game that just started
      };
    } else {
      next = { ...next, turnDeadline: Date.now() + TURN_TIMEOUT_MS };
    }
    await this.rescheduleAlarm(next);

    return { state: next };
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 426 });
    }

    const url = new URL(request.url);
    const roomCode = parseRoomCodeFromPath(url.pathname);
    if (!roomCode) return new Response("Not found", { status: 404 });
    const intent: ConnState["intent"] = url.searchParams.get("intent") === "create" ? "create" : "join";

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    this.ctx.acceptWebSocket(server);
    setConnState(server, { connId: crypto.randomUUID(), playerId: null, intent, roomCode });

    // Cloudflare's Response constructor accepts a `webSocket` option that DOM's ResponseInit type
    // doesn't know about — this is purely a typing gap, the runtime call is correct as-is.
    return new Response(null, { status: 101, webSocket: client } as unknown as ResponseInit);
  }

  async webSocketMessage(ws: CfWebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;
    let parsed: ClientMessage;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }

    switch (parsed.type) {
      case "join":
        return this.handleJoin(ws, parsed.playerId, parsed.nickname);
      case "rejoin":
        return this.handleRejoin(ws, parsed.playerId);
      case "leave":
        return this.handleDisconnect(ws);
      case "selectGame":
        return this.handleSelectGame(ws, parsed.gameId);
      case "startGame":
        return this.handleStartGame(ws);
      case "gameAction":
        return this.handleGameAction(ws, parsed.action);
      case "backToLobby":
        return this.handleBackToLobby(ws);
      case "kickPlayer":
        return this.handleKickPlayer(ws, parsed.playerId);
      case "transferHost":
        return this.handleTransferHost(ws, parsed.playerId);
      case "changeNickname":
        return this.handleChangeNickname(ws, parsed.nickname);
      case "showResults":
        return this.handleShowResults(ws);
    }
  }

  async webSocketClose(ws: CfWebSocket) {
    await this.handleDisconnect(ws);
  }

  async webSocketError(ws: CfWebSocket) {
    await this.handleDisconnect(ws);
  }

  async alarm() {
    const state = await loadRoomState(this.ctx);
    if (!state) return;

    // One alarm slot serves two independent deadlines (see rescheduleAlarm) — check whichever
    // one(s) actually elapsed, since either or both can be due at the same wakeup.
    let next = state;
    if (
      next.phase === "in-game" &&
      next.turnDeadline !== null &&
      Date.now() >= next.turnDeadline &&
      next.currentGameId &&
      next.currentGameState !== null
    ) {
      const gameModule = getGameModule(next.currentGameId);
      const currentPlayerId = gameModule?.getCurrentTurnPlayerId(next.currentGameState) ?? null;
      if (gameModule && currentPlayerId) {
        const { state: afterMove } = await this.applyGameMove(
          next,
          currentPlayerId,
          gameModule.autoMove(next.currentGameState, currentPlayerId)
        );
        next = afterMove;
      }
    }

    next = promoteHostIfNeeded(next);

    await saveRoomState(this.ctx, next);
    this.broadcastPublicState(next);
    this.broadcastGameViews(next);
    await this.rescheduleAlarm(next);
  }

  private async handleJoin(ws: CfWebSocket, playerId: string, nickname: string) {
    const cs = connState(ws);
    if (!cs) return;
    let state = await loadRoomState(this.ctx);

    if (!state) {
      if (cs.intent !== "create") {
        send(ws, { type: "error", code: "NOT_FOUND", message: "Room does not exist." });
        ws.close();
        return;
      }
      const hostPlayer: Player = {
        id: playerId,
        nickname,
        connectionId: cs.connId,
        connected: true,
        isHost: true,
        joinedAt: Date.now(),
      };
      state = createRoomState(cs.roomCode, hostPlayer);
    } else {
      const existing = state.players[playerId];
      const player: Player = existing
        ? { ...existing, connectionId: cs.connId, connected: true, nickname }
        : { id: playerId, nickname, connectionId: cs.connId, connected: true, isHost: false, joinedAt: Date.now() };
      state = upsertPlayer(state, player);
      state = promoteHostIfNeeded(state);
    }

    setConnState(ws, { ...cs, playerId });
    await saveRoomState(this.ctx, state);
    this.broadcastPublicState(state);
    this.broadcastGameViews(state);
  }

  private async handleRejoin(ws: CfWebSocket, playerId: string) {
    const cs = connState(ws);
    const state = await loadRoomState(this.ctx);
    if (!state || !state.players[playerId]) {
      send(ws, { type: "error", code: "NOT_FOUND", message: "No such player in this room." });
      return;
    }
    let next = upsertPlayer(state, { ...state.players[playerId], connectionId: cs?.connId ?? null, connected: true });
    next = promoteHostIfNeeded(next);

    if (cs) setConnState(ws, { ...cs, playerId, intent: "join" });
    await saveRoomState(this.ctx, next);

    send(ws, { type: "roomState", state: toPublicRoomState(next) });
    if (next.currentGameId && next.currentGameState !== null) {
      const gameModule = getGameModule(next.currentGameId);
      const view = gameModule?.getClientView
        ? gameModule.getClientView(next.currentGameState, playerId)
        : next.currentGameState;
      send(ws, { type: "gameStateUpdated", state: view });
    }

    this.broadcast({ type: "playerConnectionChanged", playerId, connected: true }, [cs?.connId ?? ""]);
  }

  private async handleDisconnect(ws: CfWebSocket) {
    const cs = connState(ws);
    if (!cs?.playerId) return;
    const state = await loadRoomState(this.ctx);
    if (!state || !state.players[cs.playerId]) return;

    let next = upsertPlayer(state, { ...state.players[cs.playerId], connected: false, connectionId: null });
    // Don't reassign host immediately — a page reload or brief wifi drop closes this socket for
    // a moment; record when it happened and let promoteHostIfNeeded (run from the grace-period
    // alarm, or from another player's own join/rejoin) decide once the grace window has passed.
    if (cs.playerId === next.hostPlayerId && next.hostDisconnectedAt === null) {
      next = { ...next, hostDisconnectedAt: Date.now() };
    }
    await this.rescheduleAlarm(next);
    await saveRoomState(this.ctx, next);

    this.broadcast({ type: "playerConnectionChanged", playerId: cs.playerId, connected: false });
    this.broadcastPublicState(next);
  }

  private async handleSelectGame(ws: CfWebSocket, gameId: GameId) {
    const { state } = await this.requireHost(ws);
    if (!state) return;

    const catalogEntry = getCatalogEntry(gameId);
    if (!catalogEntry || !catalogEntry.implemented) {
      send(ws, { type: "error", code: "GAME_NOT_AVAILABLE", message: "This game isn't implemented yet." });
      return;
    }
    const next: RoomState = { ...state, currentGameId: gameId };
    await saveRoomState(this.ctx, next);
    this.broadcastPublicState(next);
  }

  private async handleStartGame(ws: CfWebSocket) {
    const { state } = await this.requireHost(ws);
    if (!state) return;

    if (state.phase !== "lobby" || !state.currentGameId) {
      send(ws, { type: "error", code: "INVALID_STATE", message: "Pick a game before starting." });
      return;
    }
    const gameModule = getGameModule(state.currentGameId);
    const catalogEntry = getCatalogEntry(state.currentGameId);
    if (!gameModule || !catalogEntry) {
      send(ws, { type: "error", code: "GAME_NOT_AVAILABLE", message: "This game isn't implemented yet." });
      return;
    }
    const players = orderedPlayers(state);
    if (players.length < catalogEntry.minPlayers || players.length > catalogEntry.maxPlayers) {
      send(ws, {
        type: "error",
        code: "PLAYER_COUNT",
        message: `${catalogEntry.displayName} needs ${catalogEntry.minPlayers}-${catalogEntry.maxPlayers} players.`,
      });
      return;
    }

    // No prior game to carry a winner over from — draw for it visibly instead of picking silently.
    let startingPlayerId = state.nextStartingPlayerId;
    let startingPlayerDraw: StartingDrawEntry[] | null = null;
    if (startingPlayerId === null || !players.some((p) => p.id === startingPlayerId)) {
      const rng = freshRng();
      const draws: StartingDrawEntry[] = players.map((p) => ({ playerId: p.id, value: 1 + Math.floor(rng() * 100) }));
      const maxValue = Math.max(...draws.map((d) => d.value));
      // draws preserves players' (earliest-joined-first) order, so the first max is the tie-break winner.
      startingPlayerId = draws.find((d) => d.value === maxValue)!.playerId;
      startingPlayerDraw = draws;
    }

    const gameState = gameModule.createInitialState(players, startingPlayerId);
    const next: RoomState = {
      ...state,
      phase: "in-game",
      currentGameState: gameState,
      turnDeadline: Date.now() + TURN_TIMEOUT_MS,
      startingPlayerDraw,
    };
    await this.rescheduleAlarm(next);
    await saveRoomState(this.ctx, next);
    this.broadcastPublicState(next);
    this.broadcastGameViews(next);
  }

  private async handleGameAction(ws: CfWebSocket, action: unknown) {
    const cs = connState(ws);
    if (!cs?.playerId) return;
    const state = await loadRoomState(this.ctx);
    if (!state || state.phase !== "in-game") {
      send(ws, { type: "error", code: "INVALID_STATE", message: "No game in progress." });
      return;
    }

    const { state: next, error } = await this.applyGameMove(state, cs.playerId, action);
    if (error) {
      send(ws, { type: "error", code: error, message: error });
      return;
    }
    await saveRoomState(this.ctx, next);
    this.broadcastPublicState(next);
    this.broadcastGameViews(next);
  }

  private async handleBackToLobby(ws: CfWebSocket) {
    const { state } = await this.requireHost(ws);
    if (!state) return;

    // Allowed after a round naturally ends, during the game-over intermission, and mid-game (so
    // the host can bail out of a game early, e.g. someone has to leave) — abandoning mid-game
    // intentionally records no score entry.
    if (state.phase !== "round-end" && state.phase !== "game-over" && state.phase !== "in-game") {
      send(ws, { type: "error", code: "INVALID_STATE", message: "No game to leave right now." });
      return;
    }
    const next: RoomState = { ...state, phase: "lobby", currentGameId: null, currentGameState: null, turnDeadline: null };
    await this.rescheduleAlarm(next);
    await saveRoomState(this.ctx, next);
    this.broadcastPublicState(next);
  }

  private async handleKickPlayer(ws: CfWebSocket, targetPlayerId: string) {
    const { state } = await this.requireHost(ws);
    if (!state) return;

    if (state.phase !== "lobby") {
      send(ws, { type: "error", code: "INVALID_STATE", message: "Can only remove players from the lobby." });
      return;
    }
    if (targetPlayerId === state.hostPlayerId) {
      send(ws, { type: "error", code: "CANNOT_KICK_HOST", message: "The host can't kick themselves." });
      return;
    }
    const { [targetPlayerId]: _removed, ...players } = state.players;
    let next: RoomState = { ...state, players };
    next = promoteHostIfNeeded(next);
    await saveRoomState(this.ctx, next);
    this.broadcastPublicState(next);

    // The removed player keeps their own stale connection/state until explicitly told and
    // disconnected — otherwise their client would just silently sit in a broken lobby view.
    for (const other of this.getSockets()) {
      if (connState(other)?.playerId === targetPlayerId) {
        send(other, { type: "kicked" });
        other.close();
      }
    }
  }

  private async handleTransferHost(ws: CfWebSocket, targetPlayerId: string) {
    const { state } = await this.requireHost(ws);
    if (!state) return;

    if (state.phase !== "lobby") {
      send(ws, { type: "error", code: "INVALID_STATE", message: "Can only hand off host from the lobby." });
      return;
    }
    if (!state.players[targetPlayerId]) {
      send(ws, { type: "error", code: "NOT_FOUND", message: "No such player." });
      return;
    }
    const next = withHost(state, targetPlayerId);
    await saveRoomState(this.ctx, next);
    this.broadcastPublicState(next);
  }

  private async handleChangeNickname(ws: CfWebSocket, nickname: string) {
    const cs = connState(ws);
    if (!cs?.playerId) return;
    const trimmed = nickname.trim().slice(0, 16);
    if (!trimmed) return;

    const state = await loadRoomState(this.ctx);
    if (!state || !state.players[cs.playerId]) return;
    const next = upsertPlayer(state, { ...state.players[cs.playerId], nickname: trimmed });
    await saveRoomState(this.ctx, next);
    this.broadcastPublicState(next);
  }

  private async handleShowResults(ws: CfWebSocket) {
    const cs = connState(ws);
    if (!cs?.playerId) return;
    const state = await loadRoomState(this.ctx);
    if (!state || !state.players[cs.playerId]) return;

    if (state.phase !== "game-over") return; // no-op if someone else already advanced it
    const next: RoomState = { ...state, phase: "round-end" };
    await saveRoomState(this.ctx, next);
    this.broadcastPublicState(next);
  }

  private async requireHost(ws: CfWebSocket): Promise<{ state: RoomState | null }> {
    const cs = connState(ws);
    if (!cs?.playerId) return { state: null };
    const state = await loadRoomState(this.ctx);
    if (!state || state.hostPlayerId !== cs.playerId) {
      send(ws, { type: "error", code: "NOT_HOST", message: "Only the host can do that." });
      return { state: null };
    }
    return { state };
  }
}
