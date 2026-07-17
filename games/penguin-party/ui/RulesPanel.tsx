import { CollapsiblePanel } from "@/components/common/CollapsiblePanel";

export function RulesPanel() {
  return (
    <CollapsiblePanel title="❓ 게임 방법">
      <p>손패의 카드로 피라미드를 쌓아요. 1층은 양쪽 끝에만 이어붙일 수 있고 색은 상관없어요.</p>
      <p>2층부터는 바로 아래 인접한 두 장 사이 빈칸에만 놓을 수 있고, 그 두 장 중 하나와 같은 색이어야 해요.</p>
      <p className="text-white/50">낼 수 있는 카드가 하나도 없으면 그 라운드에서 탈락하고 남은 손패 수만큼 벌점을 받아요.</p>
      <p className="text-white/40">마지막 카드까지 다 내면 벌점에서 2점을 깎아줘요 (보유 벌점이 있을 때만). 벌점은 낮을수록 좋아요.</p>
    </CollapsiblePanel>
  );
}
