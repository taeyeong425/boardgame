import type { GameModule } from "../../../party/games/types";
import { getClientView, type LasVegasClientState } from "./clientView";
import {
  applyMove,
  autoMove,
  computeResult,
  createInitialState,
  getCurrentTurnPlayerId,
  isGameOver,
} from "./reducer";
import type { LasVegasMove, LasVegasState } from "./types";

export const lasVegasModule: GameModule<LasVegasState, LasVegasMove, LasVegasClientState> = {
  id: "las-vegas",
  displayName: "라스베가스",
  minPlayers: 2,
  maxPlayers: 5,
  createInitialState,
  applyMove,
  isGameOver,
  computeResult,
  getCurrentTurnPlayerId,
  getClientView,
  autoMove,
};
