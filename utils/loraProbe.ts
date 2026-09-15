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
 * A1111 invocation syntax. ComfyUI has no parser for it, so `<lora:foo:1>`
 * left in a prompt is rendered as literal text rather than loading anything.
 */
const LORA_INVOCATION_PATTERN = /<(?:lora|lyco|lycoris|hypernet):[^>]*>/gi

/*
 * Platform and packaging words that describe the FILE rather than the image.
 * Many catalog rows have no real trigger at all and carry their own title in
 * defaultTrigger -- 'Aka6 [PonyXL] Style Lora', 'Almualim | Style LoRA | SDXL
 * Pony' -- so probing them unsanitized asks the model to depict the words
 * "Style Lora" instead of the style. Stripped, not rejected: whatever is left
 * ('Aka6', 'Almualim') is usually the real trigger token.
 */
const PACKAGING_NOISE_PATTERN =
  /\b(?:lora|loras|lycoris|lyco|hypernetwork|checkpoint|safetensors|comfyui|comfy|a1111|webui|forge|model|version|\d+[- ]?step|for\s+comfyui)\b/gi

/*
 * Base-model names. A trigger reading 'Grey Impact - Illustrious/PonyXL' is
 * naming its own compatibility, not asking for anything to be drawn.
 */
const BASE_NAME_NOISE_PATTERN =
  /\b(?:ponyxl|pony\s*diffusion(?:\s*xl)?|pdxl|sdxl|sd\s*1\.5|sd15|illustrious|ilxl|noobai|flux[0-9.]*(?:\s*d(?:ev)?)?|schnell|kontext|klein|wan|ltx|qwen)\b/gi

/*
 * Left behind once the words above are gone: '[PonyXL]' becomes '[ ]', and
 * 'Style Lora' becomes a stranded 'Style'. Neither names a subject, and an
 * empty bracket pair is itself weighting syntax.
 */
const EMPTY_GROUP_PATTERN = /[[(]\s*[\])]/g
const DANGLING_DESCRIPTOR_PATTERN =
  /(^|,)\s*(?:style|styles|concept|concepts|character|pack|mix|merge)\s*(?=,|$)/gi

// A probe prompt is a caption, not a scene description. A 400-character tag
// soup drowns the framing that makes the grid comparable.
const MAX_TRIGGER_CHARS = 240

/**
 * Turn stored trigger text into something safe to render.
 *
 * `defaultTrigger` is not reliably a prompt. It is a byte-identical copy of
 * `artPrompt` on every row, and across the catalog it holds three different
 * things: real tag lists, A1111 invocation syntax, and -- most often for rows
 * with no trigger at all -- the LoRA's own marketing title. Only the first is
 * a prompt, so the other two are stripped down toward whatever real token they
 * contain, and an empty result is fine: the probe still shows what the LoRA
 * does to a neutral prompt, which is the correct read for a style LoRA that
 * has no trigger word.
 */
