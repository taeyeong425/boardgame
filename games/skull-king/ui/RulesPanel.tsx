import { CollapsiblePanel } from "@/components/common/CollapsiblePanel";

export function RulesPanel() {
  return (
    <CollapsiblePanel title="❓ 게임 방법">
      <p>라운드마다 손패로 몇 트릭을 이길지 예측(베팅)한 뒤, 한 장씩 카드를 내며 트릭을 진행해요.</p>
      <p>첫 카드가 낸 색이 그 트릭의 색이 되고, 손에 그 색이 있으면 반드시 따라 내야 해요.</p>
      <p className="text-white/50">
        해적·인어·스컬킹 같은 특수 카드는 색 구분 없이 낼 수 있고, 우선순위(인어 &gt; 스컬킹 &gt; 해적 &gt; 검은색 &gt;
        같은 색 숫자)로 트릭을 가져가요.
      </p>
      <p className="text-white/40">예측을 정확히 맞히면 트릭 수만큼 큰 점수, 틀리면 감점 — 자세한 카드별 설명은 아래 카드 설명을 확인하세요.</p>
    </CollapsiblePanel>
  );
}
