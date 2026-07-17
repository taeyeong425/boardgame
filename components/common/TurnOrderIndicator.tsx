/** Shows the table's fixed seating/turn order (1번, 2번, ...) including the viewer's own seat, so
 * everyone can see who plays right before and after them without cross-referencing the opponent
 * strip below. Shared across all games since every GameModule's client state exposes turnOrder +
 * currentTurnPlayerId in the same shape. */
export function TurnOrderIndicator({
  turnOrder,
  playerNames,
  currentTurnPlayerId,
  selfPlayerId,
  eliminatedIds = [],
}: {
  turnOrder: string[];
  playerNames: Record<string, string>;
  currentTurnPlayerId: string | null;
  selfPlayerId: string;
  eliminatedIds?: string[];
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto p-1">
      {turnOrder.map((id, i) => {
        const isSelf = id === selfPlayerId;
        const isCurrent = id === currentTurnPlayerId;
        const isEliminated = eliminatedIds.includes(id);
        return (
          <div key={id} className="flex shrink-0 items-center gap-1">
            <div
              className={`flex flex-col items-center rounded-md border px-2 py-1 text-xs ${
                isCurrent
                  ? "border-emerald-400 bg-emerald-400/10"
                  : isSelf
                    ? "border-sky-400/50 bg-sky-400/5"
                    : "border-white/10"
              } ${isEliminated ? "opacity-40" : ""}`}
            >
              <span className="text-[9px] text-white/40">{i + 1}번</span>
              <span className="whitespace-nowrap font-semibold">{isSelf ? "나" : (playerNames[id] ?? "?")}</span>
            </div>
            {i < turnOrder.length - 1 && <span className="text-xs text-white/20">→</span>}
          </div>
        );
      })}
    </div>
  );
}
