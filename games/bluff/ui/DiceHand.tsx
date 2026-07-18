"use client";

import { useEffect, useState } from "react";
import { Die3D, type Die3DFaceConfig } from "@/components/common/Die3D";
import type { DieFace } from "../engine/types";

export const BLUFF_FACES: readonly Die3DFaceConfig[] = [
  { key: "1", glyph: "1" },
  { key: "star", glyph: "★", special: true },
  { key: "2", glyph: "2" },
  { key: "5", glyph: "5" },
  { key: "3", glyph: "3" },
  { key: "4", glyph: "4" },
];

export function faceIndexOf(face: DieFace): number {
  const idx = BLUFF_FACES.findIndex((f) => f.key === String(face));
  return idx === -1 ? 0 : idx;
}

/** Ascending 1→5, star (wild) last — matches engine/dice.ts's ALL_FACES order. */
const FACE_SORT_ORDER: DieFace[] = [1, 2, 3, 4, 5, "star"];

export function DiceHand({ dice, roundNumber, size = 36 }: { dice: DieFace[]; roundNumber: number; size?: number }) {
  const sortedDice = [...dice].sort((a, b) => FACE_SORT_ORDER.indexOf(a) - FACE_SORT_ORDER.indexOf(b));

  return (
    <div className="flex flex-wrap justify-center gap-2 p-2">
      {sortedDice.map((face, i) => (
        // Keying on roundNumber remounts every die on a fresh roll, so each one tumbles again.
        <RollingDie key={`${roundNumber}-${i}`} face={face} size={size} />
      ))}
      {dice.length === 0 && <p className="p-2 text-sm text-white/40">주사위 없음</p>}
    </div>
  );
}

function RollingDie({ face, size }: { face: DieFace; size: number }) {
  const [rolling, setRolling] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setRolling(false), 500);
    return () => clearTimeout(timer);
  }, []);
  return <Die3D faceIndex={faceIndexOf(face)} faces={BLUFF_FACES} rolling={rolling} size={size} />;
}
