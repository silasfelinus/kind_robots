# Memory Dungeon splash layout

The pre-game Memory Dungeon screen is deliberately art-first:

- The hero artwork owns the first scroll viewport.
- Difficulty, deck choice, and the Enter action share one compact glass dock over the art.
- The old How to Play / Powerups / Top Adventurers text strip is visually suppressed on the splash screen instead of consuming the bottom fifth of the artwork.
- Scrolling past the hero reaches the visual deck-source gallery introduced by PR #2552.
- The in-game header, settings popover, board, log, and leaderboard are unchanged.

The layout lives in `assets/css/memory-dungeon.css` because the existing Memory Dungeon component is large and stable; this pass intentionally changes presentation only, not game logic.
