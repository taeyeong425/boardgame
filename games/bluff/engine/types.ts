// Die faces: 1-5 plus a wild "star" (physically the 6-spot replaced with a star icon).
export type DieFace = 1 | 2 | 3 | 4 | 5 | "star";

export type PlayerId = string;

export interface Bid {
  count: number;
  face: DieFace;
}

export interface PlayerGameState {
  id: PlayerId;
  nickname: string;
  /** Both the betting resource and "HP" — hitting 0 eliminates the player. */
  diceCount: number;
  /** Round number this player was eliminated on; null while still in the game. */
  eliminatedAtRound: number | null;
}

export interface BidLogEntry {
  playerId: PlayerId;
  bid: Bid;
}

export interface RoundState {
  roundNumber: number;
  /** Hidden per player — only revealed (see RoundResult) once someone challenges. */
  rolls: Record<PlayerId, DieFace[]>;
  /** Fixed table seating order for the whole game; advanceTurn skips eliminated players within it. */
  turnOrder: PlayerId[];
  currentTurnIndex: number;
  currentBid: Bid | null;
  lastBidderId: PlayerId | null;
  bidLog: BidLogEntry[];
}

export interface RoundResult {
  roundNumber: number;
  challengerId: PlayerId;
  bidderId: PlayerId;
  bid: Bid;
  actualCount: number;
  outcome: "challengerLoses" | "bidderLoses" | "allButBidderLose";
  diceLost: Record<PlayerId, number>;
  /** Every player's roll at the moment of the challenge — public once revealed. */
  revealedRolls: Record<PlayerId, DieFace[]>;
}

export type GamePhase = "bidding" | "gameOver";

export interface BluffState {
  /** Fixed seat order for the whole game (never reordered), including eliminated players. */
  players: PlayerGameState[];
  round: RoundState;
  roundHistory: RoundResult[];
  phase: GamePhase;
  winnerId: PlayerId | null;
}

export type BluffMove = { type: "placeBid"; count: number; face: DieFace } | { type: "challenge" };
