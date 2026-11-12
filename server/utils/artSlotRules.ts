// /server/utils/artSlotRules.ts
//
// The pure rules behind art slots (server/utils/artSlots.ts): input validation,
// what counts as the same picture, and which copy of a duplicate survives. No
// database access, so utils/scripts/verifyArtSlots.test.ts runs without one.
import { createHash } from 'node:crypto'
import { createError } from 'h3'

export const ART_SLOT_KEY_MAX_LENGTH = 300
const SLOT_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:/#@+=-]*$/
const PROJECT_SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{0,119}$/
export const ART_CANDIDATE_VERDICTS = [
  'none',
  'liked',
  'rejected',
  'duplicate',
] as const
export type ArtCandidateVerdict = (typeof ART_CANDIDATE_VERDICTS)[number]
export const ART_CANDIDATE_SOURCES = [
  'conductor-ledger',
  'conductor-request',
  'recovered',
  'manual',
] as const
export const MAX_CANDIDATES_PER_CALL = 500

export function badRequestError(message: string): never {
  throw createError({ statusCode: 400, message })
}

export function normalizeSlotKey(value: unknown): string {
  const key = typeof value === 'string' ? value.trim() : ''
  if (
    !key ||
    key.length > ART_SLOT_KEY_MAX_LENGTH ||
    !SLOT_KEY_PATTERN.test(key)
  ) {
    badRequestError(
      `Invalid slotKey: 1-${ART_SLOT_KEY_MAX_LENGTH} characters of letters, digits and _.:/#@+=-.`,
    )
  }
  return key
}

export function normalizeProjectSlug(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  const slug = String(value).trim().toLowerCase()
  if (!PROJECT_SLUG_PATTERN.test(slug)) badRequestError('Invalid projectSlug.')
  return slug
}

export function normalizeVerdict(value: unknown): ArtCandidateVerdict {
  const verdict = String(value ?? '')
    .trim()
    .toLowerCase()
  if (!(ART_CANDIDATE_VERDICTS as readonly string[]).includes(verdict)) {
    badRequestError(
      `verdict must be one of ${ART_CANDIDATE_VERDICTS.join(', ')}.`,
    )
  }
  return verdict as ArtCandidateVerdict
}

function normText(value: unknown): string {
  return String(value ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export type RenderFields = {
  seed: number | null
  promptString: string | null
  negativePrompt?: string | null
  checkpoint?: string | null
  sampler?: string | null
  steps?: number | null
  cfg?: number | null
}

/** The same value for two images means the same picture; null when undecidable. */
export function renderFingerprint(image: RenderFields): string | null {
  if (image.seed === null || image.seed === undefined) return null
  const prompt = normText(image.promptString)
  if (!prompt) return null
  return createHash('sha256')
    .update(
      JSON.stringify([
        prompt,
        normText(image.negativePrompt),
        image.seed,
        String(image.checkpoint ?? '').trim(),
        String(image.sampler ?? '').trim(),
        image.steps ?? null,
        image.cfg ?? null,
      ]),
    )
    .digest('hex')
}

export type PlannedCandidate = {
  id: number
  artImageId: number
  renderFingerprint: string | null
  verdict: string
}

export type DuplicateGroup = {
  renderFingerprint: string
  keepArtImageId: number
  removeArtImageIds: number[]
}

/**
 * Which copies of one picture to keep. Per fingerprint group (2+ live
 * candidates): keep the slot's selected image, else a protected one (an id a
 * game manifest uses), else a liked one, else the oldest image. Protected
 * images are never removed, even when another copy is kept.
 */
export function planDuplicates(
  candidates: PlannedCandidate[],
  selectedArtImageId: number | null,
  protectedIds: ReadonlySet<number> = new Set(),
): DuplicateGroup[] {
  const groups = new Map<string, PlannedCandidate[]>()
  for (const candidate of candidates) {
    if (!candidate.renderFingerprint || candidate.verdict === 'duplicate')
      continue
    const group = groups.get(candidate.renderFingerprint) ?? []
    group.push(candidate)
    groups.set(candidate.renderFingerprint, group)
  }
  const plan: DuplicateGroup[] = []
  for (const [fingerprint, group] of groups) {
    if (group.length < 2) continue
    const ordered = [...group].sort((a, b) => a.artImageId - b.artImageId)
    const keep =
      ordered.find((c) => c.artImageId === selectedArtImageId) ??
      ordered.find((c) => protectedIds.has(c.artImageId)) ??
      ordered.find((c) => c.verdict === 'liked') ??
      ordered[0]!
    const remove = ordered
      .filter(
        (c) =>
          c.artImageId !== keep.artImageId && !protectedIds.has(c.artImageId),
      )
      .map((c) => c.artImageId)
    if (remove.length)
      plan.push({
        renderFingerprint: fingerprint,
        keepArtImageId: keep.artImageId,
        removeArtImageIds: remove,
      })
  }
  return plan
}

export type CandidateInput = {
  slotKey: string
  projectSlug?: string | null
  label?: string | null
  artImageId: number
  artJobId?: number | null
  source?: string | null
  sourceRef?: string | null
  /** Choose this image when the slot has no choice yet. */
  selectIfEmpty?: boolean
}

export function parseCandidateInputs(raw: unknown): CandidateInput[] {
  if (!Array.isArray(raw) || raw.length === 0)
    badRequestError('candidates must be a non-empty array.')
  if (raw.length > MAX_CANDIDATES_PER_CALL)
    badRequestError(`At most ${MAX_CANDIDATES_PER_CALL} candidates per call.`)
  return raw.map((item: Record<string, unknown>) => {
    const artImageId = Number(item?.artImageId)
    if (!Number.isSafeInteger(artImageId) || artImageId < 1)
      badRequestError('Each candidate needs a positive artImageId.')
    const artJobId =
      item?.artJobId === undefined || item?.artJobId === null
        ? null
        : Number(item.artJobId)
    if (artJobId !== null && (!Number.isSafeInteger(artJobId) || artJobId < 1))
      badRequestError('artJobId must be a positive integer.')
    const source = String(item?.source ?? 'manual')
    if (!(ART_CANDIDATE_SOURCES as readonly string[]).includes(source))
      badRequestError(
        `source must be one of ${ART_CANDIDATE_SOURCES.join(', ')}.`,
      )
    return {
      slotKey: normalizeSlotKey(item?.slotKey),
      projectSlug: normalizeProjectSlug(item?.projectSlug),
      label: item?.label ? String(item.label).slice(0, 300) : null,
      artImageId,
      artJobId,
      source,
      sourceRef: item?.sourceRef ? String(item.sourceRef).slice(0, 300) : null,
      selectIfEmpty: item?.selectIfEmpty === true,
    }
  })
}
