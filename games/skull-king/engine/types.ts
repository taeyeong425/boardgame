export type PlayerId = string;
export type Suit = "red" | "yellow" | "blue" | "black";
export type TigressDeclaration = "pirate" | "escape";

export interface NumberCard {
  kind: "number";
  id: string;
  suit: Suit;
  value: number; // 1-13
}
export interface PirateCard {
  kind: "pirate";
  id: string;
}
export interface TigressCard {
  kind: "tigress";
  id: string;
}
export interface SkullKingCard {
  kind: "skullKing";
  id: string;
}
export interface MermaidCard {
  kind: "mermaid";
  id: string;
}
export interface EscapeCard {
  kind: "escape";
  id: string;
}

export type Card = NumberCard | PirateCard | TigressCard | SkullKingCard | MermaidCard | EscapeCard;

export interface TrickPlay {
  playerId: PlayerId;
  card: Card;
  /** Only set when card.kind === "tigress" — the declaration made at the moment it was played. */
  declaredAs?: TigressDeclaration;
}

export interface Trick {
  leaderId: PlayerId;
  plays: TrickPlay[];
  /** Set by the first numbered card played; null if no numbered card has been played yet. */
  ledSuit: Suit | null;
}

export interface CompletedTrick extends Trick {
  winnerId: PlayerId;
  /** Bonus awarded to the winner for this specific trick's captures, before bid-match gating. */
  bonusPoints: number;
}

export interface PlayerRoundState {
  hand: Card[];
  bid: number | null;
  tricksWon: number;
  bonusPoints: number;
}

export interface RoundState {
  roundNumber: number; // 1-10; also the number of cards dealt and tricks played this round
  turnOrder: PlayerId[]; // this round's seating order, rotated one seat per round
  phase: "bidding" | "playing";
  /** Index into turnOrder: whose bid is next (phase "bidding"), or whose card-play is next ("playing"). */
  turnIndex: number;
  players: Record<PlayerId, PlayerRoundState>;
  completedTricks: CompletedTrick[];
  /** Present once phase becomes "playing"; null while still bidding. */
  currentTrick: Trick | null;
}

export interface RoundScoreEntry {
  roundNumber: number;
  scores: Record<PlayerId, { bid: number; tricksWon: number; bonusPoints: number; roundPoints: number }>;
}

export interface TrickReveal {
  trick: CompletedTrick;
  /** Each player's bid and tricks-won-so-far at the moment this trick resolved — snapshotted here
   * because a round transition (triggered by this same trick, if it was the round's last) resets
   * both fields for the next round before the client ever sees the intermediate state. */
  standings: { playerId: PlayerId; bid: number; tricksWon: number }[];
}

export interface SkullKingState {
  players: { id: PlayerId; nickname: string }[];
  round: RoundState;
  totalRounds: 10;
  roundHistory: RoundScoreEntry[];
  cumulativeScores: Record<PlayerId, number>;
  phase: "playing" | "gameOver";
  /** Increments once per resolved trick across the whole game — lets clients detect "a new trick
   * just resolved" and show lastTrickReveal even across a round boundary. */
  trickSequence: number;
  lastTrickReveal: TrickReveal | null;
}

export type SkullKingMove =
  | { type: "bid"; value: number }
  | { type: "playCard"; cardId: string; declareTigressAs?: TigressDeclaration };
