# 스컬킹 (Skull King)

Grandpa Beck's Games, trick-taking + bidding pirate game. Implemented for **2-6 players** in this
app (see the player-count note below for why the box's "2-8" isn't used here).

Sources (cross-checked — see note below on a conflicting print run):
- https://en.doc.boardgamearena.com/Gamehelpskullking (BoardGameArena's implementation — matches
  the current retail "Base Game" box, which explicitly lists **2-8 players**)
- https://gamerules.com/rules/skull-king/

**Note on a source conflict found during research**: an official Grandpa Beck's Games "BASIC RULES"
PDF (`content.cmpl.org/bg/SkullKing.pdf`, copyright 2013/2018) describes an older/legacy print
that caps at 2-6 players, treats Mermaids as an expansion-only card, and uses different bonus
values (Mermaid-captures-Skull-King = +50, no Pirate-captures-Mermaid bonus at all, plus a
capturing-a-14 bonus not used anywhere else). The current retail listing for the same product
explicitly says **2-8 Players (Base Game)**, and BoardGameArena's implementation — by far the
most-played digital version — includes Mermaids in the base 70-card deck with the 20/30/40 bonus
scheme below. This doc follows the BGA/current-retail ruleset, not the legacy PDF.

## Components

- 70 cards: 4 suits (green, yellow, purple, **black/Jolly Roger**) numbered 1-14 each (56 cards),
  plus 5 Pirates, 1 Tigress, 1 Skull King, 2 Mermaids, 5 Escapes (14 special cards).
- No Kraken, White Whale, Loot, or other "Legendary Expansion" cards — base game only.

## Player count: 2-6, not the box's 2-8

The retail box advertises 2-8 players, but the deck only has 70 cards and round 10 deals 10 cards
to every player. At 7 players that's 70 cards exactly (works, but leaves nothing spare for the
deal to ever misalign); at 8 players round 9 alone needs 72 cards and round 10 needs 80 — more
than exist in the deck. No source found during research documents an official variant for how
7-8 player games handle this (fewer rounds? smaller max hand? a second deck?), so rather than
invent an unconfirmed house rule, this app caps Skull King at **6 players** (60 cards needed at
round 10, safely under 70), matching the cap already used for Penguin Party and Bluff.

## Rounds

- 10 rounds. Round N deals N cards to each player (round 1 = 1 card each, ..., round 10 = 10 cards
  each).
- Each round: every player bids how many tricks they'll win, based on their hand. The physical game
  bids simultaneously (a fist-pound ritual reveals everyone's fingers at once); this app instead
  has players bid **one at a time in turn order**, so the platform's existing single-current-turn
  mechanism (and its 60s turn timer) can drive bidding the same way it drives everything else. No
  player's bid is revealed to anyone else until every player has bid — so the actual "blind
  decision" property of the physical game is preserved even though submission order isn't
  simultaneous. Then tricks are played one at a time until the hand is empty (round N has exactly N
  tricks).
- The winner of each trick leads the next one. The round's very first trick is led by the player
  after the previous round's dealer (in the app: rotates after the room's starting-player logic
  for the very first round of a game — see [docs/PLATFORM.md](../PLATFORM.md)).

## Card strength & trick resolution

Priority, highest to lowest:

1. **Mermaid** — if a Mermaid and the Skull King are both played in the same trick, the Mermaid
   wins (she "captures" him), no matter what Pirates are also present. If multiple Mermaids are
   played and no Skull King, the first Mermaid played wins.
2. **Skull King** — beats everything except a Mermaid played in the same trick (including beating
   every Pirate).
3. **Pirate** (including the Tigress played as a Pirate) — beats every numbered card, including
   black/Jolly Roger. If multiple Pirates are played in one trick, the first one played wins.
4. **Black (Jolly Roger) suit** — beats any colored (green/yellow/purple) numbered card regardless
   of value or which suit was led, but is otherwise just a numbered suit for follow-suit purposes
   (see below). Among black cards played in the same trick, the highest number wins.
5. **Colored numbered card matching the led suit** — highest number of the suit that was led wins.
   A colored card of a *different* suit than the one led (played only because the hand had none of
   the led suit) never wins.
6. **Escape** (including the Tigress played as an Escape) — always loses, *unless every single
   card played in the trick is an Escape*, in which case the first Escape played wins.

**Following suit**: the first *numbered* card played in a trick (colored or black) sets the suit
for that trick — every other player must play a card of that same suit if they have one in hand.
Special cards (Pirate, Tigress either way, Skull King, Mermaid, Escape) never set a suit to follow
and can always be played regardless of hand contents. If the trick is led with a special card (or
with Escapes only), no suit is ever set — anyone may play anything for the rest of that trick.

**Tigress**: when played, the player immediately declares whether it counts as a Pirate or an
Escape for that trick — this determines both its trick-resolution behavior and, if it wins as a
"Pirate", its eligibility for the Skull-King-captures-Pirate bonus below.

## Scoring (per round, added to a running total — can go negative)

- **Bid ≥ 1, matched exactly**: `+20` points per trick taken (i.e. `bid × 20`).
- **Bid ≥ 1, missed** (took more or fewer tricks than bid): `-10` points per trick of difference
  (i.e. `-10 × |tricksTaken - bid|`).
- **Bid = 0, matched** (took zero tricks): `+10 × roundNumber` (round N deals N cards, so this is
  also `+10` per card dealt that round).
- **Bid = 0, missed** (took at least one trick): `-10 × roundNumber`.

## Bonus points (only awarded to a player whose bid was matched that round)

Bonuses go to whichever player **won** the trick that contains the qualifying capture:

- Winning with a Pirate (or Tigress-as-Pirate) while a Mermaid was also played in that trick:
  `+20` per Mermaid present.
- Winning with the Skull King while Pirate(s) (including Tigress-as-Pirate) were also played in
  that trick: `+30` per Pirate present.
- Winning with a Mermaid specifically by capturing the Skull King in that trick: `+40` flat
  (this doesn't stack with the per-Pirate Skull King bonus above, since the Skull King didn't win).

A missed bid forfeits all bonus points for that round, even if the player's tricks would otherwise
have qualified.

## Game end

After round 10, the game ends. Final rank is by cumulative total score across all 10 rounds
(higher wins) — the platform converts this into cross-game rank points as usual, see
[docs/PLATFORM.md](../PLATFORM.md). Ties share the platform's standard tie-handling.
