export type CasinoNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type PlayerId = string;

/** The neutral "house" pseudo-player used in the 2-4 player variant — competes for majority at
 * every casino like a real player, but any winnings it "earns" are discarded, not paid out. */
export const HOUSE = "house" as const;
export type Owner = PlayerId | typeof HOUSE;

export interface Bill {
  value: number; // one of 10000..90000 in 10000 steps
}

export interface CasinoState {
  number: CasinoNumber;
  bills: Bill[];
  diceCounts: Partial<Record<Owner, number>>;
}

export interface PendingRollFaceGroup {
  face: CasinoNumber;
  ownCount: number;
  houseCount: number;
}

export interface PlayerGameState {
  id: PlayerId;
  nickname: string;
  /** Every bill won across the whole game — hidden from opponents until the game ends. */
  bills: Bill[];
  ownDiceRemaining: number;
  houseDiceRemaining: number;
}

export interface CasinoPayout {
  casinoNumber: CasinoNumber;
  /** Owners tied at the same dice count at this casino — eliminated, no payout. */
  eliminatedOwners: Owner[];
  /** In descending bill-value order, one bill per qualifying owner. */
  awarded: { owner: Owner; bill: Bill }[];
  /** Leftover bills nobody qualified for — returned to the bottom of the deck. */
  recycled: Bill[];
}

export interface RoundResult {
  roundNumber: number;
  payouts: CasinoPayout[];
}

export interface RoundState {
  roundNumber: number;
  casinos: CasinoState[]; // 6 entries
  turnOrder: PlayerId[]; // fixed seat order for the whole game
  currentTurnIndex: number;
  startPlayerId: PlayerId;
  /** null = the current player hasn't rolled yet this turn; once rolled, grouped by face until
   * they choose one to place. Rolls are fully public — everyone watches them happen. */
  pendingRoll: PendingRollFaceGroup[] | null;
}

export type GamePhase = "rolling" | "gameOver";

export interface LasVegasState {
  players: PlayerGameState[];
  billDeck: Bill[]; // face-down remaining pile, recycled leftovers go to the bottom
  round: RoundState;
  roundHistory: RoundResult[];
  totalRounds: 4;
  /** True for 2-4 players (the official variant); false for 5 (base game, no house dice). */
  neutralDiceEnabled: boolean;
  phase: GamePhase;
}

export type LasVegasMove = { type: "roll" } | { type: "placeFace"; face: CasinoNumber };
