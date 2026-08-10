import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useServerStore } from '@/stores/serverStore'
import { performFetch } from '@/stores/utils'
import {
  BRAINSTORM_DEFAULT_RESULTS,
  BRAINSTORM_MAX_RESULTS,
  BRAINSTORM_MIN_RESULTS,
} from '@/types/brainstorm'
import type {
  BrainstormBatch,
  BrainstormCandidate,
  BrainstormCandidateRevision,
  BrainstormCandidateStatus,
  BrainstormError,
  BrainstormErrorKind,
  BrainstormGenerateData,
  BrainstormGeneratedCandidate,
  BrainstormGeneratePayload,
  BrainstormGenerateRequest,
  BrainstormGenerationState,
  BrainstormReferenceCandidate,
  BrainstormServerSnapshot,
  BrainstormSessionSnapshot,
  BrainstormSourceRef,
} from '@/types/brainstorm'

const STORAGE_KEY = 'kindrobots:brainstorm-session:v1'
const STORAGE_VERSION = 1 as const
const GENERATION_TIMEOUT_MS = 60_000

let localIdSequence = 0

function nowIso(): string {
  return new Date().toISOString()
}

function createLocalId(prefix: 'batch' | 'candidate'): string {
  localIdSequence += 1
  const uuid = globalThis.crypto?.randomUUID?.()
  return `${prefix}-${uuid || `${Date.now()}-${localIdSequence}`}`
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function cleanMultilineText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanExamples(values: unknown): string[] {
  if (!Array.isArray(values)) return []

  return values
    .map((value) => cleanMultilineText(value))
    .filter((value, index, all) => value && all.indexOf(value) === index)
    .slice(0, 20)
}

function clampResultCount(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return BRAINSTORM_DEFAULT_RESULTS
  return Math.min(
    BRAINSTORM_MAX_RESULTS,
    Math.max(BRAINSTORM_MIN_RESULTS, Math.round(parsed)),
  )
}

function normalizeGeneratedCandidates(
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

    if (!text) return null

    const duplicateKey = text.toLocaleLowerCase().replace(/\s+/g, ' ').trim()
    if (seen.has(duplicateKey)) return null
    seen.add(duplicateKey)

    candidates.push({
      text,
      ...(title ? { title } : {}),
    })
  }

  return candidates.length === expectedCount ? candidates : null
}

function normalizeSourceRef(value: unknown): BrainstormSourceRef | null {
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

function normalizeRevision(value: unknown): BrainstormCandidateRevision | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const record = value as Record<string, unknown>
  const text = cleanMultilineText(record.text)
  const title = cleanText(record.title)
  const createdAt = cleanText(record.createdAt)
  const reason = record.reason

  if (
    !text ||
    !createdAt ||
    !['generated', 'edited', 'regenerated', 'branched'].includes(String(reason))
  ) {
    return null
  }

  return {
    text,
    createdAt,
    reason: reason as BrainstormCandidateRevision['reason'],
    ...(title ? { title } : {}),
  }
}

function normalizeStoredCandidate(value: unknown): BrainstormCandidate | null {
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
        .filter((revision): revision is BrainstormCandidateRevision => Boolean(revision))
    : []

  const source =
    record.meta && typeof record.meta === 'object'
      ? normalizeSourceRef((record.meta as Record<string, unknown>).source)
      : null

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
        : [{ title, text, createdAt: nowIso(), reason: 'generated' }],
    meta: {
      source,
    },
  }
}

function normalizeStoredBatch(value: unknown): BrainstormBatch | null {
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
    source: normalizeSourceRef(requestRecord.source),
  }

  return { id, createdAt, premise, request, candidateIds }
}

function classifyError(status: number | undefined): BrainstormErrorKind {
  if (status === 401) return 'auth'
  if (status === 402) return 'mana'
  if (status === 408) return 'network'
  if (status === 404 || status === 503) return 'server'
  if (status && status >= 500) return 'provider'
  return 'network'
}

