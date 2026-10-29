import { starterForIdentity } from './hybridizerFusion'

export const HYBRIDIZER_ART_STEPS = 8
export const HYBRIDIZER_ART_SIZE = 1024
export const HYBRIDIZER_ART_PRIORITY = 20
export const HYBRIDIZER_ACTIVE_USER_LIMIT = 3
export const HYBRIDIZER_RETRY_LIMIT = 2

export function hybridizerArtPrompt(
  leftTitle: string,
  rightTitle: string,
): string {
  return [
    'A single original fantastical chimera combining',
    leftTitle + ' and ' + rightTitle + ',',
    'with clearly recognizable visual traits of both ingredients,',
    'a striking expressive silhouette, imaginative biological textures,',
    'richly painted cinematic fantasy illustration, dramatic soft lighting,',
    'and a cohesive atmospheric setting.',
  ].join(' ')
}

export function hybridizerArtSeed(fusionId: string): number {
  if (!/^[a-f0-9]{64}$/.test(fusionId))
    throw new Error('Invalid fusion fingerprint.')
  return Number.parseInt(fusionId.slice(0, 8), 16)
}

export function hybridizerInputLabel(key: string): string | null {
  return starterForIdentity(key)?.title ?? null
}

export function hybridizerDeliverableUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const path = value.trim()
  if (/^\/(?!\/)[^\s]+$/.test(path)) return path
  if (/^https:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/i.test(path)) return path
  return null
}

export type HybridizerQueueState =
  | 'STUDY'
  | 'QUEUED'
  | 'RENDERING'
  | 'DELIVERING'
  | 'READY'
  | 'FAILED'
  | 'CANCELLED'

export function hybridizerQueueState(
  artJobStatus: string | null,
  deliverableUrl: string | null,
): HybridizerQueueState {
  if (artJobStatus === 'DONE') return deliverableUrl ? 'READY' : 'DELIVERING'
  if (artJobStatus === 'RUNNING') return 'RENDERING'
  if (artJobStatus === 'PENDING') return 'QUEUED'
  if (artJobStatus === 'FAILED') return 'FAILED'
  if (artJobStatus === 'CANCELLED') return 'CANCELLED'
  return 'STUDY'
}
