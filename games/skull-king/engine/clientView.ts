import type { Card, CompletedTrick, PlayerId, RoundScoreEntry, SkullKingState, Trick, TrickReveal } from "./types";

export interface OpponentHandStatus {
  playerId: PlayerId;
  nickname: string;
  handCount: number;
  tricksWon: number;
  bidSubmitted: boolean;
  /** Revealed once every player has bid this round (round.phase becomes "playing"). */
  bid: number | null;
}

export interface SkullKingClientState {
  roundNumber: number;
  totalRounds: number;
  phase: "playing" | "gameOver";
  roundPhase: "bidding" | "playing";
  turnOrder: PlayerId[];
  currentTurnPlayerId: PlayerId | null;
  players: { id: PlayerId; nickname: string }[];
  myHand: Card[];
  myBid: number | null;
  myTricksWon: number;
  opponents: OpponentHandStatus[];
  currentTrick: Trick | null;
  completedTricks: CompletedTrick[];
  roundHistory: RoundScoreEntry[];
  cumulativeScores: Record<PlayerId, number>;
  trickSequence: number;
  lastTrickReveal: TrickReveal | null;
}

export function getClientView(state: SkullKingState, forPlayerId: PlayerId): SkullKingClientState {
  const round = state.round;
  const self = round.players[forPlayerId];
  const bidsRevealed = round.phase === "playing";

  return {
    roundNumber: round.roundNumber,
    totalRounds: state.totalRounds,
    phase: state.phase,
    roundPhase: round.phase,
    turnOrder: round.turnOrder,
    currentTurnPlayerId: state.phase === "gameOver" ? null : round.turnOrder[round.turnIndex],
    players: state.players,
    myHand: self?.hand ?? [],
    myBid: self?.bid ?? null,
    myTricksWon: self?.tricksWon ?? 0,
    opponents: state.players
      .filter((p) => p.id !== forPlayerId)
      .map((p) => {
        const ps = round.players[p.id];
        return {
          playerId: p.id,
          nickname: p.nickname,
          handCount: ps.hand.length,
          tricksWon: ps.tricksWon,
          bidSubmitted: ps.bid !== null,
          bid: bidsRevealed ? ps.bid : null,
        };
      }),
    currentTrick: round.currentTrick,
    completedTricks: round.completedTricks,
    roundHistory: state.roundHistory,
    cumulativeScores: state.cumulativeScores,
    trickSequence: state.trickSequence,
    lastTrickReveal: state.lastTrickReveal,
  };
}
