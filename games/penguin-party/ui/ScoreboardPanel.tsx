import { computeStandings } from "@/shared/scoring";

export function ScoreboardPanel({
  players,
  totals,
}: {
  players: { id: string; nickname: string }[];
  /** Room-wide cumulative points across every game played in this room (higher is better). */
  totals: Record<string, number>;
}) {
  const ids = players.map((p) => p.id);
  const standings = computeStandings(totals, "desc", ids);
  const sorted = [...players].sort((a, b) => (standings[a.id]?.rank ?? 0) - (standings[b.id]?.rank ?? 0));

  return (
    <div className="rounded-lg border border-white/10 p-3 text-sm">
      <h3 className="mb-2 font-semibold text-white/70">이 방 누적 순위</h3>
      <ol className="flex flex-col gap-1">
        {sorted.map((p) => (
          <li key={p.id} className="flex justify-between">
            <span>
              {standings[p.id]?.rank}위 {p.nickname}
            </span>
            <span>{totals[p.id] ?? 0}점</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
