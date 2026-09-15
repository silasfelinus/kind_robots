export type LoraProbeFamily =
  'pony' | 'illustrious' | 'sdxl' | 'sd15' | 'flux' | 'unsupported'

export type LoraProbeEngine = 'comfy' | 'flux'

export type LoraProbeRecipe = {
  engine: LoraProbeEngine
  /*
   * Where the base model comes from.
   *
   * 'catalog-checkpoint' picks a registered CHECKPOINT Resource and sends it as
   * `checkpoint`. 'engine-default' means the lane does not accept one: the flux
   * builder resolves a fixed UNet through fluxModelByVariant (flux1-dev-Q8_0)
   * and never reads `checkpoint`, so naming a Flux checkpoint there would
   * record a base on the ArtImage that had no part in the render.
   */
  basePolicy: 'catalog-checkpoint' | 'engine-default'
  width: number
  height: number
  loraStrength: number
  positive: (trigger: string) => string
  negative: string
}

/*
 * Parentheses and square brackets are attention-weighting syntax in the SD
 * prompt parsers, not literal characters. Catalog triggers carry them often --
 * '(Imminent) Reversed Gangbang (Concept)' is a real defaultTrigger -- and left
 * raw they silently re-weight the probe, so a LoRA would be judged on a prompt
 * nobody wrote. Flux reads prose through T5 and needs no escaping.
 */
export function escapeSdPromptWeighting(value: string): string {
  return value.replace(/([()[\]])/g, '\\$1')
}

/*
 * Hosts whose previews are gone. img.genur.art has no DNS record at all, so
 * every Resource still pointing at it renders the shared fallback and is being
 * triaged blind. Treated as "no preview" rather than as art.
 */
export const DEAD_PREVIEW_HOSTS = ['genur.art']

/*
 * One fixed probe per family, with the trigger injected. Identical scaffolding
 * across a family is the point: when every Pony LoRA renders the same subject,
 * the same framing and the same lighting, whatever differs in the output is the
 * LoRA itself -- which is what makes "lackluster" and "wrongly matched" legible
 * when the grid is scanned. A per-LoRA prompt would hide exactly that signal.
 *
 * Steps, cfg, sampler and scheduler are deliberately absent. The comfy lane
 * resolves them through sdxlSamplerProfile(), which detects distilled/turbo
 * checkpoints and tunes accordingly; hardcoding 28 steps here would mis-render
 * every Lightning and Turbo base in the catalog.
 */
const NEGATIVE_SD = [
  'worst quality',
  'low quality',
  'blurry',
  'jpeg artifacts',
  'watermark',
  'signature',
  'text',
  'cropped',
  'extra limbs',
  'deformed hands',
].join(', ')

export const LORA_PROBE_RECIPES: Record<
  Exclude<LoraProbeFamily, 'unsupported'>,
  LoraProbeRecipe
