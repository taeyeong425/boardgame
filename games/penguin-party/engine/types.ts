// The 5 illustrated card types from the physical deck (not literal "colors") — ice is the one
// with 8 copies, the other four have 7 each (36 total).
export type CardColor = "fire" | "tree" | "desert" | "grape" | "ice";

export interface Card {
  id: string;
  color: CardColor;
}

export type PlayerId = string;

export interface PyramidPosition {
  /** 1-indexed, 1 = bottom layer. */
  layer: number;
  /** Integer index within the layer; layer-1 indices can be negative as the row extends left. */
  index: number;
}

export type PositionKey = string; // `${layer}:${index}`

export interface PlacedCard {
  card: Card;
  position: PyramidPosition;
  placedBy: PlayerId;
  turnNumber: number;
}

export interface PyramidState {
  cells: Record<PositionKey, PlacedCard>;
  /** null until the first card of the round is placed. */
  layer1Range: { lo: number; hi: number } | null;
  /** 8 normally, 7 in the 2-player variant. */
  layer1MaxWidth: number;
}

export interface TurnLogEntry {
  playerId: PlayerId;
  card: Card;
  position: PyramidPosition;
  turnNumber: number;
}

export type PenaltyReason = "eliminated" | "emptiedHandReward";

export interface PenaltyEvent {
  playerId: PlayerId;
  /** Positive for an elimination penalty, negative for the empty-hand reward. */
  delta: number;
  reason: PenaltyReason;
}

export interface RoundState {
  roundNumber: number;
  startingPlayerId: PlayerId;
  turnOrder: PlayerId[];
  currentTurnIndex: number;
  pyramid: PyramidState;
  hands: Record<PlayerId, Card[]>;
  eliminated: Record<PlayerId, boolean>;
  emptiedHand: Record<PlayerId, boolean>;
  /** 5-player variant: the one leftover card, revealed publicly and unplayable. */
  revealedExtraCard: Card | null;
  turnLog: TurnLogEntry[];
  penaltyEvents: PenaltyEvent[];
}

export interface PlayerGameState {
  id: PlayerId;
  nickname: string;
  cumulativePenalty: number;
}

export interface RoundSummary {
  roundNumber: number;
  startingPlayerId: PlayerId;
  events: PenaltyEvent[];
  cumulativeAfter: Record<PlayerId, number>;
}

export type GamePhase = "roundInProgress" | "gameOver";

export interface PenguinPartyState {
  players: PlayerGameState[]; // stable order == turnOrder
  round: RoundState;
  roundHistory: RoundSummary[];
  totalRounds: number; // == number of players
  phase: GamePhase;
}

export type PenguinPartyMove = { type: "placeCard"; cardId: string; position: PyramidPosition };
