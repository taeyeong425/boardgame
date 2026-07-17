import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import { BoardgameRoom } from "./index";
import { parseRoomCodeFromPath } from "./roomRouting";

export { BoardgameRoom };

interface Env {
  ROOMS: DurableObjectNamespace;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const roomCode = parseRoomCodeFromPath(url.pathname);
    if (!roomCode) return new Response("Not found", { status: 404 });

    const id = env.ROOMS.idFromName(roomCode);
    const stub = env.ROOMS.get(id);
    return stub.fetch(request as unknown as Parameters<typeof stub.fetch>[0]) as unknown as Promise<Response>;
  },
};

export default worker;
