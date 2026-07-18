import type { Card, NumberCard, PlayerId } from "./types";

/** Jokers are wild for whatever real rank the other cards in a group share; a jokers-only group
 * (no real card at all) is rank 13 — worse than every real number card. */
export function effectiveRank(cards: Card[]): number {
  const real = cards.find((c): c is NumberCard => c.kind === "number");
  return real ? real.value : 13;
}

function isSameEffectiveRank(cards: Card[]): boolean {
  const values = cards.filter((c): c is NumberCard => c.kind === "number").map((c) => c.value);
  return new Set(values).size <= 1;
}

/** Whether playing `cards` legally beats (or, with no active trick, legally opens) `activeTrick`.
 * Only needs `cards` from the trick, so this also accepts the client-facing (redacted) trick view. */
export function isLegalPlay(cards: Card[], activeTrick: { cards: Card[] } | null): boolean {
  if (cards.length === 0) return false;
  if (!isSameEffectiveRank(cards)) return false;
  if (activeTrick === null) return true; // leading: any rank, any count, any group size
  if (cards.length !== activeTrick.cards.length) return false;
  return effectiveRank(cards) < effectiveRank(activeTrick.cards);
}

/** Next seat (circular) for which `isActive` holds — generalizes games/bluff/engine/reducer.ts's
 * nextActiveIndex (there, "active" meant diceCount > 0; here it means "still holds cards"). */
export function nextActiveIndex(turnOrder: PlayerId[], isActive: (id: PlayerId) => boolean, fromIndex: number): number {
  const n = turnOrder.length;
  let idx = fromIndex;
  for (let step = 0; step < n; step++) {
    idx = (idx + 1) % n;
    if (isActive(turnOrder[idx])) return idx;
  }
  return fromIndex;
}

/**
 * Once a trick clears (everyone else passed), leadership returns to whoever played it last — or,
 * if they've since gone out, the next still-active player after their seat.
 */
export function resolveNextLeaderIndex(turnOrder: PlayerId[], isActive: (id: PlayerId) => boolean, lastPlayerId: PlayerId): number {
  const lastIndex = turnOrder.indexOf(lastPlayerId);
  if (isActive(lastPlayerId)) return lastIndex;
  return nextActiveIndex(turnOrder, isActive, lastIndex);
}