> = {
  pony: {
    engine: 'comfy',
    basePolicy: 'catalog-checkpoint',
    width: 1024,
    height: 1024,
    loraStrength: 0.8,
    positive: (trigger) =>
      [
        'score_9, score_8_up, score_7_up',
        escapeSdPromptWeighting(trigger),
        'single subject, upper body, centered, plain neutral background, soft even lighting, sharp focus',
      ]
        .filter(Boolean)
        .join(', '),
    negative: `score_6, score_5, score_4, ${NEGATIVE_SD}`,
  },
  illustrious: {
    engine: 'comfy',
    basePolicy: 'catalog-checkpoint',
    width: 1024,
    height: 1024,
    loraStrength: 0.8,
    positive: (trigger) =>
      [
        'masterpiece, best quality, very aesthetic, absurdres',
        escapeSdPromptWeighting(trigger),
        'single subject, upper body, centered, plain neutral background, soft even lighting, sharp focus',
      ]
        .filter(Boolean)
        .join(', '),
    negative: NEGATIVE_SD,
  },
  sdxl: {
    engine: 'comfy',
    basePolicy: 'catalog-checkpoint',
    width: 1024,
    height: 1024,
    loraStrength: 0.8,
    positive: (trigger) =>
      [
        escapeSdPromptWeighting(trigger),
        'single subject, upper body, centered, plain neutral background, soft even lighting, sharp focus, highly detailed',
      ]
        .filter(Boolean)
        .join(', '),
    negative: NEGATIVE_SD,
  },
  /*
   * 768x768 rather than 1024: SD 1.5 was trained at 512 and degrades into
   * duplicated subjects and stretched anatomy well before 1024, which would
   * read as a bad LoRA in the triage grid when it is really a bad resolution.
   */
  sd15: {
    engine: 'comfy',
    basePolicy: 'catalog-checkpoint',
    width: 768,
    height: 768,
    loraStrength: 0.8,
    positive: (trigger) =>
      [
        'best quality, highly detailed',
        escapeSdPromptWeighting(trigger),
        'single subject, upper body, centered, plain neutral background, soft even lighting, sharp focus',
      ]
        .filter(Boolean)
        .join(', '),
    negative: NEGATIVE_SD,
  },
  /*
   * Flux reads natural language and takes no negative prompt -- a comma-tag
   * string scaffolded for SD would waste most of its conditioning.
   */
  flux: {
    engine: 'flux',
    basePolicy: 'engine-default',
    width: 1024,
    height: 1024,
    loraStrength: 0.8,
    positive: (trigger) =>
      trigger
        ? `A clear reference portrait of a single subject demonstrating ${trigger}, centered upper body, plain neutral background, soft even lighting, sharp focus.`
        : 'A clear reference portrait of a single subject, centered upper body, plain neutral background, soft even lighting, sharp focus.',
    negative: '',
  },
}

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

/**
 * The base family a LoRA must be rendered against.
 *
 * `generation` is the primary signal because it carries the Civitai baseModel
 * string ('Pony', 'SDXL 1.0', 'Flux.1 D') for rows resolved by scan_loras.py.
 * `supportedServer` is only a fallback: it buckets Pony, Illustrious and
 * SDXL-base together as SDXL, and a Pony LoRA applied to an SDXL-base
 * checkpoint renders mush rather than failing, so it can never be the primary
 * key for this decision.
 */
export function classifyLoraFamily(
  generation: unknown,
  supportedServer?: unknown,
): LoraProbeFamily {
  const value = normalize(generation)

  if (value) {
    if (value.includes('pony')) return 'pony'
    if (value.includes('illustrious') || value.includes('noob'))
      return 'illustrious'
    // Kontext is an edit model: it needs a source image, not a text probe.
    if (value.includes('kontext')) return 'unsupported'
    if (value.includes('flux')) return 'flux'
    if (value.includes('sdxl')) return 'sdxl'
    if (value.includes('sd 1.5') || value === '1.5' || value.includes('sd1.5'))
      return 'sd15'
    // SD 2.1, Wan, LTX, Qwen, Z-Image, Anima, Krea and friends: either no base
    // on hand or a video/audio lane that a still probe cannot serve.
    if (value !== 'other' && value !== 'none' && value !== 'unknown')
      return 'unsupported'
  }

  switch (normalize(supportedServer)) {
    case 'sdxl':
      return 'sdxl'
    case 'sd15':
      return 'sd15'
    case 'flux':
      return 'flux'
    default:
      return 'unsupported'
  }
}

/*
 * Checkpoint family comes from the localPath DIRECTORY, not from `generation`.
 * The catalog files checkpoints on disk the way ComfyUI loads them
 * (Pony/, SDXL/, Illustrious/, SD15/, Flux/), and that filing is reliable
 * where `generation` is not: cyberrealisticPony_v61 carries generation
 * 'ARCHIVE', cartoonArcadiaSDXLSD1_v2 carries 'base', and
 * duchaitenStylelikeme (filed under SD15/) carries 'SDXL'. Directory first,
 * generation only as a fallback for a row filed somewhere unhelpful.
 */
const CHECKPOINT_DIR_FAMILY: Record<string, LoraProbeFamily> = {
  pony: 'pony',
  illustrious: 'illustrious',
  sdxl: 'sdxl',
  sd15: 'sd15',
  flux: 'flux',
}

