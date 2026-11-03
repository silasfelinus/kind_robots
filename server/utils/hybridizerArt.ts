import { starterForIdentity } from './hybridizerFusion'

export const HYBRIDIZER_ART_STEPS = 8
export const HYBRIDIZER_ART_SIZE = 1024
export const HYBRIDIZER_ART_PRIORITY = 100
export const HYBRIDIZER_ACTIVE_USER_LIMIT = 3
export const HYBRIDIZER_RETRY_LIMIT = 2
// Launch hybrids are low-priority bulk art: Silas, 2026-11-02, "Hybridizer can just be low
// priority, submit all, and be done with it." They render only when no interactive fusion,
// game or project art is waiting, so the whole 4,000-pair launch set can sit in the queue at
// once instead of trickling in through a small window the top-up cron rarely refills.
export const HYBRIDIZER_BATCH_PRIORITY = 1
export const HYBRIDIZER_BATCH_MAX_PAIRS = 50
export const HYBRIDIZER_BATCH_PENDING_CAP = 4000

export type HybridizerSubjectKind = 'creature' | 'object'

function withArticle(title: string): string {
  const name = title.trim().toLowerCase()
  return (/^[aeiou]/.test(name) ? 'an ' : 'a ') + name
}

// The artwork is the hybrid itself. Specimen jars and fusion machinery are
// front-end chrome only, so the prompt never stages the result in a laboratory.
export type HybridizerRevisionDirection = {
  leftWeight?: number
  direction?: string
}

export function hybridizerArtPrompt(
  leftTitle: string,
  rightTitle: string,
  kind: HybridizerSubjectKind = 'creature',
  revision: HybridizerRevisionDirection = {},
): string {
  const left = withArticle(leftTitle)
  const right = withArticle(rightTitle)
  const leftWeight = revision.leftWeight ?? 50
  const subject =
    kind === 'object' ? 'One single object' : 'One single living creature'
  const balance =
    leftWeight === 50
      ? 'an even physical blend of ' + left + ' and ' + right
      : 'a physical blend with approximately ' +
        leftWeight +
        '% characteristics of ' +
        left +
        ' and ' +
        (100 - leftWeight) +
        '% of ' +
        right
  return [
    subject +
      ' that is ' +
      balance +
      '. Its shape, colors, surface textures and signature',
    'features come from both, merged into one coherent body so that both',
    left + ' and ' + right + ' are instantly recognizable.',
    'Full view, centered, three-quarter angle, standing on a plain light grey',
    'studio backdrop with a soft floor shadow and even soft lighting.',
    'Vivid, detailed painterly illustration with crisp edges.',
    revision.direction?.trim()
      ? 'Additional creative direction: ' + revision.direction.trim()
      : '',
  ]
    .filter(Boolean)
    .join(' ')
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

// A new rendering changes only the art seed, never the canonical pair key.
export function hybridizerRevisionSeed(
  fusionId: string,
  revision: number,
): number {
  if (!Number.isSafeInteger(revision) || revision < 0 || revision >= 12)
    throw new Error('Invalid hybrid illustration revision.')
  return (hybridizerArtSeed(fusionId) + revision * 7919) >>> 0
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
