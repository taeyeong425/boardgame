import { freshRng, shuffle } from "../../../shared/rng";
import type { Player } from "../../../shared/types";
import { dealAll } from "./deck";
import { effectiveRank, isLegalPlay, nextActiveIndex, resolveNextLeaderIndex } from "./trick";
import { hasBothJokers, lowestCards } from "./tribute";
import type { ActiveTrick, DalmutiMove, DalmutiState, PlayerId } from "./types";

export type ApplyMoveResult = { ok: true; state: DalmutiState } | { ok: false; error: string };

/** Applies the automatic "give up" side of tribute (농노's 2 lowest → 달무티, 소작농's 1 lowest →
 * 총리대신) and opens the give-back window. Not a player move — the source material has no choice
 * here, only "가장 작은 카드". */
function applyForcedTribute(state: DalmutiState): DalmutiState {
  const n = state.turnOrder.length;
  const dalmutiId = state.turnOrder[0];
  const primeMinisterId = state.turnOrder[1];
  const serfId = state.turnOrder[n - 2];
  const peasantId = state.turnOrder[n - 1];

  const peasantTribute = lowestCards(state.hands[peasantId], 2);
  const serfTribute = lowestCards(state.hands[serfId], 1);

  const hands = { ...state.hands };
  hands[peasantId] = hands[peasantId].filter((c) => !peasantTribute.includes(c));
  hands[serfId] = hands[serfId].filter((c) => !serfTribute.includes(c));
  hands[dalmutiId] = [...hands[dalmutiId], ...peasantTribute];
  hands[primeMinisterId] = [...hands[primeMinisterId], ...serfTribute];

  return {
    ...state,
    hands,
    pendingRevolutionPlayerId: null,
    revolutionResult: state.revolutionResult ?? "none",
    pendingTribute: { dalmutiReturned: false, primeMinisterReturned: false },
  };
}

export function createInitialState(players: Player[]): DalmutiState {
  const baseOrder = players.map((p) => p.id);
  const initialRanks = shuffle(baseOrder, freshRng());
  const hands = dealAll(initialRanks, freshRng());
  const jokered = initialRanks.find((id) => hasBothJokers(hands[id])) ?? null;

  const base: DalmutiState = {
    players: players.map((p) => ({ id: p.id, nickname: p.nickname })),
    phase: "tribute",
    hands,
    turnOrder: initialRanks,
    initialRanks,
    pendingRevolutionPlayerId: jokered,
    revolutionResult: jokered ? null : "none",
    pendingTribute: null,
    turnIndex: 0,
    currentTrick: null,
    lastClearedTrick: null,
    finishOrder: [],
  };
  return jokered ? base : applyForcedTribute(base);
}

function resolveRevolutionDecision(state: DalmutiState, reveal: boolean): ApplyMoveResult {
  if (!reveal) {
    return { ok: true, state: applyForcedTribute({ ...state, pendingRevolutionPlayerId: null }) };
  }
  const revealerId = state.pendingRevolutionPlayerId!;
  const isGrand = state.turnOrder[state.turnOrder.length - 1] === revealerId;
  const turnOrder = isGrand ? [...state.turnOrder].reverse() : state.turnOrder;
  return {
    ok: true,
    state: {
      ...state,
      turnOrder,
      pendingRevolutionPlayerId: null,
      revolutionResult: isGrand ? "grandRevolution" : "revolution",
      pendingTribute: null,
      phase: "playing",
      turnIndex: 0,
    },
  };
}

