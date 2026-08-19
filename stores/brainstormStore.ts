import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useServerStore } from '@/stores/serverStore'
import { performFetch } from '@/stores/utils'
import {
  applyCandidateEdit,
  applyCandidateRegeneration,
  applyCandidateRevisionRestore,
  applyCandidateStatus,
  classifyError,
  cleanExamples,
  cleanMultilineText,
  cleanText,
  clampResultCount,
  computeBranchOrigin,
  normalizeBatchShape,
  normalizeGeneratedCandidates,
  normalizeOutputDomain,
  normalizeReturnTypeId,
  normalizeReturnTypes,
  normalizeSourceRef,
  normalizeStoredBatch,
  normalizeStoredCandidate,
  nowIso,
  RETURN_TYPE_IDS,
} from '@/stores/helpers/brainstormCandidateLifecycle'
import {
  BRAINSTORM_DEFAULT_OUTPUT_DOMAIN,
  BRAINSTORM_DEFAULT_RESULTS,
  BRAINSTORM_MAX_RESULTS,
  BRAINSTORM_MIN_RESULTS,
} from '@/types/brainstorm'
import type {
  BrainstormBatch,
  BrainstormBatchShape,
  BrainstormCandidate,
  BrainstormCandidateRevision,
  BrainstormCandidateStatus,
  BrainstormError,
  BrainstormGenerateData,
  BrainstormGeneratedCandidate,
  BrainstormGeneratePayload,
  BrainstormGenerateRequest,
  BrainstormGenerationState,
  BrainstormOutputDomainId,
  BrainstormPersistenceState,
  BrainstormReferenceCandidate,
  BrainstormReturnTypeId,
  BrainstormReturnTypeRequest,
  BrainstormSavedSessionData,
  BrainstormSavedSessionSummary,
  BrainstormSavedSessionsData,
  BrainstormServerSnapshot,
  BrainstormSessionSaveRequest,
  BrainstormSessionSnapshot,
  BrainstormSourceRef,
} from '@/types/brainstorm'

// conductor brainstorm/t-021: the pure normalization and candidate
// state-transition logic that used to live in this file (nowIso through
// computeBranchOrigin) now lives in
// stores/helpers/brainstormCandidateLifecycle.ts, imported above, so it can
// be exercised by a plain-Node test without pulling in Pinia/useServerStore.
// See that file's header comment for why. Nothing below this point changed
// behavior; only where the pure half of it is defined.

const STORAGE_KEY = 'kindrobots:brainstorm-session:v1'
const SAVED_LINK_STORAGE_KEY = 'kindrobots:brainstorm-saved-link:v1'
const STORAGE_VERSION = 1 as const
const GENERATION_TIMEOUT_MS = 60_000
const PERSISTENCE_TIMEOUT_MS = 30_000

let localIdSequence = 0

function createLocalId(prefix: 'batch' | 'candidate'): string {
  localIdSequence += 1
  const uuid = globalThis.crypto?.randomUUID?.()
  return `${prefix}-${uuid || `${Date.now()}-${localIdSequence}`}`
}

function minimumResultCountForMix(
  entries: BrainstormReturnTypeRequest[],
): number {
  if (!entries.length) return BRAINSTORM_MIN_RESULTS
  return Math.min(
    BRAINSTORM_MAX_RESULTS,
    entries.reduce((total, entry) => total + (entry.count ?? 1), 0),
  )
}

