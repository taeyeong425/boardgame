"use client";

import { GAME_CATALOG } from "@/shared/gameCatalog";
import type { ClientMessage, PublicRoomState } from "@/shared/messages";

export function RoundEndScreen({
  publicState,
  selfPlayerId,
  isHost,
  sendMessage,
}: {
  publicState: PublicRoomState;
  selfPlayerId: string;
  isHost: boolean;
  sendMessage: (message: ClientMessage) => void;
}) {
  const lastEntry = publicState.scoreLedger[publicState.scoreLedger.length - 1];
  const players = Object.values(publicState.players);
  const gameDisplayName = lastEntry ? (GAME_CATALOG.find((g) => g.id === lastEntry.gameId)?.displayName ?? lastEntry.gameId) : "";

  const rows = players
    .map((p) => ({
      player: p,
      rank: lastEntry?.ranks[p.id] ?? 0,
      points: lastEntry?.points[p.id] ?? 0,
      total: publicState.totals[p.id] ?? 0,
    }))
    .sort((a, b) => a.rank - b.rank);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-bold">{gameDisplayName} 결과</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/50">
              <th className="pb-2">순위</th>
              <th className="pb-2">닉네임</th>
              <th className="pb-2">획득 점수</th>
              <th className="pb-2">누적</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.player.id} className={r.player.id === selfPlayerId ? "font-bold" : ""}>
                <td className="py-1">{r.rank}</td>
                <td className="py-1">{r.player.nickname}</td>
                <td className="py-1">+{r.points}</td>
                <td className="py-1">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {publicState.nextStartingPlayerId && (
        <p className="text-center text-sm text-white/50">
          다음 게임은{" "}
          <span className="font-semibold text-white/80">
            {publicState.players[publicState.nextStartingPlayerId]?.nickname ?? "?"}
          </span>
          님부터 시작해요.
        </p>
      )}

      {isHost ? (
        <button
          type="button"
          onClick={() => sendMessage({ type: "backToLobby" })}
          className="rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white active:scale-95"
        >
          로비로 돌아가기
        </button>
      ) : (
        <p className="text-center text-sm text-white/50">호스트가 다음 게임을 준비하고 있어요...</p>
      )}
    </main>
  );
}
