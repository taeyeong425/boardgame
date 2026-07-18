import type { PublicRoomState } from "../../shared/messages";
import type { Player, RoomState } from "../../shared/types";

/** How long a disconnected host has to reconnect before someone else is promoted in their place. */
export const HOST_REASSIGN_GRACE_MS = 8_000;

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
  };
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
  if (!next) return state; // nobody connected right now; leave as-is until someone reconnects
  return { ...withHost(state, next.id), hostDisconnectedAt: null };
}

export function upsertPlayer(state: RoomState, player: Player): RoomState {
  return { ...state, players: { ...state.players, [player.id]: player } };
}
