import type { GameId, Player } from "../../shared/types";

export interface GameResult {
  rawScores: Record<string, number>;
  sortOrder: "asc" | "desc";
  summary?: string;
}

export type MoveResult<TState> = { ok: true; state: TState } | { ok: false; error: string };

/**
 * The seam every board game plugs into. The room server only ever calls these methods — it
 * never inspects game internals — so adding a new game means adding one new module here plus
 * one new client UI component in games/registry.ts, with no changes to room/lobby/scoring code.
 */
export interface GameModule<TState = unknown, TMove = unknown, TClientState = TState> {
  id: GameId;
  displayName: string;
  minPlayers: number;
  maxPlayers: number;

  /**
   * startingPlayerId is a hint from the room (typically the previous game's rank-1 winner) for
   * who should go first — pass null/undefined, or ignore it, to pick a starting player yourself
   * (e.g. randomly) when there's no prior winner yet or the hinted player isn't in this game.
   */
  createInitialState(players: Player[], startingPlayerId?: string | null): TState;

  applyMove(state: TState, playerId: string, move: TMove): MoveResult<TState>;

  isGameOver(state: TState): boolean;

  /** Called exactly once, right when isGameOver(state) flips true. */
  computeResult(state: TState): GameResult;

  /** Used to drive the turn timer; return null if the game has no single "current player" concept. */
  getCurrentTurnPlayerId(state: TState): string | null;

  /**
   * Per-player redacted view of the state. Required for any game with hidden information
   * (e.g. Penguin Party's hands) — the room server sends this individually per connection instead
   * of broadcasting `state` verbatim. Games with no hidden information may omit this and the
   * room server will fall back to broadcasting the full state to everyone.
   */
  getClientView?(state: TState, forPlayerId: string): TClientState;

  /**
   * Called by the room server when the current turn's 60s timer expires. Must return a move that
   * is guaranteed to be legal for playerId in the current state (the turn pointer only ever rests
   * on a player who has at least one legal move, so this should never need to "pass").
   */
  autoMove(state: TState, playerId: string): TMove;

  /**
   * Optional override for who starts the *next* game in this room, called once right when
   * isGameOver(state) flips true. Most games don't implement this — the room server defaults to
   * the rank-1 score winner. A game with its own real-world "next dealer" convention (e.g. Skull
   * King: whoever won the final trick) can return a different player id here instead, or null to
   * fall back to the default.
   */
  getNextStartingPlayerId?(state: TState): string | null;
}
