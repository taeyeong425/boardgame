"use client";

import { useEffect, useState } from "react";
import { HOUSE, type RoundResult } from "../engine/types";

function formatBill(value: number): string {
  return `$${value / 1000}k`;
}

export function RoundResultBanner({
  result,
  playerNames,
}: {
  result: RoundResult | undefined;
  playerNames: Record<string, string>;
}) {
  if (!result) return null;
  // Keying on roundNumber remounts this on every new round, resetting the auto-dismiss timer.
  return <RoundResultBannerInner key={result.roundNumber} result={result} playerNames={playerNames} />;
}

function RoundResultBannerInner({ result, playerNames }: { result: RoundResult; playerNames: Record<string, string> }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;

  const nameOf = (owner: string) => (owner === HOUSE ? "🏠(중립)" : (playerNames[owner] ?? "?"));

  return (
    <div
      className="absolute inset-x-4 top-2 z-10 max-h-[70vh] overflow-y-auto rounded-lg bg-black/90 p-3 text-sm text-white shadow-lg"
      onClick={() => setVisible(false)}
    >
      <p className="mb-2 font-semibold">{result.roundNumber}라운드 정산</p>
      {result.payouts.map((payout) => (
        <div key={payout.casinoNumber} className="mb-1 text-xs text-white/80">
          <span className="font-semibold">{payout.casinoNumber}번 카지노:</span>{" "}
          {payout.awarded.length === 0 && payout.eliminatedOwners.length === 0 && "배당 없음"}
          {payout.awarded.map((a, i) => (
            <span key={i}>
              {i > 0 && ", "}
              {nameOf(a.owner)} {formatBill(a.bill.value)}
            </span>
          ))}
          {payout.eliminatedOwners.length > 0 && (
            <span className="text-red-300">
              {payout.awarded.length > 0 && " · "}동률 탈락: {payout.eliminatedOwners.map(nameOf).join(", ")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
