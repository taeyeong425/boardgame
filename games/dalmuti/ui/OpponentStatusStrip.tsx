import type { OpponentStatus } from "../engine/clientView";

export interface SelfStatus {
  handCount: number;
  socialRankTitle: string;
  finished: boolean;
  finishRank: number | null;
}

export function OpponentStatusStrip({
  opponents,
  currentTurnPlayerId,
  self,
  turnOrder,
  selfPlayerId,
}: {
  opponents: OpponentStatus[];
  currentTurnPlayerId: string | null;
  self: SelfStatus;
  turnOrder: string[];
  selfPlayerId: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {turnOrder.map((id, i) => {
        const isSelf = id === selfPlayerId;
        const o = isSelf ? null : opponents.find((op) => op.playerId === id);
        if (!isSelf && !o) return null;
        const nickname = isSelf ? "나" : o!.nickname;
        const handCount = isSelf ? self.handCount : o!.handCount;
        const rankTitle = isSelf ? self.socialRankTitle : o!.socialRankTitle;
        const finished = isSelf ? self.finished : o!.finished;
        const finishRank = isSelf ? self.finishRank : o!.finishRank;
        const active = id === currentTurnPlayerId;
        return (
          <div
            key={id}
            className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs ${
              active ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"
            } ${finished ? "opacity-60" : ""}`}
          >
            <span className="text-[10px] font-bold text-white/40">{i + 1}번</span>
            <span className="truncate font-semibold">{nickname}</span>
            <span className="text-white/70">{rankTitle}</span>
            {finished ? (
              <span className="text-emerald-300">완료{finishRank ? ` (${finishRank}위)` : ""}</span>
            ) : (
              <span className="text-white/70">🂠 {handCount}장</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
