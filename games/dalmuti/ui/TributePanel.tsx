"use client";

import { useState } from "react";
import type { Card } from "../engine/types";
import { HandView } from "./HandView";

export function RevolutionPrompt({ onDeclare }: { onDeclare: (reveal: boolean) => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-orange-400/40 bg-orange-400/10 p-3">
      <p className="text-xs text-white/70">조커 2장을 모두 받았어요! 혁명을 선언할까요?</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onDeclare(true)}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white active:scale-95"
        >
          혁명 선언
        </button>
        <button
          type="button"
          onClick={() => onDeclare(false)}
          className="rounded-lg bg-stone-600 px-4 py-2 text-sm font-semibold text-white active:scale-95"
        >
          그냥 진행
        </button>
      </div>
    </div>
  );
}

export function TributeReturnPicker({
  hand,
  requiredCount,
  onSubmit,
}: {
  hand: Card[];
  requiredCount: number;
  onSubmit: (cardIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(cardId: string) {
    setSelected((cur) => {
      if (cur.includes(cardId)) return cur.filter((id) => id !== cardId);
      if (cur.length >= requiredCount) return cur; // already at the limit — ignore further picks
      return [...cur, cardId];
    });
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3">
      <p className="text-xs text-white/60">돌려줄 카드 {requiredCount}장을 골라주세요 (아무 카드나 가능해요)</p>
      <HandView hand={hand} selectedCardIds={selected} playable onToggleCard={toggle} />
      <button
        type="button"
        disabled={selected.length !== requiredCount}
        onClick={() => onSubmit(selected)}
        className="rounded-lg bg-emerald-500 px-6 py-2 font-semibold text-white active:scale-95 disabled:opacity-40"
      >
        확정
      </button>
    </div>
  );
}
