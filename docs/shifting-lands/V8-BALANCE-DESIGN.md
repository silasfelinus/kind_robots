# Shifting Lands V8: earning the better road

Conductor task: `zuzu-shifting-lands/t-042` (October 22, 2026 PT).

## Why a version bump is necessary

V7's saved action history is verified by replay. Editing V7's historic trial targets would silently make old saves impossible to restore, or worse, reinterpret an already-earned result. V8 is a **separate ledger version, browser-storage key, and rules resolver**. Existing V7 runs continue under V7 rules, can resume, finish and preserve their V7 ending; new journeys begin with V8. The original 120 authored encounter cards, roll modifiers, source hashes, V6 deck and V7 memory callbacks do not change.

## Difficulty after earning alternatives

These are exact 2d6 odds, with the same existing skill bonuses. No dice are fudged and no success is guaranteed.

| Trial approach | Other lands: V7 → V8 | Verge: V7 → V8 | Qualifier |
| --- | --- | --- | --- |
| Witness | 27.8% → 58.3% | 16.7% → 41.7% | Two encounter-earned mercy and/or honesty marks |
| Solidarity | 41.7% → 72.2% | 27.8% → 58.3% | Four mercy **and** two honesty marks |
| Scout | 41.7% → 72.2% | 16.7% → 58.3% | Spend 1 HP preparing once for that land |
| Tribute / coercion | unchanged | unchanged | Retain their cost, moral mark and recorded consequences |

This is not a generic bonus for choosing a friendly dialogue line. Being kind during encounters can cost HP or provisions, and assembling witnesses takes real actions. Once the network has been built, it should actually help. Scouting carries an immediate physical cost; it should uncover a useful route, not just a worse lottery.

A preparation action remains optional even when available. Trial buttons display **exact success odds** so players can compare prepared or proven routes against unearned coercion. No automatic recommendation makes the choice for the player.

## Regression rules

- V7 and V8 have separate restoration functions and storage keys. A V7 save is rejected by the V8 restorer, and vice versa. A restored V7 save keeps its old active trial, its existing action choices and all story callbacks.
- V8 replay reconstructs the full action sequence and rejects altered mercy, scouting preparation, used rewards or trial results.
- V8 only changes the targets of Witness, Solidarity and Scout. The original trial choices and V7 dark routes have identical rolls, costs and consequences.
- Five adversarial decision policies run with identical seed sets against both versions. The test's cautious player compares the odds of legal honorable routes before spending 1 HP to prepare. This corrects the earlier naive simulation which always chose Scout even when its chance was worse.
- Seeded policy runs are **synthetic**. They measure reducer behavior and regression risk, not emotional impact, art quality or real player comprehension.

## Acceptance boundaries

The separate Conductor art t-033 and prose t-036 tasks remain owned by other workers. No existing saved runs are converted, no public rollout or production deployment is triggered by the PR. Evaluate the gameplay contract, TypeScript, layout, and full CI on the **latest head** before merging.

## Next investigation

After the first fixed-seed report, compare compassionate and coercive **ending quality and frequency**, not just completion percentage. A morally costly shortcut can still have strong short-term odds. That asymmetry should be intentional, legible and paid back in later scenes.
