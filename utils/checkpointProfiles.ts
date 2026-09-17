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
  /*
   * MEASURED. Swept cfg 1-4 on dreamshaperXL Turbo; peak usable detail 11.24 at
   * cfg 2.5 with 3.77% clipping. cfg 4 reaches detail 14.12 but at 8.36%
   * clipped, well past anything the other families need, so it is excluded.
   * Distilled merges clip from their very first step -- 0.59% at cfg 1 -- which
   * is why an absolute clipping budget calibrated on Pony judged this
   * checkpoint by its floor and returned 1.5.
   */
  distilled: {
    steps: 8,
    cfg: 2.5,
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
  /*
   * MEASURED. Swept cfg 4-8 on illustrij_v21; peak detail 12.10 at cfg 8 with
   * 0.08% clipping. The range was drawn too narrow -- detail was still climbing
   * at the top of it -- so the true optimum may be higher and 8 is a floor
   * rather than a peak. Clip skip 2 is not optional here: an explicit -1
   * returned a frame of pure black, mean RGB 0.0 and stddev 0.0 (ArtJob 26132).
   */
  illustrious: {
    steps: 20,
    cfg: 8,
    /*
     * dpmpp_2m/karras by extension, not by direct measurement. The sampler
     * sweep ran on Pony, where it beat euler/normal by 4% on a character LoRA
     * and 18% on a style one; this family's own cfg sweep ran under
     * euler_ancestral, so its cfg 8 was measured against a different sampler
     * than it now ships with. Twelve jobs ride on it, so the exposure is small,
     * but it is an assumption rather than a result.
     */
    sampler: 'dpmpp_2m',
    scheduler: 'karras',
    clipSkip: -2,
    width: 1024,
    height: 1024,
  },
  /*
   * MEASURED, and the one family where the metric was OVERRULED. Swept cfg 4-8
   * on duskMixXLIllustration: edge detail DECLINES monotonically with guidance,
   * 9.07 at cfg 4 down to 7.85 at 8, at 0% clipping throughout. The rule
   * therefore picked 4. Silas judged cfg 6 better than cfg 3 on that same LoRA
   * by eye (ArtJobs 26130/26131), and a 9.07-vs-8.59 detail gap with no
   * clipping either way is too small to overrule a direct human read.
   */
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
  /*
   * MEASURED on BOTH SD 1.5 checkpoints, which agree. Swept cfg 4-14:
   * duchaitenStylelikeme peaks at 14 (detail 22.80, 1.04% clipped),
   * revAnimated at 14 (detail 20.85, 0.01% clipped). Neither shows a clipping
   * cliff anywhere in range, so as with illustrious the top is a floor rather
   * than a peak. The cfg-14 render was inspected directly rather than trusted:
   * SD 1.5 halos and burns BEFORE it clips, so the clipping metric is blind to
   * its usual failure mode. It came back clean and richly detailed.
   */
  sd15: {
    steps: 20,
    cfg: 14,
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
