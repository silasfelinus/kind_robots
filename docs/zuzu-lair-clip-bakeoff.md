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
