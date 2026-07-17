import { describe, expect, it } from "vitest";
import {
  applyMove,
  autoMove,
  computeResult,
  createInitialState,
  getCurrentTurnPlayerId,
  getNextStartingPlayerId,
  isGameOver,
} from "../reducer";
import type { Card, SkullKingState } from "../types";

function player(id: string, nickname: string) {
  return { id, nickname, connectionId: null, connected: true, isHost: false, joinedAt: 0 };
}

describe("createInitialState", () => {
  it("starts round 1 in the bidding phase, dealing 1 card per player", () => {
    const players = [player("p0", "A"), player("p1", "B"), player("p2", "C")];
    const state = createInitialState(players);
    expect(state.round.roundNumber).toBe(1);
    expect(state.round.phase).toBe("bidding");
    expect(state.round.turnOrder.length).toBe(3);
    for (const p of players) expect(state.round.players[p.id].hand.length).toBe(1);
  });

  it("honors a valid startingPlayerId hint as the round's leader (turnOrder[0])", () => {
    const players = [player("p0", "A"), player("p1", "B"), player("p2", "C")];
    const state = createInitialState(players, "p2");
    expect(state.round.turnOrder[0]).toBe("p2");
    expect(getCurrentTurnPlayerId(state)).toBe("p2");
  });

  it("falls back to a random valid leader when the hint is missing or invalid", () => {
    const players = [player("p0", "A"), player("p1", "B")];
    const state = createInitialState(players, "not-in-this-game");
    expect(["p0", "p1"]).toContain(state.round.turnOrder[0]);
  });
});

/** A fully hand-built 2-player, round-1 (1 card each) state so trick resolution and scoring can be
 * checked with exact, known cards rather than a shuffled deal. */
function twoPlayerRound1(hands: Record<string, Card>): SkullKingState {
  return {
    players: [
      { id: "p0", nickname: "A" },
      { id: "p1", nickname: "B" },
    ],
    round: {
      roundNumber: 1,
      turnOrder: ["p0", "p1"],
      phase: "bidding",
      turnIndex: 0,
      players: {
        p0: { hand: [hands.p0], bid: null, tricksWon: 0, bonusPoints: 0 },
        p1: { hand: [hands.p1], bid: null, tricksWon: 0, bonusPoints: 0 },
      },
      completedTricks: [],
      currentTrick: null,
    },
    totalRounds: 10,
    roundHistory: [],
    cumulativeScores: { p0: 0, p1: 0 },
    phase: "playing",
    trickSequence: 0,
    lastTrickReveal: null,
  };
}

describe("applyMove — bidding", () => {
  it("rejects a second bid from a player who already bid this round", () => {
    const state = twoPlayerRound1({ p0: { kind: "escape", id: "escape-1" }, p1: { kind: "escape", id: "escape-2" } });
    const r1 = applyMove(state, "p0", { type: "bid", value: 1 });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    expect(applyMove(r1.state, "p0", { type: "bid", value: 0 })).toEqual({ ok: false, error: "ALREADY_BID" });
  });

  it("rejects a bid outside 0..cardsInHand", () => {
    const state = twoPlayerRound1({ p0: { kind: "escape", id: "escape-1" }, p1: { kind: "escape", id: "escape-2" } });
    expect(applyMove(state, "p0", { type: "bid", value: 2 })).toEqual({ ok: false, error: "ILLEGAL_BID" });
  });

  it("lets any player bid out of turn order without revealing bids, then flips to playing once all bid", () => {
    const state = twoPlayerRound1({ p0: { kind: "escape", id: "escape-1" }, p1: { kind: "escape", id: "escape-2" } });
    // p1 bids first even though p0 leads turnOrder — simultaneous bidding, not turn-gated.
    const r1 = applyMove(state, "p1", { type: "bid", value: 1 });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    expect(r1.state.round.phase).toBe("bidding");
    expect(getCurrentTurnPlayerId(r1.state)).toBe("p0"); // only p0 left undecided

    const r2 = applyMove(r1.state, "p0", { type: "bid", value: 0 });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.state.round.phase).toBe("playing");
    expect(r2.state.round.currentTrick).toEqual({ leaderId: "p0", plays: [], ledSuit: null });
    expect(getCurrentTurnPlayerId(r2.state)).toBe("p0");
  });
});

