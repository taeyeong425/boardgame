import type { DurableObjectState } from "@cloudflare/workers-types";
import type { RoomState } from "../../shared/types";

const STORAGE_KEY = "state";

export async function loadRoomState(ctx: DurableObjectState): Promise<RoomState | undefined> {
  return ctx.storage.get<RoomState>(STORAGE_KEY);
}

export async function saveRoomState(ctx: DurableObjectState, state: RoomState): Promise<void> {
  await ctx.storage.put(STORAGE_KEY, state);
}
