# Space Couch: Couchscope question-art delivery contract

The captain's four-question Couchscope is a **four-plate illustration sequence**. The code-drawn SVGs committed with this screen are original, scene-specific **fallbacks**, not proof that production ArtJobs exist or have rendered. They must remain until genuine final URLs have been verified.

## Delivery and naming

- Original painted canvas: **1536 × 1152 (4:3)** for each question, with the principal subject in the right-central 55% and safe crop for phone/tablet.
- Four final export keys: `couchscope/question-01`, `couchscope/question-02`, `couchscope/question-03`, `couchscope/question-04`, delivered as `public/game-of-captains/couchscope/question-XX.webp`.
- Runtime reads `warpArt('couchscope/question-XX')` from generated `utils/gameOfCaptains/artManifest.ts`, then falls back to the corresponding `question-XX.svg`. **Do not hand-add a WebP to the manifest before export.**
- ArtJob path: durable queue via `POST /api/art/enqueue` or project ArtJob handoff; render first with Krea2 for character/composition accuracy, optional Arthemy style pass. Preserve exact ArtJob ID, output ArtImage ID, engine, seed, final URL, crop, delivery and review.
- Current verification (2026-10-27 PT): four illustrated SVG fallbacks committed; **no matched question-specific ArtJob IDs, rendered WebPs or delivery URLs verified in this session**. Remaining painted delivery belongs to game-of-captains art t-008 and the master issue #4182.

## Original illustrated scenes

| Key         | Unique narrative image prompt                                                                                                                                                                                                          | Essential visual checks                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| question-01 | A luminous protesting crescent moon negotiating with a weary golden sunrise over an absurdly long red sofa sailing in open space, pearly starlight, dramatic warm-versus-cool rim light                                                | Both astronomical characters readable, sun not an explosion, no ordinary ship |
| question-02 | A passenger aboard a crimson couch confronts a visibly older version of themself emerging from a blue-violet time aperture, a tiny hourglass caught in its gravity, comic tension without typography                                   | Clearly two versions, singular portal, protected couch in vacuum              |
| question-03 | Planet-sized lost-and-found warehouse-world covered with abandoned luggage, a floating royal crown stamped with an implicit warning through design rather than legible words, tiny redshirt scavengers returning to the long red couch | Scale difference obvious, crown and lost objects individually recognizable    |
| question-04 | A small radiant miracle emerging from an outstretched hand while an enormous curling invoice unspools through the stars behind the red sofa, celestial finance as cosmic comedy                                                        | Miracle and invoice both legible, receipt not a flat webpage                  |

Across all four: original comic space opera, luxe theatrical lighting, generous right-panel composition, the same long upholstered red couch and near-invisible refraction bubble, no speech balloons/embedded words/ordinary starship. Each image must look like its question, not four variants of the generic constellation graphic.

## Quality gate

For every numbered question, check actual delivered 200 image URL, visual subject correctness, light/dark contrast behind the left-pane text, 390/768/1440px console widths, 720px-high viewport, keyboard focus and fixed-shell overflow. If a painted image is unavailable, keep the unique SVG. Painting generation is **not completed** by this PR.
