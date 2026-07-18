"use client";

import { useState } from "react";
import { CumulativeScoreboard } from "@/components/common/CumulativeScoreboard";
import type { GameComponentProps } from "../../gameComponentProps";
import type { DalmutiClientState } from "../engine/clientView";
import { isLegalPlay } from "../engine/trick";
import type { Card } from "../engine/types";
import { HandView } from "./HandView";
import { OpponentStatusStrip } from "./OpponentStatusStrip";
import { RulesPanel } from "./RulesPanel";
import { RevolutionPrompt, TributeReturnPicker } from "./TributePanel";
import { TrickTable } from "./TrickTable";

export function DalmutiGame({ selfPlayerId, gameState, roomTotals, sendAction }: GameComponentProps) {
  const state = gameState as DalmutiClientState;
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const playerNames = Object.fromEntries(state.players.map((p) => [p.id, p.nickname]));
  const isMyTurn = state.currentTurnPlayerId === selfPlayerId;

  function toggleCard(cardId: string) {
    setSelectedCardIds((cur) => (cur.includes(cardId) ? cur.filter((id) => id !== cardId) : [...cur, cardId]));
  }

  if (state.phase === "gameOver") {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-center text-lg font-bold">최종 결과!</h2>
        {state.finishOrder.map((id, i) => (
          <div key={id} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
            <span className="font-semibold">
              {i + 1}위 {id === selfPlayerId ? "나" : (playerNames[id] ?? "?")}
            </span>
          </div>
        ))}
        <CumulativeScoreboard players={state.players} totals={roomTotals} />
      </div>
    );
  }

  const myFinishRank = state.myFinished ? state.finishOrder.indexOf(selfPlayerId) + 1 : null;
  const awaitingMyRevolutionDecision = state.phase === "tribute" && state.pendingRevolutionPlayerId === selfPlayerId;
  const awaitingMyTributeReturn =
    state.phase === "tribute" &&
    state.pendingRevolutionPlayerId === null &&
    state.pendingTribute !== null &&
    isMyTurn;

  return (
    <div className="relative flex flex-col gap-3">
      <RulesPanel />

      <OpponentStatusStrip
        opponents={state.opponents}
        currentTurnPlayerId={state.currentTurnPlayerId}
        self={{
          handCount: state.myHand.length,
          socialRankTitle: state.mySocialRankTitle,
          finished: state.myFinished,
          finishRank: myFinishRank,
        }}
        turnOrder={state.turnOrder}
        selfPlayerId={selfPlayerId}
      />

      {state.phase === "tribute" &&
        state.pendingRevolutionPlayerId !== null &&
        (awaitingMyRevolutionDecision ? (
          <RevolutionPrompt onDeclare={(reveal) => sendAction({ type: "declareRevolution", reveal })} />
        ) : (
          <p className="text-center text-xs text-white/50">
            {playerNames[state.pendingRevolutionPlayerId] ?? "?"}님이 혁명 여부를 고민 중이에요...
          </p>
        ))}

      {state.phase === "tribute" &&
        state.pendingRevolutionPlayerId === null &&
        state.pendingTribute !== null &&
        (awaitingMyTributeReturn ? (
          <TributeReturnPicker
            hand={state.myHand}
            requiredCount={state.mySocialRankTitle === "달무티" ? 2 : 1}
            onSubmit={(cardIds) => sendAction({ type: "returnTribute", cardIds })}
          />
        ) : (
          <p className="text-center text-xs text-white/50">조공을 정리하는 중이에요...</p>
        ))}

      {state.revolutionResult === "revolution" && (
        <p className="text-center text-xs text-amber-300">혁명 발생! 이번 판은 조공 없이 동등하게 진행돼요.</p>
      )}
      {state.revolutionResult === "grandRevolution" && (
        <p className="text-center text-xs text-amber-300">대혁명 발생! 서열이 뒤집혔어요.</p>
      )}

      {state.phase === "playing" && (
        <>
          <TrickTable trick={state.currentTrick} playerNames={playerNames} />
          {!state.currentTrick && state.lastClearedTrick && (
            <p className="text-center text-xs text-white/40">
              {playerNames[state.lastClearedTrick.lastPlayerId] ?? "?"}님이 다시 선이에요
            </p>
          )}
        </>
      )}

      {!awaitingMyTributeReturn && (
        <div>
          <p className="mb-1 text-center text-xs text-white/50">
            내 손패 ({state.myHand.length}장) — {state.mySocialRankTitle}
          </p>
          <HandView
            hand={state.myHand}
            selectedCardIds={selectedCardIds}
            playable={state.phase === "playing" && isMyTurn}
            onToggleCard={toggleCard}
          />
        </div>
      )}

      {state.phase === "playing" && isMyTurn && (
        <PlayControls
          selectedCards={state.myHand.filter((c) => selectedCardIds.includes(c.id))}
          currentTrick={state.currentTrick}
          onPlay={() => {
            sendAction({ type: "play", cardIds: selectedCardIds });
            setSelectedCardIds([]);
          }}
          onPass={() => sendAction({ type: "pass" })}
        />
      )}

      <CumulativeScoreboard players={state.players} totals={roomTotals} />
    </div>
  );
}

function PlayControls({
  selectedCards,
  currentTrick,
  onPlay,
  onPass,
}: {
  selectedCards: Card[];
  currentTrick: { lastPlayerId: string; cards: Card[] } | null;
  onPlay: () => void;
  onPass: () => void;
}) {
  const legal = selectedCards.length > 0 && isLegalPlay(selectedCards, currentTrick);
  return (
    <div className="flex items-center justify-center gap-3">
      {currentTrick !== null && (
        <button
          type="button"
          onClick={onPass}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold active:scale-95"
        >
          패스
        </button>
      )}
      <button
        type="button"
        disabled={!legal}
        onClick={onPlay}
        className="rounded-lg bg-emerald-500 px-6 py-2 font-semibold text-white active:scale-95 disabled:opacity-40"
      >
        {selectedCards.length > 0 ? `${selectedCards.length}장 내기` : "카드를 골라주세요"}
      </button>
    </div>
  );
}
