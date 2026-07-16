import type { RNG } from "../../../shared/rng";
import type { CasinoNumber } from "./types";

/**
 * Official 2-4 player variant: every player also rolls neutral ("house") dice each round,
 * scored as if belonging to an extra phantom player whose winnings are discarded. The rulebook
 * gives each player a personal allotment (4 for 2p, 2 for 3-4p) — for 3 players specifically, an
 * extra 2 "leftover" dice (8 total house dice, split 2 each among 3 players leaves a remainder of
 * 2) go to that round's start player, folded in here as +2 to their personal allotment rather
 * than as a separate one-off action, since they resolve identically either way.
 */
export function neutralDiceForPlayer(playerCount: number, isStartPlayerThisRound: boolean): number {
  if (playerCount === 2) return 4;
  if (playerCount === 3) return isStartPlayerThisRound ? 4 : 2;
  if (playerCount === 4) return 2;
  return 0; // 5 players: base game, no house dice
}

export function rollFace(rng: RNG): CasinoNumber {
  return (Math.floor(rng() * 6) + 1) as CasinoNumber;
}
