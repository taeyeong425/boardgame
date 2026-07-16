import { describe, expect, it } from "vitest";
import { getClientView } from "../clientView";
import { createInitialState } from "../reducer";

function player(id: string, nickname: string) {
  return { id, nickname, connectionId: null, connected: true, isHost: false, joinedAt: 0 };
}

describe("getClientView", () => {
  it("never leaks another player's still-in-hand card identities", () => {
    const players = [player("p0", "A"), player("p1", "B"), player("p2", "C")];
    const state = createInitialState(players);

    for (const viewer of players) {
      const view = getClientView(state, viewer.id);
      expect(view.myHand).toEqual(state.round.hands[viewer.id]);

      const serialized = JSON.stringify(view.opponents);
      for (const other of players) {
        if (other.id === viewer.id) continue;
        for (const card of state.round.hands[other.id]) {
          expect(serialized.includes(card.id)).toBe(false);
        }
      }
      // opponents only ever expose a count, never a `card`/`cards` field
      for (const opp of view.opponents) {
        expect(typeof opp.cardCount).toBe("number");
        expect((opp as unknown as { hand?: unknown }).hand).toBeUndefined();
      }
    }
  });

  it("still shows the viewer their own hand even after elimination", () => {
    const players = [player("p0", "A"), player("p1", "B")];
    let state = createInitialState(players);
    state = {
      ...state,
      round: { ...state.round, eliminated: { p0: true } },
    };
    const view = getClientView(state, "p0");
    expect(view.myEliminated).toBe(true);
    expect(view.myHand).toEqual(state.round.hands.p0);
  });

  it("exposes public pyramid/round/score info identically to every viewer", () => {
    const players = [player("p0", "A"), player("p1", "B")];
    const state = createInitialState(players);
    const viewA = getClientView(state, "p0");
    const viewB = getClientView(state, "p1");
    expect(viewA.pyramid).toEqual(viewB.pyramid);
    expect(viewA.players).toEqual(viewB.players);
    expect(viewA.roundNumber).toBe(viewB.roundNumber);
  });
});
