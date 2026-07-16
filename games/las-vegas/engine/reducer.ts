import { freshRng } from "../../../shared/rng";
import type { Player } from "../../../shared/types";
import { refillCasinos, shuffleBillDeck } from "./billDeck";
import { resolveCasino } from "./casino";
import { neutralDiceForPlayer, rollFace } from "./dice";
import { HOUSE } from "./types";
import type {
  Bill,
  CasinoNumber,
  CasinoState,
  LasVegasMove,
  LasVegasState,
  PendingRollFaceGroup,
  PlayerGameState,
  PlayerId,
  RoundState,
} from "./types";

export type ApplyMoveResult = { ok: true; state: LasVegasState } | { ok: false; error: string };

function emptyCasinos(): CasinoState[] {
  return ([1, 2, 3, 4, 5, 6] as CasinoNumber[]).map((n) => ({ number: n, bills: [], diceCounts: {} }));
}

function buildRound(
  roundNumber: number,
  startPlayerId: PlayerId,
  turnOrder: PlayerId[],
  deck: Bill[],
  neutralDiceEnabled: boolean
): { round: RoundState; deck: Bill[]; houseDiceByPlayer: Record<PlayerId, number> } {
  const { casinos, deck: remainingDeck } = refillCasinos(emptyCasinos(), deck);
  const houseDiceByPlayer: Record<PlayerId, number> = {};
  for (const id of turnOrder) {
    houseDiceByPlayer[id] = neutralDiceEnabled ? neutralDiceForPlayer(turnOrder.length, id === startPlayerId) : 0;
  }
  const round: RoundState = {
    roundNumber,
    casinos,
    turnOrder,
    currentTurnIndex: turnOrder.indexOf(startPlayerId),
    startPlayerId,
    pendingRoll: null,
  };
  return { round, deck: remainingDeck, houseDiceByPlayer };
}

export function createInitialState(players: Player[], startingPlayerId?: string | null): LasVegasState {
  const turnOrder = players.map((p) => p.id);
  const neutralDiceEnabled = turnOrder.length >= 2 && turnOrder.length <= 4;
  const resolvedStart =
    startingPlayerId && turnOrder.includes(startingPlayerId)
      ? startingPlayerId
      : turnOrder[Math.floor(Math.random() * turnOrder.length)];

  const deck = shuffleBillDeck(freshRng());
  const built = buildRound(1, resolvedStart, turnOrder, deck, neutralDiceEnabled);

  const playerStates: PlayerGameState[] = players.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    bills: [],
    ownDiceRemaining: 8,
    houseDiceRemaining: built.houseDiceByPlayer[p.id],
  }));

  return {
    players: playerStates,
    billDeck: built.deck,
    round: built.round,
    roundHistory: [],
    totalRounds: 4,
    neutralDiceEnabled,
    phase: "rolling",
  };
}

/** Next seat (circular) with any dice remaining — always terminates while phase is "rolling"
 * since at least one player still has dice whenever the round hasn't fully finished. */
function nextActiveIndex(turnOrder: PlayerId[], players: PlayerGameState[], fromIndex: number): number {
  const n = turnOrder.length;
  let idx = fromIndex;
  for (let step = 0; step < n; step++) {
    idx = (idx + 1) % n;
    const p = players.find((pl) => pl.id === turnOrder[idx]);
    if (p && p.ownDiceRemaining + p.houseDiceRemaining > 0) return idx;
  }
  return fromIndex;
}

