import type { GameModule } from "../../../party/games/types";
import { getClientView, type PenguinPartyClientState } from "./clientView";
import {
  applyMove,
  autoMove,
  computeResult,
  createInitialState,
  getCurrentTurnPlayerId,
  isGameOver,
} from "./reducer";
import type { PenguinPartyMove, PenguinPartyState } from "./types";

export const penguinPartyModule: GameModule<PenguinPartyState, PenguinPartyMove, PenguinPartyClientState> = {
  id: "penguin-party",
  displayName: "펭귄파티",
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
