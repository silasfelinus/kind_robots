// /server/utils/artJobQueueAffinity.ts

type JsonRecord = Record<string, unknown>

export type ArtJobAffinityCandidate = {
  id: number
  engine: string
  payload: unknown
  priority: number
}

export type SmartQueueMatchTier = 'exact' | 'model' | 'none'

export type SmartQueueSelection<T extends ArtJobAffinityCandidate> = {
  candidate: T | null
  affinityMatched: boolean
  matchTier: SmartQueueMatchTier
  bypassedCount: number
  preferredAffinity: string | null
  selectedAffinity: string | null
  preferredModelKey?: string | null
  selectedModelKey?: string | null
}

const MODEL_RESOURCE_KEYS = new Set([
  'checkpoint',
  'checkpoint_name',
  'ckpt_name',
  'clip_name',
  'clip_name1',
  'clip_name2',
  'clip_name3',
  'control_net_name',
  'controlnet_name',
  'diffusion_model',
  'ipadapter_file',
  'lora_name',
  'model_name',
  'sd_model_checkpoint',
  'style_model_name',
  'unet_name',
  'upscale_model',
  'upscale_model_name',
  'vae_name',
])

// The resources whose swap costs a MULTI-GIGABYTE VRAM reload. On Ferngrotto's
// 12GB 3060 a unet/checkpoint change evicts nearly everything and reloads from
// disk; a LoRA or VAE change is a rounding error next to it. artJobQueueAffinityKey
// deliberately treats all named resources alike, which is right for "can this run
// with zero reload" and wrong for "which jobs should sit next to each other".
//
// Measured on the live queue, 2026-09-08: 23 pending jobs used exactly TWO heavy
// models (flux1-kontext-dev-q5_k_m, krea-2-turbo-q5_k_s) but produced SEVEN
// distinct full affinity keys, because jobs in the same family carried different
// LoRA counts. Seven keys over two models means the exact-match pass almost never
// fires inside a priority tier, so the claim falls back to FIFO and the engine
// swaps unets far more often than the work requires.
const HEAVY_MODEL_RESOURCE_KEYS = new Set([
  'checkpoint',
  'checkpoint_name',
  'ckpt_name',
  'diffusion_model',
  'model_name',
  'sd_model_checkpoint',
  'unet_name',
])

const MODEL_LOADER_CLASS_PATTERN =
  /(checkpoint|unet|clip|vae|lora|controlnet|ipadapter|stylemodel|upscalemodel|modelloader)/i

const DYNAMIC_LOADER_INPUT_KEYS = new Set([
  'batch_size',
  'denoise',
  'height',
  'image',
  'images',
  'latent',
  'negative',
  'noise',
  'noise_seed',
  'positive',
  'prompt',
  'seed',
  'steps',
  'text',
  'width',
])

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as JsonRecord
}

function stableValue(value: unknown): unknown {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (Array.isArray(value)) {
    if (
      value.length === 2 &&
      (typeof value[0] === 'string' || typeof value[0] === 'number') &&
      typeof value[1] === 'number'
    ) {
      return '@link'
    }

    return value.map((item) => stableValue(item))
  }

  const record = asRecord(value)
  if (!record) return String(value)

  return Object.fromEntries(
    Object.entries(record)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableValue(child)]),
  )
}

function collectNamedResources(
  value: unknown,
  resources: Set<string>,
  depth = 0,
): void {
  if (depth > 8 || value === null || value === undefined) return

  if (Array.isArray(value)) {
    for (const child of value)
      collectNamedResources(child, resources, depth + 1)
    return
  }

  const record = asRecord(value)
  if (!record) return

  for (const [key, child] of Object.entries(record)) {
    const normalizedKey = key.toLowerCase()

    if (
      MODEL_RESOURCE_KEYS.has(normalizedKey) &&
      (typeof child === 'string' || typeof child === 'number')
    ) {
      const normalizedValue = String(child).trim().toLowerCase()
      if (normalizedValue) resources.add(`${normalizedKey}:${normalizedValue}`)
    }

    collectNamedResources(child, resources, depth + 1)
  }
}

function collectComfyLoaderSettings(
  payload: JsonRecord,
  loaderSettings: Set<string>,
): void {
  const workflow = asRecord(payload.workflow)
  if (!workflow) return

  for (const node of Object.values(workflow)) {
    const record = asRecord(node)
    if (!record) continue

    const classType = String(record.class_type || '').trim()
    if (!classType || !MODEL_LOADER_CLASS_PATTERN.test(classType)) continue

    const inputs = asRecord(record.inputs) ?? {}
    const stableInputs = Object.fromEntries(
      Object.entries(inputs)
        .filter(([key]) => !DYNAMIC_LOADER_INPUT_KEYS.has(key.toLowerCase()))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => [key, stableValue(value)]),
    )

    loaderSettings.add(
      `${classType.toLowerCase()}:${JSON.stringify(stableInputs)}`,
    )
  }
}

export function artJobQueueAffinityKey(
  engine: string,
  rawPayload: unknown,
): string {
  const normalizedEngine = String(engine || 'UNKNOWN').toUpperCase()
  const payload = asRecord(rawPayload) ?? {}
  const resources = new Set<string>()
  const loaderSettings = new Set<string>()

  collectNamedResources(payload, resources)
  if (normalizedEngine === 'COMFY') {
    collectComfyLoaderSettings(payload, loaderSettings)
  }

  const parts = [...resources, ...loaderSettings].sort()
  return `${normalizedEngine}|${parts.length ? parts.join('|') : 'default'}`
}

