import { CollapsiblePanel } from "@/components/common/CollapsiblePanel";

export function RulesPanel() {
  return (
    <CollapsiblePanel title="❓ 게임 방법">
      <p>내 차례엔 남은 주사위를 모두 굴리고, 나온 숫자 중 하나를 골라 그 숫자의 카지노에 놓아요.</p>
      <p>한번 놓은 주사위는 그 판 동안 다시 못 굴려요 — 주사위가 남아 있으면 다음 차례에 또 굴려요.</p>
      <p>모두가 주사위를 다 쓰면 카지노마다 정산해요: 그 카지노에 주사위가 가장 많은 사람이 1등 상금, 그다음 많은 사람이 2등 상금 순으로 받아요.</p>
      <p className="text-white/50">단, 개수가 같으면 그 등수는 전원 탈락(상금 못 받음)하고 다음 등수로 밀리지 않아요.</p>
      <p className="text-white/40">이 방은 중립 주사위 없이 각자 주사위 8개만 쓰고, 1라운드만 진행해요 (하우스룰).</p>
    </CollapsiblePanel>
  );
}
