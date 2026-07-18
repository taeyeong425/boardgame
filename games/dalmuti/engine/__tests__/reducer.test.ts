import { describe, expect, it } from "vitest";
import { applyMove, autoMove, computeResult, getCurrentTurnPlayerId, isGameOver } from "../reducer";
import type { Card, DalmutiState } from "../types";

function n(value: number, id = `${value}-x`): Card {
  return { kind: "number", id, value };
}

/** A fully hand-built 4-player state (p0 달무티 .. p3 농노) so tribute/revolution/trick logic can
 * be checked against exact, known cards rather than a shuffled deal. */
function baseState(overrides: Partial<DalmutiState> = {}): DalmutiState {
  return {
    players: [
      { id: "p0", nickname: "A" },
      { id: "p1", nickname: "B" },
      { id: "p2", nickname: "C" },
      { id: "p3", nickname: "D" },
    ],
    phase: "tribute",
    hands: {
      p0: [n(1), n(2), n(11), n(12)],
      p1: [n(3), n(10)],
      p2: [n(4), n(9)],
      p3: [n(5), n(8)],
    },
    turnOrder: ["p0", "p1", "p2", "p3"],
    initialRanks: ["p0", "p1", "p2", "p3"],
    pendingRevolutionPlayerId: null,
    revolutionResult: "none",
    pendingTribute: { dalmutiReturned: false, primeMinisterReturned: false },
    turnIndex: 0,
    currentTrick: null,
    lastClearedTrick: null,
    finishOrder: [],
    ...overrides,
  };
}

describe("tribute — returnTribute", () => {
  it("달무티 gives back 2 cards to 농노, then 총리대신 gives back 1 to 소작농, then play begins", () => {
    const state = baseState();
    const r1 = applyMove(state, "p0", { type: "returnTribute", cardIds: ["11-x", "12-x"] });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    expect(r1.state.hands.p0.map((c) => c.id).sort()).toEqual(["1-x", "2-x"].sort());
    expect(r1.state.hands.p3.map((c) => c.id).sort()).toEqual(["11-x", "12-x", "5-x", "8-x"].sort());
    expect(r1.state.pendingTribute).toEqual({ dalmutiReturned: true, primeMinisterReturned: false });
    expect(r1.state.phase).toBe("tribute"); // 총리대신 hasn't returned yet
    expect(getCurrentTurnPlayerId(r1.state)).toBe("p1");

    const r2 = applyMove(r1.state, "p1", { type: "returnTribute", cardIds: ["10-x"] });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.state.hands.p1.map((c) => c.id)).toEqual(["3-x"]);
    expect(r2.state.hands.p2.map((c) => c.id).sort()).toEqual(["10-x", "4-x", "9-x"].sort());
    expect(r2.state.phase).toBe("playing");
    expect(r2.state.turnIndex).toBe(0);
    expect(getCurrentTurnPlayerId(r2.state)).toBe("p0");
  });

  it("rejects the wrong tribute count", () => {
    const state = baseState();
    expect(applyMove(state, "p0", { type: "returnTribute", cardIds: ["11-x"] })).toEqual({
      ok: false,
      error: "WRONG_TRIBUTE_COUNT",
    });
  });

  it("rejects a player who isn't currently owed a tribute return", () => {
    const state = baseState();
    expect(applyMove(state, "p2", { type: "returnTribute", cardIds: ["4-x"] })).toEqual({
      ok: false,
      error: "NOT_YOUR_TURN",
    });
  });

  it("rejects giving back a card not in hand", () => {
    const state = baseState();
    expect(applyMove(state, "p0", { type: "returnTribute", cardIds: ["11-x", "99-x"] })).toEqual({
      ok: false,
      error: "CARD_NOT_IN_HAND",
    });
  });
});

