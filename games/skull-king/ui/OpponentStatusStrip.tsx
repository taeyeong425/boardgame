import type { OpponentHandStatus } from "../engine/clientView";

export interface SelfStatus {
  handCount: number;
  tricksWon: number;
  bid: number | null;
}

/** During bidding, "active" means still undecided (anyone can submit any time); during play it's
 * strictly whoever's turn it is. */
function isActive(
  roundPhase: "bidding" | "playing",
  waiting: boolean,
  isCurrentTurn: boolean
): boolean {
  return roundPhase === "bidding" ? waiting : isCurrentTurn;
}

export function OpponentStatusStrip({
  opponents,
  currentTurnPlayerId,
  roundPhase,
  self,
}: {
  opponents: OpponentHandStatus[];
  currentTurnPlayerId: string | null;
  roundPhase: "bidding" | "playing";
  self: SelfStatus;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto p-1">
      <div
        className={`flex min-w-24 shrink-0 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs ${
          isActive(roundPhase, self.bid === null, false) ? "border-sky-400 bg-sky-400/10" : "border-white/10"
        }`}
      >
        <span className="font-semibold">나</span>
        <span className="text-white/70">🂠 {self.handCount}장</span>
        <span className="text-white/70">🏆 {self.tricksWon}트릭</span>
        <span className="text-white/40">{self.bid !== null ? `예측 ${self.bid}` : "예측 전"}</span>
      </div>
      {opponents.map((o) => (
        <div
          key={o.playerId}
          className={`flex min-w-24 shrink-0 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs ${
            isActive(roundPhase, !o.bidSubmitted, o.playerId === currentTurnPlayerId)
              ? "border-emerald-400 bg-emerald-400/10"
              : "border-white/10"
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
