import type * as Party from "partykit/server";
import type { RoomState } from "../../shared/types";

const STORAGE_KEY = "state";

export async function loadRoomState(room: Party.Room): Promise<RoomState | undefined> {
  return room.storage.get<RoomState>(STORAGE_KEY);
}

export async function saveRoomState(room: Party.Room, state: RoomState): Promise<void> {
  await room.storage.put(STORAGE_KEY, state);
}
