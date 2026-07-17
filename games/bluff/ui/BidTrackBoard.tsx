"use client";

import { useState } from "react";
import type { Bid, DieFace } from "../engine/types";

interface TrackCell {
  index: number;
  kind: "number" | "star";
  count: number;
}

/**
 * The physical board's own printed track — 30 fixed cells, not derived from player count or dice
 * remaining. Numbers 1-20 and stars 1-10 interleave in exactly this order: [1][★1][2][3][★2][4]
 * [5][★3][6][7][★4][8][9][★5][10][11][★6][12][13][★7][14][15][★8][16][17][★9][18][19][★10][20].
 * This order happens to be an exact total ordering of "legal to raise to" under the game's bid
 * rules (raise count, raise face, or convert to/from star) — so "everything before the current
 * marker is illegal" is just "track index < current index", no separate rule-checking needed.
 */
const TRACK: TrackCell[] = (() => {
  const cells: TrackCell[] = [];
  const push = (kind: TrackCell["kind"], count: number) => cells.push({ index: cells.length, kind, count });
  const numberPairsBeforeStar = [[1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11], [12, 13], [14, 15], [16, 17], [18, 19]];
  numberPairsBeforeStar.forEach((nums, i) => {
    nums.forEach((n) => push("number", n));
    push("star", i + 1);
  });
  push("number", 20);
  return cells;
})();

/**
 * Rendered as a closed rectangular loop, same as the physical board's border layout: start at
 * the bottom-left corner, go up the left edge, right across the top, down the right edge, then
 * left across the bottom — no wrap-arrows needed since the shape itself reads as one path.
 * A 7-wide x 10-tall grid puts exactly 30 cells on its perimeter (2*7 + 2*10 - 4 corners = 30),
 * matching the vertical/horizontal side lengths the physical board actually has (10 cells up
 * each long side, 7 across each short side, corners shared between adjacent sides).
 */
const GRID_COLS = 7;
const GRID_ROWS = 10;

function trackGridPosition(i: number): { row: number; col: number } {
  if (i <= 9) return { row: 9 - i, col: 0 }; // left edge, bottom -> top
  if (i <= 15) return { row: 0, col: 1 + (i - 10) }; // top edge, left -> right
  if (i <= 24) return { row: 1 + (i - 16), col: GRID_COLS - 1 }; // right edge, top -> bottom
  return { row: GRID_ROWS - 1, col: GRID_COLS - 2 - (i - 25) }; // bottom edge, right -> left
}
const TRACK_POSITIONS = TRACK.map((_, i) => trackGridPosition(i));

function trackIndexForBid(bid: Bid | null): number {
  if (!bid) return -1;
  if (bid.face === "star") return TRACK.findIndex((c) => c.kind === "star" && c.count === bid.count);
  return TRACK.findIndex((c) => c.kind === "number" && c.count === bid.count);
}

function cellBid(cell: TrackCell, face?: DieFace): Bid {
  return cell.kind === "star" ? { count: cell.count, face: "star" } : { count: cell.count, face: face ?? 1 };
}

export function BidTrackBoard({
  currentBid,
  playable,
  livingDice,
  eliminatedDice,
  onBid,
}: {
  currentBid: Bid | null;
  playable: boolean;
  livingDice: number;
  eliminatedDice: number;
  onBid: (bid: Bid) => void;
}) {
  const [pending, setPending] = useState<Bid | null>(null);
  const [facePickerCell, setFacePickerCell] = useState<TrackCell | null>(null);

  const currentIdx = trackIndexForBid(currentBid);
  const pendingIdx = trackIndexForBid(pending);

  function isSelectable(cell: TrackCell): boolean {
    if (currentIdx === -1) return true;
    if (cell.index > currentIdx) return true;
    return cell.index === currentIdx && cell.kind === "number";
  }

  function handleCellClick(cell: TrackCell) {
    if (!playable || !isSelectable(cell)) return;
    if (cell.kind === "star") {
      setPending(cellBid(cell));
      setFacePickerCell(null);
      return;
    }
    setFacePickerCell(cell);
  }

  function pickFace(face: DieFace) {
    if (!facePickerCell) return;
    setPending(cellBid(facePickerCell, face));
    setFacePickerCell(null);
  }

  function minFaceForPicker(cell: TrackCell): number {
    // Re-picking the exact cell the current bid already sits on: only a strictly higher face
    // counts as a raise. Any later number cell allows any face (raising the count is enough).
    if (cell.index === currentIdx && currentBid && currentBid.face !== "star") return currentBid.face + 1;
    return 1;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 p-3">
      <div
        className="mx-auto grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 2.5rem)`, gridTemplateRows: `repeat(${GRID_ROWS}, 2.5rem)` }}
      >
        {TRACK.map((cell, i) => {
          const isPending = pendingIdx === cell.index;
          const isCurrent = !isPending && currentIdx === cell.index;
          const selectable = playable && isSelectable(cell);
          const { row, col } = TRACK_POSITIONS[i];
          const label =
            cell.kind === "star"
              ? `★${cell.count}`
              : isPending && pending
                ? `${cell.count}·${pending.face === "star" ? "★" : pending.face}`
                : isCurrent && currentBid
                  ? `${cell.count}·${currentBid.face === "star" ? "★" : currentBid.face}`
                  : String(cell.count);
          return (
            <button
              key={cell.index}
              type="button"
              disabled={!selectable}
              onClick={() => handleCellClick(cell)}
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
              className={`flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold ${
                isPending
                  ? "border-2 border-amber-400 bg-amber-400/20 text-amber-200"
                  : isCurrent
                    ? "bg-amber-400 text-black"
                    : selectable
                      ? "border border-white/20 active:scale-95"
                      : "border border-white/5 text-white/25"
              }`}
            >
              {label}
            </button>
          );
        })}
        {/* Hollow interior formed by the loop — reused as the physical board's own "dice graveyard" spot. */}
        <div
          style={{ gridRow: `2 / ${GRID_ROWS}`, gridColumn: `2 / ${GRID_COLS}` }}
          className="flex flex-col items-center justify-center gap-1 text-xs text-white/60"
        >
          <span>🎲 생존 {livingDice}개</span>
          <span>💀 탈락 {eliminatedDice}개</span>
        </div>
      </div>

      {facePickerCell && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3">
          <p className="text-xs text-white/70">{facePickerCell.count}개로 베팅할 숫자를 고르세요</p>
          <div className="flex gap-2">
            {([1, 2, 3, 4, 5] as const).map((face) => (
              <button
                key={face}
                type="button"
                disabled={face < minFaceForPicker(facePickerCell)}
                onClick={() => pickFace(face)}
                className="h-10 w-10 rounded-md border border-white/20 text-sm font-bold disabled:opacity-20 active:scale-95"
              >
                {face}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setFacePickerCell(null)} className="text-xs text-white/40">
            취소
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={!playable || pending === null}
        onClick={() => {
          if (!pending) return;
          onBid(pending);
          setPending(null);
        }}
        className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white active:scale-95 disabled:opacity-30"
      >
        베팅 확정
      </button>
    </div>
  );
}
