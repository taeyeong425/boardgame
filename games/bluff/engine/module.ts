import type { GameModule } from "../../../party/games/types";
import { getClientView, type BluffClientState } from "./clientView";
import {
  applyMove,
  autoMove,
  computeResult,
  createInitialState,
  getCurrentTurnPlayerId,
  isGameOver,
} from "./reducer";
import type { BluffMove, BluffState } from "./types";

export const bluffModule: GameModule<BluffState, BluffMove, BluffClientState> = {
  id: "bluff",
  displayName: "블러프",
  minPlayers: 2,
  maxPlayers: 6,
  createInitialState,
  applyMove,
  isGameOver,
  computeResult,
  getCurrentTurnPlayerId,
  getClientView,
  autoMove,
};
