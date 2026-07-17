# 라스베가스 (Las Vegas)

Rüdiger Dorn design, published by alea. 2-5 players. Implemented.

**House rule**: this app plays a **single round** instead of the official game's 4 rounds — one
full cash-refill → roll-and-place → payout cycle, then the game ends. Everything below describes
what happens within that one round; the official game just repeats it 4 times with dice reset and
the start player rotating each time.

Sources:
- https://namu.wiki/w/%EB%9D%BC%EC%8A%A4%EB%B2%A0%EA%B0%80%EC%8A%A4(%EB%B3%B4%EB%93%9C%EA%B2%8C%EC%9E%84)
- https://www.koreaboardgames.com/product/detail?prdCd=PD2024002324AGQI

## Components

- 6 casinos, numbered 1-6.
- 54 bills total: $10k×6, $20k×8, $30k×8, $40k×6, $50k×6, $60k×5, $70k×5, $80k×5, $90k×5.
- Each player has 8 own dice (all same color). A shared pool of neutral/"house" dice exists for
  2-4 player games (see below); 5-player games use no neutral dice.

## Round setup

- Shuffle the bill deck. Deal bills face-up one at a time onto casino 1, then 2, ... cycling
  through all 6, until every casino has **at least $50,000** stacked on it, then stop (a casino
  may end up with more than one bill and more than $50k once the last bill that pushes it over is
  dealt).
- Determine each player's neutral ("house") dice for this round:
  - 2 players: 4 house dice each.
  - 3 players: 2 house dice each, **except the round's starting player gets 4** (absorbs the
    "leftover 2 dice" rule from the physical game, where neutral dice are dealt out among players
    and don't divide evenly).
  - 4 players: 2 house dice each.
  - 5 players: 0 house dice (no neutral dice used at all).
- The starting player is chosen randomly (or carried over from the previous game in the room, per
  the platform-wide `nextStartingPlayerId` rule — see [docs/PLATFORM.md](../PLATFORM.md)).

## Turn structure

On your turn you take one of these two actions:

1. **Roll**: roll every die you have not yet placed this round (your own remaining dice + your
   remaining house dice, all at once). Dice are grouped by face value (1-6) and everyone at the
   table sees the result.
2. **Place a face**: having just rolled, choose ONE face value from your pending roll. Every die
   showing that face (both your own-color dice and house dice) is placed onto the casino with the
   matching number, split into "your dice" vs. "house dice" on that casino's dice tally. Those
   dice are now committed for the rest of the round — you cannot re-roll them.

After placing, if you still have unplaced dice, it becomes the next player's turn; you'll roll
your remaining dice again on your next turn. If you have none left, your turn is skipped for the
rest of the round. Once every player has placed all their dice, the round ends and casinos pay
out.

## Casino payout (resolved once per round, all 6 casinos at once)

For each casino:

1. Group all placed dice by owner (a player, or the shared house/neutral pool) and count dice per
   owner.
2. **Any owner whose dice count ties with another owner at that casino is eliminated from that
   casino's payout** — ties cancel each other out, no matter how high the tied count is.
3. Rank the remaining (non-tied) owners by dice count, descending.
4. Award the casino's bills to survivors highest-count-first: the highest bill(s) go to the
   top-ranked owner, working down. If house/neutral dice out-rank everyone (or win by having the
   most dice with no player tying it), the money it "wins" is simply removed from play (the house
   doesn't collect money).
5. Any bills left unclaimed (because every owner tied, or because the house won them) simply go
   unawarded — there's no later round left to redeal them into.

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

## What "중립" (neutral) means

The 🏠/"중립" dice tally you see at each casino, and the "중립 N개" count in your own roll, are the
shared **house/neutral dice** described above under Round setup — a communal pool of extra dice
(not owned by any player) that gets divided up among 2-4 player games to make majorities harder to
lock in. They roll and get placed exactly like a player's own dice and can win (or force a tie
elimination) at a casino, but any money they "win" is simply discarded instead of paid out — so a
casino where the neutral pool comes out on top is often a casino nobody actually profits from.
5-player games skip neutral dice entirely (see Components above), since with 5 real players there's
already enough natural competition for majority at each casino.
