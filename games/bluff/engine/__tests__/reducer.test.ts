import { describe, expect, it } from "vitest";
import {
  applyMove,
  autoMove,
  computeResult,
  createInitialState,
  getCurrentTurnPlayerId,
  isGameOver,
} from "../reducer";
import type { BluffState } from "../types";

function player(id: string, nickname: string) {
  return { id, nickname, connectionId: null, connected: true, isHost: false, joinedAt: 0 };
}

describe("createInitialState", () => {
  it("splits the 30 dice by player count and starts in the bidding phase", () => {
    const players = [player("p0", "A"), player("p1", "B"), player("p2", "C")];
    const state = createInitialState(players);
    expect(state.phase).toBe("bidding");
    expect(state.round.roundNumber).toBe(1);
    expect(state.players.map((p) => p.diceCount)).toEqual([10, 10, 10]); // 3 players -> 10 each
    expect(getCurrentTurnPlayerId(state)).not.toBeNull();
  });

  it("honors a valid startingPlayerId hint", () => {
    const players = [player("p0", "A"), player("p1", "B")];
    const state = createInitialState(players, "p1");
    expect(getCurrentTurnPlayerId(state)).toBe("p1");
  });

  it("falls back to a random valid starting player when the hint is missing or invalid", () => {
    const players = [player("p0", "A"), player("p1", "B")];
    const state = createInitialState(players, "not-in-this-game");
    expect(["p0", "p1"]).toContain(getCurrentTurnPlayerId(state));
  });
});

function baseTwoPlayerState(overrides: Partial<BluffState> = {}): BluffState {
  const state: BluffState = {
    players: [
      { id: "p0", nickname: "A", diceCount: 5, eliminatedAtRound: null },
      { id: "p1", nickname: "B", diceCount: 5, eliminatedAtRound: null },
    ],
    round: {
      roundNumber: 1,
      rolls: { p0: [1, 1, 1, 2, 2], p1: [1, "star", 2, 2, 2] },
      turnOrder: ["p0", "p1"],
      currentTurnIndex: 1, // p1's turn: either raise or challenge p0's bid
      currentBid: { count: 3, face: 1 },
      lastBidderId: "p0",
      bidLog: [{ playerId: "p0", bid: { count: 3, face: 1 } }],
    },
    roundHistory: [],
    phase: "bidding",
    winnerId: null,
  };
  return { ...state, ...overrides };
}

describe("applyMove — error paths", () => {
  it("rejects a move from a player who isn't the current turn", () => {
    const state = baseTwoPlayerState();
    const result = applyMove(state, "p0", { type: "challenge" });
    expect(result).toEqual({ ok: false, error: "NOT_YOUR_TURN" });
  });

  it("rejects an illegal bid (lower count)", () => {
    const state = baseTwoPlayerState();
    const result = applyMove(state, "p1", { type: "placeBid", count: 2, face: 5 });
    expect(result).toEqual({ ok: false, error: "ILLEGAL_BID" });
  });

  it("rejects challenging your own bid", () => {
    const state = baseTwoPlayerState({ round: { ...baseTwoPlayerState().round, currentTurnIndex: 0 } });
    // it's p0's turn but p0 is also the last bidder — shouldn't happen in practice (turn always
    // advances away from the bidder), but applyMove still guards it explicitly
    const result = applyMove(state, "p0", { type: "challenge" });
    expect(result).toEqual({ ok: false, error: "CANNOT_CHALLENGE_OWN_BID" });
  });

  it("rejects any move once the game is over", () => {
    const state = baseTwoPlayerState({ phase: "gameOver" });
    const result = applyMove(state, "p1", { type: "challenge" });
    expect(result).toEqual({ ok: false, error: "GAME_OVER" });
  });
});

