import type { GameModule } from "../../../party/games/types";
import { getClientView, type SkullKingClientState } from "./clientView";
import {
  applyMove,
  autoMove,
  computeResult,
  createInitialState,
  getCurrentTurnPlayerId,
  getNextStartingPlayerId,
  isGameOver,
} from "./reducer";
import type { SkullKingMove, SkullKingState } from "./types";

export const skullKingModule: GameModule<SkullKingState, SkullKingMove, SkullKingClientState> = {
  id: "skull-king",
  displayName: "스컬킹",
  minPlayers: 2,
  maxPlayers: 6,
  createInitialState,
  applyMove,
  isGameOver,
  computeResult,
  getCurrentTurnPlayerId,
  getClientView,
  autoMove,
  getNextStartingPlayerId,
};
