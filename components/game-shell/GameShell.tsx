"use client";

import { NicknameEditButton } from "@/components/common/NicknameEditButton";
import { gameUiRegistry } from "@/games/registry";
import type { UseRoomSocketResult } from "@/hooks/useRoomSocket";
import { LobbyScreen } from "../lobby/LobbyScreen";
import { RoundEndScreen } from "./RoundEndScreen";
import { StartingDrawReveal } from "./StartingDrawReveal";
import { TurnTimerBadge } from "./TurnTimerBadge";

export function GameShell({
  code,
  room,
  onLeaveRoom,
}: {
  code: string;
  room: UseRoomSocketResult;
  onLeaveRoom: () => void;
}) {
  const { publicState, gameState, selfPlayerId, status, lastError, sendMessage, kicked } = room;

  if (kicked) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-white/80">호스트가 당신을 방에서 내보냈어요.</p>
        <button
          type="button"
          onClick={onLeaveRoom}
          className="rounded-lg bg-emerald-500 px-6 py-2 font-semibold text-white active:scale-95"
        >
          처음으로
        </button>
      </div>
    );
  }

  if (!publicState) {
    return <div className="flex min-h-dvh items-center justify-center text-white/60">연결 중...</div>;
  }

  const isHost = publicState.hostPlayerId === selfPlayerId;

  if (publicState.phase === "lobby") {
    return (
      <LobbyScreen
        code={code}
        publicState={publicState}
        selfPlayerId={selfPlayerId}
        isHost={isHost}
        status={status}
        lastError={lastError}
        sendMessage={sendMessage}
        onLeaveRoom={onLeaveRoom}
      />
    );
  }

  if (publicState.phase === "round-end") {
    return <RoundEndScreen publicState={publicState} selfPlayerId={selfPlayerId} isHost={isHost} sendMessage={sendMessage} />;
  }

  // phase === "in-game" or "game-over" — both render the game's own board (frozen once over)
  const GameComponent = publicState.currentGameId ? gameUiRegistry[publicState.currentGameId] : undefined;
  if (!GameComponent || gameState === null || gameState === undefined) {
    return <div className="flex min-h-dvh items-center justify-center text-white/60">게임 로딩 중...</div>;
  }

  function handleLeaveToLobby() {
    if (window.confirm("정말 게임을 종료하고 로비로 돌아갈까요? 이번 게임 결과는 저장되지 않아요.")) {
      sendMessage({ type: "backToLobby" });
    }
  }

  const playerNames = Object.fromEntries(
    Object.values(publicState.players).map((p) => [p.id, p.nickname])
  );

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col gap-3 px-3 py-4">
      {publicState.startingPlayerDraw && (
        <StartingDrawReveal draw={publicState.startingPlayerDraw} playerNames={playerNames} />
      )}
      {status !== "open" && <p className="text-center text-xs text-amber-400">연결 상태: {status}</p>}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isHost && (
            <button
              type="button"
              onClick={handleLeaveToLobby}
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60 active:scale-95"
            >
              로비로 나가기
            </button>
          )}
          <NicknameEditButton currentNickname={publicState.players[selfPlayerId]?.nickname ?? ""} sendMessage={sendMessage} />
        </div>
        <TurnTimerBadge turnDeadline={publicState.turnDeadline} />
      </div>

      {publicState.phase === "game-over" && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3">
          <p className="text-sm text-emerald-200">게임 종료! 결과로 넘어가기 전에 마지막 상황을 확인해보세요.</p>
          <button
            type="button"
            onClick={() => sendMessage({ type: "showResults" })}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white active:scale-95"
          >
            결과 보기
          </button>
        </div>
      )}

      <GameComponent
        selfPlayerId={selfPlayerId}
        isHost={isHost}
        gameState={gameState}
        turnDeadline={publicState.turnDeadline}
        roomTotals={publicState.totals}
        sendAction={(action) => sendMessage({ type: "gameAction", action })}
      />
    </div>
  );
}
