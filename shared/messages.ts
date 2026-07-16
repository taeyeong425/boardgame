import type { GameId, RoomState } from "./types";

export type ClientMessage =
  | { type: "join"; playerId: string; nickname: string }
  | { type: "rejoin"; playerId: string }
  | { type: "leave" }
  | { type: "selectGame"; gameId: GameId } // host only
  | { type: "startGame" } // host only
  | { type: "gameAction"; action: unknown } // forwarded verbatim to the active GameModule.applyMove
  | { type: "backToLobby" } // host only, allowed from in-game, game-over, or round-end
  | { type: "kickPlayer"; playerId: string } // host only
  | { type: "transferHost"; playerId: string } // host only, lobby only
  | { type: "changeNickname"; nickname: string } // any player, about themselves, any phase
  | { type: "showResults" }; // any player, game-over -> round-end

/**
 * `roomState` carries everything except `currentGameState`, which is stripped server-side
 * before broadcast and instead delivered per-connection via `gameStateUpdated` using the
 * active GameModule's `getClientView` (if defined). This is what makes hidden-hand games like
 * Penguin Party safe to implement without leaking other players' cards through a shared broadcast.
 */
export type PublicRoomState = Omit<RoomState, "currentGameState">;

export type ServerEvent =
  | { type: "roomState"; state: PublicRoomState }
  | { type: "playerConnectionChanged"; playerId: string; connected: boolean }
  | { type: "gameStateUpdated"; state: unknown } // per-connection redacted game state, sent individually
  | { type: "error"; code: string; message: string };
