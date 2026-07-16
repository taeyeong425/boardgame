"use client";

import { CumulativeScoreboard } from "@/components/common/CumulativeScoreboard";
import type { GameComponentProps } from "../../gameComponentProps";
import type { BluffClientState } from "../engine/clientView";
import type { Bid } from "../engine/types";
import { BidControls } from "./BidControls";
import { DiceHand } from "./DiceHand";
import { OpponentDiceStrip } from "./OpponentDiceStrip";
import { RoundResultBanner } from "./RoundResultBanner";

function faceLabel(face: Bid["face"]): string {
  return face === "star" ? "★" : String(face);
}

export function BluffGame({ selfPlayerId, gameState, roomTotals, sendAction }: GameComponentProps) {
  const state = gameState as BluffClientState;

  const isMyTurn = state.currentTurnPlayerId === selfPlayerId && !state.myEliminated;
  const playerNames = Object.fromEntries(state.players.map((p) => [p.id, p.nickname]));
  const currentTurnName = state.currentTurnPlayerId ? (playerNames[state.currentTurnPlayerId] ?? "?") : "?";
  const lastBidderName = state.lastBidderId ? (playerNames[state.lastBidderId] ?? "?") : null;

  return (
    <div className="relative flex flex-col gap-3">
      <RoundResultBanner result={state.lastRoundResult} nicknames={playerNames} />

      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">라운드 {state.roundNumber}</span>
        <span className="font-semibold">
          {state.phase === "gameOver" ? "게임 종료" : isMyTurn ? "내 차례!" : `${currentTurnName}의 차례`}
        </span>
      </div>

      <OpponentDiceStrip opponents={state.opponents} currentTurnPlayerId={state.currentTurnPlayerId} />

      <div className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-4">
        <span className="text-xs text-white/50">현재 베팅</span>
        {state.currentBid ? (
          <span className="text-2xl font-bold">
            {state.currentBid.count}개의 {faceLabel(state.currentBid.face)}
            {lastBidderName && <span className="ml-2 text-sm font-normal text-white/50">({lastBidderName})</span>}
          </span>
        ) : (
          <span className="text-lg text-white/40">아직 베팅 없음 — 첫 베팅을 기다리는 중</span>
        )}
      </div>

      {state.myEliminated && <p className="text-center text-sm text-red-300">탈락 — 주사위를 모두 잃었어요.</p>}

      <div>
        <p className="mb-1 text-center text-xs text-white/50">내 주사위 ({state.myDiceCount}개)</p>
        <DiceHand dice={state.myDice} roundNumber={state.roundNumber} />
      </div>

      <BidControls
        // Remounts whenever the table bid actually changes, so its internal draft resets to a
        // fresh suggestion without needing an effect to sync it.
        key={state.currentBid ? `${state.currentBid.count}-${state.currentBid.face}` : "opening"}
        currentBid={state.currentBid}
        playable={isMyTurn}
        onBid={(bid) => sendAction({ type: "placeBid", count: bid.count, face: bid.face })}
        onChallenge={() => sendAction({ type: "challenge" })}
      />

      <CumulativeScoreboard players={state.players} totals={roomTotals} />
    </div>
  );
}
