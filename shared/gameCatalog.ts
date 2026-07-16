import type { GameCatalogEntry } from "./types";

/**
 * Static metadata for every game the platform knows about, implemented or not. Both the lobby's
 * GamePicker (client) and the room server's `selectGame` validation (server) read from this same
 * list, so player-count limits and "coming soon" state never drift between the two.
 */
export const GAME_CATALOG: GameCatalogEntry[] = [
  { id: "penguin-party", displayName: "펭귄파티", minPlayers: 2, maxPlayers: 6, implemented: true },
  { id: "skull-king", displayName: "스컬킹", minPlayers: 2, maxPlayers: 6, implemented: false },
  { id: "bluff", displayName: "블러프", minPlayers: 2, maxPlayers: 6, implemented: false },
  { id: "las-vegas", displayName: "라스베가스", minPlayers: 2, maxPlayers: 5, implemented: false },
];

export function getCatalogEntry(id: string): GameCatalogEntry | undefined {
  return GAME_CATALOG.find((g) => g.id === id);
}
