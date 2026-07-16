# 펭귄파티 (PENGUIN PARTY) — implemented

Reiner Knizia design (2023), published by Gameology, Inc. / 팝콘에듀 (Korean edition). A card-pyramid
game — **not** "Hey, That's My Fish!" (an unrelated, similarly-named game that an earlier research
pass mistakenly assumed this was; always verify against the actual rulebook, not the name).

Source: official Korean rulebook PDF —
https://gamers-hq.de/media/pdf/36/1a/4e/PenguinParty_rule_KR_ol.pdf

## Summary

- 8+, 2-6 players, ~30 min.
- 36 cards: red×7, green×7, yellow×7, purple×7, sky-blue×8 (5 colors).
- Penalty tokens (physical game only — digitized as a single integer penalty score, see
  `games/penguin-party/engine/`): 24 white + 12 blue, 5 white ⇄ 1 blue.
- Deal: shuffle all 36, deal evenly. 5 players → 1 leftover card revealed publicly, unplayable.
  2-player variant → set aside 8 cards unseen first, deal the remaining 28 (14 each), and layer-1's
  max width drops from 8 to 7.
- Build a pyramid: layer 1 is a row extendable only at its left/right ends (any color, max width
  8 or 7). Layer 2+ fills the gap above two adjacent cards in the layer below, only with a color
  matching at least one of those two supports.
- Turn: play exactly one hand card to a legal spot. No legal spot for any card in hand → eliminated
  for the round, gain penalty points equal to your remaining hand size (hand stays hidden). Play
  your last card cleanly → reduce cumulative penalty by 2 (or by however much you have, floored at 0).
- Round ends when everyone is eliminated, or every non-eliminated player has emptied their hand (a
  lone survivor keeps playing until they too are eliminated or empty-handed).
- Game = (player count) rounds; lowest cumulative penalty wins, ties share the win.

Full implementation, engine + tests: `games/penguin-party/engine/`.
