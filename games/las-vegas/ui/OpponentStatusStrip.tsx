import type { OpponentDiceStatus } from "../engine/clientView";

export interface SelfDiceBillStatus {
  diceRemaining: number;
  billCount: number;
}

export function OpponentStatusStrip({
  opponents,
  currentTurnPlayerId,
  self,
  turnOrder,
  selfPlayerId,
}: {
  opponents: OpponentDiceStatus[];
  currentTurnPlayerId: string | null;
  self: SelfDiceBillStatus;
  turnOrder: string[];
  selfPlayerId: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {turnOrder.map((id, i) => {
        if (id === selfPlayerId) {
          return (
            <div
              key={id}
              className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs ${
                selfPlayerId === currentTurnPlayerId ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"
              }`}
            >
              <span className="text-[9px] text-white/40">{i + 1}번</span>
              <span className="truncate font-semibold">나</span>
              <span className="text-white/70">🎲 {self.diceRemaining}</span>
              <span className="text-white/40">💵 {self.billCount}장</span>
            </div>
          );
        }
        const o = opponents.find((op) => op.playerId === id);
        if (!o) return null;
        return (
          <div
            key={id}
            className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs ${
              o.playerId === currentTurnPlayerId ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"
            }`}
          >
            <span className="text-[9px] text-white/40">{i + 1}번</span>
            <span className="truncate font-semibold">{o.nickname}</span>
            <span className="text-white/70">🎲 {o.diceRemaining}</span>
            <span className="text-white/40">💵 {o.billCount}장</span>
          </div>
        );
      })}
    </div>
  );
}
