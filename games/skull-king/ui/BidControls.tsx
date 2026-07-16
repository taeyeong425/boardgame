"use client";

import { useState } from "react";

export function BidControls({
  maxBid,
  playable,
  onSubmit,
}: {
  maxBid: number;
  playable: boolean;
  onSubmit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(0);

  if (!playable) return null;

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3">
      <p className="text-xs text-white/60">이번 라운드에 몇 번 이길지 예측하세요 (0-{maxBid})</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setDraft((d) => Math.max(0, d - 1))}
          className="h-9 w-9 rounded-full bg-white/10 text-lg font-bold active:scale-95"
        >
          -
        </button>
        <span className="w-8 text-center text-2xl font-bold">{draft}</span>
        <button
          type="button"
          onClick={() => setDraft((d) => Math.min(maxBid, d + 1))}
          className="h-9 w-9 rounded-full bg-white/10 text-lg font-bold active:scale-95"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() => onSubmit(draft)}
        className="rounded-lg bg-emerald-500 px-6 py-2 font-semibold text-white active:scale-95"
      >
        베팅 확정
      </button>
    </div>
  );
}
