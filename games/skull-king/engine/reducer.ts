import { freshRng } from "../../../shared/rng";
import type { Player } from "../../../shared/types";
import { dealRound } from "./deck";
import { computeRoundPoints } from "./scoring";
import { legalCardIds, resolveTrick } from "./trick";
import type {
  CompletedTrick,
  PlayerId,
  PlayerRoundState,
  RoundScoreEntry,
  RoundState,
  SkullKingMove,
  SkullKingState,
} from "./types";

export type ApplyMoveResult = { ok: true; state: SkullKingState } | { ok: false; error: string };

function buildRound(roundNumber: number, turnOrder: PlayerId[]): RoundState {
  const hands = dealRound(turnOrder, roundNumber, freshRng());
  const players: Record<PlayerId, PlayerRoundState> = {};
  for (const id of turnOrder) {
    players[id] = { hand: hands[id], bid: null, tricksWon: 0, bonusPoints: 0 };
  }
  return { roundNumber, turnOrder, phase: "bidding", turnIndex: 0, players, completedTricks: [], currentTrick: null };
}

export function createInitialState(players: Player[], startingPlayerId?: string | null): SkullKingState {
  const baseOrder = players.map((p) => p.id);
  const leaderIndex =
    startingPlayerId && baseOrder.includes(startingPlayerId)
      ? baseOrder.indexOf(startingPlayerId)
      : Math.floor(Math.random() * baseOrder.length);
  const turnOrder = [...baseOrder.slice(leaderIndex), ...baseOrder.slice(0, leaderIndex)];
  const cumulativeScores = Object.fromEntries(baseOrder.map((id) => [id, 0]));
  return {
    players: players.map((p) => ({ id: p.id, nickname: p.nickname })),
    round: buildRound(1, turnOrder),
    totalRounds: 10,
    roundHistory: [],
    cumulativeScores,
    phase: "playing",
  };
}

