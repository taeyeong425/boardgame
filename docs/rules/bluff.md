# 블러프 (Bluff) — implemented

Richard Borg design (1993, Spiel des Jahres winner), Ravensburger. Part of the Liar's Dice / Perudo
family — but a distinct edition with its own dice-per-player scaling and proportional dice-loss
rule, confirmed from the Korean Namu Wiki article (pasted in full by the user, not paraphrased
from a secondary summary) rather than assumed from the game's name or family resemblance.

Source: https://namu.wiki/w/%EB%B8%94%EB%9F%AC%ED%94%84 (구성물/게임 규칙 sections)

**House rule**: the official rule (confirmed from the source above) says that on an exact-match
challenge, **everyone except the bidder** loses a die — including the challenger, who guessed
wrong. This app instead spares the **challenger** (they're the one who acted) and has everyone
else, including the bidder, lose a die each. See `games/bluff/engine/reducer.ts`'s
`allButChallengerLose` outcome.

## Summary

- 2-6 players. Components: 1 board (a bid-progress track + a 30-space tray for lost dice), 6 dice
  cups, 30 yellow dice (faces `1,2,3,4,5,★` — physically the 6-pip face replaced with a wild star),
  1 red marker die (just indicates the current bid's face on the board, not rolled).
- **Dice per player** (all 30 dice are split up front, unlike plain Perudo/Liar's Dice which always
  gives 5 regardless of headcount — this game needs more because a single lost challenge can cost
  more than 1 die): 2p→15, 3p→10, 4p→7 (28 of 30 dealt, 2 left unused), 5p→6, 6p→5.
  See `games/bluff/engine/dice.ts`.
- Every round, all players roll their remaining dice and hide them under their own cup — only your
  own roll is visible to you.
- **Turn**: the round's first player must bid (nothing to challenge yet). Every player after that
  either raises the previous bid or challenges it ("블러프!").
- **Bid** = "(face) exists (count) or more times" across every die in play (yours + everyone
  else's, hidden). ★ is wild for any numbered-face bid (a die showing ★ counts toward a bid on any
  of 1-5); betting on ★ itself only counts actual ★s (nothing is wild for the wild).
- **Raising rules** (`games/bluff/engine/bidding.ts`):
  - The count can never decrease.
  - Raising the count lets you switch to any face, even a lower one.
  - Keeping the same count requires strictly raising the face value.
  - ★ is half as likely per die as a numbered face, so converting between a numbered bid and a ★
    bid applies a conversion factor: number→★ needs at least `ceil(count / 2)`; ★→number needs at
    least `count * 2`. ★→★ has only one face, so it must strictly raise the count.
- **Challenge**: everyone reveals their dice. Compare the bid's face-count against the bid:
  - Actual > bid (bid succeeded, challenge fails): the **challenger** loses `actual - bid` dice.
  - Actual < bid (bid failed, challenge succeeds): the **bidder** loses `bid - actual` dice.
  - Actual == bid exactly (bid succeeded): **everyone except the challenger** loses 1 die each
    (house rule — see the note at the top of this doc).
- Losing all dice eliminates a player. The next round starts with whoever just challenged — unless
  that challenge eliminated them, in which case the next active seat (table order) starts instead.
- Last player with any dice left wins.

Full implementation, engine + tests: `games/bluff/engine/`. UI dice are CSS 3D-transformed cubes
(`games/bluff/ui/Die3D.tsx`) rather than flat icons, per user request, with a brief tumble
animation on every fresh roll.
