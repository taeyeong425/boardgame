import type { Card } from "../engine/types";
import { cardColorClass, cardGlyph } from "./cardDisplay";

export function CardFace({ card, size = "md" }: { card: Card; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-12 w-9 text-base" : "h-16 w-12 text-xl";
  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center rounded-md border-2 font-bold shadow ${dims} ${cardColorClass(card)}`}
    >
      <span>{cardGlyph(card)}</span>
    </div>
  );
}
