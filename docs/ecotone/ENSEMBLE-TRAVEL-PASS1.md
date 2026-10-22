# Ecotone: two-guide travel and shared futures

**Development slice of Conductor t-045, October 21, 2026 PT.** This implements the first *playable* shared-party decision without replacing the 56 established single-guide and solo collectibles.

## Player flow

Each established route has one true companion crossroads. If a player is accompanied, the crossroads now presents a third choice: invite the newcomer to continue alongside the existing guide. The old stay/follow answers remain intact, and a solo player still chooses whether to travel alone or follow the newcomer. A new `travelCompanions` save field records additional guides **only after a mutual, explicit invitation**. It does not retroactively convert a previously met person into a traveling party member.

The original `activeLead` remains the focal guide for personalized scene stakes, the existing ending signature and default perspective. A second guide may react to main-story scenes and help with checks in their own specialty, but each check gets at most **one** guide bonus. Personal quest eligibility recognizes both present guides; former-guide encounters only apply to someone who truly left.

The finale preserves the earned existing signature, then narrates an additional, authored shared-future paragraph for the pair and the resulting hopeful or dark county future. All six distinct pair combinations have two futures, including actual disagreement and fallible plans. Romance is neither presumed nor required. The new ending narration is **not** counted as a new collectible signature, and no new art slot is claimed yet.

## Save and verification

Saved-run version stays at 4. Pre-feature saves without `travelCompanions` restore with an empty extra party. New saves validate the extra members as real, distinct, previously met people. Gameplay tests cover all six combinations over multiple seeds through actual ending traversal, exactly one skill bonus, two voiced perspectives without phantom travelers, old-save restoration, and full deterministic replay.

## Still to develop

* Further crossroads or optional meet-ups if three/four-guide traveling groups are desired. Current route layout has only **one** crossroads per run, so each finished journey can have at most two co-traveling guides.
* Relationship-building hangouts with decisions and earned flags, rather than automatically assuming intimacy after sharing a walk.
* Dedicated selectable/collectible ensemble endings, group-specific epilogue art, and all four art-style lanes. Coordinate with the separately claimed t-042 art effort to avoid duplicate jobs.
* Device-width visual checks, real human-paced playtesting, and separate creative/publication gates.

This work is fictional and does not touch Wiyot/Tuluwat-held writing, portraits, gallery/exporting, or ArtJobs.
