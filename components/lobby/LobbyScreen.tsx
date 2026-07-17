"use client";

import { NicknameEditButton } from "@/components/common/NicknameEditButton";
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
  onLeaveRoom,
}: {
  code: string;
  publicState: PublicRoomState;
  selfPlayerId: string;
  isHost: boolean;
  status: ConnectionStatus;
  lastError: { code: string; message: string } | null;
  sendMessage: (message: ClientMessage) => void;
  onLeaveRoom: () => void;
}) {
  const players = Object.values(publicState.players);

  function handleLeaveRoom() {
    if (window.confirm("정말 이 방을 나갈까요? 다시 들어오려면 방 코드가 필요해요.")) {
      onLeaveRoom();
    }
  }

  function handleKickPlayer(playerId: string) {
    const nickname = publicState.players[playerId]?.nickname ?? "이 플레이어";
    if (window.confirm(`${nickname}님을 방에서 내보낼까요?`)) {
      sendMessage({ type: "kickPlayer", playerId });
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/50">방 코드 (친구에게 공유하세요)</p>
          <p className="text-4xl font-bold tracking-widest">{code}</p>
          {status !== "open" && <p className="mt-1 text-xs text-amber-400">연결 상태: {status}</p>}
          {lastError && <p className="mt-1 text-xs text-red-400">{lastError.message}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <NicknameEditButton currentNickname={publicState.players[selfPlayerId]?.nickname ?? ""} sendMessage={sendMessage} />
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60 active:scale-95"
          >
            방 나가기
          </button>
        </div>
      </div>

      <PlayerList
        players={players}
        hostPlayerId={publicState.hostPlayerId}
        selfPlayerId={selfPlayerId}
        totals={publicState.totals}
        isSelfHost={isHost}
        isLobby={publicState.phase === "lobby"}
        onTransferHost={(playerId) => sendMessage({ type: "transferHost", playerId })}
        onKickPlayer={handleKickPlayer}
      />

      {publicState.nextStartingPlayerId && (
        <p className="-mt-3 text-center text-xs text-white/50">
          다음 게임은{" "}
          <span className="font-semibold text-white/80">
            {publicState.players[publicState.nextStartingPlayerId]?.nickname ?? "?"}
          </span>
          님부터 시작해요 (직전 게임 1등).
        </p>
      )}

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
