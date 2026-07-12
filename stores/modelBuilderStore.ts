// /stores/modelBuilderStore.ts
//
// Model Builder — a resumable, human-gated recipe runner for Kind Robots
// records. A user selects a source model, a recipe, and individual outputs;
// each output becomes a BuildItem that advances through PITCH,
// FIELDS_AND_PROMPTS, GENERATE_ASSETS, and COMMIT. Users may edit, approve,
// reject, rerun, or resume at any stage; editing upstream work marks
// downstream work stale without deleting it.
//
// Run state is DURABLE: runs, items, artifacts, and revisions persist through
// the /api/model-builder endpoints so a run resumes across devices and
// sessions. The store mutates local state optimistically, then persists in the
// background. GENERATE_ASSETS reuses the existing art generator; COMMIT is still
// preview-only — the durable create/update/link/promote is a later gated
// milestone (roadmap t-013/t-015) and never silently rewrites a canonical model.

import { defineStore } from 'pinia'
import { computed, reactive, ref, toRefs } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useArtStore } from '@/stores/artStore'
import { useServerStore } from '@/stores/serverStore'
import {
  BUILD_STAGES,
  getOutput,
  getOutputsForRecipe,
  getRecipe,
  getSourceType,
  type BuildAction,
  type BuildOutputConfig,
  type BuildStageKey,
  type GenerationKind,
  type RecipeKey,
  type SourceTypeKey,
} from '@/stores/helpers/modelBuilderRecipes'

export type BuilderStep = 'source' | 'recipe' | 'run'

export type StageStatus =
  | 'locked' // a prerequisite stage is not yet approved
  | 'ready' // workable now
  | 'in-progress' // generation running
  | 'approved' // user approved this stage
  | 'rejected' // user rejected — needs a redo
  | 'stale' // an upstream edit invalidated this stage

export interface StageState {
  status: StageStatus
  note?: string
}

// A single record loaded from a source-type list endpoint. Kept loose — the
// UI only needs an id and a couple of display fields.
export interface SourceRecord {
  id: number
  [key: string]: unknown
}

export interface BuildItem {
  id: string // durable server id (as a string, for keying)
  outputKey: string
  label: string
  action: BuildAction
  generation: GenerationKind
  quantityIndex: number
  stages: Record<BuildStageKey, StageState>
  pitch: string
  fieldsDraft: string
  promptDraft: string
  artImageId: number | null
  imagePath: string | null
  error: string | null
}

export interface BuildRun {
  id: string
  createdAt: string
  sourceType: SourceTypeKey
  sourceId: number
  sourceLabel: string
  recipeKey: RecipeKey
  items: BuildItem[]
}

interface OutputSelection {
  on: boolean
  quantity: number
}

interface ModelBuilderState {
  step: BuilderStep
  sourceType: SourceTypeKey | null
  sources: SourceRecord[]
  loadingSources: boolean
  sourcesError: string
  selectedSource: SourceRecord | null
  recipeKey: RecipeKey | null
  selections: Record<string, OutputSelection>
  run: BuildRun | null
  startingRun: boolean
  generatingItemId: string | null
  statusMessage: string
  statusTone: 'success' | 'error'
}

// --- server record shapes (loose — only the fields we read) ----------------

interface ServerArtifact {
  id: number
  draftPath?: string | null
  promotedPath?: string | null
  artImageId?: number | null
}

interface ServerItem {
  id: number
  outputKey: string
  label: string | null
  action: BuildAction
  generation: string
  quantityIndex: number
  stageStatuses: unknown
  pitch: string | null
  fieldsDraft: string | null
  promptDraft: string | null
  artImageId: number | null
  error: string | null
  Artifacts?: ServerArtifact[]
}

interface ServerRun {
  id: number
  createdAt: string
  sourceType: string
  sourceId: number
  sourceLabel: string | null
  recipeKey: string
  Items: ServerItem[]
}

const isClient = typeof window !== 'undefined'
const runIdKey = 'modelBuilder:runId'
const MAX_BATCH = 12

// Which draft field an AI suggestion targets. `artPrompt` matches the /api/suggest
// convention used by the art generator.
export type DraftField = 'pitch' | 'fields' | 'artPrompt'

