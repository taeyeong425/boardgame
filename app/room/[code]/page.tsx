"use client";

import { useSearchParams } from "next/navigation";
import { use, useState } from "react";
import { GameShell } from "@/components/game-shell/GameShell";
import { NicknameGate } from "@/components/lobby/NicknameGate";
import { useRoomSocket } from "@/hooks/useRoomSocket";

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const searchParams = useSearchParams();
  const intent: "create" | "join" = searchParams.get("intent") === "create" ? "create" : "join";
  const [nickname, setNickname] = useState<string | null>(searchParams.get("nickname"));

  if (!nickname) {
    return <NicknameGate onSubmit={setNickname} />;
  }

  return <RoomConnected code={code.toUpperCase()} nickname={nickname} intent={intent} />;
}

function RoomConnected({ code, nickname, intent }: { code: string; nickname: string; intent: "create" | "join" }) {
  const room = useRoomSocket({ code, nickname, intent });
  // Navigating away unmounts this component, whose effect cleanup closes the socket — the
  // server's onClose already marks the seat disconnected (keeping score/seat for reconnects),
  // so there's no separate "leave" message needed, just leave the page. Plain navigation (not
  // router.push) for the same reason as CreateRoomForm/JoinRoomForm.
  return <GameShell code={code} room={room} onLeaveRoom={() => (window.location.href = "/")} />;
}
