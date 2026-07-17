import type { CasinoPayout, CasinoState, PlayerId } from "./types";

/**
 * Official payout algorithm for one casino once all dice are placed:
 * 1. Any players tied at the exact same dice count are eliminated entirely (no payout) — this
 *    applies at every count level, not just the top.
 * 2. Surviving players are ranked by descending dice count.
 * 3. Bills are handed out highest-value-first to the top-ranked survivor, next-highest to the
 *    next, etc. Extra survivors beyond the bill supply get nothing; extra bills beyond the
 *    survivor supply are recycled to the bottom of the deck.
 */
export function resolveCasino(casino: CasinoState): CasinoPayout {
  const entries = Object.entries(casino.diceCounts).filter((entry): entry is [PlayerId, number] => {
    const [, count] = entry;
    return typeof count === "number" && count > 0;
  });

  const byCount = new Map<number, PlayerId[]>();
  for (const [owner, count] of entries) {
    const list = byCount.get(count) ?? [];
    list.push(owner);
    byCount.set(count, list);
  }

  const eliminatedOwners: PlayerId[] = [];
  const ranked: PlayerId[] = [];
  for (const [, owners] of [...byCount.entries()].sort((a, b) => b[0] - a[0])) {
    if (owners.length > 1) {
      eliminatedOwners.push(...owners);
    } else {
      ranked.push(owners[0]);
    }
  }

  const sortedBills = [...casino.bills].sort((a, b) => b.value - a.value);
  const awarded: { owner: PlayerId; bill: (typeof sortedBills)[number] }[] = [];
  const recycled: (typeof sortedBills)[number][] = [];

  for (let i = 0; i < sortedBills.length; i++) {
    const owner = ranked[i];
    if (owner === undefined) {
      recycled.push(sortedBills[i]);
    } else {
      awarded.push({ owner, bill: sortedBills[i] });
    }
  }

  return { casinoNumber: casino.number, eliminatedOwners, awarded, recycled };
}
