import type {
  Bill,
  CasinoState,
  GamePhase,
  LasVegasState,
  PendingRollFaceGroup,
  PlayerId,
  RoundResult,
} from "./types";

export interface OpponentDiceStatus {
  playerId: PlayerId;
  nickname: string;
  diceRemaining: number;
  /** Face-down pile height is visible in the physical game — the bill VALUES are not. */
  billCount: number;
}

export interface FinalRevealEntry {
  playerId: PlayerId;
  nickname: string;
  bills: Bill[];
  totalMoney: number;
}

export interface LasVegasClientState {
  roundNumber: number;
  totalRounds: number;
  phase: GamePhase;
  players: { id: PlayerId; nickname: string }[];
  casinos: CasinoState[]; // fully public — dice and bills on the table are visible to everyone
  turnOrder: PlayerId[];
  currentTurnPlayerId: PlayerId | null;
  pendingRoll: PendingRollFaceGroup[] | null; // public — everyone watches every roll happen
  myDiceRemaining: number;
  myBills: Bill[];
  myTotalMoney: number;
  opponents: OpponentDiceStatus[];
  roundHistory: RoundResult[];
  /** Only present once phase === "gameOver" — the final face-up reveal of everyone's money. */
  finalReveal?: FinalRevealEntry[];
}

export function getClientView(state: LasVegasState, forPlayerId: PlayerId): LasVegasClientState {
  const round = state.round;
  const self = state.players.find((p) => p.id === forPlayerId);

  return {
    roundNumber: round.roundNumber,
    totalRounds: state.totalRounds,
    phase: state.phase,
    players: state.players.map((p) => ({ id: p.id, nickname: p.nickname })),
    casinos: round.casinos,
    turnOrder: round.turnOrder,
    currentTurnPlayerId: state.phase === "gameOver" ? null : round.turnOrder[round.currentTurnIndex],
    pendingRoll: round.pendingRoll,
    myDiceRemaining: self?.diceRemaining ?? 0,
    myBills: self?.bills ?? [],
    myTotalMoney: (self?.bills ?? []).reduce((sum, b) => sum + b.value, 0),
    opponents: state.players
      .filter((p) => p.id !== forPlayerId)
      .map((p) => ({
        playerId: p.id,
        nickname: p.nickname,
        diceRemaining: p.diceRemaining,
        billCount: p.bills.length,
      })),
    roundHistory: state.roundHistory,
    finalReveal:
      state.phase === "gameOver"
        ? state.players.map((p) => ({
            playerId: p.id,
            nickname: p.nickname,
            bills: p.bills,
            totalMoney: p.bills.reduce((sum, b) => sum + b.value, 0),
          }))
        : undefined,
  };
}
