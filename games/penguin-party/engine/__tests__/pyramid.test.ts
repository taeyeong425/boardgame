import { describe, expect, it } from "vitest";
import { computeLegalPlacements, getAllLegalPositions, hasLegalMove, isLegalPlacement } from "../pyramid";
import type { Card, PyramidState } from "../types";

function card(id: string, color: Card["color"]): Card {
  return { id, color };
}

function emptyPyramid(maxWidth = 8): PyramidState {
  return { cells: {}, layer1Range: null, layer1MaxWidth: maxWidth };
}

function place(p: PyramidState, layer: number, index: number, c: Card, placedBy = "p0"): PyramidState {
  const cells = { ...p.cells, [`${layer}:${index}`]: { card: c, position: { layer, index }, placedBy, turnNumber: 0 } };
  let layer1Range = p.layer1Range;
  if (layer === 1) {
    layer1Range = layer1Range === null ? { lo: index, hi: index } : { lo: Math.min(layer1Range.lo, index), hi: Math.max(layer1Range.hi, index) };
  }
  return { ...p, cells, layer1Range };
}

describe("getAllLegalPositions — layer 1", () => {
  it("allows any color at the anchor position on an empty board", () => {
    const positions = getAllLegalPositions(emptyPyramid());
    expect(positions).toHaveLength(1);
    expect(positions[0]).toEqual({ position: { layer: 1, index: 0 }, allowedColors: "any" });
  });

  it("only allows extending at the left or right end, never a gap", () => {
    let p = emptyPyramid();
    p = place(p, 1, 0, card("a", "red"));
    p = place(p, 1, 1, card("b", "green"));
    // layer1Range is now [0,1]; legal layer-1 extensions must be at -1 or 2 only.
    const positions = getAllLegalPositions(p).filter((lp) => lp.position.layer === 1);
    const indices = positions.map((lp) => lp.position.index).sort((a, b) => a - b);
    expect(indices).toEqual([-1, 2]);
  });

  it("stops allowing layer-1 placement once max width is reached", () => {
    let p = emptyPyramid(3);
    p = place(p, 1, 0, card("a", "red"));
    p = place(p, 1, 1, card("b", "green"));
    p = place(p, 1, 2, card("c", "yellow"));
    const positions = getAllLegalPositions(p).filter((lp) => lp.position.layer === 1);
    expect(positions).toHaveLength(0);
  });
});

describe("getAllLegalPositions — layer 2+", () => {
  it("requires two occupied adjacent cells below and matches at least one color", () => {
    let p = emptyPyramid();
    p = place(p, 1, 0, card("a", "red"));
    p = place(p, 1, 1, card("b", "green"));
    const upper = getAllLegalPositions(p).find((lp) => lp.position.layer === 2 && lp.position.index === 0);
    expect(upper).toBeDefined();
    expect(upper!.allowedColors).toEqual(["red", "green"]);
  });

  it("restricts to a single color when both supports share a color", () => {
    let p = emptyPyramid();
    p = place(p, 1, 0, card("a", "red"));
    p = place(p, 1, 1, card("b", "red"));
    const upper = getAllLegalPositions(p).find((lp) => lp.position.layer === 2 && lp.position.index === 0);
    expect(upper!.allowedColors).toEqual(["red"]);
  });

  it("does not offer a layer-2 gap that is already filled", () => {
    let p = emptyPyramid();
    p = place(p, 1, 0, card("a", "red"));
    p = place(p, 1, 1, card("b", "green"));
    p = place(p, 2, 0, card("c", "red"));
    const upper = getAllLegalPositions(p).filter((lp) => lp.position.layer === 2 && lp.position.index === 0);
    expect(upper).toHaveLength(0);
  });

  it("does not offer a position with only one occupied support", () => {
    let p = emptyPyramid();
    p = place(p, 1, 0, card("a", "red"));
    // layer 1 index 1 is empty — no legal layer-2 position above index 0 yet.
    const upper = getAllLegalPositions(p).filter((lp) => lp.position.layer === 2);
    expect(upper).toHaveLength(0);
  });
});

describe("isLegalPlacement / hasLegalMove / computeLegalPlacements", () => {
  it("rejects a color that matches neither support", () => {
    let p = emptyPyramid();
    p = place(p, 1, 0, card("a", "red"));
    p = place(p, 1, 1, card("b", "green"));
    expect(isLegalPlacement(p, card("x", "yellow"), { layer: 2, index: 0 })).toBe(false);
    expect(isLegalPlacement(p, card("x", "red"), { layer: 2, index: 0 })).toBe(true);
  });

  it("hasLegalMove is false when hand colors match nothing available", () => {
    let p = emptyPyramid(1); // layer1 full at width 1 already reached after one placement
    p = place(p, 1, 0, card("a", "red"));
    expect(hasLegalMove(p, [card("x", "green")])).toBe(false);
  });

  it("computeLegalPlacements enumerates every (card, position) pair", () => {
    const p = emptyPyramid();
    const hand = [card("x", "red"), card("y", "green")];
    const placements = computeLegalPlacements(p, hand);
    // empty board: only the anchor position, but both hand cards are eligible for it ("any" color)
    expect(placements).toHaveLength(2);
  });
});
