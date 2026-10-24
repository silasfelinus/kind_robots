# Memory Dungeon: 16-realm production and first-world review loop

**Contract:** The existing `/play/memory` experience remains the console, Classic Match remains available, and the 8×8 Briar geography and stable saved location IDs are preserved. World One is the vertical slice for all sixteen realms, not an excuse to show a developer dashboard.

## World One evidence, 2026-10-24 PT

- **Implemented in source:** 64 authored Briar sites with persistent decisions and a linked traversable map; four progressive matching waves revealing 12, 14, 16, then 18 tiles; four separately reserved cross-world seals; a 36-room House That Remembers with alternate Warden outcomes; two fixed Earth-side chronological photographs; auto-restored local expedition save; a first version of the modern-world Morrow prologue; tactical matching combat; Classic Match.
- **Authored production work in this change:** a deterministic art manifest covering each Briar site, each House room, major choices, portraits, monster paintings, screen backgrounds, cinematic transitions, two playing-card backs, and the 32-image first-realm collection.
- **Not yet delivered:** Comfy ArtJobs, attached verified ArtImages, final in-game portraits, full scene-image substitution, cinematic second-realm transition, multi-slot save/load, console-quality phone/tablet/desktop visual proof, and quantitative adversarial full-run acceptance. An image path, script or art prompt is not a rendered asset.
- **No new image path is considered live art until its durable ArtJob ID, final storage URL and public or authorized image fetch have been verified.** The gallery selector remains locked until all 32 original image URLs return images. Undelivered card-back art uses styled fallbacks.

## Thirty-plus-two card-deck gate

Every realm must _earn_ its deck through authored story. Exactly 30 unique images represent local characters, locations, events, creatures and artifacts. Exactly two additional collectible images are specific collaborations or mystery links between realms. Thirty faces provide the 6 + 7 + 8 + 9 map-reveal pairs, and two collaborations exist outside those normal reveal waves. They do not overwrite any of the four separately reserved cross-map seal coordinates.

The initial 32 subjects live in `utils/memoryDungeon/realmGallery.ts`. The manifest points to one traceable Comfy delivery destination per card. Completing a realm records an enduring unlock separately from the current expedition. The deck becomes selectable for later runs **only after image delivery passes**, otherwise the Enchanted Deck remains safe to play. Maintain one `RealmGalleryCard` registry per additional realm and run the same 30/2, uniqueness, authored-scene and deliverability checks on it.

Avoid 30 generic icons that could belong in any world: at least four recognizably voiced characters, four distinctive places, four event beats, two antagonists, two plot-specific artifacts and a visual evolution from opening to climax. The remaining subjects should come from the actual authored content, not quotas populated with interchangeable creatures.

## Distinctive realms without sixteen bespoke engines

For each realm, establish a **mechanical verb**, a **moral tension**, a **visual grammar**, and a **return consequence**. Those must change what the player does or believes, not just rename the tiles. Shared mechanics supply navigation, memory combat, card collecting, inventory, dialogue, save, Chronicle and accessibility.

1. Author the one-sentence dramatic question and three characters with incompatible but defensible needs.
2. Choose 30 collectible illustrations _first_, each attached to a scene or event. If the deck cannot justify 30, the world is narratively underdeveloped.
3. Write 64 nonduplicate map coordinates: recognizable landmarks stay fixed; interactions produce a discovery, trade, risk, altered relationship or consequential choice; no empty clicks.
4. Build a reachable 36-room dungeon with shortcuts, noncombat choices and at least three materially distinct guardian resolutions.
5. Add the two collaborative cards and two chronological Morrow photographs; preserve cross-realm promise without prematurely revealing later revelations.
6. Implement using shared reducers and saved IDs; run deterministic test seeds plus actual rendered viewport inspection before commissioning all expensive variants.
7. Queue concept/portrait/monster/background/card-back/composition ArtJobs in small named batches. Attach, fetch and verify, then expand to choice consequence artworks and animation transitions.
8. After each complete run, conduct adversarial simulated-player reviews and real UI critique. Improve the weakest surprise, agency and reward moments before duplicating the template for Realm Two.

