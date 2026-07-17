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

/** Rendered as a boustrophedon (snake) path: each row alternates direction so the ascending
 * sequence coils continuously instead of breaking at a flat-wrap line boundary. 6 columns x 5
 * rows divides the 30 cells evenly. Row pixel width is hardcoded to match (see ROW_WIDTH_PX). */
const COLUMNS = 6;
const ROWS: TrackCell[][] = Array.from({ length: Math.ceil(TRACK.length / COLUMNS) }, (_, i) =>
  TRACK.slice(i * COLUMNS, i * COLUMNS + COLUMNS)
);

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
      <div className="flex items-center justify-center gap-4 text-xs text-white/60">
        <span>🎲 생존 {livingDice}개</span>
        <span>💀 탈락 {eliminatedDice}개</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        {ROWS.map((row, rowIndex) => {
          const reversed = rowIndex % 2 === 1;
          return (
            // Fixed width matches ROW_WIDTH_PX below so the turn arrow lines up under the row's
            // actual edge cell, not the (wider) panel — reversed rows snake back the other way so
            // the ascending sequence reads as one continuous coiled path instead of a flat wrap.
            <div key={rowIndex} className="flex w-[270px] flex-col gap-1">
              <div className={`flex gap-1.5 ${reversed ? "flex-row-reverse" : ""}`}>
                {row.map((cell) => {
                  const isPending = pendingIdx === cell.index;
                  const isCurrent = !isPending && currentIdx === cell.index;
                  const selectable = playable && isSelectable(cell);
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
              </div>
              {rowIndex < ROWS.length - 1 && (
                <div className={`flex text-sm text-white/25 ${reversed ? "justify-start pl-3" : "justify-end pr-3"}`}>
                  {reversed ? "⤶" : "⤵"}
                </div>
              )}
            </div>
          );
        })}
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
