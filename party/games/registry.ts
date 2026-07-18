import type { GameId } from "../../shared/types";
import { bluffModule } from "../../games/bluff/engine/module";
import { dalmutiModule } from "../../games/dalmuti/engine/module";
import { lasVegasModule } from "../../games/las-vegas/engine/module";
import { penguinPartyModule } from "../../games/penguin-party/engine/module";
import { skullKingModule } from "../../games/skull-king/engine/module";
import type { GameModule } from "./types";

export const gameModules: Partial<Record<GameId, GameModule>> = {
  "penguin-party": penguinPartyModule,
  bluff: bluffModule,
  "las-vegas": lasVegasModule,
  "skull-king": skullKingModule,
  dalmuti: dalmutiModule,
};

export function getGameModule(id: GameId): GameModule | undefined {
  return gameModules[id];
}
