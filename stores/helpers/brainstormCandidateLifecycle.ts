// /stores/helpers/brainstormCandidateLifecycle.ts
//
// Pure BrainstormCandidate normalization and state-transition logic, split
// out of stores/brainstormStore.ts (conductor brainstorm/t-021) so it can be
// exercised directly in a plain Node test -- the same reason
// brainstormSourceAdapterKit.ts/brainstormSourceContextKit.ts are split from
// their store-facing callers. brainstormStore.ts itself is unreachable from
// a bare `tsx` process: it imports useServerStore -> userStore ->
// achievementStore, and achievementStore.ts calls `import.meta.glob(...)` at
// module load time, a Vite-only feature with no meaning under plain Node.
// None of the functions below need Pinia, a store instance, or a browser
// runtime -- they take plain data in and return plain data (or mutate one
// passed-in BrainstormCandidate) out, so moving them here costs nothing and
// is what actually makes verifyBrainstormCandidateLifecycle.test.ts able to
// import and call them for real instead of grepping the store source.
//
// brainstormStore.ts imports everything it still needs from here; nothing
// about its own behavior changes, only where the pure half of it lives.
import {
  BRAINSTORM_DEFAULT_OUTPUT_DOMAIN,
  BRAINSTORM_DEFAULT_RESULTS,
  BRAINSTORM_MAX_RESULTS,
  BRAINSTORM_MIN_RESULTS,
  BRAINSTORM_OUTPUT_DOMAINS,
  BRAINSTORM_RETURN_TYPES,
} from '../../types/brainstorm'
import type {
  BrainstormBatch,
  BrainstormBatchShape,
  BrainstormBranchOrigin,
  BrainstormCandidate,
  BrainstormCandidateRevision,
  BrainstormCandidateStatus,
  BrainstormErrorKind,
  BrainstormGenerateRequest,
  BrainstormGeneratedCandidate,
  BrainstormOutputDomainId,
  BrainstormReturnTypeId,
  BrainstormReturnTypeRequest,
  BrainstormSourceRef,
} from '../../types/brainstorm'

export function nowIso(): string {
  return new Date().toISOString()
}

export function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

export function cleanMultilineText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function cleanExamples(values: unknown): string[] {
  if (!Array.isArray(values)) return []

  return values
    .map((value) => cleanMultilineText(value))
    .filter((value, index, all) => value && all.indexOf(value) === index)
    .slice(0, 20)
}

export function clampResultCount(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return BRAINSTORM_DEFAULT_RESULTS
  return Math.min(
    BRAINSTORM_MAX_RESULTS,
    Math.max(BRAINSTORM_MIN_RESULTS, Math.round(parsed)),
  )
}

export function normalizeBatchShape(value: unknown): BrainstormBatchShape {
  return value === 'assortment' ? 'assortment' : 'focused'
}

const OUTPUT_DOMAIN_IDS = new Set(
  BRAINSTORM_OUTPUT_DOMAINS.map((entry) => entry.id),
)

export function normalizeOutputDomain(
  value: unknown,
): BrainstormOutputDomainId {
  const id = cleanText(value) as BrainstormOutputDomainId
  return OUTPUT_DOMAIN_IDS.has(id) ? id : BRAINSTORM_DEFAULT_OUTPUT_DOMAIN
}

export const RETURN_TYPE_IDS = new Set<BrainstormReturnTypeId>(
  BRAINSTORM_RETURN_TYPES.map((entry) => entry.id),
)

export function normalizeReturnTypeId(
  value: unknown,
): BrainstormReturnTypeId | null {
  const id = cleanText(value) as BrainstormReturnTypeId
  return RETURN_TYPE_IDS.has(id) ? id : null
}

export function normalizeReturnTypes(
  value: unknown,
): BrainstormReturnTypeRequest[] {
  if (!Array.isArray(value)) return []

  const result: BrainstormReturnTypeRequest[] = []
  const seen = new Set<BrainstormReturnTypeId>()

  for (const raw of value) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const record = raw as Record<string, unknown>
    const id = normalizeReturnTypeId(record.id)
    if (!id || seen.has(id)) continue

    const parsedCount = Number(record.count)
    const count =
      Number.isInteger(parsedCount) && parsedCount > 0
        ? Math.min(BRAINSTORM_MAX_RESULTS, parsedCount)
        : undefined

    result.push({ id, ...(count ? { count } : {}) })
    seen.add(id)
  }

  return result
}

/**
 * The store's own exact-duplicate sanity check on a generation API response,
 * run client-side before candidates are created from it. Distinct from the
 * server-side parser's near-duplicate (Jaccard-similarity) check in
 * server/utils/brainstorm/brainstormParser.ts -- that one tolerates a
 * reworded restatement; this one only catches an identical (modulo
 * whitespace/case) response, which would indicate the provider echoed the
 * same idea twice rather than a legitimately similar one.
 */
