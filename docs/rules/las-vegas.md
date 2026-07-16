# 라스베가스 (Las Vegas) — not yet implemented

Rüdiger Dorn design, published by alea. Push-your-luck dice/betting game.

Sources:
- https://namu.wiki/w/%EB%9D%BC%EC%8A%A4%EB%B2%A0%EA%B0%80%EC%8A%A4(%EB%B3%B4%EB%93%9C%EA%B2%8C%EC%9E%84)
- https://www.koreaboardgames.com/product/detail?prdCd=PD2024002324AGQI

## Summary (re-verify against the official rulebook before implementing)

- 8+, 2-5 players, ~30 min.
- 6 "casinos" (numbered 1-6) each get a random stack of cash bills at the start of each round.
- Each player has 8 dice; on their turn they roll all their remaining dice and place every die
  showing one chosen number into that number's casino (committing those dice for the round).
- After all players are out of dice, each casino pays out its cash to whoever placed the most dice
  there (ties split/cancel per the exact rulebook — needs confirming), most money after all rounds
  wins.
- Exact number of rounds and tie-handling rules need to be pulled from the official rulebook before
  implementing.

Not implemented. See `games/las-vegas/README.md`.
