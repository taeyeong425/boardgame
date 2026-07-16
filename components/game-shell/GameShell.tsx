"use client";

import { gameUiRegistry } from "@/games/registry";
import type { UseRoomSocketResult } from "@/hooks/useRoomSocket";
import { LobbyScreen } from "../lobby/LobbyScreen";
import { RoundEndScreen } from "./RoundEndScreen";
import { TurnTimerBadge } from "./TurnTimerBadge";

export function GameShell({ code, room }: { code: string; room: UseRoomSocketResult }) {
  const { publicState, gameState, selfPlayerId, status, lastError, sendMessage } = room;

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
      />
    );
  }

  if (publicState.phase === "round-end") {
    return <RoundEndScreen publicState={publicState} selfPlayerId={selfPlayerId} isHost={isHost} sendMessage={sendMessage} />;
  }

  // phase === "in-game"
  const GameComponent = publicState.currentGameId ? gameUiRegistry[publicState.currentGameId] : undefined;
  if (!GameComponent || gameState === null || gameState === undefined) {
    return <div className="flex min-h-dvh items-center justify-center text-white/60">게임 로딩 중...</div>;
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-3 px-3 py-4">
      {status !== "open" && <p className="text-center text-xs text-amber-400">연결 상태: {status}</p>}
      <TurnTimerBadge turnDeadline={publicState.turnDeadline} />
      <GameComponent
        selfPlayerId={selfPlayerId}
        isHost={isHost}
        gameState={gameState}
        turnDeadline={publicState.turnDeadline}
        sendAction={(action) => sendMessage({ type: "gameAction", action })}
      />
    </div>
  );
}
