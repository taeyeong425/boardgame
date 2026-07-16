import type { ComponentType } from "react";
import type { GameId } from "@/shared/types";
import { BluffGame } from "./bluff/ui/BluffBoard";
import type { GameComponentProps } from "./gameComponentProps";
import { LasVegasGame } from "./las-vegas/ui/LasVegasBoard";
import { PenguinPartyGame } from "./penguin-party/ui/PenguinPartyBoard";

/** Client-side UI counterpart to party/games/registry.ts — one entry per implemented game. */
export const gameUiRegistry: Partial<Record<GameId, ComponentType<GameComponentProps>>> = {
  "penguin-party": PenguinPartyGame,
  bluff: BluffGame,
  "las-vegas": LasVegasGame,
};
