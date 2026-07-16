"use client";

import { useEffect, useState } from "react";

export function TurnTimerBadge({ turnDeadline }: { turnDeadline: number | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (turnDeadline === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [turnDeadline]);

  if (turnDeadline === null) return null;

  const remainingMs = Math.max(0, turnDeadline - now);
  const seconds = Math.ceil(remainingMs / 1000);
  const urgent = seconds <= 10;

  return (
    <div
      className={`self-end rounded-full px-3 py-1 text-xs font-semibold ${
        urgent ? "bg-red-500/80 text-white" : "bg-white/10 text-white/70"
      }`}
    >
      ⏱ {seconds}s
    </div>
  );
}
