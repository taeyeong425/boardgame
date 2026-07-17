"use client";

import { CumulativeScoreboard } from "@/components/common/CumulativeScoreboard";
import type { GameComponentProps } from "../../gameComponentProps";
import type { BluffClientState } from "../engine/clientView";
import { BidLadder } from "./BidLadder";
import { BidProgressTrack } from "./BidProgressTrack";
import { BidReferenceBoard } from "./BidReferenceBoard";
import { DiceHand } from "./DiceHand";
import { PlayerOrderStrip } from "./PlayerOrderStrip";
import { RoundResultBanner } from "./RoundResultBanner";
import { RulesPanel } from "./RulesPanel";

export function BluffGame({ selfPlayerId, gameState, roomTotals, sendAction }: GameComponentProps) {
  const state = gameState as BluffClientState;

  const isMyTurn = state.currentTurnPlayerId === selfPlayerId && !state.myEliminated;
  const playerNames = Object.fromEntries(state.players.map((p) => [p.id, p.nickname]));
  const currentTurnName = state.currentTurnPlayerId ? (playerNames[state.currentTurnPlayerId] ?? "?") : "?";
  const totalDiceRemaining =
    state.myDiceCount + state.opponents.reduce((sum, o) => sum + o.diceCount, 0);

  return (
    <div className="relative flex flex-col gap-3">
      <RoundResultBanner result={state.lastRoundResult} nicknames={playerNames} />

      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">라운드 {state.roundNumber}</span>
        <span className="font-semibold">
          {state.phase === "gameOver" ? "게임 종료" : isMyTurn ? "내 차례!" : `${currentTurnName}의 차례`}
        </span>
      </div>

      <RulesPanel />

      <PlayerOrderStrip
        turnOrder={state.turnOrder}
        playerNames={playerNames}
        currentTurnPlayerId={state.currentTurnPlayerId}
        selfPlayerId={selfPlayerId}
        selfDiceCount={state.myDiceCount}
        selfEliminated={state.myEliminated}
        opponents={state.opponents}
        totalDiceRemaining={totalDiceRemaining}
      />

      <BidProgressTrack bidLog={state.bidLog} playerNames={playerNames} />

      {state.myEliminated && <p className="text-center text-sm text-red-300">탈락 — 주사위를 모두 잃었어요.</p>}

      <div>
        <p className="mb-1 text-center text-xs text-white/50">내 주사위 ({state.myDiceCount}개)</p>
        <DiceHand dice={state.myDice} roundNumber={state.roundNumber} />
      </div>

      <BidLadder
        currentBid={state.currentBid}
        maxCount={Math.max(totalDiceRemaining, (state.currentBid?.count ?? 0) + 3)}
        playable={isMyTurn}
        onBid={(bid) => sendAction({ type: "placeBid", count: bid.count, face: bid.face })}
      />

      {isMyTurn && state.currentBid !== null && (
        <button
          type="button"
          onClick={() => sendAction({ type: "challenge" })}
          className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white active:scale-95"
        >
          블러프!
        </button>
      )}

      <BidReferenceBoard />

      <CumulativeScoreboard players={state.players} totals={roomTotals} />
    </div>
  );
}
