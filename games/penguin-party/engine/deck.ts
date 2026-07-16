import { shuffle, type RNG } from "../../../shared/rng";
import type { Card, CardColor, PlayerId } from "./types";

const COLOR_COUNTS: Record<CardColor, number> = {
  fire: 7,
  tree: 7,
  desert: 7,
  grape: 7,
  ice: 8,
};

export function buildFullDeck(): Card[] {
  const deck: Card[] = [];
  for (const [color, count] of Object.entries(COLOR_COUNTS) as [CardColor, number][]) {
    for (let i = 0; i < count; i++) deck.push({ id: `${color}-${i}`, color });
  }
  return deck; // length 36
}

export interface DealResult {
  hands: Record<PlayerId, Card[]>;
  /** 5-player case only: the one card that doesn't fit evenly, revealed publicly, unplayable. */
  revealedExtraCard: Card | null;
  layer1MaxWidth: number;
}

/**
 * Shuffles and deals the full 36-card deck for one round, applying the 5-player leftover-card
 * reveal (1 card publicly shown, unplayable) where needed. Every player count 2-6 uses the entire
 * deck (36/2=18, 36/3=12, 36/4=9, 36/6=6, each with no leftover) and the same 8-wide layer 1 —
 * this intentionally departs from the physical game's official 2-player variant (which sets aside
 * 8 cards and narrows layer 1 to 7) per a house-rule request to keep all 36 cards in play regardless
 * of player count.
 */
export function dealRound(playerIds: PlayerId[], rng: RNG): DealResult {
  const n = playerIds.length;
  if (n < 2 || n > 6) throw new Error(`Penguin Party supports 2-6 players, got ${n}`);

  const deck = shuffle(buildFullDeck(), rng);
  const layer1MaxWidth = 8;

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
