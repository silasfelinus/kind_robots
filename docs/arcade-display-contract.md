# Arcade responsive display and performance contract

Status: **engineering baseline, not game-completion approval**. Tracks
[kind_robots #4062](https://github.com/silasfelinus/kind_robots/issues/4062);
continue to use Conductor's `projects/kr-arcade/GEN2-STANDARD.md` for gameplay,
animation, art delivery and campaign scope.

## Keep four budgets independent

1. **Logical simulation and hitboxes:** each game owns its fixed world coordinates,
   update rate (60 Hz), collisions and camera. Rendering quality, DPR and device
   orientation must not change hitboxes, speed or input timings.
2. **Art source:** sprite or painted frame dimensions, atlas animation poses, alpha
   silhouette and texture variants. An HD canvas with tiny nearest-neighbour source
   artwork does **not** count as higher-detail art.
3. **Backing store:** device pixels allocated to each canvas. `fitDisplay`
   caps HD at 3,240,000 pixels, or 2,073,600 pixels when the shared touch
   cabinet or Showdown uses the mobile limit. Pixel mode remains nearest-neighbour.
   Additional WebGL allocations and loaded textures must be measured separately.
4. **CSS footprint:** the playable stage after aspect fit, browser zoom, safe areas,
   camera scale and on-screen control overlays. It determines what a player can
   actually recognize and tap. `availableHeight` and `available` constrain stage
   bounds independently of DPR. Never stretch a 4:3 game into 16:9.

The common `480×270` long-form widescreen simulation is a **default**, not an
enforced migration; Ghost Trail's `320×240` 4:3 camera and Memory Dungeon's
square grid have their own field-of-view requirements.

## Testing surfaces

The Playwright fixture in `utils/scripts/verifyArcadeViewport.browser.test.mjs`
loads the **real** ArcadeCabinet and game modules with stubbed network stores.
It checks canvas bounds, overscroll in X, backing-store ceiling, browser errors,
and touch-control reachability in a documented phone/tablet/desktop matrix at
DPR 1, 2 and 3. The workflow saves PNGs for side-by-side review.

The script reports nominal CSS art-box extents (Plumber height and Rainbow
maximum ship width), not actual visible silhouettes. Physical device measurements,
per-game camera visibility and boss tell lead-time checks are still necessary.
Keyboard, gamepad, and touch-input behavior are tested separately; four active
seats on a tablet are **not** evidence that four people can comfortably share a
phone.

### Visual review gates

For each actual playable stage (not just a title screen), record:

- Pixel/HD source-art silhouette against its background, after the real
  camera fit. For 2D protagonists, begin visual review whenever the moving
  silhouette drops below **32 CSS px high**; revise camera/art framing if
  movement or pose cannot be read. Do not magnify collisions.
- Projectiles, pickups, interaction highlights and enemy windups at real speed.
  Measure their sizes and contrast **while overlapping effects and four ships**
  are on screen. Telegraph lead time and off-camera threats take precedence
  over a numeric pixel target.
- HUD at each gameplay viewport; essential text must remain readable and
  controls must not mask lives, hazards, boss warnings, or exits.
- Touch controls with at least **44×44 CSS px** target boxes where possible.
  Check safe-area margins, simultaneous pointers, pointercancel, rotation,
  pause and browser zoom. A physically cramped four-seat configuration must
  offer honest alternative inputs.
- The Memory Dungeon 8×8 square map and matching grids independently,
  including smallest reachable tile/card, keyboard focus and alternate
  pan/zoom/focus when tiles do not fit. Do not crop or silently hide cells.

Test geometry at 360×640, 390×844, 844×390, 768×1024, 1024×768,
1440×900, 1920×1080, DPR 1/2/3, and **200% browser zoom** as a
separate manual/browser automation case. Review short landscape with
on-screen controllers and account for system safe-area insets.

### Frame-time evidence (not yet collected)

For representative low/mid/high actual devices, benchmark an active level,
a boss or effects-heavy scene, and Rainbow with one and four pilots. Log
60-second runs of median and p95 animation-frame times, missed ticks,
loaded textures and backing-store megapixels, not just FPS averages. A
16.7 ms frame target at 60 Hz is aspirational, not an assertion that any
hardware will meet it. Ensure slow devices reduce **drawing quality** before
gameplay tick rate or collision semantics. Implement and test a quality
Auto/Pixel/HD selector after those measurements and an explicit hysteresis
design; current shipping choices are Pixel/HD.

## Scope inventory

| Surface          | What must be checked                                                          |
| ---------------- | ----------------------------------------------------------------------------- |
| Classic cabinets | Variable aspect ratios, bezels, CRT, portrait pinball, safe-area and controls |
| Save the Plumber | Heroine pose/silhouette, camera, vertical subareas and offscreen threats      |
| Rainbow Princess | Ship/bullet separation, four-seat readability, touch occlusion                |
| Ghost Trail      | 4:3 camera, character animation and landscape phone                           |
| Zuzu Showdown    | Fighter visibility through camera zoom, HUD, simultaneous touch inputs        |
| Memory Dungeon   | Square 8×8 tile reachability, independent match-board sizing and focus        |

**Do not close issue #4062** on the strength of the basic canvas fit, the
fixture or this document alone. Complete the gameplay and device audit and
record the fixes, screenshots, frame-time reports and human playtest outcomes
against the issue. This display work does not certify SMB3/SMW/N64-depth
content, which has independent Conductor roadmaps.
