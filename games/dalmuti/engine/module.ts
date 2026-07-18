import type { GameModule } from "../../../party/games/types";
import { getClientView, type DalmutiClientState } from "./clientView";
import { applyMove, autoMove, computeResult, createInitialState, getCurrentTurnPlayerId, isGameOver } from "./reducer";
import type { DalmutiMove, DalmutiState } from "./types";

export const dalmutiModule: GameModule<DalmutiState, DalmutiMove, DalmutiClientState> = {
  id: "dalmuti",
  displayName: "달무티",
  minPlayers: 4,
  maxPlayers: 6,
  createInitialState,
  applyMove,
  isGameOver,
  computeResult,
  getCurrentTurnPlayerId,
  getClientView,
  autoMove,
};
