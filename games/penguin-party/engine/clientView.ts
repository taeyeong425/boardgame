import type {
  Card,
  GamePhase,
  PenguinPartyState,
  PlayerId,
  PyramidState,
  RoundSummary,
  TurnLogEntry,
} from "./types";

export interface OpponentView {
  playerId: PlayerId;
  nickname: string;
  /** Face-down count only — never card identities. */
  cardCount: number;
  eliminated: boolean;
  emptiedHand: boolean;
  cumulativePenalty: number;
}

export interface PenguinPartyClientState {
  roundNumber: number;
  totalRounds: number;
  phase: GamePhase;
  pyramid: PyramidState; // fully public
  revealedExtraCard: Card | null; // fully public (5-player variant)
  turnOrder: PlayerId[];
  currentTurnPlayerId: PlayerId | null;
  startingPlayerId: PlayerId;
  /** Own hand — full card identities, always visible even if eliminated (you can see your own cards). */
  myHand: Card[];
  myEliminated: boolean;
  myEmptiedHand: boolean;
  opponents: OpponentView[];
  players: { id: PlayerId; nickname: string; cumulativePenalty: number }[];
  lastRoundSummary?: RoundSummary;
  roundHistory: RoundSummary[];
  turnLog: TurnLogEntry[]; // public: already-played cards only
}

export function getClientView(state: PenguinPartyState, forPlayerId: PlayerId): PenguinPartyClientState {
  const round = state.round;
  return {
    roundNumber: round.roundNumber,
    totalRounds: state.totalRounds,
    phase: state.phase,
    pyramid: round.pyramid,
    revealedExtraCard: round.revealedExtraCard,
    turnOrder: round.turnOrder,
    currentTurnPlayerId: state.phase === "gameOver" ? null : round.turnOrder[round.currentTurnIndex],
    startingPlayerId: round.startingPlayerId,
    myHand: round.hands[forPlayerId] ?? [],
    myEliminated: !!round.eliminated[forPlayerId],
    myEmptiedHand: !!round.emptiedHand[forPlayerId],
    opponents: round.turnOrder
      .filter((id) => id !== forPlayerId)
      .map((id) => {
        const player = state.players.find((p) => p.id === id)!;
        return {
          playerId: id,
          nickname: player.nickname,
          cardCount: (round.hands[id] ?? []).length,
          eliminated: !!round.eliminated[id],
          emptiedHand: !!round.emptiedHand[id],
          cumulativePenalty: player.cumulativePenalty,
        };
      }),
    players: state.players.map((p) => ({ id: p.id, nickname: p.nickname, cumulativePenalty: p.cumulativePenalty })),
    lastRoundSummary: state.roundHistory[state.roundHistory.length - 1],
    roundHistory: state.roundHistory,
    turnLog: round.turnLog,
  };
}
