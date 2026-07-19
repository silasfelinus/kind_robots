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
import {
  useArtStore,
  type GenerateArtData,
  type QueuedArtJob,
} from '@/stores/artStore'
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
import {
  CREATE_TARGETS,
  defaultFieldsTemplate,
  fieldsBrief,
  setFieldLine,
} from '@/stores/helpers/modelBuilderFields'

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
  // Async generation (t-025): set while a GENERATE_ASSETS ArtJob is in
  // flight for this item. Ephemeral — not persisted server-side, so a page
  // refresh drops an in-progress poll (the job itself keeps rendering; the
  // item just needs a manual re-generate to pick up the finished image).
  artJobId: number | null
  queueState: 'queued' | 'rendering' | null
  targetType: string | null
  targetId: number | null
  error: string | null
}

export interface BuildRun {
  id: string
  createdAt: string
  sourceType: SourceTypeKey
  sourceId: number
  sourceLabel: string
  sourceSnapshot: Record<string, unknown> | null
  recipeKey: RecipeKey
  items: BuildItem[]
}

// A quantity/expansion output's items, grouped for batch editing. Derived from
// run.items by outputKey — the run model has no persisted group object.
export interface BuildItemGroup {
  outputKey: string
  label: string
  quantity: boolean
  action: BuildAction
  generation: GenerationKind
  targetModel: SourceTypeKey
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
  runs: BuildRun[]
  loadingRuns: boolean
  startingRun: boolean
  includeArt: boolean
  generatingItemId: string | null
  committingItemId: string | null
  autoBuilding: boolean
  autoBuildingItemId: string | null
  batchingOutputKey: string | null
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
  targetType: string | null
  targetId: number | null
  error: string | null
  Artifacts?: ServerArtifact[]
}

interface ServerRun {
  id: number
  createdAt: string
  sourceType: string
  sourceId: number
  sourceLabel: string | null
  sourceSnapshot: unknown
  recipeKey: string
  Items: ServerItem[]
}

const isClient = typeof window !== 'undefined'
const runIdKey = 'modelBuilder:runId'
const MAX_BATCH = 12

// Which draft field an AI suggestion targets. `artPrompt` matches the /api/suggest
// convention used by the art generator. Per-field prompt text lives in the
// registered 'model-builder' suggest sheet (server/utils/suggest/sheets), so the
// store just names the field.
export type DraftField = 'pitch' | 'fields' | 'artPrompt'

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

