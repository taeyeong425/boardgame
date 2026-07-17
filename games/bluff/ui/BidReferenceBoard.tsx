import { CollapsiblePanel } from "@/components/common/CollapsiblePanel";

const ROWS = [
  { number: 2, star: 1 },
  { number: 4, star: 2 },
  { number: 6, star: 3 },
  { number: 8, star: 4 },
  { number: 10, star: 5 },
];

/** Explains why converting a bid between a numbered face and ★ changes the count — the physical
 * game's own board shows this same progression track. Open by default so it's visible while
 * deciding a bid, not just on request. */
export function BidReferenceBoard() {
  return (
    <CollapsiblePanel title="❓ 별과 숫자, 뭐가 다를까?" defaultOpen>
      <p>
        숫자(1~5) 베팅은 그 숫자 <b>또는</b> 별(★, 와일드)이 나오면 인정돼요 — 주사위 한 개당 확률이 2/6.
        별 베팅은 <b>진짜 별</b>만 인정돼요 — 주사위 한 개당 확률이 1/6, 숫자의 딱 절반이에요.
      </p>
      <p className="text-white/50">그래서 베팅을 숫자 ⇄ 별로 바꿀 때 개수가 이렇게 계산돼요:</p>
      <div className="flex flex-col gap-1">
        {ROWS.map((r) => (
          <div key={r.number} className="flex items-center justify-center gap-3 rounded bg-white/5 px-2 py-1">
            <span className="font-semibold">숫자 {r.number}개</span>
            <span className="text-white/40">⇄</span>
            <span className="font-semibold text-red-300">별 {r.star}개</span>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  );
}
