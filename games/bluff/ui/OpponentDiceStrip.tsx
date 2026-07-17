import type { OpponentDiceView } from "../engine/clientView";

export interface SelfDiceStatus {
  diceCount: number;
  eliminated: boolean;
}

export function OpponentDiceStrip({
  opponents,
  currentTurnPlayerId,
  self,
}: {
  opponents: OpponentDiceView[];
  currentTurnPlayerId: string | null;
  self: SelfDiceStatus;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto p-1">
      <div
        className={`flex min-w-24 shrink-0 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs border-white/10 ${
          self.eliminated ? "opacity-50" : ""
        }`}
      >
        <span className="font-semibold">나</span>
        <span className="text-lg">🎲</span>
        <span className="text-white/70">{self.eliminated ? "탈락" : `${self.diceCount}개 남음`}</span>
      </div>
      {opponents.map((o) => (
        <div
          key={o.playerId}
          className={`flex min-w-24 shrink-0 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs ${
            o.playerId === currentTurnPlayerId ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"
          } ${o.eliminated ? "opacity-50" : ""}`}
        >
          <span className="font-semibold">{o.nickname}</span>
          <span className="text-lg">🎲</span>
          <span className="text-white/70">{o.eliminated ? "탈락" : `${o.diceCount}개 남음`}</span>
        </div>
      ))}
    </div>
  );
}
