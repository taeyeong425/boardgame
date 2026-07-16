import { describe, expect, it } from "vitest";
import {
  applyMove,
  autoMove,
  computeResult,
  createInitialState,
  getCurrentTurnPlayerId,
  isGameOver,
} from "../reducer";
import type { PenguinPartyState } from "../types";

function player(id: string, nickname: string) {
  return { id, nickname, connectionId: null, connected: true, isHost: false, joinedAt: 0 };
}

describe("createInitialState", () => {
  it("deals a valid round for N players with the right total card count", () => {
    const players = [player("p0", "A"), player("p1", "B"), player("p2", "C")];
    const state = createInitialState(players);
    expect(state.phase).toBe("roundInProgress");
    expect(state.totalRounds).toBe(3);
    expect(state.round.roundNumber).toBe(1);
    const dealt = Object.values(state.round.hands).reduce((sum, h) => sum + h.length, 0);
    expect(dealt).toBe(36); // 3 players, no leftover
    expect(getCurrentTurnPlayerId(state)).not.toBeNull();
  });
});

describe("applyMove — error paths", () => {
  const players = [player("p0", "A"), player("p1", "B")];

  function baseState(): PenguinPartyState {
    return createInitialState(players);
  }

  it("rejects a move from a player who isn't the current turn", () => {
    const state = baseState();
    const notCurrent = state.round.turnOrder.find((id) => id !== getCurrentTurnPlayerId(state))!;
    const result = applyMove(state, notCurrent, { type: "placeCard", cardId: "whatever", position: { layer: 1, index: 0 } });
    expect(result).toEqual({ ok: false, error: "NOT_YOUR_TURN" });
  });

  it("rejects a card the player doesn't hold", () => {
    const state = baseState();
    const current = getCurrentTurnPlayerId(state)!;
    const result = applyMove(state, current, { type: "placeCard", cardId: "not-a-real-card", position: { layer: 1, index: 0 } });
    expect(result).toEqual({ ok: false, error: "CARD_NOT_IN_HAND" });
  });

  it("rejects an illegal position", () => {
    const state = baseState();
    const current = getCurrentTurnPlayerId(state)!;
    const card = state.round.hands[current][0];
    const result = applyMove(state, current, { type: "placeCard", cardId: card.id, position: { layer: 5, index: 99 } });
    expect(result).toEqual({ ok: false, error: "ILLEGAL_POSITION" });
  });

  it("rejects any move once the game is over", () => {
    const state: PenguinPartyState = { ...baseState(), phase: "gameOver" };
    const result = applyMove(state, "p0", { type: "placeCard", cardId: "x", position: { layer: 1, index: 0 } });
    expect(result).toEqual({ ok: false, error: "GAME_OVER" });
  });
});

