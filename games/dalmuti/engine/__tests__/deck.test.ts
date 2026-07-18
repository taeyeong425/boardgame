import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../../../shared/rng";
import { buildFullDeck, dealAll } from "../deck";

describe("buildFullDeck", () => {
  it("has exactly 80 unique cards with the confirmed composition", () => {
    const deck = buildFullDeck();
    expect(deck.length).toBe(80);
    expect(new Set(deck.map((c) => c.id)).size).toBe(80);
    expect(deck.filter((c) => c.kind === "joker").length).toBe(2);

    for (let value = 1; value <= 12; value++) {
      expect(deck.filter((c) => c.kind === "number" && c.value === value).length).toBe(value);
    }
  });
});

describe("dealAll", () => {
  it("splits evenly across 4 players (80 / 4 = 20 each)", () => {
    const hands = dealAll(["p0", "p1", "p2", "p3"], mulberry32(1));
    for (const id of ["p0", "p1", "p2", "p3"]) expect(hands[id].length).toBe(20);
    const allIds = Object.values(hands).flatMap((h) => h.map((c) => c.id));
    expect(new Set(allIds).size).toBe(80);
  });

  it("gives the worst-ranked players the extra cards when it doesn't divide evenly (80 / 6)", () => {
    const ranked = ["p0", "p1", "p2", "p3", "p4", "p5"]; // p0 best .. p5 worst
    const hands = dealAll(ranked, mulberry32(2));
    expect(hands.p0.length).toBe(13);
    expect(hands.p1.length).toBe(13);
    expect(hands.p2.length).toBe(13);
    expect(hands.p3.length).toBe(13);
    expect(hands.p4.length).toBe(14);
    expect(hands.p5.length).toBe(14);
  });

  it("is reproducible for a fixed seed", () => {
    const a = dealAll(["p0", "p1", "p2", "p3"], mulberry32(7));
    const b = dealAll(["p0", "p1", "p2", "p3"], mulberry32(7));
    expect(a.p0.map((c) => c.id)).toEqual(b.p0.map((c) => c.id));
  });
});
