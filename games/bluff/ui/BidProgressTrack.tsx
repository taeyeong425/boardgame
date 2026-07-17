import type { BidLogEntry } from "../engine/types";
import { bidReadout } from "./faceDisplay";

/** A visual board of this round's actual bids in order, staircasing upward — the physical game's
 * own board is a printed bid-progress track that climbs as bids get bolder; this mirrors that
 * feeling with the real history instead of a fixed ladder, since star/number conversion factors
 * mean there's no single fixed sequence of "next" bids. */
export function BidProgressTrack({
  bidLog,
  playerNames,
}: {
  bidLog: BidLogEntry[];
  playerNames: Record<string, string>;
}) {
  if (bidLog.length === 0) return <p className="text-center text-xs text-white/30">아직 베팅 없음</p>;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-end gap-1 overflow-x-auto pb-1">
        {bidLog.map((entry, i) => {
          const isLatest = i === bidLog.length - 1;
          const step = i % 6; // resets every 6 steps so a long round doesn't run off-screen
          return (
            <div key={i} className="flex shrink-0 items-end gap-1" style={{ marginBottom: `${step * 6}px` }}>
              <div
                className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-1.5 ${
                  isLatest ? "border-amber-400 bg-amber-400/20" : "border-white/10 bg-white/5"
                }`}
              >
                <span className={`whitespace-nowrap text-xs font-bold ${isLatest ? "text-amber-200" : "text-white/70"}`}>
                  {bidReadout(entry.bid.count, entry.bid.face)}
                </span>
                <span className="whitespace-nowrap text-[10px] text-white/40">{playerNames[entry.playerId] ?? "?"}</span>
              </div>
              {i < bidLog.length - 1 && <span className="pb-2 text-xs text-white/20">↗</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
