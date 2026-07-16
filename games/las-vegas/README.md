# 라스베가스 (Las Vegas) — stub

Not implemented yet. This folder is a placeholder so `party/games/registry.ts` and `games/registry.ts`
have a known slot to fill in later, matching the Penguin Party module shape (`GameModule` in
`party/games/types.ts`).

See [docs/rules/las-vegas.md](../../docs/rules/las-vegas.md) for a rules summary and source links —
re-verify against the official rulebook before implementing, the same way Penguin Party's rules were
re-confirmed from the actual PDF rather than assumed from the name alone.

Catalog entry (player count, display name) already lives in `shared/gameCatalog.ts` with
`implemented: false`, so it shows up "coming soon" and greyed out in the lobby's game picker without
any further wiring.
