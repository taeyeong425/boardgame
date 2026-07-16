import { describe, expect, it } from "vitest";
import { computeRoundPoints } from "../scoring";

describe("computeRoundPoints", () => {
  it("matched bid >= 1 earns 20 per trick plus any bonus", () => {
    expect(computeRoundPoints(3, 3, 5, 0)).toBe(60);
    expect(computeRoundPoints(3, 3, 5, 30)).toBe(90);
  });

  it("missed bid >= 1 loses 10 per trick of difference, ignoring bonus", () => {
    expect(computeRoundPoints(3, 2, 5, 0)).toBe(-10);
    expect(computeRoundPoints(2, 5, 5, 999)).toBe(-30);
  });

  it("bid of zero, matched, earns 10 times the round number", () => {
    expect(computeRoundPoints(0, 0, 7, 0)).toBe(70);
  });

  it("bid of zero, missed, loses 10 times the round number", () => {
    expect(computeRoundPoints(0, 2, 9, 0)).toBe(-90);
  });
});
