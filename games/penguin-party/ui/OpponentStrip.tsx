import type { OpponentView } from "../engine/clientView";

export function OpponentStrip({
  opponents,
  currentTurnPlayerId,
}: {
  opponents: OpponentView[];
  currentTurnPlayerId: string | null;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto p-1">
      {opponents.map((o) => (
        <div
          key={o.playerId}
          className={`flex min-w-24 shrink-0 flex-col items-center rounded-lg border px-2 py-1 text-xs ${
            o.playerId === currentTurnPlayerId ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"
          } ${o.eliminated ? "opacity-50" : ""}`}
        >
          <span className="font-semibold">{o.nickname}</span>
          <span>{o.eliminated ? "탈락" : o.emptiedHand ? "완료" : `카드 ${o.cardCount}장`}</span>
          <span className="text-white/50">벌점 {o.cumulativePenalty}</span>
        </div>
      ))}
    </div>
  );
}
