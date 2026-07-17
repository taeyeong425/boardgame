# Platform rules (apply to every game, not any one game's own rules)

Per-game rules live in `docs/rules/<game>.md`. This file is everything that happens *around* a
game — the room/session mechanics every game plugs into. See `party/games/types.ts` for the
`GameModule` contract a game implements to plug into all of this.

## Room / session model

- A room = one PartyKit Durable Object, keyed by room code (`shared/roomCode.ts` generates a
  5-char code excluding ambiguous characters). No separate room registry/DB — connecting to a
  code lazily creates or resumes that room's state.
- Players join with a nickname only, no accounts. A client-generated `playerId` persisted in
  localStorage (scoped per room code) re-claims the same seat across reconnects (wifi drops,
  tab reloads) — see `hooks/useRoomSocket.ts`.
- A disconnect (wifi drop, closed tab) marks the player `connected: false` but keeps their seat
  and score — they can rejoin any time with the same room code. Explicitly leaving the room
  (the "방 나가기" button) does the same thing client-side (closes the socket and navigates
  home); there's no separate "permanent leave" — the seat/score simply sits there until the room
  is abandoned.

## Room phases (`shared/types.ts` `RoomPhase`)

```
lobby → in-game → game-over → round-end → lobby → ...
```

- **lobby**: pick a game, see the player list and the cumulative leaderboard, host controls.
- **in-game**: the active `GameModule`'s own UI, turn-based play with a 60s per-turn timer.
- **game-over**: the game just ended — its final board is still shown (frozen, no more moves)
  so players can see how the game actually played out. Any player can press "결과 보기" to move
  on; this exists so the score doesn't just appear with no context.
- **round-end**: the rank/points breakdown for the game that just finished, plus the updated
  room-wide cumulative leaderboard. Host returns everyone to the lobby from here.

## Scoring: rank-based points, not raw scores

Different games have wildly different raw-score scales (Penguin Party's penalty count vs. a
future game's chip count, etc.), so raw scores are never summed across games. Instead
(`shared/scoring.ts`):
1. Each `GameModule.computeResult` reports raw per-player scores + which direction is better
   (`sortOrder: "asc" | "desc"`).
2. `computeStandings` converts that into a **standard competition ranking** — ties share the
   lowest rank in their group, and the next distinct rank skips ahead by the tie-group size
   (1, 2, 2, 4 — not 1, 2, 2, 3).
3. Points = `totalPlayersInThatGame - rank + 1`. Only these points accumulate into
   `RoomState.totals`, the room-wide leaderboard shown throughout the lobby/game/results screens
   (with tie-aware "N위" rank labels, reusing the same `computeStandings`).

## Turn timer

Every `GameModule` implements `autoMove(state, playerId)` — guaranteed to return some legal move
for whoever the timer expired on. The room schedules a Durable Object alarm 60s out whenever the
current turn changes; if it fires before a real move arrives, the server calls `autoMove` and
applies it exactly like a normal move (`party/index.ts`, `applyGameMove` / `onAlarm`).

## Starting-player carryover

`RoomState.nextStartingPlayerId` is a hint passed into `GameModule.createInitialState(players,
startingPlayerId?)`:
- A fresh room's very first game has no prior winner to carry over, so the server runs a visible
  **card draw** instead of picking silently: every player gets a random 1-100 number
  (`RoomState.startingPlayerDraw`), highest goes first (ties broken by earliest-joined). The client
  shows this draw briefly (`StartingDrawReveal`) right as that first game begins.
- Every game after that starts with **whoever the game itself says should deal next** — most games
  don't care and default to the previous game's rank-1 winner (ties broken by earliest-joined), but
  a `GameModule` can implement `getNextStartingPlayerId(state)` to use its own real-world
  convention instead (see Skull King: whoever won the final trick). Shown to players in the lobby
  and on the results screen so it's never a mystery who goes first.

## Host controls

- **Select/start a game**: host only, validated against that game's min/max player count
  (`shared/gameCatalog.ts`).
- **Kick a player**: host only, lobby only.
- **Transfer host**: host only, lobby only — hands the role to another player directly (in
  addition to the automatic promote-earliest-connected-player-on-disconnect fallback).
- **Leave to lobby mid-game**: host only, allowed from in-game/game-over/round-end — abandons
  the current game with no score entry recorded (only a *completed* game's rank/points get
  appended to the ledger).

## Nicknames

Any player can change their own nickname at any time (lobby, in-game, anywhere) via the ✏️
button — not host-gated, since it's about your own identity, not room control.
