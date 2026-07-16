import type { OpponentView } from "../engine/clientView";
import { CardBack } from "./CardFace";

const MAX_VISIBLE_BACKS = 5;

export function OpponentStrip({
  opponents,
  currentTurnPlayerId,
}: {
  opponents: OpponentView[];
  currentTurnPlayerId: string | null;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto p-1">
      {opponents.map((o) => {
        const showBacks = !o.eliminated && !o.emptiedHand && o.cardCount > 0;
        const visibleCount = Math.min(o.cardCount, MAX_VISIBLE_BACKS);
        const overflow = o.cardCount - visibleCount;
        return (
          <div
            key={o.playerId}
            className={`flex min-w-28 shrink-0 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs ${
              o.playerId === currentTurnPlayerId ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"
            } ${o.eliminated ? "opacity-50" : ""}`}
          >
            <span className="font-semibold">{o.nickname}</span>

            {showBacks ? (
              <div className="flex h-9 items-center">
                {Array.from({ length: visibleCount }).map((_, i) => (
                  <div key={i} className={`h-9 w-6 ${i === 0 ? "" : "-ml-3"}`} style={{ zIndex: i }}>
                    <CardBack />
                  </div>
                ))}
                {overflow > 0 && <span className="ml-1.5 text-[10px] text-white/60">+{overflow}</span>}
              </div>
            ) : (
              <div className="flex h-9 items-center text-white/50">{o.eliminated ? "탈락" : "완료"}</div>
            )}

            <span className="text-white/70">{o.cardCount}장 남음</span>
            <span className="text-white/50">벌점 {o.cumulativePenalty}</span>
          </div>
        );
      })}
    </div>
  );
}
