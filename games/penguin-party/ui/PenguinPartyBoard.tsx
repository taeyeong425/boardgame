"use client";

import { useMemo, useState } from "react";
import { CumulativeScoreboard } from "@/components/common/CumulativeScoreboard";
import type { GameComponentProps } from "../../gameComponentProps";
import type { PenguinPartyClientState } from "../engine/clientView";
import { getAllLegalPositions } from "../engine/pyramid";
import type { PyramidPosition } from "../engine/types";
import { OpponentStrip } from "./OpponentStrip";
import { PlayerHand } from "./PlayerHand";
import { PyramidView } from "./PyramidView";
import { RoundResultBanner } from "./RoundResultBanner";
import { RulesPanel } from "./RulesPanel";
import { cardColorLabel } from "./cardColor";

export function PenguinPartyGame({ selfPlayerId, gameState, roomTotals, sendAction }: GameComponentProps) {
  const state = gameState as PenguinPartyClientState;
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const isMyTurn = state.currentTurnPlayerId === selfPlayerId && !state.myEliminated;

  const legalPositions = useMemo(() => getAllLegalPositions(state.pyramid), [state.pyramid]);

  const selectedCard = state.myHand.find((c) => c.id === selectedCardId) ?? null;

  // legalPositions is always shown (the pyramid's open slots, and which colors each needs) —
  // activeKeys is just the subset actually placeable with the currently selected card.
  const activeKeys = useMemo(() => {
    if (!isMyTurn || !selectedCard) return new Set<string>();
    return new Set(
      legalPositions
        .filter((lp) => lp.allowedColors === "any" || lp.allowedColors.includes(selectedCard.color))
        .map((lp) => `${lp.position.layer}:${lp.position.index}`)
    );
  }, [isMyTurn, selectedCard, legalPositions]);

  function handleSelectPosition(position: PyramidPosition) {
    if (!selectedCardId) return;
    sendAction({ type: "placeCard", cardId: selectedCardId, position });
    setSelectedCardId(null);
  }

  const playerNames = Object.fromEntries(state.players.map((p) => [p.id, p.nickname]));

  return (
    <div className="relative flex flex-col gap-3">
      <RoundResultBanner summary={state.lastRoundSummary} playerNames={playerNames} />

      <RulesPanel />

      <OpponentStrip
        opponents={state.opponents}
        currentTurnPlayerId={state.currentTurnPlayerId}
        self={{
          cardCount: state.myHand.length,
          eliminated: state.myEliminated,
          emptiedHand: state.myEmptiedHand,
        }}
        turnOrder={state.turnOrder}
        selfPlayerId={selfPlayerId}
      />

      {state.revealedExtraCard && (
        <p className="text-xs text-white/50">
          공개 카드({cardColorLabel(state.revealedExtraCard.color)}) — 이번 라운드에는 사용되지 않아요.
        </p>
      )}

      <PyramidView
        pyramid={state.pyramid}
        legalPositions={legalPositions}
        activeKeys={activeKeys}
        onSelectPosition={handleSelectPosition}
      />

      {state.myEliminated && (
        <p className="text-center text-sm text-red-300">이번 라운드 탈락 — 남은 카드는 비공개로 유지됩니다.</p>
      )}
      {state.myEmptiedHand && !state.myEliminated && (
        <p className="text-center text-sm text-emerald-300">카드를 모두 냈어요! 라운드가 끝날 때까지 기다려주세요.</p>
      )}

      <PlayerHand
        hand={state.myHand}
        selectedCardId={selectedCardId}
        playable={isMyTurn}
        onSelectCard={(id) => setSelectedCardId((cur) => (cur === id ? null : id))}
      />

      <CumulativeScoreboard players={state.players} totals={roomTotals} />
    </div>
  );
}
