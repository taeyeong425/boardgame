import type { Card, CardColor, PositionKey, PyramidPosition, PyramidState } from "./types";

export interface LegalPosition {
  position: PyramidPosition;
  allowedColors: CardColor[] | "any";
}

function key(layer: number, index: number): PositionKey {
  return `${layer}:${index}`;
}

function getCard(p: PyramidState, layer: number, index: number): Card | undefined {
  return p.cells[key(layer, index)]?.card;
}

function getOpenLayer1Positions(p: PyramidState): LegalPosition[] {
  if (p.layer1Range === null) {
    // Empty board: the very first card played anywhere becomes the anchor of layer 1.
    return [{ position: { layer: 1, index: 0 }, allowedColors: "any" }];
  }
  const { lo, hi } = p.layer1Range;
  if (hi - lo + 1 >= p.layer1MaxWidth) return []; // layer 1 is full for the rest of the round
  return [
    { position: { layer: 1, index: lo - 1 }, allowedColors: "any" },
    { position: { layer: 1, index: hi + 1 }, allowedColors: "any" },
  ];
}

function getMaxOccupiedLayer(p: PyramidState): number {
  let max = 0;
  for (const k in p.cells) {
    const layer = Number(k.split(":")[0]);
    if (layer > max) max = layer;
  }
  return max;
}

function getOpenUpperPositions(p: PyramidState): LegalPosition[] {
  const result: LegalPosition[] = [];
  const maxLayer = getMaxOccupiedLayer(p);
  for (let layer = 1; layer <= maxLayer; layer++) {
    const indices = Object.keys(p.cells)
      .filter((k) => k.startsWith(`${layer}:`))
      .map((k) => Number(k.split(":")[1]));
    for (const i of indices) {
      const a = getCard(p, layer, i);
      const b = getCard(p, layer, i + 1);
      if (!a || !b) continue; // need an adjacent occupied pair directly below
      if (getCard(p, layer + 1, i)) continue; // gap already filled
      const allowed: CardColor[] = a.color === b.color ? [a.color] : [a.color, b.color];
      result.push({ position: { layer: layer + 1, index: i }, allowedColors: allowed });
    }
  }
  return result;
}

/**
 * Single source of truth for legality: the strict validator, the elimination check, autoMove, and
 * the UI's tap-to-highlight all derive from this, so none of them can drift out of sync.
 */
export function getAllLegalPositions(p: PyramidState): LegalPosition[] {
  return [...getOpenLayer1Positions(p), ...getOpenUpperPositions(p)];
}

export function computeLegalPlacements(
  p: PyramidState,
  hand: Card[]
): { card: Card; position: PyramidPosition }[] {
  const positions = getAllLegalPositions(p);
  const out: { card: Card; position: PyramidPosition }[] = [];
  for (const card of hand) {
    for (const lp of positions) {
      if (lp.allowedColors === "any" || lp.allowedColors.includes(card.color)) {
        out.push({ card, position: lp.position });
      }
    }
  }
  return out;
}

export function hasLegalMove(p: PyramidState, hand: Card[]): boolean {
  const positions = getAllLegalPositions(p);
  return hand.some((c) => positions.some((lp) => lp.allowedColors === "any" || lp.allowedColors.includes(c.color)));
}

export function isLegalPlacement(p: PyramidState, card: Card, position: PyramidPosition): boolean {
  const match = getAllLegalPositions(p).find(
    (lp) => lp.position.layer === position.layer && lp.position.index === position.index
  );
  if (!match) return false;
  return match.allowedColors === "any" || match.allowedColors.includes(card.color);
}
