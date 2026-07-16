# 펭귄파티 (PENGUIN PARTY) — implemented

Reiner Knizia design (2023), published by Gameology, Inc. / 팝콘에듀 (Korean edition). A card-pyramid
game — **not** "Hey, That's My Fish!" (an unrelated, similarly-named game that an earlier research
pass mistakenly assumed this was; always verify against the actual rulebook, not the name).

Source: official Korean rulebook PDF —
https://gamers-hq.de/media/pdf/36/1a/4e/PenguinParty_rule_KR_ol.pdf

## Summary

- 8+, 2-6 players, ~30 min.
- 36 cards, 5 illustrated types (not literal colors) confirmed from the physical deck: 나무(tree)×7,
  포도(grape)×7, 사막(desert)×7, 불(fire)×7, 얼음(ice)×8. Internally keyed as
  `fire | tree | desert | grape | ice` (`games/penguin-party/engine/types.ts`), rendered with a
  themed emoji + matching color per type (`games/penguin-party/ui/cardColor.ts`).
- Penalty tokens (physical game only — digitized as a single integer penalty score, see
  `games/penguin-party/engine/`): 24 white + 12 blue, 5 white ⇄ 1 blue.
- Deal: shuffle all 36, deal evenly to every player count 2-6. 5 players → 1 leftover card revealed
  publicly, unplayable.
  **House-rule deviation**: the official rulebook's 2-player variant (set aside 8 cards unseen,
  deal the remaining 28 at 14 each, narrow layer 1 to width 7) is intentionally NOT implemented —
  per an explicit user request, 2 players also use the full 36-card deck (18 each) with layer 1
  staying at width 8, same as every other player count. See `games/penguin-party/engine/deck.ts`.
- Build a pyramid: layer 1 is a row extendable only at its left/right ends (any type, max width 8).
  Layer 2+ fills the gap above two adjacent cards in the layer below, only with a type matching at
  least one of those two supports.
- Turn: play exactly one hand card to a legal spot. No legal spot for any card in hand → eliminated
  for the round, gain penalty points equal to your remaining hand size (hand stays hidden). Play
  your last card cleanly → reduce cumulative penalty by 2 (or by however much you have, floored at 0).
- Round ends when everyone is eliminated, or every non-eliminated player has emptied their hand (a
  lone survivor keeps playing until they too are eliminated or empty-handed).
- **House-rule deviation**: the official rulebook plays (player count) rounds per game, accumulating
  penalty across all of them before ranking. Per explicit request, a "game" here is always exactly
  **1 round** regardless of player count — that single round's penalty total directly determines
  the game's rank/points. See `totalRounds = 1` in `games/penguin-party/engine/reducer.ts`.

Everything else — who starts a game, scoring/points, the turn timer, host controls, nicknames,
room phases — is generic platform behavior, not specific to this game. See `docs/PLATFORM.md`.

Full implementation, engine + tests: `games/penguin-party/engine/`.
