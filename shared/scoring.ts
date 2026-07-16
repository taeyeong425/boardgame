import type { GameId, ScoreEntry } from "./types";

export interface Standing {
  rank: number;
  points: number;
}

/**
 * Converts a game's raw per-player scores into a cross-game-agnostic standings/points map.
 *
 * Uses standard competition ranking: tied players share the lowest rank in their group, and the
 * next distinct rank skips ahead by the number of tied players (1, 2, 2, 4 — not 1, 2, 2, 3).
 * Points = totalPlayers - rank + 1, so with 4 players: rank1=4pts, a two-way tie at rank2=3pts
 * each, and the remaining last player lands at rank4=1pt (rank 3 is never awarded).
 */
export function computeStandings(
  rawScores: Record<string, number>,
  sortOrder: "asc" | "desc",
  playerIds: string[]
): Record<string, Standing> {
  const n = playerIds.length;
  const sorted = [...playerIds].sort((a, b) => {
    const diff = rawScores[a] - rawScores[b];
    return sortOrder === "asc" ? diff : -diff;
  });

  const result: Record<string, Standing> = {};
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && rawScores[sorted[j + 1]] === rawScores[sorted[i]]) {
      j++;
    }
    const rank = i + 1;
    const points = n - rank + 1;
    for (let k = i; k <= j; k++) {
      result[sorted[k]] = { rank, points };
    }
    i = j + 1;
  }
  return result;
}

export function buildScoreEntry(
  gameId: GameId,
  rawScores: Record<string, number>,
  sortOrder: "asc" | "desc",
  playerIds: string[],
  summary?: string
): ScoreEntry {
  const standings = computeStandings(rawScores, sortOrder, playerIds);
  const ranks: Record<string, number> = {};
  const points: Record<string, number> = {};
  for (const id of playerIds) {
    ranks[id] = standings[id].rank;
    points[id] = standings[id].points;
  }
  return { gameId, playedAt: Date.now(), rawScores, sortOrder, ranks, points, summary };
}

export function computeTotals(scoreLedger: ScoreEntry[], playerIds: string[]): Record<string, number> {
  const totals: Record<string, number> = Object.fromEntries(playerIds.map((id) => [id, 0]));
  for (const entry of scoreLedger) {
    for (const id of playerIds) {
      totals[id] = (totals[id] ?? 0) + (entry.points[id] ?? 0);
    }
  }
  return totals;
}
