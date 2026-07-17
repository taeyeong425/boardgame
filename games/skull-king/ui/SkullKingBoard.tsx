"use client";

import { useMemo, useState } from "react";
import { CumulativeScoreboard } from "@/components/common/CumulativeScoreboard";
import type { GameComponentProps } from "../../gameComponentProps";
import type { SkullKingClientState } from "../engine/clientView";
import { legalCardIds } from "../engine/trick";
import type { Card, TigressDeclaration } from "../engine/types";
import { BidControls } from "./BidControls";
import { CardFace } from "./CardFace";
import { CardLegend } from "./CardLegend";
import { HandView } from "./HandView";
import { OpponentStatusStrip } from "./OpponentStatusStrip";
import { RoundResultBanner } from "./RoundResultBanner";
import { RulesPanel } from "./RulesPanel";
import { SkullKingScoreboard } from "./SkullKingScoreboard";
import { TrickRevealOverlay } from "./TrickRevealOverlay";
import { TrickTable } from "./TrickTable";

export function SkullKingGame({ selfPlayerId, gameState, roomTotals, sendAction }: GameComponentProps) {
  const state = gameState as SkullKingClientState;
  const [pendingTigressId, setPendingTigressId] = useState<string | null>(null);
  // Local-only pacing: each client pauses on its own latest resolved trick until it clicks
  // "다음", independent of the other player and independent of the server (which has already
  // moved the game on). trickSequence increments once per trick across the whole game, including
  // across round boundaries, so this comparison alone detects every new reveal.
  const [acknowledgedTrickSeq, setAcknowledgedTrickSeq] = useState(0);
  const pendingReveal = state.trickSequence > acknowledgedTrickSeq ? state.lastTrickReveal : null;

  const isMyTurn = state.currentTurnPlayerId === selfPlayerId;
  const playerNames = Object.fromEntries(state.players.map((p) => [p.id, p.nickname]));
  const biddedCount = (state.myBid !== null ? 1 : 0) + state.opponents.filter((o) => o.bidSubmitted).length;

  const legalIds = useMemo(
    () => (state.roundPhase === "playing" ? legalCardIds(state.myHand, state.currentTrick?.ledSuit ?? null) : []),
    [state.roundPhase, state.myHand, state.currentTrick]
  );

  function handlePlay(card: Card) {
    if (card.kind === "tigress") {
      setPendingTigressId(card.id);
      return;
    }
    sendAction({ type: "playCard", cardId: card.id });
  }

  function declareTigress(as: TigressDeclaration) {
    if (!pendingTigressId) return;
    sendAction({ type: "playCard", cardId: pendingTigressId, declareTigressAs: as });
    setPendingTigressId(null);
  }

  if (state.phase === "gameOver") {
    const ranked = Object.entries(state.cumulativeScores).sort((a, b) => b[1] - a[1]);
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-center text-lg font-bold">최종 결과!</h2>
        {ranked.map(([playerId, score], i) => (
          <div key={playerId} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
            <span className="font-semibold">
              {i + 1}위 {playerId === selfPlayerId ? "나" : (playerNames[playerId] ?? "?")}
            </span>
            <span className="text-lg font-bold text-emerald-300">{score}점</span>
          </div>
        ))}
        <SkullKingScoreboard players={state.players} roundHistory={state.roundHistory} cumulativeScores={state.cumulativeScores} />
        <CumulativeScoreboard players={state.players} totals={roomTotals} />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-3">
      {pendingReveal && (
        <TrickRevealOverlay
          reveal={pendingReveal}
          playerNames={playerNames}
          selfPlayerId={selfPlayerId}
          onNext={() => setAcknowledgedTrickSeq(state.trickSequence)}
        />
      )}
      {!pendingReveal && <RoundResultBanner result={state.roundHistory[state.roundHistory.length - 1]} playerNames={playerNames} />}

      <RulesPanel />
      <CardLegend />

      <OpponentStatusStrip
        opponents={state.opponents}
        currentTurnPlayerId={state.currentTurnPlayerId}
        roundPhase={state.roundPhase}
        self={{ handCount: state.myHand.length, tricksWon: state.myTricksWon, bid: state.myBid }}
        turnOrder={state.turnOrder}
        selfPlayerId={selfPlayerId}
      />

      {state.roundPhase === "playing" && <TrickTable trick={state.currentTrick} playerNames={playerNames} />}

      {state.roundPhase === "bidding" && (
        <div className="text-center text-xs text-white/50">베팅 완료: {biddedCount}/{state.players.length}명</div>
      )}

      <div>
        <p className="mb-1 text-center text-xs text-white/50">
          내 손패
          {pendingTigressId && " (타이그리스 선언 중)"}
        </p>
        {pendingTigressId ? (
          <div className="flex justify-center">
            <CardFace card={state.myHand.find((c) => c.id === pendingTigressId)!} />
          </div>
        ) : (
          <HandView hand={state.myHand} legalIds={legalIds} playable={!pendingReveal && state.roundPhase === "playing" && isMyTurn} onPlay={handlePlay} />
        )}
      </div>

      <BidControls
        maxBid={state.roundNumber}
        playable={!pendingReveal && state.roundPhase === "bidding" && state.myBid === null}
        onSubmit={(v) => sendAction({ type: "bid", value: v })}
      />

      {pendingTigressId && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-orange-400/40 bg-orange-400/10 p-3">
          <p className="text-xs text-white/70">타이그리스를 어떻게 낼까요?</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => declareTigress("pirate")}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white active:scale-95"
            >
              🏴‍☠️ 해적으로
            </button>
            <button
              type="button"
              onClick={() => declareTigress("escape")}
              className="rounded-lg bg-stone-600 px-4 py-2 text-sm font-semibold text-white active:scale-95"
            >
              🏃 탈출로
            </button>
          </div>
        </div>
      )}

      <SkullKingScoreboard players={state.players} roundHistory={state.roundHistory} cumulativeScores={state.cumulativeScores} />
      <CumulativeScoreboard players={state.players} totals={roomTotals} />
    </div>
  );
}
