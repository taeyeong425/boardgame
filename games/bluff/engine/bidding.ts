import type { Bid, DieFace } from "./types";

/**
 * Legality rules for raising a bid (confirmed from the official rulebook):
 * - The count can never decrease.
 * - Raising the count lets you switch to ANY face (even a lower one).
 * - Keeping the same count requires strictly raising the face value.
 * - Star ("wild") bids are half as likely per die as a numbered face, so converting between them
 *   applies a conversion factor: number -> star needs at least ceil(count / 2); star -> number
 *   needs at least count * 2. Star -> star has only one face, so it must strictly raise the count
 *   (there's no "same count, higher face" option once you're already betting the highest face).
 */
export function isLegalBid(current: Bid | null, next: Bid): boolean {
  if (!Number.isInteger(next.count) || next.count < 1) return false;
  if (current === null) return true; // opening bid of the round — anything goes

  const curIsStar = current.face === "star";
  const nextIsStar = next.face === "star";

  if (!curIsStar && !nextIsStar) {
    if (next.count > current.count) return true;
    if (next.count === current.count) return next.face > current.face;
    return false;
  }
  if (!curIsStar && nextIsStar) {
    return next.count >= Math.ceil(current.count / 2);
  }
  if (curIsStar && !nextIsStar) {
    return next.count >= current.count * 2;
  }
  return next.count > current.count; // star -> star
}

/** The cheapest legal next bid — used as a safe, always-legal turn-timeout fallback. */
export function minimalLegalBid(current: Bid | null): Bid {
  if (current === null) return { count: 1, face: 1 };
  if (current.face === "star") return { count: current.count + 1, face: "star" };
  if (current.face < 5) return { count: current.count, face: (current.face + 1) as DieFace };
  return { count: current.count + 1, face: 1 };
}
