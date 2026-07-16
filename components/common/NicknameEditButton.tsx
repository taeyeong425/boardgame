"use client";

import type { ClientMessage } from "@/shared/messages";

export function NicknameEditButton({
  currentNickname,
  sendMessage,
}: {
  currentNickname: string;
  sendMessage: (message: ClientMessage) => void;
}) {
  function handleClick() {
    const next = window.prompt("새 닉네임을 입력하세요", currentNickname);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === currentNickname) return;
    window.localStorage.setItem("boardgame:lastNickname", trimmed);
    sendMessage({ type: "changeNickname", nickname: trimmed });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60 active:scale-95"
    >
      ✏️ {currentNickname}
    </button>
  );
}