describe("applyMove — placeBid", () => {
  it("accepts a legal raise and advances the turn", () => {
    const state = baseTwoPlayerState();
    const result = applyMove(state, "p1", { type: "placeBid", count: 4, face: 1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.round.currentBid).toEqual({ count: 4, face: 1 });
    expect(result.state.round.lastBidderId).toBe("p1");
    expect(getCurrentTurnPlayerId(result.state)).toBe("p0");
  });
});

describe("applyMove — challenge resolution", () => {
  it("challenger loses (actual > bid) exactly the difference", () => {
    // bid: "3 ones" — actual 1s+stars: p0 has three 1s (3), p1 has one 1 + one star (2) = 5 total
    const state = baseTwoPlayerState();
    const result = applyMove(state, "p1", { type: "challenge" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const last = result.state.roundHistory[0];
    expect(last.outcome).toBe("challengerLoses");
    expect(last.actualCount).toBe(5);
    expect(last.diceLost).toEqual({ p1: 2 }); // 5 - 3
    const p1 = result.state.players.find((p) => p.id === "p1")!;
    expect(p1.diceCount).toBe(3);
    // challenger survives and starts the next round
    expect(result.state.round.roundNumber).toBe(2);
    expect(getCurrentTurnPlayerId(result.state)).toBe("p1");
  });

  it("bidder loses (actual < bid) exactly the difference", () => {
    const state = baseTwoPlayerState({
      round: {
        ...baseTwoPlayerState().round,
        currentBid: { count: 6, face: 1 },
        rolls: { p0: [1, 1, 2, 2, 2], p1: [2, 2, 2, 2, 2] }, // only two 1s total, no stars
      },
    });
    const result = applyMove(state, "p1", { type: "challenge" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const last = result.state.roundHistory[0];
    expect(last.outcome).toBe("bidderLoses");
    expect(last.actualCount).toBe(2);
    expect(last.diceLost).toEqual({ p0: 4 }); // 6 - 2
    expect(result.state.players.find((p) => p.id === "p0")!.diceCount).toBe(1);
  });

  it("eliminates a player whose dice hit exactly 0, floored (never negative)", () => {
    const state = baseTwoPlayerState({
      players: [
        { id: "p0", nickname: "A", diceCount: 3, eliminatedAtRound: null },
        { id: "p1", nickname: "B", diceCount: 5, eliminatedAtRound: null },
      ],
      round: {
        ...baseTwoPlayerState().round,
        currentBid: { count: 5, face: 1 },
        rolls: { p0: [1, 1, 2], p1: [2, 2, 2, 2, 2] }, // two 1s total
      },
    });
    const result = applyMove(state, "p1", { type: "challenge" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // bidderLoses by (5-2)=3, p0 had exactly 3 -> hits 0, eliminated this round
    const p0 = result.state.players.find((p) => p.id === "p0")!;
    expect(p0.diceCount).toBe(0);
    expect(p0.eliminatedAtRound).toBe(1);
  });

  it("exact match: everyone but the challenger loses 1, already-eliminated players are untouched", () => {
    const threePlayerState: BluffState = {
      players: [
        { id: "p0", nickname: "A", diceCount: 5, eliminatedAtRound: null }, // bidder
        { id: "p1", nickname: "B", diceCount: 3, eliminatedAtRound: null }, // challenger
        { id: "p2", nickname: "C", diceCount: 0, eliminatedAtRound: 1 }, // already out
      ],
      round: {
        roundNumber: 2,
        rolls: { p0: [1, 1, 2, 2, 2], p1: [1, 1, 2], p2: [] },
        turnOrder: ["p0", "p1", "p2"],
        currentTurnIndex: 1,
        currentBid: { count: 4, face: 1 },
        lastBidderId: "p0",
        bidLog: [],
      },
      roundHistory: [],
      phase: "bidding",
      winnerId: null,
    };
    const result = applyMove(threePlayerState, "p1", { type: "challenge" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const last = result.state.roundHistory[0];
    expect(last.outcome).toBe("allButChallengerLose");
    expect(last.actualCount).toBe(4); // 1s+stars: p0 has two 1s, p1 has two 1s => 4
    expect(last.diceLost).toEqual({ p0: 1 }); // p2 excluded (already at 0), p1 (challenger) spared
    expect(result.state.players.find((p) => p.id === "p0")!.diceCount).toBe(4);
    expect(result.state.players.find((p) => p.id === "p1")!.diceCount).toBe(3); // challenger untouched
    expect(result.state.players.find((p) => p.id === "p2")!.diceCount).toBe(0);
  });

  it("ends the game when only one player has dice left, recording the winner", () => {
    const state = baseTwoPlayerState({
      players: [
        { id: "p0", nickname: "A", diceCount: 2, eliminatedAtRound: null },
        { id: "p1", nickname: "B", diceCount: 5, eliminatedAtRound: null },
      ],
      round: {
        ...baseTwoPlayerState().round,
        currentBid: { count: 5, face: 1 },
        rolls: { p0: [2, 2], p1: [1, 2, 2, 2, 2] }, // one 1 total, no stars
      },
    });
    const result = applyMove(state, "p1", { type: "challenge" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // bidderLoses by (5-1)=4, but p0 only has 2 -> floored to 0
    expect(result.state.phase).toBe("gameOver");
    expect(result.state.winnerId).toBe("p1");
    expect(isGameOver(result.state)).toBe(true);
  });

  it("starts the next round with the next active seat when the challenger was just eliminated", () => {
    const threePlayerState: BluffState = {
      players: [
        { id: "p0", nickname: "A", diceCount: 5, eliminatedAtRound: null }, // bidder
        { id: "p1", nickname: "B", diceCount: 1, eliminatedAtRound: null }, // challenger, about to be wiped
        { id: "p2", nickname: "C", diceCount: 4, eliminatedAtRound: null },
      ],
      round: {
        roundNumber: 1,
        rolls: { p0: [1, 1, 1, 1, 1], p1: [2], p2: [2, 2, 2, 2] }, // five 1s, bid was only 3
        turnOrder: ["p0", "p1", "p2"],
        currentTurnIndex: 1,
        currentBid: { count: 3, face: 1 },
        lastBidderId: "p0",
        bidLog: [],
      },
      roundHistory: [],
      phase: "bidding",
      winnerId: null,
    };
    const result = applyMove(threePlayerState, "p1", { type: "challenge" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // challengerLoses by (5-3)=2, but p1 only had 1 die -> eliminated
    expect(result.state.players.find((p) => p.id === "p1")!.diceCount).toBe(0);
    expect(result.state.round.roundNumber).toBe(2);
    expect(getCurrentTurnPlayerId(result.state)).toBe("p2"); // next active seat after eliminated p1
  });
});

describe("computeResult", () => {
  it("ranks the winner above everyone by elimination round (desc = higher is better)", () => {
    const state: BluffState = {
      players: [
        { id: "p0", nickname: "A", diceCount: 0, eliminatedAtRound: 1 },
        { id: "p1", nickname: "B", diceCount: 0, eliminatedAtRound: 3 },
        { id: "p2", nickname: "C", diceCount: 5, eliminatedAtRound: null }, // winner
      ],
      round: {
        roundNumber: 4,
        rolls: {},
        turnOrder: ["p0", "p1", "p2"],
        currentTurnIndex: 0,
        currentBid: null,
        lastBidderId: null,
        bidLog: [],
      },
      roundHistory: [],
      phase: "gameOver",
      winnerId: "p2",
    };
    const { rawScores, sortOrder, summary } = computeResult(state);
    expect(sortOrder).toBe("desc");
    expect(rawScores.p2).toBeGreaterThan(rawScores.p1);
    expect(rawScores.p1).toBeGreaterThan(rawScores.p0);
    expect(summary).toContain("C");
  });
});

describe("autoMove", () => {
  it("places the minimal opening bid when there is no current bid", () => {
    const state = baseTwoPlayerState({ round: { ...baseTwoPlayerState().round, currentBid: null, lastBidderId: null } });
    expect(autoMove(state, "p1")).toEqual({ type: "placeBid", count: 1, face: 1 });
  });

  it("challenges when there is already a bid on the table", () => {
    const state = baseTwoPlayerState();
    expect(autoMove(state, "p1")).toEqual({ type: "challenge" });
  });
});

describe("full randomized playthrough (autoMove every turn)", () => {
  it("always terminates and produces a valid single-winner result for 2-6 players", () => {
    for (let n = 2; n <= 6; n++) {
      const players = Array.from({ length: n }, (_, i) => player(`p${i}`, `Player${i}`));
      let state = createInitialState(players);
      let guard = 0;
      while (!isGameOver(state)) {
        guard++;
        if (guard > 20000) throw new Error(`playthrough for n=${n} did not terminate`);
        const current = getCurrentTurnPlayerId(state)!;
        const move = autoMove(state, current);
        const result = applyMove(state, current, move);
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error(result.error);
        state = result.state;
      }
      expect(state.winnerId).not.toBeNull();
      const activeCount = state.players.filter((p) => p.diceCount > 0).length;
      expect(activeCount).toBe(1);
      const { rawScores } = computeResult(state);
      const winnerScore = rawScores[state.winnerId!];
      for (const p of state.players) {
        if (p.id !== state.winnerId) expect(rawScores[p.id]).toBeLessThan(winnerScore);
      }
    }
  });
});
