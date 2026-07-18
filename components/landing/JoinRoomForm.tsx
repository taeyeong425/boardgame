"use client";

import { useState, type FormEvent } from "react";
import { isValidRoomCode, normalizeRoomCode } from "@/shared/roomCode";

export function JoinRoomForm() {
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState(() =>
    typeof window !== "undefined" ? (window.localStorage.getItem("boardgame:lastNickname") ?? "") : ""
  );
  const [error, setError] = useState<string | null>(null);

  function handleJoin(e: FormEvent) {
    e.preventDefault();
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) {
      setError("올바른 방 코드를 입력하세요.");
      return;
    }
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("닉네임을 입력하세요.");
      return;
    }
    window.localStorage.setItem("boardgame:lastNickname", trimmed);
    const params = new URLSearchParams({ nickname: trimmed });
    // Plain full-page navigation — see CreateRoomForm for why this replaces router.push.
    window.location.href = `/room/${normalized}?${params.toString()}`;
  }

  return (
    <form onSubmit={handleJoin} className="flex flex-col gap-3">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="방 코드"
        maxLength={5}
        className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-lg tracking-widest"
      />
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="닉네임"
        maxLength={16}
        className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-lg"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" className="rounded-lg bg-sky-500 px-4 py-3 text-lg font-semibold text-white active:scale-95">
        참가하기
      </button>
    </form>
  );
}
