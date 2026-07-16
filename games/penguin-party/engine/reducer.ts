import { freshRng } from "../../../shared/rng";
import type { Player } from "../../../shared/types";
import { dealRound } from "./deck";
import { computeLegalPlacements, hasLegalMove, isLegalPlacement } from "./pyramid";
import type {
  Card,
  PenguinPartyMove,
  PenguinPartyState,
  PlayerGameState,
  PlayerId,
  PyramidPosition,
  RoundState,
  RoundSummary,
} from "./types";

export type ApplyMoveResult = { ok: true; state: PenguinPartyState } | { ok: false; error: string };

function key(layer: number, index: number): string {
  return `${layer}:${index}`;
}

function buildRound(roundNumber: number, startingPlayerId: PlayerId, turnOrder: PlayerId[]): RoundState {
  const deal = dealRound(turnOrder, freshRng());
  return {
    roundNumber,
    startingPlayerId,
    turnOrder,
    currentTurnIndex: turnOrder.indexOf(startingPlayerId),
    pyramid: { cells: {}, layer1Range: null, layer1MaxWidth: deal.layer1MaxWidth },
    hands: deal.hands,
    eliminated: {},
    emptiedHand: {},
    revealedExtraCard: deal.revealedExtraCard,
    turnLog: [],
    penaltyEvents: [],
  };
}

function applyPenaltyDelta(
  players: PlayerGameState[],
  playerId: PlayerId,
  delta: number,
  floorAtZero = false
): PlayerGameState[] {
  return players.map((p) => {
    if (p.id !== playerId) return p;
    const next = p.cumulativePenalty + delta;
    return { ...p, cumulativePenalty: floorAtZero ? Math.max(0, next) : next };
  });
}

/**
 * Scans forward from round.currentTurnIndex (inclusive), auto-eliminating any player who has no
 * legal move at the start of their turn, and stopping at the first player who can act. Used both
 * right after a round is dealt (checking the starting player) and after every applied move (with
 * currentTurnIndex already advanced past the mover) — a single code path that naturally implements
 * "round ends when no active seat has a move" and "a lone survivor keeps playing" without any
 * special-casing: it only declares roundOver when a full lap finds zero eligible players.
 */
function settleTurn(
  round: RoundState,
  players: PlayerGameState[]
): { round: RoundState; players: PlayerGameState[]; roundOver: boolean } {
  const n = round.turnOrder.length;
  let idx = round.currentTurnIndex;
  let workingRound = round;
  let workingPlayers = players;

  for (let step = 0; step < n; step++) {
    const pid = workingRound.turnOrder[idx];
    if (!workingRound.eliminated[pid] && !workingRound.emptiedHand[pid]) {
      if (hasLegalMove(workingRound.pyramid, workingRound.hands[pid] ?? [])) {
        return { round: { ...workingRound, currentTurnIndex: idx }, players: workingPlayers, roundOver: false };
      }
      const penalty = (workingRound.hands[pid] ?? []).length;
      workingRound = {
        ...workingRound,
        eliminated: { ...workingRound.eliminated, [pid]: true },
        penaltyEvents: [...workingRound.penaltyEvents, { playerId: pid, delta: penalty, reason: "eliminated" }],
      };
      workingPlayers = applyPenaltyDelta(workingPlayers, pid, penalty);
    }
    idx = (idx + 1) % n;
  }
  return { round: workingRound, players: workingPlayers, roundOver: true };
}

function placeCardIntoPyramid(
  round: RoundState,
  playerId: PlayerId,
  card: Card,
  position: PyramidPosition,
  turnNumber: number
): RoundState {
  const hand = round.hands[playerId] ?? [];
  const newHand = hand.filter((c) => c.id !== card.id);
  const cells = {
    ...round.pyramid.cells,
    [key(position.layer, position.index)]: { card, position, placedBy: playerId, turnNumber },
  };
  let layer1Range = round.pyramid.layer1Range;
  if (position.layer === 1) {
    layer1Range =
      layer1Range === null
        ? { lo: position.index, hi: position.index }
        : { lo: Math.min(layer1Range.lo, position.index), hi: Math.max(layer1Range.hi, position.index) };
  }
  return {
    ...round,
    pyramid: { ...round.pyramid, cells, layer1Range },
    hands: { ...round.hands, [playerId]: newHand },
    turnLog: [...round.turnLog, { playerId, card, position, turnNumber }],
  };
}

