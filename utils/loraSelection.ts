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
  supportedServer?: string | null
  defaultTrigger?: string | null
  triggerWords?: string | null
}

function normalizedServer(resource: LoraResourceLike): string {
  return String(resource.supportedServer || '').trim().toUpperCase()
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

  if (engine === 'krea2' || engine === 'flux2') {
    if (server === 'FLUX') return 30
    if (server === 'KONTEXT') return 20
    if (server === 'GENERIC') return 10
    return 0
  }

  if (engine !== 'comfy') return 0

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
  // claim broad Comfy compatibility. Guessing SDXL here is how a checkpoint
  // switch can leave a loader wired to weights from a different architecture.
  if (server === 'COMFY') return 15
  if (server === 'GENERIC') return 10
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
