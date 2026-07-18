"use client";

import { useState, type FormEvent } from "react";
import { generateRoomCode } from "@/shared/roomCode";

export function CreateRoomForm() {
  const [nickname, setNickname] = useState(() =>
    typeof window !== "undefined" ? (window.localStorage.getItem("boardgame:lastNickname") ?? "") : ""
  );
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("닉네임을 입력하세요.");
      return;
    }
    window.localStorage.setItem("boardgame:lastNickname", trimmed);
    const code = generateRoomCode();
    const params = new URLSearchParams({ intent: "create", nickname: trimmed });
    // A plain full-page navigation instead of router.push: there's no shared layout/state to
    // preserve across this transition, and it skips the client-side RSC-fetch-then-fallback path
    // that (on a flaky connection) can fail and land on the browser's own network-error page.
    window.location.href = `/room/${code}?${params.toString()}`;
  }

  return (
    <form onSubmit={handleCreate} className="flex flex-col gap-3">
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="닉네임"
        maxLength={16}
        className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-lg"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" className="rounded-lg bg-emerald-500 px-4 py-3 text-lg font-semibold text-white active:scale-95">
        방 만들기
      </button>
    </form>
  );
}
