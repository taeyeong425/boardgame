import { isLegalBid } from "../engine/bidding";
import type { Bid, DieFace } from "../engine/types";

const NUMBER_FACES: DieFace[] = [1, 2, 3, 4, 5];

function isCurrent(currentBid: Bid | null, count: number, face: DieFace): boolean {
  return currentBid !== null && currentBid.count === count && currentBid.face === face;
}

/** The physical game's own board is a fixed count-by-count ladder where every rung shows the 5
 * numbered faces, and — since 2 numbered dice ≈ 1 star die in probability — a ★ cell sits at every
 * even count, aligned with its equivalent numbered rung. Betting happens by tapping a cell
 * directly, instead of dialing a count stepper and a face picker separately. */
export function BidLadder({
  currentBid,
  maxCount,
  playable,
  onBid,
}: {
  currentBid: Bid | null;
  maxCount: number;
  playable: boolean;
  onBid: (bid: Bid) => void;
}) {
  const counts = Array.from({ length: maxCount }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 p-2">
      <div className="flex items-start gap-1">
        {counts.map((count) => {
          const starFace: DieFace = "star";
          const starCount = count / 2;
          const showStar = count % 2 === 0;
          return (
            <div key={count} className="flex shrink-0 flex-col items-center gap-0.5">
              {NUMBER_FACES.map((face) => {
                const legal = isLegalBid(currentBid, { count, face });
                const current = isCurrent(currentBid, count, face);
                return (
                  <button
                    key={face}
                    type="button"
                    disabled={!playable || !legal}
                    onClick={() => onBid({ count, face })}
                    className={`h-6 w-7 rounded text-[11px] font-bold disabled:opacity-20 ${
                      current ? "bg-amber-400 text-black" : legal ? "border border-white/20 active:scale-95" : "border border-white/5 text-white/30"
                    }`}
                  >
                    {face}
                  </button>
                );
              })}
              {showStar ? (
                (() => {
                  const legal = isLegalBid(currentBid, { count: starCount, face: starFace });
                  const current = isCurrent(currentBid, starCount, starFace);
                  return (
                    <button
                      type="button"
                      disabled={!playable || !legal}
                      onClick={() => onBid({ count: starCount, face: starFace })}
                      className={`h-6 w-7 rounded text-[11px] font-bold disabled:opacity-20 ${
                        current ? "bg-amber-400 text-black" : legal ? "border border-red-400/40 text-red-300 active:scale-95" : "border border-white/5 text-white/30"
                      }`}
                    >
                      ★{starCount}
                    </button>
                  );
                })()
              ) : (
                <div className="h-6 w-7" />
              )}
              <span className="text-[9px] text-white/30">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