// Which model an item ultimately writes to: CREATE items target the mapped
// expansion type; UPDATE/ASSET_ONLY items target the run's source model.
function resolveTargetModel(
  action: BuildAction,
  outputKey: string,
  sourceType: SourceTypeKey,
): SourceTypeKey {
  if (action === 'CREATE') return CREATE_TARGETS[outputKey] ?? sourceType
  return sourceType
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
    artJobId: null,
    queueState: null,
    targetType: server.targetType ?? null,
    targetId: server.targetId ?? null,
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
    sourceSnapshot:
      server.sourceSnapshot && typeof server.sourceSnapshot === 'object'
        ? (server.sourceSnapshot as Record<string, unknown>)
        : null,
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
    runs: [],
    loadingRuns: false,
    startingRun: false,
    includeArt: true,
    generatingItemId: null,
    committingItemId: null,
    autoBuilding: false,
    autoBuildingItemId: null,
    batchingOutputKey: null,
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

    const runSourceType = state.sourceType
    const itemsPayload: Array<Record<string, unknown>> = []
    for (const output of recipeOutputs.value) {
      const selection = state.selections[output.key]
      if (!selection?.on) continue

      // Model-aware pre-fill: CREATE/UPDATE items start with the target model's
      // required/defaulted fields as a skeleton, so FIELDS isn't a blank box.
      const targetModel = resolveTargetModel(
        output.action,
        output.key,
        runSourceType,
      )
      const fieldsDraft =
        output.action === 'ASSET_ONLY' ? '' : defaultFieldsTemplate(targetModel)

      const count = output.quantity ? selection.quantity : 1
      for (let index = 0; index < count; index++) {
        itemsPayload.push({
          outputKey: output.key,
          label: count > 1 ? `${output.label} ${index + 1}` : output.label,
          action: output.action,
          generation: output.generation,
          quantityIndex: index,
          stageStatuses: freshStages(),
          fieldsDraft,
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

  // Background persistence of a whole group edit in one round-trip. Callers
  // mutate local state first (optimistic) and pass only the changed fields per
  // item, same contract as pushItem — this just collapses N per-item PATCH
  // requests into a single batch request.
  function batchPushItems(
    entries: Array<{
      item: BuildItem
      payload: Record<string, unknown>
      meta?: { stage?: string; reason?: string }
    }>,
  ): void {
    if (!entries.length) return
    performFetch('/api/model-builder/items/batch', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: entries.map(({ item, payload, meta }) => ({
          id: item.id,
          ...payload,
          ...meta,
        })),
      }),
    })
      .then((response) => {
        if (!response.success) {
          setStatus('error', response.message || 'Failed to save changes.')
        }
      })
      .catch((error) => handleError(error, 'saving build items'))
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

    const targetModel = resolveTargetModel(
      item.action,
      item.outputKey,
      state.run.sourceType,
    )

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
              targetModel,
              expectedFields: fieldsBrief(targetModel),
              pitch: item.pitch,
              fields: item.fieldsDraft,
              source: state.selectedSource ?? undefined,
            },
            extra: {
              // The registered 'model-builder' suggest sheet owns the per-field
              // prompt; only override it when the caller passes an explicit one.
              ...(instruction ? { instruction } : {}),
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

  // --- GENERATE_ASSETS (async): queue via ArtJob, poll per item -------------
  //
  // generateItemAsset above blocks the whole call on the render (up to
  // ART_QUEUE_TIMEOUT_MS). This is the "normal" async path from the roadmap
  // note: enqueue, store the jobId on the item, poll independently so
  // multiple items can be in flight at once with their own queued/rendering
  // state, and promote the image once the job finishes. Keeps
  // generateItemAsset as the synchronous "art first, interactively" option.

  const ASYNC_ART_POLL_MS = 5_000

  async function pollAsyncArtJob(
    item: BuildItem,
    jobId: number,
    generateData: GenerateArtData,
    output: BuildOutputConfig | undefined,
    prompt: string,
    dims: { width: number; height: number },
  ): Promise<void> {
    const artStore = useArtStore()

    // If another call re-queues this item (or the item is dropped from the
    // run), item.artJobId will no longer match — stop, the newer poll (or
    // nothing) owns the item now.
    while (item.artJobId === jobId) {
      const job: QueuedArtJob | null = await artStore.getArtJobStatus(jobId)

      if (item.artJobId !== jobId) return

      if (!job || job.status === 'PENDING' || job.status === 'RUNNING') {
        item.queueState = job?.status === 'RUNNING' ? 'rendering' : 'queued'
        item.stages.GENERATE_ASSETS = {
          status: 'in-progress',
          note: item.queueState,
        }
        await new Promise((resolve) => setTimeout(resolve, ASYNC_ART_POLL_MS))
        continue
      }

      // Terminal status (DONE/FAILED/CANCELLED).
      item.artJobId = null
      item.queueState = null

      const result = await artStore.finalizeQueuedArtImage(job, generateData)

      if (!result.success || !result.data) {
        item.error = result.message || `Art job ${jobId} did not complete.`
        item.stages.GENERATE_ASSETS = { status: 'ready', note: item.error }
        setStatus('error', item.error)
        return
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
      return
    }
  }

  // Enqueues generation and returns as soon as the job is queued — it does
  // NOT wait for the render. Progress shows via item.queueState
  // ('queued' | 'rendering') until pollAsyncArtJob resolves the item.
  async function generateItemAssetAsync(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false

    if (item.generation !== 'image') {
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

    item.error = null
    item.queueState = 'queued'
    item.stages.GENERATE_ASSETS = { status: 'in-progress', note: 'queued' }
    clearStatus()

    try {
      await artStore.prepareArtGenerator()

      const enqueued = await artStore.enqueueCurrentArt({
        promptString: prompt,
        title: `${state.run.sourceLabel} — ${item.label}`,
        width: dims.width,
        height: dims.height,
        engine: output?.engine,
        isPublic: false,
      })

      if (!enqueued.success || !enqueued.jobId || !enqueued.data) {
        throw new Error(enqueued.message || 'Failed to queue generation.')
      }

      item.artJobId = enqueued.jobId
      void pollAsyncArtJob(
        item,
        enqueued.jobId,
        enqueued.data,
        output,
        prompt,
        dims,
      )
      return true
    } catch (error) {
      handleError(error, 'queueing model builder asset')
      item.error =
        error instanceof Error ? error.message : 'Failed to queue generation.'
      item.stages.GENERATE_ASSETS = { status: 'ready', note: item.error }
      item.queueState = null
      item.artJobId = null
      setStatus('error', item.error)
      return false
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

  interface CommitTarget {
    type: string
    id: number
    created?: boolean
    linked?: boolean
  }

  // Execute the durable commit for an item through the server executor: promote
  // the asset, update the source, or create + link a new record — idempotently.
  async function commitItem(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item) return false

    state.committingItemId = item.id
    item.error = null
    clearStatus()

    try {
      const response = await performFetch<{
        alreadyCommitted?: boolean
        target?: CommitTarget | null
      }>(
        `/api/model-builder/items/${item.id}/commit`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
        1,
        60_000,
      )

      if (!response.success) {
        throw new Error(response.message || 'Commit failed.')
      }

      const target = response.data?.target ?? null
      item.stages.COMMIT = {
        status: 'approved',
        note: target ? `Committed → ${target.type} #${target.id}` : 'Committed.',
      }
      if (target) {
        item.targetType = target.type
        item.targetId = target.id
      }
      setStatus(
        'success',
        target
          ? `${item.label} committed → ${target.type} #${target.id}.`
          : `${item.label} committed.`,
      )
      return true
    } catch (error) {
      handleError(error, 'committing build item')
      item.error = error instanceof Error ? error.message : 'Commit failed.'
      setStatus('error', item.error)
      return false
    } finally {
      state.committingItemId = null
    }
  }

  // --- auto-build: walk an item (or the whole run) to completion ------------

  function toggleIncludeArt(value?: boolean): void {
    state.includeArt = typeof value === 'boolean' ? value : !state.includeArt
  }

  // Run one item through every gate automatically with sensible defaults: draft
  // what's empty, generate art only when wanted, and commit. "Create directly"
  // for CREATE/UPDATE items when art is off. Returns whether it committed.
  async function autoBuildItem(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false

    const isAsset = item.action === 'ASSET_ONLY'
    const wantArt = state.includeArt && item.generation === 'image'

    // An ASSET_ONLY item is nothing but its art — can't auto-build without it.
    if (isAsset && !wantArt) {
      setStatus(
        'error',
        `${item.label} is asset-only — enable art to auto-build it.`,
      )
      return false
    }

    state.autoBuildingItemId = item.id
    try {
      if (item.stages.PITCH.status !== 'approved') {
        if (!item.pitch.trim()) await draftText(itemId, 'pitch')
        approveStage(itemId, 'PITCH')
      }

      if (item.stages.FIELDS_AND_PROMPTS.status !== 'approved') {
        if (!isAsset) await draftText(itemId, 'fields')
        if (wantArt) await draftText(itemId, 'artPrompt')
        approveStage(itemId, 'FIELDS_AND_PROMPTS')
      }

      if (item.stages.GENERATE_ASSETS.status !== 'approved') {
        if (wantArt) {
          const generated = await generateItemAsset(itemId)
          if (!generated) return false
        }
        approveStage(itemId, 'GENERATE_ASSETS')
      }

      if (item.stages.COMMIT.status !== 'approved') {
        return await commitItem(itemId)
      }
      return true
    } finally {
      state.autoBuildingItemId = null
    }
  }

  // Auto-build every not-yet-committed item in the run, in order.
  async function autoBuildRun(): Promise<void> {
    if (!state.run || state.autoBuilding) return
    state.autoBuilding = true
    clearStatus()

    const items = [...state.run.items]
    let committed = 0
    try {
      for (const item of items) {
        if (item.stages.COMMIT.status === 'approved') {
          committed++
          continue
        }
        const ok = await autoBuildItem(item.id)
        if (ok) committed++
      }
      setStatus(
        'success',
        `Auto-build finished: ${committed}/${items.length} committed.`,
      )
    } finally {
      state.autoBuilding = false
    }
  }

  // --- batch editing across a quantity output group -------------------------

  // Group the run's items by outputKey so a quantity/expansion output (e.g. 10
  // rewards) can be edited together. The group carries its target model so the
  // editor can enumerate that model's fields (fieldSpecFor).
  const itemGroups = computed<BuildItemGroup[]>(() => {
    const run = state.run
    if (!run) return []
    const byKey = new Map<string, BuildItem[]>()
    for (const item of run.items) {
      const existing = byKey.get(item.outputKey)
      if (existing) existing.push(item)
      else byKey.set(item.outputKey, [item])
    }
    return [...byKey.entries()].flatMap(([outputKey, items]) => {
      const first = items[0]
      if (!first) return []
      const config = recipeOutputs.value.find(
        (output) => output.key === outputKey,
      )
      return [
        {
          outputKey,
          label: config?.label ?? first.label,
          quantity: config?.quantity ?? items.length > 1,
          action: first.action,
          generation: first.generation,
          targetModel: resolveTargetModel(
            first.action,
            outputKey,
            run.sourceType,
          ),
          items,
        },
      ]
    })
  })

  function groupItems(outputKey: string): BuildItem[] {
    return state.run?.items.filter((item) => item.outputKey === outputKey) ?? []
  }

  // AI-draft one field (pitch/fields/artPrompt) across every item in a group,
  // sequentially so we don't hammer the text server. onlyEmpty skips items that
  // already have hand-edited content.
  async function batchDraftField(
    outputKey: string,
    field: DraftField,
    opts?: { onlyEmpty?: boolean },
  ): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    state.batchingOutputKey = outputKey
    clearStatus()
    let drafted = 0
    try {
      for (const item of items) {
        const current =
          field === 'pitch'
            ? item.pitch
            : field === 'fields'
              ? item.fieldsDraft
              : item.promptDraft
        if (opts?.onlyEmpty && current.trim()) continue
        const ok = await draftText(item.id, field)
        if (ok) drafted++
      }
      const label = field === 'artPrompt' ? 'prompt' : field
      setStatus('success', `Drafted ${label} for ${drafted}/${items.length} items.`)
    } finally {
      state.batchingOutputKey = null
    }
  }

  // Set one model field to the same value on every item in a group (e.g. rarity =
  // RARE across 10 rewards). Only rewrites items whose value actually changes.
  // Persists the whole group in a single batch request rather than one PATCH
  // per changed item.
  function batchSetField(
    outputKey: string,
    fieldKey: string,
    value: string,
  ): void {
    const items = groupItems(outputKey)
    const entries: Array<{
      item: BuildItem
      payload: Record<string, unknown>
      meta?: { stage?: string; reason?: string }
    }> = []
    for (const item of items) {
      const next = setFieldLine(item.fieldsDraft, fieldKey, value)
      if (next === item.fieldsDraft) continue
      item.fieldsDraft = next
      markDownstreamStale(item, 'FIELDS_AND_PROMPTS')
      entries.push({
        item,
        payload: { stageStatuses: item.stages, fieldsDraft: item.fieldsDraft },
        meta: { stage: 'FIELDS_AND_PROMPTS', reason: 'edited fields' },
      })
    }
    batchPushItems(entries)
    setStatus(
      'success',
      `Set ${fieldKey} on ${entries.length}/${items.length} items.`,
    )
  }

  // Approve a stage for every (unlocked) item in a group at once.
  function batchApproveStage(outputKey: string, stageKey: BuildStageKey): void {
    let approved = 0
    for (const item of groupItems(outputKey)) {
      if (item.stages[stageKey].status === 'locked') continue
      approveStage(item.id, stageKey)
      approved++
    }
    setStatus('success', `Approved ${stageKey} for ${approved} items.`)
  }

  // Auto-build (draft → generate → commit with defaults) every not-yet-committed
  // item in a single group.
  async function batchAutoBuild(outputKey: string): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    state.batchingOutputKey = outputKey
    clearStatus()
    let committed = 0
    try {
      for (const item of items) {
        if (item.stages.COMMIT.status === 'approved') {
          committed++
          continue
        }
        const ok = await autoBuildItem(item.id)
        if (ok) committed++
      }
      setStatus(
        'success',
        `Auto-built ${committed}/${items.length} in this group.`,
      )
    } finally {
      state.batchingOutputKey = null
    }
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

  // --- run history ----------------------------------------------------------

  async function fetchRuns(): Promise<void> {
    state.loadingRuns = true
    try {
      const response = await performFetch<ServerRun[]>(
        '/api/model-builder/runs?take=50',
      )
      if (response.success && Array.isArray(response.data)) {
        state.runs = response.data.map(adaptRun)
      } else if (!response.success) {
        setStatus('error', response.message || 'Failed to load run history.')
      }
    } catch (error) {
      handleError(error, 'loading run history')
    } finally {
      state.loadingRuns = false
    }
  }

  async function openRun(runId: string): Promise<void> {
    const cached = state.runs.find((entry) => entry.id === runId)
    if (cached) {
      state.run = cached
      state.sourceType = cached.sourceType
      state.recipeKey = cached.recipeKey
      state.step = 'run'
      setActiveRunId(Number(runId))
      return
    }

    try {
      const response = await performFetch<ServerRun>(
        `/api/model-builder/runs/${runId}`,
      )
      if (response.success && response.data) {
        state.run = adaptRun(response.data)
        state.sourceType = state.run.sourceType
        state.recipeKey = state.run.recipeKey
        state.step = 'run'
        setActiveRunId(response.data.id)
      } else if (!response.success) {
        setStatus('error', response.message || 'Failed to open run.')
      }
    } catch (error) {
      handleError(error, 'opening build run')
    }
  }

  async function cancelRun(runId: string): Promise<void> {
    try {
      const response = await performFetch(
        `/api/model-builder/runs/${runId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' }),
        },
      )
      if (!response.success) {
        setStatus('error', response.message || 'Failed to cancel run.')
        return
      }
      state.runs = state.runs.filter((entry) => entry.id !== runId)
      if (state.run?.id === runId) resetRun()
      setStatus('success', 'Run cancelled.')
    } catch (error) {
      handleError(error, 'cancelling build run')
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
    itemGroups,
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
    generateItemAssetAsync,
    previewCommit,
    commitItem,
    toggleIncludeArt,
    autoBuildItem,
    autoBuildRun,
    batchDraftField,
    batchSetField,
    batchApproveStage,
    batchAutoBuild,
    resumeRun,
    fetchRuns,
    openRun,
    cancelRun,
    goToStep,
    resetRun,
    resetAll,
    setStatus,
    clearStatus,
  }
})
