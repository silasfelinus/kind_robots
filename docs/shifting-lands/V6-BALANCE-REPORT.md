# Shifting Lands V6: measured balance baseline

_Source: successful Kind Robots Shifting Lands Gameplay Contract, 39515510246, 2026-10-20. Run command: `npx tsx utils/scripts/shiftingLandsV6BalanceReport.ts 300`. All measured numbers below were emitted by the real V6 seeded reducer._

## Editorial findings

1. **The Verge is a pronounced endgame cliff.** Of 1,500 seeded runs, 1,180 entered the last land, 656 finished, and **524 died there**. That's **44.4% of last-land entrants** and **62.1% of all 844 deaths**, overwhelmingly from repeat failures at the final trial. By contrast, all five policies reach Dustwater over 97% of the time. Consider careful, versioned changes to trial pacing, alternative evidence routes, and a chance to recover before the final gate; avoid a silent difficulty nerf that corrupts existing V6 saves.
2. **Merciful does not mean unplayable.** The kind heuristic completed 42.3%, near the ruthless heuristic's 41.7%, but significantly below the safe heuristic's 59.3%. The kind route reached the Verge 78.3% of the time versus safe's 90.3%, consistent with earlier accumulated resource choices and/or trial-strategy effects. These heuristics conflate moral preference and risk appetite and are not controlled causal experiments.
3. **Investigative routes are underrepresented.** Kind and safe had 0% evidence-option eligibility at the first four trials. Greedy, ruthless and random unlocked evidence at nonzero rates (up to 15.7% at Homestead). Confirm whether flags can be earned on the choices each player style finds reasonable, and whether narrative signposting tells players how to unlock them.
4. **Deed-gated encounter choices are often unavailable.** Depending on policy, only 8.8%–16.7% of encountered gated options were open when shown. A player might see locked routes frequently without getting to experience the corresponding payoff. Track accessibility and player understanding before adding more gates.
5. **Food alone is not the survival bottleneck.** Greedy runs reached the Verge averaging 7.97 provisions and finished with 8.97, yet only 36% completed. Safe runs arrived averaging 0.55 provisions but retained more health and reached 59.3% completion. Consider trial math and health more important than simply handing out food.

### Methodology and caveats

Each policy uses seeds 1–300, the same seeded card draws, real encounter effects, 2d6 checks and authored trial results. The policy-specific choice heuristics are deterministic, not sophisticated AI or human players. Route percentages are conditional on reaching the relevant trial only where explicitly marked. Nothing here establishes an exact human completion rate, definitive causation, or a correct difficulty target.

**Save-compatibility gate:** This PR changes diagnostics only. Any trial target, choice cost, flag, dice, or map effect changes must be staged as a separate, versioned gameplay change with old saves replay-tested against their original rules.

---

# Shifting Lands V6 seeded balance report

**300 seeds per policy; 1500 real-reducer journeys.** Deterministic heuristics, not human or optimal play: kind values mercy/honesty, safe values health and odds, greedy values food, ruthless values ruthlessness, random chooses an eligible option.

## Survival

| Policy | Complete | Fallen | Stalled | Finish HP | Finish food |
|---|---:|---:|---:|---:|---:|
| kind | 42.3% | 57.7% | 0 | 5.81 | 0.00 |
| safe | 59.3% | 40.7% | 0 | 6.35 | 0.10 |
| greedy | 36.0% | 64.0% | 0 | 5.63 | 8.97 |
| ruthless | 41.7% | 58.3% | 0 | 5.62 | 6.42 |
| random | 39.3% | 60.7% | 0 | 5.47 | 0.28 |

## Reached / trial gate / cleared, percentage of all runs

| Policy and stage | homestead | dustwater | tablelands | cave | verge |
|---|---:|---:|---:|---:|---:|
| kind entered | 100.0% | 98.7% | 98.3% | 94.0% | 78.3% |
| kind trial | 100.0% | 98.7% | 98.0% | 94.0% | 77.7% |
| kind cleared | 98.7% | 98.3% | 94.0% | 78.3% | 42.3% |
| safe entered | 100.0% | 100.0% | 100.0% | 98.3% | 90.3% |
| safe trial | 100.0% | 100.0% | 100.0% | 98.3% | 90.3% |
| safe cleared | 100.0% | 100.0% | 98.3% | 90.3% | 59.3% |
| greedy entered | 100.0% | 98.0% | 97.3% | 92.0% | 75.0% |
| greedy trial | 100.0% | 97.7% | 97.3% | 91.3% | 72.7% |
| greedy cleared | 98.0% | 97.3% | 92.0% | 75.0% | 36.0% |
| ruthless entered | 100.0% | 98.0% | 97.3% | 93.0% | 74.3% |
| ruthless trial | 100.0% | 98.0% | 97.3% | 92.0% | 74.3% |
| ruthless cleared | 98.0% | 97.3% | 93.0% | 74.3% | 41.7% |
| random entered | 100.0% | 99.0% | 97.7% | 94.0% | 75.3% |
| random trial | 100.0% | 98.7% | 97.3% | 92.0% | 73.7% |
| random cleared | 99.0% | 97.7% | 94.0% | 75.3% | 39.3% |

