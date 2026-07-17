import type { OpponentDiceView } from "../engine/clientView";

/** Combines turn order (seat 1, 2, 3...) and each player's remaining dice into a single strip —
 * no need for a separate order chart and a separate dice-count chart when one card per player
 * already carries both. Grid-based (not a scrolling row) so 4 players fit on one mobile screen. */
export function PlayerOrderStrip({
  turnOrder,
  playerNames,
  currentTurnPlayerId,
  selfPlayerId,
  selfDiceCount,
  selfEliminated,
  opponents,
  totalDiceRemaining,
}: {
  turnOrder: string[];
  playerNames: Record<string, string>;
  currentTurnPlayerId: string | null;
  selfPlayerId: string;
  selfDiceCount: number;
  selfEliminated: boolean;
  opponents: OpponentDiceView[];
  totalDiceRemaining: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-right text-[10px] text-white/30">🎲 전체 {totalDiceRemaining}개 남음</p>
      <div className="grid grid-cols-4 gap-1.5">
        {turnOrder.map((id, i) => {
          const isSelf = id === selfPlayerId;
          const isCurrent = id === currentTurnPlayerId;
          const opponent = opponents.find((o) => o.playerId === id);
          const diceCount = isSelf ? selfDiceCount : (opponent?.diceCount ?? 0);
          const eliminated = isSelf ? selfEliminated : (opponent?.eliminated ?? false);
          return (
            <div
              key={id}
              className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs ${
                isCurrent
                  ? "border-emerald-400 bg-emerald-400/10"
                  : isSelf
                    ? "border-sky-400/50 bg-sky-400/5"
                    : "border-white/10"
              } ${eliminated ? "opacity-50" : ""}`}
            >
              <span className="text-[9px] text-white/40">{i + 1}번</span>
              <span className="truncate font-semibold">{isSelf ? "나" : (playerNames[id] ?? "?")}</span>
              <span className="text-lg">🎲</span>
              <span className="text-white/70">{eliminated ? "탈락" : `${diceCount}개`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
