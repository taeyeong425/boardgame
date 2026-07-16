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
  return <GameShell code={code} room={room} />;
}
