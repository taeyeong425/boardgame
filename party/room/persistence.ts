import type { DurableObjectState } from "@cloudflare/workers-types";
import type { RoomState } from "../../shared/types";

const STORAGE_KEY = "state";

export async function loadRoomState(ctx: DurableObjectState): Promise<RoomState | undefined> {
  const state = await ctx.storage.get<RoomState>(STORAGE_KEY);
  // Rooms persisted before emptyRoomSince existed are missing the key entirely (not just null),
  // and `undefined !== null` is true in JS — left unguarded, rescheduleAlarm would compute
  // `undefined + EMPTY_ROOM_EXPIRY_MS` (NaN) and hand that to setAlarm(). Backfill it on read so
  // every caller can keep assuming the field is always present.
  return state && { ...state, emptyRoomSince: state.emptyRoomSince ?? null };
}

export async function saveRoomState(ctx: DurableObjectState, state: RoomState): Promise<void> {
  await ctx.storage.put(STORAGE_KEY, state);
}
