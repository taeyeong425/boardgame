import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../../../shared/rng";
import { buildFullDeck, dealRound } from "../deck";

describe("buildFullDeck", () => {
  it("has 36 cards with the correct theme distribution", () => {
    const deck = buildFullDeck();
    expect(deck).toHaveLength(36);
    const counts: Record<string, number> = {};
    for (const c of deck) counts[c.color] = (counts[c.color] ?? 0) + 1;
    expect(counts).toEqual({ fire: 7, tree: 7, desert: 7, grape: 7, ice: 8 });
  });
});

describe("dealRound", () => {
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

  it("deals evenly for 2 players using the full 36-card deck (no set-aside)", () => {
    const deal = dealRound(ids(2), mulberry32(5));
    expect(Object.values(deal.hands).map((h) => h.length)).toEqual([18, 18]);
    expect(deal.layer1MaxWidth).toBe(8);
    expect(deal.revealedExtraCard).toBeNull();
    const allIds = Object.values(deal.hands).flatMap((h) => h.map((c) => c.id));
    expect(new Set(allIds).size).toBe(36); // every card in the deck is dealt to someone
  });

  it("deals evenly for 3 players with no leftover", () => {
    const deal = dealRound(ids(3), mulberry32(1));
    expect(Object.values(deal.hands).map((h) => h.length)).toEqual([12, 12, 12]);
    expect(deal.revealedExtraCard).toBeNull();
    expect(deal.layer1MaxWidth).toBe(8);
  });

  it("deals evenly for 4 and 6 players with no leftover", () => {
    expect(Object.values(dealRound(ids(4), mulberry32(2)).hands).map((h) => h.length)).toEqual([9, 9, 9, 9]);
    expect(Object.values(dealRound(ids(6), mulberry32(3)).hands).map((h) => h.length)).toEqual([6, 6, 6, 6, 6, 6]);
  });

  it("reveals exactly one leftover card face-up for 5 players", () => {
    const deal = dealRound(ids(5), mulberry32(4));
    expect(Object.values(deal.hands).map((h) => h.length)).toEqual([7, 7, 7, 7, 7]);
    expect(deal.revealedExtraCard).not.toBeNull();
  });

  it("never deals the same card twice", () => {
    const deal = dealRound(ids(4), mulberry32(6));
    const allIds = Object.values(deal.hands).flatMap((h) => h.map((c) => c.id));
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(allIds).toHaveLength(36);
  });

  it("is deterministic given the same seed", () => {
    const a = dealRound(ids(4), mulberry32(42));
    const b = dealRound(ids(4), mulberry32(42));
    expect(a).toEqual(b);
  });

  it("rejects player counts outside 2-6", () => {
    expect(() => dealRound(ids(1), mulberry32(1))).toThrow();
    expect(() => dealRound(ids(7), mulberry32(1))).toThrow();
  });
});
