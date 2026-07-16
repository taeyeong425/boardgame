# 스컬킹 (Skull King) — not yet implemented

Grandpa Beck's Games (2013). Trick-taking + bidding card game.

Sources:
- https://namu.wiki/w/%EC%8A%A4%EC%BB%AC%ED%82%B9
- https://boardlife.co.kr/bbs_detail.php?tb=board_knowhow&bbs_num=1794

## Summary (re-verify against the official rulebook before implementing — see Penguin Party's
note about not trusting a name/summary alone)

- Cards: 4 suits × 1-14 (56 cards) + 14 special cards (5 pirates, 1 Tigress, 1 Skull King,
  2 mermaids, 5 escapes).
- 10 rounds; round N deals N cards to each player (round 1 = 1 card each, ... round 10 = 10 each).
- Card strength: pirates beat all suit cards and mermaids, lose to the Skull King. The Skull King
  beats everything (suits, pirates including Tigress). Mermaids beat suit cards and the Skull King,
  lose to pirates. (Rock-paper-scissors triangle among the three special categories.)
- Each round: players bid how many tricks they'll win, then play out the round trick-taking style;
  scoring rewards hitting your bid exactly (and often bonus points for certain captures, e.g.
  capturing the Skull King with a pirate) — exact scoring table needs to be pulled from the official
  rulebook/box insert before implementing, several fan variants disagree on the bonus numbers.
- 2-6 players typically (verify exact box player count before wiring into `shared/gameCatalog.ts`).

Not implemented. See `games/skull-king/README.md`.
