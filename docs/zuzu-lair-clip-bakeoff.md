# Zuzu Lair clip comparison

Track fixed-prompt internal video renders across LTX and WAN. No public release.

## Next

Compare four fixed-prompt scenes.

## Controlled inputs

Keep the approved Arthemy Western Art v3.0 still checkpoint fixed. Select four existing, finished source images: opening walk, bridge action, a close-up acting beat from the music video, and the wide canyon exit. Record each ArtImage ID and its original motion prompt before rendering. No source IDs or completed clips have been verified in this pass.

## Comparison matrix

Run four fixed source images through these four lanes, preserving the exact source, prompt, negative prompt, seed, crop and output aspect per row:

| Lane | Selection | Role |
| --- | --- | --- |
| ltx-balanced | LTX-2.3 / ltx-12gb-balanced | Current half-resolution control |
| ltx-quality | LTX-2.3 / ltx-full-quality | Full-resolution quality control |
| wan-ti2v | WAN 2.2 TI2V 5B, 768x432, 4 s, 16 FPS | Consumer-card alternative |
| wan-a14b | WAN 2.2 I2V A14B, 768x432, 4 s, 16 FPS | Two-expert quality alternative |

The existing WAN builder supports an explicit mode, but the enqueue endpoint does not forward a per-request WAN mode. Without that addition, both WAN requests may use the same host default. Do not treat identical-default requests as separate models. Changing the host environment is outside this work.

## Review protocol

Render the 16 baseline cells only after recording four verified source ArtImage IDs. Hold each original motion prompt fixed across its row. Then take the best lane and render four additional clips with rewritten motion prompts: one physical action, one camera movement, clear starting and ending poses. This isolates model differences from prompt quality.

For every completed cell, record its ArtJob ID, model, mode, seed, prompt, dimensions, FPS, wall time and verified clip path. A queued job is not a delivered video. Rate each clip 1-5 for character identity, temporal stability, motion readability, camera discipline and overall visual quality. Include failures and VRAM pressure. Do not publish the sheet or any clips.

Present the completed comparison to Silas for a creative lane decision. Retest the still checkpoint (furrytoonmix V3B or Nova Comic) only if all motion lanes remain weak. This task is not complete until the clips and review exist.
