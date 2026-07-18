export type PlayerId = string;

export interface NumberCard {
  kind: "number";
  id: string;
  value: number; // 1-12
}
export interface JokerCard {
  kind: "joker";
  id: string;
}
export type Card = NumberCard | JokerCard;

export type DalmutiPhase = "tribute" | "playing" | "gameOver";

export interface ActiveTrick {
  /** Whoever played these cards most recently (currently "winning" the trick). */
  lastPlayerId: PlayerId;
  cards: Card[];
  /** Consecutive passes since lastPlayerId's play; the trick clears once this reaches
   * (active player count - 1) — everyone else has passed. */
  passesInARow: number;
}

export interface ClearedTrick {
  lastPlayerId: PlayerId;
  cards: Card[];
}

export type RevolutionResult = "none" | "revolution" | "grandRevolution";

export interface PendingTribute {
  dalmutiReturned: boolean;
  primeMinisterReturned: boolean;
}

export interface DalmutiState {
  players: { id: PlayerId; nickname: string }[];
  phase: DalmutiPhase;
  hands: Record<PlayerId, Card[]>;
  /** Seating for this hand's trick rotation — starts as the initial rank draw, reversed in place
   * if a grand revolution (농노 revealing both jokers) is declared. */
  turnOrder: PlayerId[];
  /** The original blind-draw result (index 0 = best/달무티 .. last = worst/농노) — kept separate
   * from turnOrder so the reveal UI can show "you drew X" even after a revolution reverses play order. */
  initialRanks: PlayerId[];
  /** Whoever was dealt both jokers (at most one player) and may declare a revolution; null once
   * resolved (declared either way, or nobody was ever eligible). */
  pendingRevolutionPlayerId: PlayerId | null;
  /** null until resolved (declared, or auto-resolved to "none" when nobody was eligible). */
  revolutionResult: RevolutionResult | null;
  /** null once tribute is fully resolved (both returned, or skipped entirely by a revolution). */
  pendingTribute: PendingTribute | null;
  /** Index into turnOrder — meaningful only during phase "playing". */
  turnIndex: number;
  currentTrick: ActiveTrick | null; // null = about to lead a fresh trick
  lastClearedTrick: ClearedTrick | null;
  finishOrder: PlayerId[];
}

export type DalmutiMove =
  | { type: "declareRevolution"; reveal: boolean }
  | { type: "returnTribute"; cardIds: string[] }
  | { type: "play"; cardIds: string[] }
  | { type: "pass" };
