# Animation catalog — browser smoke matrix

Manual pass required before promoting an animation candidate to `done`, alongside
TypeScript, contract tests, and `npm run test:animation-catalog`
(`utils/scripts/verifyAnimationCatalog.ts`) — see conductor's
`projects/animation-manager/SPEC.md` for the full pipeline this gates.

Run through every row for a **new or changed** effect. For a polish pass on an existing
effect, only the rows its change could plausibly affect need re-checking — note which
rows you ran in the PR body.

| # | Check | How | Pass criteria |
|---|---|---|---|
| 1 | Desktop viewport | `screen-fx.vue` on a ≥1440px window | Loop fills its `preferredSurface` region without stretching or letterboxing |
| 2 | Mobile viewport | Resize to ~390px width (or device emulation) | Loop still reads as the same effect; no overflow/scrollbar introduced; touch works where the effect is interactive |
| 3 | Clipped Screen FX surface | Toggle the effect onto `header`/`sheet`/`hand` in Screen FX (not `fullscreen`) | Effect clips cleanly to that region's bounds; nothing bleeds or gets cut off mid-shape |
| 4 | Startup wallpaper | Set as `startupEffect` in animation preferences, reload | Renders full-screen, fades in/out per `startup-animation.vue`'s timing, no flash of unstyled content |
| 5 | `prefers-reduced-motion` | Enable OS/browser reduced-motion, repeat rows 1 and 4 | Fewer elements, slower movement, lower contrast, or a quiet static state — never identical to the full-motion loop |
| 6 | Route changes | Navigate away and back while the effect is running (Screen FX) or mid-fade (startup) | No duplicated instances, no orphaned canvas/DOM nodes, no console errors |
| 7 | Repeated mount/unmount | Toggle the effect off/on rapidly 5+ times (or use `animation-tester.vue`-style repeated start/stop) | No listener/RAF/observer leak — check DevTools performance or a manual FPS check after the cycle; unmount must cancel every frame, observer, timer, and listener it registered |
| 8 | Input passthrough | For non-`blocksInput` effects, click/scroll/type on underlying page content while the effect runs | Page interaction is unaffected; the effect never calls `preventDefault`/`stopPropagation` on events meant for the page |

Effects with `blocksInput: true` are Screen FX-only by contract (SPEC.md item 10) —
skip row 4 (startup wallpaper) for those and confirm instead that they are excluded from
`animation-tester`-style startup pickers (already enforced by
`verifyAnimationCatalog.ts`'s `generationSafe`/`blocksInput` check, but worth a visual
double-check that the effect doesn't unexpectedly appear in the startup preference list).
