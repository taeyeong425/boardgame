import type { Card } from "../engine/types";
import { cardColorClass, cardGlyph } from "./cardDisplay";

// A text badge (not just background color) so suits stay distinguishable regardless of color
// perception — red vs. black in particular look similar at a glance on a small phone screen.
const SUIT_LABEL: Record<string, string> = { red: "적", yellow: "황", blue: "청", black: "흑" };

export function CardFace({ card, size = "md" }: { card: Card; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-12 w-9 text-base" : "h-16 w-12 text-xl";
  return (
    <div
      className={`relative flex shrink-0 flex-col items-center justify-center rounded-md border-2 font-bold shadow ${dims} ${cardColorClass(card)}`}
    >
      {card.kind === "number" && (
        <span className="absolute left-1 top-0.5 text-[9px] font-semibold opacity-80">{SUIT_LABEL[card.suit]}</span>
      )}
      <span>{cardGlyph(card)}</span>
    </div>
  );
}
