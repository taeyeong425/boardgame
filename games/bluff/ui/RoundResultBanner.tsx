"use client";

import { useEffect, useState } from "react";
import { Die3D } from "@/components/common/Die3D";
import { BLUFF_FACES, faceIndexOf } from "./DiceHand";
import { bidReadout } from "./faceDisplay";
import type { DieFace, RoundResult } from "../engine/types";

/** Same wildcard rule as engine/dice.ts's countMatching: a star counts toward any numbered bid,
 * but a bid on "star" itself only counts actual stars. */
function matchesBidFace(die: DieFace, bidFace: DieFace): boolean {
  if (bidFace === "star") return die === "star";
  return die === bidFace || die === "star";
}

function outcomeLine(result: RoundResult, nicknames: Record<string, string>): string {
  const bidderName = nicknames[result.bidderId] ?? "?";
  const challengerName = nicknames[result.challengerId] ?? "?";
  const bidText = bidReadout(result.bid.count, result.bid.face);
  switch (result.outcome) {
    case "challengerLoses":
      return `${bidderName}의 "${bidText}" 베팅 성공 — 블러프를 외친 ${challengerName}가 ${result.diceLost[result.challengerId]}개 잃음`;
    case "bidderLoses":
      return `${bidderName}의 "${bidText}" 베팅 실패 — ${bidderName}가 ${result.diceLost[result.bidderId]}개 잃음`;
    case "allButChallengerLose":
      return `${bidderName}의 "${bidText}" 정확히 적중! — 블러프를 외친 ${challengerName}만 빼고 전원 1개씩 잃음`;
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
    const timer = setTimeout(() => setVisible(false), 9000);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;

  return (
    <div
      className="absolute inset-x-4 top-2 z-10 max-h-[80vh] overflow-y-auto rounded-lg bg-black/85 p-3 text-sm text-white shadow-lg"
      onClick={() => setVisible(false)}
    >
      <p className="mb-1 font-semibold">{result.roundNumber}라운드 결과 — 블러프!</p>
      <p className="mb-2 text-white/80">{outcomeLine(result, nicknames)}</p>
      <p className="mb-1 text-xs text-white/60">
        전체 공개 — {bidReadout(result.bid.count, result.bid.face)} 베팅, 실제로는{" "}
        <span className="font-bold text-amber-300">{result.actualCount}개</span>
      </p>
      <div className="flex flex-col gap-1.5">
        {Object.entries(result.revealedRolls).map(([playerId, dice]) => (
          <div key={playerId} className="flex items-center gap-2">
            <span className="w-16 shrink-0 truncate text-xs text-white/70">{nicknames[playerId] ?? "?"}</span>
            <div className="flex flex-wrap gap-1">
              {dice.length === 0 && <span className="text-xs text-white/30">-</span>}
              {dice.map((face, i) => {
                const match = matchesBidFace(face, result.bid.face);
                return (
                  <div
                    key={i}
                    className={`rounded ${match ? "ring-2 ring-amber-400" : "opacity-50"}`}
                  >
                    <Die3D faceIndex={faceIndexOf(face)} faces={BLUFF_FACES} size={24} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
