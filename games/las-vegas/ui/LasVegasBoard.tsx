"use client";

import { CumulativeScoreboard } from "@/components/common/CumulativeScoreboard";
import type { GameComponentProps } from "../../gameComponentProps";
import type { LasVegasClientState } from "../engine/clientView";
import { CasinoBoard } from "./CasinoBoard";
import { OpponentStatusStrip } from "./OpponentStatusStrip";
import { RollControls } from "./RollControls";
import { RoundResultBanner } from "./RoundResultBanner";

function formatMoney(value: number): string {
  return `$${value.toLocaleString()}`;
}

export function LasVegasGame({ selfPlayerId, gameState, roomTotals, sendAction }: GameComponentProps) {
  const state = gameState as LasVegasClientState;

  const isMyTurn = state.currentTurnPlayerId === selfPlayerId;
  const playerNames = Object.fromEntries(state.players.map((p) => [p.id, p.nickname]));
  const currentTurnName = state.currentTurnPlayerId ? (playerNames[state.currentTurnPlayerId] ?? "?") : "?";

  if (state.phase === "gameOver" && state.finalReveal) {
    const ranked = [...state.finalReveal].sort((a, b) => b.totalMoney - a.totalMoney || b.bills.length - a.bills.length);
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-center text-lg font-bold">최종 결과 공개!</h2>
        {ranked.map((r, i) => (
          <div key={r.playerId} className="rounded-lg border border-white/10 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {i + 1}위 {r.playerId === selfPlayerId ? "나" : r.nickname}
              </span>
              <span className="text-lg font-bold text-emerald-300">{formatMoney(r.totalMoney)}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-xs text-white/60">
              {r.bills
                .sort((a, b) => b.value - a.value)
                .map((b, j) => (
                  <span key={j} className="rounded bg-white/10 px-1.5 py-0.5">
                    ${b.value / 1000}k
                  </span>
                ))}
            </div>
          </div>
        ))}
        <CumulativeScoreboard players={state.players} totals={roomTotals} />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-3">
      <RoundResultBanner result={state.roundHistory[state.roundHistory.length - 1]} playerNames={playerNames} />

      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">
          라운드 {state.roundNumber}/{state.totalRounds}
        </span>
        <span className="font-semibold">{isMyTurn ? "내 차례!" : `${currentTurnName}의 차례`}</span>
      </div>

      <OpponentStatusStrip opponents={state.opponents} currentTurnPlayerId={state.currentTurnPlayerId} />

      <div className="grid grid-cols-2 gap-2">
        {state.casinos.map((c) => (
          <CasinoBoard key={c.number} casino={c} playerNames={playerNames} selfPlayerId={selfPlayerId} />
        ))}
      </div>

      <p className="text-center text-xs text-white/50">
        내 상금 (비공개): {state.myBills.length}장 — {formatMoney(state.myTotalMoney)}
      </p>

      <RollControls
        pendingRoll={state.pendingRoll}
        ownDiceRemaining={state.myOwnDiceRemaining}
        houseDiceRemaining={state.myHouseDiceRemaining}
        playable={isMyTurn}
        onRoll={() => sendAction({ type: "roll" })}
        onPlaceFace={(face) => sendAction({ type: "placeFace", face })}
      />

      <CumulativeScoreboard players={Object.entries(playerNames).map(([id, nickname]) => ({ id, nickname }))} totals={roomTotals} />
    </div>
  );
}