## Consequence economy: meaningful, not exponential

Local choices retain their raw record in the realm's own saved state, but **only selected facts propagate globally**:

- One **resolution** per realm: e.g., whom the House serves after the Warden.
- Up to two **relationships**: trust, grievance or debt recorded on a bounded scale.
- One **portable discovery**: a clue or technique relevant to a named later encounter.
- One **cross-realm collaboration** or card-pairing milestone.

Scenes in future realms query these facts through a central condition interpreter, not hard-code every combination of earlier branches. When a remembered action matters, offer an altered approach, changed character reaction, accessible shortcut or variant ending paragraph. Never make a single ancient flag silently block the main route. Retire exhausted debts with a visible payoff rather than forever branching every later scene.

These are **design budgets, not hardcoded limits on player choices**. Retain all history in the Chronicle, but use a small, legible subset of live consequences. Test the player who made generous, selfish, inconsistent and deliberately unusual decisions: each should get specific responses without multiplying the entire authored world by all earlier permutations.

## Art pipeline and scope

The manifest is a reproducible **brief registry** only. It is not an ArtJob queue. To deliver: choose a batch, call the existing authenticated `POST /api/art/enqueue` for each prompt with Comfy engine, entity and target metadata, store immutable job IDs in the delivery ledger, poll the backend until rendered, attach ArtImages to their intended scene or card, and verify the final URLs. Failed jobs remain retryable; never replace a failed job with an unexplained duplicate. Keep any temporary backgrounds/illustrative CSS honest and visually strong while waiting.

A good animation handoff preserves the storyboard shot and identity: still establishing frame first, short motion treatment second, responsive static version always. For the initial forest reveal animate paired fog islands; for the next realm the Thorn Gate opens into a visible new visual grammar. Honor reduced-motion settings and never make a cutscene the only way to learn critical clues.

## Adversarial playtesting, with pass criteria

Run deterministic seed portfolios and manually played journeys as these personas:

| Player                      | Failure to hunt                                                  |
| --------------------------- | ---------------------------------------------------------------- |
| First-time phone player     | Confusing map-vs-match transitions or unreachable tap targets    |
| Quick story reader          | Too much matching before first important choice                  |
| Completionist               | Unreachable tile, duplicate reward, missing last location        |
| Contrarian                  | Refusing fights or assistance creates a softlock                 |
| Strategic matcher           | Combat patterns/telegraphs provide no useful tactical difference |
| Repeated-run player         | Restarts erase card unlocks or make decisions uninteresting      |
| Save interrupter            | Refresh mid-card, mid-conversation or mid-boss corrupts state    |
| Accessibility player        | Color-only clues, hidden focus, inaccessible final choice        |
| Morally inconsistent player | All branches produce identical dialogue and rewards              |
| Skeptical critic            | A world seems to be 64 filler cards and a plot-shaped checklist  |

For every build, record steps, exact state/seed, visible consequence, reproduction and severity. Validate graph reachability, once-only rewards, save round-trips, no missing cards, no duplicate/gallery asset identities, optional encounters, no involuntary resets, and preservation of Classic mode. Rate **narrative agency, visual hierarchy, readability, pacing, surprise, reward satisfaction and replay distinction** from 1–5 against cited scene examples. A mock review is exploratory feedback, not evidence of a real player playtest.

**Vertical-slice acceptance:** an ordinary player can enter from the single-screen illustrated intro, discover the first 64 locations through four visible matching sequences, interact with distinct sites, complete the House through an earned resolution, return and save, see a satisfying transition and collected card-gallery rewards, choose a painted card back, and restart without losing their unlocked gallery. All art deliveries and the rendered phone/tablet/desktop checks must be documented individually. This gate is **not met** by source contract tests alone.
