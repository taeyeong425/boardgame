import type { Card, NumberCard } from "./types";

export type SocialRankTitle = "달무티" | "총리대신" | "상인" | "소작농" | "농노";

/** Player-facing social rank title for a seat, by position in the (post-revolution) turnOrder.
 * Only the top-2 and bottom-2 seats have tribute obligations; everyone in between is a 상인. */
export function socialRankTitle(index: number, total: number): SocialRankTitle {
  if (index === 0) return "달무티";
  if (index === 1) return "총리대신";
  if (index === total - 1) return "농노";
  if (index === total - 2) return "소작농";
  return "상인";
}

/** The N lowest-value cards in hand — forced tribute is specifically "가장 작은 수", never a
 * player choice. Jokers are never picked (a hand always has plenty of real number cards; at most
 * 2 of the 80 cards are jokers). */
export function lowestCards(hand: Card[], count: number): Card[] {
  return hand
    .filter((c): c is NumberCard => c.kind === "number")
    .sort((a, b) => a.value - b.value)
    .slice(0, count);
}

export function hasBothJokers(hand: Card[]): boolean {
  return hand.filter((c) => c.kind === "joker").length === 2;
}