describe("applyMove — elimination, last-card bonus, and round/game end (hand-built deterministic state)", () => {
  it("auto-eliminates a player with no legal move and ends the game on the final round", () => {
    // Layer 1 is full (width 2, both blue) with a layer-2 gap open above index 0 requiring blue.
    const state: PenguinPartyState = {
      players: [
        { id: "p0", nickname: "A", cumulativePenalty: 0 },
        { id: "p1", nickname: "B", cumulativePenalty: 0 },
      ],
      round: {
        roundNumber: 1,
        startingPlayerId: "p0",
        turnOrder: ["p0", "p1"],
        currentTurnIndex: 0,
        pyramid: {
          cells: {
            "1:0": { card: { id: "b0", color: "sky" }, position: { layer: 1, index: 0 }, placedBy: "p0", turnNumber: 0 },
            "1:1": { card: { id: "b1", color: "sky" }, position: { layer: 1, index: 1 }, placedBy: "p0", turnNumber: 0 },
          },
          layer1Range: { lo: 0, hi: 1 },
          layer1MaxWidth: 2, // full — no further layer-1 placements possible
        },
        hands: {
          p0: [{ id: "p0card", color: "sky" }], // legal: matches the layer-2 gap's required color
          p1: [{ id: "p1card", color: "yellow" }], // illegal everywhere — will be auto-eliminated
        },
        eliminated: {},
        emptiedHand: {},
        revealedExtraCard: null,
        turnLog: [],
        penaltyEvents: [],
      },
      roundHistory: [],
      totalRounds: 1, // this is the only/final round
      phase: "roundInProgress",
    };

    const result = applyMove(state, "p0", { type: "placeCard", cardId: "p0card", position: { layer: 2, index: 0 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.state.phase).toBe("gameOver");
    expect(isGameOver(result.state)).toBe(true);

    const p0 = result.state.players.find((p) => p.id === "p0")!;
    const p1 = result.state.players.find((p) => p.id === "p1")!;
    expect(p0.cumulativePenalty).toBe(0); // emptied hand, reward floored at 0 (had nothing to reduce)
    expect(p1.cumulativePenalty).toBe(1); // eliminated with exactly 1 card left in hand

    const { rawScores, sortOrder } = computeResult(result.state);
    expect(sortOrder).toBe("asc");
    expect(rawScores).toEqual({ p0: 0, p1: 1 });
  });

  it("floors the last-card reward at the player's current penalty rather than going negative", () => {
    const state: PenguinPartyState = {
      players: [
        { id: "p0", nickname: "A", cumulativePenalty: 1 }, // only 1 point banked
        { id: "p1", nickname: "B", cumulativePenalty: 0 },
      ],
      round: {
        roundNumber: 2,
        startingPlayerId: "p0",
        turnOrder: ["p0", "p1"],
        currentTurnIndex: 0,
        pyramid: { cells: {}, layer1Range: null, layer1MaxWidth: 8 },
        hands: { p0: [{ id: "last", color: "red" }], p1: [{ id: "still-has-one", color: "green" }] },
        eliminated: {},
        emptiedHand: {},
        revealedExtraCard: null,
        turnLog: [],
        penaltyEvents: [],
      },
      roundHistory: [],
      totalRounds: 2,
      phase: "roundInProgress",
    };

    const result = applyMove(state, "p0", { type: "placeCard", cardId: "last", position: { layer: 1, index: 0 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const p0 = result.state.players.find((p) => p.id === "p0")!;
    expect(p0.cumulativePenalty).toBe(0); // max(0, 1 - 2) = 0, not -1
  });

  it("redeals a fresh round (not the final one) starting with the next player after the previous starter", () => {
    const state: PenguinPartyState = {
      players: [
        { id: "p0", nickname: "A", cumulativePenalty: 0 },
        { id: "p1", nickname: "B", cumulativePenalty: 0 },
      ],
      round: {
        roundNumber: 1,
        startingPlayerId: "p0",
        turnOrder: ["p0", "p1"],
        currentTurnIndex: 1,
        pyramid: { cells: {}, layer1Range: { lo: 0, hi: 0 }, layer1MaxWidth: 7 },
        hands: { p0: [], p1: [{ id: "final", color: "purple" }] },
        eliminated: {},
        emptiedHand: { p0: true },
        revealedExtraCard: null,
        turnLog: [],
        penaltyEvents: [],
      },
      roundHistory: [],
      totalRounds: 2,
      phase: "roundInProgress",
    };

    const result = applyMove(state, "p1", { type: "placeCard", cardId: "final", position: { layer: 1, index: -1 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.state.phase).toBe("roundInProgress");
    expect(result.state.roundHistory).toHaveLength(1);
    expect(result.state.round.roundNumber).toBe(2);
    expect(result.state.round.startingPlayerId).toBe("p1"); // next after p0
    // fresh 2-player deal: 14 cards each, layer1MaxWidth back to 7
    expect(result.state.round.hands.p0).toHaveLength(14);
    expect(result.state.round.hands.p1).toHaveLength(14);
    expect(result.state.round.pyramid.layer1MaxWidth).toBe(7);
  });
});

describe("full randomized playthrough (autoMove every turn)", () => {
  it("always terminates and produces a valid result for 2-6 players", () => {
    for (let n = 2; n <= 6; n++) {
      const players = Array.from({ length: n }, (_, i) => player(`p${i}`, `Player${i}`));
      let state = createInitialState(players);
      let guard = 0;
      while (!isGameOver(state)) {
        guard++;
        if (guard > 5000) throw new Error(`playthrough for n=${n} did not terminate`);
        const current = getCurrentTurnPlayerId(state)!;
        const move = autoMove(state, current);
        const result = applyMove(state, current, move);
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error(result.error);
        state = result.state;
      }
      const { rawScores, sortOrder } = computeResult(state);
      expect(sortOrder).toBe("asc");
      for (const p of players) {
        expect(rawScores[p.id]).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
