# Shifting Lands V7: measured balance comparison

_Source: Kind Robots [PR #3950](https://github.com/silasfelinus/kind_robots/pull/3950), passing Shifting Lands gameplay CI run 39520292294 on 2026-10-20 PT. Command: `npx tsx utils/scripts/verifyShiftingV7.test.ts 300`. The figures below were emitted by the real V6/V7 reducers, not estimated from the text._

## Design acceptance

The first V7 tuning was **too forgiving**, with cautious 98.7% and kind 91.3% completion. We increased the difficulty of the earned routes before accepting the new balance. The revised 300-seed-per-policy data are below.

- **Kindness is playable without becoming invincible.** Kind completion rises from 42.3% to **62.3%**, while 37.7% still fail. The witnessed route requires at least two genuinely earned mercy or honesty marks.
- **Preparation matters but carries a cost.** Cautious completion increases from 59.3% to **79.0%**. Scouting costs 1 HP once per land and unlocks a more reliable alternate approach only at that land's trial; it is stored and replayed, not granted implicitly.
- **Other philosophies remain legitimate.** Greedy and ruthless completion remain at 36.0% and 41.7% for these simple fixed policies because they continue choosing confrontations. Players are still free to select witness or scout options when they qualify.
- **The final land still has real danger.** V7 death counts at the Verge are 57 kind, 55 cautious, 117 greedy, 98 ruthless and 80 random across 300 runs each. The notorious final gate remains consequential.
- **Legacy saves are not rewritten.** V7 uses a distinct ledger version and save key. Existing V6 saves and older V5 trial rules restore through their original code; V7 encounters still use the pinned V6 encounter deck and reducer.
- **Accessibility remains earned.** Witness testimony is drawn from moral marks, not a fabricated physical clue. The scout option requires an explicit recorded HP sacrifice. Evidence gates also recognize a narrow set of genuine investigation flags from newer encounter cards.

## Automated comparison

# V7 Shifting Lands balance comparison

Both rule versions use identical seed ranges and encounter-choice preferences. V7 kindness selects earned witnesses, while V7 cautious play surveys harder trials once at a health cost. These are heuristics, not human playtesting.

| Policy   | V6 complete | V7 complete | V7 fallen | V7 witness uses | V7 scout uses | V7 preparations |
| -------- | ----------: | ----------: | --------: | --------------: | ------------: | --------------: |
| kind     |       42.3% |       62.3% |     37.7% |            3267 |             0 |               0 |
| safe     |       59.3% |       79.0% |     21.0% |              22 |          1391 |             570 |
| greedy   |       36.0% |       36.0% |     64.0% |               0 |             0 |               0 |
| ruthless |       41.7% |       41.7% |     58.3% |               0 |             0 |               0 |
| random   |       39.3% |       55.0% |     45.0% |             940 |             0 |               0 |

## V7 reachability by land, percent of all runs

| Policy   | homestead | dustwater | tablelands |  cave | verge |
| -------- | --------: | --------: | ---------: | ----: | ----: |
| kind     |    100.0% |     96.7% |      94.3% | 90.0% | 81.3% |
| safe     |    100.0% |    100.0% |     100.0% | 98.7% | 97.3% |
| greedy   |    100.0% |     98.0% |      97.3% | 92.0% | 75.0% |
| ruthless |    100.0% |     98.0% |      97.3% | 93.0% | 74.3% |
| random   |    100.0% |     99.0% |      96.7% | 92.3% | 81.7% |

## V7 deaths by land, counts

| Policy   | homestead | dustwater | tablelands | cave | verge |
| -------- | --------: | --------: | ---------: | ---: | ----: |
| kind     |        10 |         7 |         13 |   26 |    57 |
| safe     |         0 |         0 |          4 |    4 |    55 |
| greedy   |         6 |         2 |         16 |   51 |   117 |
| ruthless |         6 |         2 |         13 |   56 |    98 |
| random   |         3 |         7 |         13 |   32 |    80 |

New witness/scout routes remain earned. Each scout action consumes one HP and is recorded in save replay. V6 saves and trial difficulty are unchanged; V7 is a separate save version.

## Interpretation and follow-up

Five deterministic heuristics replay the same 300 seeds for each version. They are **not** human participants, do not exhaust all choices, and do not establish an optimal or universally fair success rate. Actual players may prepare at different trials or pursue mixed moral marks. Trial-roll odds and whether players understand the new routes need manual testing.

**Approval is limited to source/gameplay checks.** This change does not generate new art, publish a production deployment, or constitute visual sign-off at phone, tablet and desktop widths. Preserve V6 restore tests on every subsequent authored-rule edit. Any V7 rule tuning that alters existing V7 replays should bump the V7 trial-rules identifier and provide a replay migration path.
