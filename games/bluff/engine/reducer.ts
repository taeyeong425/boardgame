import { freshRng } from "../../../shared/rng";
import type { Player } from "../../../shared/types";
import { isLegalBid, minimalLegalBid } from "./bidding";
import { countMatching, rollAll, startingDiceCount } from "./dice";
import type {
  Bid,
  BluffMove,
  BluffState,
  PlayerGameState,
  PlayerId,
  RoundResult,
  RoundState,
} from "./types";

export type ApplyMoveResult = { ok: true; state: BluffState } | { ok: false; error: string };

function buildRound(
  roundNumber: number,
  startingPlayerId: PlayerId,
  turnOrder: PlayerId[],
  diceCounts: Record<PlayerId, number>
): RoundState {
  return {
    roundNumber,
    rolls: rollAll(diceCounts, freshRng()),
    turnOrder,
    currentTurnIndex: turnOrder.indexOf(startingPlayerId),
    currentBid: null,
    lastBidderId: null,
    bidLog: [],
  };
}

/** Next seat (circular) with dice remaining — always terminates while phase is "bidding" since
 * at least 2 players still have dice whenever the game hasn't ended. */
function nextActiveIndex(turnOrder: PlayerId[], players: PlayerGameState[], fromIndex: number): number {
  const n = turnOrder.length;
  let idx = fromIndex;
  for (let step = 0; step < n; step++) {
    idx = (idx + 1) % n;
    const p = players.find((pl) => pl.id === turnOrder[idx]);
    if (p && p.diceCount > 0) return idx;
  }
  return fromIndex;
}

export function createInitialState(players: Player[], startingPlayerId?: string | null): BluffState {
  const turnOrder = players.map((p) => p.id);
  const dicePerPlayer = startingDiceCount(turnOrder.length);
  const playerStates: PlayerGameState[] = players.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    diceCount: dicePerPlayer,
    eliminatedAtRound: null,
  }));
  const resolvedStart =
    startingPlayerId && turnOrder.includes(startingPlayerId)
      ? startingPlayerId
      : turnOrder[Math.floor(Math.random() * turnOrder.length)];
  const diceCounts = Object.fromEntries(playerStates.map((p) => [p.id, p.diceCount]));
  const round = buildRound(1, resolvedStart, turnOrder, diceCounts);
  return { players: playerStates, round, roundHistory: [], phase: "bidding", winnerId: null };
}

export function applyMove(state: BluffState, playerId: PlayerId, move: BluffMove): ApplyMoveResult {
  if (state.phase === "gameOver") return { ok: false, error: "GAME_OVER" };
  const round = state.round;
  if (round.turnOrder[round.currentTurnIndex] !== playerId) return { ok: false, error: "NOT_YOUR_TURN" };

  if (move.type === "placeBid") {
    const nextBid: Bid = { count: move.count, face: move.face };
    if (!isLegalBid(round.currentBid, nextBid)) return { ok: false, error: "ILLEGAL_BID" };
    const newRound: RoundState = {
      ...round,
      currentBid: nextBid,
      lastBidderId: playerId,
      bidLog: [...round.bidLog, { playerId, bid: nextBid }],
      currentTurnIndex: nextActiveIndex(round.turnOrder, state.players, round.currentTurnIndex),
    };
    return { ok: true, state: { ...state, round: newRound } };
  }

  // move.type === "challenge"
  if (round.currentBid === null || round.lastBidderId === null) return { ok: false, error: "NO_BID_TO_CHALLENGE" };
  if (playerId === round.lastBidderId) return { ok: false, error: "CANNOT_CHALLENGE_OWN_BID" };

  const bid = round.currentBid;
  const bidderId = round.lastBidderId;
  const actualCount = countMatching(round.rolls, bid.face);
  const diceLost: Record<PlayerId, number> = {};
  let outcome: RoundResult["outcome"];

  if (actualCount > bid.count) {
    outcome = "challengerLoses";
    diceLost[playerId] = actualCount - bid.count;
  } else if (actualCount < bid.count) {
    outcome = "bidderLoses";
    diceLost[bidderId] = bid.count - actualCount;
  } else {
    outcome = "allButBidderLose";
    for (const p of state.players) {
      if (p.diceCount > 0 && p.id !== bidderId) diceLost[p.id] = 1;
    }
  }

  const players = state.players.map((p) => {
    const lost = diceLost[p.id] ?? 0;
    if (lost === 0) return p;
    const newCount = Math.max(0, p.diceCount - lost);
    return {
      ...p,
      diceCount: newCount,
      eliminatedAtRound: newCount === 0 && p.eliminatedAtRound === null ? round.roundNumber : p.eliminatedAtRound,
    };
  });

  const result: RoundResult = {
    roundNumber: round.roundNumber,
    challengerId: playerId,
    bidderId,
    bid,
    actualCount,
    outcome,
    diceLost,
    revealedRolls: round.rolls,
  };
  const roundHistory = [...state.roundHistory, result];

  const stillActive = players.filter((p) => p.diceCount > 0);
  if (stillActive.length <= 1) {
    return {
      ok: true,
      state: { ...state, players, roundHistory, phase: "gameOver", winnerId: stillActive[0]?.id ?? null },
    };
  }

  // Next round starts with the challenger, unless the challenge just eliminated them — then the
  // next active seat after them starts instead.
  const challengerIndex = round.turnOrder.indexOf(playerId);
  const challengerStillActive = players.find((p) => p.id === playerId)!.diceCount > 0;
  const nextStartIndex = challengerStillActive
    ? challengerIndex
    : nextActiveIndex(round.turnOrder, players, challengerIndex);
  const nextStartId = round.turnOrder[nextStartIndex];

  const diceCounts = Object.fromEntries(players.map((p) => [p.id, p.diceCount]));
  const nextRound = buildRound(round.roundNumber + 1, nextStartId, round.turnOrder, diceCounts);

  return { ok: true, state: { ...state, players, roundHistory, round: nextRound, phase: "bidding" } };
}

export function isGameOver(state: BluffState): boolean {
  return state.phase === "gameOver";
}

export function getCurrentTurnPlayerId(state: BluffState): PlayerId | null {
  if (state.phase === "gameOver") return null;
  return state.round.turnOrder[state.round.currentTurnIndex];
}

export function computeResult(state: BluffState): { rawScores: Record<string, number>; sortOrder: "desc"; summary: string } {
  const rawScores: Record<string, number> = {};
  const bestRank = state.round.roundNumber + 1; // survivor ranks above any elimination round
  for (const p of state.players) {
    rawScores[p.id] = p.eliminatedAtRound ?? bestRank;
  }
  const winnerName = state.players.find((p) => p.id === state.winnerId)?.nickname ?? "?";
  return { rawScores, sortOrder: "desc", summary: `최후의 생존자: ${winnerName}` };
}

export function autoMove(state: BluffState, _playerId: PlayerId): BluffMove {
  const round = state.round;
  if (round.currentBid === null) {
    const bid = minimalLegalBid(null);
    return { type: "placeBid", count: bid.count, face: bid.face };
  }
  // Simplest safe timeout policy: challenge whatever's currently on the table. Always legal —
  // the turn pointer never rests on the player who made the current bid.
  return { type: "challenge" };
}
