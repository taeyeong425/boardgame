import type { Card } from "../engine/types";
import { CardFace } from "./CardFace";

export function HandView({
  hand,
  legalIds,
  playable,
  onPlay,
}: {
  hand: Card[];
  legalIds: string[];
  playable: boolean;
  onPlay: (card: Card) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2">
      {hand.map((card) => {
        const legal = playable && legalIds.includes(card.id);
        return (
          <button
            key={card.id}
            type="button"
            disabled={!legal}
            onClick={() => onPlay(card)}
            className={`transition active:scale-95 ${legal ? "" : "opacity-40"}`}
          >
            <CardFace card={card} />
          </button>
        );
      })}
    </div>
  );
}
