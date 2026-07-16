export type GameId = "penguin-party" | "skull-king" | "bluff" | "las-vegas";

export type RoomPhase = "lobby" | "in-game" | "round-end";

export interface Player {
  id: string;
  nickname: string;
  connectionId: string | null;
  connected: boolean;
  isHost: boolean;
  joinedAt: number;
}

export interface ScoreEntry {
  gameId: GameId;
  playedAt: number;
  /** Raw per-game score as reported by the game module (e.g. Penguin Party penalty total). Display only. */
  rawScores: Record<string, number>;
  sortOrder: "asc" | "desc";
  /** Standard competition ranking derived from rawScores (ties share the lowest rank). */
  ranks: Record<string, number>;
  /** points = playerCount - rank + 1. This is what accumulates into `totals`. */
  points: Record<string, number>;
  summary?: string;
}

export interface RoomState {
  code: string;
  createdAt: number;
  hostPlayerId: string;
  players: Record<string, Player>;
  phase: RoomPhase;
  currentGameId: GameId | null;
  currentGameState: unknown | null;
  /** epoch ms deadline for the current turn; clients render a local countdown from this. */
  turnDeadline: number | null;
  scoreLedger: ScoreEntry[];
  /** cumulative points per player across the whole game-night session, cached from scoreLedger. */
  totals: Record<string, number>;
}

export interface GameCatalogEntry {
  id: GameId;
  displayName: string;
  minPlayers: number;
  maxPlayers: number;
  /** false for games that only have a stub/placeholder right now. */
  implemented: boolean;
}