export const useBrainstormStore = defineStore('brainstormStore', () => {
  const premise = ref('')
  const resultCount = ref(BRAINSTORM_DEFAULT_RESULTS)
  const constraints = ref('')
  const examples = ref<string[]>([])
  const mode = ref('freeform')
  const source = ref<BrainstormSourceRef | null>(null)

  const candidates = ref<BrainstormCandidate[]>([])
  const batches = ref<BrainstormBatch[]>([])
  const activeBatchId = ref<string | null>(null)

  const generationState = ref<BrainstormGenerationState>('idle')
  const generationError = ref<BrainstormError | null>(null)
  const generationTargetId = ref<string | null>(null)
  const lastGeneratedAt = ref<string | null>(null)
  const isInitialized = ref(false)

  let persistenceReady = false

  const activeBatch = computed<BrainstormBatch | null>(() => {
    if (!activeBatchId.value) return null
    return (
      batches.value.find((batch) => batch.id === activeBatchId.value) ?? null
    )
  })

  const activeCandidates = computed<BrainstormCandidate[]>(() => {
    const batch = activeBatch.value
    if (!batch) return []

    const byId = new Map(
      candidates.value.map((candidate) => [candidate.id, candidate]),
    )

    return batch.candidateIds
      .map((candidateId) => byId.get(candidateId))
      .filter((candidate): candidate is BrainstormCandidate => Boolean(candidate))
  })

  const keptCandidates = computed(() =>
    activeCandidates.value.filter((candidate) => candidate.status === 'kept'),
  )

  const rejectedCandidates = computed(() =>
    activeCandidates.value.filter((candidate) => candidate.status === 'rejected'),
  )

  const pendingCandidates = computed(() =>
    activeCandidates.value.filter((candidate) => candidate.status === 'pending'),
  )

  const isGenerating = computed(
    () => generationState.value === 'generating',
  )

  const canGenerate = computed(
    () => Boolean(premise.value.trim()) && !isGenerating.value,
  )

  function sessionSnapshot(): BrainstormSessionSnapshot {
    return {
      version: STORAGE_VERSION,
      premise: premise.value,
      resultCount: resultCount.value,
      constraints: constraints.value,
      examples: examples.value,
      mode: mode.value,
      source: source.value,
      candidates: candidates.value,
      batches: batches.value,
      activeBatchId: activeBatchId.value,
      lastGeneratedAt: lastGeneratedAt.value,
    }
  }

  function persistSession(): void {
    if (!import.meta.client || !persistenceReady) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionSnapshot()))
    } catch {
      // Brainstorm remains usable if private browser storage is unavailable.
    }
  }

  function restoreSession(raw: string): boolean {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      if (parsed.version !== STORAGE_VERSION) return false

      const restoredCandidates = Array.isArray(parsed.candidates)
        ? parsed.candidates
            .map((candidate) => normalizeStoredCandidate(candidate))
            .filter((candidate): candidate is BrainstormCandidate => Boolean(candidate))
        : []
      const restoredCandidateIds = new Set(
        restoredCandidates.map((candidate) => candidate.id),
      )
      const restoredBatches = Array.isArray(parsed.batches)
        ? parsed.batches
            .map((batch) => normalizeStoredBatch(batch))
            .filter((batch): batch is BrainstormBatch => Boolean(batch))
            .map((batch) => ({
              ...batch,
              candidateIds: batch.candidateIds.filter((id) =>
                restoredCandidateIds.has(id),
              ),
            }))
            .filter((batch) => batch.candidateIds.length > 0)
        : []

      const requestedActiveBatchId = cleanText(parsed.activeBatchId)
      const fallbackActiveBatchId = restoredBatches.at(-1)?.id ?? null

      premise.value = cleanMultilineText(parsed.premise)
      resultCount.value = clampResultCount(parsed.resultCount)
      constraints.value = cleanMultilineText(parsed.constraints)
      examples.value = cleanExamples(parsed.examples)
      mode.value = cleanText(parsed.mode) || 'freeform'
      source.value = normalizeSourceRef(parsed.source)
      candidates.value = restoredCandidates
      batches.value = restoredBatches
      activeBatchId.value = restoredBatches.some(
        (batch) => batch.id === requestedActiveBatchId,
      )
        ? requestedActiveBatchId
        : fallbackActiveBatchId
      lastGeneratedAt.value = cleanText(parsed.lastGeneratedAt) || null
      return true
    } catch {
      return false
    }
  }

  function initializeSession(): void {
    if (isInitialized.value) return

    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) restoreSession(stored)
      } catch {
        // Private mode / storage denial should not block the workbench.
      }
    }

    persistenceReady = true
    isInitialized.value = true
  }

  function setPremise(value: string): void {
    premise.value = value
  }

  function setResultCount(value: number): void {
    resultCount.value = clampResultCount(value)
  }

  function setConstraints(value: string): void {
    constraints.value = value
  }

  function setExamples(values: string[]): void {
    examples.value = cleanExamples(values)
  }

  function setExamplesFromText(value: string): void {
    setExamples(value.split(/\r?\n/))
  }

  function setMode(value: string): void {
    mode.value = cleanText(value) || 'freeform'
  }

  function setSource(value: BrainstormSourceRef | null): void {
    source.value = value ? normalizeSourceRef(value) : null
  }

  function setActiveBatch(batchId: string): boolean {
    if (!batches.value.some((batch) => batch.id === batchId)) return false
    activeBatchId.value = batchId
    return true
  }

  function clearGenerationError(): void {
    generationError.value = null
    if (generationState.value === 'error') generationState.value = 'idle'
  }

  function setGenerationError(error: BrainstormError): void {
    generationState.value = 'error'
    generationError.value = error
  }

  function findCandidate(candidateId: string): BrainstormCandidate | null {
    return (
      candidates.value.find((candidate) => candidate.id === candidateId) ?? null
    )
  }

  function setCandidateStatus(
    candidateId: string,
    status: BrainstormCandidateStatus,
  ): boolean {
    const candidate = findCandidate(candidateId)
    if (!candidate) return false

    candidate.status = status
    if (status === 'kept') candidate.feedback = ''
    return true
  }

  function keepCandidate(candidateId: string): boolean {
    return setCandidateStatus(candidateId, 'kept')
  }

  function rejectCandidate(candidateId: string): boolean {
    return setCandidateStatus(candidateId, 'rejected')
  }

  function resetCandidateStatus(candidateId: string): boolean {
    return setCandidateStatus(candidateId, 'pending')
  }

  function setCandidateFeedback(candidateId: string, value: string): boolean {
    const candidate = findCandidate(candidateId)
    if (!candidate) return false
    candidate.feedback = value
    return true
  }

  function editCandidate(
    candidateId: string,
    patch: { title?: string; text?: string },
  ): boolean {
    const candidate = findCandidate(candidateId)
    if (!candidate) return false

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
    })
    return true
  }

  function removeCandidate(candidateId: string): boolean {
    const index = candidates.value.findIndex(
      (candidate) => candidate.id === candidateId,
    )
    if (index < 0) return false

    candidates.value.splice(index, 1)
    for (const batch of batches.value) {
      batch.candidateIds = batch.candidateIds.filter((id) => id !== candidateId)
    }
    batches.value = batches.value.filter((batch) => batch.candidateIds.length > 0)

    if (
      activeBatchId.value &&
      !batches.value.some((batch) => batch.id === activeBatchId.value)
    ) {
      activeBatchId.value = batches.value.at(-1)?.id ?? null
    }

    return true
  }

  function createCandidate(
    generated: BrainstormGeneratedCandidate,
    batchId: string,
    reason: BrainstormCandidateRevision['reason'],
    parentId: string | null = null,
  ): BrainstormCandidate {
    const createdAt = nowIso()
    const title = cleanText(generated.title)
    const text = cleanMultilineText(generated.text)

    return {
      id: createLocalId('candidate'),
      batchId,
      title,
      text,
      status: 'pending',
      feedback: '',
      edited: false,
      parentId,
      revisions: [
        {
          ...(title ? { title } : {}),
          text,
          createdAt,
          reason,
        },
      ],
      meta: {
        source: source.value,
        intent: source.value?.intent || null,
      },
    }
  }

  function addGeneratedBatch(
    request: BrainstormGenerateRequest,
    generated: BrainstormGeneratedCandidate[],
  ): BrainstormBatch {
    const batchId = createLocalId('batch')
    const nextCandidates = generated.map((candidate) =>
      createCandidate(candidate, batchId, 'generated'),
    )
    const batch: BrainstormBatch = {
      id: batchId,
      createdAt: nowIso(),
      premise: request.premise,
      request,
      candidateIds: nextCandidates.map((candidate) => candidate.id),
    }

    candidates.value.push(...nextCandidates)
    batches.value.push(batch)
    activeBatchId.value = batchId
    return batch
  }

  function replaceCandidateWithGenerated(
    candidateId: string,
    generated: BrainstormGeneratedCandidate,
  ): boolean {
    const candidate = findCandidate(candidateId)
    if (!candidate) return false

    const title = cleanText(generated.title)
    const text = cleanMultilineText(generated.text)
    if (!text) return false

    candidate.title = title
    candidate.text = text
    candidate.status = 'pending'
    candidate.feedback = ''
    candidate.edited = false
    candidate.revisions.push({
      ...(title ? { title } : {}),
      text,
      createdAt: nowIso(),
      reason: 'regenerated',
    })
    return true
  }

  function appendBranchCandidate(
    parent: BrainstormCandidate,
    generated: BrainstormGeneratedCandidate,
  ): BrainstormCandidate | null {
    const batch = batches.value.find((entry) => entry.id === parent.batchId)
    if (!batch) return null

    const child = createCandidate(
      generated,
      parent.batchId,
      'branched',
      parent.id,
    )
    candidates.value.push(child)

    const parentIndex = batch.candidateIds.indexOf(parent.id)
    batch.candidateIds.splice(
      parentIndex >= 0 ? parentIndex + 1 : batch.candidateIds.length,
      0,
      child.id,
    )
    activeBatchId.value = batch.id
    return child
  }

  function requestForCurrentComposer(): BrainstormGenerateRequest | null {
    const cleanPremise = cleanMultilineText(premise.value)
    if (!cleanPremise) {
      setGenerationError({
        kind: 'validation',
        message: 'Give Brainstorm a premise before asking for ideas.',
        status: null,
      })
      return null
    }

    return {
      premise: cleanPremise,
      count: clampResultCount(resultCount.value),
      constraints: cleanMultilineText(constraints.value),
      examples: cleanExamples(examples.value),
      mode: cleanText(mode.value) || 'freeform',
      source: source.value,
    }
  }

  function requestForCandidate(
    candidate: BrainstormCandidate,
  ): BrainstormGenerateRequest {
    const batch = batches.value.find((entry) => entry.id === candidate.batchId)
    const originalRequest = batch?.request
    const referenceCandidate: BrainstormReferenceCandidate = {
      ...(candidate.title ? { title: candidate.title } : {}),
      text: candidate.text,
    }

    return {
      premise:
        originalRequest?.premise || cleanMultilineText(premise.value) || candidate.text,
      count: 1,
      constraints:
        originalRequest?.constraints || cleanMultilineText(constraints.value),
      examples: originalRequest?.examples || cleanExamples(examples.value),
      mode: originalRequest?.mode || cleanText(mode.value) || 'freeform',
      source: originalRequest?.source ?? source.value,
      referenceCandidate,
      feedback: cleanMultilineText(candidate.feedback),
    }
  }

  async function activeServerSnapshot(): Promise<BrainstormServerSnapshot | null> {
    const serverStore = useServerStore()
    await serverStore.initialize({ fetchRemote: true })
    const activeServer = serverStore.activeTextServer

    if (!activeServer) {
      setGenerationError({
        kind: 'server',
        message: 'No compatible text server is available for Brainstorm.',
        status: 503,
      })
      return null
    }

    return {
      id: activeServer.id ?? null,
      serverType: activeServer.serverType ?? null,
      baseUrl: activeServer.baseUrl ?? null,
      endpointPath: activeServer.endpointPath ?? null,
      model: activeServer.model ?? null,
    }
  }

  async function runGeneration(
    request: BrainstormGenerateRequest,
  ): Promise<BrainstormGeneratedCandidate[] | null> {
    clearGenerationError()
    generationState.value = 'generating'
    generationTargetId.value =
      request.replaceCandidateId || request.parentCandidateId || null

    const server = await activeServerSnapshot()
    if (!server) {
      generationTargetId.value = null
      return null
    }

    const payload: BrainstormGeneratePayload = {
      ...request,
      server,
    }

    const result = await performFetch<BrainstormGenerateData>(
      '/api/brainstorm/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      1,
      GENERATION_TIMEOUT_MS,
    )

    generationTargetId.value = null

    if (!result.success) {
      setGenerationError({
        kind: classifyError(result.status),
        message: result.message || 'Brainstorm generation failed.',
        status: result.status ?? null,
      })
      return null
    }

    const normalized = normalizeGeneratedCandidates(
      result.data?.candidates,
      request.count,
    )

    if (!normalized) {
      setGenerationError({
        kind: 'malformed',
        message:
          'The text server returned an incomplete, duplicate, or malformed Brainstorm batch.',
        status: result.status ?? null,
      })
      return null
    }

    generationState.value = 'success'
    generationError.value = null
    lastGeneratedAt.value = nowIso()
    return normalized
  }

  async function generateBatch(): Promise<boolean> {
    const request = requestForCurrentComposer()
    if (!request) return false

    const generated = await runGeneration(request)
    if (!generated) return false

    addGeneratedBatch(request, generated)
    return true
  }

  async function regenerateCandidate(candidateId: string): Promise<boolean> {
    const candidate = findCandidate(candidateId)
    if (!candidate) return false

    const request: BrainstormGenerateRequest = {
      ...requestForCandidate(candidate),
      replaceCandidateId: candidate.id,
    }
    const generated = await runGeneration(request)
    if (!generated?.[0]) return false

    return replaceCandidateWithGenerated(candidate.id, generated[0])
  }

  async function branchCandidate(candidateId: string): Promise<boolean> {
    const candidate = findCandidate(candidateId)
    if (!candidate) return false

    const request: BrainstormGenerateRequest = {
      ...requestForCandidate(candidate),
      parentCandidateId: candidate.id,
      feedback: '',
    }
    const generated = await runGeneration(request)
    if (!generated?.[0]) return false

    return Boolean(appendBranchCandidate(candidate, generated[0]))
  }

  function clearSession(): void {
    premise.value = ''
    resultCount.value = BRAINSTORM_DEFAULT_RESULTS
    constraints.value = ''
    examples.value = []
    mode.value = 'freeform'
    source.value = null
    candidates.value = []
    batches.value = []
    activeBatchId.value = null
    generationState.value = 'idle'
    generationError.value = null
    generationTargetId.value = null
    lastGeneratedAt.value = null
  }

  if (import.meta.client) {
    watch(
      () => ({
        premise: premise.value,
        resultCount: resultCount.value,
        constraints: constraints.value,
        examples: examples.value,
        mode: mode.value,
        source: source.value,
        candidates: candidates.value,
        batches: batches.value,
        activeBatchId: activeBatchId.value,
        lastGeneratedAt: lastGeneratedAt.value,
      }),
      persistSession,
      { deep: true },
    )
  }

  return {
    premise,
    resultCount,
    constraints,
    examples,
    mode,
    source,
    candidates,
    batches,
    activeBatchId,
    generationState,
    generationError,
    generationTargetId,
    lastGeneratedAt,
    isInitialized,
    activeBatch,
    activeCandidates,
    keptCandidates,
    rejectedCandidates,
    pendingCandidates,
    isGenerating,
    canGenerate,
    initializeSession,
    setPremise,
    setResultCount,
    setConstraints,
    setExamples,
    setExamplesFromText,
    setMode,
    setSource,
    setActiveBatch,
    clearGenerationError,
    setCandidateStatus,
    keepCandidate,
    rejectCandidate,
    resetCandidateStatus,
    setCandidateFeedback,
    editCandidate,
    removeCandidate,
    generateBatch,
    regenerateCandidate,
    branchCandidate,
    clearSession,
  }
})
