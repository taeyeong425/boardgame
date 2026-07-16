"use client";

import type { Card } from "../engine/types";
import { CardFace } from "./CardFace";

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
          className={`h-20 w-14 shrink-0 rounded-md transition-transform ${
            selectedCardId === card.id ? "-translate-y-2 ring-2 ring-white" : ""
          } ${playable ? "active:scale-95" : "opacity-40"}`}
        >
          <CardFace color={card.color} />
        </button>
      ))}
      {hand.length === 0 && <p className="p-2 text-sm text-white/40">손패 없음</p>}
    </div>
  );
}
