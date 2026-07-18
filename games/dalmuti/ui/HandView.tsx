"use client";

import type { Card } from "../engine/types";
import { CardFace } from "./CardFace";
import { sortHand } from "./cardDisplay";

/**
 * Multi-select (unlike every other game's single-card-click hand) — a play here is a *set* of
 * same-rank cards, so selection just toggles membership; whether the current selection is actually
 * legal to play is decided by the caller (see DalmutiBoard's PlayControls), not per-card here.
 */
export function HandView({
  hand,
  selectedCardIds,
  playable,
  onToggleCard,
}: {
  hand: Card[];
  selectedCardIds: string[];
  playable: boolean;
  onToggleCard: (cardId: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2">
      {sortHand(hand).map((card) => {
        const selected = selectedCardIds.includes(card.id);
        return (
          <button
            key={card.id}
            type="button"
            disabled={!playable}
            onClick={() => onToggleCard(card.id)}
            className={`rounded-md transition-transform ${selected ? "-translate-y-2 ring-2 ring-white" : ""} ${
              playable ? "active:scale-95" : "opacity-40"
            }`}
          >
            <CardFace card={card} />
          </button>
        );
      })}
      {hand.length === 0 && <p className="p-2 text-sm text-white/40">손패 없음</p>}
    </div>
  );
}
