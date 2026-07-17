"use client";

import { useEffect, useState } from "react";
import type { StartingDrawEntry } from "@/shared/types";

/** Shown once, right as a room's very first game starts (no prior winner to carry over yet) — a
 * visible draw instead of a silent random pick. Auto-dismisses; there's nothing to acknowledge. */
export function StartingDrawReveal({
  draw,
  playerNames,
}: {
  draw: StartingDrawEntry[];
  playerNames: Record<string, string>;
}) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;

  const maxValue = Math.max(...draw.map((d) => d.value));
  const ranked = [...draw].sort((a, b) => b.value - a.value);

  return (
    <div
      className="absolute inset-x-4 top-2 z-10 rounded-lg bg-black/90 p-3 text-sm text-white shadow-lg"
      onClick={() => setVisible(false)}
    >
      <p className="mb-2 text-center font-semibold">🎴 선 뽑기 — 가장 높은 숫자를 뽑은 사람부터 시작해요</p>
      <div className="flex flex-col gap-1">
        {ranked.map((d) => (
          <div
            key={d.playerId}
            className={`flex items-center justify-between rounded px-2 py-1 ${
              d.value === maxValue ? "bg-emerald-400/20 text-emerald-200" : "text-white/70"
            }`}
          >
            <span className="font-semibold">{playerNames[d.playerId] ?? "?"}</span>
            <span className="text-lg font-bold">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
