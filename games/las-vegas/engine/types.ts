export type CasinoNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type PlayerId = string;

export interface Bill {
  value: number; // one of 10000..90000 in 10000 steps
}

export interface CasinoState {
  number: CasinoNumber;
  bills: Bill[];
  diceCounts: Partial<Record<PlayerId, number>>;
}

export interface PendingRollFaceGroup {
  face: CasinoNumber;
  count: number;
}

export interface PlayerGameState {
  id: PlayerId;
  nickname: string;
  /** Every bill won across the whole game — hidden from opponents until the game ends. */
  bills: Bill[];
  diceRemaining: number;
}

export interface CasinoPayout {
  casinoNumber: CasinoNumber;
  /** Players tied at the same dice count at this casino — eliminated, no payout. */
  eliminatedOwners: PlayerId[];
  /** In descending bill-value order, one bill per qualifying player. */
  awarded: { owner: PlayerId; bill: Bill }[];
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
  /** Single-round variant (house rule): the whole game is one dice-and-payout cycle instead of
   * the official game's 4 rounds. */
  totalRounds: 1;
  phase: GamePhase;
}

export type LasVegasMove = { type: "roll" } | { type: "placeFace"; face: CasinoNumber };