export function normalizeGeneratedCandidates(
  value: unknown,
  expectedCount: number,
): BrainstormGeneratedCandidate[] | null {
  if (!Array.isArray(value)) return null

  const candidates: BrainstormGeneratedCandidate[] = []
  const seen = new Set<string>()

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null

    const record = raw as Record<string, unknown>
    const text = cleanMultilineText(record.text)
    const title = cleanText(record.title)
    const returnType = normalizeReturnTypeId(record.returnType)

    if (!text) return null

    const duplicateKey = text.toLocaleLowerCase().replace(/\s+/g, ' ').trim()
    if (seen.has(duplicateKey)) return null
    seen.add(duplicateKey)

    candidates.push({
      text,
      ...(title ? { title } : {}),
      ...(returnType ? { returnType } : {}),
    })
  }

  return candidates.length === expectedCount ? candidates : null
}

export function normalizeSourceRef(value: unknown): BrainstormSourceRef | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const record = value as Record<string, unknown>
  const modelType = cleanText(record.modelType)
  const id = Number(record.id)
  const slug = cleanText(record.slug)
  const intent = cleanMultilineText(record.intent)

  if (!modelType) return null

  return {
    modelType,
    ...(Number.isInteger(id) && id > 0 ? { id } : {}),
    ...(slug ? { slug } : {}),
    ...(intent ? { intent } : {}),
  }
}

export function normalizeRevision(
  value: unknown,
): BrainstormCandidateRevision | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const record = value as Record<string, unknown>
  const text = cleanMultilineText(record.text)
  const title = cleanText(record.title)
  const createdAt = cleanText(record.createdAt)
  const reason = record.reason
  const returnType = normalizeReturnTypeId(record.returnType)

  if (
    !text ||
    !createdAt ||
    !['generated', 'edited', 'regenerated', 'branched', 'restored'].includes(
      String(reason),
    )
  ) {
    return null
  }

  return {
    text,
    createdAt,
    reason: reason as BrainstormCandidateRevision['reason'],
    ...(title ? { title } : {}),
    returnType,
  }
}

export function normalizeBranchOrigin(
  value: unknown,
): BrainstormBranchOrigin | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const candidateId = cleanText(record.candidateId)
  const revisionIndex = Number(record.revisionIndex)
  const title = cleanText(record.title)
  const text = cleanMultilineText(record.text)

  if (
    !candidateId ||
    !text ||
    !Number.isInteger(revisionIndex) ||
    revisionIndex < 0
  ) {
    return null
  }

  return {
    candidateId,
    revisionIndex,
    ...(title ? { title } : {}),
    text,
  }
}

export function normalizeStoredCandidate(
  value: unknown,
): BrainstormCandidate | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const record = value as Record<string, unknown>
  const id = cleanText(record.id)
  const batchId = cleanText(record.batchId)
  const text = cleanMultilineText(record.text)
  const title = cleanText(record.title)
  const feedback = cleanMultilineText(record.feedback)
  const parentId = cleanText(record.parentId)
  const status = record.status

  if (
    !id ||
    !batchId ||
    !text ||
    !['pending', 'kept', 'rejected'].includes(String(status))
  ) {
    return null
  }

  const revisions = Array.isArray(record.revisions)
    ? record.revisions
        .map((revision) => normalizeRevision(revision))
        .filter((revision): revision is BrainstormCandidateRevision =>
          Boolean(revision),
        )
    : []

  const meta =
    record.meta &&
    typeof record.meta === 'object' &&
    !Array.isArray(record.meta)
      ? (record.meta as Record<string, unknown>)
      : {}
  const source = normalizeSourceRef(meta.source)
  const returnType = normalizeReturnTypeId(meta.returnType)
  const branchOrigin = normalizeBranchOrigin(meta.branchOrigin)

  return {
    id,
    batchId,
    title,
    text,
    status: status as BrainstormCandidateStatus,
    feedback,
    edited: record.edited === true,
    parentId: parentId || null,
    revisions:
      revisions.length > 0
        ? revisions
        : [
            {
              title,
              text,
              createdAt: nowIso(),
              reason: 'generated',
              returnType,
            },
          ],
    meta: {
      source,
      returnType,
      branchOrigin,
    },
  }
}

