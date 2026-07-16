"use client";

import { useEffect, useState } from "react";
import type { RoundScoreEntry } from "../engine/types";

export function RoundResultBanner({
  result,
  playerNames,
}: {
  result: RoundScoreEntry | undefined;
  playerNames: Record<string, string>;
}) {
  if (!result) return null;
  return <RoundResultBannerInner key={result.roundNumber} result={result} playerNames={playerNames} />;
}

function RoundResultBannerInner({ result, playerNames }: { result: RoundScoreEntry; playerNames: Record<string, string> }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;

  return (
    <div
      className="absolute inset-x-4 top-2 z-10 max-h-[70vh] overflow-y-auto rounded-lg bg-black/90 p-3 text-sm text-white shadow-lg"
      onClick={() => setVisible(false)}
    >
      <p className="mb-2 font-semibold">{result.roundNumber}라운드 정산</p>
      {Object.entries(result.scores).map(([playerId, s]) => (
        <div key={playerId} className="mb-1 text-xs text-white/80">
          <span className="font-semibold">{playerNames[playerId] ?? "?"}:</span> 예측 {s.bid} / 획득 {s.tricksWon}트릭
          {s.bonusPoints > 0 && ` (+보너스 ${s.bonusPoints})`} → {s.roundPoints >= 0 ? "+" : ""}
          {s.roundPoints}점
        </div>
      ))}
    </div>
  );
}
