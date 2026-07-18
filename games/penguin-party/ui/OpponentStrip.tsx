import type { OpponentView } from "../engine/clientView";
import { CardBack } from "./CardFace";

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
  return (
    <div
      className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs ${
        highlighted ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"
      } ${eliminated ? "opacity-50" : ""}`}
    >
      <span className="text-[10px] font-bold text-white/40">{seatNumber}번</span>
      <span className="truncate font-semibold">{label}</span>
      <div className="flex h-9 w-6 items-center justify-center">
        {eliminated || emptiedHand ? (
          <span className="text-[10px] text-white/50">{eliminated ? "탈락" : "완료"}</span>
        ) : (
          <CardBack />
        )}
      </div>
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
    <div className="grid grid-cols-4 gap-1.5">
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
              highlighted={selfPlayerId === currentTurnPlayerId}
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
