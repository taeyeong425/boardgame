import { describe, expect, it } from "vitest";
import { getClientView } from "../clientView";
import type { SkullKingState } from "../types";

function baseState(overrides: Partial<SkullKingState> = {}): SkullKingState {
  const state: SkullKingState = {
    players: [
      { id: "p0", nickname: "A" },
      { id: "p1", nickname: "B" },
    ],
    round: {
      roundNumber: 1,
      turnOrder: ["p0", "p1"],
      phase: "bidding",
      turnIndex: 1,
      players: {
        p0: { hand: [{ kind: "escape", id: "escape-1" }], bid: 1, tricksWon: 0, bonusPoints: 0 },
        p1: { hand: [{ kind: "escape", id: "escape-2" }], bid: null, tricksWon: 0, bonusPoints: 0 },
      },
      completedTricks: [],
      currentTrick: null,
    },
    totalRounds: 10,
    roundHistory: [],
    cumulativeScores: { p0: 0, p1: 0 },
    phase: "playing",
  };
  return { ...state, ...overrides };
}

describe("getClientView", () => {
  it("reveals my own hand and bid, but hides an opponent's bid until everyone has bid", () => {
    const state = baseState();
    const forP1 = getClientView(state, "p1");
    expect(forP1.myHand).toEqual([{ kind: "escape", id: "escape-2" }]);
    expect(forP1.myBid).toBeNull();
    expect(forP1.opponents).toEqual([
      { playerId: "p0", nickname: "A", handCount: 1, tricksWon: 0, bidSubmitted: true, bid: null },
    ]);
  });

  it("reveals every bid once the round moves to the playing phase", () => {
    const state = baseState({
      round: {
        ...baseState().round,
        phase: "playing",
        players: {
          p0: { hand: [], bid: 1, tricksWon: 0, bonusPoints: 0 },
          p1: { hand: [], bid: 0, tricksWon: 0, bonusPoints: 0 },
        },
        currentTrick: { leaderId: "p0", plays: [], ledSuit: null },
      },
    });
    const forP1 = getClientView(state, "p1");
    expect(forP1.opponents[0].bid).toBe(1);
  });

  it("only exposes an opponent's hand count, never the actual cards", () => {
    const state = baseState();
    const forP0 = getClientView(state, "p0");
    expect(forP0.opponents[0]).not.toHaveProperty("hand");
    expect(forP0.opponents[0].handCount).toBe(1);
  });
});
