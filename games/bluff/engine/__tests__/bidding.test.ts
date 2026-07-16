import { describe, expect, it } from "vitest";
import { isLegalBid, minimalLegalBid } from "../bidding";

describe("isLegalBid", () => {
  it("allows any opening bid when there is no current bid", () => {
    expect(isLegalBid(null, { count: 1, face: 1 })).toBe(true);
    expect(isLegalBid(null, { count: 12, face: "star" })).toBe(true);
  });

  it("rejects a non-positive count", () => {
    expect(isLegalBid(null, { count: 0, face: 1 })).toBe(false);
    expect(isLegalBid(null, { count: -1, face: 1 })).toBe(false);
  });

  it("number -> number: higher count allows any face", () => {
    expect(isLegalBid({ count: 6, face: 4 }, { count: 7, face: 1 })).toBe(true);
  });

  it("number -> number: same count requires a strictly higher face", () => {
    expect(isLegalBid({ count: 6, face: 4 }, { count: 6, face: 5 })).toBe(true);
    expect(isLegalBid({ count: 6, face: 4 }, { count: 6, face: 4 })).toBe(false);
    expect(isLegalBid({ count: 6, face: 4 }, { count: 6, face: 2 })).toBe(false);
  });

  it("number -> number: lower count is never legal", () => {
    expect(isLegalBid({ count: 6, face: 4 }, { count: 5, face: 5 })).toBe(false);
  });

  it("number -> star: minimum count is ceil(current / 2)", () => {
    expect(isLegalBid({ count: 3, face: 4 }, { count: 2, face: "star" })).toBe(true); // ceil(3/2)=2
    expect(isLegalBid({ count: 3, face: 4 }, { count: 1, face: "star" })).toBe(false);
    expect(isLegalBid({ count: 6, face: 4 }, { count: 3, face: "star" })).toBe(true); // ceil(6/2)=3
    expect(isLegalBid({ count: 6, face: 4 }, { count: 2, face: "star" })).toBe(false);
  });

  it("star -> number: minimum count is current * 2", () => {
    expect(isLegalBid({ count: 2, face: "star" }, { count: 4, face: 1 })).toBe(true);
    expect(isLegalBid({ count: 2, face: "star" }, { count: 3, face: 1 })).toBe(false);
  });

  it("star -> star: must strictly increase the count", () => {
    expect(isLegalBid({ count: 2, face: "star" }, { count: 3, face: "star" })).toBe(true);
    expect(isLegalBid({ count: 2, face: "star" }, { count: 2, face: "star" })).toBe(false);
  });
});

describe("minimalLegalBid", () => {
  it("is {count:1, face:1} when there is no current bid", () => {
    expect(minimalLegalBid(null)).toEqual({ count: 1, face: 1 });
  });

  it("bumps the face by one at the same count when not already at face 5", () => {
    expect(minimalLegalBid({ count: 5, face: 3 })).toEqual({ count: 5, face: 4 });
  });

  it("rolls over to count+1 face 1 once face 5 is reached", () => {
    expect(minimalLegalBid({ count: 5, face: 5 })).toEqual({ count: 6, face: 1 });
  });

  it("stays on star, incrementing count, when the current bid is already star", () => {
    expect(minimalLegalBid({ count: 5, face: "star" })).toEqual({ count: 6, face: "star" });
  });

  it("every minimal bid it produces is itself legal against the input", () => {
    const cases = [null, { count: 1, face: 1 as const }, { count: 5, face: 5 as const }, { count: 3, face: "star" as const }];
    for (const current of cases) {
      expect(isLegalBid(current, minimalLegalBid(current))).toBe(true);
    }
  });
});
