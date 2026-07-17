import type { DieFace } from "../engine/types";

export function faceWord(face: DieFace): string {
  return face === "star" ? "별" : String(face);
}

/** 이/가 particle for each face, based on how its Korean number word ends: 일(ㄹ)/삼(ㅁ)/별(ㄹ) take
 * 이, 이(vowel)/사(vowel)/오(vowel) — i.e. 2, 4, 5 — take 가. */
function faceParticle(face: DieFace): "이" | "가" {
  if (face === "star" || face === 1 || face === 3) return "이";
  return "가";
}

/** Face-first bid readout per user preference: "별이 5개", "3이 4개" instead of "5개의 별". */
export function bidReadout(count: number, face: DieFace): string {
  return `${faceWord(face)}${faceParticle(face)} ${count}개`;
}
