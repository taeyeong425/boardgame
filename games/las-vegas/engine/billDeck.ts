import { shuffle, type RNG } from "../../../shared/rng";
import type { Bill, CasinoState } from "./types";

const BILL_COUNTS: Record<number, number> = {
  10000: 6,
  20000: 8,
  30000: 8,
  40000: 6,
  50000: 6,
  60000: 5,
  70000: 5,
  80000: 5,
  90000: 5,
};

export function buildFullBillDeck(): Bill[] {
  const deck: Bill[] = [];
  for (const [value, count] of Object.entries(BILL_COUNTS)) {
    for (let i = 0; i < count; i++) deck.push({ value: Number(value) });
  }
  return deck; // 54 total
}

export function shuffleBillDeck(rng: RNG): Bill[] {
  return shuffle(buildFullBillDeck(), rng);
}

/**
 * Deals face-down bills onto each empty casino, one at a time, until its total value is at
 * least $50,000 — the same procedure for both initial setup and every subsequent round's
 * resupply. Casinos are assumed empty (fully paid out/recycled) when this is called.
 */
export function refillCasinos(
  casinos: CasinoState[],
  deck: Bill[]
): { casinos: CasinoState[]; deck: Bill[] } {
  let remaining = deck;
  const filled = casinos.map((casino) => {
    const bills: Bill[] = [];
    let total = 0;
    while (total < 50000 && remaining.length > 0) {
      const [next, ...rest] = remaining;
      bills.push(next);
      total += next.value;
      remaining = rest;
    }
    return { ...casino, bills, diceCounts: {} };
  });
  return { casinos: filled, deck: remaining };
}
