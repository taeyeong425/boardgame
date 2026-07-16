import { describe, expect, it } from "vitest";
import { mulberry32, shuffle } from "./rng";

describe("mulberry32", () => {
  it("is deterministic given the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect(Array.from({ length: 5 }, () => a())).toEqual(Array.from({ length: 5 }, () => b()));
  });

  it("returns values in [0, 1)", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("shuffle", () => {
  it("preserves all elements, just reordered (or possibly not, given randomness)", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle(arr, mulberry32(7));
    expect([...shuffled].sort((a, b) => a - b)).toEqual(arr);
  });

  it("does not mutate the input array", () => {
    const arr = [1, 2, 3];
    shuffle(arr, mulberry32(7));
    expect(arr).toEqual([1, 2, 3]);
  });
});
