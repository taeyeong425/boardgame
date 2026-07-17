import { CollapsiblePanel } from "@/components/common/CollapsiblePanel";
import type { Card } from "../engine/types";
import { CardFace } from "./CardFace";

const ENTRIES: { card: Card; title: string; body: string }[] = [
  {
    card: { kind: "mermaid", id: "legend-mermaid" },
    title: "인어",
    body: "숫자 카드는 다 이기고 해적에게는 지지만, 스컬킹만은 인어가 이겨요 (스컬킹을 잡는 유일한 카드).",
  },
  {
    card: { kind: "skullKing", id: "legend-skullking" },
    title: "스컬킹",
    body: "인어를 빼고 모든 카드를 이겨요. 해적을 잡으면 해적 1명당 보너스 점수를 받아요.",
  },
  {
    card: { kind: "pirate", id: "legend-pirate" },
    title: "해적",
    body: "숫자 카드(검은색 포함)를 다 이기지만 스컬킹에게는 져요. 해적이 여럿이면 먼저 낸 해적이 이겨요.",
  },
  {
    card: { kind: "tigress", id: "legend-tigress" },
    title: "타이그리스",
    body: "낼 때 해적 또는 탈출 중 하나를 직접 선택해요 — 선택한 대로 그 카드처럼 취급돼요.",
  },
  {
    card: { kind: "escape", id: "legend-escape" },
    title: "탈출",
    body: "거의 항상 져요. 단, 이번 트릭에 낸 카드가 전부 탈출이면 가장 먼저 낸 사람이 이겨요.",
  },
  {
    card: { kind: "number", id: "legend-black", suit: "black", value: 14 },
    title: "검은색(조각배) 숫자",
    body: "다른 색 숫자 카드보다는 항상 이기지만, 해적·스컬킹·인어에게는 져요.",
  },
];

export function CardLegend() {
  return (
    <CollapsiblePanel title="❓ 카드 설명">
      {ENTRIES.map((e) => (
        <div key={e.title} className="flex items-start gap-2">
          <CardFace card={e.card} size="sm" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-white/90">{e.title}</p>
            <p className="text-xs text-white/60">{e.body}</p>
          </div>
        </div>
      ))}
    </CollapsiblePanel>
  );
}
