import { socialRankTitle, type SocialRankTitle } from "./tribute";
import type { Card, ClearedTrick, DalmutiState, PendingTribute, PlayerId, RevolutionResult } from "./types";

export interface OpponentStatus {
  playerId: PlayerId;
  nickname: string;
  handCount: number;
  socialRankTitle: SocialRankTitle;
  finished: boolean;
  finishRank: number | null; // 1-based once finished, else null
}

export interface DalmutiClientState {
  phase: "tribute" | "playing" | "gameOver";
  turnOrder: PlayerId[];
  currentTurnPlayerId: PlayerId | null;
  players: { id: PlayerId; nickname: string }[];
  myHand: Card[];
  mySocialRankTitle: SocialRankTitle;
  myFinished: boolean;
  initialRanks: PlayerId[];
  pendingRevolutionPlayerId: PlayerId | null;
  revolutionResult: RevolutionResult | null;
  pendingTribute: PendingTribute | null;
  opponents: OpponentStatus[];
  currentTrick: { lastPlayerId: PlayerId; cards: Card[] } | null;
  lastClearedTrick: ClearedTrick | null;
  finishOrder: PlayerId[];
}

function currentTurnPlayerId(state: DalmutiState): PlayerId | null {
  if (state.phase === "gameOver") return null;
  if (state.pendingRevolutionPlayerId !== null) return state.pendingRevolutionPlayerId;
  if (state.pendingTribute !== null) {
    return !state.pendingTribute.dalmutiReturned ? state.turnOrder[0] : state.turnOrder[1];
  }
  return state.turnOrder[state.turnIndex];
}

export function getClientView(state: DalmutiState, forPlayerId: PlayerId): DalmutiClientState {
  const n = state.turnOrder.length;

  return {
    phase: state.phase,
    turnOrder: state.turnOrder,
    currentTurnPlayerId: currentTurnPlayerId(state),
    players: state.players,
    myHand: state.hands[forPlayerId] ?? [],
    mySocialRankTitle: socialRankTitle(state.turnOrder.indexOf(forPlayerId), n),
    myFinished: state.finishOrder.includes(forPlayerId),
    initialRanks: state.initialRanks,
    pendingRevolutionPlayerId: state.pendingRevolutionPlayerId,
    revolutionResult: state.revolutionResult,
    pendingTribute: state.pendingTribute,
    opponents: state.players
      .filter((p) => p.id !== forPlayerId)
      .map((p) => {
        const finished = state.finishOrder.includes(p.id);
        return {
          playerId: p.id,
          nickname: p.nickname,
          handCount: state.hands[p.id]?.length ?? 0,
          socialRankTitle: socialRankTitle(state.turnOrder.indexOf(p.id), n),
          finished,
          finishRank: finished ? state.finishOrder.indexOf(p.id) + 1 : null,
        };
      }),
    currentTrick: state.currentTrick ? { lastPlayerId: state.currentTrick.lastPlayerId, cards: state.currentTrick.cards } : null,
    lastClearedTrick: state.lastClearedTrick,
    finishOrder: state.finishOrder,
  };
}
