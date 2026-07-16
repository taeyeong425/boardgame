/** Per-round score for one player, per docs/rules/skull-king.md's Scoring section. Bonus points
 * only ever apply when bid is matched (bid=0 rounds can't earn a capture bonus since 0 tricks
 * means no trick was ever won). */
export function computeRoundPoints(bid: number, tricksWon: number, roundNumber: number, bonusPoints: number): number {
  if (bid === 0) {
    return tricksWon === 0 ? 10 * roundNumber : -10 * roundNumber;
  }
  if (tricksWon === bid) {
    return bid * 20 + bonusPoints;
  }
  return -10 * Math.abs(tricksWon - bid);
}
