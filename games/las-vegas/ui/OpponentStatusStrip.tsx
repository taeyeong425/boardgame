import type { OpponentDiceStatus } from "../engine/clientView";

export function OpponentStatusStrip({
  opponents,
  currentTurnPlayerId,
}: {
  opponents: OpponentDiceStatus[];
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
          <span className="text-white/70">🎲 {o.diceRemaining}</span>
          <span className="text-white/40">💵 {o.billCount}장 (비공개)</span>
        </div>
      ))}
    </div>
  );
}
