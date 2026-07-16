"use client";

import type { CSSProperties } from "react";
import type { DieFace } from "../engine/types";

/** Group rotation that brings each face to point at the viewer (front, +Z). Arbitrary but fixed
 * assignment of faces to cube sides — doesn't need to match a physical die's pip layout, just
 * needs every face reachable and visually distinct. */
const FACE_ROTATION: Record<string, string> = {
  "1": "rotateX(0deg) rotateY(0deg)",
  "2": "rotateY(-90deg)",
  "3": "rotateX(90deg)",
  "4": "rotateX(-90deg)",
  "5": "rotateY(90deg)",
  star: "rotateY(180deg)",
};

const CUBE_FACES: { key: string; buildTransform: (half: string) => string; glyph: string; star?: boolean }[] = [
  { key: "1", buildTransform: (half) => `translateZ(${half})`, glyph: "1" },
  { key: "star-back", buildTransform: (half) => `rotateY(180deg) translateZ(${half})`, glyph: "★", star: true },
  { key: "2", buildTransform: (half) => `rotateY(90deg) translateZ(${half})`, glyph: "2" },
  { key: "5", buildTransform: (half) => `rotateY(-90deg) translateZ(${half})`, glyph: "5" },
  { key: "3", buildTransform: (half) => `rotateX(-90deg) translateZ(${half})`, glyph: "3" },
  { key: "4", buildTransform: (half) => `rotateX(90deg) translateZ(${half})`, glyph: "4" },
];

export function Die3D({ face, rolling = false, size = 36 }: { face: DieFace; rolling?: boolean; size?: number }) {
  const half = `${size / 2}px`;
  const rotation = FACE_ROTATION[String(face)] ?? FACE_ROTATION["1"];

  return (
    <div className="die-scene" style={{ width: size, height: size }}>
      <div
        className={`die-cube ${rolling ? "die-rolling" : ""}`}
        style={{ width: size, height: size, transform: rolling ? undefined : rotation } as CSSProperties}
      >
        {CUBE_FACES.map((f) => (
          <div
            key={f.key}
            className={`die-face ${f.star ? "die-face--star" : ""}`}
            style={{ width: size, height: size, transform: f.buildTransform(half), fontSize: size * 0.45 }}
          >
            {f.glyph}
          </div>
        ))}
      </div>
    </div>
  );
}
