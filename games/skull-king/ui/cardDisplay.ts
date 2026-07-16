import type { Card, Suit } from "../engine/types";

export function suitColorClass(suit: Suit): string {
  switch (suit) {
    case "green":
      return "bg-emerald-700 text-emerald-50 border-emerald-400";
    case "yellow":
      return "bg-amber-500 text-amber-950 border-amber-300";
    case "purple":
      return "bg-purple-700 text-purple-50 border-purple-400";
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
