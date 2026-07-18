import type { RNG } from "../../../shared/rng";
import { shuffle } from "../../../shared/rng";
import type { Card, PlayerId } from "./types";

/** 1 copy of value 1, 2 copies of value 2, ..., 12 copies of value 12, plus 2 jokers — 80 total. */
export function buildFullDeck(): Card[] {
  const cards: Card[] = [];
  for (let value = 1; value <= 12; value++) {
    for (let copy = 0; copy < value; copy++) {
      cards.push({ kind: "number", id: `${value}-${copy}`, value });
    }
  }
  for (let i = 1; i <= 2; i++) cards.push({ kind: "joker", id: `joker-${i}` });
  return cards; // (1+2+...+12) + 2 = 78 + 2 = 80
}

/**
 * Deals the full deck as evenly as possible across rankedPlayerIds (index 0 = best rank .. last =
 * worst). When it doesn't divide evenly, the worst-ranked players get the extra cards first — the
 * source material's own convention ("보통 농노부터 계급이 낮은 순으로 하나씩 더").
 */
export function dealAll(rankedPlayerIds: PlayerId[], rng: RNG): Record<PlayerId, Card[]> {
  const deck = shuffle(buildFullDeck(), rng);
  const n = rankedPlayerIds.length;
  const base = Math.floor(deck.length / n);
  const extra = deck.length % n;
  const hands: Record<PlayerId, Card[]> = {};
  let offset = 0;
  for (let i = 0; i < n; i++) {
    const getsExtra = i >= n - extra;
    const count = base + (getsExtra ? 1 : 0);
    hands[rankedPlayerIds[i]] = deck.slice(offset, offset + count);
    offset += count;
  }
  return hands;
}
