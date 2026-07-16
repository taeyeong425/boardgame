import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../../../shared/rng";
import { neutralDiceForPlayer, rollFace } from "../dice";

describe("neutralDiceForPlayer", () => {
  it("gives 2 players 4 house dice each", () => {
    expect(neutralDiceForPlayer(2, false)).toBe(4);
    expect(neutralDiceForPlayer(2, true)).toBe(4);
  });

  it("gives 3 players 2 each, except the round's start player gets the 2 leftover (4 total)", () => {
    expect(neutralDiceForPlayer(3, false)).toBe(2);
    expect(neutralDiceForPlayer(3, true)).toBe(4);
  });

  it("gives 4 players 2 house dice each", () => {
    expect(neutralDiceForPlayer(4, false)).toBe(2);
    expect(neutralDiceForPlayer(4, true)).toBe(2);
  });

  it("gives 5 players no house dice (base game, no variant)", () => {
    expect(neutralDiceForPlayer(5, false)).toBe(0);
    expect(neutralDiceForPlayer(5, true)).toBe(0);
  });
});

describe("rollFace", () => {
  it("always returns a value 1-6", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 200; i++) {
      const face = rollFace(rng);
      expect(face).toBeGreaterThanOrEqual(1);
      expect(face).toBeLessThanOrEqual(6);
    }
  });
});