function applyTributeMove(state: DalmutiState, playerId: PlayerId, move: DalmutiMove): ApplyMoveResult {
  if (state.pendingRevolutionPlayerId !== null) {
    if (move.type !== "declareRevolution") return { ok: false, error: "REVOLUTION_DECISION_PENDING" };
    if (playerId !== state.pendingRevolutionPlayerId) return { ok: false, error: "NOT_YOUR_TURN" };
    return resolveRevolutionDecision(state, move.reveal);
  }

  const pending = state.pendingTribute;
  if (pending === null || move.type !== "returnTribute") return { ok: false, error: "NOT_YOUR_TURN" };

  const n = state.turnOrder.length;
  const dalmutiId = state.turnOrder[0];
  const primeMinisterId = state.turnOrder[1];
  const isDalmuti = playerId === dalmutiId && !pending.dalmutiReturned;
  const isPrimeMinister = playerId === primeMinisterId && !pending.primeMinisterReturned;
  if (!isDalmuti && !isPrimeMinister) return { ok: false, error: "NOT_YOUR_TURN" };

  const requiredCount = isDalmuti ? 2 : 1;
  if (move.cardIds.length !== requiredCount || new Set(move.cardIds).size !== requiredCount) {
    return { ok: false, error: "WRONG_TRIBUTE_COUNT" };
  }
  const hand = state.hands[playerId];
  if (!move.cardIds.every((id) => hand.some((c) => c.id === id))) return { ok: false, error: "CARD_NOT_IN_HAND" };

  const givenBack = hand.filter((c) => move.cardIds.includes(c.id));
  const recipientId = isDalmuti ? state.turnOrder[n - 1] : state.turnOrder[n - 2];
  const hands = {
    ...state.hands,
    [playerId]: hand.filter((c) => !move.cardIds.includes(c.id)),
    [recipientId]: [...state.hands[recipientId], ...givenBack],
  };
  const nextPending = {
    dalmutiReturned: pending.dalmutiReturned || isDalmuti,
    primeMinisterReturned: pending.primeMinisterReturned || isPrimeMinister,
  };

  if (nextPending.dalmutiReturned && nextPending.primeMinisterReturned) {
    return { ok: true, state: { ...state, hands, pendingTribute: null, phase: "playing", turnIndex: 0 } };
  }
  return { ok: true, state: { ...state, hands, pendingTribute: nextPending } };
}

function applyPass(state: DalmutiState): ApplyMoveResult {
  const trick = state.currentTrick as ActiveTrick;
  const isActive = (id: PlayerId) => !state.finishOrder.includes(id);
  const activeCount = state.turnOrder.filter(isActive).length;
  const passesInARow = trick.passesInARow + 1;

  if (passesInARow >= activeCount - 1) {
    // Everyone else passed — trick clears, leadership returns to whoever played it last.
    const nextTurnIndex = resolveNextLeaderIndex(state.turnOrder, isActive, trick.lastPlayerId);
    return {
      ok: true,
      state: {
        ...state,
        currentTrick: null,
        lastClearedTrick: { lastPlayerId: trick.lastPlayerId, cards: trick.cards },
        turnIndex: nextTurnIndex,
      },
    };
  }

  const nextTurnIndex = nextActiveIndex(state.turnOrder, isActive, state.turnIndex);
  return { ok: true, state: { ...state, currentTrick: { ...trick, passesInARow }, turnIndex: nextTurnIndex } };
}

