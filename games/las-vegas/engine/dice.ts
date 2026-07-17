import type { RNG } from "../../../shared/rng";
import type { CasinoNumber } from "./types";

export function rollFace(rng: RNG): CasinoNumber {
  return (Math.floor(rng() * 6) + 1) as CasinoNumber;
}
