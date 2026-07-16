import type * as Party from "partykit/server";
import { getCatalogEntry } from "../shared/gameCatalog";
import type { ClientMessage, ServerEvent } from "../shared/messages";
import { buildScoreEntry, computeTotals } from "../shared/scoring";
import type { GameId, Player, RoomState } from "../shared/types";
import { getGameModule } from "./games/registry";
import { loadRoomState, saveRoomState } from "./room/persistence";
import { createRoomState, orderedPlayers, promoteHostIfNeeded, toPublicRoomState, upsertPlayer } from "./room/RoomState";

const TURN_TIMEOUT_MS = 60_000;

interface ConnState {
  playerId: string | null;
  intent: "create" | "join";
}

function connState(connection: Party.Connection): ConnState | null {
  return connection.state as unknown as ConnState | null;
}

function send(connection: Party.Connection, event: ServerEvent) {
  connection.send(JSON.stringify(event));
}

function broadcastPublicState(room: Party.Room, state: RoomState) {
  const event: ServerEvent = { type: "roomState", state: toPublicRoomState(state) };
  room.broadcast(JSON.stringify(event));
}

/** Sends every connected player their own per-player redacted view of the active game state. */
function broadcastGameViews(room: Party.Room, state: RoomState) {
  if (!state.currentGameId || state.currentGameState === null) return;
  const gameModule = getGameModule(state.currentGameId);
  if (!gameModule) return;
  for (const connection of room.getConnections<ConnState>()) {
    const cs = connState(connection);
    if (!cs?.playerId) continue;
    const view = gameModule.getClientView
      ? gameModule.getClientView(state.currentGameState, cs.playerId)
      : state.currentGameState;
    send(connection, { type: "gameStateUpdated", state: view });
  }
}

async function scheduleTurnAlarm(room: Party.Room, deadline: number) {
  await room.storage.setAlarm(deadline);
}

async function clearTurnAlarm(room: Party.Room) {
  await room.storage.deleteAlarm();
}

/**
 * Applies a single game move (real or auto-played on timeout) and folds in every consequence:
 * turn-timer rescheduling, and — the moment the game ends — converting raw scores into
 * cross-game rank/points via shared/scoring and appending them to the room's score ledger.
 */
async function applyGameMove(
  room: Party.Room,
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
    next = {
      ...next,
      phase: "round-end",
      scoreLedger,
      totals: computeTotals(scoreLedger, playerIds),
      turnDeadline: null,
    };
    await clearTurnAlarm(room);
  } else {
    const deadline = Date.now() + TURN_TIMEOUT_MS;
    next = { ...next, turnDeadline: deadline };
    await scheduleTurnAlarm(room, deadline);
  }

  return { state: next };
}

