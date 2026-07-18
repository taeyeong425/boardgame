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

/**
 * Gradient from richly saturated (1, best/달무티) to pale (12, worst/농노) — reinforces "lower
 * number = higher rank" at a glance, without a second suit dimension. Spelled out as literal
 * class strings (not built from a template) so Tailwind's static scanner picks up every shade.
 */
const NUMBER_COLOR_CLASSES: string[] = [
  "bg-indigo-950 text-indigo-50 border-indigo-700", // 1
  "bg-indigo-900 text-indigo-50 border-indigo-600", // 2
  "bg-indigo-800 text-indigo-50 border-indigo-500", // 3
  "bg-indigo-700 text-indigo-50 border-indigo-400", // 4
  "bg-indigo-600 text-indigo-50 border-indigo-300", // 5
  "bg-indigo-500 text-white border-indigo-300", // 6
  "bg-indigo-400 text-indigo-950 border-indigo-200", // 7
  "bg-indigo-300 text-indigo-950 border-indigo-200", // 8
  "bg-indigo-200 text-indigo-950 border-indigo-100", // 9
  "bg-indigo-100 text-indigo-950 border-indigo-200", // 10
  "bg-indigo-50 text-indigo-950 border-indigo-200", // 11
  "bg-white text-indigo-900 border-indigo-200", // 12
];

/** The joker gets the same "wildcard" amber treatment already used for Skull King's Tigress. */
export function cardColorClass(card: Card): string {
  if (card.kind === "joker") return "bg-amber-500 text-amber-950 border-amber-300";
  return NUMBER_COLOR_CLASSES[card.value - 1];
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
