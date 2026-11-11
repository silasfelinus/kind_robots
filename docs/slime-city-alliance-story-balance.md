# Alliance Journey balance: matched controls, not a 36-game panic

**Scope:** Conductor `slime-city/t-009`; investigation following PR #4972 (2026-11-10 PT). This is an inspectable CPU-simulation investigation, not human/PvP acceptance.

## Root cause of the alarming smoke result

`verifySlimeCityAllianceTactics.test.ts` deals only 36 fights, with three seeds per story-choice pairing. Its lead is **Riot for five allies and Catgirls for the Riot ally**; its opponent is **Ironjaw for five allies and Undertow for the Ironjaw ally**. That deliberately exercises the new story-term mapping, but does **not** survey the six general factions or both seats. Its 9/36 wins cannot establish an overall 25% player win rate, nor that Catgirls and Bloodfairies are broken. **Crucially, the output keys such as `catgirls:protect:enemy` describe the allied faction, not the player's general.** In those six Catgirl-ally matches the general was Riot. Earlier summaries claiming the Catgirls general went 0/6 were a misread of the test label.

The same CI execution already ran two much broader benchmarks:

| Existing benchmark | Results |
| --- | --- |
| Constructed Alliance, `verifySlimeCityAllianceConstructed.test.ts` | **1,140** games including 60 general-swap controls, 48.7% first-seat wins excluding draws, 4.6% draws. General win rates: Catgirls 53.2%, Bloodfairies 41.5%, Ironjaw 56.3%, Riot 47.4%, Undertow 44.8%, Exchange 57.2%. |
| Standard deck/evolution matchup sweep | **1,080** games, 50.5% first-seat wins excluding draws, 0.0% draws. |
| Small Alliance general sweep, `sweepAlliance(5, 24001)` | **150** games, 54.7% first-seat wins. General win rates: Catgirls 50%, Bloodfairies 56%, Ironjaw 42%, Riot 62%, Undertow 54%, Exchange 36%. |

The different standings between 1,140 constructed matches and the 150-game starter sweep show why deck recipes and seed/opponent selection must be held constant before adjusting faction power. The constructed benchmark's specials-only plan also produced 43.3% draws at the 24-round limit; that is a separate deck-construction issue, not proof about Alliance story bonuses.

## New controlled experiment

`verifySlimeCityAllianceStoryBalance.test.ts` is attached to `test:slime-city-lab`.

For each of **six generals**, each of **five other rival generals**, each of **five distinct allies / chapter stages**, **two reproducible seeds**, and **both story-owner seats**, it repeats the exact same starter-deck matchup three times:

1. Baseline without the story modifier;
2. The authored **protect** tactical edge;
3. The authored **gamble** tactical edge.

That gives **600 paired setups / 1,800 real CPU-versus-CPU Clashes**, with exactly 100 match observations per general and per ally in each variation, and 300 matches per seat in each variation. The same deck, rival, seed, and seat are held constant across each triplet; both seats are tested. It checks real match termination, boss setup, and selected deterministic command replays. It reports baseline/protect/gamble win rates by general, ally and seat plus how often a story choice flips the outcome relative to the baseline or the alternative choice.

**Guardrails:** Win percentages are printed as diagnostic evidence, not hard CI thresholds. Two-seed estimates per individual matchup are noisy. The CPU strategy is not a human opponent. No rewards, deck contents, faction powers, saved story schema or production runtime rules are changed. Numerical adjustments should wait until matched results identify a stable, actionable imbalance across opponents and seats.

## Evidence and next decisions

CI evidence source: the completed Slime City contract shard of PR #4972 (2026-11-10 PT), which printed the 1,140-game constructed results and the original 36-game smoke outcomes. The new PR's contract log will contain the expanded matched-result table, so later contributors can compare like with like.

If the protected and gambled variants rarely change outcomes, improve their *mechanical distinctiveness* with replay-verifiable Clash abilities, not blanket HP changes. If a faction underperforms with multiple deck recipes and both seats, investigate the faction's core mechanics and AI card choices. Human fun and accessibility testing are still required before subjective acceptance.
