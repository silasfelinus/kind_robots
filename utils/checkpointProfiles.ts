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

export const CHECKPOINT_PROFILES: Record<CheckpointFamily, CheckpointProfile> = {
  distilled: {
    steps: 8,
    cfg: 2,
    sampler: 'dpmpp_sde',
    scheduler: 'karras',
    clipSkip: -1,
    width: 1024,
    height: 1024,
  },
  pony: {
    steps: 28,
    cfg: 6,
    sampler: 'dpmpp_2m',
    scheduler: 'karras',
    clipSkip: -2,
    width: 1024,
    height: 1024,
  },
  illustrious: {
    steps: 28,
    cfg: 5,
    sampler: 'euler_ancestral',
    scheduler: 'normal',
    clipSkip: -2,
    width: 1024,
    height: 1024,
  },
  sdxl: {
    steps: 28,
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
    steps: 28,
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
