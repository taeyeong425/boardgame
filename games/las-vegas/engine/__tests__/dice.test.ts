import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../../../shared/rng";
import { rollFace } from "../dice";

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
