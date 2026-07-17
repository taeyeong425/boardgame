import type { OpponentView } from "../engine/clientView";
import { CardBack } from "./CardFace";

const MAX_VISIBLE_BACKS = 5;

export interface SelfStripStatus {
  cardCount: number;
  eliminated: boolean;
  emptiedHand: boolean;
}

function StripCard({
  seatNumber,
  label,
  cardCount,
  eliminated,
  emptiedHand,
  highlighted,
}: {
  seatNumber: number;
  label: string;
  cardCount: number;
  eliminated: boolean;
  emptiedHand: boolean;
  highlighted: boolean;
}) {
  const showBacks = !eliminated && !emptiedHand && cardCount > 0;
  const visibleCount = Math.min(cardCount, MAX_VISIBLE_BACKS);
  const overflow = cardCount - visibleCount;
  return (
    <div
      className={`flex min-w-28 shrink-0 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs ${
        highlighted ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"
      } ${eliminated ? "opacity-50" : ""}`}
    >
      <span className="text-[9px] text-white/40">{seatNumber}번</span>
      <span className="font-semibold">{label}</span>

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
        <div className="flex h-9 items-center text-white/50">{eliminated ? "탈락" : "완료"}</div>
      )}

      <span className="text-white/70">{cardCount}장 남음</span>
    </div>
  );
}

export function OpponentStrip({
  opponents,
  currentTurnPlayerId,
  self,
  turnOrder,
  selfPlayerId,
}: {
  opponents: OpponentView[];
  currentTurnPlayerId: string | null;
  self: SelfStripStatus;
  turnOrder: string[];
  selfPlayerId: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto p-1">
      {turnOrder.map((id, i) => {
        if (id === selfPlayerId) {
          return (
            <StripCard
              key={id}
              seatNumber={i + 1}
              label="나"
              cardCount={self.cardCount}
              eliminated={self.eliminated}
              emptiedHand={self.emptiedHand}
              highlighted={false}
            />
          );
        }
        const o = opponents.find((op) => op.playerId === id);
        if (!o) return null;
        return (
          <StripCard
            key={id}
            seatNumber={i + 1}
            label={o.nickname}
            cardCount={o.cardCount}
            eliminated={o.eliminated}
            emptiedHand={o.emptiedHand}
            highlighted={o.playerId === currentTurnPlayerId}
          />
        );
      })}
    </div>
  );
}
