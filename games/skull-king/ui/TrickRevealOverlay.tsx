import type { TrickReveal } from "../engine/types";
import { CardFace } from "./CardFace";

export function TrickRevealOverlay({
  reveal,
  playerNames,
  selfPlayerId,
  onNext,
}: {
  reveal: TrickReveal;
  playerNames: Record<string, string>;
  selfPlayerId: string;
  onNext: () => void;
}) {
  const winnerName = playerNames[reveal.trick.winnerId] ?? "?";

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-lg bg-black/95 p-4 text-white">
      <p className="text-xs text-white/50">이번 트릭 결과</p>

      <div className="flex flex-wrap justify-center gap-3">
        {reveal.trick.plays.map((play) => {
          const isWinner = play.playerId === reveal.trick.winnerId;
          return (
            <div key={play.playerId} className="flex flex-col items-center gap-1">
              <div className={isWinner ? "rounded ring-2 ring-amber-400" : "opacity-60"}>
                <CardFace card={play.card} />
              </div>
              <span className={`text-xs ${isWinner ? "font-bold text-amber-300" : "text-white/60"}`}>
                {playerNames[play.playerId] ?? "?"}
                {isWinner && " 👑"}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-lg font-bold">
        {winnerName} 승리!{reveal.trick.bonusPoints > 0 && <span className="ml-1 text-amber-300">(+보너스 {reveal.trick.bonusPoints})</span>}
      </p>

      <div className="flex flex-col gap-1 rounded-lg border border-white/10 p-3 text-sm">
        {reveal.standings.map((s) => (
          <div key={s.playerId} className="flex items-center justify-between gap-6">
            <span>{s.playerId === selfPlayerId ? "나" : (playerNames[s.playerId] ?? "?")}</span>
            <span className="text-white/70">
              예측 {s.bid} / 실제 {s.tricksWon}승
            </span>
          </div>
        ))}
      </div>

      <button type="button" onClick={onNext} className="rounded-lg bg-emerald-500 px-8 py-2 font-semibold text-white active:scale-95">
        다음
      </button>
    </div>
  );
}
