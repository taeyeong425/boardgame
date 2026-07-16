"use client";

import { useEffect, useState } from "react";
import type { RoundResult } from "../engine/types";

function faceLabel(face: RoundResult["bid"]["face"]): string {
  return face === "star" ? "★" : String(face);
}

function outcomeLine(result: RoundResult, nicknames: Record<string, string>): string {
  const bidderName = nicknames[result.bidderId] ?? "?";
  const challengerName = nicknames[result.challengerId] ?? "?";
  const bidText = `${result.bid.count}개의 ${faceLabel(result.bid.face)}`;
  const actualText = `실제로는 ${result.actualCount}개`;
  switch (result.outcome) {
    case "challengerLoses":
      return `${bidderName}의 "${bidText}" 베팅 성공 (${actualText}) — 도전자 ${challengerName}가 ${result.diceLost[result.challengerId]}개 잃음`;
    case "bidderLoses":
      return `${bidderName}의 "${bidText}" 베팅 실패 (${actualText}) — ${bidderName}가 ${result.diceLost[result.bidderId]}개 잃음`;
    case "allButBidderLose":
      return `${bidderName}의 "${bidText}" 정확히 적중! (${actualText}) — ${bidderName} 빼고 전원 1개씩 잃음`;
  }
}

export function RoundResultBanner({
  result,
  nicknames,
}: {
  result: RoundResult | undefined;
  nicknames: Record<string, string>;
}) {
  if (!result) return null;
  // Keying on roundNumber remounts this on every new round, resetting the auto-dismiss timer.
  return <RoundResultBannerInner key={result.roundNumber} result={result} nicknames={nicknames} />;
}

function RoundResultBannerInner({ result, nicknames }: { result: RoundResult; nicknames: Record<string, string> }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;

  return (
    <div
      className="absolute inset-x-4 top-2 z-10 rounded-lg bg-black/85 p-3 text-sm text-white shadow-lg"
      onClick={() => setVisible(false)}
    >
      <p className="mb-1 font-semibold">{result.roundNumber}라운드 결과</p>
      <p className="text-white/80">{outcomeLine(result, nicknames)}</p>
    </div>
  );
}