## Deaths by land (runs)

| Policy | homestead | dustwater | tablelands | cave | verge |
|---|---:|---:|---:|---:|---:|
| kind | 4 | 1 | 13 | 47 | 108 |
| safe | 0 | 0 | 5 | 24 | 93 |
| greedy | 6 | 2 | 16 | 51 | 117 |
| ruthless | 6 | 2 | 13 | 56 | 98 |
| random | 3 | 4 | 11 | 56 | 108 |

## Evidence-gated trial route open / reached trials

| Policy | homestead | dustwater | tablelands | cave | verge |
|---|---:|---:|---:|---:|---:|
| kind | 0.0% | 0.0% | 0.0% | 0.0% | 0.4% |
| safe | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| greedy | 0.0% | 10.6% | 12.3% | 4.7% | 0.0% |
| ruthless | 15.7% | 11.9% | 12.0% | 5.4% | 0.0% |
| random | 12.7% | 8.8% | 5.8% | 4.7% | 1.4% |

## Deed-gated encounter options (opportunities)

| Policy | Shown | Open | Selected | Open / shown |
|---|---:|---:|---:|---:|
| kind | 1518 | 134 | 94 | 8.8% |
| safe | 1593 | 244 | 42 | 15.3% |
| greedy | 1488 | 191 | 18 | 12.8% |
| ruthless | 1488 | 248 | 13 | 16.7% |
| random | 1501 | 209 | 68 | 13.9% |

## At each land entry (mean health / food among arrivals)

| Policy | homestead | dustwater | tablelands | cave | verge |
|---|---:|---:|---:|---:|---:|
| kind | 8.00 / 2.00 | 7.53 / 0.72 | 7.53 / 0.14 | 6.97 / 0.01 | 6.35 / 0.00 |
| safe | 8.00 / 2.00 | 7.76 / 1.74 | 7.75 / 1.75 | 7.36 / 1.61 | 6.82 / 0.55 |
| greedy | 8.00 / 2.00 | 7.44 / 4.41 | 7.35 / 5.96 | 6.80 / 7.14 | 6.06 / 7.97 |
| ruthless | 8.00 / 2.00 | 7.41 / 3.77 | 7.41 / 4.81 | 6.84 / 5.92 | 6.03 / 6.26 |
| random | 8.00 / 2.00 | 7.51 / 1.86 | 7.37 / 1.20 | 6.76 / 0.80 | 6.08 / 0.46 |

## At each trial gate (mean health / food among arrivals)

| Policy | homestead | dustwater | tablelands | cave | verge |
|---|---:|---:|---:|---:|---:|
| kind | 7.22 / 1.75 | 7.01 / 0.63 | 6.44 / 0.14 | 5.87 / 0.17 | 5.03 / 0.35 |
| safe | 7.92 / 3.25 | 7.64 / 1.75 | 7.32 / 1.61 | 6.75 / 1.37 | 6.51 / 0.62 |
| greedy | 7.70 / 4.41 | 6.61 / 5.96 | 6.29 / 7.15 | 5.66 / 7.86 | 4.99 / 8.83 |
| ruthless | 7.61 / 3.76 | 6.75 / 4.81 | 6.36 / 5.89 | 5.61 / 6.21 | 5.35 / 6.23 |
| random | 7.27 / 2.74 | 6.66 / 1.76 | 6.14 / 1.41 | 5.38 / 0.88 | 4.81 / 0.67 |

## Top death causes

| Policy | Card/choice or trial |
|---|---:|
| kind | trial:verge (106); trial:cave (47); trial:tablelands (12); trial:homestead (4); card:the-handcart-and-the-loom/put-your-shoulder-to-the-cart (1) |
| safe | trial:verge (93); trial:cave (24); trial:tablelands (5) |
| greedy | trial:verge (110); trial:cave (49); trial:tablelands (16); trial:homestead (6); card:the-closed-infirmary/inspect-the-sealed-room (2) |
| ruthless | trial:verge (98); trial:cave (53); trial:tablelands (13); trial:homestead (6); trial:dustwater (2) |
| random | trial:verge (103); trial:cave (50); trial:tablelands (10); trial:homestead (3); trial:dustwater (3) |

**Method notes:** All effects and 2d6 rolls come from the live V6 reducer. Repeated trial attempts are included. Arrival resource averages condition on actually reaching that land. The same seed set is used for each policy. Changing target numbers, costs or flags requires an explicit V6 schema/version and replay-compatibility plan.
