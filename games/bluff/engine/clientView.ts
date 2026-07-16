import type { Bid, BidLogEntry, BluffState, DieFace, GamePhase, PlayerId, RoundResult } from "./types";

export interface OpponentDiceView {
  playerId: PlayerId;
  nickname: string;
  diceCount: number;
  eliminated: boolean;
}

export interface BluffClientState {
  roundNumber: number;
  phase: GamePhase;
  currentBid: Bid | null;
  lastBidderId: PlayerId | null;
  bidLog: BidLogEntry[];
  turnOrder: PlayerId[];
  currentTurnPlayerId: PlayerId | null;
  myDice: DieFace[]; // full identities — own roll only
  myDiceCount: number;
  myEliminated: boolean;
  opponents: OpponentDiceView[]; // every other player, dice count only, never face values
  players: { id: PlayerId; nickname: string; diceCount: number; eliminated: boolean }[];
  lastRoundResult?: RoundResult; // includes revealedRolls — fully public once a challenge resolves
  roundHistory: RoundResult[];
  winnerId: PlayerId | null;
}

export function getClientView(state: BluffState, forPlayerId: PlayerId): BluffClientState {
  const round = state.round;
  const self = state.players.find((p) => p.id === forPlayerId);
  return {
    roundNumber: round.roundNumber,
    phase: state.phase,
    currentBid: round.currentBid,
    lastBidderId: round.lastBidderId,
    bidLog: round.bidLog,
    turnOrder: round.turnOrder,
    currentTurnPlayerId: state.phase === "gameOver" ? null : round.turnOrder[round.currentTurnIndex],
    myDice: round.rolls[forPlayerId] ?? [],
    myDiceCount: self?.diceCount ?? 0,
    myEliminated: (self?.diceCount ?? 0) === 0,
    opponents: round.turnOrder
      .filter((id) => id !== forPlayerId)
      .map((id) => {
        const p = state.players.find((pl) => pl.id === id)!;
        return { playerId: id, nickname: p.nickname, diceCount: p.diceCount, eliminated: p.diceCount === 0 };
      }),
    players: state.players.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      diceCount: p.diceCount,
      eliminated: p.diceCount === 0,
    })),
    lastRoundResult: state.roundHistory[state.roundHistory.length - 1],
    roundHistory: state.roundHistory,
    winnerId: state.winnerId,
  };
}
