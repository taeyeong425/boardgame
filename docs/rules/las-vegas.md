# 라스베가스 (Las Vegas)

Rüdiger Dorn design, published by alea. 2-5 players. Implemented.

**House rules**: this app makes two deliberate deviations from the official rules:

1. A **single round** instead of the official game's 4 rounds — one full cash-refill →
   roll-and-place → payout cycle, then the game ends. Everything below describes what happens
   within that one round; the official game just repeats it 4 times with dice reset and the start
   player rotating each time.
2. **No neutral/"house" dice.** The official game gives 2-4 player games a shared pool of extra
   dice (not owned by anyone) to make majorities harder to lock in. This app skips that entirely —
   every player only ever rolls and places their own 8 dice, regardless of player count. This
   keeps the rules simpler to explain to new players and makes every die on the board unambiguously
   "someone's bet."

Sources:
- https://namu.wiki/w/%EB%9D%BC%EC%8A%A4%EB%B2%A0%EA%B0%80%EC%8A%A4(%EB%B3%B4%EB%93%9C%EA%B2%8C%EC%9E%84)
- https://www.koreaboardgames.com/product/detail?prdCd=PD2024002324AGQI

## Components

- 6 casinos, numbered 1-6.
- 54 bills total: $10k×6, $20k×8, $30k×8, $40k×6, $50k×6, $60k×5, $70k×5, $80k×5, $90k×5.
- Each player has 8 dice (all same color) — no neutral/"house" dice (see the house rule above).

## Round setup

- Shuffle the bill deck. Deal bills face-up one at a time onto casino 1, then 2, ... cycling
  through all 6, until every casino has **at least $50,000** stacked on it, then stop (a casino
  may end up with more than one bill and more than $50k once the last bill that pushes it over is
  dealt).
- Every player starts the round with 8 dice.
- The starting player is chosen randomly (or carried over from the previous game in the room, per
  the platform-wide `nextStartingPlayerId` rule — see [docs/PLATFORM.md](../PLATFORM.md)).

## Turn structure

On your turn you take one of these two actions:

1. **Roll**: roll every die you have not yet placed this round, all at once. Dice are grouped by
   face value (1-6) and everyone at the table sees the result.
2. **Place a face**: having just rolled, choose ONE face value from your pending roll. Every die
   showing that face is placed onto the casino with the matching number, added to your dice tally
   at that casino. Those dice are now committed for the rest of the round — you cannot re-roll them.

After placing, if you still have unplaced dice, it becomes the next player's turn; you'll roll
your remaining dice again on your next turn. If you have none left, your turn is skipped for the
rest of the round. Once every player has placed all their dice, the round ends and casinos pay
out.

## Casino payout (resolved once per round, all 6 casinos at once)

For each casino:

1. Group all placed dice by owning player and count dice per player.
2. **Any player whose dice count ties with another player at that casino is eliminated from that
   casino's payout** — ties cancel each other out, no matter how high the tied count is.
3. Rank the remaining (non-tied) players by dice count, descending.
4. Award the casino's bills to survivors highest-count-first: the highest bill(s) go to the
   top-ranked player, working down.
5. Any bills left unclaimed (because every player tied) simply go unawarded — there's no later
   round left to redeal them into.

This resolution logic is verified against the two worked examples in the official rulebook
(a 5/3/3/1 dice split where the tied 3s are eliminated; a 2/2/1/1 split where everyone ties and
the whole casino's cash is voided).

## Game length and scoring

- One round (see the house rule at the top of this doc). Once every player has placed all their
  dice, all 6 casinos pay out and the game ends immediately.
- Each player's raw score is `totalMoney × 1000 + billCount` (a tiebreaker so a player with more
  total cash always outranks one with less, and among equal cash the player holding more
  individual bills — usually a sign of a broader win spread — ranks slightly higher).
- Sort order is descending (higher money wins). The platform converts this into cross-game rank
  points as usual — see [docs/PLATFORM.md](../PLATFORM.md).
- Money won is kept face-down/private in the physical game; the app hides opponents' bill values
  the same way (only bill *count* is visible) until the final payout, when everyone's money is
  revealed for the final standings.
