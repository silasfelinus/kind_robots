# Slime City Alliance: support-role and evolution AI investigation

**Task:** Conductor `slime-city/t-009` (2026-11-10 PT). Controlled CPU matchmaking, not human/PvP balance acceptance.

## Why this matters

The previous matched 1,800-Clash narrative study found a larger difference **between allies** than between generals: with the classic starter recipe, Bloodfairies as support won 41% and Undertow as support won 70% under that test's CPU decisions and opponent sample. It did not establish an intrinsic crew imbalance. Earlier broad deck-construction runs showed much narrower _general_ differences with differing deck recipes.

Alliance's CPU did not actually inspect its current evolution conditions while choosing cards. It granted +1.2/+2.5 to any evolved **enter** ability in Alliance, ignoring whether a target exists; the richer `cpuEvolutionPayoff` already existed for Solo and was discounted for Alliance, but never consulted by its Alliance card-scoring branch. The difference may encourage the wrong cards and obscure tactical synergies.

## Changes and controlled experiment

1. Preserve an **exact baseline CPU policy** for reproducible comparisons. The improved Alliance card scorer uses the existing read-only board-aware evolution payoff, bounded to [-2, +3] points, plus at most +0.7 for future L2 value on an L1 card. Solo CPU decisions and core game rules are unchanged. Baseline vs improved can be compared in the same seeded game.
2. Provide two **legal 20-card starter recipes** from the account's already-owned base cards, without replacing saved/default decks: `fighter-forward` (12 fighters, 8 other cards) and `ally-forward` (10 fighters, 10 other cards, greater representation of the supporting faction). The original `classic` 15-general/5-ally recipe is retained.
3. Run `verifySlimeCityAllianceCpuDeckBalance.test.ts`: every one of 30 directed general/ally combinations vs five rival generals, two seeds, both seating orders, four controlled options: original CPU and classic deck; improved CPU and classic deck; improved CPU and fighter-forward deck; improved CPU and ally-forward deck. Exactly **600 matched setups / 2,400 CPU Clashes**. Each set of four keeps the same rival deck, seed and seat. Test legality, ownership, all six general/ally samples, deterministic replays, boss/round validity. Record wins, draws, fighter plays, evolution L2+ and L3 plays, game length and how often improvements flip outcomes.

The source report will be the current PR's contract-job log. Win rates should remain diagnostic, with no unconditional CI thresholds or extrapolation to human competitive play.

## Prior data (verified 2026-11-10 PT)

- 1,140 constructed Alliance matches: 48.7% first-seat wins excluding draws, 4.6% draws.
- 1,800 story choice matches with ally/chapter/rival Latin-square controls: 52.3% baseline, 55.3% protect, 58.5% gamble, with 600 matches per condition.
- Prior 36-game test used mostly Riot as the general against Ironjaw; the keys for Catgirls and Bloodfairies named _allies_, not player generals. It cannot establish those crews' win rates.

## Matched results, latest-head CI (2026-11-10 PT)

All **600 matched setups / 2,400 real Clashes** and six command replays completed. Every recipe was legal and used only free starter cards. The first arm uses the old CPU and classic deck for the story-owning side; the opposing side always uses the old CPU and classic deck.

| Story-owner variant              | Win rate, excluding draws | Win/loss outcomes changed vs old |
| -------------------------------- | ------------------------: | -------------------------------: |
| Classic deck, old CPU            |                     53.8% |                        reference |
| Classic deck, board-aware CPU    |                     54.0% |                         37 / 600 |
| Fighter-forward, board-aware CPU |                     65.3% |                        219 / 600 |
| Ally-forward, board-aware CPU    |                     44.0% |                        263 / 600 |

**CPU behavior:** The evolved-card scorer modestly increased level-three card plays from **239** to **259** and creature plays from 4,915 to 4,939, at nearly unchanged overall win rate. The new scorer is a bounded, board-aware improvement, not a power-creep fix. It should not be sold as solving support imbalance.

**Deck behavior:** Fighter-forward played **5,512 creatures**, compared with 4,915 in the old baseline, and performed much better against classic opponents. Its 65.3% is a _relative advantage against classic opponents_, not the expected rate once both sides adopt the stronger deck. It warrants being offered as a clearly named deckbuilding starting point, not silently replacing user decks.

**Ally identity:** Bloodfairies as supporting ally won 43% in the legacy arm, **53% with fighter-forward**, and 51% with ally-forward. Undertow as supporting ally won 72%, 85%, and 37% in those same arms. Those swings show that the ally-role imbalance cannot be interpreted without deck mix; simply including more ally cards is **not** a general remedy. When examining win rates, use each fixed deck-and-policy comparison, not a mixture of recipes.

**Seat control:** With classic decks, first-seat story owners won 55.7% under the old CPU and 57.0% under board-aware CPU; second-seat story owners won 52.0% and 51.0%. This small sample does not justify a seat modifier.

**Decision:** Keep the bounded evolution-aware CPU and retain old policy for exact comparisons. Keep original starter defaults and account-owned saved decks unchanged. Make fighter-forward and ally-forward available as explicit optional recipes, not automatic replacements. Next controlled study should pit fighter-forward against fighter-forward (both seats) and compare the resulting faction power/card evolution access before any global deck default change.

## Safety and follow-up

No match engine rule, server reward, card definition, owned deck or saved record is changed. A CPU policy only affects the agent's choice of legal actions. If improved CPU play outperforms baseline reliably across controlled opponents and seats, use the board-aware policy as the new CPU default, retaining the baseline as a test comparator. Otherwise retain the old default. The two deck mixes are optional experiments, not forced replacements for human decks.

Human fun, card-specific late-evolution reward satisfaction, and deliberate non-CPU strategy remain separate acceptance tasks.
