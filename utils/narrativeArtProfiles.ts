// /utils/narrativeArtProfiles.ts
//
// Storymaker creates stories. Taskmaster uses stories to finish tasks.
// Neither experience asks the user to configure image-generation internals.
// Product code selects one of these centralized profiles and derives the prompt
// from narrative state, Facets, characters, locations, and the target surface.

export type NarrativeProduct = 'storymaker' | 'taskmaster'

export type NarrativeArtMoment =
  | 'opening'
  | 'chapter'
  | 'location'
  | 'character-introduction'
  | 'pivotal-event'
  | 'finale'

export type NarrativeArtSurface =
  | 'hero'
  | 'scene-landscape'
  | 'scene-portrait'
  | 'card'
  | 'square'

export type NarrativeArtProfile = {
  key: string
  product: NarrativeProduct
  engine: 'krea2'
  steps: 4
  cfg: 1
  sampler: 'euler'
  scheduler: 'simple'
  denoise: 1
  designer: string
  projectSlug: NarrativeProduct
  defaultSurface: NarrativeArtSurface
  styleDirective: string
  negativePrompt: string
}

const SHARED_NEGATIVE_PROMPT =
  'text, caption, logo, watermark, interface, frame, blurry, low quality, malformed anatomy, duplicate subjects'

export const NARRATIVE_ART_PROFILES: Record<
  NarrativeProduct,
  NarrativeArtProfile
> = {
  storymaker: {
    key: 'storymaker-narrative-krea4',
    product: 'storymaker',
    engine: 'krea2',
    steps: 4,
    cfg: 1,
    sampler: 'euler',
    scheduler: 'simple',
    denoise: 1,
    designer: 'storymaker-auto-director',
    projectSlug: 'storymaker',
    defaultSurface: 'scene-landscape',
    styleDirective:
      'cinematic illustrated-story moment, expressive characters, strong environmental storytelling, polished composition, coherent visual continuity',
    negativePrompt: SHARED_NEGATIVE_PROMPT,
  },
  taskmaster: {
    key: 'taskmaster-narrative-krea4',
    product: 'taskmaster',
    engine: 'krea2',
    steps: 4,
    cfg: 1,
    sampler: 'euler',
    scheduler: 'simple',
    denoise: 1,
    designer: 'taskmaster-auto-director',
    projectSlug: 'taskmaster',
    defaultSurface: 'scene-landscape',
    styleDirective:
      'adventurous quest-board illustration, clear objective-focused composition, playful stakes, practical visual readability, polished storybook finish',
    negativePrompt: SHARED_NEGATIVE_PROMPT,
  },
}

export const NARRATIVE_ART_DIMENSIONS: Record<
  NarrativeArtSurface,
  { width: number; height: number }
> = {
  hero: { width: 1536, height: 864 },
  'scene-landscape': { width: 1344, height: 768 },
  'scene-portrait': { width: 768, height: 1344 },
  card: { width: 768, height: 1152 },
  square: { width: 1024, height: 1024 },
}

const ILLUSTRATED_MOMENTS = new Set<NarrativeArtMoment>([
  'opening',
  'chapter',
  'location',
  'character-introduction',
  'pivotal-event',
  'finale',
])

export function shouldIllustrateNarrativeMoment(
  moment: NarrativeArtMoment,
): boolean {
  return ILLUSTRATED_MOMENTS.has(moment)
}

export function getNarrativeArtProfile(
  product: NarrativeProduct,
): NarrativeArtProfile {
  return NARRATIVE_ART_PROFILES[product]
}

export function getNarrativeArtDimensions(
  surface: NarrativeArtSurface,
): { width: number; height: number } {
  return NARRATIVE_ART_DIMENSIONS[surface]
}
