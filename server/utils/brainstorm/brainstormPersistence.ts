import { createError } from 'h3'
import {
  BRAINSTORM_MAX_RESULTS,
  BRAINSTORM_MIN_RESULTS,
  BRAINSTORM_RETURN_TYPES,
} from '../../../types/brainstorm'
import type {
  BrainstormBatch,
  BrainstormBatchShape,
  BrainstormCandidate,
  BrainstormCandidateRevision,
  BrainstormGenerateRequest,
  BrainstormReturnTypeId,
  BrainstormReturnTypeRequest,
  BrainstormSavedSession,
  BrainstormSessionSaveRequest,
  BrainstormSessionSnapshot,
  BrainstormSourceRef,
} from '../../../types/brainstorm'

const MAX_NAME_LENGTH = 255
const MAX_PREMISE_LENGTH = 12_000
const MAX_CONSTRAINT_LENGTH = 8_000
const MAX_EXAMPLES = 20
const MAX_EXAMPLE_LENGTH = 4_000
const MAX_CANDIDATES = 500
const MAX_REVISIONS_PER_CANDIDATE = 100
const MAX_BATCHES = 100
const MAX_TEXT_LENGTH = 4_000
const MAX_FEEDBACK_LENGTH = 4_000
const MAX_SERIALIZED_BATCHES = 1_000_000
const MAX_SERIALIZED_META = 64_000
const RETURN_TYPE_IDS = new Set<BrainstormReturnTypeId>(
  BRAINSTORM_RETURN_TYPES.map((entry) => entry.id),
)
const REVISION_REASONS = new Set([
  'generated',
  'edited',
  'regenerated',
  'branched',
  'restored',
])
const CANDIDATE_STATUSES = new Set(['pending', 'kept', 'rejected'])

export type BrainstormStoredCandidateRow = {
  clientId: string
  batchId: string
  position: number
  title: string | null
  text: string
  status: string
  feedback: string | null
  edited: boolean
  parentClientId: string | null
  revisions: string
  meta: string | null
}

export type BrainstormStoredSessionRow = {
  id: number
  createdAt: Date
  updatedAt: Date | null
  name: string
  premise: string
  resultCount: number
  constraints: string | null
  examples: string | null
  mode: string
  batchShape: string
  returnTypes: string | null
  source: string | null
  batches: string
  activeBatchId: string | null
  lastGeneratedAt: Date | null
  Candidates: BrainstormStoredCandidateRow[]
}

function badRequest(message: string): never {
  throw createError({ statusCode: 400, message })
}

function text(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  const normalized = text(value, maxLength)
  if (!normalized) badRequest(`${label} is required.`)
  return normalized
}

function optionalText(value: unknown, maxLength: number): string {
  return text(value, maxLength)
}

function dateIso(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return new Date().toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

function returnType(value: unknown): BrainstormReturnTypeId | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim() as BrainstormReturnTypeId
  return RETURN_TYPE_IDS.has(normalized) ? normalized : null
}

function normalizeExamples(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .slice(0, MAX_EXAMPLES)
    .map((entry) => optionalText(entry, MAX_EXAMPLE_LENGTH))
    .filter((entry, index, all) => Boolean(entry) && all.indexOf(entry) === index)
}

function normalizeReturnTypes(value: unknown): BrainstormReturnTypeRequest[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<BrainstormReturnTypeId>()
  const result: BrainstormReturnTypeRequest[] = []

  for (const raw of value.slice(0, BRAINSTORM_RETURN_TYPES.length)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const record = raw as Record<string, unknown>
    const id = returnType(record.id)
    if (!id || seen.has(id)) continue
    const rawCount = Number(record.count)
    const count =
      Number.isInteger(rawCount) && rawCount > 0
        ? Math.min(BRAINSTORM_MAX_RESULTS, rawCount)
        : undefined
    result.push({ id, ...(count ? { count } : {}) })
    seen.add(id)
  }

  return result
}

function normalizeSource(value: unknown): BrainstormSourceRef | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const modelType = optionalText(record.modelType, 80)
  const id = Number(record.id)
  const slug = optionalText(record.slug, 160)
  const intent = optionalText(record.intent, 1_000)
  if (!modelType) return null

  return {
    modelType,
    ...(Number.isInteger(id) && id > 0 ? { id } : {}),
    ...(slug ? { slug } : {}),
    ...(intent ? { intent } : {}),
  }
}

function normalizeRevision(value: unknown): BrainstormCandidateRevision | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const revisionText = requiredText(
    record.text,
    'candidate revision text',
    MAX_TEXT_LENGTH,
  )
  const reason = typeof record.reason === 'string' ? record.reason.trim() : ''
  if (!REVISION_REASONS.has(reason)) return null
  const title = optionalText(record.title, 120)
  return {
    ...(title ? { title } : {}),
    text: revisionText,
    createdAt: dateIso(record.createdAt),
    reason: reason as BrainstormCandidateRevision['reason'],
    returnType: returnType(record.returnType),
  }
}

