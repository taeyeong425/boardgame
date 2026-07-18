import { describe, expect, it } from "vitest";
import type { ActiveTrick, Card } from "../types";
import { effectiveRank, isLegalPlay, nextActiveIndex, resolveNextLeaderIndex } from "../trick";

function n(value: number, id = `${value}-x`): Card {
  return { kind: "number", id, value };
}
function joker(id = "joker-x"): Card {
  return { kind: "joker", id };
}
function trick(cards: Card[], lastPlayerId = "p0", passesInARow = 0): ActiveTrick {
  return { lastPlayerId, cards, passesInARow };
}

describe("effectiveRank", () => {
  it("is the card's own value for a real number card", () => {
    expect(effectiveRank([n(5)])).toBe(5);
  });
  it("is 13 for a jokers-only group (no real card)", () => {
    expect(effectiveRank([joker()])).toBe(13);
    expect(effectiveRank([joker("j1"), joker("j2")])).toBe(13);
  });
  it("takes the real card's value when a joker pads a group", () => {
    expect(effectiveRank([n(5), joker()])).toBe(5);
  });
});

describe("isLegalPlay", () => {
  it("allows leading with any single card", () => {
    expect(isLegalPlay([n(9)], null)).toBe(true);
    expect(isLegalPlay([joker()], null)).toBe(true);
  });

  it("allows leading with a same-rank group of any size, jokers padding allowed", () => {
    expect(isLegalPlay([n(6, "a"), n(6, "b"), n(6, "c")], null)).toBe(true);
    expect(isLegalPlay([n(6, "a"), n(6, "b"), joker()], null)).toBe(true);
  });

  it("rejects leading with mismatched real ranks", () => {
    expect(isLegalPlay([n(6), n(7)], null)).toBe(false);
  });

  it("rejects an empty play", () => {
    expect(isLegalPlay([], null)).toBe(false);
  });

  it("requires the same count as the active trick", () => {
    const active = trick([n(9, "a"), n(9, "b")]);
    expect(isLegalPlay([n(4)], active)).toBe(false);
    expect(isLegalPlay([n(4, "a"), n(4, "b"), n(4, "c")], active)).toBe(false);
  });

  it("requires a strictly lower (better) rank than the active trick", () => {
    const active = trick([n(9, "a"), n(9, "b")]);
    expect(isLegalPlay([n(8, "a"), n(8, "b")], active)).toBe(true);
    expect(isLegalPlay([n(9, "a"), n(9, "b")], active)).toBe(false); // tie never beats
    expect(isLegalPlay([n(10, "a"), n(10, "b")], active)).toBe(false); // worse
  });

  it("lets a joker substitute for a real rank when beating an active trick", () => {
    const active = trick([n(9, "a"), n(9, "b")]);
    expect(isLegalPlay([n(8), joker()], active)).toBe(true); // effective rank 8 beats 9
  });

  it("a lone joker (rank 13) can never beat anything, including another lone joker", () => {
    const active = trick([joker("j1")]);
    expect(isLegalPlay([joker("j2")], active)).toBe(false);
    expect(isLegalPlay([n(12)], active)).toBe(true); // 12 beats 13
  });
});

describe("nextActiveIndex / resolveNextLeaderIndex", () => {
  const turnOrder = ["p0", "p1", "p2", "p3"];
  const allActive = () => true;

  it("advances to the next seat when everyone is active", () => {
    expect(nextActiveIndex(turnOrder, allActive, 0)).toBe(1);
    expect(nextActiveIndex(turnOrder, allActive, 3)).toBe(0); // wraps
  });

  it("skips seats that are no longer active", () => {
    const isActive = (id: string) => id !== "p1";
    expect(nextActiveIndex(turnOrder, isActive, 0)).toBe(2);
  });

  it("resolveNextLeaderIndex returns the last player's own seat if they're still active", () => {
    expect(resolveNextLeaderIndex(turnOrder, allActive, "p2")).toBe(2);
  });

  it("resolveNextLeaderIndex skips to the next active player if the last player has gone out", () => {
    const isActive = (id: string) => id !== "p2";
    expect(resolveNextLeaderIndex(turnOrder, isActive, "p2")).toBe(3);
  });
});
