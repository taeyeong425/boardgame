import type { CardColor } from "../engine/types";
import { cardColorGlyph, cardColorHex } from "./cardColor";

/**
 * Fills its parent container completely — the parent controls size/aspect ratio (portrait for the
 * hand, roughly square for the tight pyramid grid), this just lays out corner indices + a center
 * pip proportionally like a real playing card.
 */
export function CardFace({ color, dimmed }: { color: CardColor; dimmed?: boolean }) {
  const hex = cardColorHex(color);
  const glyph = cardColorGlyph(color);
  return (
    <div
      className={`relative h-full w-full rounded-md border-2 border-white bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] ${
        dimmed ? "opacity-50" : ""
      }`}
    >
      <span className="absolute left-0.5 top-0 text-[9px] font-extrabold leading-tight" style={{ color: hex }}>
        {glyph}
      </span>
      <span
        className="absolute bottom-0 right-0.5 rotate-180 text-[9px] font-extrabold leading-tight"
        style={{ color: hex }}
      >
        {glyph}
      </span>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-2/5 w-2/5 rounded-full ring-2 ring-black/10" style={{ backgroundColor: hex }} />
      </div>
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
