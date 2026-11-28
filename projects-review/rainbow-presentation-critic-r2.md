# Rainbow Bullet Hell Space Princess: presentation critic, round 2

**Reviewer:** an independent critic session working blind. Lens: issue #4146 §6 (art), §7 (motion) and §8 (accessibility and devices). I changed no game code.
**Build reviewed:** `main` at `459343a2` (2026-11-28). Round 1 reviewed `4897c0c9`.
**Evidence:** `projects-review/rainbow-r2-shots/` (11 small JPEGs).

## Verdict up front

**Presentation is ready for human playtesting: yes.** There are no blockers. I found 4 majors and 6 minors, all fixable polish.

Most of round 1 is fixed:

- **Art:** the finale has its own card and backdrop, the Fever Dream detours are drawn as doodles, and the main Acts have sky, far and mid planes.
- **Motion:** 46 idle atlases ship, all 8 Acts have a living interlude, and the 6 endings move.
- **Layout:** in co-op on touch, the pads no longer cover the stage, and the HUD no longer covers the boss bar.
- **Phones and desktop:** an upright phone gets a large-type readout and a "turn sideways" prompt, and the desktop stage now uses the screen.

What remains is mostly **text colliding with text** on the canvas, plus one subtitle-legibility gap on upright phones.

## How I tested (rendered vs read)

**Rendered and observed (Chromium 1243, headless, DPR 1):**

1. **Campaign sweep in both looks.** I bundled the real engine (`createRainbowPrincessPreview`, attract-demo autopilot, authored waves) and the real `public/rainbow-princess-*` art, and drew it at 3× (1440×810). I stepped it through the whole campaign to THE END: Acts I–VIII, X3 and X4, the finale, the choice, the ending and the credits. That is 207,660 ticks per look. I captured 96 frames per look at every Act or stage change, every comms scene, and the first frame per stage with ≥16 hostile shots.
   - No page errors.
   - The only missing requests were 4 Fever-only atlas fallbacks (m6).
   - The demo route took X2, X3 and X4 and the rebel road. I did not render X1 or the loyal road.
2. **Extra renders.** I ran the same harness with 4 pilots (Fever and Classic), with bold shots (high contrast), and with bold shots plus calm motion.
3. **Device matrix.** I used the real `arcade-cabinet.vue` through `utils/scripts/arcadeCabinetFixture.mjs`, with the real arcade store and the art served. The cabinet was contained under a 56px stand-in header with the page's own CSS overrides: marquee hidden, and Rainbow's `max-width: none` inside a 1500px column. Sizes: 360×640, 390×844, 768×1024, 1024×768 and 844×390 on touch, and 1440×900 and 1920×1080 with a mouse. I took attract and in-flight measurements and screenshots.
   - This is the fixture, not the full Nuxt page.
   - Synthetic input is not physical-device evidence.
4. **Existing browser contracts, run as-is.** Both pass:
   - `verifyRainbowTouchLayout.browser.test.mjs`: 2P and 4P clear at 1024×768 and 844×390, upright readout, and the settings pop-over.
   - `verifyRainbowSettingsCabinet.browser.test.mjs`: key remap, Escape cancel, and the comms and contrast switches.
5. **Video and atlas analysis.** I measured frame differences with ffmpeg and PIL on all 8 interludes and 6 endings. On all 46 `doodle/anim/*-idle.webp` strips I measured centroid drift, area change, the seam step, and green matte-spill pixels, and composited the suspects on purple to look at them.

**Read only (not rendered):** the playback code for interludes and endings in `rainbowAnimation.ts`, the atlas registry in `rainbowGameArt.ts`, the opening component (it has a Skip button), and reduced-motion seeding in `arcade-cabinet.vue:2830`.

**Not covered:**

- Video playback inside the canvas: Playwright's Chromium has no H.264, so I judged the clips from the files.
- Audio by ear.
- Real devices, DPR 2 and 3.
- The X1 and loyal-road visuals.

## Findings

