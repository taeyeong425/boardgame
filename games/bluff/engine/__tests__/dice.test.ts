import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../../../shared/rng";
import { countMatching, rollAll, rollDice, startingDiceCount } from "../dice";

describe("startingDiceCount", () => {
  it("matches the official 30-dice split for 2-6 players", () => {
    expect(startingDiceCount(2)).toBe(15);
    expect(startingDiceCount(3)).toBe(10);
    expect(startingDiceCount(4)).toBe(7); // 28 of 30 dealt, 2 left unused
    expect(startingDiceCount(5)).toBe(6);
    expect(startingDiceCount(6)).toBe(5);
  });

  it("rejects player counts outside 2-6", () => {
    expect(() => startingDiceCount(1)).toThrow();
    expect(() => startingDiceCount(7)).toThrow();
  });
});

describe("rollDice", () => {
  it("rolls the requested number of dice, each a valid face", () => {
    const dice = rollDice(15, mulberry32(1));
    expect(dice).toHaveLength(15);
    for (const d of dice) expect([1, 2, 3, 4, 5, "star"]).toContain(d);
  });

  it("returns an empty roll for 0 dice", () => {
    expect(rollDice(0, mulberry32(1))).toEqual([]);
  });

  it("is deterministic given the same seed", () => {
    expect(rollDice(10, mulberry32(42))).toEqual(rollDice(10, mulberry32(42)));
  });
});

describe("countMatching", () => {
  it("counts a numbered face plus wild stars", () => {
    const rolls = { a: [1, 2, 3, "star"] as const, b: [3, 3, "star", 5] as const };
    // face 3: two 3's from a? no — a has one 3, one star; b has two 3's, one star => total 3s+stars = 1+1(a) + 2+1(b) = 5
    expect(countMatching(rolls as never, 3)).toBe(5);
  });

  it("counts only actual stars when betting on star directly (no wild-for-wild)", () => {
    const rolls = { a: [1, "star", "star"] as const, b: [3, 3, 5] as const };
    expect(countMatching(rolls as never, "star")).toBe(2);
  });

  it("returns 0 across empty hands", () => {
    expect(countMatching({ a: [], b: [] }, 1)).toBe(0);
  });
});

describe("rollAll", () => {
  it("rolls the exact requested count per player, including 0 for eliminated players", () => {
    const rolls = rollAll({ a: 3, b: 0, c: 5 }, mulberry32(1));
    expect(rolls.a).toHaveLength(3);
    expect(rolls.b).toHaveLength(0);
    expect(rolls.c).toHaveLength(5);
  });
});
