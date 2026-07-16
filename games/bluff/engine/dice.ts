import type { RNG } from "../../../shared/rng";
import type { DieFace, PlayerId } from "./types";

const ALL_FACES: DieFace[] = [1, 2, 3, 4, 5, "star"];

/**
 * 30 total dice split by player count (confirmed from the official rules): the physical game
 * scales dice-per-player with player count (unlike plain Perudo/Liar's Dice, which always uses 5)
 * specifically because a single challenge can cost more than 1 die here. 4 players is the only
 * uneven split — 28 of 30 dice get dealt (7 each), the remaining 2 are simply never used.
 */
const DICE_PER_PLAYER_COUNT: Record<number, number> = { 2: 15, 3: 10, 4: 7, 5: 6, 6: 5 };

export function startingDiceCount(playerCount: number): number {
  const count = DICE_PER_PLAYER_COUNT[playerCount];
  if (!count) throw new Error(`Bluff supports 2-6 players, got ${playerCount}`);
  return count;
}

export function rollDice(count: number, rng: RNG): DieFace[] {
  return Array.from({ length: count }, () => ALL_FACES[Math.floor(rng() * ALL_FACES.length)]);
}

export function rollAll(diceCounts: Record<PlayerId, number>, rng: RNG): Record<PlayerId, DieFace[]> {
  const rolls: Record<PlayerId, DieFace[]> = {};
  for (const [playerId, count] of Object.entries(diceCounts)) {
    rolls[playerId] = rollDice(count, rng);
  }
  return rolls;
}

/**
 * How many dice across every player's roll match a bid's face — stars are wild for any numbered
 * face, but betting on "star" itself only matches actual stars (nothing is wild for the wild).
 */
export function countMatching(rolls: Record<PlayerId, DieFace[]>, face: DieFace): number {
  let total = 0;
  for (const dice of Object.values(rolls)) {
    for (const d of dice) {
      if (face === "star") {
        if (d === "star") total++;
      } else if (d === face || d === "star") {
        total++;
      }
    }
  }
  return total;
}