| id    | sev       | look    | viewport                          | Act / screen                                        | finding                                                                                                                                                                                                                                                                                                                                                                                                                 | reproduction                                                  | evidence                                                                       |
| ----- | --------- | ------- | --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| R2-01 | **major** | both    | all (it is drawn on the canvas)   | Act I, the whole Act, 1 pilot                       | **The HUD's button legend runs into the pilot status.** "…· Y EVADE" butts into "PETAL 3♥ 3◇ P1 …", reading **"Y EVADEPETAL"** on the second HUD row. It shows throughout the player's first Act, at every size.                                                                                                                                                                                                        | Start any 1-pilot flight and look at the top-right HUD.       | `fever-act1-hud-evade-petal-collision.jpg` (same in the Classic sweep)         |
| R2-02 | **major** | both    | all                               | Act V→VI transition, Act VII→X4, Act I→II           | **Banner collisions at segment changes.** The previous Act's "ACT V · GOLD MEDAL" draws on top of the allegiance confirmation "TURN ON THE EMPIRE", so both are unreadable, and that confirms the game's biggest story choice. "ACT VII · GOLD MEDAL" also overprints "X4 · MIRROR SHOAL". Medal and Act-start banners share one y-position with no queueing.                                                           | Demo sweep (rebel road), the Act VI opening and the X4 entry. | `fever-act6-card-banner-collision.jpg`, `fever-x4-opening-medal-collision.jpg` |
| R2-03 | **major** | both    | 360×640, 390×844 (touch, upright) | any comms scene                                     | **Subtitles are illegible on an upright phone.** The new readout shows Act, score, shoals and pilot status in large type, but comms (speaker and line) still render only on the canvas, at 0.72–0.79 CSS px per game px (about 5px text). On a phone held upright, the story is unreadable unless the player rotates. The prompt asks them to, so this is not a blocker.                                                | Real cabinet at 360×640, Start, Act I opening comms.          | `cabinet-360x640-1p-run.jpg`                                                   |
| R2-04 | **major** | both    | 3–4 pilots, any width             | in flight, clustered start, X2 seen                 | **Ship labels pile up in co-op.** Each ship's "SUPER READY · TAP B" caption and seat number overlap the other ships and each other ("SUPER RE… TAP B" ×4, a "2" on a hull). That is the area the players must watch for incoming pellets. Round 1's P-22 seat-tag collision persists, and the captions make it worse.                                                                                                   | 4 pilots, fly until super charges (about 30s).                | `fever-x2-4p-ship-labels-pile.jpg`                                             |
| R2-05 | minor     | both    | 844×390 (touch, landscape phone)  | in flight, **1 pilot**                              | **The d-pad and face buttons float over the stage edges:** about 70 CSS px on the left and about 45px over the lower-right enemy entry lane. The touch contract keeps this on purpose ("clearing them would cost a third of the stage"). I'm flagging it only because the brief asks for no pads over the stage. 2P and 4P are clear.                                                                                   | 844×390 touch, 1 seat, Start.                                 | `cabinet-844x390-1p-pads-on-stage.jpg`                                         |
| R2-06 | minor     | both    | all                               | Act IV phase 2+ (and B03 and B06 phase labels)      | **A boss name with a phase suffix draws inside the bar.** The cream "B04 DELPHION · LINK CORE OPEN" label sits on the pink fill, where "B04 DEL…" is about 1.3:1 contrast. In phase 1 the name sits below the bar, which reads fine.                                                                                                                                                                                    | Act IV boss, phase 2.                                         | `fever-act4-bossbar-label-on-fill.jpg`                                         |
| R2-07 | minor     | Classic | all                               | everywhere                                          | **Classic has no frame animation at all.** Idle atlases, interludes and ending clips are Fever-only by design. Classic is the fully still look, every boss a sticker on a code bob. That is acceptable for a "classic" mode, but a playtester who prefers Classic sees a static game. The ending plates also have no Classic version, so Classic ends on the doodle plate (a style switch at the last screen).          | Classic, any boss; the ending.                                | `classic-ending-uses-doodle-plate.jpg`                                         |
| R2-08 | minor     | Fever   | all                               | co-op ships; bosses                                 | **The motion is patchy.** Only 1 of 4 player ships animates (`ships/halo-fin`), so in co-op the Halo Fin bobs on its loop beside three stills. Boss phases are 15 of 27 animated (plus the flagship): B02 and B09 have none, and B04 and B07 have phase 2 only. This is known and partly deliberate (the three-take rule). The ships are the most visible gap.                                                          | 2+ pilots.                                                    | registry `rainbowGameArt.ts:116`                                               |
| R2-09 | minor     | Fever   | all                               | Act cards, endings                                  | **Some clips barely move.** Interludes s01, s03, s07 and s08 have a median step of 0.3–0.5 luma and only 1–5% of pixels change by >25 from first to middle frame. The loyal-restore ending changes 0.3% of pixels (sever-open 3%). They play once, 200 game px wide, for about 3s, so they read as stills. s02, s04 and s06 and the loyal-sever ending move well. I found no loop seam, because the clips are one-shot. | ffmpeg frame difference (method above).                       | —                                                                              |
| R2-10 | minor     | Fever   | all                               | Acts I, II, IV (hammerhead, coral, courier enemies) | **Green matte remnant in the atlases.** `hammerhead-idle` has a bright green fleck on its tail that blinks across frames (174 green pixels). `coral` (87) and `courier` (107) have smaller specks. `hammerhead` also drifts 10–13% of its cell between frames, so it jitters slightly.                                                                                                                                  | Contact strip of `doodle/anim/hammerhead-idle.webp`.          | `atlas-hammerhead-green-matte.jpg`                                             |

