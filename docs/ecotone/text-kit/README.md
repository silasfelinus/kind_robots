# Ecotone: complete writing and art-concept inventory (editorial draft)

**Scope:** All 120 Conductor regional seed IDs have an authored playable EncounterCard, an opening dilemma, an independent investigation with written pass/miss text, and a separate care/community choice. All seven opening lenses have selectable choices; the 56 primary companion×lens×fate signature slots are text-backed, with the existing additional solo and Wild Way endings maintained in the 84-slot gallery.

**Review gate:** This is a full **first manuscript**, not the director-approved artistic vision. Nothing here authorizes ArtJobs, image rendering, publication, new unverified historical claims or mandatory outcomes tied to substances. Additional cultural/historical review, line editing, saved-ID migration checks and final seeded play testing remain needed.

## Six regional volumes

- [Chapter 1: Arcata after hours](chapter-01.md), 17 newly completed regional cards, plus 3 earlier canonical cards
- [Chapter 2: Coast of improbable tides](chapter-02.md), 17 newly completed regional cards, plus 3 earlier canonical cards
- [Chapter 3: Eureka and the bay](chapter-03.md), 18 newly completed regional cards, plus 2 earlier canonical cards
- [Chapter 4: Backroads and bad reception](chapter-04.md), 19 newly completed regional cards, plus 1 earlier canonical card
- [Chapter 5: Southern Humboldt and older roads](chapter-05.md), 20 newly completed regional cards
- [Chapter 6: The impossible festival](chapter-06.md), 20 newly completed regional cards

The detailed canonical 120-seed metadata lives in `utils/ecotone/regionalPremises.json`. Earlier authored encounters and fixed route beats live in `utils/ecotone/content.ts`, `utils/ecotone/questExpansion.ts` and `utils/ecotone/story.ts`. The three standalone lens-specific bonus quests use `LX-*` IDs so the regional `WH-*` keys retain their original seed meanings. The historical WH-121+ side cards remain separate.

## What an art pitch contains

The source of truth is `utils/ecotone/conceptArtPitches.ts` rather than a fixed aesthetic prompt. Each pitch has a stable key, source scene and place, the actual narrative action, evidence that must be visible, things it must not falsely imply, the exact choice/result flags that authorize it, draft alt text and status `editorial-draft`.

Per quest, the proposed image inventory is:

1. **Opening illustration** (`cards/wh-001`), the initial dilemma with no victory spoiled.
2. **Narrative paragraph illustrations** (`paragraphs/wh-001/2`, and further indexes if authored), including a distinct escalation before the choice.
3. **Every actual result** (`outcomes/wh-001/investigate-success`, `investigate-failure`, `care-success`), a separate brief for each outcome that can appear.
4. **Conditional future callback images** where a recorded choice materially affected the later county (`callbacks/wh-114/care`, for example), and only when the flag was earned.
5. **Ending art** for every currently represented ending ID (`endings/lead-lens-fate`) plus provisional one-, ten- and thirty-year frames (`epilogues/lead-lens-fate/{one-year,ten-year,thirty-year}`).

The dedicated styler decides character treatment, medium, visual language, camera and final composition. This writer only specifies **what must be depicted** and **what may not be invented**. No art or badges are queued.

## Endings and the consequential middle

- `utils/ecotone/journeySignatures.ts`: expanded 32 existing primary companion signature paragraphs for the four original openings.
- `utils/ecotone/finaleExpansion.ts`: prior 24 new companion signatures for cocaine/meth/MDMA plus solo/Wild Way variants, 1-year and 30-year companion bookends and existing earned companion callbacks.
- `utils/ecotone/regionalCallbacks.ts`: 20 additional carefully flagged, authored regional consequence callbacks. The finale shows a maximum of two, never claims a choice from an unplayed card, and never adds a collectible ending for a callback.
- `utils/ecotone/artSlots.ts`: deterministic asset-key contract, which stays compatible with the new art-brief keys for actual card and choice assets.

Hope and bittersweet outcomes remain possible regardless of opening lens. The cast's history is stable: Kit is Hmong American, Mara controls her own art and voice, and Cedar's logger father and former Luna ground-support mother remain married in every future. Real history is not rewritten by an imaginary supernatural plot.

## Remaining editorial and engineering review

This first manuscript establishes **coverage**, not yet a final creative sign-off. Writers and reviewers should next strengthen the most pivotal long scenes, check six-chapter itinerary consistency, verify each of the seven openings can reach each of the four final companions and both fate values under legitimate choices, and assess visual continuity and cultural specificity. Past-save aliases for the previous bonus IDs `WH-004`, `WH-037` and `WH-058` require migration review before shipping. Newly added chapter pools must be playtested for the planned 45–75-minute pacing; all 120 cards are candidate encounters, not 120 cards in one run.

The six chapter documents are easy-to-read working copies of the in-repo JSON manuscripts. Update the structured source when editing the game; refresh the Markdown export afterward to avoid drift.