export function applyMove(state: SkullKingState, playerId: PlayerId, move: SkullKingMove): ApplyMoveResult {
  if (state.phase === "gameOver") return { ok: false, error: "GAME_OVER" };
  const round = state.round;
  if (round.turnOrder[round.turnIndex] !== playerId) return { ok: false, error: "NOT_YOUR_TURN" };

  if (move.type === "bid") {
    if (round.phase !== "bidding") return { ok: false, error: "NOT_BIDDING_PHASE" };
    if (!Number.isInteger(move.value) || move.value < 0 || move.value > round.roundNumber) {
      return { ok: false, error: "ILLEGAL_BID" };
    }
    const players = { ...round.players, [playerId]: { ...round.players[playerId], bid: move.value } };
    const turnIndex = round.turnIndex + 1;
    if (turnIndex === round.turnOrder.length) {
      const currentTrick = { leaderId: round.turnOrder[0], plays: [], ledSuit: null };
      return { ok: true, state: { ...state, round: { ...round, players, phase: "playing", turnIndex: 0, currentTrick } } };
    }
    return { ok: true, state: { ...state, round: { ...round, players, turnIndex } } };
  }

  // move.type === "playCard"
  if (round.phase !== "playing" || round.currentTrick === null) return { ok: false, error: "NOT_PLAYING_PHASE" };
  const playerRound = round.players[playerId];
  const card = playerRound.hand.find((c) => c.id === move.cardId);
  if (!card) return { ok: false, error: "CARD_NOT_IN_HAND" };
  if (card.kind === "tigress" && !move.declareTigressAs) return { ok: false, error: "TIGRESS_DECLARATION_REQUIRED" };
  if (!legalCardIds(playerRound.hand, round.currentTrick.ledSuit).includes(move.cardId)) {
    return { ok: false, error: "MUST_FOLLOW_SUIT" };
  }

  const newHand = playerRound.hand.filter((c) => c.id !== move.cardId);
  const declaredAs = card.kind === "tigress" ? move.declareTigressAs : undefined;
  const newLedSuit = round.currentTrick.ledSuit ?? (card.kind === "number" ? card.suit : null);
  const newPlays = [...round.currentTrick.plays, { playerId, card, declaredAs }];
  let players = { ...round.players, [playerId]: { ...playerRound, hand: newHand } };

  if (newPlays.length < round.turnOrder.length) {
    const currentTrick = { ...round.currentTrick, plays: newPlays, ledSuit: newLedSuit };
    const turnIndex = (round.turnIndex + 1) % round.turnOrder.length;
    return { ok: true, state: { ...state, round: { ...round, players, currentTrick, turnIndex } } };
  }

  // Trick complete — resolve winner and any capture bonus.
  const { winnerId, bonusPoints } = resolveTrick(newPlays, newLedSuit);
  const completed: CompletedTrick = { leaderId: round.currentTrick.leaderId, plays: newPlays, ledSuit: newLedSuit, winnerId, bonusPoints };
  players = {
    ...players,
    [winnerId]: { ...players[winnerId], tricksWon: players[winnerId].tricksWon + 1, bonusPoints: players[winnerId].bonusPoints + bonusPoints },
  };
  const completedTricks = [...round.completedTricks, completed];

  if (completedTricks.length < round.roundNumber) {
    const nextTurnIndex = round.turnOrder.indexOf(winnerId);
    const currentTrick = { leaderId: winnerId, plays: [], ledSuit: null };
    return { ok: true, state: { ...state, round: { ...round, players, completedTricks, currentTrick, turnIndex: nextTurnIndex } } };
  }

  // Round complete — tally each player's round score into the cumulative total.
  const scores: RoundScoreEntry["scores"] = {};
  const cumulativeScores = { ...state.cumulativeScores };
  for (const id of round.turnOrder) {
    const p = players[id];
    const bid = p.bid ?? 0;
    const roundPoints = computeRoundPoints(bid, p.tricksWon, round.roundNumber, p.bonusPoints);
    scores[id] = { bid, tricksWon: p.tricksWon, bonusPoints: p.bonusPoints, roundPoints };
    cumulativeScores[id] = (cumulativeScores[id] ?? 0) + roundPoints;
  }
  const roundHistory = [...state.roundHistory, { roundNumber: round.roundNumber, scores }];
  const finishedRound: RoundState = { ...round, players, completedTricks, currentTrick: null };

  if (round.roundNumber === state.totalRounds) {
    return { ok: true, state: { ...state, round: finishedRound, roundHistory, cumulativeScores, phase: "gameOver" } };
  }
  const nextTurnOrder = [...round.turnOrder.slice(1), round.turnOrder[0]];
  return {
    ok: true,
    state: { ...state, round: buildRound(round.roundNumber + 1, nextTurnOrder), roundHistory, cumulativeScores },
  };
}

export function isGameOver(state: SkullKingState): boolean {
  return state.phase === "gameOver";
}

export function getCurrentTurnPlayerId(state: SkullKingState): PlayerId | null {
  if (state.phase === "gameOver") return null;
  return state.round.turnOrder[state.round.turnIndex];
}

export function computeResult(state: SkullKingState): { rawScores: Record<string, number>; sortOrder: "desc"; summary: string } {
  const winnerId = Object.entries(state.cumulativeScores).sort((a, b) => b[1] - a[1])[0]?.[0];
  const winnerName = state.players.find((p) => p.id === winnerId)?.nickname ?? "?";
  return { rawScores: state.cumulativeScores, sortOrder: "desc", summary: `최고 점수: ${winnerName}` };
}

export function autoMove(state: SkullKingState, playerId: PlayerId): SkullKingMove {
  const round = state.round;
  if (round.phase === "bidding") return { type: "bid", value: 0 };
  const hand = round.players[playerId].hand;
  const cardId = legalCardIds(hand, round.currentTrick!.ledSuit)[0];
  const card = hand.find((c) => c.id === cardId)!;
  return card.kind === "tigress" ? { type: "playCard", cardId, declareTigressAs: "escape" } : { type: "playCard", cardId };
}
