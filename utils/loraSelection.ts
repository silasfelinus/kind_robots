import type {
  ArtGeneratorEngine,
  CheckpointFamily,
} from '@/utils/artGeneratorPresets'
import type { VideoEngine } from '@/utils/videoPresets'

export type LoraPick = {
  resourceId: number
  strength: number
}

export type LoraResourceLike = {
  id: number
  generation?: string | null
  supportedServer?: string | null
  defaultTrigger?: string | null
  triggerWords?: string | null
}

function normalizedServer(resource: LoraResourceLike): string {
  return String(resource.supportedServer || '')
    .trim()
    .toUpperCase()
}

function normalizedGeneration(resource: LoraResourceLike): string {
  return String(resource.generation || '')
    .trim()
    .toUpperCase()
}

export function krea2LoraCompatibilityRank(resource: LoraResourceLike): number {
  const server = normalizedServer(resource)
  const generation = normalizedGeneration(resource)

  if (server !== 'COMFY' && server !== 'GENERIC') return 0
  if (/\bKREA[\s._-]*2\b/.test(generation)) return 30
  if (generation === 'KREA') return 20
  return 0
}

/**
 * Which LoRAs actually load on FLUX.1 dev.
 *
 * The flux lane advertised `supports.lora: false` and this function returned 0
 * for it, both of which were true until 2026-09-16 -- the flux workflow builder
 * silently dropped every LoRA it was handed (kind-robots/t-105), which is what
 * made 126 queued Flux previews worthless with no error to show for it. The
 * builder was fixed; the catalogue and this ranking were not, so the generator
 * kept refusing to offer a LoRA the workflow would now honour. Silas,
 * 2026-09-19: "the loras are coming back processed, so it definitely supports
 * it."
 *
 * THREE DIFFERENT MODELS SAY "FLUX". FLUX.2 weights do not load on FLUX.1, and
 * a Kontext LoRA belongs to the editing model, not to dev -- and both carry
 * FLUX in their generation string. Ruling them out explicitly is the whole
 * subtlety here; a bare substring test would offer all three.
 */
export function fluxLoraCompatibilityRank(resource: LoraResourceLike): number {
  const server = normalizedServer(resource)
  const generation = normalizedGeneration(resource)

  if (/\bFLUX[\s._-]*2\b/.test(generation)) return 0
  if (generation.includes('KONTEXT') || server === 'KONTEXT') return 0
  if (!/\bFLUX\b/.test(generation)) return 0

  if (server === 'FLUX') return 30
  if (server === 'COMFY') return 20
  if (server === 'GENERIC') return 10
  return 0
}

export function flux2LoraCompatibilityRank(resource: LoraResourceLike): number {
  const server = normalizedServer(resource)
  const generation = normalizedGeneration(resource)

  if (!/\bFLUX[\s._-]*2\b/.test(generation)) return 0
  if (server === 'FLUX') return 30
  if (server === 'COMFY') return 20
  if (server === 'GENERIC') return 10
  return 0
}

export function videoLoraCompatible(
  resource: LoraResourceLike,
  engine: VideoEngine,
): boolean {
  const server = normalizedServer(resource)
  return server === engine.toUpperCase() || server === 'GENERIC'
}

export function artLoraCompatibilityRank(
  resource: LoraResourceLike,
  engine: ArtGeneratorEngine,
  checkpointFamily: CheckpointFamily = 'unknown',
): number {
  const server = normalizedServer(resource)

  if (engine === 'krea2') {
    return krea2LoraCompatibilityRank(resource)
  }

  if (engine === 'flux2') {
    return flux2LoraCompatibilityRank(resource)
  }

  if (engine === 'flux') {
    return fluxLoraCompatibilityRank(resource)
  }

  if (engine === 'sdxl-img2img' || engine === 'comfy') {
    if (checkpointFamily === 'sd15') {
      if (server === 'SD15') return 30
      if (server === 'COMFY') return 15
      if (server === 'GENERIC') return 10
      return 0
    }

    if (
      checkpointFamily === 'sdxl' ||
      checkpointFamily === 'sdxl-distilled' ||
      checkpointFamily === 'pony'
    ) {
      if (server === 'SDXL') return 30
      if (server === 'COMFY') return 15
      if (server === 'GENERIC') return 10
      return 0
    }

    // Unknown/archive checkpoints should only advertise LoRAs that explicitly
    // claim broad Comfy compatibility. Guessing a family here can leave a
    // loader wired to weights from a different architecture.
    if (server === 'COMFY') return 15
    if (server === 'GENERIC') return 10
    return 0
  }

  return 0
}

export function artLoraCompatible(
  resource: LoraResourceLike,
  engine: ArtGeneratorEngine,
  checkpointFamily: CheckpointFamily = 'unknown',
): boolean {
  return artLoraCompatibilityRank(resource, engine, checkpointFamily) > 0
}

export function loraTriggerTerms(resource: LoraResourceLike): string[] {
  const preferred = String(resource.defaultTrigger || '').trim()
  if (preferred) return [preferred]

  return String(resource.triggerWords || '')
    .split(/[,;\n]+/)
    .map((value) => value.trim())
    .filter(Boolean)
}

export function promptWithLoraTriggers(
  prompt: string,
  picks: LoraPick[],
  resources: LoraResourceLike[],
): string {
  const cleanPrompt = prompt.trim()
  if (!picks.length) return cleanPrompt

  const byId = new Map(resources.map((resource) => [resource.id, resource]))
  const additions: string[] = []
  const seen = new Set<string>()
  const haystack = cleanPrompt.toLowerCase()

  for (const pick of picks) {
    const resource = byId.get(pick.resourceId)
    if (!resource) continue

    for (const term of loraTriggerTerms(resource)) {
      const key = term.toLowerCase()
      if (!key || seen.has(key) || haystack.includes(key)) continue
      seen.add(key)
      additions.push(term)
    }
  }

  if (!additions.length) return cleanPrompt
  return [cleanPrompt, ...additions].filter(Boolean).join(', ')
}
