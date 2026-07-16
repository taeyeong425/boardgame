import { computeStandings } from "@/shared/scoring";
import type { Player } from "@/shared/types";

export function PlayerList({
  players,
  hostPlayerId,
  selfPlayerId,
  totals,
  isSelfHost,
  isLobby,
  onTransferHost,
}: {
  players: Player[];
  hostPlayerId: string;
  selfPlayerId: string;
  totals: Record<string, number>;
  isSelfHost: boolean;
  isLobby: boolean;
  onTransferHost: (playerId: string) => void;
}) {
  const ids = players.map((p) => p.id);
  const standings = computeStandings(totals, "desc", ids); // higher cumulative points = better rank
  const sorted = [...players].sort((a, b) => (standings[a.id]?.rank ?? 0) - (standings[b.id]?.rank ?? 0));

  return (
    <ul className="flex flex-col gap-1">
      {sorted.map((p) => (
        <li key={p.id} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm">
          <span className="flex items-center gap-2">
            <span className="text-white/40">{standings[p.id]?.rank ?? "-"}위</span>
            <span className={`h-2 w-2 rounded-full ${p.connected ? "bg-emerald-400" : "bg-white/20"}`} />
            {p.nickname}
            {p.id === hostPlayerId && <span className="text-xs text-amber-400">호스트</span>}
            {p.id === selfPlayerId && <span className="text-xs text-white/40">나</span>}
          </span>
          <span className="flex items-center gap-2">
            <span className="font-semibold">{totals[p.id] ?? 0}점</span>
            {isSelfHost && isLobby && p.id !== hostPlayerId && (
              <button
                type="button"
                onClick={() => onTransferHost(p.id)}
                className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/60 active:scale-95"
              >
                호스트로 지정
              </button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
