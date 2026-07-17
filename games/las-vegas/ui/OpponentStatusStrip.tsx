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
    <div className="flex gap-2 overflow-x-auto p-1">
      <div className="flex min-w-24 shrink-0 flex-col items-center gap-1 rounded-lg border border-white/10 px-2 py-2 text-xs">
        <span className="text-[9px] text-white/40">{turnOrder.indexOf(selfPlayerId) + 1}번</span>
        <span className="font-semibold">나</span>
        <span className="text-white/70">🎲 {self.diceRemaining}</span>
        <span className="text-white/40">💵 {self.billCount}장 (비공개)</span>
      </div>
      {opponents.map((o) => (
        <div
          key={o.playerId}
          className={`flex min-w-24 shrink-0 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs ${
            o.playerId === currentTurnPlayerId ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"
          }`}
        >
          <span className="text-[9px] text-white/40">{turnOrder.indexOf(o.playerId) + 1}번</span>
          <span className="font-semibold">{o.nickname}</span>
          <span className="text-white/70">🎲 {o.diceRemaining}</span>
          <span className="text-white/40">💵 {o.billCount}장 (비공개)</span>
        </div>
      ))}
    </div>
  );
}
