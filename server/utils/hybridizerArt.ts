import { starterForIdentity } from './hybridizerFusion'

export const HYBRIDIZER_ART_STEPS = 8
export const HYBRIDIZER_ART_SIZE = 1024
export const HYBRIDIZER_ART_PRIORITY = 100
export const HYBRIDIZER_ACTIVE_USER_LIMIT = 3
export const HYBRIDIZER_RETRY_LIMIT = 2
// Launch hybrids queue behind interactive fusions (100) and project runtime art,
// but ahead of bulk backfill packs (priority 60 and below), so the curated
// catalogue keeps filling on a busy queue (Silas, 2026-10-30).
export const HYBRIDIZER_BATCH_PRIORITY = 90
export const HYBRIDIZER_BATCH_MAX_PAIRS = 50
export const HYBRIDIZER_BATCH_PENDING_CAP = 60

export type HybridizerSubjectKind = 'creature' | 'object'

function withArticle(title: string): string {
  const name = title.trim().toLowerCase()
  return (/^[aeiou]/.test(name) ? 'an ' : 'a ') + name
}

// The artwork is the hybrid itself. Specimen jars and fusion machinery are
// front-end chrome only, so the prompt never stages the result in a laboratory.
export function hybridizerArtPrompt(
  leftTitle: string,
  rightTitle: string,
  kind: HybridizerSubjectKind = 'creature',
): string {
  const left = withArticle(leftTitle)
  const right = withArticle(rightTitle)
  const subject =
    kind === 'object' ? 'One single object' : 'One single living creature'
  return [
    subject + ' that is an even physical blend of ' + left,
    'and ' + right + '. Its shape, colors, surface textures and signature',
    'features come from both, merged into one coherent body so that both',
    left + ' and ' + right + ' are instantly recognizable.',
    'Full view, centered, three-quarter angle, standing on a plain light grey',
    'studio backdrop with a soft floor shadow and even soft lighting.',
    'Vivid, detailed painterly illustration with crisp edges.',
  ].join(' ')
}

export function hybridizerSubjectKind(
  leftTaxonomy: string | null | undefined,
  rightTaxonomy: string | null | undefined,
): HybridizerSubjectKind {
  return leftTaxonomy === 'OTHER' && rightTaxonomy === 'OTHER'
    ? 'object'
    : 'creature'
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
