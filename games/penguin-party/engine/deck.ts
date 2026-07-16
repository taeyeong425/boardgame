import type { Card, CardColor, PlayerId } from "./types";

const COLOR_COUNTS: Record<CardColor, number> = {
  red: 7,
  green: 7,
  yellow: 7,
  purple: 7,
  sky: 8,
};

export function buildFullDeck(): Card[] {
  const deck: Card[] = [];
  for (const [color, count] of Object.entries(COLOR_COUNTS) as [CardColor, number][]) {
    for (let i = 0; i < count; i++) deck.push({ id: `${color}-${i}`, color });
  }
  return deck; // length 36
}

export type RNG = () => number; // returns a float in [0, 1)

/** Deterministic PRNG (mulberry32) so deals/shuffles are reproducible in tests given a fixed seed. */
export function mulberry32(seed: number): RNG {
  let state = seed | 0;
  return function () {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return h;
}

export function shuffle<T>(arr: T[], rng: RNG): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface DealResult {
  hands: Record<PlayerId, Card[]>;
  /** 5-player variant only: the one card that doesn't fit evenly, revealed publicly, unplayable. */
  revealedExtraCard: Card | null;
  layer1MaxWidth: number;
}

/**
 * Shuffles and deals a fresh 36-card deck for one round, applying the 2-player set-aside
 * variant (8 cards removed unseen, max layer-1 width drops to 7) and the 5-player leftover-card
 * reveal (1 card publicly shown, unplayable) as needed. Every other player count (3, 4, 6) divides
 * evenly with no special case.
 */
export function dealRound(playerIds: PlayerId[], rng: RNG): DealResult {
  const n = playerIds.length;
  if (n < 2 || n > 6) throw new Error(`Penguin Party supports 2-6 players, got ${n}`);

  let deck = shuffle(buildFullDeck(), rng);
  let layer1MaxWidth = 8;

  if (n === 2) {
    // The deck is already shuffled, so dropping the first 8 is equivalent to setting aside a
    // random 8 — they are discarded here and never stored, so they can never leak to any client.
    deck = deck.slice(8);
    layer1MaxWidth = 7;
  }

  const hands: Record<PlayerId, Card[]> = Object.fromEntries(playerIds.map((id) => [id, [] as Card[]]));
  const perPlayer = Math.floor(deck.length / n);
  let cursor = 0;
  for (let r = 0; r < perPlayer; r++) {
    for (const id of playerIds) hands[id].push(deck[cursor++]);
  }

  const leftover = deck.length - cursor;
  let revealedExtraCard: Card | null = null;
  if (leftover === 1) {
    revealedExtraCard = deck[cursor];
  } else if (leftover > 0) {
    throw new Error(`unexpected leftover of ${leftover} cards for ${n} players`);
  }

  return { hands, revealedExtraCard, layer1MaxWidth };
}
