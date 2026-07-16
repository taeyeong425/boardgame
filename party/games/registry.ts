import type { GameId } from "../../shared/types";
import { bluffModule } from "../../games/bluff/engine/module";
import { penguinPartyModule } from "../../games/penguin-party/engine/module";
import type { GameModule } from "./types";

/**
 * Only games with a real GameModule implementation appear here. skull-king/las-vegas exist in
 * shared/gameCatalog.ts (for lobby display) but have no entry here yet — selectGame requests for
 * them are rejected server-side until each is implemented one at a time.
 */
export const gameModules: Partial<Record<GameId, GameModule>> = {
  "penguin-party": penguinPartyModule,
  bluff: bluffModule,
};

export function getGameModule(id: GameId): GameModule | undefined {
  return gameModules[id];
}
