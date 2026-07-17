import { describe, expect, it } from "vitest";
import {
  applyMove,
  autoMove,
  computeResult,
  createInitialState,
  getCurrentTurnPlayerId,
  isGameOver,
} from "../reducer";
import type { LasVegasState } from "../types";

function player(id: string, nickname: string) {
  return { id, nickname, connectionId: null, connected: true, isHost: false, joinedAt: 0 };
}

describe("createInitialState", () => {
  it("gives every player 8 own dice and starts in the rolling phase", () => {
    const players = [player("p0", "A"), player("p1", "B")];
    const state = createInitialState(players);
    expect(state.phase).toBe("rolling");
    expect(state.totalRounds).toBe(1);
    expect(state.round.roundNumber).toBe(1);
    for (const p of state.players) expect(p.ownDiceRemaining).toBe(8);
    expect(getCurrentTurnPlayerId(state)).not.toBeNull();
  });

  it("enables the neutral-dice variant only for 2-4 players", () => {
    expect(createInitialState([player("a", "A"), player("b", "B")]).neutralDiceEnabled).toBe(true);
    expect(
      createInitialState([player("a", "A"), player("b", "B"), player("c", "C")]).neutralDiceEnabled
    ).toBe(true);
    expect(
      createInitialState(
        [player("a", "A"), player("b", "B"), player("c", "C"), player("d", "D")]
      ).neutralDiceEnabled
    ).toBe(true);
    expect(
      createInitialState(
        [player("a", "A"), player("b", "B"), player("c", "C"), player("d", "D"), player("e", "E")]
      ).neutralDiceEnabled
    ).toBe(false);
  });

  it("gives 2 players 4 house dice each; 5 players get none", () => {
    const two = createInitialState([player("a", "A"), player("b", "B")]);
    for (const p of two.players) expect(p.houseDiceRemaining).toBe(4);

    const five = createInitialState(
      [player("a", "A"), player("b", "B"), player("c", "C"), player("d", "D"), player("e", "E")]
    );
    for (const p of five.players) expect(p.houseDiceRemaining).toBe(0);
  });

  it("gives the round's start player the 3-player leftover dice (4 vs 2 for others)", () => {
    const players = [player("a", "A"), player("b", "B"), player("c", "C")];
    const state = createInitialState(players, "b");
    const starter = state.players.find((p) => p.id === "b")!;
    const others = state.players.filter((p) => p.id !== "b");
    expect(starter.houseDiceRemaining).toBe(4);
    for (const o of others) expect(o.houseDiceRemaining).toBe(2);
  });

  it("honors a valid startingPlayerId hint and falls back to random otherwise", () => {
    const players = [player("p0", "A"), player("p1", "B")];
    expect(getCurrentTurnPlayerId(createInitialState(players, "p1"))).toBe("p1");
    expect(["p0", "p1"]).toContain(getCurrentTurnPlayerId(createInitialState(players, "nope")));
  });
});

function baseTwoPlayerState(overrides: Partial<LasVegasState> = {}): LasVegasState {
  const state = createInitialState([player("p0", "A"), player("p1", "B")], "p0");
  return { ...state, ...overrides };
}

describe("applyMove — error paths", () => {
  it("rejects a move from a player who isn't the current turn", () => {
    const state = baseTwoPlayerState();
    const result = applyMove(state, "p1", { type: "roll" });
    expect(result).toEqual({ ok: false, error: "NOT_YOUR_TURN" });
  });

  it("rejects placing before rolling", () => {
    const state = baseTwoPlayerState();
    const result = applyMove(state, "p0", { type: "placeFace", face: 3 });
    expect(result).toEqual({ ok: false, error: "MUST_ROLL_FIRST" });
  });

  it("rejects rolling twice in the same turn", () => {
    const state = baseTwoPlayerState();
    const rolled = applyMove(state, "p0", { type: "roll" });
    expect(rolled.ok).toBe(true);
    if (!rolled.ok) return;
    const result = applyMove(rolled.state, "p0", { type: "roll" });
    expect(result).toEqual({ ok: false, error: "ALREADY_ROLLED" });
  });

  it("rejects placing a face that wasn't actually rolled", () => {
    const state = baseTwoPlayerState();
    const rolled = applyMove(state, "p0", { type: "roll" });
    expect(rolled.ok).toBe(true);
    if (!rolled.ok) return;
    const rolledFaces = new Set(rolled.state.round.pendingRoll!.map((g) => g.face));
    const missingFace = ([1, 2, 3, 4, 5, 6] as const).find((f) => !rolledFaces.has(f));
    if (missingFace === undefined) return; // extremely unlikely with 12 dice, but skip safely if so
    const result = applyMove(rolled.state, "p0", { type: "placeFace", face: missingFace });
    expect(result).toEqual({ ok: false, error: "FACE_NOT_ROLLED" });
  });

  it("rejects any move once the game is over", () => {
    const state = baseTwoPlayerState({ phase: "gameOver" });
    expect(applyMove(state, "p0", { type: "roll" })).toEqual({ ok: false, error: "GAME_OVER" });
  });
});

describe("applyMove — roll then placeFace", () => {
  it("moves rolled dice (own + house) onto the chosen casino and clears the pending roll", () => {
    const state = baseTwoPlayerState();
    const rolled = applyMove(state, "p0", { type: "roll" });
    expect(rolled.ok).toBe(true);
    if (!rolled.ok) return;
    expect(rolled.state.round.pendingRoll).not.toBeNull();

    const group = rolled.state.round.pendingRoll![0];
    const placed = applyMove(rolled.state, "p0", { type: "placeFace", face: group.face });
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;

    expect(placed.state.round.pendingRoll).toBeNull();
    const casino = placed.state.round.casinos.find((c) => c.number === group.face)!;
    expect(casino.diceCounts.p0).toBe(group.ownCount);
    if (group.houseCount > 0) expect(casino.diceCounts.house).toBe(group.houseCount);

    const p0 = placed.state.players.find((p) => p.id === "p0")!;
    expect(p0.ownDiceRemaining).toBe(8 - group.ownCount);
    expect(p0.houseDiceRemaining).toBe(4 - group.houseCount);

    // turn advances to the other player
    expect(getCurrentTurnPlayerId(placed.state)).toBe("p1");
  });
});

describe("full game (autoMove every turn)", () => {
  it("always terminates after exactly 1 round for 2-5 players, with a well-formed result", () => {
    for (let n = 2; n <= 5; n++) {
      const players = Array.from({ length: n }, (_, i) => player(`p${i}`, `Player${i}`));
      let state = createInitialState(players);
      let guard = 0;
      while (!isGameOver(state)) {
        guard++;
        if (guard > 5000) throw new Error(`game for n=${n} did not terminate`);
        const current = getCurrentTurnPlayerId(state)!;
        const move = autoMove(state, current);
        const result = applyMove(state, current, move);
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error(result.error);
        state = result.state;
      }
      expect(state.round.roundNumber).toBe(1);
      expect(state.roundHistory).toHaveLength(1);
      const { rawScores, sortOrder } = computeResult(state);
      expect(sortOrder).toBe("desc");
      for (const p of players) expect(rawScores[p.id]).toBeGreaterThanOrEqual(0);
    }
  });
});
