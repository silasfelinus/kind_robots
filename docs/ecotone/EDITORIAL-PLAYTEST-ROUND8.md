# Ecotone editorial playtest, round 8

**October 21, 2026 (PT), non-sensitive internal fiction revision.** This is a source-level editorial response to round seven's automated and manual-adversarial questions. It does not certify the game as a 45–75-minute enjoyable human playthrough or authorize publication of consultation-held material.

## Before: three weaknesses

1. The Green Ribbon closing fire reduced a two-sided forest-land decision to petitioners who were clearly right versus an anonymous buyer who was suspicious by default. The petition failure gave almost the same reward as the success, and the "burn the notebook" choice claimed to destroy evidence the game still stored.
2. Quiet Way investigative failures were frequently consolation treats. The sober bench's lost duck count even awarded extra nerve. The ranger's thwarted inquiry awarded goodwill and the future photograph had almost no cost.
3. Companions had scene-opening asides, but results of pivotal decisions used the same narrated text regardless of who was accompanying the player. A person could be furious or supportive in a scene entrance and then become silent when the consequences landed.

## Implemented changes

- **A real land dilemma:** the Green Ribbon fair now contains a public-access petition and a private restoration cooperative. Both have plausible local interests. A successful investigation uncovers the co-op's gate and its valid habitat proposal. A failed inquiry protects private signer information but loses access, public confidence and nerve. A failed petition can embarrass the player and cost a donation, not simply award a consolation signature.
- **A meaningful sacrifice:** the player can burn the one-of-a-kind sketch of the looping forest, not a notebook whose evidence would remain visible in the save. The loss is acknowledged later without silently deleting achievements or gathered clues.
- **Sober parity with stakes:** a failed bird tally removes nerve and produces a handwriting anomaly that follows the player to the elk meadow. Missing the ranger or following the coast road carries wasted time, lost proof or transport, and mental fatigue. The known future photo remains eerie but is no longer a better free reward for failure.
- **Grounded watershed repair:** the volunteer crew is introduced before the creek option. The player can help on a planned workday; they cannot magically fix a river with a single Burly roll. A failure delays the crew and leaves a genuine apology and learning obligation, not free goodwill.
- **Actual character voices:** `Outcome.leadLines` is read only after the outcome has been resolved, by the engine's choice recorder. The current `activeLead` controls the line. A solo player receives a separate reflection. Merely having met someone does not make them appear, and successes and failures can provoke opposite reactions. GR-5 and QW-5 supply 5 distinct reactions per result, including an authentic solo alternative.
- **A quiet option without a morality exam:** declining to buy the cabin and just observing remains valid; companions can express their own preferences without making a resting player a villain.

## Contract and remaining limitations

The earlier 200 complete sober-journey test remains active. Round eight adds deterministic rolling witnesses for successful and failed pivotal choices, checks companion presence and the exact saved outcome narration, requires costs in failed checks, and asserts the sober-bench callback cannot appear without its prior flag. Existing card IDs, choice IDs, illustration slots and save-state shape are untouched.

Art prompts, source-to-UI rendering, pacing on mobile, and human emotional readability still need visual/manual review. The Wiyot/Tuluwat hold remains in force. Kinetic course changes and the optional multi-companion ending are owned by separate tasks.