function normalizeCandidate(value: unknown): BrainstormCandidate {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    badRequest('Every saved Brainstorm candidate must be an object.')
  }
  const record = value as Record<string, unknown>
  const id = requiredText(record.id, 'candidate id', 200)
  const batchId = requiredText(record.batchId, 'candidate batch id', 200)
  const candidateText = requiredText(record.text, 'candidate text', MAX_TEXT_LENGTH)
  const status = typeof record.status === 'string' ? record.status.trim() : 'pending'
  if (!CANDIDATE_STATUSES.has(status)) {
    badRequest(`Candidate ${id} has an invalid status.`)
  }

  const rawRevisions = Array.isArray(record.revisions)
    ? record.revisions.slice(0, MAX_REVISIONS_PER_CANDIDATE)
    : []
  const revisions = rawRevisions
    .map((revision) => normalizeRevision(revision))
    .filter((revision): revision is BrainstormCandidateRevision => Boolean(revision))

  const title = optionalText(record.title, 120)
  const feedback = optionalText(record.feedback, MAX_FEEDBACK_LENGTH)
  const parentId = optionalText(record.parentId, 200)
  const meta =
    record.meta && typeof record.meta === 'object' && !Array.isArray(record.meta)
      ? record.meta as BrainstormCandidate['meta']
      : {}

  const serializedMeta = JSON.stringify(meta)
  if (serializedMeta.length > MAX_SERIALIZED_META) {
    badRequest(`Candidate ${id} has too much metadata to save.`)
  }

  const normalizedRevisions = revisions.length
    ? revisions
    : [{
        ...(title ? { title } : {}),
        text: candidateText,
        createdAt: new Date().toISOString(),
        reason: 'generated' as const,
        returnType: returnType(meta.returnType),
      }]

  return {
    id,
    batchId,
    title,
    text: candidateText,
    status: status as BrainstormCandidate['status'],
    feedback,
    edited: record.edited === true,
    parentId: parentId || null,
    revisions: normalizedRevisions,
    meta,
  }
}

function normalizeGenerateRequest(value: unknown): BrainstormGenerateRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { premise: '', count: BRAINSTORM_MIN_RESULTS }
  }
  const record = value as Record<string, unknown>
  const count = Number(record.count)
  const normalizedCount =
    Number.isInteger(count) && count >= BRAINSTORM_MIN_RESULTS && count <= BRAINSTORM_MAX_RESULTS
      ? count
      : BRAINSTORM_MIN_RESULTS

  return {
    premise: optionalText(record.premise, MAX_PREMISE_LENGTH),
    count: normalizedCount,
    constraints: optionalText(record.constraints, MAX_CONSTRAINT_LENGTH),
    examples: normalizeExamples(record.examples),
    mode: optionalText(record.mode, 80) || 'freeform',
    batchShape: record.batchShape === 'assortment' ? 'assortment' : 'focused',
    returnTypes: normalizeReturnTypes(record.returnTypes),
    source: normalizeSource(record.source),
  }
}

function normalizeBatch(value: unknown): BrainstormBatch | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const id = optionalText(record.id, 200)
  const premise = optionalText(record.premise, MAX_PREMISE_LENGTH)
  const candidateIds = Array.isArray(record.candidateIds)
    ? record.candidateIds
        .map((candidateId) => optionalText(candidateId, 200))
        .filter(Boolean)
        .slice(0, MAX_CANDIDATES)
    : []
  if (!id || !premise || candidateIds.length === 0) return null

  return {
    id,
    createdAt: dateIso(record.createdAt),
    premise,
    request: normalizeGenerateRequest(record.request),
    candidateIds,
  }
}

function normalizeBatches(value: unknown): BrainstormBatch[] {
  if (!Array.isArray(value)) return []
  const batches = value
    .slice(0, MAX_BATCHES)
    .map((batch) => normalizeBatch(batch))
    .filter((batch): batch is BrainstormBatch => Boolean(batch))
  const serialized = JSON.stringify(batches)
  if (serialized.length > MAX_SERIALIZED_BATCHES) {
    badRequest('Brainstorm batch history is too large to save in one session.')
  }
  return batches
}

