import type { CardColor } from "../engine/types";

/** Canonical display order, matched below in every color lookup — also used to group a hand by color. */
export const CARD_COLOR_ORDER: CardColor[] = ["fire", "tree", "desert", "grape", "ice"];

/** Color alone isn't accessible (red/green colorblindness) — every card also carries a themed icon. */
export function cardColorClass(color: CardColor): string {
  switch (color) {
    case "fire":
      return "bg-red-500 border-red-300";
    case "tree":
      return "bg-emerald-500 border-emerald-300";
    case "desert":
      return "bg-yellow-400 border-yellow-200 text-slate-900";
    case "grape":
      return "bg-purple-500 border-purple-300";
    case "ice":
      return "bg-sky-400 border-sky-200 text-slate-900";
  }
}

export function cardColorGlyph(color: CardColor): string {
  switch (color) {
    case "fire":
      return "🔥";
    case "tree":
      return "🌲";
    case "desert":
      return "🌵";
    case "grape":
      return "🍇";
    case "ice":
      return "❄️";
  }
}

export function cardColorHex(color: CardColor): string {
  switch (color) {
    case "fire":
      return "#ef4444";
    case "tree":
      return "#10b981";
    case "desert":
      return "#eab308";
    case "grape":
      return "#a855f7";
    case "ice":
      return "#38bdf8";
  }
}

export function cardColorLabel(color: CardColor): string {
  switch (color) {
    case "fire":
      return "불";
    case "tree":
      return "나무";
    case "desert":
      return "사막";
    case "grape":
      return "포도";
    case "ice":
      return "얼음";
  }
}
