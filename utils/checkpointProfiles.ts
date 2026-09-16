// /utils/checkpointProfiles.ts
//
// Sampler settings per checkpoint FAMILY, and the clip skip each family was
// trained to expect.
//
// This replaces a two-way split (standard vs distilled) that treated Pony,
// Illustrious, SD 1.5 and plain SDXL as one thing. They are not one thing:
// Pony V6 and the Illustrious/NoobAI line are trained against the second-to-last
// CLIP layer, and the SD 1.5 anime lineage the same, while plain SDXL is not.
// Nothing in this repo emitted CLIPSetLastLayer at all, so every SD-lineage
// render ran at clip skip 1 -- subtly off-model for ~1,470 of the 2,078 queued
// LoRA probes, in a way that looks like a mediocre LoRA rather than a
// mis-configured base.
//
// FAMILY IS READ FROM THE DIRECTORY, never from Resource.generation. The
// catalog is wrong often enough to matter: duchaitenStylelikeme_v15 is an
// SD 1.5 model recorded as `SDXL`, and revAnimated_v2Rebirth is recorded as
// `ARCHIVE`. The path they live under is maintained by the importer and has
// been right every time it has been checked.

export type CheckpointFamily =
  | 'pony'
  | 'illustrious'
  | 'sdxl'
  | 'sd15'
  | 'distilled'

export type CheckpointProfile = {
  steps: number
  cfg: number
  sampler: string
  scheduler: string
  /** ComfyUI CLIPSetLastLayer stop_at_clip_layer, i.e. -1 or -2. */
  clipSkip: -1 | -2
  /** Native training resolution; probes below this duplicate subjects. */
  width: number
  height: number
}

/*
 * Distilled first: a Turbo/Lightning/LCM/Hyper merge of ANY family converges in
 * a handful of steps at very low guidance, and that property overrides whatever
 * its base lineage would otherwise want.
 */
const DISTILLED_PATTERN = /(turbo|lightning|lcm|hyper)/i

/*
 * STEPS ARE 20, NOT 28, AND THAT IS MEASURED.
 *
 * 28 was convention. Swept 20/24/28 against both a character and a style LoRA
 * on realcartoonPony at fixed cfg 7 (2026-09-16), edge detail per series:
 *
 *   dpmpp_2m/karras  char   19.91 (20)  19.30 (24)  19.06 (28)
 *   dpmpp_2m/karras  style  23.87 (20)  23.02 (24)  23.97 (28)
 *   euler/normal     char   19.10 (20)  18.55 (24)  18.23 (28)
 *   euler/normal     style  20.29 (20)  19.75 (24)  19.10 (28)
 *
 * Detail DECLINES with more steps on three of four series and is flat on the
 * fourth. 28 steps buys nothing and costs 40% more relay time -- roughly nine
 * hours across the preview batch.
 *
 * The sampler in the same sweep is not a wash: dpmpp_2m/karras beats
 * euler/normal at 20 steps on both subjects, by 4% on the character LoRA and
 * 18% on the style one. The best configuration here is also the fastest.
 */
export const CHECKPOINT_PROFILES: Record<CheckpointFamily, CheckpointProfile> = {
  // PROVISIONAL: never swept. Distilled merges converge in a few steps at very
  // low guidance, so the standard families' result does NOT transfer -- their
  // usable band is roughly 1-4 rather than 3-13.
  distilled: {
    steps: 8,
    cfg: 2,
    sampler: 'dpmpp_sde',
    scheduler: 'karras',
    clipSkip: -1,
    width: 1024,
    height: 1024,
  },
  /*
   * MEASURED, 2026-09-16, and the only family here that is. Swept cfg 3->13 on
   * realcartoonPony_v1 against a character LoRA (AsheLoLXL) and a style LoRA
   * (ArtgermLycoXL), same seed per strip:
   *
   *   cfg      3     7     9    10    11    13
   *   detail  15.9  19.1  20.7  20.9  21.9  22.6
   *   clipped 0.11% 2.03% 3.43% 3.48% 4.87% 5.39%
   *
   * Detail climbs the whole way, so "best looking single image" keeps pointing
   * higher; clipping climbs with it, and by 13 one pixel in eighteen is crushed
   * to black or blown to white, with the render flattening into poster-like
   * linework. 10 is the efficient point -- it costs essentially the same
   * clipping as 9 while 11 raises it another 40%.
   *
   * The obvious worry was that high guidance would homogenise the previews, the
   * scaffold's score_9 stack drowning out the LoRA. Tested and false: four
   * distinct Pony LoRAs at cfg 13 were 14% further apart than at cfg 7, and
   * still +4.3% after normalising each image's contrast away, so the separation
   * is structural rather than an artifact of everything getting punchier.
   *
   * Conventional Pony guidance is 5-7. It is wrong here, which is the reason
   * every other family below is labelled provisional rather than assumed.
   */
  pony: {
    steps: 20,
    cfg: 10,
    sampler: 'dpmpp_2m',
    scheduler: 'karras',
    clipSkip: -2,
    width: 1024,
    height: 1024,
  },
  // PROVISIONAL: cfg never swept. Its one A/B pair only established that clip
  // skip 1 returns a frame of pure black on this family (ArtJob 26132).
  illustrious: {
    steps: 20,
    cfg: 5,
    sampler: 'euler_ancestral',
    scheduler: 'normal',
    clipSkip: -2,
    width: 1024,
    height: 1024,
  },
  // PROVISIONAL: a single pair, cfg 6 over cfg 3, judged by eye. Not swept.
  sdxl: {
    steps: 20,
    cfg: 6,
    sampler: 'dpmpp_2m',
    scheduler: 'karras',
    clipSkip: -1,
    width: 1024,
    height: 1024,
  },
  /*
   * 768, not 1024: SD 1.5 was trained at 512 and degrades into duplicated
   * subjects and stretched anatomy well before 1024, which reads in a triage
   * grid as a bad LoRA when it is a bad resolution.
   */
  sd15: {
    // PROVISIONAL: a single pair, cfg 7 over cfg 3, judged by eye. Not swept.
    steps: 20,
    cfg: 7,
    sampler: 'dpmpp_2m',
    scheduler: 'karras',
    clipSkip: -2,
    width: 768,
    height: 768,
  },
}

export function checkpointFamily(path?: string | null): CheckpointFamily {
  const value = String(path || '')
  if (DISTILLED_PATTERN.test(value)) return 'distilled'

  const dir = value.split('/')[0]?.toLowerCase() ?? ''
  if (dir === 'pony') return 'pony'
  if (dir === 'illustrious') return 'illustrious'
  if (dir === 'sd15' || dir === 'sd1.5') return 'sd15'
  return 'sdxl'
}

export function checkpointProfile(path?: string | null): CheckpointProfile {
  return CHECKPOINT_PROFILES[checkpointFamily(path)]
}
