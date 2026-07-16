import { describe, expect, it } from "vitest";
import { applyMove, autoMove, createInitialState, getCurrentTurnPlayerId, isGameOver } from "../reducer";
import { getClientView } from "../clientView";

function player(id: string, nickname: string) {
  return { id, nickname, connectionId: null, connected: true, isHost: false, joinedAt: 0 };
}

describe("getClientView", () => {
  it("hides opponents' bill values, exposing only a count, while a game is in progress", () => {
    const players = [player("p0", "A"), player("p1", "B")];
    let state = createInitialState(players, "p0");
    // Play until at least one bill has been awarded, so there's something to potentially leak.
    let guard = 0;
    while (state.roundHistory.length === 0) {
      guard++;
      if (guard > 5000) throw new Error("did not terminate");
      const current = getCurrentTurnPlayerId(state)!;
      const move = autoMove(state, current);
      const result = applyMove(state, current, move);
      if (!result.ok) throw new Error(result.error);
      state = result.state;
    }

    for (const viewer of players) {
      const view = getClientView(state, viewer.id);
      expect(view.finalReveal).toBeUndefined(); // game isn't over yet
      for (const opp of view.opponents) {
        expect(typeof opp.billCount).toBe("number");
        expect((opp as unknown as { bills?: unknown }).bills).toBeUndefined();
      }
      const other = players.find((p) => p.id !== viewer.id)!;
      const oppView = view.opponents.find((o) => o.playerId === other.id)!;
      expect(oppView.billCount).toBe(state.players.find((p) => p.id === other.id)!.bills.length);
    }
  });

  it("reveals everyone's actual bills once the game is over", () => {
    const players = [player("p0", "A"), player("p1", "B")];
    let state = createInitialState(players);
    let guard = 0;
    while (!isGameOver(state)) {
      guard++;
      if (guard > 5000) throw new Error("did not terminate");
      const current = getCurrentTurnPlayerId(state)!;
      const move = autoMove(state, current);
      const result = applyMove(state, current, move);
      if (!result.ok) throw new Error(result.error);
      state = result.state;
    }
    const view = getClientView(state, "p0");
    expect(view.finalReveal).toBeDefined();
    expect(view.finalReveal!.map((r) => r.playerId).sort()).toEqual(["p0", "p1"]);
    for (const entry of view.finalReveal!) {
      const real = state.players.find((p) => p.id === entry.playerId)!;
      expect(entry.bills).toEqual(real.bills);
    }
  });

  it("shows the casinos and pending roll identically to every viewer (public information)", () => {
    const players = [player("p0", "A"), player("p1", "B")];
    let state = createInitialState(players, "p0");
    const rolled = applyMove(state, "p0", { type: "roll" });
    if (!rolled.ok) throw new Error(rolled.error);
    state = rolled.state;

    const viewA = getClientView(state, "p0");
    const viewB = getClientView(state, "p1");
    expect(viewA.casinos).toEqual(viewB.casinos);
    expect(viewA.pendingRoll).toEqual(viewB.pendingRoll);
    expect(viewA.pendingRoll).not.toBeNull();
  });
});
