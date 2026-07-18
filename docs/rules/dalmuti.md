# 달무티 (The Great Dalmuti)

A shedding/climbing card game (like President/Tycoon) for **4-6 players** in this app. Source:
namu.wiki's 달무티 article, cross-checked against the user's own understanding of the physical game.

## Components

- 80 cards: 1 copy of "1", 2 copies of "2", ..., 12 copies of "12" (78 number cards total), plus
  2 Jokers. Lower number = higher social rank (1 = 달무티, the best; 12 = 농노, the worst).

## What this app implements vs. the physical game

This platform plays each game **once per session** (one shuffled deck, one hand, then a score
entry — see [docs/PLATFORM.md](../PLATFORM.md)), unlike the physical game's open-ended series of
hands. Concretely, that means:

- **Included**: the initial blind rank draw, both tribute (조공) exchanges, and the revolution
  (혁명/대혁명) mechanic — all faithful to the real rules, since even the physical game's very
  first hand establishes rank via a blind draw rather than a carried-over previous-hand rank. A
  single hand *is* "hand 1," tribute and all.
- **Skipped**: the optional 상인 (merchant) card-barter rule (explicitly optional in the source
  material) and mid-game player joining (this platform has no mid-game join at all, for any game).

## Setup

1. **Initial rank draw**: every player is assigned a random rank (a plain shuffle stands in for
   "everyone draws a card, ties re-drawn" — a shuffle has no ties to begin with). Index 0 = 달무티
   (best), last = 농노 (worst). Seating for the hand's trick rotation follows this order.
2. **Deal**: the full 80-card deck is dealt as evenly as possible. When it doesn't divide evenly,
   the worst-ranked players get the extra cards first (e.g. at 6 players, 80 / 6 = 13 each with 2
   left over — the bottom two ranks get 14).
3. **Revolution window**: if exactly one player was dealt both Jokers (only one player ever can
   be), they may declare a revolution:
   - **Reveal, and they're 농노**: **대혁명** — rank order fully reverses (농노 becomes 달무티, and
     so on). Tribute is skipped entirely this hand.
   - **Reveal, and they're anyone else**: **혁명** — rank order is unchanged, but tribute is
     skipped; everyone plays the hand as equals.
   - **Decline** (or nobody has both Jokers): tribute proceeds normally.
4. **Tribute** (skipped if a revolution triggered): only the top-2 and bottom-2 ranks participate.
   - 농노 (last) automatically gives their 2 lowest-value cards to 달무티 (best) — no choice
     involved, always the numerically lowest.
   - 소작농 (second-to-last) automatically gives their 1 lowest-value card to 총리대신 (2nd rank).
   - 달무티 and 총리대신 then each choose 2 and 1 card(s) respectively to give back — any cards
     they like, not necessarily their worst (matches the source: "꼭 높은 수를 줄 필요는 없다").

## Play

- 달무티 leads the first trick. Turn order follows the (possibly reversed) rank order from setup.
- **Leading** (no active trick to beat): play any number of same-rank cards from your hand — any
  rank, any count. A Joker can pad a group as a wildcard for whatever rank the other cards in the
  group share.
- **Following**: either pass, or play exactly as many cards as the active trick, all one rank,
  with a **strictly better** (numerically lower) rank than the trick's current cards.
- A lone Joker (or two Jokers with no accompanying real card) counts as rank 13 — worse than every
  real card, but still occupies a "slot" if you need to shed one.
- Once every other player still holding cards has passed since the last real play, the trick
  clears and leadership returns to whoever played it last (or, if they've since emptied their
  hand, the next player still holding cards).
- Emptying your hand first makes you this hand's new 달무티 (rank 1); play continues among the
  rest until only one player still holds cards (they land last).

## Scoring

Rank is purely finish order — first to empty their hand ranks best, the last player left holding
cards ranks worst. Converted into cross-game points the same way as every other game (see
[docs/PLATFORM.md](../PLATFORM.md)). No custom "next dealer" convention is needed: the platform's
default (previous game's rank-1 winner leads next) already *is* "whoever emptied their hand first
deals next," which is this game's own real-world convention too — they coincide.
