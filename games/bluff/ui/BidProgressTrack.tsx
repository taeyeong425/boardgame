import type { BidLogEntry } from "../engine/types";
import { bidReadout } from "./faceDisplay";

/** A visual track of this round's actual bids in order — the physical game's own board is a
 * printed bid-progress track; this mirrors it with the real history instead of a fixed ladder,
 * since star/number conversion factors mean there's no single fixed sequence of "next" bids. */
export function BidProgressTrack({
  bidLog,
  playerNames,
}: {
  bidLog: BidLogEntry[];
  playerNames: Record<string, string>;
}) {
  if (bidLog.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-center text-[10px] text-white/40">← 낮은 베팅 　　　　　 높은 베팅 →</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {bidLog.map((entry, i) => {
          const isLatest = i === bidLog.length - 1;
          return (
            <div
              key={i}
              className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg border px-2 py-1.5 ${
                isLatest ? "border-amber-400 bg-amber-400/20" : "border-white/10 bg-white/5"
              }`}
            >
              <span className={`whitespace-nowrap text-xs font-bold ${isLatest ? "text-amber-200" : "text-white/70"}`}>
                {bidReadout(entry.bid.count, entry.bid.face)}
              </span>
              <span className="whitespace-nowrap text-[10px] text-white/40">{playerNames[entry.playerId] ?? "?"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
