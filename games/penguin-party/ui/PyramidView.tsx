"use client";

import { useMemo } from "react";
import type { LegalPosition } from "../engine/pyramid";
import type { CardColor, PyramidPosition, PyramidState } from "../engine/types";
import { CardFace } from "./CardFace";
import { cardColorHex } from "./cardColor";

// Matches PlayerHand's card size so pyramid cards and hand cards read as the same "physical" card.
const CELL_WIDTH = 40; // px
const CELL_HEIGHT = 56; // px

function positionKey(position: PyramidPosition): string {
  return `${position.layer}:${position.index}`;
}

function unitsFor(position: PyramidPosition) {
  return { x: position.index + (position.layer - 1) / 2, y: -(position.layer - 1) };
}

export function PyramidView({
  pyramid,
  legalPositions,
  activeKeys,
  onSelectPosition,
}: {
  pyramid: PyramidState;
  /** Every currently-open slot in the structure, active or not — always shown so the pyramid's
   * shape (and which colors each gap still needs) is visible before you've even selected a card. */
  legalPositions: LegalPosition[];
  /** Subset of legalPositions the selected hand card can actually be placed into right now. */
  activeKeys: Set<string>;
  onSelectPosition: (position: PyramidPosition) => void;
}) {
  const occupied = useMemo(
    () => Object.values(pyramid.cells).map((pc) => ({ position: pc.position, card: pc.card })),
    [pyramid]
  );

  const bounds = useMemo(() => {
    const allPositions = [...occupied.map((c) => c.position), ...legalPositions.map((lp) => lp.position)];
    if (allPositions.length === 0) return { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5 };
    const units = allPositions.map(unitsFor);
    return {
      minX: Math.min(...units.map((u) => u.x)) - 0.5,
      maxX: Math.max(...units.map((u) => u.x)) + 0.5,
      minY: Math.min(...units.map((u) => u.y)) - 0.5,
      maxY: Math.max(...units.map((u) => u.y)) + 0.5,
    };
  }, [occupied, legalPositions]);

  const width = (bounds.maxX - bounds.minX) * CELL_WIDTH;
  const height = (bounds.maxY - bounds.minY) * CELL_HEIGHT;

  return (
    <div className="w-full overflow-auto rounded-xl bg-slate-800/40 p-4">
      <div className="relative mx-auto" style={{ width, height }}>
        {occupied.map(({ position, card }) => {
          const u = unitsFor(position);
          const left = (u.x - bounds.minX) * CELL_WIDTH - CELL_WIDTH / 2;
          const top = (u.y - bounds.minY) * CELL_HEIGHT - CELL_HEIGHT / 2;
          return (
            <div
              key={positionKey(position)}
              className="absolute"
              style={{ left, top, width: CELL_WIDTH - 4, height: CELL_HEIGHT - 4 }}
            >
              <CardFace color={card.color} />
            </div>
          );
        })}
        {legalPositions.map((lp) => {
          const key = positionKey(lp.position);
          const u = unitsFor(lp.position);
          const left = (u.x - bounds.minX) * CELL_WIDTH - CELL_WIDTH / 2;
          const top = (u.y - bounds.minY) * CELL_HEIGHT - CELL_HEIGHT / 2;
          const active = activeKeys.has(key);
          return (
            <EmptySlot
              key={key}
              style={{ left, top, width: CELL_WIDTH - 4, height: CELL_HEIGHT - 4 }}
              allowedColors={lp.allowedColors}
              active={active}
              onClick={() => onSelectPosition(lp.position)}
            />
          );
        })}
      </div>
    </div>
  );
}

function EmptySlot({
  style,
  allowedColors,
  active,
  onClick,
}: {
  style: React.CSSProperties;
  allowedColors: CardColor[] | "any";
  active: boolean;
  onClick: () => void;
}) {
  const label =
    allowedColors === "any"
      ? "빈 칸"
      : `${allowedColors.length === 1 ? "" : "둘 중 하나 "}필요한 색: ${allowedColors.join(", ")}`;
  return (
    <button
      type="button"
      disabled={!active}
      onClick={onClick}
      aria-label={label}
      className={`absolute flex items-center justify-center rounded-md border-2 border-dashed transition-colors ${
        active ? "border-emerald-400 bg-emerald-400/10 active:scale-95" : "border-white/15 bg-white/[0.03]"
      }`}
      style={style}
    >
      {allowedColors !== "any" && (
        <div className="flex gap-0.5">
          {allowedColors.map((c) => (
            <div key={c} className="h-2 w-2 rounded-full opacity-70" style={{ backgroundColor: cardColorHex(c) }} />
          ))}
        </div>
      )}
    </button>
  );
}
