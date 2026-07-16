import type { GameId } from "../../shared/types";
import { bluffModule } from "../../games/bluff/engine/module";
import { lasVegasModule } from "../../games/las-vegas/engine/module";
import { penguinPartyModule } from "../../games/penguin-party/engine/module";
import type { GameModule } from "./types";

/**
 * Only games with a real GameModule implementation appear here. skull-king exists in
 * shared/gameCatalog.ts (for lobby display) but has no entry here yet — selectGame requests for
 * it are rejected server-side until it's implemented.
 */
export const gameModules: Partial<Record<GameId, GameModule>> = {
  "penguin-party": penguinPartyModule,
  bluff: bluffModule,
  "las-vegas": lasVegasModule,
};

export function getGameModule(id: GameId): GameModule | undefined {
  return gameModules[id];
}
