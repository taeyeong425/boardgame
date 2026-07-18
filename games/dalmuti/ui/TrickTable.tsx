import type { Card } from "../engine/types";
import { CardFace } from "./CardFace";

export function TrickTable({
  trick,
  playerNames,
}: {
  trick: { lastPlayerId: string; cards: Card[] } | null;
  playerNames: Record<string, string>;
}) {
  if (!trick) {
    return (
      <div className="flex h-20 items-center justify-center text-xs text-white/40">
        아직 낸 카드가 없어요 — 원하는 카드를 내세요
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex flex-wrap justify-center gap-1.5">
        {trick.cards.map((card) => (
          <CardFace key={card.id} card={card} size="sm" />
        ))}
      </div>
      <span className="text-[10px] text-white/60">{playerNames[trick.lastPlayerId] ?? "?"}님이 냄 — 이걸 이겨야 해요</span>
    </div>
  );
}
