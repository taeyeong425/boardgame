"use client";

import { useState, type FormEvent } from "react";

export function NicknameGate({ onSubmit }: { onSubmit: (nickname: string) => void }) {
  const [nickname, setNickname] = useState(() =>
    typeof window !== "undefined" ? (window.localStorage.getItem("boardgame:lastNickname") ?? "") : ""
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) return;
    window.localStorage.setItem("boardgame:lastNickname", trimmed);
    onSubmit(trimmed);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-bold">닉네임을 입력하세요</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          autoFocus
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={16}
          placeholder="닉네임"
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-lg"
        />
        <button type="submit" className="rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white active:scale-95">
          입장하기
        </button>
      </form>
    </main>
  );
}
