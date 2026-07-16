"use client";

import { useState } from "react";
import { isLegalBid, minimalLegalBid } from "../engine/bidding";
import type { Bid, DieFace } from "../engine/types";

const FACES: DieFace[] = [1, 2, 3, 4, 5, "star"];

function faceLabel(face: DieFace): string {
  return face === "star" ? "★" : String(face);
}

export function BidControls({
  currentBid,
  playable,
  onBid,
  onChallenge,
}: {
  currentBid: Bid | null;
  playable: boolean;
  onBid: (bid: Bid) => void;
  onChallenge: () => void;
}) {
  // The parent remounts this component (via a `key` derived from currentBid) whenever the actual
  // table bid changes, so a fresh lazy-initialized draft is all that's needed here — no effect.
  const [draft, setDraft] = useState<Bid>(() => minimalLegalBid(currentBid));

  const legal = isLegalBid(currentBid, draft);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 p-3">
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={!playable || draft.count <= 1}
          onClick={() => setDraft((d) => ({ ...d, count: Math.max(1, d.count - 1) }))}
          className="h-9 w-9 rounded-full border border-white/20 text-lg disabled:opacity-30"
        >
          −
        </button>
        <span className="w-10 text-center text-xl font-bold">{draft.count}</span>
        <button
          type="button"
          disabled={!playable}
          onClick={() => setDraft((d) => ({ ...d, count: d.count + 1 }))}
          className="h-9 w-9 rounded-full border border-white/20 text-lg disabled:opacity-30"
        >
          +
        </button>
      </div>

      <div className="flex justify-center gap-1">
        {FACES.map((f) => (
          <button
            key={String(f)}
            type="button"
            disabled={!playable}
            onClick={() => setDraft((d) => ({ ...d, face: f }))}
            className={`h-9 w-9 rounded-md border text-sm font-bold disabled:opacity-30 ${
              draft.face === f ? "border-emerald-400 bg-emerald-400/20" : "border-white/20"
            } ${f === "star" ? "text-red-400" : ""}`}
          >
            {faceLabel(f)}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!playable || !legal}
          onClick={() => onBid(draft)}
          className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white active:scale-95 disabled:opacity-30"
        >
          베팅
        </button>
        <button
          type="button"
          disabled={!playable || currentBid === null}
          onClick={onChallenge}
          className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white active:scale-95 disabled:opacity-30"
        >
          도전!
        </button>
      </div>
    </div>
  );
}
