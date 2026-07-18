import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../../../shared/rng";
import { buildFullDeck, dealRound } from "../deck";

describe("buildFullDeck", () => {
  it("has exactly 66 unique cards with the confirmed composition", () => {
    const deck = buildFullDeck();
    expect(deck.length).toBe(66);
    expect(new Set(deck.map((c) => c.id)).size).toBe(66);

    const byKind = (kind: string) => deck.filter((c) => c.kind === kind).length;
    expect(byKind("number")).toBe(52); // 4 suits x 13
    expect(byKind("pirate")).toBe(5);
    expect(byKind("tigress")).toBe(1);
    expect(byKind("skullKing")).toBe(1);
    expect(byKind("mermaid")).toBe(2);
    expect(byKind("escape")).toBe(5);

    for (const suit of ["red", "yellow", "blue", "black"] as const) {
      const values = deck.filter((c) => c.kind === "number" && c.suit === suit).map((c) => (c as { value: number }).value);
      expect(values.sort((a, b) => a - b)).toEqual(Array.from({ length: 13 }, (_, i) => i + 1));
    }
  });
});

describe("dealRound", () => {
  it("deals the requested number of unique cards to each player, no overlap", () => {
    const hands = dealRound(["p0", "p1", "p2"], 10, mulberry32(42));
    for (const id of ["p0", "p1", "p2"]) expect(hands[id].length).toBe(10);
    const allIds = Object.values(hands).flatMap((h) => h.map((c) => c.id));
    expect(new Set(allIds).size).toBe(30);
  });

  it("is reproducible for a fixed seed", () => {
    const a = dealRound(["p0", "p1"], 5, mulberry32(7));
    const b = dealRound(["p0", "p1"], 5, mulberry32(7));
    expect(a.p0.map((c) => c.id)).toEqual(b.p0.map((c) => c.id));
  });
});