export const useBrainstormStore = defineStore('brainstormStore', () => {
  const premise = ref('')
  const resultCount = ref(BRAINSTORM_DEFAULT_RESULTS)
  const constraints = ref('')
  const examples = ref<string[]>([])
  const mode = ref('freeform')
  const outputDomain = ref<BrainstormOutputDomainId>(
    BRAINSTORM_DEFAULT_OUTPUT_DOMAIN,
  )
  const batchShape = ref<BrainstormBatchShape>('focused')
  const returnTypes = ref<BrainstormReturnTypeRequest[]>([])
  const source = ref<BrainstormSourceRef | null>(null)

  const candidates = ref<BrainstormCandidate[]>([])
  const batches = ref<BrainstormBatch[]>([])
  const activeBatchId = ref<string | null>(null)

  const generationState = ref<BrainstormGenerationState>('idle')
  const generationError = ref<BrainstormError | null>(null)
  const generationTargetId = ref<string | null>(null)
  const lastGeneratedAt = ref<string | null>(null)

  const savedSessionId = ref<number | null>(null)
  const sessionName = ref('')
  const savedSessions = ref<BrainstormSavedSessionSummary[]>([])
  const persistenceState = ref<BrainstormPersistenceState>('idle')
  const persistenceError = ref<BrainstormError | null>(null)
  const lastSavedAt = ref<string | null>(null)

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
      .filter((candidate): candidate is BrainstormCandidate =>
        Boolean(candidate),
      )
  })

  const keptCandidates = computed(() =>
    activeCandidates.value.filter((candidate) => candidate.status === 'kept'),
  )

  // Kept candidates across every batch in the working session, not just the
  // active one -- the natural surface for a session-wide copy/export handoff
  // (t-011), since a user may keep ideas from several batches before exporting.
  const allKeptCandidates = computed(() =>
    candidates.value.filter((candidate) => candidate.status === 'kept'),
  )

  const rejectedCandidates = computed(() =>
    activeCandidates.value.filter(
      (candidate) => candidate.status === 'rejected',
    ),
  )

  const pendingCandidates = computed(() =>
    activeCandidates.value.filter(
      (candidate) => candidate.status === 'pending',
    ),
  )

  const minimumMixResults = computed(() =>
    batchShape.value === 'assortment'
      ? minimumResultCountForMix(returnTypes.value)
      : BRAINSTORM_MIN_RESULTS,
  )

  const isGenerating = computed(() => generationState.value === 'generating')
  const isPersisting = computed(
    () =>
      persistenceState.value === 'loading' ||
      persistenceState.value === 'saving',
  )

  const canGenerate = computed(
    () =>
      Boolean(premise.value.trim()) &&
      !isGenerating.value &&
      resultCount.value >= minimumMixResults.value,
  )

  const canSaveSession = computed(
    () =>
      Boolean(premise.value.trim()) &&
      Boolean(sessionName.value.trim()) &&
      !isPersisting.value,
  )

  const suggestedSessionName = computed(() => {
    const cleanPremise = cleanText(premise.value)
    if (!cleanPremise) return 'Untitled Brainstorm'
    return cleanPremise.length <= 60
      ? cleanPremise
      : `${cleanPremise.slice(0, 57).trimEnd()}…`
  })

  function sessionSnapshot(): BrainstormSessionSnapshot {
    return {
      version: STORAGE_VERSION,
      premise: premise.value,
      resultCount: resultCount.value,
      constraints: constraints.value,
      examples: examples.value,
      mode: mode.value,
      outputDomain: outputDomain.value,
      batchShape: batchShape.value,
      returnTypes: returnTypes.value,
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

  function persistSavedLink(): void {
    if (!import.meta.client || !persistenceReady) return
    try {
      if (savedSessionId.value && sessionName.value.trim()) {
        localStorage.setItem(
          SAVED_LINK_STORAGE_KEY,
          JSON.stringify({
            id: savedSessionId.value,
            name: sessionName.value.trim(),
          }),
        )
      } else {
        localStorage.removeItem(SAVED_LINK_STORAGE_KEY)
      }
    } catch {
      // Durable server persistence still works if browser storage is unavailable.
    }
  }

  function restoreSession(raw: string): boolean {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      if (parsed.version !== STORAGE_VERSION) return false

      const restoredCandidates = Array.isArray(parsed.candidates)
        ? parsed.candidates
            .map((candidate) => normalizeStoredCandidate(candidate))
            .filter((candidate): candidate is BrainstormCandidate =>
              Boolean(candidate),
            )
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
      const restoredShape = normalizeBatchShape(parsed.batchShape)
      const restoredReturnTypes = normalizeReturnTypes(parsed.returnTypes)
      const restoredMinimum =
        restoredShape === 'assortment'
          ? minimumResultCountForMix(restoredReturnTypes)
          : BRAINSTORM_MIN_RESULTS

      premise.value = cleanMultilineText(parsed.premise)
      resultCount.value = Math.max(
        clampResultCount(parsed.resultCount),
        restoredMinimum,
      )
      constraints.value = cleanMultilineText(parsed.constraints)
      examples.value = cleanExamples(parsed.examples)
      mode.value = cleanText(parsed.mode) || 'freeform'
      outputDomain.value = normalizeOutputDomain(parsed.outputDomain)
      batchShape.value = restoredShape
      returnTypes.value = restoredReturnTypes
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

  function restoreSavedLink(raw: string): void {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const id = Number(parsed.id)
      const name = cleanText(parsed.name)
      if (Number.isInteger(id) && id > 0 && name) {
        savedSessionId.value = id
        sessionName.value = name
      }
    } catch {
      // Ignore stale or malformed browser-only linkage.
    }
  }

  function initializeSession(): void {
    if (isInitialized.value) return

    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) restoreSession(stored)
        const savedLink = localStorage.getItem(SAVED_LINK_STORAGE_KEY)
        if (savedLink) restoreSavedLink(savedLink)
      } catch {
        // Private mode / storage denial should not block the workbench.
      }
    }

    persistenceReady = true
    isInitialized.value = true
  }

  function ensureMixFits(): void {
    if (batchShape.value !== 'assortment') return
    resultCount.value = Math.max(
      clampResultCount(resultCount.value),
      minimumResultCountForMix(returnTypes.value),
    )
  }

  function setPremise(value: string): void {
    premise.value = value
  }

  function setResultCount(value: number): void {
    const requested = clampResultCount(value)
    resultCount.value =
      batchShape.value === 'assortment'
        ? Math.max(requested, minimumResultCountForMix(returnTypes.value))
        : requested
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

  function setOutputDomain(value: BrainstormOutputDomainId): void {
    outputDomain.value = normalizeOutputDomain(value)
  }

  function setBatchShape(value: BrainstormBatchShape): void {
    batchShape.value = value === 'assortment' ? 'assortment' : 'focused'
    ensureMixFits()
  }

  function toggleReturnType(id: BrainstormReturnTypeId): void {
    if (!RETURN_TYPE_IDS.has(id)) return
    const index = returnTypes.value.findIndex((entry) => entry.id === id)
    if (index >= 0) returnTypes.value.splice(index, 1)
    else returnTypes.value.push({ id })
    ensureMixFits()
  }

  function setReturnTypeCount(
    id: BrainstormReturnTypeId,
    value: number | null,
  ): void {
    const entry = returnTypes.value.find((candidate) => candidate.id === id)
    if (!entry) return

    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      delete entry.count
      ensureMixFits()
      return
    }

    const otherMinimum = returnTypes.value.reduce(
      (total, candidate) =>
        candidate.id === id ? total : total + (candidate.count ?? 1),
      0,
    )
    const maxForEntry = Math.max(1, BRAINSTORM_MAX_RESULTS - otherMinimum)
    entry.count = Math.min(maxForEntry, Math.max(1, Math.round(parsed)))
    ensureMixFits()
  }

  function setSource(value: BrainstormSourceRef | null): void {
    source.value = value ? normalizeSourceRef(value) : null
  }

  function setSessionName(value: string): void {
    sessionName.value = value.slice(0, 255)
  }

  function useSuggestedSessionName(): void {
    sessionName.value = suggestedSessionName.value
  }

  function detachSavedSession(): void {
    savedSessionId.value = null
    lastSavedAt.value = null
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

  function clearPersistenceError(): void {
    persistenceError.value = null
    if (persistenceState.value === 'error') persistenceState.value = 'idle'
  }

  function setGenerationError(error: BrainstormError): void {
    generationState.value = 'error'
    generationError.value = error
  }

  function setPersistenceFailure(
    status: number | undefined,
    message: string,
  ): void {
    persistenceState.value = 'error'
    persistenceError.value = {
      kind: status === 400 ? 'validation' : classifyError(status),
      message,
      status: status ?? null,
    }
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

    applyCandidateStatus(candidate, status)
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

    return applyCandidateEdit(candidate, patch)
  }

  function restoreCandidateRevision(
    candidateId: string,
    revisionIndex: number,
  ): boolean {
    const candidate = findCandidate(candidateId)
    if (!candidate) return false

    return applyCandidateRevisionRestore(candidate, revisionIndex)
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
    batches.value = batches.value.filter(
      (batch) => batch.candidateIds.length > 0,
    )

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
    const returnType = normalizeReturnTypeId(generated.returnType)

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
          returnType,
        },
      ],
      meta: {
        source: source.value,
        intent: source.value?.intent || null,
        returnType,
        branchOrigin: null,
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

    return applyCandidateRegeneration(candidate, generated)
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
    if (!child.meta.returnType)
      child.meta.returnType = parent.meta.returnType ?? null
    child.meta.branchOrigin = computeBranchOrigin(parent)
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

    const shape = batchShape.value
    return {
      premise: cleanPremise,
      count: clampResultCount(resultCount.value),
      constraints: cleanMultilineText(constraints.value),
      examples: cleanExamples(examples.value),
      mode: cleanText(mode.value) || 'freeform',
      outputDomain: outputDomain.value,
      batchShape: shape,
      returnTypes:
        shape === 'assortment' ? normalizeReturnTypes(returnTypes.value) : [],
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
    const returnType = candidate.meta.returnType

    return {
      premise:
        originalRequest?.premise ||
        cleanMultilineText(premise.value) ||
        candidate.text,
      count: 1,
      constraints:
        originalRequest?.constraints || cleanMultilineText(constraints.value),
      examples: originalRequest?.examples || cleanExamples(examples.value),
      mode: originalRequest?.mode || cleanText(mode.value) || 'freeform',
      outputDomain: originalRequest?.outputDomain ?? outputDomain.value,
      batchShape: returnType ? 'assortment' : 'focused',
      returnTypes: returnType ? [{ id: returnType, count: 1 }] : [],
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

  function upsertSavedSummary(summary: BrainstormSavedSessionSummary): void {
    const index = savedSessions.value.findIndex(
      (entry) => entry.id === summary.id,
    )
    if (index >= 0) savedSessions.value.splice(index, 1, summary)
    else savedSessions.value.unshift(summary)
    savedSessions.value.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async function loadSavedSessions(): Promise<boolean> {
    clearPersistenceError()
    persistenceState.value = 'loading'
    const result = await performFetch<BrainstormSavedSessionsData>(
      '/api/brainstorm/sessions',
      { method: 'GET' },
      0,
      PERSISTENCE_TIMEOUT_MS,
    )

    if (!result.success) {
      setPersistenceFailure(
        result.status,
        result.message || 'Failed to load saved Brainstorm sessions.',
      )
      return false
    }

    savedSessions.value = Array.isArray(result.data?.sessions)
      ? result.data.sessions
      : []
    persistenceState.value = 'success'
    return true
  }

  async function saveCurrentSession(): Promise<boolean> {
    clearPersistenceError()
    const name = cleanText(sessionName.value)
    if (!name) {
      setPersistenceFailure(400, 'Name this Brainstorm before saving it.')
      return false
    }
    if (!premise.value.trim()) {
      setPersistenceFailure(400, 'Give Brainstorm a premise before saving it.')
      return false
    }

    persistenceState.value = 'saving'
    const payload: BrainstormSessionSaveRequest = {
      name,
      snapshot: sessionSnapshot(),
    }
    const id = savedSessionId.value
    const result = await performFetch<BrainstormSavedSessionData>(
      id ? `/api/brainstorm/sessions/${id}` : '/api/brainstorm/sessions',
      {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      0,
      PERSISTENCE_TIMEOUT_MS,
    )

    if (!result.success || !result.data?.session) {
      setPersistenceFailure(
        result.status,
        result.message || 'Failed to save the Brainstorm session.',
      )
      return false
    }

    const saved = result.data.session
    savedSessionId.value = saved.id
    sessionName.value = saved.name
    lastSavedAt.value = saved.updatedAt
    upsertSavedSummary(saved)
    persistenceState.value = 'success'
    return true
  }

  async function openSavedSession(id: number): Promise<boolean> {
    clearPersistenceError()
    if (!Number.isInteger(id) || id <= 0) {
      setPersistenceFailure(400, 'Choose a valid saved Brainstorm session.')
      return false
    }

    persistenceState.value = 'loading'
    const result = await performFetch<BrainstormSavedSessionData>(
      `/api/brainstorm/sessions/${id}`,
      { method: 'GET' },
      0,
      PERSISTENCE_TIMEOUT_MS,
    )

    if (!result.success || !result.data?.session) {
      setPersistenceFailure(
        result.status,
        result.message || 'Failed to open the Brainstorm session.',
      )
      return false
    }

    const saved = result.data.session
    if (!restoreSession(JSON.stringify(saved.snapshot))) {
      setPersistenceFailure(
        500,
        'The saved Brainstorm session could not be restored safely.',
      )
      return false
    }

    savedSessionId.value = saved.id
    sessionName.value = saved.name
    lastSavedAt.value = saved.updatedAt
    upsertSavedSummary(saved)
    persistenceState.value = 'success'
    return true
  }

  function clearSession(): void {
    premise.value = ''
    resultCount.value = BRAINSTORM_DEFAULT_RESULTS
    constraints.value = ''
    examples.value = []
    mode.value = 'freeform'
    outputDomain.value = BRAINSTORM_DEFAULT_OUTPUT_DOMAIN
    batchShape.value = 'focused'
    returnTypes.value = []
    source.value = null
    candidates.value = []
    batches.value = []
    activeBatchId.value = null
    generationState.value = 'idle'
    generationError.value = null
    generationTargetId.value = null
    lastGeneratedAt.value = null
    savedSessionId.value = null
    sessionName.value = ''
    persistenceState.value = 'idle'
    persistenceError.value = null
    lastSavedAt.value = null
  }

  if (import.meta.client) {
    watch(
      () => ({
        premise: premise.value,
        resultCount: resultCount.value,
        constraints: constraints.value,
        examples: examples.value,
        mode: mode.value,
        outputDomain: outputDomain.value,
        batchShape: batchShape.value,
        returnTypes: returnTypes.value,
        source: source.value,
        candidates: candidates.value,
        batches: batches.value,
        activeBatchId: activeBatchId.value,
        lastGeneratedAt: lastGeneratedAt.value,
      }),
      persistSession,
      { deep: true },
    )
    watch(
      () => ({ id: savedSessionId.value, name: sessionName.value }),
      persistSavedLink,
      { deep: true },
    )
  }

  return {
    premise,
    resultCount,
    constraints,
    examples,
    mode,
    outputDomain,
    batchShape,
    returnTypes,
    source,
    candidates,
    batches,
    activeBatchId,
    generationState,
    generationError,
    generationTargetId,
    lastGeneratedAt,
    savedSessionId,
    sessionName,
    savedSessions,
    persistenceState,
    persistenceError,
    lastSavedAt,
    isInitialized,
    activeBatch,
    activeCandidates,
    keptCandidates,
    allKeptCandidates,
    rejectedCandidates,
    pendingCandidates,
    minimumMixResults,
    isGenerating,
    isPersisting,
    canGenerate,
    canSaveSession,
    suggestedSessionName,
    initializeSession,
    setPremise,
    setResultCount,
    setConstraints,
    setExamples,
    setExamplesFromText,
    setMode,
    setOutputDomain,
    setBatchShape,
    toggleReturnType,
    setReturnTypeCount,
    setSource,
    setSessionName,
    useSuggestedSessionName,
    detachSavedSession,
    setActiveBatch,
    clearGenerationError,
    clearPersistenceError,
    setCandidateStatus,
    keepCandidate,
    rejectCandidate,
    resetCandidateStatus,
    setCandidateFeedback,
    editCandidate,
    restoreCandidateRevision,
    removeCandidate,
    generateBatch,
    regenerateCandidate,
    branchCandidate,
    loadSavedSessions,
    saveCurrentSession,
    openSavedSession,
    clearSession,
  }
})
