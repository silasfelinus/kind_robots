// /utils/artJobFields.ts
//
// One reader for the loosely-shaped ArtJob.payload blob.
//
// A job's brief arrives from several producers (the generator, kr-relay's
// ComfyUI workflow graph, the conductor art-request path), so the same fact
// lives under a different key depending on who queued it: a prompt is
// `promptString`, `artPrompt`, `positivePrompt`, `prompt`, or only the `text`
// input of a CLIP node buried in `workflow`. artjob-queue-card.vue grew a set
// of tolerant readers for exactly this, and every new surface that renders a
// job (the slideshow, next time something else) would otherwise copy them --
// the near-duplicate pattern AGENTS.md calls out as this codebase's
// highest-risk shape. These are those readers, extracted verbatim in behaviour.
//
// Structurally typed on purpose: no Prisma or Pinia import, so this stays a
// pure util that both components and stores can call without a cycle.
import { resolveMaturityPrivacy } from './maturityPrivacy'
import type { MaturityPrivacy } from './maturityPrivacy'

export type ArtJobFieldsSource = {
  id: number
  payload?: unknown
  projectSlug?: string | null
  artImageId?: number | null
  updatedAt?: Date | string | null
}

type JsonRecord = Record<string, unknown>

export function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function scalar(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function nestedScalar(value: unknown, keys: string[], depth = 0): string {
  if (depth > 6 || value === null || value === undefined) return ''
  if (Array.isArray(value)) {
    for (const child of value) {
      const result = nestedScalar(child, keys, depth + 1)
      if (result) return result
    }
    return ''
  }

  const record = asRecord(value)
  for (const key of keys) {
    const direct = scalar(record[key])
    if (direct) return direct
  }
  for (const child of Object.values(record)) {
    const result = nestedScalar(child, keys, depth + 1)
    if (result) return result
  }
  return ''
}

export function directPayloadScalar(
  job: ArtJobFieldsSource,
  keys: string[],
): string {
  const payload = asRecord(job.payload)
  for (const key of keys) {
    const value = scalar(payload[key])
    if (value) return value
  }
  return ''
}

export function payloadScalar(job: ArtJobFieldsSource, keys: string[]): string {
  const direct = directPayloadScalar(job, keys)
  if (direct) return direct
  return nestedScalar(asRecord(job.payload).workflow, keys)
}

export function workflowPrompt(
  job: ArtJobFieldsSource,
  kind: 'positive' | 'negative',
): string {
  const workflow = asRecord(asRecord(job.payload).workflow)
  for (const value of Object.values(workflow)) {
    const node = asRecord(value)
    const classType = scalar(node.class_type).toLowerCase()
    const inputs = asRecord(node.inputs)
    const title = scalar(asRecord(node._meta).title).toLowerCase()
    const isNegative = title.includes('negative')
    if (kind === 'negative' && !isNegative) continue
    if (kind === 'positive' && isNegative) continue
    if (!classType.includes('clip') && !classType.includes('wildcard')) continue
    const text =
      scalar(inputs.text) ||
      scalar(inputs.wildcard_text) ||
      scalar(inputs.populated_text) ||
      scalar(inputs.t5xxl) ||
      scalar(inputs.clip_l)
    if (text) return text
  }
  return ''
}

export function artJobPrompt(job: ArtJobFieldsSource): string {
  return (
    payloadScalar(job, [
      'promptString',
      'artPrompt',
      'positivePrompt',
      'prompt',
    ]) || workflowPrompt(job, 'positive')
  )
}

export function artJobNegativePrompt(job: ArtJobFieldsSource): string {
  return (
    payloadScalar(job, ['negativePrompt', 'negative_prompt', 'negative']) ||
    workflowPrompt(job, 'negative')
  )
}

export function artJobTitle(job: ArtJobFieldsSource): string {
  return (
    directPayloadScalar(job, ['title', 'label', 'name']) ||
    job.projectSlug ||
    `ArtJob #${job.id}`
  )
}

export function artJobPage(job: ArtJobFieldsSource): string {
  return directPayloadScalar(job, [
    'page',
    'pagePath',
    'route',
    'destinationPage',
  ])
}

export function artJobPageLabel(job: ArtJobFieldsSource): string {
  const page = artJobPage(job)
  if (!page) return ''
  if (page === 'index' || page === 'home') return '/'
  return page.startsWith('/') ? page : `/${page}`
}

export function artJobVariant(job: ArtJobFieldsSource): string {
  return directPayloadScalar(job, ['variant', 'breakpoint'])
}

export function artJobRequestId(job: ArtJobFieldsSource): string {
  return directPayloadScalar(job, ['requestId', 'requestID', 'request_id'])
}

export function artJobImagePath(job: ArtJobFieldsSource): string {
  return directPayloadScalar(job, [
    'imagePath',
    'outputPath',
    'destinationPath',
  ])
}

/** Trailing path segment of the job's destination path, query/hash stripped. */
export function artJobFileName(job: ArtJobFieldsSource): string {
  const path = artJobImagePath(job)
  if (!path) return ''
  const bare = path.split(/[?#]/)[0] || ''
  const segments = bare.split('/').filter(Boolean)
  return segments[segments.length - 1] || ''
}

export function artJobSettings(job: ArtJobFieldsSource): string[] {
  const values: Array<[string, string]> = [
    [
      'size',
      `${payloadScalar(job, ['width'])}×${payloadScalar(job, ['height'])}`,
    ],
    [
      'model',
      payloadScalar(job, [
        'checkpoint',
        'ckpt_name',
        'unet_name',
        'model_name',
      ]),
    ],
    ['sampler', payloadScalar(job, ['sampler', 'sampler_name'])],
    ['scheduler', payloadScalar(job, ['scheduler'])],
    ['steps', payloadScalar(job, ['steps'])],
    ['cfg', payloadScalar(job, ['cfg', 'cfg_scale'])],
    ['guidance', payloadScalar(job, ['guidance'])],
    ['denoise', payloadScalar(job, ['denoise'])],
    ['seed', payloadScalar(job, ['seed', 'noise_seed'])],
  ]

  return values
    .filter(([, value]) => value && value !== '×')
    .map(([label, value]) => `${label}: ${value}`)
}

export function artJobVisibility(job: ArtJobFieldsSource): MaturityPrivacy {
  return resolveMaturityPrivacy(asRecord(asRecord(job.payload).save))
}

/**
 * Cache-buster derived from the job's own updatedAt. updatedAt is DateTime? in
 * the schema, so a null timestamp simply means no cache-buster. An OVERWRITE
 * retry replaces the bytes of an existing ArtImage id in place, so the id alone
 * is not a safe cache key -- this version string is what makes it one.
 */
export function artJobImageVersion(job: ArtJobFieldsSource): string {
  const updatedAt = job.updatedAt
    ? new Date(job.updatedAt).getTime()
    : Number.NaN
  return Number.isFinite(updatedAt) ? `?v=${updatedAt}` : ''
}

/**
 * The unauthenticated file URL for a finished job, or '' when the job's own
 * visibility says the bytes need the protected preview route instead.
 */
export function artJobPublicImageSrc(job: ArtJobFieldsSource): string {
  const id = job.artImageId
  if (typeof id !== 'number') return ''
  const visibility = artJobVisibility(job)
  if (!visibility.isPublic || visibility.isMature) return ''
  return `/api/art/images/${id}/file${artJobImageVersion(job)}`
}
