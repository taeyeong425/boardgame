"use client";

import { useEffect, useState } from "react";
import type { RoundSummary } from "../engine/types";

export function RoundResultOverlay({
  summary,
  playerNames,
}: {
  summary: RoundSummary | undefined;
  playerNames: Record<string, string>;
}) {
  if (!summary) return null;
  // Keying on roundNumber remounts this on every new round, so "visible" naturally resets to
  // true per round without needing to setState in response to a prop change.
  return <RoundResultOverlayInner key={summary.roundNumber} summary={summary} playerNames={playerNames} />;
}

function RoundResultOverlayInner({ summary, playerNames }: { summary: RoundSummary; playerNames: Record<string, string> }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-x-4 top-2 z-10 rounded-lg bg-black/85 p-3 text-sm text-white shadow-lg"
      onClick={() => setVisible(false)}
    >
      <p className="mb-1 font-semibold">{summary.roundNumber}라운드 결과</p>
      {summary.events.length === 0 && <p className="text-white/60">변동 없음</p>}
      {summary.events.map((e, i) => (
        <p key={i} className="text-white/80">
          {playerNames[e.playerId] ?? e.playerId}{" "}
          {e.reason === "eliminated" ? `탈락 (벌점 +${e.delta})` : `완주 보너스 (${e.delta})`}
        </p>
      ))}
    </div>
  );
}
