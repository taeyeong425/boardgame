import { describe, expect, it } from "vitest";
import { computeStandings, computeTotals } from "./scoring";
import type { ScoreEntry } from "./types";

describe("computeStandings", () => {
  it("assigns simple descending ranks with no ties (4 players, asc raw score)", () => {
    const raw = { a: 3, b: 10, c: 0, d: 7 };
    const ids = ["a", "b", "c", "d"];
    const standings = computeStandings(raw, "asc", ids);
    expect(standings.c).toEqual({ rank: 1, points: 4 });
    expect(standings.a).toEqual({ rank: 2, points: 3 });
    expect(standings.d).toEqual({ rank: 3, points: 2 });
    expect(standings.b).toEqual({ rank: 4, points: 1 });
  });

  it("shares rank for a tie and skips the next rank by the tie-group size", () => {
    // 1st solo, two tied for 2nd, one 4th (rank 3 never awarded)
    const raw = { a: 0, b: 5, c: 5, d: 9 };
    const ids = ["a", "b", "c", "d"];
    const standings = computeStandings(raw, "asc", ids);
    expect(standings.a).toEqual({ rank: 1, points: 4 });
    expect(standings.b).toEqual({ rank: 2, points: 3 });
    expect(standings.c).toEqual({ rank: 2, points: 3 });
    expect(standings.d).toEqual({ rank: 4, points: 1 });
  });

  it("handles desc sortOrder (higher raw score is better)", () => {
    const raw = { a: 10, b: 20 };
    const ids = ["a", "b"];
    const standings = computeStandings(raw, "desc", ids);
    expect(standings.b).toEqual({ rank: 1, points: 2 });
    expect(standings.a).toEqual({ rank: 2, points: 1 });
  });

  it("handles an all-tied group", () => {
    const raw = { a: 1, b: 1, c: 1 };
    const ids = ["a", "b", "c"];
    const standings = computeStandings(raw, "asc", ids);
    for (const id of ids) expect(standings[id]).toEqual({ rank: 1, points: 3 });
  });
});

describe("computeTotals", () => {
  it("sums points across multiple score entries", () => {
    const ids = ["a", "b"];
    const ledger: ScoreEntry[] = [
      {
        gameId: "penguin-party",
        playedAt: 1,
        rawScores: { a: 0, b: 5 },
        sortOrder: "asc",
        ranks: { a: 1, b: 2 },
        points: { a: 2, b: 1 },
      },
      {
        gameId: "penguin-party",
        playedAt: 2,
        rawScores: { a: 3, b: 3 },
        sortOrder: "asc",
        ranks: { a: 1, b: 1 },
        points: { a: 2, b: 2 },
      },
    ];
    expect(computeTotals(ledger, ids)).toEqual({ a: 4, b: 3 });
  });
});
