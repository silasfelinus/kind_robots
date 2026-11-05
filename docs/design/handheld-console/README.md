# Handheld-console visual mockups

**Status:** original, image-led **design prototypes**, not live gameplay. Created for Silas's 2026-11-05 direction: Cthulhuquarium and The Ruler Is Hooked must read as authored handheld games, not web applications with a game theme.

These four 1600 × 900 SVG screens are intentionally art-first. They do not import live economy values, fake a playable feature, or replace existing delivered ArtJobs. They provide a pixel-specific composition for implementation and visual review.

| Game | Default play stage | Active interruption |
| --- | --- | --- |
| Cthulhuquarium | [Live eldritch tank](./cthulhuquarium-tank.svg) | [Feeding](./cthulhuquarium-feed.svg) |
| The Ruler Is Hooked | [Lake and fishing tension](./ruler-hooked-fishing.svg) | [Royal petition](./ruler-hooked-petition.svg) |

Open [preview.html](./preview.html) locally for an interactive full-window comparison. Switch titles and states without scrolling. GitHub can also preview each SVG directly.

## Art and interaction direction

### Cthulhuquarium

- **Stage is the game:** the aquarium glass owns ~80% of the visual attention. Swimming monsters, bubbles, ruins, floating coins and tap feedback remain on the living canvas, never replaced by a management grid.
- **One continuous world:** HUD is inset into the glass as diegetic metal and luminous gauges; food/clean/tap actions live around the tank, not in a side-by-side website form.
- **Compact five-room dock:** tank, feed, creatures, relics and market share one illustrative bottom deck. The card/room art should come from delivered plates, not Emoji in the final product. Prototype icons are stand-ins.
- **Progress reveal:** when a milestone occurs, dim the stage and introduce Charlotte/Wilbur with a full-height portrait and a single story beat. Never pile a tiny dialog over a scrolling panel.
- **Missing art:** maintain its image slot and use an authored illustration silhouette. The fish and backgrounds in this SVG are design-only placeholders, not production art.
- **Existing implementation mapping:** `components/cthulhuquarium/cthulhuquarium-game.vue` already owns tank canvas, coin drops, overlays and `cq-command-deck`. Its existing panels should become dedicated game-screen visual modes, not expand the document. Preserve persistence, feed economy, behavior and hit detection.

### The Ruler Is Hooked

- **The player lives at the lake:** one painted kingdom/environment composite remains visible through normal fishing. Huge royal decision moments get visually staged as story interludes rather than pages of buttons.
- **First-person point of view:** only the player character's arms, rod and hands are seen while fishing. The player's separate portrait belongs to the coronation/creator. The existing full-frame environment compositor remains the authoritative backdrop.
- **Fishing has readable physical feedback:** line tension, hook position and cast rhythm are felt in an overlay over the water. This is the presentation target for the current `RulerHookedFishingEncounter`, not a fabricated new fishing mechanic.
- **When the world intervenes:** a petitioner arrives within the game frame. Consequential alternatives become **illustrated outcome cards** using `kr-choice-hand`, with the kingdom still visible behind them. The two colored decision fields in the draft are composition placeholders until result plates are attached; do not implement them as bare buttons.
- **Five game-mode buttons, one site header:** lake, map, court, gear, Fishopedia are the in-game command dock. Preserve the Kind Robots `header-page-bar` and global OS controls outside the artwork.
- **Existing implementation mapping:** `components/ruler-hooked/ruler-hooked-game.vue` has the game states; `ruler-hooked-stage.vue` does layered environmental art; `RulerHookedFishingEncounter`, `RulerHookedAdvisor` and the choice hand provide mechanics and decisions. Keep saved runs and offline play unchanged.

## What must change before implementation is accepted

1. The illustrated **scene is the dominant element** at 390px portrait, 768px, 1024px landscape and 1440px, inside the existing Kind Robots shell. Never introduce a second global header or a new `100vh` page wrapper.
2. On a phone, the room dock compresses to icon-first input while the scene remains tappable; secondary rooms are separate full-stage modes with bounded internal scrolling. No nested page scrollbar.
3. Apply the supplied art when delivered, preserve aspect ratios and crop rules, and give missing assets a **full illustration-sized fallback**. Colorful boxes are not a final substitute for art.
4. At least one authored screen transition, press/release feedback, selection focus/keyboard navigation, touch-target check and reduced-motion still state per game.
5. Every petition/outcome choice uses art-forward **one-tap cards**, not a text form. Decisions affect actual kingdom state; the mockup must not imply outcomes unsupported by existing game logic.
6. Verify real rendered 390 / 768 / 1024 / 1440 viewports, including short-wide, and compare with these designs. Source-code assertions alone are not visual acceptance.

## The handoff

The screens are reviewable now, but they do **not** claim the runtime UI has been redesigned or that a self-hosted deployment contains the mockups. The aesthetic decision is intentionally a human approval step; only then should the live screens be rebuilt to follow the approved compositions. ArtJob creation/delivery and gameplay QA remain independent tracks.
