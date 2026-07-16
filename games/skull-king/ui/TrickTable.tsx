import type { Trick } from "../engine/types";
import { CardFace } from "./CardFace";

export function TrickTable({ trick, playerNames }: { trick: Trick | null; playerNames: Record<string, string> }) {
  if (!trick || trick.plays.length === 0) {
    return <div className="flex h-20 items-center justify-center text-xs text-white/40">아직 낸 카드가 없어요</div>;
  }
  return (
    <div className="flex flex-wrap justify-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
      {trick.plays.map((play) => (
        <div key={play.playerId} className="flex flex-col items-center gap-1">
          <CardFace card={play.card} />
          <span className="text-[10px] text-white/60">
            {playerNames[play.playerId] ?? "?"}
            {play.declaredAs && ` (${play.declaredAs === "pirate" ? "해적" : "탈출"})`}
          </span>
        </div>
      ))}
    </div>
  );
}
