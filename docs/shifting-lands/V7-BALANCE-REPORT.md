# Shifting Lands V7: a cruel world's moral economy

_Source: [Kind Robots PR #3950](https://github.com/silasfelinus/kind_robots/pull/3950), successful Shifting Lands Gameplay Contract run `39522495633`, Oct 20, 2026 PT. Reproduce: `npx tsx utils/scripts/verifyShiftingV7.test.ts 300`._

## Why V7 changed

**Design directive:** self-interest, force and exploitation should be the easiest ways through the wasteland. A ruthless or greedy traveler can buy or seize an advantage, but their endings remember the people who paid. Kindness has worse immediate odds and greater stakes, but earned mercy and honesty unlock witness testimony, collective resistance, and a more constructive, unusual future.

### Accepted mechanical balance

- **Greedy and ruthless are the easiest strategies measured**, at **59.7% and 62.0%** completion respectively. Greedy players can pay a provision to skip ahead while another waits. Ruthless players can make a weaker traveler take the danger. Both use preferential trial checks, but failure remains possible and a moral mark is applied even for failed exploitation.
- **Kindness is the hardest of the five policies tested**, at **42.0%** completion. The witness route requires actual mercy or honesty marks. The rarer solidarity route requires **four earned mercy marks and two honesty marks**, and can achieve an unusually hopeful communal ending. No mark is fabricated by selecting a compassionate label.
- **Cautious survival is between the extremes**, at **52.7%** completion. The cautious test strategy explicitly excludes harm-to-others shortcuts; scouting instead spends one health once per trial land to earn an alternate approach.
- **Random play remains risky**, at **47.3%** completion, even though random decisions can take exploitive shortcuts. The final Verge remains deadly across all policies.
- **Victory is not identical to a good ending.** Attempting dark bargains or coercion leaves an audited V7 mark; the ending names the burden of those actions, while an exploitative character who later builds solidarity gets partial restitution, not a magically cleared conscience. A genuinely earned solidarity success establishes mutual-aid structures and a shared road.
- **Legacy replay is protected.** All V5/V6 trial numbers and authored encounters stay pinned. New V7 saves use their own localStorage key and replay-check both preparations and moral consequences. Human playtest and visual/mobile acceptance remain necessary; no production deployment is claimed.

## Measured comparison

| Policy   | V6 complete | V7 complete | V7 fallen | Witness | Solidarity | Scout | Dark bargains | Preparations |
| -------- | ----------: | ----------: | --------: | ------: | ---------: | ----: | ------------: | -----------: |
| kind     |       42.3% |       42.0% |     58.0% |    2017 |       1335 |     0 |             0 |            0 |
| safe     |       59.3% |       52.7% |     47.3% |       0 |          9 |  1740 |             0 |          556 |
| greedy   |       36.0% |       59.7% |     40.3% |       0 |          0 |     0 |          3303 |            0 |
| ruthless |       41.7% |       62.0% |     38.0% |       0 |          0 |     0 |          3333 |            0 |
| random   |       39.3% |       47.3% |     52.7% |     494 |         90 |     0 |          1643 |            0 |

## V7 reachability by land, percent of all runs

| Policy   | homestead | dustwater | tablelands |  cave | verge |
| -------- | --------: | --------: | ---------: | ----: | ----: |
| kind     |    100.0% |     91.0% |      81.3% | 71.0% | 63.0% |
| safe     |    100.0% |    100.0% |     100.0% | 98.7% | 94.7% |
| greedy   |    100.0% |     98.0% |      94.0% | 89.0% | 80.3% |
| ruthless |    100.0% |     98.0% |      94.3% | 88.7% | 78.7% |
| random   |    100.0% |     98.7% |      94.0% | 87.7% | 72.3% |

## V7 deaths by land, counts

| Policy   | homestead | dustwater | tablelands | cave | verge |
| -------- | --------: | --------: | ---------: | ---: | ----: |
| kind     |        27 |        29 |         31 |   24 |    63 |
| safe     |         0 |         0 |          4 |   12 |   126 |
| greedy   |         6 |        12 |         15 |   26 |    62 |
| ruthless |         6 |        11 |         17 |   30 |    50 |
| random   |         4 |        14 |         19 |   46 |    75 |

Witness and solidarity choices require deeds. Scouting spends HP and is recorded in replay. Tribute spends food; coercion spends someone else's safety. Both add permanent moral marks. V6 saves and trial difficulty are unchanged; V7 is a separate save version.

## Method notes

The same seed range 1–300 was used per policy for V6 and V7. The real reducers determine cards, checks, consequences, and deaths; fixed decision heuristics determine choices. These are **not human playtest probabilities** or an argument that every character should have a prescribed completion rate. A mixed-strategy person may choose both kindness and cruelty, and the ending reacts to the actual recorded trial actions. Changes to V7 mechanics **after release** would require a rules-version bump and migration/replay plan.