/*
 * Not text-to-image checkpoints, whatever they are filed as. v3_sd15_mm is an
 * AnimateDiff motion module that happens to sit in SD15/; loading it through
 * CheckpointLoaderSimple fails at render time rather than at plan time.
 */
const CHECKPOINT_EXCLUDE_PATTERN = /(_mm|motion_module|animatediff)\./i

export type ProbeCheckpointCandidate = {
  id: number
  name: string
  localPath: string | null
  generation: string | null
  isMature: boolean
}

export function classifyCheckpointFamily(
  candidate: Pick<ProbeCheckpointCandidate, 'localPath' | 'generation'>,
): LoraProbeFamily {
  const localPath = String(candidate.localPath || '')
  if (CHECKPOINT_EXCLUDE_PATTERN.test(localPath)) return 'unsupported'

  const dir = normalize(localPath.split('/')[0])
  const byDir = CHECKPOINT_DIR_FAMILY[dir]
  if (byDir) return byDir

  return classifyLoraFamily(candidate.generation)
}

/**
 * The base to render a LoRA against.
 *
 * Maturity is a preference, not a filter. A mature LoRA prefers a base that can
 * actually render it, and an SFW LoRA prefers an SFW base -- but a family match
 * always outranks a maturity match, because the wrong base produces a broken
 * image while a mature-capable base given a neutral prompt simply produces a
 * neutral image.
 */
export function selectProbeCheckpoint(
  family: LoraProbeFamily,
  isMature: boolean,
  candidates: ProbeCheckpointCandidate[],
): ProbeCheckpointCandidate | null {
  if (family === 'unsupported') return null
  // The lane supplies its own base; there is nothing in the catalog to pick.
  if (LORA_PROBE_RECIPES[family].basePolicy === 'engine-default') return null

  const inFamily = candidates.filter(
    (candidate) => classifyCheckpointFamily(candidate) === family,
  )
  if (!inFamily.length) return null

  const preferred = inFamily.filter(
    (candidate) => Boolean(candidate.isMature) === isMature,
  )
  const pool = preferred.length ? preferred : inFamily

  return [...pool].sort((a, b) =>
    String(a.localPath || a.name).localeCompare(String(b.localPath || b.name)),
  )[0] as ProbeCheckpointCandidate
}

export function probeTriggerText(resource: {
  defaultTrigger?: string | null
  triggerWords?: string | null
}): string {
  const trigger = String(resource.defaultTrigger || '').trim()
  if (trigger) return trigger
  return String(resource.triggerWords || '').trim()
}

export function buildLoraProbePrompt(
  family: LoraProbeFamily,
  trigger: string,
): { prompt: string; negativePrompt: string } | null {
  if (family === 'unsupported') return null
  const recipe = LORA_PROBE_RECIPES[family]
  return {
    prompt: recipe.positive(trigger.trim()),
    negativePrompt: recipe.negative,
  }
}

/**
 * Whether a Resource has no usable preview and is therefore being triaged
 * blind -- no generated ArtImage, no stored path, and either no remote preview
 * or one on a host that no longer resolves.
 */
export function hasBlindPreview(resource: {
  artImageId?: number | null
  imagePath?: string | null
  previewImageUrl?: string | null
  ArtImage?: { id?: number | null } | null
}): boolean {
  /*
   * Both shapes have to be accepted. resourceGallerySelect carries artImageId,
   * but the catalog listing the triage page actually loads (resourceListSelect,
   * via /api/resources) carries only the nested ArtImage and no id column -- so
   * checking artImageId alone would count every already-rendered LoRA as blind
   * on the one screen this count is for.
   */
  if (resource.artImageId) return false
  if (resource.ArtImage?.id) return false
  if (String(resource.imagePath || '').trim()) return false

  const url = String(resource.previewImageUrl || '').trim()
  if (!url) return true

  return DEAD_PREVIEW_HOSTS.some((host) => url.includes(host))
}