Minor housekeeping (m6, not tabled): when a Fever-only atlas is still loading, `loadedArt` (`rainbowGameArt.ts:94`) also requests the Classic path. That 404s once per atlas (`/rainbow-princess-art/anim/{picket,anchor,urchin,lantern}-idle.webp`) and puts noise in the console. Separately, the comment in `RAINBOW_ENEMY_ATLASES` says coral was "rejected (near-static)", but `enemies/coral` ships in `RAINBOW_IDLE_ATLASES`. One of the two is stale.

## Checked and found fine (observed)

- **Art coverage:** painted art throughout both looks, with no missing images in about 200k ticks per look.
  - The finale now has its own card (crown and heart) and its own backdrop (stained glass over crystals), which fixes round 1's P-07.
  - Fever X3 and X4 use doodle planes (P-14).
  - The at contact-sheet scale I saw no Classic ambient bubbles that could pass for bullets (P-10; not measured).
  - Act V's cranes are painted silhouettes rather than debug outlines (P-13).
- **Hostile readability:** the dark-cored, white-rimmed pellets read on every main-Act backdrop in both looks. **Bold shots** adds a heavy white ring and is excellent (`fever-act3-bold-shots.jpg`). Calm plus bold works in Classic.
- **4-pilot touch and boss bar:** the HUD stacks two columns above the bar, and no pad sits on the stage at 1024×768 (`cabinet-1024x768-4p-touch-fixture.jpg`, from the contract's art-less fixture). Round 1's P-05, P-06 and P-08 are fixed.
- **Device matrix (fixture cabinet):** no page scroll and no horizontal overflow at all 7 sizes, and no control off-screen. The smallest DOM text is 12px. Stage size (share of viewport, in flight):

  | size      | stage    | share of viewport                              |
  | --------- | -------- | ---------------------------------------------- |
  | 360×640   | 347×195  | 29%, with a readout and rotate prompt below it |
  | 390×844   | 377×212  | 24%, with a readout and rotate prompt below it |
  | 768×1024  | 755×425  | 41%                                            |
  | 1024×768  | 965×543  | 67%                                            |
  | 844×390   | 670×377  | 77%                                            |
  | 1440×900  | 1296×729 | 73%                                            |
  | 1920×1080 | 1470×827 | 59% (round 1 measured 994×559, P-16)           |

  The short-landscape title screen fits its settings pop-over (contract: title 341×192).

- **Accessibility:** a reduced-motion OS setting seeds calm motion. Key remap, comms FULL/ESSENTIAL/STORY, high contrast, volume, sound and CRT are all on the cabinet, and the settings contract passes. Comms always show speaker, portrait and subtitle text, and choices are subtitled. The opening has a "Skip to the flight" button and a still-poster fallback, and the credits can be skipped with A.
- **Motion that works:** the boss atlases for B05, B06 and B08 and the guardian loops have real subject motion with clean mattes. The skate's wingbeat and the pearl warden's flap read as alive. Most strips have under 3% centroid drift. Halo Fin's 18% vertical drift is a deliberate bob.

## One-line verdict

**Yes, ready for human playtesting.** Every Act, boss, scene and ending is painted, the hostile shots are readable in both looks, the layout is clean at all 7 sizes, and the accessibility switches are in place. The remaining issues are overlapping on-canvas text (R2-01, R2-02 and R2-04) and phone-upright subtitles (R2-03), which playtesters will notice but which do not stop a session.
