export function ScoreboardPanel({
  players,
}: {
  players: { id: string; nickname: string; cumulativePenalty: number }[];
}) {
  const sorted = [...players].sort((a, b) => a.cumulativePenalty - b.cumulativePenalty);
  return (
    <div className="rounded-lg border border-white/10 p-3 text-sm">
      <h3 className="mb-2 font-semibold text-white/70">이번 게임 누적 벌점 (낮을수록 좋음)</h3>
      <ol className="flex flex-col gap-1">
        {sorted.map((p) => (
          <li key={p.id} className="flex justify-between">
            <span>{p.nickname}</span>
            <span>{p.cumulativePenalty}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
