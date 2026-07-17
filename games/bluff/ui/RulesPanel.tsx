import { CollapsiblePanel } from "@/components/common/CollapsiblePanel";

export function RulesPanel() {
  return (
    <CollapsiblePanel title="❓ 게임 방법">
      <p>내 차례엔 이전 베팅보다 개수를 올리거나(같은 개수면 얼굴을 올려서) 새 베팅을 하거나, &ldquo;블러프!&rdquo;를 외쳐 도전할 수 있어요.</p>
      <p>블러프를 외치면 모두 주사위를 공개해서, 베팅한 숫자(또는 별)가 실제로 몇 개인지 확인해요.</p>
      <ul className="list-disc pl-4">
        <li>실제 개수가 베팅보다 많으면 — 도전한 사람이 그 차이만큼 잃어요.</li>
        <li>실제 개수가 베팅보다 적으면 — 베팅한 사람이 그 차이만큼 잃어요.</li>
        <li>정확히 같으면 — 도전한 사람만 빼고 전원 1개씩 잃어요.</li>
      </ul>
      <p className="text-white/50">주사위를 모두 잃으면 탈락, 마지막까지 남는 사람이 승리해요.</p>
    </CollapsiblePanel>
  );
}
