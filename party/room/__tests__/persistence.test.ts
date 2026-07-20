import type { DurableObjectState } from "@cloudflare/workers-types";
import { describe, expect, it } from "vitest";
import type { RoomState } from "../../../shared/types";
import { loadRoomState } from "../persistence";

function ctxWithStored(value: unknown): DurableObjectState {
  return { storage: { get: async () => value } } as unknown as DurableObjectState;
}

describe("loadRoomState", () => {
  it("backfills emptyRoomSince: null for state persisted before that field existed", async () => {
    // Simulates data written by the pre-migration code, which never had this key at all — not
    // even set to null. Without the backfill, `state.emptyRoomSince !== null` reads `undefined
    // !== null` as true and downstream arithmetic (`undefined + EMPTY_ROOM_EXPIRY_MS`) yields NaN.
    const legacy = { code: "ABCDE", players: {} } as unknown as RoomState;
    const state = await loadRoomState(ctxWithStored(legacy));
    expect(state?.emptyRoomSince).toBeNull();
  });

  it("leaves an already-present emptyRoomSince untouched", async () => {
    const stamp = Date.now() - 5000;
    const current = { code: "ABCDE", players: {}, emptyRoomSince: stamp } as unknown as RoomState;
    const state = await loadRoomState(ctxWithStored(current));
    expect(state?.emptyRoomSince).toBe(stamp);
  });

  it("returns undefined as-is when there's no stored state", async () => {
    const state = await loadRoomState(ctxWithStored(undefined));
    expect(state).toBeUndefined();
  });
});
