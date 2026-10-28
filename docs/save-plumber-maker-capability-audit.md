# Save the Plumber Maker: capability audit, 2026-10-27 PT

This is a feature-by-feature design comparison, **not** a claim of equivalence. A course author cares about expressiveness, reliability, iteration, audience, and feedback, not the raw number of palette icons.

## Shipped in the initial Maker implementation

- A private local library of up to 24 drafts, separate from the three campaign save slots.
- Save, load, edit, new, undo/redo, palette by category, grid placement by pointer/touch or keyboard, world/theme/darkness, author/title, share link and direct playable import.
- Strict validated, versioned course data with controlled dimensions and glyphs, one start, one exit, paired pipes; rejects malformed/oversized imports.
- Six grouped palettes covering **every parser glyph** in \`savePlumberLevels.ts\` through a regression test.
- The actual Save the Plumber platform engine plays imported levels (custom runs never write to campaign saves).
- Authenticated, database-backed 1–5-star ratings and optional written reviews after a clear, using the existing Reaction model and per-course revision identity. Signed-out players can read community averages and comments.
- Responsive bounded console presentation with compact icon-first tools and a large playable preview.
- One-click and exact course dimensions: width 32–96 tiles and height 16–48 tiles, extending right/skyward with ground continuity, loss-preventing trim checks, undo and portable share-code round trips.
- Rectangle painting, connected flood fill, select/copy/stamp and keyboard shortcuts, implemented as atomic validated undoable transactions. Unsafe pastes that erase the sole goal or create unpaired doors are rejected.
- Harbor, winter and skybridge course templates, all editable and playable in the actual platform engine. Winter adds breakable snowbanks, cracking thin ice, falling icicles and rolling snowballs as real hazards alongside traction-changing solid ice and snowfall. All mechanics round-trip through validated version-1 links.
- Giant versions of all 14 ordinary foes, selectable from a separate icon-first Giants category. These preserve the familiar enemy behavior, use doubled sprites and enlarged collision geometry, and resist their first normal stomp. They are distinct from eight existing world bosses.

The feature is an early Maker, not an equivalent to the two commercial editors. The Share URL contains the level itself, so no account or public upload is required and content is portable; it is long, cannot yet be searched centrally, and does not provide mutable hosted level records. A verified course snapshot is stored in the database on its first review, and subsequent edits start a fresh Reaction review identity.

## Space / air-propulsion Maker mode

- A Maker-only `space` flag in the v1 share payload enables a genuine inertia-led zero-gravity movement model. Arrows/WASD **aim the intended travel direction**, and holding C vents air **behind** the heroine to accelerate in that direction. Releasing C preserves momentum, while A/Space provides a measured brake. Steering without firing cannot accelerate you. The same rules apply to the on-screen touch controls, which include vertical aim.
- A Space starter called **Airlock Drift** provides floating asteroid blockers, collectible routes, a checkpoint, aerial foes and the `?` gravity-well obstacle with positional pull and a hazardous core. The Maker Cosmos palette exposes gravity wells alongside compatible asteroid blocks and phase bridges. Gravity wells and thrust operate in the same runtime used by playtests and portable share links.
- A seeded parallax starfield, distant nebula and directional air plume visibly distinguish the mode from existing World 8 art. This is an independently selectable **Maker environment**, not a ninth story world or a finished painted-space asset package. Existing campaign movement, draft IDs, save slots and legacy share code normalization remain unchanged.

## Water and winter truth-in-features

- **Tideglass Marina (World 2)** has a water-themed campaign with rafts, canal locks, minnows and crabs. The existing `w` glyph is lethal water, **not a swimming mechanic**; the new harbor starter is an above-water platforming challenge, not an underwater course.
- **Snow/Winter Maker courses** now include optional snowfall, slippery `f` ice, wrench-breakable `b` snowbanks, `d` thin ice that fractures after sustained weight, warning-and-drop `e` icicles and rolling `q` snowballs that can be stomped. The new Winter palette and starter demonstrate these through the actual game engine. This is not yet a dedicated ninth campaign world with a separately painted winter art pack or a swimming system.
- Visual effects and tile types stay within the existing game engine and share-link codec; the exact same level can be playtested, reloaded or linked elsewhere.

## Relative capability matrix

| Capability                               | Save the Plumber Maker (first pass)                                                                          | Super Mario Maker 1/2                | Geometry Dash 2.2                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ---------------------------------------------------- |
| Core tile placement and playable test    | Shipped                                                                                                      | Yes                                  | Yes                                                  |
| Categories and icon-first affordances    | Shipped                                                                                                      | Yes                                  | Yes                                                  |
| Multiple terrain/enemy/gadget types      | Shipped, engine-bound; 14 giant foe variants                                                                 | Broad, multiple game styles          | Huge editor object library                           |
| Native save/load/edit                    | Device-local drafts, dimensions adjustable by icon                                                           | Yes                                  | Yes                                                  |
| Share to another device                  | Portable URL payload                                                                                         | Hosted course IDs                    | Hosted level IDs                                     |
| Global library/search/discovery          | Not shipped                                                                                                  | Yes                                  | Yes                                                  |
| Online rating and creator identity       | Reaction stars/comments shared; level creator verification still missing                                     | Yes, hosted reactions/likes          | Yes, hosted ratings/likes                            |
| Multi-select, rectangle/fill, copy/paste | Rectangles, fill and rectangular select/copy/paste shipped; independent multi-select/group operations absent | Broad editing tools                  | Broad editing tools                                  |
| Course clear check before sharing        | Not enforced                                                                                                 | Yes, online upload gated by clear    | Validation and verification workflow differs         |
| Multi-area and vertical editing          | Parser pipe pairs work within one stage; subarea authoring absent                                            | Yes                                  | Large freeform editor                                |
| Slopes and shapeable terrain             | Not shipped                                                                                                  | Yes                                  | Many shapes and collision modes                      |
| Switch logic and advanced automation     | Fixed engine mechanics only                                                                                  | ON/OFF, conditions, contraptions     | Advanced triggers, groups, keyframes, camera/effects |
| Music synchronization and custom timing  | Not shipped                                                                                                  | No equivalent to GD's trigger editor | Defining capability                                  |
| Full Gen-2 campaign feature set          | Runtime and editor both in progress                                                                          | Not applicable                       | Not applicable                                       |

**Conclusion:** both Mario Maker generations are substantially deeper editing products, and Geometry Dash 2.2 is further ahead in programmable triggers, visual effects, object grouping and temporal control. What Save the Plumber does have is original hand-authored world mechanics and a single real-platformer engine shared with the Maker. Do not translate 50+ icons into "50+ independent systems."

## Rule for lockstep development

When the runtime adds an object or mechanism:

1. Extend \`savePlumberLevels.ts\` with the parser glyph or explicitly model a multi-parameter object.
2. Add its icon, name, category, accessibility label and contextual settings to the Maker palette.
3. Add schema-version migration and bounded validation where serialized data changes.
4. Test the new object's playable behavior, including reload, deep-link import, and campaign isolation.
5. Update this matrix with \`shipped\`, \`partial\` or \`absent\` after code and checks.

The \`STAGE_GLYPHS\` test enforces palette coverage for the first generation of single-character tiles. It **does not** prove that all runtime systems are editable: world-map progress, switches shared across stages, subareas, secret exits, animation, autosidescroll, gameplay triggers and advanced course settings require more than a glyph. The gap should be visible until those editor contracts exist.

## Next milestones

1. Authenticated publication, stable short share IDs, editing/versions/forks, verified creator ownership, tamper protection, play counts and discovery. Rating/comment storage now uses the existing Reaction table; distinguish that from missing hosted level publishing and moderation.
2. Real course clear-proof testing and fairness/softlock checks before publication; touch gamepad and full device-geometry audits.
3. Independent multi-select/grouping, cut/move, object properties and richer starter packs; subareas and vertical/secret exits, slopes, autoscroll, timed triggers. Single-area vertical sizing and three starter templates are now available.
4. Advanced original sequencing system inspired by Geometry Dash's _creative flexibility_, not its copied content: groups, timeline, triggers, preview scrubbing, cameras, player interactions, and a strong undo stack.
5. Re-audit against both Mario Maker generations and Geometry Dash after each substantial game mechanic expansion.

References for comparative feature claims: Nintendo's official Super Mario Maker 2 product documentation and official Geometry Dash 2.2 editor/update materials. Never copy third-party art, courses or editor branding.
