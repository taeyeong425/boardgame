"use client";

import type { ConnectionStatus } from "@/hooks/useRoomSocket";
import type { ClientMessage, PublicRoomState } from "@/shared/messages";
import { GamePicker } from "./GamePicker";
import { PlayerList } from "./PlayerList";

export function LobbyScreen({
  code,
  publicState,
  selfPlayerId,
  isHost,
  status,
  lastError,
  sendMessage,
}: {
  code: string;
  publicState: PublicRoomState;
  selfPlayerId: string;
  isHost: boolean;
  status: ConnectionStatus;
  lastError: { code: string; message: string } | null;
  sendMessage: (message: ClientMessage) => void;
}) {
  const players = Object.values(publicState.players);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-10">
      <div>
        <p className="text-sm text-white/50">방 코드 (친구에게 공유하세요)</p>
        <p className="text-4xl font-bold tracking-widest">{code}</p>
        {status !== "open" && <p className="mt-1 text-xs text-amber-400">연결 상태: {status}</p>}
        {lastError && <p className="mt-1 text-xs text-red-400">{lastError.message}</p>}
      </div>

      <PlayerList players={players} hostPlayerId={publicState.hostPlayerId} selfPlayerId={selfPlayerId} totals={publicState.totals} />

      <GamePicker
        isHost={isHost}
        playerCount={players.length}
        currentGameId={publicState.currentGameId}
        onSelectGame={(gameId) => sendMessage({ type: "selectGame", gameId })}
        onStartGame={() => sendMessage({ type: "startGame" })}
      />

      {!isHost && <p className="text-center text-xs text-white/40">호스트가 게임을 고르고 시작할 수 있어요.</p>}
    </main>
  );
}
