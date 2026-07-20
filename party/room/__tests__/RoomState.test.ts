import { describe, expect, it } from "vitest";
import type { Player, RoomState } from "../../../shared/types";
import { createRoomState, HOST_REASSIGN_GRACE_MS, promoteHostIfNeeded, refreshEmptyRoomSince } from "../RoomState";

function player(overrides: Partial<Player> & Pick<Player, "id" | "joinedAt" | "connected">): Player {
  return { nickname: overrides.id, connectionId: null, isHost: false, ...overrides };
}

function stateWith(players: Player[], overrides: Partial<RoomState> = {}): RoomState {
  const host = players[0];
  const base = createRoomState("ABCDE", { ...host, isHost: true });
  return {
    ...base,
    players: Object.fromEntries(players.map((p) => [p.id, p])),
    ...overrides,
  };
}

describe("promoteHostIfNeeded", () => {
  it("is a no-op while the host is connected", () => {
    const state = stateWith([
      player({ id: "host", joinedAt: 0, connected: true }),
      player({ id: "p2", joinedAt: 1, connected: true }),
    ]);
    expect(promoteHostIfNeeded(state)).toBe(state);
  });

  it("clears a stale hostDisconnectedAt once the host is connected again", () => {
    const state = stateWith(
      [player({ id: "host", joinedAt: 0, connected: true }), player({ id: "p2", joinedAt: 1, connected: true })],
      { hostDisconnectedAt: Date.now() - 100 }
    );
    const next = promoteHostIfNeeded(state);
    expect(next.hostPlayerId).toBe("host");
    expect(next.hostDisconnectedAt).toBeNull();
  });

  it("does not reassign while the disconnected host is still within the grace window", () => {
    const state = stateWith(
      [player({ id: "host", joinedAt: 0, connected: false }), player({ id: "p2", joinedAt: 1, connected: true })],
      { hostDisconnectedAt: Date.now() - 100 }
    );
    const next = promoteHostIfNeeded(state);
    expect(next.hostPlayerId).toBe("host");
  });

  it("promotes the earliest-joined connected player once the grace window has elapsed", () => {
    const state = stateWith(
      [
        player({ id: "host", joinedAt: 0, connected: false }),
        player({ id: "p2", joinedAt: 1, connected: true }),
        player({ id: "p3", joinedAt: 2, connected: true }),
      ],
      { hostDisconnectedAt: Date.now() - HOST_REASSIGN_GRACE_MS - 1 }
    );
    const next = promoteHostIfNeeded(state);
    expect(next.hostPlayerId).toBe("p2");
    expect(next.hostDisconnectedAt).toBeNull();
    expect(next.players.p2.isHost).toBe(true);
    expect(next.players.host.isHost).toBe(false);
  });

  it("gives up and clears hostDisconnectedAt if nobody is connected to promote, past the grace window", () => {
    const state = stateWith([player({ id: "host", joinedAt: 0, connected: false })], {
      hostDisconnectedAt: Date.now() - HOST_REASSIGN_GRACE_MS - 1,
    });
    const next = promoteHostIfNeeded(state);
    expect(next.hostPlayerId).toBe("host");
    expect(next.hostDisconnectedAt).toBeNull();
  });

  it("is a no-op the second time nobody is connected to promote (hostDisconnectedAt already null)", () => {
    // Regression test: rescheduleAlarm must be able to reach deadlines.length === 0 and stop
    // re-arming the alarm once nobody's left to promote — this only holds if promoteHostIfNeeded
    // reaches a fixed point instead of forever handing back a fresh object.
    const state = stateWith([player({ id: "host", joinedAt: 0, connected: false })], { hostDisconnectedAt: null });
    expect(promoteHostIfNeeded(state)).toBe(state);
  });
});

describe("refreshEmptyRoomSince", () => {
  it("stamps emptyRoomSince once the last connected player disconnects", () => {
    const state = stateWith([player({ id: "host", joinedAt: 0, connected: false })], { emptyRoomSince: null });
    const next = refreshEmptyRoomSince(state);
    expect(next.emptyRoomSince).not.toBeNull();
  });

  it("is a no-op while at least one player is connected", () => {
    const state = stateWith([player({ id: "host", joinedAt: 0, connected: true })], { emptyRoomSince: null });
    expect(refreshEmptyRoomSince(state)).toBe(state);
  });

  it("clears emptyRoomSince once someone reconnects", () => {
    const state = stateWith([player({ id: "host", joinedAt: 0, connected: true })], { emptyRoomSince: Date.now() });
    const next = refreshEmptyRoomSince(state);
    expect(next.emptyRoomSince).toBeNull();
  });

  it("is a no-op if the room is already marked empty", () => {
    const since = Date.now() - 1000;
    const state = stateWith([player({ id: "host", joinedAt: 0, connected: false })], { emptyRoomSince: since });
    expect(refreshEmptyRoomSince(state)).toBe(state);
  });
});
