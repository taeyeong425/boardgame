"use client";

import { useEffect, useState } from "react";
import type { DieFace } from "../engine/types";
import { Die3D } from "./Die3D";

export function DiceHand({ dice, roundNumber, size = 36 }: { dice: DieFace[]; roundNumber: number; size?: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 p-2">
      {dice.map((face, i) => (
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
  return <Die3D face={face} rolling={rolling} size={size} />;
}
