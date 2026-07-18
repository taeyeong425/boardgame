import type { Card, Suit } from "../engine/types";

export function suitColorClass(suit: Suit): string {
  switch (suit) {
    case "red":
      return "bg-red-700 text-red-50 border-red-400";
    case "yellow":
      return "bg-amber-500 text-amber-950 border-amber-300";
    case "blue":
      return "bg-blue-700 text-blue-50 border-blue-400";
    case "black":
      return "bg-neutral-900 text-neutral-100 border-neutral-500";
  }
}

export function cardColorClass(card: Card): string {
  switch (card.kind) {
    case "number":
      return suitColorClass(card.suit);
    case "pirate":
      return "bg-slate-700 text-slate-50 border-slate-400";
    case "tigress":
      return "bg-orange-700 text-orange-50 border-orange-400";
    case "skullKing":
      return "bg-black text-white border-yellow-400";
    case "mermaid":
      return "bg-cyan-700 text-cyan-50 border-cyan-400";
    case "escape":
      return "bg-stone-600 text-stone-100 border-stone-400";
  }
}

export function cardGlyph(card: Card): string {
  switch (card.kind) {
    case "number":
      return String(card.value);
    case "pirate":
      return "🏴‍☠️";
    case "tigress":
      return "🐯";
    case "skullKing":
      return "💀";
    case "mermaid":
      return "🧜‍♀️";
    case "escape":
      return "🏃";
  }
}

export function cardLabel(card: Card): string {
  switch (card.kind) {
    case "number":
      return `${card.suit} ${card.value}`;
    case "pirate":
      return "해적";
    case "tigress":
      return "타이그리스";
    case "skullKing":
      return "스컬킹";
    case "mermaid":
      return "인어";
    case "escape":
      return "탈출";
  }
}

const SUIT_ORDER: Suit[] = ["red", "yellow", "blue", "black"];

/** Display-order group: colored suits (low-to-high value) first, then black (also low-to-high),
 * then the specials in a fixed sequence — per-player preference, not a strength/priority order
 * (see docs/rules/skull-king.md for the actual trick-resolution priority). */
function sortGroup(card: Card): number {
  switch (card.kind) {
    case "number":
      return SUIT_ORDER.indexOf(card.suit);
    case "tigress":
      return 4;
    case "mermaid":
      return 5;
    case "pirate":
      return 6;
    case "skullKing":
      return 7;
    case "escape":
      return 8;
  }
}

export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    const groupDiff = sortGroup(a) - sortGroup(b);
    if (groupDiff !== 0) return groupDiff;
    return a.kind === "number" && b.kind === "number" ? a.value - b.value : 0;
  });
}
