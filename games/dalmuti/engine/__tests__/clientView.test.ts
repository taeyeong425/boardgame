import { describe, expect, it } from "vitest";
import { getClientView } from "../clientView";
import type { Card, DalmutiState } from "../types";

function n(value: number, id = `${value}-x`): Card {
  return { kind: "number", id, value };
}

function baseState(overrides: Partial<DalmutiState> = {}): DalmutiState {
  return {
    players: [
      { id: "p0", nickname: "A" },
      { id: "p1", nickname: "B" },
      { id: "p2", nickname: "C" },
      { id: "p3", nickname: "D" },
    ],
    phase: "playing",
    hands: {
      p0: [n(1), n(2)],
      p1: [n(3)],
      p2: [n(4), n(5), n(6)],
      p3: [],
    },
    turnOrder: ["p0", "p1", "p2", "p3"],
    initialRanks: ["p0", "p1", "p2", "p3"],
    pendingRevolutionPlayerId: null,
    revolutionResult: "none",
    pendingTribute: null,
    turnIndex: 2,
    currentTrick: null,
    lastClearedTrick: null,
    finishOrder: ["p3"],
    ...overrides,
  };
}

describe("getClientView", () => {
  it("exposes the requesting player's own hand in full", () => {
    const view = getClientView(baseState(), "p2");
    expect(view.myHand).toEqual([n(4), n(5), n(6)]);
  });

  it("redacts opponents to hand counts only, never actual cards", () => {
    const view = getClientView(baseState(), "p2");
    const p0 = view.opponents.find((o) => o.playerId === "p0")!;
    expect(p0.handCount).toBe(2);
    expect((p0 as unknown as { hand?: unknown }).hand).toBeUndefined();
  });

  it("assigns social rank titles by seat position", () => {
    const view = getClientView(baseState(), "p0");
    expect(view.mySocialRankTitle).toBe("달무티");
    expect(view.opponents.find((o) => o.playerId === "p3")!.socialRankTitle).toBe("농노");
  });

  it("marks a finished player and their 1-based finish rank", () => {
    const view = getClientView(baseState(), "p2");
    const p3 = view.opponents.find((o) => o.playerId === "p3")!;
    expect(p3.finished).toBe(true);
    expect(p3.finishRank).toBe(1);
  });

  it("resolves currentTurnPlayerId from turnIndex during the playing phase", () => {
    const view = getClientView(baseState(), "p0");
    expect(view.currentTurnPlayerId).toBe("p2");
  });

  it("resolves currentTurnPlayerId to the pending-revolution player, ignoring turnIndex", () => {
    const view = getClientView(
      baseState({ phase: "tribute", pendingRevolutionPlayerId: "p3", revolutionResult: null }),
      "p0"
    );
    expect(view.currentTurnPlayerId).toBe("p3");
  });

  it("resolves currentTurnPlayerId to whichever of 달무티/총리대신 still owes a tribute return", () => {
    const view = getClientView(
      baseState({ phase: "tribute", pendingTribute: { dalmutiReturned: true, primeMinisterReturned: false } }),
      "p0"
    );
    expect(view.currentTurnPlayerId).toBe("p1");
  });

  it("returns null currentTurnPlayerId once the game is over", () => {
    const view = getClientView(baseState({ phase: "gameOver" }), "p0");
    expect(view.currentTurnPlayerId).toBeNull();
  });
});
