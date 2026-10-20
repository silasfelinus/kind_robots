// /utils/videoModelResources.ts
// Video checkpoints are NOT interchangeable still-image checkpoints. WAN's 5B
// model and its paired 14B experts have different loaders; LTX uses a checkpoint.
import type { VideoEngine } from './videoPresets'

export type WanVideoMode = 'ti2v' | 'a14b'
export type VideoModelSlot = 'ltx' | 'wan-ti2v' | 'wan-high' | 'wan-low'
export type VideoLoraProfile = 'ltx-2.3' | 'wan-2.2-5b' | 'wan-2.2-14b'
export type VideoMaturity = 'general' | 'mature-capable' | 'adult-focused' | 'unreviewed'

export type VideoModelResource = {
  id: number
  name: string
  localPath?: string | null
  resourceType?: string | null
  supportedServer?: string | null
  generation?: string | null
  description?: string | null
  isActive?: boolean | null
  isMature?: boolean | null
}

export type VideoModelIds = {
  videoCheckpointResourceId?: number | null
  videoLowCheckpointResourceId?: number | null
}

export type VideoModelPaths = {
  ltxCheckpoint?: string
  wanTi2v?: string
  wanHigh?: string
  wanLow?: string
}

export function effectiveWanMode(
  mode: WanVideoMode | null | undefined,
  hasEndFrame: boolean,
): WanVideoMode {
  return hasEndFrame || mode === 'a14b' ? 'a14b' : 'ti2v'
}

export function videoLoraProfile(
  engine: VideoEngine,
  mode: WanVideoMode,
): VideoLoraProfile {
  return engine === 'ltx'
    ? 'ltx-2.3'
    : mode === 'a14b'
      ? 'wan-2.2-14b'
      : 'wan-2.2-5b'
}

// Only expose models known to fit the EXISTING encoders, VAE, LoRA loaders and
// graphs. The catalog's supportedServer alone is not evidence of compatibility.
export function videoModelSlot(
  resource: VideoModelResource,
): VideoModelSlot | null {
  if (resource.isActive === false) return null
  const type = String(resource.resourceType || '').toUpperCase()
  const path = String(resource.localPath || '').replace(/\\/g, '/').toLowerCase()
  if (!path || path.includes('..') || path.startsWith('/')) return null
  if (type === 'CHECKPOINT' && /ltx[._-]?2[._-]?3/.test(path)) {
    return 'ltx'
  }
  if (type !== 'DIFFUSION_MODEL' || !/wan[._-]?2[._-]?2/.test(path))
    return null
  if (/high[._-]?noise/.test(path) && /i2v/.test(path)) return 'wan-high'
  if (/low[._-]?noise/.test(path) && /i2v/.test(path)) return 'wan-low'
  if (/ti2v/.test(path) && /5b/.test(path)) return 'wan-ti2v'
  return null
}

// Explicit tags can be set in Resource.description by a human curator.
// Unreviewed is intentionally distinct from SFW: isMature=false alone is
// NOT evidence that a checkpoint will consistently produce safe content.
export function videoModelMaturity(
  resource: Pick<VideoModelResource, 'isMature' | 'description'>,
): VideoMaturity {
  const description = String(resource.description || '').toLowerCase()
  if (/\[maturity:adult-focused\]/.test(description)) return 'adult-focused'
  if (/\[maturity:mature-capable\]/.test(description)) return 'mature-capable'
  if (/\[maturity:general\]/.test(description) && !resource.isMature)
    return 'general'
  return resource.isMature ? 'mature-capable' : 'unreviewed'
}

export function videoModelIsMature(resource: VideoModelResource): boolean {
  const maturity = videoModelMaturity(resource)
  return maturity === 'mature-capable' || maturity === 'adult-focused'
}

export function validateVideoModelSelection(input: {
  engine: VideoEngine
  mode: WanVideoMode
  ids: VideoModelIds
  resources: VideoModelResource[]
}): { paths: VideoModelPaths; selectedIds: number[]; isMature: boolean } {
  const first = input.ids.videoCheckpointResourceId
  const second = input.ids.videoLowCheckpointResourceId
  const byId = new Map(input.resources.map((r) => [r.id, r]))
  function requireSlot(id: number | null | undefined, slot: VideoModelSlot) {
    if (!Number.isInteger(id) || !id || id < 1) {
      throw new Error('Select a valid video checkpoint Resource.')
    }
    const resource = byId.get(id)
    if (!resource || videoModelSlot(resource) !== slot) {
      throw new Error('Video checkpoint is missing, inaccessible, or incompatible with the selected architecture.')
    }
    return resource
  }

  if (first == null && second == null) {
    return { paths: {}, selectedIds: [], isMature: false }
  }
  if (input.engine === 'ltx') {
    if (second != null) throw new Error('LTX does not use WAN low-noise experts.')
    const resource = requireSlot(first, 'ltx')
    return {
      paths: { ltxCheckpoint: resource.localPath! },
      selectedIds: [resource.id],
      isMature: videoModelIsMature(resource),
    }
  }
  if (input.mode === 'ti2v') {
    if (second != null) throw new Error('WAN 5B does not use a low-noise expert.')
    const resource = requireSlot(first, 'wan-ti2v')
    return {
      paths: { wanTi2v: resource.localPath! },
      selectedIds: [resource.id],
      isMature: videoModelIsMature(resource),
    }
  }
  // A14B is a MATCHED high/low pair. Never blend a fine-tune with the default
  // counterpart just because someone selected one dropdown.
  if (first == null || second == null)
    throw new Error('Select both high- and low-noise WAN 14B experts.')
  const high = requireSlot(first, 'wan-high')
  const low = requireSlot(second, 'wan-low')
  return {
    paths: { wanHigh: high.localPath!, wanLow: low.localPath! },
    selectedIds: [high.id, low.id],
    isMature: videoModelIsMature(high) || videoModelIsMature(low),
  }
}