const DRAFT_INSTRUCTIONS: Record<DraftField, string> = {
  pitch:
    'Write a concise 2-3 sentence pitch describing why this output exists for the source record and what it should convey. Return only the pitch text.',
  fields:
    'Propose the concrete schema fields and relationships this output should write, as short "field: value" lines grounded in the source record. Return only the field list.',
  artPrompt:
    'Write a single vivid image-generation prompt for this output, grounded in the source record. Comma-separated descriptors, no preamble. Return only the prompt.',
}

function safeGet(key: string): string | null {
  if (!isClient) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  if (!isClient) return
  try {
    localStorage.setItem(key, value)
  } catch {}
}

function safeRemove(key: string): void {
  if (!isClient) return
  try {
    localStorage.removeItem(key)
  } catch {}
}

// Initial stage map: PITCH is workable, the rest are locked behind it.
function freshStages(): Record<BuildStageKey, StageState> {
  const stages = {} as Record<BuildStageKey, StageState>
  BUILD_STAGES.forEach((stage, index) => {
    stages[stage.key] = { status: index === 0 ? 'ready' : 'locked' }
  })
  return stages
}

// Coerce a persisted stageStatuses JSON blob back into a complete stage map,
// filling any missing gate with a locked default.
function normalizeStages(raw: unknown): Record<BuildStageKey, StageState> {
  const stages = freshStages()
  if (raw && typeof raw === 'object') {
    const source = raw as Record<string, StageState>
    for (const stage of BUILD_STAGES) {
      const value = source[stage.key]
      if (value && typeof value.status === 'string') {
        stages[stage.key] = { status: value.status, note: value.note }
      }
    }
  }
  return stages
}

function stageIndex(key: BuildStageKey): number {
  return BUILD_STAGES.findIndex((stage) => stage.key === key)
}

// Turn a catalog size ('256×256', '512×768', 'square', undefined) into pixel
// dimensions for the art generator.
function sizeToDimensions(size?: string): { width: number; height: number } {
  if (!size || size === 'square') return { width: 1024, height: 1024 }
  const match = size.match(/(\d+)\s*[×x]\s*(\d+)/)
  if (!match) return { width: 1024, height: 1024 }
  return { width: Number(match[1]), height: Number(match[2]) }
}

function adaptItem(server: ServerItem): BuildItem {
  const artifact =
    server.Artifacts && server.Artifacts.length
      ? server.Artifacts[server.Artifacts.length - 1]
      : null
  return {
    id: String(server.id),
    outputKey: server.outputKey,
    label: server.label ?? server.outputKey,
    action: server.action,
    generation: server.generation as GenerationKind,
    quantityIndex: server.quantityIndex,
    stages: normalizeStages(server.stageStatuses),
    pitch: server.pitch ?? '',
    fieldsDraft: server.fieldsDraft ?? '',
    promptDraft: server.promptDraft ?? '',
    artImageId: server.artImageId ?? null,
    imagePath: artifact?.promotedPath ?? artifact?.draftPath ?? null,
    error: server.error ?? null,
  }
}

function adaptRun(server: ServerRun): BuildRun {
  return {
    id: String(server.id),
    createdAt: server.createdAt,
    sourceType: server.sourceType as SourceTypeKey,
    sourceId: server.sourceId,
    sourceLabel: server.sourceLabel ?? '',
    recipeKey: server.recipeKey as RecipeKey,
    items: Array.isArray(server.Items) ? server.Items.map(adaptItem) : [],
  }
}

