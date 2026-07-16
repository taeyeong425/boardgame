import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../../../shared/rng";
import { buildFullBillDeck, refillCasinos, shuffleBillDeck } from "../billDeck";
import type { CasinoState } from "../types";

describe("buildFullBillDeck", () => {
  it("has 54 bills with the official denomination distribution", () => {
    const deck = buildFullBillDeck();
    expect(deck).toHaveLength(54);
    const counts: Record<number, number> = {};
    for (const b of deck) counts[b.value] = (counts[b.value] ?? 0) + 1;
    expect(counts).toEqual({
      10000: 6,
      20000: 8,
      30000: 8,
      40000: 6,
      50000: 6,
      60000: 5,
      70000: 5,
      80000: 5,
      90000: 5,
    });
  });
});

describe("shuffleBillDeck", () => {
  it("is deterministic given the same seed and preserves all 54 bills", () => {
    const a = shuffleBillDeck(mulberry32(1));
    const b = shuffleBillDeck(mulberry32(1));
    expect(a).toEqual(b);
    expect(a).toHaveLength(54);
  });
});

function emptyCasinos(): CasinoState[] {
  return [1, 2, 3, 4, 5, 6].map((n) => ({ number: n as 1 | 2 | 3 | 4 | 5 | 6, bills: [], diceCounts: {} }));
}

describe("refillCasinos", () => {
  it("fills every casino to at least $50,000", () => {
    const deck = shuffleBillDeck(mulberry32(7));
    const { casinos } = refillCasinos(emptyCasinos(), deck);
    expect(casinos).toHaveLength(6);
    for (const c of casinos) {
      const total = c.bills.reduce((sum, b) => sum + b.value, 0);
      expect(total).toBeGreaterThanOrEqual(50000);
    }
  });

  it("consumes exactly the dealt bills from the deck (no duplication, no loss)", () => {
    const deck = shuffleBillDeck(mulberry32(7));
    const { casinos, deck: remaining } = refillCasinos(emptyCasinos(), deck);
    const dealtCount = casinos.reduce((sum, c) => sum + c.bills.length, 0);
    expect(remaining).toHaveLength(deck.length - dealtCount);
  });

  it("resets dice counts when refilling (casinos assumed empty going in)", () => {
    const deck = shuffleBillDeck(mulberry32(1));
    const dirty = emptyCasinos();
    dirty[0].diceCounts = { somePlayer: 3 };
    const { casinos } = refillCasinos(dirty, deck);
    expect(casinos[0].diceCounts).toEqual({});
  });
});