export function createInitialState(players: Player[], startingPlayerId?: string | null): PenguinPartyState {
  const turnOrder = players.map((p) => p.id);
  const resolvedStartingPlayerId =
    startingPlayerId && turnOrder.includes(startingPlayerId)
      ? startingPlayerId
      : turnOrder[Math.floor(Math.random() * turnOrder.length)];
  const initialPlayers: PlayerGameState[] = players.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    cumulativePenalty: 0,
  }));
  const round = buildRound(1, resolvedStartingPlayerId, turnOrder);
  // Defensive: on a freshly dealt, empty board every player with cards can legally play the anchor
  // move, so this should never actually eliminate anyone — but routing through settleTurn once
  // keeps "currentTurnIndex always points at someone with a legal move" a single enforced invariant.
  const settled = settleTurn(round, initialPlayers);
  return {
    players: settled.players,
    round: settled.round,
    roundHistory: [],
    // A "game" of Penguin Party is a single round regardless of player count — a deliberate house
    // rule (the official rulebook plays (player count) rounds); see docs/rules/penguin-party.md.
    totalRounds: 1,
    phase: settled.roundOver ? "gameOver" : "roundInProgress",
  };
}

export function applyMove(state: PenguinPartyState, playerId: PlayerId, move: PenguinPartyMove): ApplyMoveResult {
  if (state.phase === "gameOver") return { ok: false, error: "GAME_OVER" };
  if (move.type !== "placeCard") return { ok: false, error: "UNKNOWN_MOVE_TYPE" };

  const round = state.round;
  if (round.turnOrder[round.currentTurnIndex] !== playerId) return { ok: false, error: "NOT_YOUR_TURN" };

  const hand = round.hands[playerId] ?? [];
  const card = hand.find((c) => c.id === move.cardId);
  if (!card) return { ok: false, error: "CARD_NOT_IN_HAND" };
  if (!isLegalPlacement(round.pyramid, card, move.position)) return { ok: false, error: "ILLEGAL_POSITION" };

  const turnNumber = round.turnLog.length + 1;
  let newRound = placeCardIntoPyramid(round, playerId, card, move.position, turnNumber);
  let players = state.players;

  if (newRound.hands[playerId].length === 0) {
    newRound = {
      ...newRound,
      emptiedHand: { ...newRound.emptiedHand, [playerId]: true },
      penaltyEvents: [...newRound.penaltyEvents, { playerId, delta: -2, reason: "emptiedHandReward" }],
    };
    players = applyPenaltyDelta(players, playerId, -2, true);
  }

  const nextIndex = (round.currentTurnIndex + 1) % round.turnOrder.length;
  const settled = settleTurn({ ...newRound, currentTurnIndex: nextIndex }, players);

  if (!settled.roundOver) {
    return { ok: true, state: { ...state, players: settled.players, round: settled.round } };
  }

  const summary: RoundSummary = {
    roundNumber: settled.round.roundNumber,
    startingPlayerId: settled.round.startingPlayerId,
    events: settled.round.penaltyEvents,
    cumulativeAfter: Object.fromEntries(settled.players.map((p) => [p.id, p.cumulativePenalty])),
  };
  const roundHistory = [...state.roundHistory, summary];

  if (settled.round.roundNumber === state.totalRounds) {
    return {
      ok: true,
      state: { ...state, players: settled.players, round: settled.round, roundHistory, phase: "gameOver" },
    };
  }

  const turnOrder = settled.round.turnOrder;
  const nextStarter = turnOrder[(turnOrder.indexOf(settled.round.startingPlayerId) + 1) % turnOrder.length];
  const nextRound = buildRound(settled.round.roundNumber + 1, nextStarter, turnOrder);
  // Same defensive invariant-check as createInitialState — a fresh empty board never actually
  // eliminates the starting player, so roundOver here is structurally always false.
  const settledNextRound = settleTurn(nextRound, settled.players);

  return {
    ok: true,
    state: {
      ...state,
      players: settledNextRound.players,
      round: settledNextRound.round,
      roundHistory,
      phase: "roundInProgress",
    },
  };
}

export function isGameOver(state: PenguinPartyState): boolean {
  return state.phase === "gameOver";
}

export function getCurrentTurnPlayerId(state: PenguinPartyState): PlayerId | null {
  if (state.phase === "gameOver") return null;
  return state.round.turnOrder[state.round.currentTurnIndex];
}

export function computeResult(state: PenguinPartyState): {
  rawScores: Record<string, number>;
  sortOrder: "asc";
  summary: string;
} {
  const rawScores: Record<string, number> = {};
  for (const p of state.players) rawScores[p.id] = p.cumulativePenalty;
  return { rawScores, sortOrder: "asc", summary: `Final penalty totals after ${state.totalRounds} round(s)` };
}

export function autoMove(state: PenguinPartyState, playerId: PlayerId): PenguinPartyMove {
  const hand = state.round.hands[playerId] ?? [];
  const candidates = computeLegalPlacements(state.round.pyramid, hand);
  if (candidates.length === 0) {
    throw new Error(`autoMove called for ${playerId} with no legal placement — invariant violated`);
  }
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return { type: "placeCard", cardId: pick.card.id, position: pick.position };
}
