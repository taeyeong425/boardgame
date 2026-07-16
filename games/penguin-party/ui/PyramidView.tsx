"use client";

import { useMemo } from "react";
import type { Card, PyramidPosition, PyramidState } from "../engine/types";
import { cardColorClass, cardColorGlyph } from "./cardColor";

const CELL = 44; // px

interface HighlightCell {
  position: PyramidPosition;
}

function unitsFor(position: PyramidPosition) {
  return { x: position.index + (position.layer - 1) / 2, y: -(position.layer - 1) };
}

export function PyramidView({
  pyramid,
  highlight,
  onSelectPosition,
}: {
  pyramid: PyramidState;
  highlight: HighlightCell[];
  onSelectPosition: (position: PyramidPosition) => void;
}) {
  const occupied = useMemo(
    () => Object.values(pyramid.cells).map((pc) => ({ position: pc.position, card: pc.card })),
    [pyramid]
  );

  const highlightKeys = useMemo(() => new Set(highlight.map((h) => `${h.position.layer}:${h.position.index}`)), [highlight]);

  const allPositions = useMemo(() => {
    const occupiedPositions = occupied.map((c) => c.position);
    // De-dupe in case a highlight coincides with an occupied cell (shouldn't happen, but stay safe).
    const seen = new Set(occupiedPositions.map((p) => `${p.layer}:${p.index}`));
    const highlightOnly = highlight.filter((h) => !seen.has(`${h.position.layer}:${h.position.index}`));
    return [...occupiedPositions, ...highlightOnly.map((h) => h.position)];
  }, [occupied, highlight]);

  const bounds = useMemo(() => {
    if (allPositions.length === 0) return { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5 };
    const units = allPositions.map(unitsFor);
    return {
      minX: Math.min(...units.map((u) => u.x)) - 0.5,
      maxX: Math.max(...units.map((u) => u.x)) + 0.5,
      minY: Math.min(...units.map((u) => u.y)) - 0.5,
      maxY: Math.max(...units.map((u) => u.y)) + 0.5,
    };
  }, [allPositions]);

  const width = (bounds.maxX - bounds.minX) * CELL;
  const height = (bounds.maxY - bounds.minY) * CELL;

  return (
    <div className="w-full overflow-auto rounded-xl bg-slate-800/40 p-4">
      <div className="relative mx-auto" style={{ width, height }}>
        {occupied.map(({ position, card }) => (
          <PyramidCell key={`${position.layer}:${position.index}`} position={position} bounds={bounds} card={card} />
        ))}
        {highlight.map((h) => {
          const key = `${h.position.layer}:${h.position.index}`;
          if (!highlightKeys.has(key)) return null;
          const u = unitsFor(h.position);
          const left = (u.x - bounds.minX) * CELL - CELL / 2;
          const top = (u.y - bounds.minY) * CELL - CELL / 2;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectPosition(h.position)}
              className="absolute flex items-center justify-center rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-400/10 active:scale-95"
              style={{ left, top, width: CELL - 4, height: CELL - 4 }}
              aria-label={`${h.position.layer}층 ${h.position.index}칸에 놓기`}
            />
          );
        })}
      </div>
    </div>
  );
}

function PyramidCell({
  position,
  bounds,
  card,
}: {
  position: PyramidPosition;
  bounds: { minX: number; minY: number };
  card: Card;
}) {
  const u = unitsFor(position);
  const left = (u.x - bounds.minX) * CELL - CELL / 2;
  const top = (u.y - bounds.minY) * CELL - CELL / 2;
  return (
    <div
      className={`absolute flex items-center justify-center rounded-lg border font-bold ${cardColorClass(card.color)}`}
      style={{ left, top, width: CELL - 4, height: CELL - 4 }}
    >
      {cardColorGlyph(card.color)}
    </div>
  );
}
