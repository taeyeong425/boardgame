"use client";

import type { Card } from "../engine/types";
import { cardColorClass, cardColorGlyph } from "./cardColor";

export function PlayerHand({
  hand,
  selectedCardId,
  playable,
  onSelectCard,
}: {
  hand: Card[];
  selectedCardId: string | null;
  playable: boolean;
  onSelectCard: (cardId: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto p-2">
      {hand.map((card) => (
        <button
          key={card.id}
          type="button"
          disabled={!playable}
          onClick={() => onSelectCard(card.id)}
          className={`flex h-16 w-12 shrink-0 items-center justify-center rounded-lg border-2 font-bold ${cardColorClass(card.color)} ${
            selectedCardId === card.id ? "ring-4 ring-white" : ""
          } ${playable ? "active:scale-95" : "opacity-40"}`}
        >
          {cardColorGlyph(card.color)}
        </button>
      ))}
      {hand.length === 0 && <p className="p-2 text-sm text-white/40">손패 없음</p>}
    </div>
  );
}
