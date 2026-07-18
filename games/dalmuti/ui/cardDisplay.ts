import type { Card } from "../engine/types";

const RANK_TITLES: Record<number, string> = {
  1: "달무티",
  2: "대주교",
  3: "시종장",
  4: "남작부인",
  5: "수녀원장",
  6: "기사",
  7: "재봉사",
  8: "석공",
  9: "요리사",
  10: "양치기",
  11: "광부",
  12: "농노",
};

export function cardLabel(card: Card): string {
  return card.kind === "joker" ? "어릿광대" : RANK_TITLES[card.value];
}

export function cardGlyph(card: Card): string {
  return card.kind === "joker" ? "🃏" : String(card.value);
}

/** No suit dimension here — every number card shares one look; the joker gets the same
 * "wildcard" amber treatment already used for Skull King's Tigress. */
export function cardColorClass(card: Card): string {
  if (card.kind === "joker") return "bg-amber-500 text-amber-950 border-amber-300";
  return "bg-indigo-700 text-indigo-50 border-indigo-400";
}

/** Ascending by value (best/lowest first), jokers last — same sort convention already shipped
 * this session for Penguin Party (by color), Bluff (by die face), and Skull King (by suit+value). */
export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    const av = a.kind === "number" ? a.value : 13;
    const bv = b.kind === "number" ? b.value : 13;
    return av - bv;
  });
}