/**
 * The heavy half of the affinity key: engine plus whichever unet/checkpoint the
 * job loads, ignoring LoRAs, VAEs, CLIPs and loader settings.
 *
 * Returns null when no heavy resource can be identified, and callers must treat
 * that as "do not group" rather than as a key. An engine-only fallback would
 * bucket every unparsed payload together and reorder work on no evidence at all.
 */
export function artJobQueueModelKey(
  engine: string,
  rawPayload: unknown,
): string | null {
  const normalizedEngine = String(engine || 'UNKNOWN').toUpperCase()
  const resources = new Set<string>()
  collectNamedResources(asRecord(rawPayload) ?? {}, resources)

  const heavy = [...resources]
    .filter((entry) => HEAVY_MODEL_RESOURCE_KEYS.has(entry.split(':', 1)[0]))
    .sort()

  if (!heavy.length) return null
  return `${normalizedEngine}|${heavy.join('|')}`
}

/**
 * Pick the next job to claim, preferring one the engine can run with the least
 * reloading.
 *
 * TWO TIERS, tried in order within the highest-priority window:
 *
 *   1. EXACT - same full affinity key: same unet AND same LoRAs, VAE, loader
 *      settings. Nothing reloads at all.
 *   2. MODEL - same heavy model, different accessories. A LoRA swap costs a few
 *      hundred MB; the unet swap this avoids costs eight to twelve, which on a
 *      12GB card means evicting the text encoders too and reloading them next
 *      time round. This tier is why Krea and Flux work now arrives in runs
 *      instead of interleaved.
 *
 * Priority still dominates absolutely: both tiers only ever look inside the
 * highest-priority group, so a promoted job is never passed over for a cheaper
 * one. maxBypass bounds each tier so a busy model family cannot starve older
 * work indefinitely.
 */
export function selectSmartQueueCandidate<T extends ArtJobAffinityCandidate>(
  candidates: T[],
  preferredAffinity: string | null,
  maxBypass = 24,
  preferredModelKey: string | null = null,
): SmartQueueSelection<T> {
  const ordered = [...candidates].sort(
    (left, right) => right.priority - left.priority || left.id - right.id,
  )
  const oldest = ordered[0] ?? null

  if (!oldest) {
    return {
      candidate: null,
      affinityMatched: false,
      matchTier: 'none',
      bypassedCount: 0,
      preferredAffinity,
      selectedAffinity: null,
      preferredModelKey,
      selectedModelKey: null,
    }
  }

  const oldestAffinity = artJobQueueAffinityKey(oldest.engine, oldest.payload)
  const oldestModelKey = artJobQueueModelKey(oldest.engine, oldest.payload)

  if (!preferredAffinity && !preferredModelKey) {
    return {
      candidate: oldest,
      affinityMatched: false,
      matchTier: 'none',
      bypassedCount: 0,
      preferredAffinity: null,
      selectedAffinity: oldestAffinity,
      preferredModelKey: null,
      selectedModelKey: oldestModelKey,
    }
  }

  const highestPriority = oldest.priority
  const samePriority = ordered.filter(
    (candidate) => candidate.priority === highestPriority,
  )
  const cap = Math.max(0, maxBypass)

  const pick = (index: number, tier: 'exact' | 'model') => {
    const candidate = samePriority[index] ?? oldest
    return {
      candidate,
      affinityMatched: true,
      matchTier: tier,
      bypassedCount: index,
      preferredAffinity,
      selectedAffinity: artJobQueueAffinityKey(
        candidate.engine,
        candidate.payload,
      ),
      preferredModelKey,
      selectedModelKey: artJobQueueModelKey(
        candidate.engine,
        candidate.payload,
      ),
    } satisfies SmartQueueSelection<T>
  }

  if (preferredAffinity) {
    const exactIndex = samePriority.findIndex(
      (candidate) =>
        artJobQueueAffinityKey(candidate.engine, candidate.payload) ===
        preferredAffinity,
    )
    if (exactIndex >= 0 && exactIndex <= cap) return pick(exactIndex, 'exact')
  }

  // Null means "no heavy resource identified" on one side or the other, which
  // is not a match - see artJobQueueModelKey.
  if (preferredModelKey) {
    const modelIndex = samePriority.findIndex(
      (candidate) =>
        artJobQueueModelKey(candidate.engine, candidate.payload) ===
        preferredModelKey,
    )
    if (modelIndex >= 0 && modelIndex <= cap) return pick(modelIndex, 'model')
  }

  const oldestMatchesExact =
    !!preferredAffinity && oldestAffinity === preferredAffinity
  const oldestMatchesModel =
    !!preferredModelKey && oldestModelKey === preferredModelKey

  return {
    candidate: oldest,
    affinityMatched: oldestMatchesExact || oldestMatchesModel,
    matchTier: oldestMatchesExact
      ? 'exact'
      : oldestMatchesModel
        ? 'model'
        : 'none',
    bypassedCount: 0,
    preferredAffinity,
    selectedAffinity: oldestAffinity,
    preferredModelKey,
    selectedModelKey: oldestModelKey,
  }
}
