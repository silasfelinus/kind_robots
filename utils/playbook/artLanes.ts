// Art lanes the Playbook Manager can request a beat's art on. They mirror the
// Ecotone checkpoint bake-off (conductor projects/weird-humboldt/art/
// CHECKPOINT-BAKEOFF.yaml); each game's playbook lists its preferred order
// (Arthemy, the Zuzu house checkpoint, first for the Zuzu games and Emperor of Dust).
// Ecotone renders every picture in four of them, one per art style:
// Z-Image Turbo, Krea 2, Arthemy and Nova Comic (utils/ecotone/artStyles.ts).
// A lane carries only engine wording; a game's own palette and setting come
// from its Playbook.artStyle, so one game's look never rides on another's art.

export type PlaybookArtLane = {
  key: string
  label: string
  engine: 'comfy' | 'krea2' | 'zimage' | 'flux2'
  checkpoint?: string
  prompt: 'tags' | 'prose'
  prefix?: string
  suffix?: string
  steps?: number
  cfg?: number
  sampler?: string
}

const TAG_PREFIX =
  'masterpiece, best quality, amazing quality, absurdres, very aesthetic, painterly, cinematic lighting'
const PROSE_SUFFIX = 'painterly illustration'

export const PLAYBOOK_ART_LANES: PlaybookArtLane[] = [
  {
    key: 'krea2',
    label: 'Krea 2',
    engine: 'krea2',
    prompt: 'prose',
    suffix: PROSE_SUFFIX,
  },
  {
    key: 'flux2',
    label: 'Flux 2 Klein',
    engine: 'flux2',
    prompt: 'prose',
    suffix: PROSE_SUFFIX,
  },
  {
    key: 'zimage',
    label: 'Z-Image Turbo',
    engine: 'zimage',
    prompt: 'prose',
    suffix: PROSE_SUFFIX,
  },
  {
    key: 'arthemy',
    label: 'Arthemy Western Art (Zuzu house lane)',
    engine: 'comfy',
    checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
    prompt: 'tags',
    prefix: TAG_PREFIX,
    steps: 28,
    cfg: 5,
    sampler: 'euler_ancestral',
  },
  {
    key: 'novacomic',
    label: 'Nova Comic XL',
    engine: 'comfy',
    checkpoint: 'Illustrious/novaComicXL_v20.safetensors',
    prompt: 'tags',
    prefix: TAG_PREFIX,
    steps: 28,
    cfg: 5,
    sampler: 'euler_ancestral',
  },
]

export const PLAYBOOK_ART_NEGATIVE =
  'text, letters, words, sign text, watermark, signature, logo, lowres, worst quality, blurry, jpeg artifacts, frame, border, (nude:1.4), nsfw'

export type PlaybookArtShape = 'scene' | 'portrait'

export function playbookArtRequest(
  lane: PlaybookArtLane,
  prompt: string,
  shape: PlaybookArtShape,
  seed: number,
  tag: {
    projectSlug: string
    designer: string
    negative?: string
    style?: string
  } = {
    projectSlug: 'weird-humboldt',
    designer: 'Ecotone',
  },
): Record<string, unknown> {
  const promptString = [lane.prefix, prompt.trim(), tag.style, lane.suffix]
    .filter(Boolean)
    .join(', ')
  const [width, height] = shape === 'portrait' ? [832, 1216] : [1344, 768]
  const body: Record<string, unknown> = {
    engine: lane.engine,
    promptString,
    width,
    height,
    seed,
    isPublic: false,
    projectSlug: tag.projectSlug,
    designer: tag.designer,
  }
  if (lane.engine === 'comfy') {
    body.checkpoint = lane.checkpoint
    body.negativePrompt = [PLAYBOOK_ART_NEGATIVE, tag.negative]
      .filter(Boolean)
      .join(', ')
    if (lane.steps) body.steps = lane.steps
    if (lane.cfg) body.cfg = lane.cfg
    if (lane.sampler) body.sampler = lane.sampler
  }
  return body
}