function normalizeSnapshot(value: unknown): BrainstormSessionSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    badRequest('A Brainstorm session snapshot is required.')
  }
  const record = value as Record<string, unknown>
  if (record.version !== 1) badRequest('Unsupported Brainstorm session version.')

  const rawCount = Number(record.resultCount)
  if (
    !Number.isInteger(rawCount) ||
    rawCount < BRAINSTORM_MIN_RESULTS ||
    rawCount > BRAINSTORM_MAX_RESULTS
  ) {
    badRequest(
      `Brainstorm result count must be ${BRAINSTORM_MIN_RESULTS}-${BRAINSTORM_MAX_RESULTS}.`,
    )
  }

  const rawCandidates = Array.isArray(record.candidates)
    ? record.candidates.slice(0, MAX_CANDIDATES)
    : []
  if (Array.isArray(record.candidates) && record.candidates.length > MAX_CANDIDATES) {
    badRequest(`A Brainstorm session can save at most ${MAX_CANDIDATES} candidates.`)
  }
  const candidates = rawCandidates.map((candidate) => normalizeCandidate(candidate))
  const ids = new Set(candidates.map((candidate) => candidate.id))
  if (ids.size !== candidates.length) {
    badRequest('Brainstorm candidate ids must be unique within a session.')
  }

  const batches = normalizeBatches(record.batches)
  const knownIds = new Set(candidates.map((candidate) => candidate.id))
  for (const batch of batches) {
    if (batch.candidateIds.some((candidateId) => !knownIds.has(candidateId))) {
      badRequest(`Brainstorm batch ${batch.id} references a missing candidate.`)
    }
  }

  const batchShape: BrainstormBatchShape =
    record.batchShape === 'assortment' ? 'assortment' : 'focused'
  const activeBatchId = optionalText(record.activeBatchId, 200) || null
  if (activeBatchId && !batches.some((batch) => batch.id === activeBatchId)) {
    badRequest('The active Brainstorm batch must exist in the saved batch history.')
  }

  return {
    version: 1,
    premise: requiredText(record.premise, 'premise', MAX_PREMISE_LENGTH),
    resultCount: rawCount,
    constraints: optionalText(record.constraints, MAX_CONSTRAINT_LENGTH),
    examples: normalizeExamples(record.examples),
    mode: optionalText(record.mode, 80) || 'freeform',
    batchShape,
    returnTypes: normalizeReturnTypes(record.returnTypes),
    source: normalizeSource(record.source),
    candidates,
    batches,
    activeBatchId,
    lastGeneratedAt:
      typeof record.lastGeneratedAt === 'string' && record.lastGeneratedAt.trim()
        ? dateIso(record.lastGeneratedAt)
        : null,
  }
}

export function normalizeBrainstormSessionSaveRequest(
  value: unknown,
): BrainstormSessionSaveRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    badRequest('A Brainstorm save request is required.')
  }
  const record = value as Record<string, unknown>
  return {
    name: requiredText(record.name, 'session name', MAX_NAME_LENGTH),
    snapshot: normalizeSnapshot(record.snapshot),
  }
}

export function brainstormSessionData(
  userId: number,
  request: BrainstormSessionSaveRequest,
) {
  const { snapshot } = request
  return {
    userId,
    name: request.name,
    premise: snapshot.premise,
    resultCount: snapshot.resultCount,
    constraints: snapshot.constraints || null,
    examples: JSON.stringify(snapshot.examples),
    mode: snapshot.mode,
    batchShape: snapshot.batchShape,
    returnTypes: JSON.stringify(snapshot.returnTypes),
    source: snapshot.source ? JSON.stringify(snapshot.source) : null,
    batches: JSON.stringify(snapshot.batches),
    activeBatchId: snapshot.activeBatchId,
    lastGeneratedAt: snapshot.lastGeneratedAt
      ? new Date(snapshot.lastGeneratedAt)
      : null,
    isActive: true,
  }
}

export function brainstormCandidateCreateData(
  candidates: BrainstormCandidate[],
) {
  return candidates.map((candidate, position) => ({
    clientId: candidate.id,
    batchId: candidate.batchId,
    position,
    title: candidate.title || null,
    text: candidate.text,
    status: candidate.status,
    feedback: candidate.feedback || null,
    edited: candidate.edited,
    parentClientId: candidate.parentId || null,
    revisions: JSON.stringify(candidate.revisions),
    meta: JSON.stringify(candidate.meta || {}),
  }))
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function storedBrainstormSession(
  row: BrainstormStoredSessionRow,
): BrainstormSavedSession {
  const candidates: BrainstormCandidate[] = row.Candidates.map((candidate) => ({
    id: candidate.clientId,
    batchId: candidate.batchId,
    title: candidate.title || '',
    text: candidate.text,
    status: CANDIDATE_STATUSES.has(candidate.status)
      ? candidate.status as BrainstormCandidate['status']
      : 'pending',
    feedback: candidate.feedback || '',
    edited: candidate.edited,
    parentId: candidate.parentClientId,
    revisions: parseJson<BrainstormCandidateRevision[]>(candidate.revisions, []),
    meta: parseJson<BrainstormCandidate['meta']>(candidate.meta, {}),
  }))

  const updatedAt = row.updatedAt ?? row.createdAt
  return {
    id: row.id,
    name: row.name,
    premise: row.premise,
    candidateCount: candidates.length,
    createdAt: row.createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    snapshot: {
      version: 1,
      premise: row.premise,
      resultCount: row.resultCount,
      constraints: row.constraints || '',
      examples: parseJson<string[]>(row.examples, []),
      mode: row.mode || 'freeform',
      batchShape: row.batchShape === 'assortment' ? 'assortment' : 'focused',
      returnTypes: parseJson<BrainstormReturnTypeRequest[]>(row.returnTypes, []),
      source: parseJson<BrainstormSourceRef | null>(row.source, null),
      candidates,
      batches: parseJson<BrainstormBatch[]>(row.batches, []),
      activeBatchId: row.activeBatchId,
      lastGeneratedAt: row.lastGeneratedAt?.toISOString() ?? null,
    },
  }
}