export default class BoardgameRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const intent: ConnState["intent"] = url.searchParams.get("intent") === "create" ? "create" : "join";
    connection.setState({ playerId: null, intent });
  }

  async onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection) {
    if (typeof message !== "string") return;
    let parsed: ClientMessage;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }

    switch (parsed.type) {
      case "join":
        return this.handleJoin(sender, parsed.playerId, parsed.nickname);
      case "rejoin":
        return this.handleRejoin(sender, parsed.playerId);
      case "leave":
        return this.handleDisconnect(sender);
      case "selectGame":
        return this.handleSelectGame(sender, parsed.gameId);
      case "startGame":
        return this.handleStartGame(sender);
      case "gameAction":
        return this.handleGameAction(sender, parsed.action);
      case "backToLobby":
        return this.handleBackToLobby(sender);
      case "kickPlayer":
        return this.handleKickPlayer(sender, parsed.playerId);
    }
  }

  async onClose(connection: Party.Connection) {
    await this.handleDisconnect(connection);
  }

  async onAlarm() {
    const state = await loadRoomState(this.room);
    if (!state || state.phase !== "in-game" || !state.currentGameId || state.currentGameState === null) return;
    const gameModule = getGameModule(state.currentGameId);
    if (!gameModule) return;
    const currentPlayerId = gameModule.getCurrentTurnPlayerId(state.currentGameState);
    if (!currentPlayerId) return;

    const move = gameModule.autoMove(state.currentGameState, currentPlayerId);
    const { state: next } = await applyGameMove(this.room, state, currentPlayerId, move);
    await saveRoomState(this.room, next);
    broadcastPublicState(this.room, next);
    broadcastGameViews(this.room, next);
  }

  private async handleJoin(sender: Party.Connection, playerId: string, nickname: string) {
    const cs = connState(sender);
    let state = await loadRoomState(this.room);

    if (!state) {
      if (cs?.intent !== "create") {
        send(sender, { type: "error", code: "NOT_FOUND", message: "Room does not exist." });
        sender.close();
        return;
      }
      const hostPlayer: Player = {
        id: playerId,
        nickname,
        connectionId: sender.id,
        connected: true,
        isHost: true,
        joinedAt: Date.now(),
      };
      state = createRoomState(this.room.id, hostPlayer);
    } else {
      const existing = state.players[playerId];
      const player: Player = existing
        ? { ...existing, connectionId: sender.id, connected: true, nickname }
        : { id: playerId, nickname, connectionId: sender.id, connected: true, isHost: false, joinedAt: Date.now() };
      state = upsertPlayer(state, player);
      state = promoteHostIfNeeded(state);
    }

    sender.setState({ playerId, intent: cs?.intent ?? "join" });
    await saveRoomState(this.room, state);
    broadcastPublicState(this.room, state);
    broadcastGameViews(this.room, state);
  }

  private async handleRejoin(sender: Party.Connection, playerId: string) {
    const state = await loadRoomState(this.room);
    if (!state || !state.players[playerId]) {
      send(sender, { type: "error", code: "NOT_FOUND", message: "No such player in this room." });
      return;
    }
    let next = upsertPlayer(state, { ...state.players[playerId], connectionId: sender.id, connected: true });
    next = promoteHostIfNeeded(next);

    sender.setState({ playerId, intent: "join" });
    await saveRoomState(this.room, next);

    send(sender, { type: "roomState", state: toPublicRoomState(next) });
    if (next.currentGameId && next.currentGameState !== null) {
      const gameModule = getGameModule(next.currentGameId);
      const view = gameModule?.getClientView
        ? gameModule.getClientView(next.currentGameState, playerId)
        : next.currentGameState;
      send(sender, { type: "gameStateUpdated", state: view });
    }

    this.room.broadcast(
      JSON.stringify({ type: "playerConnectionChanged", playerId, connected: true } satisfies ServerEvent),
      [sender.id]
    );
  }

  private async handleDisconnect(connection: Party.Connection) {
    const cs = connState(connection);
    if (!cs?.playerId) return;
    const state = await loadRoomState(this.room);
    if (!state || !state.players[cs.playerId]) return;

    let next = upsertPlayer(state, { ...state.players[cs.playerId], connected: false, connectionId: null });
    next = promoteHostIfNeeded(next);
    await saveRoomState(this.room, next);

    this.room.broadcast(
      JSON.stringify({ type: "playerConnectionChanged", playerId: cs.playerId, connected: false } satisfies ServerEvent)
    );
    broadcastPublicState(this.room, next);
  }

  private async handleSelectGame(sender: Party.Connection, gameId: GameId) {
    const { state } = await this.requireHost(sender);
    if (!state) return;

    const catalogEntry = getCatalogEntry(gameId);
    if (!catalogEntry || !catalogEntry.implemented) {
      send(sender, { type: "error", code: "GAME_NOT_AVAILABLE", message: "This game isn't implemented yet." });
      return;
    }
    const next: RoomState = { ...state, currentGameId: gameId };
    await saveRoomState(this.room, next);
    broadcastPublicState(this.room, next);
  }

  private async handleStartGame(sender: Party.Connection) {
    const { state } = await this.requireHost(sender);
    if (!state) return;

    if (state.phase !== "lobby" || !state.currentGameId) {
      send(sender, { type: "error", code: "INVALID_STATE", message: "Pick a game before starting." });
      return;
    }
    const gameModule = getGameModule(state.currentGameId);
    const catalogEntry = getCatalogEntry(state.currentGameId);
    if (!gameModule || !catalogEntry) {
      send(sender, { type: "error", code: "GAME_NOT_AVAILABLE", message: "This game isn't implemented yet." });
      return;
    }
    const players = orderedPlayers(state);
    if (players.length < catalogEntry.minPlayers || players.length > catalogEntry.maxPlayers) {
      send(sender, {
        type: "error",
        code: "PLAYER_COUNT",
        message: `${catalogEntry.displayName} needs ${catalogEntry.minPlayers}-${catalogEntry.maxPlayers} players.`,
      });
      return;
    }

    const gameState = gameModule.createInitialState(players);
    const deadline = Date.now() + TURN_TIMEOUT_MS;
    const next: RoomState = { ...state, phase: "in-game", currentGameState: gameState, turnDeadline: deadline };
    await scheduleTurnAlarm(this.room, deadline);
    await saveRoomState(this.room, next);
    broadcastPublicState(this.room, next);
    broadcastGameViews(this.room, next);
  }

  private async handleGameAction(sender: Party.Connection, action: unknown) {
    const cs = connState(sender);
    if (!cs?.playerId) return;
    const state = await loadRoomState(this.room);
    if (!state || state.phase !== "in-game") {
      send(sender, { type: "error", code: "INVALID_STATE", message: "No game in progress." });
      return;
    }

    const { state: next, error } = await applyGameMove(this.room, state, cs.playerId, action);
    if (error) {
      send(sender, { type: "error", code: error, message: error });
      return;
    }
    await saveRoomState(this.room, next);
    broadcastPublicState(this.room, next);
    broadcastGameViews(this.room, next);
  }

  private async handleBackToLobby(sender: Party.Connection) {
    const { state } = await this.requireHost(sender);
    if (!state) return;

    if (state.phase !== "round-end") {
      send(sender, { type: "error", code: "INVALID_STATE", message: "The current round hasn't ended yet." });
      return;
    }
    const next: RoomState = { ...state, phase: "lobby", currentGameId: null, currentGameState: null, turnDeadline: null };
    await saveRoomState(this.room, next);
    broadcastPublicState(this.room, next);
  }

  private async handleKickPlayer(sender: Party.Connection, targetPlayerId: string) {
    const { state } = await this.requireHost(sender);
    if (!state) return;

    if (state.phase !== "lobby") {
      send(sender, { type: "error", code: "INVALID_STATE", message: "Can only remove players from the lobby." });
      return;
    }
    const { [targetPlayerId]: _removed, ...players } = state.players;
    let next: RoomState = { ...state, players };
    next = promoteHostIfNeeded(next);
    await saveRoomState(this.room, next);
    broadcastPublicState(this.room, next);
  }

  private async requireHost(sender: Party.Connection): Promise<{ state: RoomState | null }> {
    const cs = connState(sender);
    if (!cs?.playerId) return { state: null };
    const state = await loadRoomState(this.room);
    if (!state || state.hostPlayerId !== cs.playerId) {
      send(sender, { type: "error", code: "NOT_HOST", message: "Only the host can do that." });
      return { state: null };
    }
    return { state };
  }
}

BoardgameRoom satisfies Party.Worker;
