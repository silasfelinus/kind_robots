// The numbers behind every Playbook Forge forecast, with where each came from.
// Render seconds are the median claim-to-image-saved time of DONE ArtJobs read
// from /api/admin/art-review (202 Ecotone bake-off and art-standard jobs,
// 2026-10-26). They exclude queue wait, which depends on queue depth and is a
// forge input. The p90 tail is mostly model load: one cold start per lane.

export type CheckpointClassId =
  'illustrious' | 'sdxl' | 'distilled' | 'krea2' | 'zimage' | 'flux2'

export type CheckpointClass = {
  id: CheckpointClassId
  label: string
  examples: string
  secondsPerImage: number
  coldStartSeconds: number
  evidence: string
  measured: boolean
}

export const CHECKPOINT_CLASSES: CheckpointClass[] = [
  {
    id: 'illustrious',
    label: 'Illustrious',
    examples: 'Arthemy Western Art, Nova Comic XL, Illustrij',
    secondsPerImage: 23,
    coldStartSeconds: 35,
    evidence: 'median 22.3–22.7 s across 118 jobs at 28–30 steps',
    measured: true,
  },
  {
    id: 'sdxl',
    label: 'SDXL',
    examples: 'Nihilmania and other SDXL bases',
    secondsPerImage: 37,
    coldStartSeconds: 35,
    evidence: 'median 36.9 s across 8 jobs',
    measured: true,
  },
  {
    id: 'distilled',
    label: 'Distilled (Turbo / Lightning)',
    examples: 'any 8-step Turbo, Lightning, LCM or Hyper checkpoint',
    secondsPerImage: 8,
    coldStartSeconds: 30,
    evidence: 'inferred from 8 steps against 28; not yet measured',
    measured: false,
  },
  {
    id: 'krea2',
    label: 'Krea 2',
    examples: 'house painted style',
    secondsPerImage: 82,
    coldStartSeconds: 50,
    evidence: 'median 81.8 s across 34 jobs',
    measured: true,
  },
  {
    id: 'zimage',
    label: 'Z-Image',
    examples: 'photographic and storybook realism',
    secondsPerImage: 67,
    coldStartSeconds: 260,
    evidence: 'median 67.2 s across 34 jobs; p90 332 s is cold loads',
    measured: true,
  },
  {
    id: 'flux2',
    label: 'Flux 2',
    examples: 'highest fidelity, slowest lane',
    secondsPerImage: 760,
    coldStartSeconds: 1000,
    evidence: 'median 763 s across 8 jobs; small sample',
    measured: true,
  },
]

export function checkpointClass(id: CheckpointClassId): CheckpointClass {
  return CHECKPOINT_CLASSES.find((c) => c.id === id) ?? CHECKPOINT_CLASSES[0]!
}

/**
 * Words authored per unit. Not measured per unit yet: set from the shipped
 * corpora (Prom of Doom ~14k words, Shifting Desks ~69k, Ecotone ~142k,
 * Emperor of Dust ~188k, Crystal Street ~411k) divided by their counts, and
 * editable in the forge's Assumptions panel.
 */
export type WordRates = {
  encounterBody: number
  outcomeText: number
  endingText: number
  revealText: number
  castBio: number
  questStep: number
  momentCaption: number
  creatorOption: number
  trailerBeat: number
}

export const DEFAULT_WORD_RATES: WordRates = {
  encounterBody: 160,
  outcomeText: 55,
  endingText: 260,
  revealText: 120,
  castBio: 180,
  questStep: 110,
  momentCaption: 30,
  creatorOption: 45,
  trailerBeat: 12,
}

export type Assumptions = {
  words: WordRates
  /** Words an agent session drafts, wires and tests in one cycle. */
  wordsPerSession: number
  /** Reroll and rejected-candidate overhead; ledgers run 1.2–3× shipped art. */
  rerollRate: number
  /** Queue wait per image, set from how busy the relay is. */
  queueSecondsPerImage: number
  /** Distinct art lanes a run renders on; each pays one cold start. */
  lanes: number
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  words: DEFAULT_WORD_RATES,
  wordsPerSession: 6000,
  rerollRate: 0.3,
  queueSecondsPerImage: 0,
  lanes: 1,
}
