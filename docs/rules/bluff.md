# 블러프 (Bluff) — not yet implemented

Richard Borg design (1993, Spiel des Jahres winner). Part of the Liar's Dice / Perudo family of dice
bluffing games — publishers differ on exact dice counts, bid rules, and dice-loss rules between
"Bluff", "Liar's Dice", and "Perudo", so the specific edition's rulebook must be pulled before
implementing (do not assume it matches Perudo's rules 1:1).

Sources:
- https://namu.wiki/w/%EB%B8%94%EB%9F%AC%ED%94%84
- https://www.koreaboardgames.com/magazine/menuDetail?boardCd=contents&postNo=765

## Summary (re-verify against the official rulebook before implementing)

- 10+, 2-6 players, ~30 min.
- Each player rolls a hidden set of dice under a cup; players take turns making increasingly higher
  "bids" about the total count of a given face value across all players' hidden dice, or calling the
  previous bid a bluff ("liar!").
- Losing a challenge costs the loser dice (removed from play); last player with dice remaining wins.
- Exact bidding rules (whether 1s are wild, how ties/re-bids work, how many dice each player starts
  with) vary by edition and need to be confirmed from the actual box/rulebook.

Not implemented. See `games/bluff/README.md`.
