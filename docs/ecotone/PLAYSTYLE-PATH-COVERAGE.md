# Ecotone: player-path overlap and encounter starvation audit

**October 22, 2026 PT.** Source: `utils/scripts/verifyEcotonePlaystyles.test.ts` (Conductor `weird-humboldt/t-060`). This is deterministic instrumentation on real authored engine journeys, not a human-rated entertainment study.

## Sampling contract

The test runs 1,260 full games: three starting events, seven initial lenses, twelve seeds, and five fixed playstyle policies. Matched comparisons hold event, lens, seed, and character archetype constant while varying the player's decisions. Existing replay, 84-ending reachability, excluded-content suppression, and art-slot contracts remain unchanged.

## Measures that matter

- **Ordered card paths** remove the choice wording, rolled outcome and epilogue ID from a run signature. Their distinct count detects identical sequences previously concealed by distinct choice strings.
- **Side-encounter-only paths** exclude fixed beats. This exposes repeated white-rabbit draws and shows whether the optional middle actually changes.
- **Matched-pair Jaccard overlap** compares all played card IDs and separately just the side-encounter IDs for each of ten pairs of five policies. Mean 1.0 means the pairs saw identical sets. It does not measure narrative quality or order.
- **Chapter coverage** counts distinct authored card IDs actually visited by this synthetic sample in each numbered chapter. It is not a canonical count of all eligible cards.
- **Unvisited and least-seen side encounters** report real existing card IDs, including intentionally gated stories. An unvisited gated card is an investigation candidate, not necessarily a bug; inspect its conditions before modifying any probabilities.
- **Flag-only remaining-encounter eligibility delta** strips saved flags from each completed journey and compares otherwise identical remaining encounter eligibility. A result of zero means the current encounter eligibility implementation did not consume those flags in this sample. It does **not** claim companions, lenses, saved relationship order or ending callbacks have no effect.

## Triage interpretation

The previous 1,260/1,260 unique decision histories were **not evidence** of unique story middle chapters. Follow-on story work should instead choose high-overlap events and revise one consequential encounter pair so an earlier outcome changes a later playable decision. Do not artificially lower similarity by stuffing filler cards or altering seeds. Do not declare an arbitrary pass threshold before seeing the first measured baseline.

Prioritize the first real causal change in `t-058`. Maintain the permanent exclusion of superseded sensitive story materials, all four companions' agency, solo play, stable save version and existing art keys. The observer checks for new possibilities but should not rewrite live gameplay.

## Verification

This document intentionally contains **no fabricated baseline numbers**. The latest-head `Ecotone Gameplay Contract` CI console log is the executable source for exact path-count, overlap, starvation and flag-only delta metrics. Human-paced testing is still required to judge whether any given route feels surprising or emotionally earned.
