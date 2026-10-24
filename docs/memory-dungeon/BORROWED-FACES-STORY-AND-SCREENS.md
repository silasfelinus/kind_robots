# Memory Dungeon: Borrowed Faces, canonical story and screen contracts

**Status:** production-compatible design contract (2026-10-23 PT), reconciled with the user's adopted [Conductor sixteen-realm bible](https://github.com/silasfelinus/conductor/blob/main/projects/memory-dungeon/SIXTEEN-REALM-PRODUCTION.md) and [Briar Marches first-world registry](https://github.com/silasfelinus/conductor/blob/main/projects/memory-dungeon/BRIAR-MARCHES-FIRST-WORLD.md). **Source of truth:** existing executable `utils/memoryDungeon/scenes.ts` and `utils/memoryDungeonWorld.ts` for live scenes, saves, coordinates and routes; the new `utils/memoryDungeonStoryAtlas.ts` is an audit, **not** a competing scene engine. It distinguishes live encounters from planned ones and must not invent playable-completion claims.

## Core narrative

The protagonist is an **androgynous contemporary Earth data researcher**. Fey changeling **Morrow**, searching for a life without magic, has traded places with them. The protagonist wakes in Morrow's fantastical identity, remembers Earth, and explores fixed memories across sixteen dangerous Grimm-flavored realms. The 32 Earth-side photographic discoveries first reveal Morrow's failures, then genuine success, love and eventually **children**. There is no easy ending that erases either the protagonist's injustice or the real family Morrow has built. Returning, remaining, or negotiating must involve meaningful tradeoffs and informed consent. Earlier photo discoveries must not spoil the children unambiguously.

The recurring traveling companions are **Scylla** and **Charybdis ("Char")**, identical twin adult **mermaids**, originated in *Mermaids of Venice*. They have the same face, expression and sturdy working-farmer physiques despite different pigmentation caused by divergent magical waters. Scylla is poised and proper; Char is authentically goth with layered culture-specific styling, not just a dark costume. Both are friendly, witty instigators who delight in creating difficult adventures. **Master Oren Pike**, their permanently hooded, axe-carrying royal headsman, is the formidable logistician whose schedules, supply plans and quiet competence make their wild plans feasible. Never replace them with princes Halden/Vesper or a newly invented royal trauma/unmasking plot.

Recurring figures may include a morally complicated rogue and communities divided by folklore, debt, law, nature and self-determination, but must not displace the adopted characters or contradict scenes already merged.

**Tone:** darker Brothers Grimm, edgy, emotionally adult, exciting, playful and often surprising, informed by *Fables*, *Fable*, American McGee's *Alice*, and *She-Ra and the Princesses of Power*. Familiar stories invert in unexpected, earned ways. No trivialized suffering, lazy shock, predestined moral labels or mass-production of generic fantasy filler.

## One-screen console encounter stage

Each active overworld is an 8×8 **persistent geographical map**. The Briar Camp stage is World 1, not a disconnected 64-step storybook. Matching actual two-card illustrated artwork reveals tiles, while interacting with a revealed square invokes its authored scene, puzzle, merchant, fight, photograph or exit. Four cross-realm seals remain deliberately special, with fair visual clues and future partners; reveal waves still use 12 / 14 / 16 / 18 cards and do not randomly reroll landmarks.

**Visual hierarchy and exact layout requirement:**
- On desktop/tablet landscape, artwork and story text sit side by side. **Scene choices belong directly beneath the narrative text in the *same right-hand column***, not beneath the illustration spanning both columns. The image should retain the left column's maximum available height.
- On portrait phone, stack bounded panels intentionally; narrative and its decisions remain one contiguous, internally scrollable grouping. Do not create a document-style tall page or hide the last choice under the footer.
- Use delivered character, location, consequence and ending ArtImages through the existing ArtJob pipeline (`request → ArtJob → kr-relay → ArtImage → attach → delivery → verified URL`). A prompt draft or placeholder is not final art. Distinguish request, queued, rendered, attached and delivered states.
- Actual matched playing cards need **real generated card backs submitted to ArtJobs**, with a consistent primary dark-briar deck and optionally a rare moonlit variant. Do not ship assistant-generated static substitute assets as if they came from the Kind Robots art generator.
- Hidden/unexplored cells must be unambiguously distinct from **revealed but unvisited** and **visited but unfinished**; completed cells display a clear resolved state. Verify contrast in both thumbnail and 390px displays, with shape/border as well as color rather than barely differing shades.
- A full-screen title/intro, illustrated dialogue, and visible optional achievements/rewards support a console experience. Detailed how-to text belongs in a tutorial sidebar, not between playable choices.

## Canonical content coverage

`utils/memoryDungeonStoryAtlas.ts` exposes exactly 64 stable positions derived from the current `BRIAR_SCENES` and a 17-position *planned* registry, never a second 64-scene event executor. A location's planned presence is **not** a playable state. The map graph is already connected at all 64 coordinates; 47 scene records were merged prior to this PR. Runtime special interactions (sealed cross-world icons, chests, dungeon entrance, gates, puzzles) remain authoritative and must not be overwritten by an atlas.

For the remaining 17 positions, implement and test the specific interaction, distinguish story-choice and underlying puzzle completion, record changes in the Chronicle, and verify safe replay/resume. The House That Remembers is the upgraded narrative name for the current Rootbound Vault entrance, preserving existing `vault-1` / `vault-2` save identifiers during the expansion to 36 rooms.

## QA and delivery gates

- **Content:** exactly 64 positions; no duplicate coordinate or disconnected square, and both story and site-specific conditions required before a tile is "complete".
- **Choice consequence:** two genuinely different options for an authored scene, journaled once; player can't re-claim an item by revisiting.
- **Story:** no old-princes lore, no early Morrow-child spoilers, and distinguish canon from a proposed cameo.
- **Presentation:** verify choice placement and map-state contrast at 390px, 768px, 1440px plus landscape tablet, with no shell scrolling and visible keyboard focus.
- **Art:** ArtJob ID, provider, source image, final attached ArtImage URL and delivery check required before declaring a card back or illustrated story scene shipped.
- **Compatibility:** preserve Classic Match, the current 8×8 map coordinates, existing merchant/chest/puzzle/combat behaviors, save restoration, and existing gallery-selected art pool.

The older proposed Halden/Vesper prince narrative and independent 64-entry atlas were superseded by the adopted canon and currently merged game implementation. The useful *screen-first, image-led, branching-exploration* ideas remain here, without contradictory duplicate lore or unfinished systems misreported as features.