export const useModelBuilderStore = defineStore('modelBuilderStore', () => {
  const state = reactive<ModelBuilderState>({
    step: 'source',
    sourceType: null,
    sources: [],
    loadingSources: false,
    sourcesError: '',
    selectedSource: null,
    recipeKey: null,
    selections: {},
    run: null,
    startingRun: false,
    generatingItemId: null,
    statusMessage: '',
    statusTone: 'success',
  })

  // Per-button spinner state for AI drafting: which item/field is in flight.
  const draftingField = ref<{ itemId: string; field: DraftField } | null>(null)

  // --- display helpers ------------------------------------------------------

  function sourceLabel(record: SourceRecord | null): string {
    if (!record) return ''
    const config = state.sourceType ? getSourceType(state.sourceType) : undefined
    const field = config?.titleField ?? 'title'
    const value = record[field] ?? record.title ?? record.name ?? record.slug
    return typeof value === 'string' && value.trim() ? value : `#${record.id}`
  }

  const selectedRecipe = computed(() =>
    state.recipeKey ? getRecipe(state.recipeKey) : undefined,
  )

  const recipeOutputs = computed<BuildOutputConfig[]>(() =>
    state.recipeKey ? getOutputsForRecipe(state.recipeKey) : [],
  )

  const selectedOutputCount = computed(
    () =>
      Object.values(state.selections).filter((selection) => selection.on).length,
  )

  const canStartRun = computed(
    () =>
      Boolean(
        state.selectedSource &&
          state.recipeKey &&
          selectedOutputCount.value > 0 &&
          !state.startingRun,
      ),
  )

  const runProgress = computed(() => {
    if (!state.run) return { total: 0, committed: 0 }
    const total = state.run.items.length
    const committed = state.run.items.filter(
      (item) => item.stages.COMMIT.status === 'approved',
    ).length
    return { total, committed }
  })

  function setStatus(tone: 'success' | 'error', message: string): void {
    state.statusTone = tone
    state.statusMessage = message
  }

  function clearStatus(): void {
    state.statusMessage = ''
  }

  // --- step 1: source type + records ---------------------------------------

  async function selectSourceType(key: SourceTypeKey): Promise<void> {
    if (state.sourceType === key && state.sources.length) return
    state.sourceType = key
    state.selectedSource = null
    state.recipeKey = null
    state.selections = {}
    await loadSources()
  }

  async function loadSources(): Promise<void> {
    const config = state.sourceType ? getSourceType(state.sourceType) : undefined
    if (!config) return

    state.loadingSources = true
    state.sourcesError = ''

    try {
      const response = await performFetch<SourceRecord[]>(config.endpoint)
      if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.message || `Failed to load ${config.plural}.`)
      }
      state.sources = response.data
      if (!state.sources.length) {
        state.sourcesError = `No ${config.plural.toLowerCase()} available to build from.`
      }
    } catch (error) {
      handleError(error, `loading ${config.plural.toLowerCase()}`)
      state.sourcesError =
        error instanceof Error ? error.message : `Failed to load ${config.plural}.`
      state.sources = []
    } finally {
      state.loadingSources = false
    }
  }

  function selectSource(record: SourceRecord): void {
    state.selectedSource = record
    const config = state.sourceType ? getSourceType(state.sourceType) : undefined
    if (config) selectRecipe(config.defaultRecipe)
    state.step = 'recipe'
  }

  // --- step 2: recipe + outputs --------------------------------------------

  function selectRecipe(key: RecipeKey): void {
    state.recipeKey = key
    const selections: Record<string, OutputSelection> = {}
    for (const output of getOutputsForRecipe(key)) {
      selections[output.key] = {
        on: Boolean(output.defaultOn),
        quantity: output.quantity ? 3 : 1,
      }
    }
    state.selections = selections
  }

  function toggleOutput(key: string): void {
    const selection = state.selections[key]
    if (!selection) return
    selection.on = !selection.on
  }

  function setOutputQuantity(key: string, quantity: number): void {
    const selection = state.selections[key]
    if (!selection) return
    selection.quantity = Math.max(1, Math.min(MAX_BATCH, Math.floor(quantity) || 1))
  }

  // --- step 3: create the durable run --------------------------------------

  async function startRun(): Promise<void> {
    if (
      !state.selectedSource ||
      !state.sourceType ||
      !state.recipeKey ||
      state.startingRun
    ) {
      return
    }

    const itemsPayload: Array<Record<string, unknown>> = []
    for (const output of recipeOutputs.value) {
      const selection = state.selections[output.key]
      if (!selection?.on) continue

      const count = output.quantity ? selection.quantity : 1
      for (let index = 0; index < count; index++) {
        itemsPayload.push({
          outputKey: output.key,
          label: count > 1 ? `${output.label} ${index + 1}` : output.label,
          action: output.action,
          generation: output.generation,
          quantityIndex: index,
          stageStatuses: freshStages(),
        })
      }
    }

    if (!itemsPayload.length) return

    state.startingRun = true
    clearStatus()

    try {
      const response = await performFetch<ServerRun>('/api/model-builder/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: state.sourceType,
          sourceId: state.selectedSource.id,
          sourceLabel: sourceLabel(state.selectedSource),
          sourceSnapshot: state.selectedSource,
          recipeKey: state.recipeKey,
          selections: state.selections,
          items: itemsPayload,
        }),
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to start build run.')
      }

      state.run = adaptRun(response.data)
      setActiveRunId(response.data.id)
      state.step = 'run'
      setStatus(
        'success',
        `Started a ${getRecipe(state.recipeKey)?.label} run with ${state.run.items.length} item${state.run.items.length === 1 ? '' : 's'}.`,
      )
    } catch (error) {
      handleError(error, 'starting build run')
      setStatus(
        'error',
        error instanceof Error ? error.message : 'Failed to start build run.',
      )
    } finally {
      state.startingRun = false
    }
  }

  function findItem(itemId: string): BuildItem | undefined {
    return state.run?.items.find((item) => item.id === itemId)
  }

  // Background persistence of a single item. Callers mutate local state first
  // (optimistic) and pass only the changed fields; a draft change also carries
  // stage metadata so the server records a revision.
  function pushItem(
    item: BuildItem,
    payload: Record<string, unknown>,
    meta?: { stage?: string; reason?: string },
  ): void {
    performFetch(`/api/model-builder/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ...meta }),
    })
      .then((response) => {
        if (!response.success) {
          setStatus('error', response.message || 'Failed to save changes.')
        }
      })
      .catch((error) => handleError(error, 'saving build item'))
  }

  // Stale-invalidation: editing an upstream stage marks every downstream stage
  // stale (unless still locked). Commit is always downstream of everything.
  function markDownstreamStale(item: BuildItem, fromStage: BuildStageKey): void {
    const from = stageIndex(fromStage)
    BUILD_STAGES.forEach((stage, index) => {
      if (index <= from) return
      const current = item.stages[stage.key].status
      if (
        current === 'approved' ||
        current === 'ready' ||
        current === 'in-progress'
      ) {
        item.stages[stage.key] = { status: 'stale' }
      }
    })
  }

  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'approved' }
    const next = BUILD_STAGES[stageIndex(stageKey) + 1]
    if (next && item.stages[next.key].status === 'locked') {
      item.stages[next.key] = { status: 'ready' }
    }
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey })
  }

  function rejectStage(
    itemId: string,
    stageKey: BuildStageKey,
    note?: string,
  ): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'rejected', note }
    markDownstreamStale(item, stageKey)
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey })
  }

  // Reopen a stale/approved stage for editing and invalidate downstream.
  function reopenStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'ready' }
    markDownstreamStale(item, stageKey)
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey })
  }

  function updatePitch(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.pitch = value
    markDownstreamStale(item, 'PITCH')
    pushItem(
      item,
      { stageStatuses: item.stages, pitch: item.pitch },
      { stage: 'PITCH', reason: 'edited pitch' },
    )
  }

  function updateFields(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.fieldsDraft = value
    markDownstreamStale(item, 'FIELDS_AND_PROMPTS')
    pushItem(
      item,
      { stageStatuses: item.stages, fieldsDraft: item.fieldsDraft },
      { stage: 'FIELDS_AND_PROMPTS', reason: 'edited fields' },
    )
  }

  function updatePrompt(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.promptDraft = value
    markDownstreamStale(item, 'FIELDS_AND_PROMPTS')
    pushItem(
      item,
      { stageStatuses: item.stages, promptDraft: item.promptDraft },
      { stage: 'FIELDS_AND_PROMPTS', reason: 'edited prompt' },
    )
  }

  // --- AI drafting: reuse the existing /api/suggest text generator -----------

  async function draftText(
    itemId: string,
    field: DraftField,
    instruction?: string,
  ): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false

    const serverStore = useServerStore()
    const activeServer = serverStore.activeTextServer
    const serverSnapshot = activeServer
      ? {
          serverType: activeServer.serverType ?? null,
          baseUrl: activeServer.baseUrl ?? null,
          endpointPath: activeServer.endpointPath ?? null,
          model: activeServer.model ?? null,
        }
      : undefined

    const current =
      field === 'pitch'
        ? item.pitch
        : field === 'fields'
          ? item.fieldsDraft
          : item.promptDraft

    draftingField.value = { itemId, field }
    clearStatus()

    try {
      const result = await performFetch<{ value: string }>(
        '/api/suggest',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            builder: 'model-builder',
            server: serverSnapshot,
            field,
            stepKey: field,
            current,
            context: {
              sourceType: state.run.sourceType,
              sourceLabel: state.run.sourceLabel,
              recipe: state.run.recipeKey,
              output: item.outputKey,
              itemLabel: item.label,
              action: item.action,
              pitch: item.pitch,
              fields: item.fieldsDraft,
              source: state.selectedSource ?? undefined,
            },
            extra: {
              instruction: instruction || DRAFT_INSTRUCTIONS[field],
              sourceLabel: state.run.sourceLabel,
            },
          }),
        },
        2,
        60_000,
      )

      if (!result.success || !result.data?.value) {
        throw new Error(result.message || 'The model returned nothing useful.')
      }

      const value = result.data.value.trim()
      // Route through the manual-edit setters so downstream stages stale and the
      // draft persists exactly as on a hand edit.
      if (field === 'pitch') updatePitch(itemId, value)
      else if (field === 'fields') updateFields(itemId, value)
      else updatePrompt(itemId, value)

      setStatus(
        'success',
        `Drafted ${field === 'artPrompt' ? 'prompt' : field} for ${item.label}.`,
      )
      return true
    } catch (error) {
      handleError(error, 'drafting model builder text')
      const message =
        error instanceof Error ? error.message : 'Draft request failed.'
      setStatus('error', message)
      return false
    } finally {
      draftingField.value = null
    }
  }

  // --- GENERATE_ASSETS: reuse the existing art generator --------------------

  async function recordArtifact(
    item: BuildItem,
    image: { id: number; imagePath?: string | null },
    output: BuildOutputConfig | undefined,
    prompt: string,
    dims: { width: number; height: number },
  ): Promise<void> {
    try {
      await performFetch(`/api/model-builder/items/${item.id}/artifacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'image',
          provider: output?.engine ?? null,
          prompt,
          width: dims.width,
          height: dims.height,
          artImageId: image.id,
          draftPath: image.imagePath ?? null,
          reviewState: 'PENDING',
        }),
      })
    } catch (error) {
      handleError(error, 'recording build artifact')
    }
  }

  async function generateItemAsset(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false

    if (item.generation !== 'image') {
      // Non-image generation kinds (text, plan, video, 3d) are catalogued but
      // not wired into this slice yet.
      item.error = `${item.generation} generation is not wired into the front-end slice yet.`
      item.stages.GENERATE_ASSETS = { status: 'ready', note: item.error }
      setStatus('error', item.error)
      return false
    }

    const prompt = item.promptDraft.trim() || item.pitch.trim()
    if (!prompt) {
      item.error = 'Add a prompt in Fields & Prompts before generating.'
      setStatus('error', item.error)
      return false
    }

    const output = getOutput(item.outputKey)
    const dims = sizeToDimensions(output?.size)
    const artStore = useArtStore()

    state.generatingItemId = item.id
    item.error = null
    item.stages.GENERATE_ASSETS = { status: 'in-progress' }
    clearStatus()

    try {
      await artStore.prepareArtGenerator()

      const result = await artStore.generateCurrentArt({
        promptString: prompt,
        title: `${state.run.sourceLabel} — ${item.label}`,
        width: dims.width,
        height: dims.height,
        engine: output?.engine,
        isPublic: false,
      })

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Generation failed.')
      }

      const image = result.data as { id: number; imagePath?: string | null }
      item.artImageId = image.id
      item.imagePath = image.imagePath ?? null
      item.stages.GENERATE_ASSETS = { status: 'ready' }

      await recordArtifact(item, image, output, prompt, dims)
      pushItem(item, {
        stageStatuses: item.stages,
        artImageId: item.artImageId,
      })

      setStatus('success', `Generated a candidate for ${item.label}.`)
      return true
    } catch (error) {
      handleError(error, 'generating model builder asset')
      item.error = error instanceof Error ? error.message : 'Generation failed.'
      item.stages.GENERATE_ASSETS = { status: 'ready', note: item.error }
      setStatus('error', item.error)
      return false
    } finally {
      state.generatingItemId = null
    }
  }

  // --- COMMIT: preview only (durable write is a gated backend milestone) ----

  interface CommitPreview {
    itemId: string
    action: BuildAction
    targetType: SourceTypeKey | 'ArtImage'
    summary: string
    fields: string
    artImageId: number | null
  }

  function previewCommit(itemId: string): CommitPreview | null {
    const item = findItem(itemId)
    if (!item || !state.run) return null
    return {
      itemId: item.id,
      action: item.action,
      targetType: item.action === 'ASSET_ONLY' ? 'ArtImage' : state.run.sourceType,
      summary:
        item.action === 'ASSET_ONLY'
          ? `Promote generated asset for ${item.label} to ${state.run.sourceLabel}.`
          : `${item.action} ${state.run.sourceType} from ${item.label}.`,
      fields: item.fieldsDraft,
      artImageId: item.artImageId,
    }
  }

  // Records the user's approval of the final diff. The durable create / update /
  // link / promote happens through model APIs in a later gated milestone — this
  // only marks the item approved-for-commit (persisted so it survives resume).
  function approveCommit(itemId: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages.COMMIT = {
      status: 'approved',
      note: 'Approved for commit — durable write pending backend execution.',
    }
    pushItem(item, { stageStatuses: item.stages }, { stage: 'COMMIT' })
    setStatus('success', `${item.label} approved for commit.`)
  }

  // --- persistence / resume -------------------------------------------------

  function setActiveRunId(id: number): void {
    safeSet(runIdKey, String(id))
  }

  // Resume the most recent run: the remembered run id if still present, else the
  // newest non-cancelled run for this user. Silent on failure (e.g. signed out).
  async function resumeRun(): Promise<void> {
    try {
      const remembered = safeGet(runIdKey)
      let data: ServerRun | undefined

      if (remembered) {
        const response = await performFetch<ServerRun>(
          `/api/model-builder/runs/${remembered}`,
        )
        if (response.success && response.data) data = response.data
      }

      if (!data) {
        const response = await performFetch<ServerRun[]>(
          '/api/model-builder/runs?take=1',
        )
        if (response.success && Array.isArray(response.data) && response.data.length) {
          data = response.data[0]
        }
      }

      if (data) {
        state.run = adaptRun(data)
        state.sourceType = data.sourceType as SourceTypeKey
        state.recipeKey = data.recipeKey as RecipeKey
        state.step = 'run'
        setActiveRunId(data.id)
      }
    } catch {
      // Not signed in, or no runs yet — start fresh at the source picker.
    }
  }

  function goToStep(step: BuilderStep): void {
    state.step = step
  }

  // Leave this run behind (its server record and history remain) and start a new
  // one. Does not delete the durable run.
  function resetRun(): void {
    state.run = null
    state.step = state.selectedSource ? 'recipe' : 'source'
    safeRemove(runIdKey)
    clearStatus()
  }

  function resetAll(): void {
    state.step = 'source'
    state.sourceType = null
    state.sources = []
    state.selectedSource = null
    state.recipeKey = null
    state.selections = {}
    state.run = null
    state.generatingItemId = null
    safeRemove(runIdKey)
    clearStatus()
  }

  return {
    ...toRefs(state),
    draftingField,
    // computed
    selectedRecipe,
    recipeOutputs,
    selectedOutputCount,
    canStartRun,
    runProgress,
    // display
    sourceLabel,
    // actions
    selectSourceType,
    loadSources,
    selectSource,
    selectRecipe,
    toggleOutput,
    setOutputQuantity,
    startRun,
    approveStage,
    rejectStage,
    reopenStage,
    updatePitch,
    updateFields,
    updatePrompt,
    draftText,
    generateItemAsset,
    previewCommit,
    approveCommit,
    resumeRun,
    goToStep,
    resetRun,
    resetAll,
    setStatus,
    clearStatus,
  }
})