function biddedState(p0Card: Card, p1Card: Card, p0Bid: number, p1Bid: number): SkullKingState {
  const state = twoPlayerRound1({ p0: p0Card, p1: p1Card });
  const r1 = applyMove(state, "p0", { type: "bid", value: p0Bid });
  if (!r1.ok) throw new Error(r1.error);
  const r2 = applyMove(r1.state, "p1", { type: "bid", value: p1Bid });
  if (!r2.ok) throw new Error(r2.error);
  return r2.state;
}

describe("applyMove — playCard", () => {
  it("rejects playing a card not in hand", () => {
    const state = biddedState({ kind: "escape", id: "escape-1" }, { kind: "escape", id: "escape-2" }, 0, 0);
    expect(applyMove(state, "p0", { type: "playCard", cardId: "nope" })).toEqual({ ok: false, error: "CARD_NOT_IN_HAND" });
  });

  it("requires a declaration when playing the Tigress", () => {
    const state = biddedState({ kind: "tigress", id: "tigress" }, { kind: "escape", id: "escape-2" }, 0, 0);
    expect(applyMove(state, "p0", { type: "playCard", cardId: "tigress" })).toEqual({
      ok: false,
      error: "TIGRESS_DECLARATION_REQUIRED",
    });
  });

  it("enforces follow-suit for numbered cards", () => {
    const state = twoPlayerRound1({ p0: { kind: "number", id: "green-1", suit: "green", value: 1 }, p1: { kind: "number", id: "yellow-2", suit: "yellow", value: 2 } });
    // give p1 a second card so the follow-suit check actually has a choice to reject
    state.round.players.p1.hand.push({ kind: "number", id: "green-9", suit: "green", value: 9 });
    const b1 = applyMove(state, "p0", { type: "bid", value: 1 });
    if (!b1.ok) throw new Error(b1.error);
    const b2 = applyMove(b1.state, "p1", { type: "bid", value: 1 });
    if (!b2.ok) throw new Error(b2.error);
    // p0 leads green-1, p1 has a green card (green-9) so playing yellow-2 must be rejected
    const lead = applyMove(b2.state, "p0", { type: "playCard", cardId: "green-1" });
    if (!lead.ok) throw new Error(lead.error);
    expect(applyMove(lead.state, "p1", { type: "playCard", cardId: "yellow-2" })).toEqual({
      ok: false,
      error: "MUST_FOLLOW_SUIT",
    });
  });

  it("resolves the trick, tallies the round, and starts round 2 led by the trick's winner", () => {
    const state = biddedState(
      { kind: "number", id: "green-9", suit: "green", value: 9 },
      { kind: "number", id: "green-3", suit: "green", value: 3 },
      1,
      0
    );
    const p0Plays = applyMove(state, "p0", { type: "playCard", cardId: "green-9" });
    expect(p0Plays.ok).toBe(true);
    if (!p0Plays.ok) return;
    const p1Plays = applyMove(p0Plays.state, "p1", { type: "playCard", cardId: "green-3" });
    expect(p1Plays.ok).toBe(true);
    if (!p1Plays.ok) return;

    // p0 bid 1 and won the only trick -> +20; p1 bid 0 and won 0 -> +10*1
    expect(p1Plays.state.roundHistory[0].scores.p0).toEqual({ bid: 1, tricksWon: 1, bonusPoints: 0, roundPoints: 20 });
    expect(p1Plays.state.roundHistory[0].scores.p1).toEqual({ bid: 0, tricksWon: 0, bonusPoints: 0, roundPoints: 10 });
    expect(p1Plays.state.cumulativeScores).toEqual({ p0: 20, p1: 10 });

    // p0 won the only trick, so p0 leads round 2 too (turn order unchanged, not rotated by seat)
    expect(p1Plays.state.round.roundNumber).toBe(2);
    expect(p1Plays.state.round.turnOrder).toEqual(["p0", "p1"]);
    expect(p1Plays.state.round.players.p0.hand.length).toBe(2);
    expect(isGameOver(p1Plays.state)).toBe(false);

    // the trick reveal survives the round transition even though round.players already reset
    expect(p1Plays.state.trickSequence).toBe(1);
    expect(p1Plays.state.lastTrickReveal?.trick.winnerId).toBe("p0");
    expect(p1Plays.state.lastTrickReveal?.standings).toEqual([
      { playerId: "p0", bid: 1, tricksWon: 1 },
      { playerId: "p1", bid: 0, tricksWon: 0 },
    ]);
  });

  it("with 3+ players, leads next round with the trick winner even when that's not seat+1", () => {
    const state: SkullKingState = {
      players: [
        { id: "p0", nickname: "A" },
        { id: "p1", nickname: "B" },
        { id: "p2", nickname: "C" },
      ],
      round: {
        roundNumber: 1,
        turnOrder: ["p0", "p1", "p2"],
        phase: "playing",
        turnIndex: 0,
        players: {
          p0: { hand: [{ kind: "number", id: "green-5", suit: "green", value: 5 }], bid: 0, tricksWon: 0, bonusPoints: 0 },
          p1: { hand: [{ kind: "number", id: "green-3", suit: "green", value: 3 }], bid: 0, tricksWon: 0, bonusPoints: 0 },
          p2: { hand: [{ kind: "number", id: "green-9", suit: "green", value: 9 }], bid: 0, tricksWon: 0, bonusPoints: 0 },
        },
        completedTricks: [],
        currentTrick: { leaderId: "p0", plays: [], ledSuit: null },
      },
      totalRounds: 10,
      roundHistory: [],
      cumulativeScores: { p0: 0, p1: 0, p2: 0 },
      phase: "playing",
      trickSequence: 0,
      lastTrickReveal: null,
    };

    const r1 = applyMove(state, "p0", { type: "playCard", cardId: "green-5" });
    if (!r1.ok) throw new Error(r1.error);
    const r2 = applyMove(r1.state, "p1", { type: "playCard", cardId: "green-3" });
    if (!r2.ok) throw new Error(r2.error);
    const r3 = applyMove(r2.state, "p2", { type: "playCard", cardId: "green-9" });
    if (!r3.ok) throw new Error(r3.error);

    // p2 (green-9) wins despite being the 3rd seat — round 2 starts with p2, not p1 (seat+1)
    expect(r3.state.round.roundNumber).toBe(2);
    expect(r3.state.round.turnOrder).toEqual(["p2", "p0", "p1"]);
  });

  it("increments trickSequence for every trick within a round, not just the last one", () => {
    const state = twoPlayerRound1({ p0: { kind: "number", id: "green-9", suit: "green", value: 9 }, p1: { kind: "number", id: "green-3", suit: "green", value: 3 } });
    state.round.roundNumber = 2;
    state.round.players.p0.hand.push({ kind: "number", id: "green-1", suit: "green", value: 1 });
    state.round.players.p1.hand.push({ kind: "number", id: "green-2", suit: "green", value: 2 });

    const b1 = applyMove(state, "p0", { type: "bid", value: 1 });
    if (!b1.ok) throw new Error(b1.error);
    const b2 = applyMove(b1.state, "p1", { type: "bid", value: 1 });
    if (!b2.ok) throw new Error(b2.error);

    const t1a = applyMove(b2.state, "p0", { type: "playCard", cardId: "green-9" });
    if (!t1a.ok) throw new Error(t1a.error);
    const t1b = applyMove(t1a.state, "p1", { type: "playCard", cardId: "green-3" });
    if (!t1b.ok) throw new Error(t1b.error);
    expect(t1b.state.trickSequence).toBe(1);
    expect(t1b.state.lastTrickReveal?.trick.winnerId).toBe("p0"); // green 9 beats green 3
    expect(t1b.state.round.roundNumber).toBe(2); // round still in progress, not yet transitioned

    const t2a = applyMove(t1b.state, "p0", { type: "playCard", cardId: "green-1" });
    if (!t2a.ok) throw new Error(t2a.error);
    const t2b = applyMove(t2a.state, "p1", { type: "playCard", cardId: "green-2" });
    if (!t2b.ok) throw new Error(t2b.error);
    expect(t2b.state.trickSequence).toBe(2);
    expect(t2b.state.lastTrickReveal?.trick.winnerId).toBe("p1"); // green 2 beats green 1
    expect(t2b.state.lastTrickReveal?.standings).toEqual([
      { playerId: "p0", bid: 1, tricksWon: 1 },
      { playerId: "p1", bid: 1, tricksWon: 1 },
    ]);
  });
});

