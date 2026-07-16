import type { OpponentHandStatus } from "../engine/clientView";

export function OpponentStatusStrip({
  opponents,
  currentTurnPlayerId,
}: {
  opponents: OpponentHandStatus[];
  currentTurnPlayerId: string | null;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto p-1">
      {opponents.map((o) => (
        <div
          key={o.playerId}
          className={`flex min-w-24 shrink-0 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs ${
            o.playerId === currentTurnPlayerId ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"
          }`}
        >
          <span className="font-semibold">{o.nickname}</span>
          <span className="text-white/70">🂠 {o.handCount}장</span>
          <span className="text-white/70">🏆 {o.tricksWon}트릭</span>
          <span className="text-white/40">{o.bid !== null ? `예측 ${o.bid}` : o.bidSubmitted ? "예측 완료 (비공개)" : "예측 중..."}</span>
        </div>
      ))}
    </div>
  );
}