export function sanitizeProbeTrigger(value: string): string {
  const cleaned = value
    .replace(LORA_INVOCATION_PATTERN, ' ')
    .replace(PACKAGING_NOISE_PATTERN, ' ')
    .replace(BASE_NAME_NOISE_PATTERN, ' ')
    .replace(EMPTY_GROUP_PATTERN, ' ')
    // Separators left stranded by the removals above: '| Style LoRA |' becomes
    // '|  |', and a run of punctuation renders as punctuation.
    .replace(/[|/\\]+/g, ', ')
    .replace(/\s*,\s*(?:,\s*)+/g, ', ')
    .replace(DANGLING_DESCRIPTOR_PATTERN, '$1')
    .replace(/\s*,\s*(?:,\s*)+/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,\-–—:;.]+|[\s,\-–—:;.]+$/g, '')
    // 'Invincible Comic for PonyXL' loses its object and ends on 'for'.
    .replace(/\s+(?:for|with|by|from|of|in|on)\s*$/i, '')
    .replace(/^[\s,\-–—:;.]+|[\s,\-–—:;.]+$/g, '')
    .trim()

  if (cleaned.length <= MAX_TRIGGER_CHARS) return cleaned

  // Cut on a tag boundary so the prompt never ends mid-token.
  const clipped = cleaned.slice(0, MAX_TRIGGER_CHARS)
  const lastComma = clipped.lastIndexOf(',')
  return (lastComma > 40 ? clipped.slice(0, lastComma) : clipped).trim()
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
 * across a family is the point: when every Pony LoRA renders the same subject
 * and the same framing, whatever differs in the output is the LoRA itself --
 * which is what makes "lackluster" and "wrongly matched" legible when the grid
 * is scanned. A per-LoRA prompt would hide exactly that signal.
 *
 * The scaffold names SUBJECT and FRAMING only, never medium. An earlier version
 * ended 'plain neutral background, soft even lighting, sharp focus', which is a
 * product-photography recipe: on cyberrealisticPony it rendered an Adventure
 * Time STYLE LoRA as a studio photograph of a vinyl toy (ArtImage 24472,
 * 2026-09-15). The LoRA was working and correctly matched; the prompt was
 * asking for a photo. Anything that implies a medium -- lighting, focus, lens,
 * render, 'photo', 'illustration' -- fights the very thing being probed and
 * does not belong in this scaffold.
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
        'single subject, upper body, centered, simple uncluttered background',
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
        'single subject, upper body, centered, simple uncluttered background',
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
        'single subject, upper body, centered, simple uncluttered background',
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
        'best quality',
        escapeSdPromptWeighting(trigger),
        'single subject, upper body, centered, simple uncluttered background',
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
        ? `${trigger}. A single figure, centered upper body, simple uncluttered background.`
        : 'A single figure, centered upper body, simple uncluttered background.',
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
    /*
     * Flux.2 and Flux.2 Klein are a different architecture from Flux.1, and the
     * flux lane renders on a fixed Flux.1 dev UNet. This is not a cosmetic
     * mismatch: on 2026-09-15 ArtJob 22837 applied
     * Flux/SFW/Flux_2-Turbo-LoRA_comfyui.safetensors through that lane and hung
     * ComfyUI for 90+ minutes, blowing through two 1800s soft timeouts and
     * wedging the relay's only slot until it was restarted by hand. The whole
     * render queue stopped behind it.
     *
     * conductor/t-147 closed the mirror-image case as mitigated by
     * kind_robots#2435, which blocks Flux.1 LoRAs from the Flux.2 lane. That
     * guard is directional and does not cover this way round.
     */
    if (
      value.includes('flux.2') ||
      value.includes('flux2') ||
      value.includes('klein')
    )
      return 'unsupported'
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

/*
 * Preferred probe base per family, most preferred first, matched as a
 * case-insensitive substring of localPath.
 *
 * Without this the tie-break among same-family, same-maturity candidates was
 * alphabetical, which is arbitrary and turned out to be consequential:
 * 'cyberrealisticPony_v61' won 61 of the first batch's 205 renders purely
 * because 'c' sorts before 'p' and 'r', and it is a PHOTOREALISTIC merge, so
 * every style LoRA routed through it was fighting its base.
 *
 * The ordering favours bases that let a LoRA's own look through over bases
 * with a strong look of their own. That is an aesthetic judgement made from
 * model names and it is meant to be edited -- it is the one knob that most
 * changes what the triage grid looks like. Anything not listed falls back to
 * the deterministic alphabetical order below.
 */
const PROBE_BASE_PREFERENCE: Record<
  Exclude<LoraProbeFamily, 'unsupported' | 'flux'>,
  string[]
> = {
  pony: ['ponyFaetality', 'realcartoonPony', 'cyberrealisticPony'],
  illustrious: ['illustrij', 'ntrMIXIllustriousXL', 'furrytoonmix'],
  sdxl: ['dreamshaperXL', 'duskMixXLIllustration', 'sdxlUnstableDiffusers'],
  sd15: ['duchaitenStylelikeme', 'revAnimated'],
}

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

  const ranked = [...pool].sort((a, b) =>
    String(a.localPath || a.name).localeCompare(String(b.localPath || b.name)),
  )

  const order = family === 'flux' ? [] : (PROBE_BASE_PREFERENCE[family] ?? [])
  for (const wanted of order) {
    const hit = ranked.find((candidate) =>
      String(candidate.localPath || candidate.name)
        .toLowerCase()
        .includes(wanted.toLowerCase()),
    )
    if (hit) return hit
  }

  return ranked[0] as ProbeCheckpointCandidate
}

export function probeTriggerText(resource: {
  defaultTrigger?: string | null
  triggerWords?: string | null
}): string {
  const trigger = sanitizeProbeTrigger(String(resource.defaultTrigger || ''))
  if (trigger) return trigger
  return sanitizeProbeTrigger(String(resource.triggerWords || ''))
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
