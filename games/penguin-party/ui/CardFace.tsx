import type { CardColor } from "../engine/types";
import { cardColorGlyph, cardColorHex } from "./cardColor";

/** Fills its parent container completely — the parent controls the (portrait, card-shaped) size. */
export function CardFace({ color, dimmed }: { color: CardColor; dimmed?: boolean }) {
  const hex = cardColorHex(color);
  const glyph = cardColorGlyph(color);
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-md border-2 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] ${
        dimmed ? "opacity-50" : ""
      }`}
      style={{ borderColor: hex }}
    >
      <span className="text-3xl leading-none">{glyph}</span>
    </div>
  );
}

export function CardBack() {
  return (
    <div className="relative h-full w-full rounded-md border-2 border-white/20 bg-slate-600 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-[3px] rounded-sm border border-white/15" />
    </div>
  );
}
