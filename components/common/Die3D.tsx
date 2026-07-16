"use client";

import type { CSSProperties } from "react";

export interface Die3DFaceConfig {
  /** Unique identifier for this face value (e.g. "1", "star", "6"). */
  key: string;
  glyph: string;
  /** Distinct styling for a wild/special face (e.g. Bluff's star). */
  special?: boolean;
}

/** 6 fixed cube-side geometric slots (arbitrary but consistent — doesn't need to match a real
 * die's pip layout, just needs every face reachable and visually distinct). */
const CUBE_SLOTS: { rotation: string; buildTransform: (half: string) => string }[] = [
  { rotation: "rotateX(0deg) rotateY(0deg)", buildTransform: (half) => `translateZ(${half})` },
  { rotation: "rotateY(180deg)", buildTransform: (half) => `rotateY(180deg) translateZ(${half})` },
  { rotation: "rotateY(-90deg)", buildTransform: (half) => `rotateY(90deg) translateZ(${half})` },
  { rotation: "rotateY(90deg)", buildTransform: (half) => `rotateY(-90deg) translateZ(${half})` },
  { rotation: "rotateX(90deg)", buildTransform: (half) => `rotateX(-90deg) translateZ(${half})` },
  { rotation: "rotateX(-90deg)", buildTransform: (half) => `rotateX(90deg) translateZ(${half})` },
];

/**
 * A real CSS 3D-transformed cube (6 faces, rotated as a group to show whichever landed face-up),
 * with a brief tumble animation on a fresh roll. Generic over which 6 symbols a game's die shows
 * (Bluff: 1-5 + a wild star; Las Vegas: plain 1-6) — pass exactly 6 `faces` and the index of the
 * one currently showing.
 */
export function Die3D({
  faceIndex,
  faces,
  rolling = false,
  size = 36,
}: {
  faceIndex: number;
  faces: readonly Die3DFaceConfig[];
  rolling?: boolean;
  size?: number;
}) {
  const half = `${size / 2}px`;
  const slot = CUBE_SLOTS[faceIndex] ?? CUBE_SLOTS[0];

  return (
    <div className="die-scene" style={{ width: size, height: size }}>
      <div
        className={`die-cube ${rolling ? "die-rolling" : ""}`}
        style={{ width: size, height: size, transform: rolling ? undefined : slot.rotation } as CSSProperties}
      >
        {faces.map((f, i) => (
          <div
            key={f.key}
            className={`die-face ${f.special ? "die-face--star" : ""}`}
            style={{ width: size, height: size, transform: CUBE_SLOTS[i].buildTransform(half), fontSize: size * 0.45 }}
          >
            {f.glyph}
          </div>
        ))}
      </div>
    </div>
  );
}
