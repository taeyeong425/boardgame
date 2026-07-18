import { describe, expect, it } from "vitest";
import type { Player, RoomState } from "../../../shared/types";
import { createRoomState, HOST_REASSIGN_GRACE_MS, promoteHostIfNeeded } from "../RoomState";

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

  it("leaves state untouched if nobody is connected to promote, even past the grace window", () => {
    const state = stateWith([player({ id: "host", joinedAt: 0, connected: false })], {
      hostDisconnectedAt: Date.now() - HOST_REASSIGN_GRACE_MS - 1,
    });
    const next = promoteHostIfNeeded(state);
    expect(next).toBe(state);
  });
});
