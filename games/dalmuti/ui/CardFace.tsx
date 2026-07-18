import type { Card } from "../engine/types";
import { cardColorClass, cardGlyph, cardLabel } from "./cardDisplay";

export function CardFace({ card, size = "md" }: { card: Card; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-12 w-9" : "h-16 w-12";
  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border-2 font-bold shadow ${dims} ${cardColorClass(card)}`}
    >
      <span className="text-xl leading-none">{cardGlyph(card)}</span>
      <span className="px-0.5 text-center text-[8px] font-normal leading-none opacity-80">{cardLabel(card)}</span>
    </div>
  );
}
