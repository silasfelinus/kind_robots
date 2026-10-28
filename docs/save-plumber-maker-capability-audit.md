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
- One-click course dimensions: width 32–96 tiles and height 16–48 tiles, extending right/skyward with ground continuity, loss-preventing trim checks, undo and portable share-code round trips.
- Giant versions of all 14 ordinary foes, selectable from a separate icon-first Giants category. These preserve the familiar enemy behavior, use doubled sprites and enlarged collision geometry, and resist their first normal stomp. They are distinct from eight existing world bosses.

The feature is an early Maker, not an equivalent to the two commercial editors. The Share URL contains the level itself, so no account or public upload is required and content is portable; it is long, cannot yet be searched centrally, and does not provide mutable hosted level records. A verified course snapshot is stored in the database on its first review, and subsequent edits start a fresh Reaction review identity.

## Relative capability matrix

| Capability                               | Save the Plumber Maker (first pass)                                      | Super Mario Maker 1/2                | Geometry Dash 2.2                                    |
| ---------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------ | ---------------------------------------------------- |
| Core tile placement and playable test    | Shipped                                                                  | Yes                                  | Yes                                                  |
| Categories and icon-first affordances    | Shipped                                                                  | Yes                                  | Yes                                                  |
| Multiple terrain/enemy/gadget types      | Shipped, engine-bound; 14 giant foe variants                                                    | Broad, multiple game styles          | Huge editor object library                           |
| Native save/load/edit                    | Device-local drafts, dimensions adjustable by icon                                                      | Yes                                  | Yes                                                  |
| Share to another device                  | Portable URL payload                                                     | Hosted course IDs                    | Hosted level IDs                                     |
| Global library/search/discovery          | Not shipped                                                              | Yes                                  | Yes                                                  |
| Online rating and creator identity       | Reaction stars/comments shared; level creator verification still missing | Yes, hosted reactions/likes          | Yes, hosted ratings/likes                            |
| Multi-select, rectangle/fill, copy/paste | Not shipped                                                              | Broad editing tools                  | Broad editing tools                                  |
| Course clear check before sharing        | Not enforced                                                             | Yes, online upload gated by clear    | Validation and verification workflow differs         |
| Multi-area and vertical editing          | Parser pipe pairs work within one stage; subarea authoring absent        | Yes                                  | Large freeform editor                                |
| Slopes and shapeable terrain             | Not shipped                                                              | Yes                                  | Many shapes and collision modes                      |
| Switch logic and advanced automation     | Fixed engine mechanics only                                              | ON/OFF, conditions, contraptions     | Advanced triggers, groups, keyframes, camera/effects |
| Music synchronization and custom timing  | Not shipped                                                              | No equivalent to GD's trigger editor | Defining capability                                  |
| Full Gen-2 campaign feature set          | Runtime and editor both in progress                                      | Not applicable                       | Not applicable                                       |

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
3. Rectangle/fill/selection/copy/paste, multi-select, contextual properties and templates; subareas and vertical/secret exits, slopes, autoscroll, timed triggers. Single-area vertical sizing is now available.
4. Advanced original sequencing system inspired by Geometry Dash's _creative flexibility_, not its copied content: groups, timeline, triggers, preview scrubbing, cameras, player interactions, and a strong undo stack.
5. Re-audit against both Mario Maker generations and Geometry Dash after each substantial game mechanic expansion.

References for comparative feature claims: Nintendo's official Super Mario Maker 2 product documentation and official Geometry Dash 2.2 editor/update materials. Never copy third-party art, courses or editor branding.