export function normalizeStoredBatch(value: unknown): BrainstormBatch | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const record = value as Record<string, unknown>
  const id = cleanText(record.id)
  const createdAt = cleanText(record.createdAt)
  const premise = cleanMultilineText(record.premise)
  const candidateIds = Array.isArray(record.candidateIds)
    ? record.candidateIds.map((value) => cleanText(value)).filter(Boolean)
    : []

  if (!id || !createdAt || !premise || candidateIds.length === 0) return null

  const requestRecord =
    record.request && typeof record.request === 'object'
      ? (record.request as Record<string, unknown>)
      : {}

  const request: BrainstormGenerateRequest = {
    premise: cleanMultilineText(requestRecord.premise) || premise,
    count: clampResultCount(requestRecord.count),
    constraints: cleanMultilineText(requestRecord.constraints),
    examples: cleanExamples(requestRecord.examples),
    mode: cleanText(requestRecord.mode) || 'freeform',
    outputDomain: normalizeOutputDomain(requestRecord.outputDomain),
    batchShape: normalizeBatchShape(requestRecord.batchShape),
    returnTypes: normalizeReturnTypes(requestRecord.returnTypes),
    source: normalizeSourceRef(requestRecord.source),
  }

  return { id, createdAt, premise, request, candidateIds }
}

export function classifyError(status: number | undefined): BrainstormErrorKind {
  if (status === 401) return 'auth'
  if (status === 402) return 'mana'
  if (status === 408) return 'network'
  if (status === 404 || status === 503) return 'server'
  if (status && status >= 500) return 'provider'
  return 'network'
}

/*
 * Candidate state-transition logic. Each function mutates a single
 * BrainstormCandidate and has no dependency on candidates.value or any other
 * store-scoped ref, so the store's own action functions are thin
 * findCandidate-then-delegate wrappers around these.
 */

export function applyCandidateStatus(
  candidate: BrainstormCandidate,
  status: BrainstormCandidateStatus,
): void {
  candidate.status = status
  if (status === 'kept') candidate.feedback = ''
}

export function applyCandidateEdit(
  candidate: BrainstormCandidate,
  patch: { title?: string; text?: string },
): boolean {
  const nextTitle =
    patch.title === undefined ? candidate.title : cleanText(patch.title)
  const nextText =
    patch.text === undefined ? candidate.text : cleanMultilineText(patch.text)

  if (!nextText) return false
  if (nextTitle === candidate.title && nextText === candidate.text) return true

  candidate.title = nextTitle
  candidate.text = nextText
  candidate.edited = true
  candidate.revisions.push({
    ...(nextTitle ? { title: nextTitle } : {}),
    text: nextText,
    createdAt: nowIso(),
    reason: 'edited',
    returnType: candidate.meta.returnType ?? null,
  })
  return true
}

export function applyCandidateRevisionRestore(
  candidate: BrainstormCandidate,
  revisionIndex: number,
): boolean {
  if (!Number.isInteger(revisionIndex) || revisionIndex < 0) return false

  const revision = candidate.revisions[revisionIndex]
  if (!revision) return false

  const nextTitle = cleanText(revision.title)
  const nextText = cleanMultilineText(revision.text)
  if (!nextText) return false

  const nextReturnType =
    normalizeReturnTypeId(revision.returnType) ??
    candidate.meta.returnType ??
    null
  if (
    nextTitle === candidate.title &&
    nextText === candidate.text &&
    nextReturnType === (candidate.meta.returnType ?? null)
  ) {
    return true
  }

  candidate.title = nextTitle
  candidate.text = nextText
  candidate.meta.returnType = nextReturnType
  candidate.edited = true
  candidate.revisions.push({
    ...(nextTitle ? { title: nextTitle } : {}),
    text: nextText,
    createdAt: nowIso(),
    reason: 'restored',
    returnType: nextReturnType,
  })
  return true
}

export function applyCandidateRegeneration(
  candidate: BrainstormCandidate,
  generated: BrainstormGeneratedCandidate,
): boolean {
  const title = cleanText(generated.title)
  const text = cleanMultilineText(generated.text)
  if (!text) return false

  const returnType =
    normalizeReturnTypeId(generated.returnType) ??
    candidate.meta.returnType ??
    null
  candidate.title = title
  candidate.text = text
  candidate.status = 'pending'
  candidate.feedback = ''
  candidate.edited = false
  candidate.meta.returnType = returnType
  candidate.revisions.push({
    ...(title ? { title } : {}),
    text,
    createdAt: nowIso(),
    reason: 'regenerated',
    returnType,
  })
  return true
}

/** The exact parent-revision lineage a branch's child candidate is stamped with. */
export function computeBranchOrigin(
  parent: BrainstormCandidate,
): BrainstormBranchOrigin {
  return {
    candidateId: parent.id,
    revisionIndex: Math.max(0, parent.revisions.length - 1),
    ...(parent.title ? { title: parent.title } : {}),
    text: parent.text,
  }
}
