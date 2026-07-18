import { CollapsiblePanel } from "@/components/common/CollapsiblePanel";

export function RulesPanel() {
  return (
    <CollapsiblePanel title="❓ 게임 방법">
      <p>선 플레이어가 같은 숫자 카드를 원하는 장수만큼 내면, 다음 사람부터 같은 장수로 더 낮은 숫자만 낼 수 있어요 (낮을수록 높은 계급이에요).</p>
      <p>낼 카드가 없거나 내고 싶지 않으면 패스할 수 있어요. 모두가 패스하면 마지막으로 낸 사람이 다시 원하는 카드로 자유롭게 시작해요.</p>
      <p className="text-white/50">
        조커는 다른 카드와 함께 내면 그 숫자를 대신하는 만능 카드예요. 조커 혼자 내면 13(가장 낮은 계급) 취급이라 아무것도 못
        이겨요.
      </p>
      <p className="text-white/40">손패를 가장 먼저 다 낸 사람이 이번 판의 새 달무티가 돼요. 순서대로 등수가 매겨집니다.</p>
    </CollapsiblePanel>
  );
}