describe("revolution", () => {
  it("declining (reveal: false) applies the forced tribute and opens the give-back window", () => {
    const state = baseState({ pendingRevolutionPlayerId: "p3", revolutionResult: null, pendingTribute: null });
    const result = applyMove(state, "p3", { type: "declareRevolution", reveal: false });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // p3 (농노)'s 2 lowest (5, 8) -> p0 (달무티); p2 (소작농)'s 1 lowest (4) -> p1 (총리대신).
    expect(result.state.hands.p0.map((c) => c.id).sort()).toEqual(["1-x", "11-x", "12-x", "2-x", "5-x", "8-x"].sort());
    expect(result.state.hands.p3.map((c) => c.id)).toEqual([]);
    expect(result.state.hands.p1.map((c) => c.id).sort()).toEqual(["10-x", "3-x", "4-x"].sort());
    expect(result.state.hands.p2.map((c) => c.id)).toEqual(["9-x"]);
    expect(result.state.revolutionResult).toBe("none");
    expect(result.state.pendingTribute).toEqual({ dalmutiReturned: false, primeMinisterReturned: false });
    expect(getCurrentTurnPlayerId(result.state)).toBe("p0");
  });

  it("a non-농노 revealing triggers 혁명: ranks unchanged, tribute skipped entirely", () => {
    const state = baseState({ pendingRevolutionPlayerId: "p1", revolutionResult: null, pendingTribute: null });
    const result = applyMove(state, "p1", { type: "declareRevolution", reveal: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.turnOrder).toEqual(["p0", "p1", "p2", "p3"]);
    expect(result.state.revolutionResult).toBe("revolution");
    expect(result.state.pendingTribute).toBeNull();
    expect(result.state.phase).toBe("playing");
    expect(getCurrentTurnPlayerId(result.state)).toBe("p0");
  });

  it("농노 revealing triggers 대혁명: rank order reverses, tribute skipped", () => {
    const state = baseState({ pendingRevolutionPlayerId: "p3", revolutionResult: null, pendingTribute: null });
    const result = applyMove(state, "p3", { type: "declareRevolution", reveal: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.turnOrder).toEqual(["p3", "p2", "p1", "p0"]);
    expect(result.state.revolutionResult).toBe("grandRevolution");
    expect(result.state.phase).toBe("playing");
    expect(getCurrentTurnPlayerId(result.state)).toBe("p3");
  });

  it("rejects a revolution decision from anyone but the eligible player", () => {
    const state = baseState({ pendingRevolutionPlayerId: "p3", revolutionResult: null, pendingTribute: null });
    expect(applyMove(state, "p0", { type: "declareRevolution", reveal: false })).toEqual({
      ok: false,
      error: "NOT_YOUR_TURN",
    });
  });
});

describe("playing — leading, following, passing, trick clears", () => {
  // Each player gets a spare low card too, so a single lead/beat play doesn't immediately empty
  // their hand and skew the active-player count mid-test (see the dedicated "gone out" test below
  // for that scenario deliberately).
  function playingState(overrides: Partial<DalmutiState> = {}): DalmutiState {
    return baseState({
      phase: "playing",
      pendingTribute: null,
      hands: {
        p0: [n(9), n(1, "1-p0")],
        p1: [n(5), n(2, "2-p1")],
        p2: [n(6), n(3, "3-p2")],
        p3: [n(7), n(4, "4-p3")],
      },
      ...overrides,
    });
  }

  it("rejects playing out of turn", () => {
    const state = playingState();
    expect(applyMove(state, "p1", { type: "play", cardIds: ["5-x"] })).toEqual({ ok: false, error: "NOT_YOUR_TURN" });
  });

  it("rejects passing while leading (no active trick to pass on)", () => {
    const state = playingState();
    expect(applyMove(state, "p0", { type: "pass" })).toEqual({ ok: false, error: "CANNOT_PASS_WHEN_LEADING" });
  });

  it("rejects a follow-up play that doesn't beat the active trick", () => {
    const led = applyMove(playingState(), "p0", { type: "play", cardIds: ["9-x"] });
    if (!led.ok) throw new Error("setup failed");
    // p1 holds only a 5, which does beat 9 — swap in a worse card to test rejection instead.
    const state = { ...led.state, hands: { ...led.state.hands, p1: [n(9, "9-y")] } };
    expect(applyMove(state, "p1", { type: "play", cardIds: ["9-y"] })).toEqual({ ok: false, error: "ILLEGAL_PLAY" });
  });

  it("a full pass-around clears the trick and hands leadership back to the last real player", () => {
    let state = playingState();
    const lead = applyMove(state, "p0", { type: "play", cardIds: ["9-x"] });
    if (!lead.ok) throw new Error("setup failed");
    state = lead.state;
    expect(state.turnIndex).toBe(1);

    const beat = applyMove(state, "p1", { type: "play", cardIds: ["5-x"] });
    if (!beat.ok) throw new Error("setup failed");
    state = beat.state;
    expect(state.currentTrick).toEqual({ lastPlayerId: "p1", cards: [n(5)], passesInARow: 0 });
    expect(state.turnIndex).toBe(2);

    const pass1 = applyMove(state, "p2", { type: "pass" });
    if (!pass1.ok) throw new Error("setup failed");
    state = pass1.state;
    expect(state.currentTrick?.passesInARow).toBe(1);
    expect(state.turnIndex).toBe(3);

    const pass2 = applyMove(state, "p3", { type: "pass" });
    if (!pass2.ok) throw new Error("setup failed");
    state = pass2.state;
    expect(state.currentTrick?.passesInARow).toBe(2);
    expect(state.turnIndex).toBe(0);

    const pass3 = applyMove(state, "p0", { type: "pass" });
    if (!pass3.ok) throw new Error("setup failed");
    state = pass3.state;
    expect(state.currentTrick).toBeNull();
    expect(state.lastClearedTrick).toEqual({ lastPlayerId: "p1", cards: [n(5)] });
    expect(state.turnIndex).toBe(1); // p1 leads the next fresh trick
  });

  it("if the trick's last player has since gone out, leadership passes to the next active seat", () => {
    // p1 leads with their only card and goes out; p2 and p3 both pass around to clear the trick.
    let state = playingState({ hands: { p0: [n(9)], p1: [n(5)], p2: [n(6)], p3: [n(7)] }, turnIndex: 1 });
    const lead = applyMove(state, "p1", { type: "play", cardIds: ["5-x"] });
    if (!lead.ok) throw new Error("setup failed");
    state = lead.state;
    expect(state.finishOrder).toEqual(["p1"]);
    expect(state.turnIndex).toBe(2); // next active after p1's seat

    const pass1 = applyMove(state, "p2", { type: "pass" });
    if (!pass1.ok) throw new Error("setup failed");
    state = pass1.state;
    const pass2 = applyMove(state, "p3", { type: "pass" });
    if (!pass2.ok) throw new Error("setup failed");
    state = pass2.state;

    expect(state.currentTrick).toBeNull();
    expect(state.turnIndex).toBe(2); // p1 (index 1) is gone, so p2 (index 2) leads next
  });

  it("lets a joker substitute for a real rank to beat the active trick", () => {
    // p0 leads a pair of 9s; p1 answers with a pair — a real 8 plus a joker standing in for a
    // second 8 — which must be legal (effective rank 8, count 2, beats the led pair of 9s).
    let state = playingState({
      hands: {
        p0: [n(9, "9a"), n(9, "9b"), n(1, "1-p0")],
        p1: [n(8), { kind: "joker", id: "j1" }],
        p2: [n(6), n(3, "3-p2")],
        p3: [n(7), n(4, "4-p3")],
      },
    });
    const lead = applyMove(state, "p0", { type: "play", cardIds: ["9a", "9b"] });
    if (!lead.ok) throw new Error("setup failed");
    state = lead.state;
    const result = applyMove(state, "p1", { type: "play", cardIds: ["8-x", "j1"] });
    expect(result.ok).toBe(true);
  });

  it("going out reduces the active count and ends the game once only one player holds cards", () => {
    const state = playingState({
      finishOrder: ["p0", "p1"],
      turnIndex: 2,
      hands: { p0: [], p1: [], p2: [n(7)], p3: [n(3)] },
    });
    const result = applyMove(state, "p2", { type: "play", cardIds: ["7-x"] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe("gameOver");
    expect(result.state.finishOrder).toEqual(["p0", "p1", "p2", "p3"]);
    expect(isGameOver(result.state)).toBe(true);

    const { rawScores, sortOrder, summary } = computeResult(result.state);
    expect(rawScores).toEqual({ p0: 0, p1: 1, p2: 2, p3: 3 });
    expect(sortOrder).toBe("asc");
    expect(summary).toContain("A"); // p0's nickname
  });
});

describe("autoMove", () => {
  it("declines a pending revolution", () => {
    const state = baseState({ pendingRevolutionPlayerId: "p3", revolutionResult: null, pendingTribute: null });
    expect(autoMove(state, "p3")).toEqual({ type: "declareRevolution", reveal: false });
  });

  it("gives back the worst (highest-value) cards for a pending tribute return", () => {
    const state = baseState();
    expect(autoMove(state, "p0")).toEqual({ type: "returnTribute", cardIds: ["12-x", "11-x"] });
  });

  it("passes when following an active trick", () => {
    const state = baseState({
      phase: "playing",
      pendingTribute: null,
      currentTrick: { lastPlayerId: "p0", cards: [n(9)], passesInARow: 0 },
      hands: { p0: [], p1: [n(5)], p2: [n(6)], p3: [n(7)] },
      turnIndex: 1,
    });
    expect(autoMove(state, "p1")).toEqual({ type: "pass" });
  });

  it("plays the single lowest card when leading", () => {
    const state = baseState({
      phase: "playing",
      pendingTribute: null,
      currentTrick: null,
      hands: { p0: [n(9), n(2), n(11)], p1: [], p2: [], p3: [] },
      turnIndex: 0,
    });
    expect(autoMove(state, "p0")).toEqual({ type: "play", cardIds: ["2-x"] });
  });
});
