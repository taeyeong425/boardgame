import type { PublicRoomState } from "../../shared/messages";
import type { Player, RoomState } from "../../shared/types";

/** How long a disconnected host has to reconnect before someone else is promoted in their place. */
export const HOST_REASSIGN_GRACE_MS = 8_000;

/** How long a room can sit with zero connected players before its Durable Object deletes it. */
export const EMPTY_ROOM_EXPIRY_MS = 60_000;

export function createRoomState(code: string, hostPlayer: Player): RoomState {
  return {
    code,
    createdAt: Date.now(),
    hostPlayerId: hostPlayer.id,
    players: { [hostPlayer.id]: hostPlayer },
    phase: "lobby",
    currentGameId: null,
    currentGameState: null,
    turnDeadline: null,
    scoreLedger: [],
    totals: {},
    nextStartingPlayerId: null, // first game in a fresh room draws for it (no prior winner yet)
    startingPlayerDraw: null,
    hostDisconnectedAt: null,
    emptyRoomSince: null,
  };
}

export function anyoneConnected(state: RoomState): boolean {
  return Object.values(state.players).some((p) => p.connected);
}

/**
 * Call after any connect/disconnect so `emptyRoomSince` always reflects the current roster:
 * set the moment the room goes from having someone connected to having nobody, cleared the
 * moment anyone reconnects.
 */
export function refreshEmptyRoomSince(state: RoomState): RoomState {
  if (anyoneConnected(state)) {
    return state.emptyRoomSince === null ? state : { ...state, emptyRoomSince: null };
  }
  return state.emptyRoomSince === null ? { ...state, emptyRoomSince: Date.now() } : state;
}

/** Strips the (possibly hidden-info-bearing) currentGameState before a room-wide broadcast. */
export function toPublicRoomState(state: RoomState): PublicRoomState {
  const { currentGameState: _currentGameState, ...rest } = state;
  return rest;
}

export function orderedPlayers(state: RoomState): Player[] {
  return Object.values(state.players).sort((a, b) => a.joinedAt - b.joinedAt);
}

export function withHost(state: RoomState, hostPlayerId: string): RoomState {
  const players = Object.fromEntries(
    Object.entries(state.players).map(([id, p]) => [id, { ...p, isHost: id === hostPlayerId }])
  );
  return { ...state, hostPlayerId, players };
}

/**
 * If the current host is disconnected and has been for at least HOST_REASSIGN_GRACE_MS, promotes
 * the earliest-joined still-connected player in their place. Within the grace window, this is a
 * no-op — reconnecting (e.g. after a page reload) restores their host status untouched, since
 * their own rejoin marks them connected again before this ever runs.
 */
export function promoteHostIfNeeded(state: RoomState): RoomState {
  const currentHost = state.players[state.hostPlayerId];
  if (currentHost?.connected) {
    return state.hostDisconnectedAt === null ? state : { ...state, hostDisconnectedAt: null };
  }
  if (state.hostDisconnectedAt !== null && Date.now() - state.hostDisconnectedAt < HOST_REASSIGN_GRACE_MS) {
    return state;
  }
  const next = orderedPlayers(state).find((p) => p.connected);
  if (!next) {
    // Nobody connected right now to hand host off to. Give up on this grace-period timer rather
    // than leaving hostDisconnectedAt pointing at an ever-more-stale past timestamp — otherwise
    // rescheduleAlarm keeps recomputing an already-elapsed deadline and the alarm re-fires
    // immediately forever. The next join/rejoin calls this again and re-evaluates from scratch.
    return state.hostDisconnectedAt === null ? state : { ...state, hostDisconnectedAt: null };
  }
  return { ...withHost(state, next.id), hostDisconnectedAt: null };
}

export function upsertPlayer(state: RoomState, player: Player): RoomState {
  return { ...state, players: { ...state.players, [player.id]: player } };
}
