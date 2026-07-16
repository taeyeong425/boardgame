import { describe, expect, it } from "vitest";
import { getClientView } from "../clientView";
import { createInitialState } from "../reducer";

function player(id: string, nickname: string) {
  return { id, nickname, connectionId: null, connected: true, isHost: false, joinedAt: 0 };
}

describe("getClientView", () => {
  it("never leaks another player's actual dice faces, only their count", () => {
    const players = [player("p0", "A"), player("p1", "B"), player("p2", "C")];
    const state = createInitialState(players);

    for (const viewer of players) {
      const view = getClientView(state, viewer.id);
      expect(view.myDice).toEqual(state.round.rolls[viewer.id]);
      expect(view.myDiceCount).toBe(view.myDice.length);

      for (const opp of view.opponents) {
        expect(opp.playerId).not.toBe(viewer.id);
        expect(typeof opp.diceCount).toBe("number");
        expect((opp as unknown as { dice?: unknown }).dice).toBeUndefined();
      }
      // opponent dice counts must match the real hidden rolls' lengths, without exposing the rolls
      for (const other of players) {
        if (other.id === viewer.id) continue;
        const opp = view.opponents.find((o) => o.playerId === other.id)!;
        expect(opp.diceCount).toBe(state.round.rolls[other.id].length);
      }
    }
  });

  it("exposes public bid/round/player info identically to every viewer", () => {
    const players = [player("p0", "A"), player("p1", "B")];
    const state = createInitialState(players);
    const viewA = getClientView(state, "p0");
    const viewB = getClientView(state, "p1");
    expect(viewA.currentBid).toEqual(viewB.currentBid);
    expect(viewA.roundNumber).toBe(viewB.roundNumber);
    expect(viewA.players).toEqual(viewB.players);
  });
});
