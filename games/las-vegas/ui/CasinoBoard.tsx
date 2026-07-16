import { HOUSE, type CasinoState } from "../engine/types";

function formatBill(value: number): string {
  return `$${value / 1000}k`;
}

export function CasinoBoard({
  casino,
  playerNames,
  selfPlayerId,
}: {
  casino: CasinoState;
  playerNames: Record<string, string>;
  selfPlayerId: string;
}) {
  const bills = [...casino.bills].sort((a, b) => b.value - a.value);
  const diceEntries = Object.entries(casino.diceCounts).filter(([, count]) => (count ?? 0) > 0);

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/10 px-2 py-0.5 font-bold">{casino.number}</span>
        <div className="flex flex-wrap justify-end gap-1">
          {bills.map((b, i) => (
            <span key={i} className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-semibold text-emerald-200">
              {formatBill(b.value)}
            </span>
          ))}
        </div>
      </div>
      {diceEntries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {diceEntries.map(([owner, count]) => (
            <span
              key={owner}
              className={`rounded px-1.5 py-0.5 ${
                owner === selfPlayerId ? "bg-sky-500/30 text-sky-100" : "bg-white/10 text-white/70"
              }`}
            >
              {owner === HOUSE ? "🏠" : (playerNames[owner] ?? "?")} {count}
              🎲
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