function applyPlay(state: DalmutiState, playerId: PlayerId, cardIds: string[]): ApplyMoveResult {
  const cardIdSet = new Set(cardIds);
  if (cardIdSet.size !== cardIds.length || cardIds.length === 0) return { ok: false, error: "ILLEGAL_PLAY" };
  const hand = state.hands[playerId];
  const cards = hand.filter((c) => cardIdSet.has(c.id));
  if (cards.length !== cardIds.length) return { ok: false, error: "CARD_NOT_IN_HAND" };
  if (!isLegalPlay(cards, state.currentTrick)) return { ok: false, error: "ILLEGAL_PLAY" };

  const remainingHand = hand.filter((c) => !cardIdSet.has(c.id));
  const hands = { ...state.hands, [playerId]: remainingHand };

  let finishOrder = state.finishOrder;
  if (remainingHand.length === 0) finishOrder = [...finishOrder, playerId];

  const activePlayerIds = state.turnOrder.filter((id) => !finishOrder.includes(id));
  if (activePlayerIds.length <= 1) {
    // Only one player left holding cards — the hand is over, they take the last-place slot.
    const finalFinishOrder = activePlayerIds[0] ? [...finishOrder, activePlayerIds[0]] : finishOrder;
    return { ok: true, state: { ...state, hands, finishOrder: finalFinishOrder, phase: "gameOver", currentTrick: null } };
  }

  const isActive = (id: PlayerId) => !finishOrder.includes(id);
  const nextTurnIndex = nextActiveIndex(state.turnOrder, isActive, state.turnIndex);
  const currentTrick: ActiveTrick = { lastPlayerId: playerId, cards, passesInARow: 0 };
  return { ok: true, state: { ...state, hands, finishOrder, currentTrick, turnIndex: nextTurnIndex } };
}

function applyPlayingMove(state: DalmutiState, playerId: PlayerId, move: DalmutiMove): ApplyMoveResult {
  if (state.turnOrder[state.turnIndex] !== playerId) return { ok: false, error: "NOT_YOUR_TURN" };

  if (move.type === "pass") {
    if (state.currentTrick === null) return { ok: false, error: "CANNOT_PASS_WHEN_LEADING" };
    return applyPass(state);
  }
  if (move.type === "play") return applyPlay(state, playerId, move.cardIds);
  return { ok: false, error: "NOT_YOUR_TURN" };
}

export function applyMove(state: DalmutiState, playerId: PlayerId, move: DalmutiMove): ApplyMoveResult {
  if (state.phase === "gameOver") return { ok: false, error: "GAME_OVER" };
  if (state.phase === "tribute") return applyTributeMove(state, playerId, move);
  return applyPlayingMove(state, playerId, move);
}

export function isGameOver(state: DalmutiState): boolean {
  return state.phase === "gameOver";
}

export function getCurrentTurnPlayerId(state: DalmutiState): PlayerId | null {
  if (state.phase === "gameOver") return null;
  if (state.pendingRevolutionPlayerId !== null) return state.pendingRevolutionPlayerId;
  if (state.pendingTribute !== null) {
    return !state.pendingTribute.dalmutiReturned ? state.turnOrder[0] : state.turnOrder[1];
  }
  return state.turnOrder[state.turnIndex];
}

export function computeResult(state: DalmutiState): { rawScores: Record<string, number>; sortOrder: "asc"; summary: string } {
  const rawScores: Record<string, number> = {};
  state.finishOrder.forEach((id, index) => {
    rawScores[id] = index;
  });
  const winnerName = state.players.find((p) => p.id === state.finishOrder[0])?.nickname ?? "?";
  return { rawScores, sortOrder: "asc", summary: `새로운 달무티: ${winnerName}` };
}

export function autoMove(state: DalmutiState, playerId: PlayerId): DalmutiMove {
  if (state.pendingRevolutionPlayerId === playerId) return { type: "declareRevolution", reveal: false };

  if (state.pendingTribute !== null) {
    const isDalmuti = playerId === state.turnOrder[0] && !state.pendingTribute.dalmutiReturned;
    const count = isDalmuti ? 2 : 1;
    const hand = state.hands[playerId];
    const worst = [...hand].sort((a, b) => effectiveRank([b]) - effectiveRank([a])).slice(0, count);
    return { type: "returnTribute", cardIds: worst.map((c) => c.id) };
  }

  if (state.currentTrick !== null) return { type: "pass" };

  // Leading: play the single lowest-value card — always legal, minimal commitment.
  const hand = state.hands[playerId];
  const lowest = [...hand].sort((a, b) => effectiveRank([a]) - effectiveRank([b]))[0];
  return { type: "play", cardIds: [lowest.id] };
}
