import type { Player } from "@/shared/types";

export function PlayerList({
  players,
  hostPlayerId,
  selfPlayerId,
  totals,
}: {
  players: Player[];
  hostPlayerId: string;
  selfPlayerId: string;
  totals: Record<string, number>;
}) {
  const sorted = [...players].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0));
  return (
    <ul className="flex flex-col gap-1">
      {sorted.map((p) => (
        <li key={p.id} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm">
          <span className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${p.connected ? "bg-emerald-400" : "bg-white/20"}`} />
            {p.nickname}
            {p.id === hostPlayerId && <span className="text-xs text-amber-400">호스트</span>}
            {p.id === selfPlayerId && <span className="text-xs text-white/40">나</span>}
          </span>
          <span className="font-semibold">{totals[p.id] ?? 0}점</span>
        </li>
      ))}
    </ul>
  );
}