export function applyMove(state: LasVegasState, playerId: PlayerId, move: LasVegasMove): ApplyMoveResult {
  if (state.phase === "gameOver") return { ok: false, error: "GAME_OVER" };
  const round = state.round;
  if (round.turnOrder[round.currentTurnIndex] !== playerId) return { ok: false, error: "NOT_YOUR_TURN" };

  const player = state.players.find((p) => p.id === playerId)!;

  if (move.type === "roll") {
    if (round.pendingRoll !== null) return { ok: false, error: "ALREADY_ROLLED" };
    if (player.ownDiceRemaining + player.houseDiceRemaining === 0) return { ok: false, error: "NO_DICE_LEFT" };

    const rng = freshRng();
    const groups = new Map<CasinoNumber, { ownCount: number; houseCount: number }>();
    for (let i = 0; i < player.ownDiceRemaining; i++) {
      const face = rollFace(rng);
      const g = groups.get(face) ?? { ownCount: 0, houseCount: 0 };
      g.ownCount++;
      groups.set(face, g);
    }
    for (let i = 0; i < player.houseDiceRemaining; i++) {
      const face = rollFace(rng);
      const g = groups.get(face) ?? { ownCount: 0, houseCount: 0 };
      g.houseCount++;
      groups.set(face, g);
    }
    const pendingRoll: PendingRollFaceGroup[] = [...groups.entries()]
      .map(([face, g]) => ({ face, ...g }))
      .sort((a, b) => a.face - b.face);

    return { ok: true, state: { ...state, round: { ...round, pendingRoll } } };
  }

  // move.type === "placeFace"
  if (round.pendingRoll === null) return { ok: false, error: "MUST_ROLL_FIRST" };
  const group = round.pendingRoll.find((g) => g.face === move.face);
  if (!group) return { ok: false, error: "FACE_NOT_ROLLED" };

  const casinos = round.casinos.map((c) => {
    if (c.number !== move.face) return c;
    const diceCounts = { ...c.diceCounts };
    diceCounts[playerId] = (diceCounts[playerId] ?? 0) + group.ownCount;
    if (group.houseCount > 0) diceCounts[HOUSE] = (diceCounts[HOUSE] ?? 0) + group.houseCount;
    return { ...c, diceCounts };
  });

  const players = state.players.map((p) =>
    p.id === playerId
      ? {
          ...p,
          ownDiceRemaining: p.ownDiceRemaining - group.ownCount,
          houseDiceRemaining: p.houseDiceRemaining - group.houseCount,
        }
      : p
  );

  const anyoneHasDice = players.some((p) => p.ownDiceRemaining + p.houseDiceRemaining > 0);

  if (!anyoneHasDice) {
    // Round over: resolve every casino, award/recycle bills, then either end the game or deal
    // the next round.
    const payouts = casinos.map(resolveCasino);
    let updatedPlayers = players;
    let recycled: Bill[] = [];
    for (const payout of payouts) {
      for (const { owner, bill } of payout.awarded) {
        updatedPlayers = updatedPlayers.map((p) => (p.id === owner ? { ...p, bills: [...p.bills, bill] } : p));
      }
      recycled = [...recycled, ...payout.recycled];
    }
    const roundHistory = [...state.roundHistory, { roundNumber: round.roundNumber, payouts }];
    const deckWithRecycled = [...state.billDeck, ...recycled];

    if (round.roundNumber === state.totalRounds) {
      return {
        ok: true,
        state: { ...state, players: updatedPlayers, roundHistory, billDeck: deckWithRecycled, phase: "gameOver" },
      };
    }

    const nextStartIndex = (round.turnOrder.indexOf(round.startPlayerId) + 1) % round.turnOrder.length;
    const nextStartId = round.turnOrder[nextStartIndex];
    const nextBuilt = buildRound(
      round.roundNumber + 1,
      nextStartId,
      round.turnOrder,
      deckWithRecycled,
      state.neutralDiceEnabled
    );
    const resetPlayers = updatedPlayers.map((p) => ({
      ...p,
      ownDiceRemaining: 8,
      houseDiceRemaining: nextBuilt.houseDiceByPlayer[p.id],
    }));

    return {
      ok: true,
      state: { ...state, players: resetPlayers, round: nextBuilt.round, roundHistory, billDeck: nextBuilt.deck, phase: "rolling" },
    };
  }

  const nextIndex = nextActiveIndex(round.turnOrder, players, round.currentTurnIndex);
  const newRound: RoundState = { ...round, casinos, currentTurnIndex: nextIndex, pendingRoll: null };
  return { ok: true, state: { ...state, players, round: newRound } };
}

export function isGameOver(state: LasVegasState): boolean {
  return state.phase === "gameOver";
}

export function getCurrentTurnPlayerId(state: LasVegasState): PlayerId | null {
  if (state.phase === "gameOver") return null;
  return state.round.turnOrder[state.round.currentTurnIndex];
}

export function computeResult(state: LasVegasState): { rawScores: Record<string, number>; sortOrder: "desc"; summary: string } {
  const rawScores: Record<string, number> = {};
  let winnerName = "?";
  let bestScore = -1;
  for (const p of state.players) {
    const totalMoney = p.bills.reduce((sum, b) => sum + b.value, 0);
    // Composite encoding: money is the primary key, bill COUNT is the official tiebreaker (more
    // notes wins a tie). Multiplying money by 1000 keeps it dominant — a single bill is worth at
    // least $10,000, far larger than any realistic bill-count difference.
    const score = totalMoney * 1000 + p.bills.length;
    rawScores[p.id] = score;
    if (score > bestScore) {
      bestScore = score;
      winnerName = p.nickname;
    }
  }
  return { rawScores, sortOrder: "desc", summary: `최고 상금: ${winnerName}` };
}

export function autoMove(state: LasVegasState, _playerId: PlayerId): LasVegasMove {
  const round = state.round;
  if (round.pendingRoll === null) return { type: "roll" };
  return { type: "placeFace", face: round.pendingRoll[0].face };
}
