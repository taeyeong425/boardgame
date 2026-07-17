"use client";

import { useEffect, useState } from "react";
import { Die3D, type Die3DFaceConfig } from "@/components/common/Die3D";
import type { CasinoNumber, PendingRollFaceGroup } from "../engine/types";

const LAS_VEGAS_FACES: readonly Die3DFaceConfig[] = [
  { key: "1", glyph: "1" },
  { key: "2", glyph: "2" },
  { key: "3", glyph: "3" },
  { key: "4", glyph: "4" },
  { key: "5", glyph: "5" },
  { key: "6", glyph: "6" },
];

function RollingDie({ face, size }: { face: CasinoNumber; size: number }) {
  const [rolling, setRolling] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setRolling(false), 500);
    return () => clearTimeout(timer);
  }, []);
  return <Die3D faceIndex={face - 1} faces={LAS_VEGAS_FACES} rolling={rolling} size={size} />;
}

export function RollControls({
  pendingRoll,
  ownDiceRemaining,
  houseDiceRemaining,
  playable,
  onRoll,
  onPlaceFace,
}: {
  pendingRoll: PendingRollFaceGroup[] | null;
  ownDiceRemaining: number;
  houseDiceRemaining: number;
  playable: boolean;
  onRoll: () => void;
  onPlaceFace: (face: CasinoNumber) => void;
}) {
  if (!playable && pendingRoll === null) {
    return null;
  }

  if (pendingRoll === null) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-white/10 p-3">
        <p className="text-xs text-white/50">
          내 주사위 {ownDiceRemaining + houseDiceRemaining}개 (내 것 {ownDiceRemaining}
          {houseDiceRemaining > 0 && ` + 중립 ${houseDiceRemaining}`})
        </p>
        <button
          type="button"
          onClick={onRoll}
          className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white active:scale-95"
        >
          🎲 굴리기
        </button>
      </div>
    );
  }

  // Identifies this specific roll's outcome (not just its position in the array) so the dice
  // remount — and tumble again — only on an actual fresh roll, not on unrelated re-renders.
  const rollKey = pendingRoll.map((g) => `${g.face}:${g.ownCount}:${g.houseCount}`).join("|");

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3">
      <p className="text-xs text-white/60">놓을 숫자를 선택하세요</p>
      <div className="flex flex-wrap justify-center gap-3">
        {pendingRoll.map((group) => (
          <button
            key={group.face}
            type="button"
            disabled={!playable}
            onClick={() => onPlaceFace(group.face)}
            className="flex flex-col items-center gap-1 rounded-lg border border-white/20 bg-white/5 p-2 active:scale-95 disabled:opacity-40"
          >
            <div className="flex gap-1">
              {Array.from({ length: group.ownCount }).map((_, i) => (
                <RollingDie key={`${rollKey}-own-${i}`} face={group.face} size={28} />
              ))}
              {Array.from({ length: group.houseCount }).map((_, i) => (
                <RollingDie key={`${rollKey}-house-${i}`} face={group.face} size={28} />
              ))}
            </div>
            <span className="text-xs font-semibold">
              {group.ownCount + group.houseCount}개를 {group.face} 카지노에
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
