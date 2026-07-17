import type { RoundScoreEntry } from "../engine/types";

interface PlayerStat {
  id: string;
  nickname: string;
  total: number;
  hits: number;
  misses: number;
}

function computeStats(
  players: { id: string; nickname: string }[],
  roundHistory: RoundScoreEntry[],
  cumulativeScores: Record<string, number>
): PlayerStat[] {
  return players
    .map((p) => {
      let hits = 0;
      let misses = 0;
      for (const entry of roundHistory) {
        const s = entry.scores[p.id];
        if (!s) continue;
        if (s.tricksWon === s.bid) hits++;
        else misses++;
      }
      return { id: p.id, nickname: p.nickname, total: cumulativeScores[p.id] ?? 0, hits, misses };
    })
    .sort((a, b) => b.total - a.total);
}

/** Skull King's own running score/hit-miss table for this game — distinct from the room-wide
 * cross-game CumulativeScoreboard, which only tracks rank points, not raw bid accuracy. */
export function SkullKingScoreboard({
  players,
  roundHistory,
  cumulativeScores,
}: {
  players: { id: string; nickname: string }[];
  roundHistory: RoundScoreEntry[];
  cumulativeScores: Record<string, number>;
}) {
  const stats = computeStats(players, roundHistory, cumulativeScores);

  return (
    <div className="rounded-lg border border-white/10 p-3 text-sm">
      <h3 className="mb-2 font-semibold text-white/70">이번 게임 성적</h3>
      <ol className="flex flex-col gap-1">
        {stats.map((s, i) => (
          <li key={s.id} className="flex items-center justify-between">
            <span>
              {i + 1}위 {s.nickname}
            </span>
            <span className="flex items-center gap-2 text-xs">
              <span className="text-emerald-300">적중 {s.hits}</span>
              <span className="text-red-300">실패 {s.misses}</span>
              <span className="font-semibold text-white">{s.total}점</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
