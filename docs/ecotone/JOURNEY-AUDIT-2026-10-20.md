# Ecotone journey audit, second draft (2026-10-20 PT)

## What the automated pass verifies

The Ecotone gameplay contract runs **8,400 end-to-end deterministic journeys** in addition to the existing 3,999 randomized seeded journeys and the intentional Wild Way tests. It samples every implemented opening lens, route, initial guide area, follow/stay choice, rolled checks, branch variations, and final fate. Each completed run is JSON-saved and restored, and it checks:

- seeded reproducibility and bounded route progression
- no repeated cards or phantom companions
- stable first opening state
- genuine encounter art keys for selected successes and failures
- persisted evidence and outcome flags
- callback eligibility tied to **both** a played card and earned flag, capped at two
- hope and dark reachability for each opening lens and each standard final companion
- six region/chapter coverage and several hundred genuinely different outcomes

The test prints the exact count of distinct ending IDs observed. **This is empirical sample coverage, not a proof that all 84 published IDs are reachable.** The 45–75-minute play duration is a human-playtest target; automated choice counts are not a trustworthy proxy for reading time, hesitation or accessibility.

## Existing ending-gallery gap discovered by the audit

The full 84-slot catalogue is generated as seven lenses × six ending leads × two fates, but the **opening choices are route-specific**:

- Green Ribbon: Sober, Stoned, Tripping, Meth.
- Kinetic Race: Sober, Tipsy, Cocaine, MDMA.
- Quiet Way: Sober, Stoned, Tripping.

Thus Wild Way (Ecotopia) is only obtainable on Quiet Way and cannot presently be achieved with Tipsy, Cocaine, Meth or MDMA, even though the corresponding ending IDs exist. It is **not honest** to equate catalogue IDs with truly collectible endings. Fix should introduce a **single voluntary seven-way opening-lens selection common to all routes**, while keeping one-screen interaction and the authored, route-specific opening scenes. Avoid simply adding seven choices to one card, which breaks the 2–4 choices/card art/Playbook contract. Until that is corrected, do not claim 84/84 reachable. This issue requires a scoped follow-up rather than a fabricated test pass.

## Saved quest ID collisions

Earlier version-4 saves used WH-004, WH-037 and WH-058 for the drug-specific stories `A Fast Hour in a Bottle`, `The River Does Not Sleep` and `The Peacock Has a Warrant`. Those same canonical WH IDs now refer to different regional stories; the old substance stories have been renamed to LX-FAST-01, LX-NIGHT-01 and LX-HEART-01.

`restoreRun` now rewrites old `played`, completed log source and outcome art **only when the corresponding old quest's unique historical log title proves its identity**. If the player merely has a current WH card or one in `offered`, there is no unambiguous evidence from the old payload and the ID is left unchanged. Modern WH cards never get silently reclassified as chemical quests. Save format and local-storage key remain version 4; no data reset.

## Editorial follow-ups

Every path should receive a human-paced session, including accessibility, repeated-looking choice pressure, unintended no-hope routes, historical/cultural verification, and all 84 ending combinations after common opening lens coverage is repaired. No live release or image generation is implied by CI success.
