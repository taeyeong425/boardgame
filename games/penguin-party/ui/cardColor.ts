import type { CardColor } from "../engine/types";

/** Color alone isn't accessible (red/green colorblindness) — every card also carries a label glyph. */
export function cardColorClass(color: CardColor): string {
  switch (color) {
    case "red":
      return "bg-red-500 border-red-300";
    case "green":
      return "bg-emerald-500 border-emerald-300";
    case "yellow":
      return "bg-yellow-400 border-yellow-200 text-slate-900";
    case "purple":
      return "bg-purple-500 border-purple-300";
    case "sky":
      return "bg-sky-400 border-sky-200 text-slate-900";
  }
}

export function cardColorGlyph(color: CardColor): string {
  switch (color) {
    case "red":
      return "R";
    case "green":
      return "G";
    case "yellow":
      return "Y";
    case "purple":
      return "P";
    case "sky":
      return "S";
  }
}

export function cardColorHex(color: CardColor): string {
  switch (color) {
    case "red":
      return "#ef4444";
    case "green":
      return "#10b981";
    case "yellow":
      return "#eab308";
    case "purple":
      return "#a855f7";
    case "sky":
      return "#38bdf8";
  }
}

export function cardColorLabel(color: CardColor): string {
  switch (color) {
    case "red":
      return "빨강";
    case "green":
      return "초록";
    case "yellow":
      return "노랑";
    case "purple":
      return "보라";
    case "sky":
      return "하늘";
  }
}
