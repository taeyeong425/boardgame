import type { PublicRoomState } from "../../shared/messages";
import type { Player, RoomState } from "../../shared/types";

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
    nextStartingPlayerId: null, // first game in a fresh room picks randomly (no prior winner yet)
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

/** If the current host is disconnected, promotes the earliest-joined still-connected player. */
export function promoteHostIfNeeded(state: RoomState): RoomState {
  const currentHost = state.players[state.hostPlayerId];
  if (currentHost?.connected) return state;
  const next = orderedPlayers(state).find((p) => p.connected);
  if (!next) return state; // nobody connected right now; leave as-is until someone reconnects
  return withHost(state, next.id);
}

export function upsertPlayer(state: RoomState, player: Player): RoomState {
  return { ...state, players: { ...state.players, [player.id]: player } };
}
