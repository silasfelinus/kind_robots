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

## Safety and follow-up

No match engine rule, server reward, card definition, owned deck or saved record is changed. A CPU policy only affects the agent's choice of legal actions. If improved CPU play outperforms baseline reliably across controlled opponents and seats, use the board-aware policy as the new CPU default, retaining the baseline as a test comparator. Otherwise retain the old default. The two deck mixes are optional experiments, not forced replacements for human decks.

Human fun, card-specific late-evolution reward satisfaction, and deliberate non-CPU strategy remain separate acceptance tasks.