describe("computeResult", () => {
  it("reports cumulative scores with descending sort order", () => {
    const state = biddedState(
      { kind: "number", id: "green-9", suit: "green", value: 9 },
      { kind: "number", id: "green-3", suit: "green", value: 3 },
      1,
      0
    );
    const p0Plays = applyMove(state, "p0", { type: "playCard", cardId: "green-9" });
    if (!p0Plays.ok) throw new Error(p0Plays.error);
    const p1Plays = applyMove(p0Plays.state, "p1", { type: "playCard", cardId: "green-3" });
    if (!p1Plays.ok) throw new Error(p1Plays.error);

    const { rawScores, sortOrder, summary } = computeResult({ ...p1Plays.state, phase: "gameOver" });
    expect(sortOrder).toBe("desc");
    expect(rawScores).toEqual({ p0: 20, p1: 10 });
    expect(summary).toContain("A");
  });
});

describe("getNextStartingPlayerId", () => {
  it("returns the winner of the most recent trick, even when that's not the score leader", () => {
    // p0 wins the only trick (green-9 beats green-3) but both bid 0, so p0's missed bid (-10)
    // actually scores worse than p1's correct zero-bid (+10) — score leader is p1, trick winner is p0.
    const state = biddedState(
      { kind: "number", id: "green-9", suit: "green", value: 9 },
      { kind: "number", id: "green-3", suit: "green", value: 3 },
      0,
      0
    );
    const p0Plays = applyMove(state, "p0", { type: "playCard", cardId: "green-9" });
    if (!p0Plays.ok) throw new Error(p0Plays.error);
    const p1Plays = applyMove(p0Plays.state, "p1", { type: "playCard", cardId: "green-3" });
    if (!p1Plays.ok) throw new Error(p1Plays.error);

    expect(p1Plays.state.cumulativeScores).toEqual({ p0: -10, p1: 10 });
    expect(p1Plays.state.lastTrickReveal?.trick.winnerId).toBe("p0");
    expect(getNextStartingPlayerId(p1Plays.state)).toBe("p0");
  });

  it("returns null before any trick has been played", () => {
    const state = twoPlayerRound1({ p0: { kind: "escape", id: "escape-1" }, p1: { kind: "escape", id: "escape-2" } });
    expect(getNextStartingPlayerId(state)).toBeNull();
  });
});

describe("autoMove", () => {
  it("bids zero during the bidding phase", () => {
    const state = twoPlayerRound1({ p0: { kind: "escape", id: "escape-1" }, p1: { kind: "escape", id: "escape-2" } });
    expect(autoMove(state, "p0")).toEqual({ type: "bid", value: 0 });
  });

  it("plays the first legal card, declaring a Tigress as escape", () => {
    const state = biddedState({ kind: "tigress", id: "tigress" }, { kind: "escape", id: "escape-2" }, 0, 0);
    expect(autoMove(state, "p0")).toEqual({ type: "playCard", cardId: "tigress", declareTigressAs: "escape" });
  });
});

describe("full randomized playthrough (autoMove every turn)", () => {
  it("always terminates after 10 rounds with valid totals for 2-6 players", () => {
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
      expect(state.roundHistory.length).toBe(10);
      const { rawScores, sortOrder } = computeResult(state);
      expect(sortOrder).toBe("desc");
      for (const p of players) expect(rawScores[p.id]).toBe(state.cumulativeScores[p.id]);
    }
  });
});
