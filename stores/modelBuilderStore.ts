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

// 'skipped' means auto-build never attempted the item this call because
// another in-flight action (itself or a manual single-stage action) owns
// it right now -- the item is still buildable, just not yet. 'failed'
// means auto-build attempted a stage and it did not succeed (or the item
// isn't eligible, e.g. asset-only with art off). Exported (and mirrored onto
// BuildItem.lastAutoBuildOutcome below) so both the aggregate tallies in
// autoBuildRun/batchAutoBuild AND the per-item UI (model-builder-progress-
// matrix.vue) can tell a busy-but-fine item apart from a broken one, and a
// broken item apart from one that simply hasn't been attempted yet (t-029:
// previously this was only visible per-item inside item.error, which several
// of autoBuildItem's own 'failed' branches — an empty AI draft, a stage gone
// stale mid-run, an ineligible asset-only item — never set, and a run-wide
// scan had no per-item signal at all short of opening each item's panel).
export type AutoBuildOutcome = 'committed' | 'skipped' | 'failed'

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
  // Outcome of this item's most recent pass through autoBuildRun() or
  // batchAutoBuild() (not the single-item "Auto" button in
  // model-builder-item-panel.vue -- that button's own panel already shows
  // the failure directly, so it doesn't need to write here too). null before
  // any run/batch has touched this item. Ephemeral -- not persisted
  // server-side, like queueState/artJobId; a page refresh drops it, which is
  // fine since it only describes "what just happened in this session's last
  // pass," not durable item state. UI should prefer the item's own current
  // stage status (e.g. COMMIT approved) over a stale 'failed' here when the
  // two disagree — see model-builder-progress-matrix.vue's autoBuildFailed.
  lastAutoBuildOutcome: AutoBuildOutcome | null
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

// batchPushItems' return shape. Named (rather than an inline `Promise<{ ... }>`
// object-literal return type) so this store's own verifyModelBuilder*Guard.ts
// scripts -- which locate a function's body by scanning for the first '{'
// after its parameter list's closing ')' -- land on the real body brace
// instead of the object type literal's own braces.
interface BatchPushOutcome {
  ok: boolean
  failedIds: Set<string>
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
  status?: string
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

// A store-wide (not per-item) "who's in flight" flag — generatingItemId,
// committingItemId, autoBuildingItemId, batchingOutputKey, and draftingField
// are all this same shape. Because only one value can be in flight at a time
// per flag, starting a second operation overwrites it to the new owner; the
// first operation's `finally` must then only clear the flag if it still holds
// that operation's own value, or it silently stomps the second operation's
// in-flight state the moment the first resolves. `claim`/`release` collapse
// that set-then-conditional-clear pattern into one primitive so a new
// singleton can't be added without the guard.
interface OwnedSingleton<T> {
  claim(value: T): void
  release(value: T): void
}

function createOwnedSingleton<T>(
  getValue: () => T | null,
  setValue: (value: T | null) => void,
): OwnedSingleton<T> {
  return {
    claim(value: T): void {
      setValue(value)
    },
    release(value: T): void {
      if (getValue() === value) setValue(null)
    },
  }
}

// Initial stage map: PITCH is workable, the rest are locked behind it.
function freshStages(): Record<BuildStageKey, StageState> {
  const stages = {} as Record<BuildStageKey, StageState>
  BUILD_STAGES.forEach((stage, index) => {
    stages[stage.key] = { status: index === 0 ? 'ready' : 'locked' }
  })
  return stages
}

// ModelBuildItem.stageStatuses and ModelBuildRun.sourceSnapshot are both
// plain `String @db.LongText` columns, not native Prisma Json columns (see
// utils/scripts/verifyNoPrismaJsonCast.ts) -- every server route writes them
// with JSON.stringify and reads them back with parseStoredJson (server/api/
// model-builder/runs/index.ts). A value that has round-tripped through any
// /api/model-builder/* GET/POST response is therefore always a JSON *string*
// on the client, never an already-parsed object. Parse defensively: accept a
// string (the real shape) or an object (defensive only -- nothing produces
// this today), and fall back to null/default on anything else, including
// malformed JSON.
function parseJsonValue(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// Coerce a persisted stageStatuses JSON blob back into a complete stage map,
// filling any missing gate with a locked default.
//
// Bug (found by inspection, model-builder/t-029): this used to gate on
// `typeof raw === 'object'` alone, which is never true for `raw` sourced from
// the server (see parseJsonValue's comment above) -- so every call from
// adaptItem below silently discarded the real stageStatuses and returned the
// fresh-item default (PITCH ready, everything else locked) instead. This
// stayed invisible for the run that actually did the approving: approveStage/
// pushItem/etc. all mutate the SAME long-lived state.run object in place, so
// optimistic local state kept showing the right thing right up until the
// object was rebuilt from a fresh server read. Concrete repro (pre-fix):
// approve PITCH, refresh the page (or close the tab and reopen the same run
// from Run History) -- resumeRun()/openRun()/fetchRuns() all re-fetch and
// rebuild via adaptItem, and the just-approved PITCH stage (along with any
// other approved or even fully committed stage) silently reverted to
// 'ready'/'locked' in the UI, while the item's own targetId/targetType/
// artImageId (typed columns, unaffected by this bug) still correctly showed
// "Committed" -- a self-contradicting item panel with no error ever raised.
function normalizeStages(raw: unknown): Record<BuildStageKey, StageState> {
  const stages = freshStages()
  const parsed = parseJsonValue(raw)
  if (parsed && typeof parsed === 'object') {
    const source = parsed as Record<string, StageState>
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
    lastAutoBuildOutcome: null,
  }
}

function adaptRun(server: ServerRun): BuildRun {
  return {
    id: String(server.id),
    createdAt: server.createdAt,
    sourceType: server.sourceType as SourceTypeKey,
    sourceId: server.sourceId,
    sourceLabel: server.sourceLabel ?? '',
    // See parseJsonValue's doc comment: server.sourceSnapshot is a JSON
    // string, not an already-parsed object, on every response from the
    // server. model-builder-progress-matrix.vue's `source` computed falls
    // back to store.selectedSource specifically so this snapshot "survives
    // resume" (its own comment) -- but store.selectedSource is only ever set
    // by an in-session selectSource() call and is never restored on
    // resume/reopen, so before this fix the fallback masked the break only
    // for the run that had just been created; resuming a run (or opening one
    // from Run History) always showed a blank "Source context" card, with no
    // error, for a value the run's own creation had genuinely captured.
    sourceSnapshot: (() => {
      const parsed = parseJsonValue(server.sourceSnapshot)
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : null
    })(),
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

  const generatingItemSingleton = createOwnedSingleton<string>(
    () => state.generatingItemId,
    (value) => {
      state.generatingItemId = value
    },
  )
  const committingItemSingleton = createOwnedSingleton<string>(
    () => state.committingItemId,
    (value) => {
      state.committingItemId = value
    },
  )
  const autoBuildingItemSingleton = createOwnedSingleton<string>(
    () => state.autoBuildingItemId,
    (value) => {
      state.autoBuildingItemId = value
    },
  )
  const batchingOutputSingleton = createOwnedSingleton<string>(
    () => state.batchingOutputKey,
    (value) => {
      state.batchingOutputKey = value
    },
  )
  const draftingFieldSingleton = createOwnedSingleton<{
    itemId: string
    field: DraftField
  }>(
    () => draftingField.value,
    (value) => {
      draftingField.value = value
    },
  )

  // Run ids cancelled via cancelRun, so a synchronous generateItemAsset call
  // still in flight when the user cancels its run can tell "my run was
  // cancelled" apart from "the user merely navigated to a different run"
  // (findItem(itemId) alone can't distinguish those — both leave the item
  // unreachable from the now-different state.run). See generateItemAsset.
  const cancelledRunIds = new Set<string>()

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
    state.recipeKey ? getOutputsForRecipe(state.recipeKey, state.sourceType) : [],
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
    if (!state.run) return { total: 0, committed: 0, failed: 0 }
    const total = state.run.items.length
    const committed = state.run.items.filter(
      (item) => item.stages.COMMIT.status === 'approved',
    ).length
    // Committed always wins over a stale 'failed' outcome — an item can
    // fail once, then get fixed and committed by hand without ever going
    // through autoBuildItem again (e.g. the single-stage "Execute commit"
    // button), which would otherwise leave lastAutoBuildOutcome pointing at
    // a failure that's no longer true. Mirrors model-builder-progress-
    // matrix.vue's autoBuildFailed, which the same logic must agree with --
    // including the item.error OR (model-builder/t-029): lastAutoBuildOutcome
    // is session-only and never restored on resume/reopen/reload, so without
    // also honoring the persisted item.error signal, this count silently
    // dropped to 0 for a run reopened from History even when items were
    // still genuinely stuck failed.
    const failed = state.run.items.filter(
      (item) =>
        item.stages.COMMIT.status !== 'approved' &&
        (item.lastAutoBuildOutcome === 'failed' || Boolean(item.error)),
    ).length
    return { total, committed, failed }
  })

  function setStatus(tone: 'success' | 'error', message: string): void {
    state.statusTone = tone
    state.statusMessage = message
  }

  function clearStatus(): void {
    state.statusMessage = ''
  }

  // Only surface a status toast if the user is still looking at the run it's
  // about. generateItemAsset/pollAsyncArtJob/generateItemAssetAsync/commitItem
  // each capture their own `runId` up front and deliberately keep working
  // (and persisting) against a run the user has since navigated away from via
  // resetRun/resetAll/openRun — that's intended (see resetRun's doc comment:
  // the run stays valid and resumable, unlike cancelRun). But leaving a run
  // behind this way never adds it to cancelledRunIds, so without this check a
  // slow render or commit that finishes after the user has moved on to (or
  // started) a *different* run pops a misleading success/error toast in that
  // other run's banner, about an item that isn't even part of what's on
  // screen. Mirrors autoBuildRun's own `if (state.run?.id === runId)` gate on
  // its final summary message — just applied to the per-item completion
  // paths that feed into it, and to the same manual single-item actions on
  // their own.
  function setStatusForRun(
    runId: string,
    tone: 'success' | 'error',
    message: string,
  ): void {
    if (state.run?.id === runId) setStatus(tone, message)
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

    // state.sourceType can change while this fetch is in flight (rapid
    // clicks between source-type tabs). Capture the type this call is
    // loading for so a slower, now-stale response can't overwrite the
    // sources for whichever tab is actually selected by the time it lands.
    const requestedType = state.sourceType

    state.loadingSources = true
    state.sourcesError = ''

    try {
      const response = await performFetch<SourceRecord[]>(config.endpoint)
      if (state.sourceType !== requestedType) return
      if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.message || `Failed to load ${config.plural}.`)
      }
      state.sources = response.data
      if (!state.sources.length) {
        state.sourcesError = `No ${config.plural.toLowerCase()} available to build from.`
      }
    } catch (error) {
      if (state.sourceType !== requestedType) return
      handleError(error, `loading ${config.plural.toLowerCase()}`)
      state.sourcesError =
        error instanceof Error ? error.message : `Failed to load ${config.plural}.`
      state.sources = []
    } finally {
      if (state.sourceType === requestedType) state.loadingSources = false
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
    for (const output of getOutputsForRecipe(key, state.sourceType)) {
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
    const runId = state.run?.id
    performFetch(`/api/model-builder/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ...meta }),
    })
      .then((response) => {
        if (!response.success && runId) {
          setStatusForRun(
            runId,
            'error',
            response.message || 'Failed to save changes.',
          )
        }
      })
      .catch((error) => {
        // Mirror the success:false branch above rather than unconditionally
        // calling handleError: a PATCH that rejects (network error, etc.)
        // after its run was cancelled or the user has since navigated
        // elsewhere shouldn't pop a global error banner for a run that's no
        // longer on screen. setStatusForRun already no-ops unless state.run
        // still matches the run this write belonged to.
        if (runId) {
          setStatusForRun(
            runId,
            'error',
            error instanceof Error
              ? error.message
              : 'Failed to save changes.',
          )
        }
      })
  }

  // Background persistence of a whole group edit in one round-trip. Callers
  // mutate local state first (optimistic) and pass only the changed fields per
  // item, same contract as pushItem — this just collapses N per-item PATCH
  // requests into a single batch request. Returns the real, confirmed outcome
  // -- both an overall `ok` (true only when every entry persisted) and the
  // per-item `failedIds` -- so a caller that summarizes its own outcome
  // (batchSetField, batchApproveStage) can await the real result instead of
  // assuming success the instant the request is issued.
  //
  // failedIds matters beyond the summary toast: items/batch.patch.ts validates
  // and applies each entry independently (a single failing entry does not
  // abort the others -- see its own header comment), so a batch can come back
  // as a *partial* failure (HTTP 207: some entries updated, some rejected,
  // e.g. by a concurrent edit that made one item's stage no longer editable
  // server-side). Every entry's item was already mutated optimistically
  // before this call was made, for every entry, not just the ones that end up
  // persisting -- treating a partial failure as "all failed" would falsely
  // discard entries that DID persist, and treating it as an opaque failure
  // with no detail leaves the entries that were actually rejected still
  // showing their optimistic change locally forever, with no sign that write
  // never landed. Returning exactly which ids failed lets the caller revert
  // only those.
  function batchPushItems(
    entries: Array<{
      item: BuildItem
      payload: Record<string, unknown>
      meta?: { stage?: string; reason?: string }
    }>,
  ): Promise<BatchPushOutcome> {
    if (!entries.length) return Promise.resolve({ ok: true, failedIds: new Set() })
    const runId = state.run?.id
    return performFetch('/api/model-builder/items/batch', {
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
        if (response.success) return { ok: true, failedIds: new Set<string>() }

        // Distinguish a total failure (rejected before any entry was even
        // evaluated -- bad auth, a malformed body -- so response.data carries
        // no per-entry breakdown) from a partial one (response.data is the
        // per-entry `{ id, success }[]` items/batch.patch.ts always returns
        // once it reaches its per-entry loop). Only the latter can tell which
        // specific ids actually failed; fall back to treating every entry as
        // failed when that detail isn't available, rather than guessing any
        // of them landed.
        const perItem = Array.isArray(response.data)
          ? (response.data as unknown[])
          : null
        const failedIds = new Set<string>()
        if (perItem) {
          for (const result of perItem) {
            if (
              result &&
              typeof result === 'object' &&
              'id' in result &&
              (result as { success?: unknown }).success !== true
            ) {
              failedIds.add(String((result as { id: unknown }).id))
            }
          }
        } else {
          for (const { item } of entries) failedIds.add(item.id)
        }

        if (runId) {
          setStatusForRun(
            runId,
            'error',
            response.message || 'Failed to save changes.',
          )
        }
        return { ok: false, failedIds }
      })
      .catch((error) => {
        // Same reasoning as pushItem's catch above: mirror the success:false
        // branch's run-scoping instead of unconditionally calling
        // handleError, so a rejected batch write doesn't pop a global error
        // banner for a run the user has cancelled or moved away from. A
        // rejected request never reached the server at all, so every entry
        // is unconfirmed.
        if (runId) {
          setStatusForRun(
            runId,
            'error',
            error instanceof Error
              ? error.message
              : 'Failed to save changes.',
          )
        }
        return {
          ok: false,
          failedIds: new Set(entries.map(({ item }) => item.id)),
        }
      })
  }

  // A stage's content is only safe to overwrite while it is workable — ready,
  // stale, or rejected. This mirrors the item panel's own isEditable gate
  // (components/model-builder/model-builder-item-panel.vue), which hides that
  // stage's textarea and "Draft with AI" button once it's approved/locked. The
  // per-item write paths (updatePitch/updateFields/updatePrompt) are only ever
  // called from behind that same gate, so they never need to check it
  // themselves — but the batch group operations below call draftText/write the
  // field directly for every item in a quantity group, bypassing that UI gate
  // entirely. Without this check, batch-drafting or batch-setting a field
  // silently rewrites an item whose stage the user already reviewed and
  // approved, while its badge keeps showing "approved" — the review gate would
  // be lying about what's actually stored.
  function isStageEditable(item: BuildItem, stageKey: BuildStageKey): boolean {
    const status = item.stages[stageKey].status
    return status === 'ready' || status === 'stale' || status === 'rejected'
  }

  // A GENERATE_ASSETS render (sync or async) can be reopened upstream — and
  // therefore marked 'stale' by markDownstreamStale — while it's still in
  // flight. The render's own completion handler (success or failure) must not
  // blindly overwrite that back to 'ready': it would silently erase the
  // "needs re-review" signal for a candidate that was actually produced from
  // an outdated prompt. Only apply the completion status if nothing else
  // touched the stage while we were awaiting.
  function finishGenerateAssets(item: BuildItem, next: StageState): void {
    if (item.stages.GENERATE_ASSETS.status === 'in-progress') {
      item.stages.GENERATE_ASSETS = next
    }
  }

  // Same race as finishGenerateAssets, applied to COMMIT: commitItem's POST
  // can be in flight when an upstream edit reopens an earlier stage, which
  // marks COMMIT 'stale' via markDownstreamStale. The commit response landing
  // afterward must not silently overwrite that back to 'approved' — the
  // record it just wrote reflects the pre-edit fields, so 'stale' (needing
  // re-review) is the correct outcome, not a false 'approved'.
  function finishCommit(item: BuildItem, next: StageState): void {
    if (item.stages.COMMIT.status === 'in-progress') {
      item.stages.COMMIT = next
    }
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

  // error: null (both locally and in the pushed payload) on all three setters
  // below (model-builder/t-029 cycle 7 left this out of updatePitch/
  // updateFields/updatePrompt deliberately to keep that fix surgical --
  // model-builder/t-045 revisits it). markDownstreamStale already invalidates
  // every downstream stage's approval the moment any of these fire, so a
  // prior item.error -- whether from a failed AI draft (draftText's own
  // catch block routes its success back through these same setters, see
  // below), a failed GENERATE_ASSETS render, or a failed COMMIT -- describes
  // a stage that no longer reflects what's now stored and has to be redone
  // anyway. Clearing here uniformly (manual edit or AI draft alike) also
  // avoids a confusing asymmetry where an AI-redrafted fix clears the item's
  // error banner but retyping the identical fix by hand does not.
  function updatePitch(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.pitch = value
    item.error = null
    markDownstreamStale(item, 'PITCH')
    pushItem(
      item,
      { stageStatuses: item.stages, pitch: item.pitch, error: null },
      { stage: 'PITCH', reason: 'edited pitch' },
    )
  }

  function updateFields(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.fieldsDraft = value
    item.error = null
    markDownstreamStale(item, 'FIELDS_AND_PROMPTS')
    pushItem(
      item,
      {
        stageStatuses: item.stages,
        fieldsDraft: item.fieldsDraft,
        error: null,
      },
      { stage: 'FIELDS_AND_PROMPTS', reason: 'edited fields' },
    )
  }

  function updatePrompt(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.promptDraft = value
    item.error = null
    markDownstreamStale(item, 'FIELDS_AND_PROMPTS')
    pushItem(
      item,
      {
        stageStatuses: item.stages,
        promptDraft: item.promptDraft,
        error: null,
      },
      { stage: 'FIELDS_AND_PROMPTS', reason: 'edited prompt' },
    )
  }

  // --- AI drafting: reuse the existing /api/suggest text generator -----------

  // Which build stage a draft field's content lives under -- pitch under
  // PITCH; fields/artPrompt both under FIELDS_AND_PROMPTS (see
  // model-builder-item-panel.vue's stage sections). Shared by draftText
  // (guards against the stage having been approved while its own draft was
  // in flight) and batchDraftField (skips already-approved items up front).
  function stageForDraftField(field: DraftField): BuildStageKey {
    return field === 'pitch' ? 'PITCH' : 'FIELDS_AND_PROMPTS'
  }

  async function draftText(
    itemId: string,
    field: DraftField,
    instruction?: string,
  ): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false

    // Captured up front so every status message this call ever surfaces --
    // success, the two mid-flight discard cases, and the catch block -- is
    // scoped to the run it was drafting for, mirroring generateItemAsset/
    // pollAsyncArtJob/commitItem/pushItem/batchPushItems (see
    // setStatusForRun's own doc comment). draftText spans a real network
    // round-trip; without this, a draft started against this run but landing
    // after the user has since navigated to (or started) a DIFFERENT run via
    // resetRun/resetAll/openRun pops a misleading "Drafted ..." success (or
    // "was edited/approved while drafting" discard) toast in that other
    // run's banner, about an item that isn't even part of what's on screen.
    const runId = state.run.id

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

    const draftKey = { itemId, field }
    draftingFieldSingleton.claim(draftKey)
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

      // The textarea stays editable while a draft is in flight, so the user
      // may have already typed and committed their own edit via @change
      // before this response landed. Only apply the AI draft if the field
      // still holds the exact value it held when the draft was requested --
      // otherwise it would silently clobber a newer manual edit.
      const liveValue =
        field === 'pitch'
          ? item.pitch
          : field === 'fields'
            ? item.fieldsDraft
            : item.promptDraft
      if (liveValue !== current) {
        setStatusForRun(
          runId,
          'error',
          `${item.label} was edited while drafting — draft discarded to avoid overwriting your changes.`,
        )
        return false
      }

      // The stage this field belongs to may also have been approved while the
      // draft was in flight -- the Approve button for PITCH/FIELDS_AND_PROMPTS
      // has no isDrafting gate of its own (unlike the Draft button next to
      // it), so a user can click Draft then Approve before the response
      // lands. Applying the draft afterward would silently rewrite an
      // approved stage's content while its badge keeps showing 'approved' --
      // the same review-gate-bypass class isStageEditable already guards for
      // batchDraftField/batchSetField, just missing here for the single-item
      // path (updatePitch/updateFields/updatePrompt assume they're always
      // called from behind the UI's editable gate, which is true for a
      // synchronous @change edit but not for this async draft's completion).
      if (!isStageEditable(item, stageForDraftField(field))) {
        setStatusForRun(
          runId,
          'error',
          `${item.label} was approved while drafting — draft discarded to avoid overwriting the approved content.`,
        )
        return false
      }

      // Route through the manual-edit setters so downstream stages stale and the
      // draft persists exactly as on a hand edit.
      if (field === 'pitch') updatePitch(itemId, value)
      else if (field === 'fields') updateFields(itemId, value)
      else updatePrompt(itemId, value)

      setStatusForRun(
        runId,
        'success',
        `Drafted ${field === 'artPrompt' ? 'prompt' : field} for ${item.label}.`,
      )
      return true
    } catch (error) {
      handleError(error, 'drafting model builder text')
      const message =
        error instanceof Error ? error.message : 'Draft request failed.'
      // Bug (model-builder/t-045): draftText is autoBuildItem's very first
      // step (PITCH, then FIELDS_AND_PROMPTS) and so is the most-likely-to-
      // fire failure path of the whole run, but unlike generateItemAsset/
      // generateItemAssetAsync/pollAsyncArtJob/commitItem (fixed for this in
      // model-builder/t-029 cycle 7 -- see
      // verifyModelBuilderErrorPersistenceGuard.ts's doc comment) it never
      // touched item.error at all, only this transient setStatusForRun
      // toast. adaptItem always rebuilds a fresh item from `server.error ??
      // null` on resume/reopen/reload, so an empty/failed AI draft had no
      // trace left anywhere -- not the item-panel.vue error banner, not the
      // per-item "failed" badge in model-builder-progress-matrix.vue /
      // model-builder-batch-editor.vue -- the instant the toast dismissed,
      // even though the item was still stuck exactly where it failed. The
      // two mid-flight discard branches above (edited/approved while
      // drafting) deliberately do NOT set item.error, mirroring
      // generateItemAsset's/pollAsyncArtJob's own "already approved" race
      // guards, which don't push item.error either -- those are the draft
      // request succeeding but being correctly discarded, not a genuine
      // unresolved failure.
      item.error = message
      setStatusForRun(runId, 'error', message)
      pushItem(item, { error: item.error })
      return false
    } finally {
      draftingFieldSingleton.release(draftKey)
    }
  }

  // --- GENERATE_ASSETS: reuse the existing art generator --------------------

  // Persists a GENERATE_ASSETS candidate as a durable ModelBuildArtifact row —
  // this is what adaptItem's imagePath (Artifacts[last]?.promotedPath ??
  // draftPath) reconstructs from on the NEXT resume/reload, independent of
  // item.artImageId (which is written separately, straight onto the item, by
  // the pushItem call right after this one). performFetch never rejects for
  // an HTTP-level failure — a validation error, assertArtImageAttachable's
  // 403, or a 409 from assertRunWritable if the run was cancelled mid-request
  // — it always *resolves* with `{ success: false }` (see its own doc comment:
  // "honor both fields so a body-level failure is never reported as a
  // successful fetch"). This function's try/catch never actually caught that:
  // it awaited performFetch without ever checking `.success`, so ANY failure
  // of this POST was silently discarded with no error surfaced anywhere and
  // no retry. Both call sites proceed straight to marking the stage 'ready'
  // and popping a "Generated a candidate" success toast regardless — so the
  // user sees success while the durable Artifact row (and the imagePath a
  // later resume/reload reconstructs from it) was simply never written.
  // Concrete repro: generate a candidate for an item, have this POST fail for
  // any reason (a transient DB error is enough — no cancellation needed),
  // approve GENERATE_ASSETS ("Keep this asset" still shows the just-rendered
  // thumbnail from local state), then reload the page — the stage is still
  // 'approved' and item.artImageId is still set (commit still works off it),
  // but item.imagePath comes back null because adaptItem has no Artifact row
  // to read it from, so the approved candidate silently loses its preview
  // image with no error ever having been shown. Fixed by checking `.success`
  // and reporting a real failure the same run-scoped way every other action
  // in this file does (mirrors pushItem/batchPushItems); setStatusForRun
  // already no-ops if the run isn't the one currently on screen, so this
  // still stays silent for a run the user has since cancelled or left.
  async function recordArtifact(
    item: BuildItem,
    image: { id: number; imagePath?: string | null },
    output: BuildOutputConfig | undefined,
    prompt: string,
    dims: { width: number; height: number },
    runId: string,
  ): Promise<void> {
    const result = await performFetch(
      `/api/model-builder/items/${item.id}/artifacts`,
      {
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
      },
    )
    if (!result.success) {
      setStatusForRun(
        runId,
        'error',
        result.message ||
          `Generated a candidate for ${item.label}, but recording it failed — it may not survive a reload.`,
      )
    }
  }

  async function generateItemAsset(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false
    const runId = state.run.id

    if (item.generation !== 'image') {
      // Non-image generation kinds (text, plan, video, 3d) are catalogued but
      // not wired into this slice yet.
      item.error = `${item.generation} generation is not wired into the front-end slice yet.`
      item.stages.GENERATE_ASSETS = { status: 'ready', note: item.error }
      setStatus('error', item.error)
      pushItem(item, { error: item.error })
      return false
    }

    const prompt = item.promptDraft.trim() || item.pitch.trim()
    if (!prompt) {
      item.error = 'Add a prompt in Fields & Prompts before generating.'
      setStatus('error', item.error)
      pushItem(item, { error: item.error })
      return false
    }

    const output = getOutput(item.outputKey)
    const dims = sizeToDimensions(output?.size)
    const artStore = useArtStore()

    generatingItemSingleton.claim(item.id)
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

      // artStore.generateCurrentArt can take long enough for the user to
      // cancel this exact run while it's rendering. Unlike draftText (which
      // routes its result through updatePitch/Fields/Prompt's own fresh
      // findItem lookup), this function has held only the original item
      // reference since the top of the call, so it would otherwise persist a
      // candidate — and pop a "Generated a candidate" success toast — for an
      // item whose run the user just told us to abandon. Checking cancelledRunIds
      // (rather than just re-resolving via findItem) also avoids the false
      // positive of the user having merely switched to a different, still-active
      // run, where the candidate should still be saved.
      if (cancelledRunIds.has(runId)) return false

      // generateItemAsset holds only its original item reference across the
      // above awaits, same as pollAsyncArtJob (the async sibling). Two calls
      // can be in flight for the same item (e.g. an item's own "Auto" button
      // and a run-level "Auto-build all" both reaching this item concurrently
      // -- generatingItemSingleton only guards a *different* owner overwriting
      // this one, not two calls sharing the same item id). If the user already
      // approved the earlier call's candidate while this one was still
      // rendering, applying this render's image unconditionally would silently
      // replace what was just approved, with no re-review. Mirrors
      // pollAsyncArtJob's identical guard.
      if (item.stages.GENERATE_ASSETS.status === 'approved') {
        setStatusForRun(
          runId,
          'error',
          `${item.label} finished generating after its candidate was already approved — discarded to avoid silently replacing it.`,
        )
        return false
      }

      const image = result.data as { id: number; imagePath?: string | null }
      item.artImageId = image.id
      item.imagePath = image.imagePath ?? null
      finishGenerateAssets(item, { status: 'ready' })

      await recordArtifact(item, image, output, prompt, dims, runId)
      // error: null clears any error a previous failed attempt on this same
      // item persisted (see the catch block below) -- otherwise a resolved
      // problem's stale message would resurface on the next resume/reload,
      // right alongside the freshly-generated candidate.
      pushItem(item, {
        stageStatuses: item.stages,
        artImageId: item.artImageId,
        error: null,
      })

      // Gated by setStatusForRun, not a plain setStatus: the user may have
      // navigated away to (or started) a different run via resetRun/resetAll/
      // openRun without cancelling this one -- the render still finishes and
      // still persists (the run stays valid and resumable), but a bare
      // setStatus here would pop this success toast in whatever OTHER run's
      // banner the user is now looking at, about an item that isn't even
      // part of what's on screen.
      setStatusForRun(
        runId,
        'success',
        `Generated a candidate for ${item.label}.`,
      )
      return true
    } catch (error) {
      // Mirror the success path's cancelledRunIds guard above: a render that
      // fails after the user has cancelled this run shouldn't surface a stray
      // error banner for a run the user no longer has open.
      if (cancelledRunIds.has(runId)) return false

      handleError(error, 'generating model builder asset')
      item.error = error instanceof Error ? error.message : 'Generation failed.'
      finishGenerateAssets(item, { status: 'ready', note: item.error })
      setStatusForRun(runId, 'error', item.error)
      // Bug (model-builder/t-029): item.error is a real, server-writable
      // `ModelBuildItem.error` column (server/api/model-builder/runs/
      // index.ts's ItemPatchBody accepts it), and item-panel.vue's error
      // banner (`v-if="item.error"`) reads it -- but every failure branch in
      // this file used to only mutate the local reactive item, never push
      // it. adaptItem always rebuilds from `server.error ?? null` on
      // resume/reopen/reload (see normalizeStages'/adaptRun's own doc
      // comments for the identical class of bug with stageStatuses/
      // sourceSnapshot), so a real, still-unresolved failure -- and the
      // per-item "failed" badge in model-builder-progress-matrix.vue /
      // model-builder-batch-editor.vue, which also keys off this item's
      // error text -- silently vanished the moment the page reloaded or the
      // run was reopened from History, even though nothing about the item
      // had actually been fixed.
      pushItem(item, { error: item.error })
      return false
    } finally {
      // state.generatingItemId is a store-wide singleton (not per-item, unlike
      // artJobId/queueState below) — see createOwnedSingleton's doc comment
      // for why release() only clears it when it's still this call's own value.
      generatingItemSingleton.release(item.id)
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
    runId: string,
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
        finishGenerateAssets(item, {
          status: 'in-progress',
          note: item.queueState,
        })
        await new Promise((resolve) => setTimeout(resolve, ASYNC_ART_POLL_MS))
        continue
      }

      // Terminal status (DONE/FAILED/CANCELLED).
      item.artJobId = null
      item.queueState = null

      const result = await artStore.finalizeQueuedArtImage(job, generateData)

      // finalizeQueuedArtImage is itself a network round-trip long enough for
      // the user to cancel this exact run while it's in flight. By this point
      // item.artJobId has already been cleared above (as part of normal
      // terminal-status handling, not by cancellation), so the artJobId check
      // above can no longer distinguish "cancelled" from "completing
      // normally" -- cancelRun's own clearing of item.artJobId is a no-op
      // here. Only cancelledRunIds still tells them apart. Mirrors
      // generateItemAsset's cancelledRunIds guard: don't persist a candidate,
      // PATCH/POST onto a cancelled run's item, or pop a misleading
      // success/error toast for a run the user no longer has open.
      if (cancelledRunIds.has(runId)) return

      if (!result.success || !result.data) {
        item.error = result.message || `Art job ${jobId} did not complete.`
        finishGenerateAssets(item, { status: 'ready', note: item.error })
        setStatusForRun(runId, 'error', item.error)
        // See generateItemAsset's identical pushItem — this async sibling's
        // failure was silently local-only for the same reason.
        pushItem(item, { error: item.error })
        return
      }

      // item.artJobId was cleared above, before this function's own await --
      // that's what the item panel's isQueued reads, so for the exact span
      // between that clear and finalizeQueuedArtImage resolving, isQueued is
      // false while GENERATE_ASSETS is still 'in-progress'. On a regenerate
      // (item.artImageId already holds a prior candidate), the panel's
      // canApproveAssets briefly evaluates true during that span -- neither
      // isGenerating nor isQueued nor isLocked block it -- letting the user
      // click "Keep this asset" using the OLD image; approveStage writes
      // 'approved' straight through with no gate of its own. Applying this
      // render's NEW image unconditionally below would then silently swap
      // what the just-approved stage points at, with no re-review. Mirrors
      // finishGenerateAssets' "only write if nothing else touched the stage
      // while we were awaiting" rule, extended to the image itself -- but
      // only for 'approved': a concurrent upstream edit marking this stage
      // 'stale' while the job was in flight is the existing, intended way to
      // flag "re-review this candidate," and should still receive the image.
      if (item.stages.GENERATE_ASSETS.status === 'approved') {
        setStatusForRun(
          runId,
          'error',
          `${item.label} finished generating after its candidate was already approved — discarded to avoid silently replacing it.`,
        )
        return
      }

      const image = result.data as { id: number; imagePath?: string | null }
      item.artImageId = image.id
      item.imagePath = image.imagePath ?? null
      finishGenerateAssets(item, { status: 'ready' })

      await recordArtifact(item, image, output, prompt, dims, runId)
      // error: null — see generateItemAsset's identical success-path clear.
      pushItem(item, {
        stageStatuses: item.stages,
        artImageId: item.artImageId,
        error: null,
      })

      // Gated by setStatusForRun -- see its doc comment (same reasoning as
      // generateItemAsset's identical success-path gate above it).
      setStatusForRun(
        runId,
        'success',
        `Generated a candidate for ${item.label}.`,
      )
      return
    }
  }

  // Enqueues generation and returns as soon as the job is queued — it does
  // NOT wait for the render. Progress shows via item.queueState
  // ('queued' | 'rendering') until pollAsyncArtJob resolves the item.
  async function generateItemAssetAsync(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false
    const runId = state.run.id

    if (item.generation !== 'image') {
      item.error = `${item.generation} generation is not wired into the front-end slice yet.`
      item.stages.GENERATE_ASSETS = { status: 'ready', note: item.error }
      setStatus('error', item.error)
      pushItem(item, { error: item.error })
      return false
    }

    const prompt = item.promptDraft.trim() || item.pitch.trim()
    if (!prompt) {
      item.error = 'Add a prompt in Fields & Prompts before generating.'
      setStatus('error', item.error)
      pushItem(item, { error: item.error })
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
        runId,
      )
      return true
    } catch (error) {
      // Mirror generateItemAsset's identical guard, missing here until now:
      // prepareArtGenerator/enqueueCurrentArt is a network round-trip the
      // user can cancel this exact run during. Without this check, an
      // enqueue that fails after cancellation still calls the global
      // handleError() (an app-wide error banner, per its own doc comment --
      // not scoped to any run) and rewrites the detached item's stage for a
      // run the user already told the app to abandon, instead of quietly
      // no-opping the way its synchronous sibling does.
      if (cancelledRunIds.has(runId)) return false

      handleError(error, 'queueing model builder asset')
      item.error =
        error instanceof Error ? error.message : 'Failed to queue generation.'
      finishGenerateAssets(item, { status: 'ready', note: item.error })
      item.queueState = null
      item.artJobId = null
      setStatusForRun(runId, 'error', item.error)
      // See generateItemAsset's identical pushItem — this enqueue failure
      // was silently local-only for the same reason.
      pushItem(item, { error: item.error })
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
    const targetType =
      item.action === 'ASSET_ONLY'
        ? 'ArtImage'
        : resolveTargetModel(item.action, item.outputKey, state.run.sourceType)
    return {
      itemId: item.id,
      action: item.action,
      targetType,
      summary:
        item.action === 'ASSET_ONLY'
          ? `Promote generated asset for ${item.label} to ${state.run.sourceLabel}.`
          : `${item.action} ${targetType} from ${item.label}.`,
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
    if (!item || !state.run) return false
    const runId = state.run.id

    committingItemSingleton.claim(item.id)
    item.error = null
    item.stages.COMMIT = { status: 'in-progress' }
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

      // The commit POST durably creates/links/promotes the target server-side
      // regardless of what happens next -- same as generateItemAsset's art
      // render, this can't be undone from here. But unlike generateItemAsset,
      // the server itself already wrote item.stageStatuses.COMMIT, so skipping
      // the local mutations below on a cancelled run only avoids re-attaching
      // a detached item object and popping a misleading "committed" success
      // toast for a run the user already told the app to abandon. Mirrors the
      // cancelledRunIds guard already used by generateItemAsset/pollAsyncArtJob.
      if (cancelledRunIds.has(runId)) return false

      const target = response.data?.target ?? null
      finishCommit(item, {
        status: 'approved',
        note: target ? `Committed → ${target.type} #${target.id}` : 'Committed.',
      })
      if (target) {
        item.targetType = target.type
        item.targetId = target.id
      }
      // Clears any error a previous failed commit attempt on this item
      // persisted (see the catch block below) -- the server already durably
      // committed the target above, so a stale message from an earlier,
      // now-irrelevant failure must not resurface on the next resume/reload
      // right next to "Committed → ...". This is the item's only client PATCH
      // on a successful commit; stageStatuses/targetId/targetType are written
      // authoritatively by the commit POST itself.
      pushItem(item, { error: null })
      // Gated by setStatusForRun -- see its doc comment. The commit itself
      // already durably landed server-side regardless; this only suppresses
      // a misleading "committed" toast if the user has since navigated away
      // to (or started) a different run without cancelling this one.
      setStatusForRun(
        runId,
        'success',
        target
          ? `${item.label} committed → ${target.type} #${target.id}.`
          : `${item.label} committed.`,
      )
      return true
    } catch (error) {
      if (cancelledRunIds.has(runId)) return false

      handleError(error, 'committing build item')
      item.error = error instanceof Error ? error.message : 'Commit failed.'
      finishCommit(item, { status: 'ready', note: item.error })
      setStatusForRun(runId, 'error', item.error)
      // Bug (model-builder/t-029): see generateItemAsset's identical
      // pushItem/doc comment -- item.error is a real server column
      // (ModelBuildItem.error) that this catch block used to only mutate
      // locally, so a genuine, unresolved commit failure (and the per-item
      // "failed" badge in model-builder-progress-matrix.vue /
      // model-builder-batch-editor.vue, which also reads this item's error
      // text) silently vanished the instant the page reloaded or the run
      // was reopened from Run History.
      pushItem(item, { error: item.error })
      return false
    } finally {
      committingItemSingleton.release(item.id)
    }
  }

  // --- auto-build: walk an item (or the whole run) to completion ------------

  function toggleIncludeArt(value?: boolean): void {
    state.includeArt = typeof value === 'boolean' ? value : !state.includeArt
  }

  // AutoBuildOutcome is declared near StageStatus (top of file) and exported
  // — autoBuildRun/batchAutoBuild below now also mirror it per-item onto
  // BuildItem.lastAutoBuildOutcome, not just tally it into their own summary.

  // Mirrors model-builder-item-panel.vue's per-item isManualActionInFlight
  // computed (generating / queued / committing / drafting any field) so a
  // batch or run trigger can show the same "N busy" signal *before* starting
  // — those items would otherwise just silently come back 'skipped' from
  // autoBuildItem below, with no feedback until the run/batch finishes (t-038).
  function isItemManualActionInFlight(itemId: string): boolean {
    const item = findItem(itemId)
    return (
      state.generatingItemId === itemId ||
      Boolean(item?.queueState) ||
      state.committingItemId === itemId ||
      draftingField.value?.itemId === itemId
    )
  }

  // Run one item through every gate automatically with sensible defaults: draft
  // what's empty, generate art only when wanted, and commit. "Create directly"
  // for CREATE/UPDATE items when art is off. Returns the outcome so batch/run
  // callers can tell a busy skip apart from a real failure.
  async function autoBuildItem(itemId: string): Promise<AutoBuildOutcome> {
    const item = findItem(itemId)
    if (!item || !state.run) return 'failed'

    if (state.autoBuildingItemId === item.id) return 'skipped'

    // A manual single-stage action (Generate candidate / Draft with AI /
    // Execute commit) already in flight for this item must block Auto too --
    // otherwise Auto walks straight into the same stage and fires a second,
    // concurrent request (generateItemAsset's own approved-stage guard only
    // catches the case where the first call already resolved to approved; it
    // does nothing while both calls are still racing mid-flight). This must
    // also check item.queueState (mirrors isItemManualActionInFlight above)
    // -- otherwise an item with an async art job already queued/rendering
    // via "Queue generation in background" isn't recognized as busy here,
    // and Auto-build group/all (unlike the single-item Auto button, which
    // does gate on isQueued) walks straight into GENERATE_ASSETS and fires a
    // second, synchronous generateItemAsset() call for the same item while
    // the first is still in flight.
    if (isItemManualActionInFlight(item.id)) {
      return 'skipped'
    }

    const isAsset = item.action === 'ASSET_ONLY'
    const wantArt = state.includeArt && item.generation === 'image'

    // An ASSET_ONLY item is nothing but its art — can't auto-build without it.
    if (isAsset && !wantArt) {
      setStatus(
        'error',
        `${item.label} is asset-only — enable art to auto-build it.`,
      )
      return 'failed'
    }

    autoBuildingItemSingleton.claim(item.id)
    try {
      if (item.stages.PITCH.status !== 'approved') {
        if (!item.pitch.trim()) {
          // draftText can fail (network error, "the model returned nothing
          // useful", or its own isStageEditable/live-value guards) and still
          // leave item.pitch empty. Unlike GENERATE_ASSETS below -- whose
          // `generated` result already gates its approveStage call -- this
          // branch used to approve PITCH unconditionally afterward, which
          // could silently mark an empty pitch 'approved'. The single-item
          // Approve button in model-builder-item-panel.vue treats that as
          // impossible (`:disabled="isLocked('PITCH') || !pitch.trim()"`), so
          // auto-build must not produce a state the manual UI itself refuses.
          const drafted = await draftText(itemId, 'pitch')
          if (!drafted) return 'failed'
        }
        approveStage(itemId, 'PITCH')
      }

      if (item.stages.FIELDS_AND_PROMPTS.status !== 'approved') {
        if (!isAsset) {
          const drafted = await draftText(itemId, 'fields')
          if (!drafted) return 'failed'
        }
        if (wantArt && !item.promptDraft.trim()) {
          // Mirrors the PITCH branch above: only draft what's actually
          // empty. Unlike fieldsDraft (always pre-filled with a non-empty
          // defaultFieldsTemplate skeleton, so an emptiness check there could
          // never fire and isn't a reliable signal of user intent),
          // promptDraft starts genuinely empty -- so a non-empty value here
          // can only mean the user already typed their own generation
          // prompt (the "Generation prompt" textarea's @change handler
          // persists it via updatePrompt) before clicking Auto. Drafting
          // unconditionally, as this used to, silently discarded that
          // hand-typed prompt for a fresh AI one the user never asked for or
          // reviewed -- and generateItemAsset immediately renders art from
          // it (`item.promptDraft.trim() || item.pitch.trim()`) instead of
          // what they wrote.
          const drafted = await draftText(itemId, 'artPrompt')
          if (!drafted) return 'failed'
        }
        // approveStage() unconditionally overwrites the stage's status --
        // unlike finishGenerateAssets/finishCommit, it has no in-flight
        // check. A concurrent Edit click on PITCH (clickable throughout
        // auto-build; only isCommitting disables it) can markDownstreamStale
        // this very stage while the awaits above are pending, and a 'stale'
        // status here means the drafted content reflects the pre-edit pitch.
        // Only approve if the stage is still the 'ready' state auto-build
        // itself put it in -- otherwise it needs a fresh review, not a
        // silent approval of stale content.
        if (item.stages.FIELDS_AND_PROMPTS.status === 'ready') {
          approveStage(itemId, 'FIELDS_AND_PROMPTS')
        } else {
          return 'failed'
        }
      }

      if (item.stages.GENERATE_ASSETS.status !== 'approved') {
        if (wantArt) {
          const generated = await generateItemAsset(itemId)
          if (!generated) return 'failed'
        }
        // Same race as above: generateItemAsset() can return true (the
        // network render succeeded) while finishGenerateAssets() correctly
        // refused to write the result because a concurrent upstream edit
        // already staled this stage. Trusting `generated` alone would
        // silently re-approve the reopened-and-unreviewed candidate.
        if (item.stages.GENERATE_ASSETS.status === 'ready') {
          approveStage(itemId, 'GENERATE_ASSETS')
        } else {
          return 'failed'
        }
      }

      if (item.stages.COMMIT.status !== 'approved') {
        return (await commitItem(itemId)) ? 'committed' : 'failed'
      }
      return 'committed'
    } finally {
      autoBuildingItemSingleton.release(item.id)
    }
  }

  // Auto-build every not-yet-committed item in the run, in order.
  async function autoBuildRun(): Promise<void> {
    if (!state.run || state.autoBuilding) return
    state.autoBuilding = true
    clearStatus()

    // Captured so this loop can tell "the user switched to a different run
    // via History mid-auto-build" apart from "still the same run" across each
    // item's awaited work. Without this check the loop keeps walking the
    // original run's items (autoBuildItem's own findItem lookup just fails
    // fast against the newly-active run, so no wrong data is written — but
    // state.autoBuilding is a store-wide flag, not per-run, so it stays true
    // and keeps the newly-opened run's "Auto-build all" button disabled until
    // the abandoned run's in-flight item finishes; the final status message
    // would then also overwrite whatever the user is now looking at with a
    // completed count for a run they've navigated away from).
    const runId = state.run.id
    const items = [...state.run.items]
    let committed = 0
    let skipped = 0
    let failed = 0
    try {
      for (const item of items) {
        if (state.run?.id !== runId) return
        if (item.stages.COMMIT.status === 'approved') {
          committed++
          // Already committed before this pass touched it -- not routed
          // through autoBuildItem, so it wouldn't otherwise get a fresh
          // 'committed' outcome and could keep showing a stale 'failed'
          // badge from an earlier attempt.
          item.lastAutoBuildOutcome = 'committed'
          continue
        }
        const outcome = await autoBuildItem(item.id)
        // Mirrored onto the item itself (not just tallied into this run's
        // aggregate counters) so model-builder-progress-matrix.vue's
        // per-item badge has something to read after the run finishes --
        // previously the only per-item failure signal was item.error, which
        // several of autoBuildItem's own 'failed' branches (an empty AI
        // draft, a stage gone stale mid-run, an ineligible asset-only item)
        // never set, and there was no per-item signal at all short of
        // opening each item's own panel (t-029).
        item.lastAutoBuildOutcome = outcome
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
        else failed++
      }
      if (state.run?.id === runId) {
        // A 'failed' outcome (a rejected commit — e.g. the ASSET_ONLY
        // attachability re-check in commit.post.ts firing because the
        // ArtImage's owner changed its visibility mid-run — a draft that
        // came back empty, or any other real error autoBuildItem's own
        // per-stage branches surface) is neither 'committed' nor 'skipped',
        // so committed + skipped alone can undercount items.length with no
        // explanation. Unconditionally reporting 'success' here (the
        // pre-fix behavior) papered over that gap twice over: the count
        // silently didn't add up, and this final call clobbers whatever
        // 'error' tone an earlier failed item in this same loop already set
        // via setStatus/setStatusForRun, replacing it with a misleading
        // green banner. Surface failures in both the tone and the count.
        const skippedNote = skipped
          ? ` (${skipped} skipped — manual action in progress, retry after it finishes)`
          : ''
        const failedNote = failed
          ? ` (${failed} failed — see the item's own error for details)`
          : ''
        setStatus(
          failed ? 'error' : 'success',
          `Auto-build finished: ${committed}/${items.length} committed${failedNote}${skippedNote}.`,
        )
      }
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
    const stageKey = stageForDraftField(field)
    batchingOutputSingleton.claim(outputKey)
    clearStatus()
    let drafted = 0
    try {
      for (const item of items) {
        // Skip items whose stage is already approved/locked — see
        // isStageEditable's doc comment.
        if (!isStageEditable(item, stageKey)) continue
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
      batchingOutputSingleton.release(outputKey)
    }
  }

  // Set one model field to the same value on every item in a group (e.g. rarity =
  // RARE across 10 rewards). Only rewrites items whose value actually changes.
  // Persists the whole group in a single batch request rather than one PATCH
  // per changed item. Reports success only once that request actually
  // confirms it -- unlike every other batch entry point (batchDraftField,
  // batchAutoBuild), this used to call batchPushItems(entries) without
  // awaiting it and then unconditionally show a "Set ... on N/M items."
  // success toast the instant the request was issued, before the server had
  // even responded. A partial or total failure (e.g. a concurrent edit on
  // another tab making one item no longer stage-editable server-side, or a
  // network error) still popped that same misleading success banner, then
  // moments later silently overwrote it with batchPushItems' own generic,
  // unscoped-looking "Failed to save changes." -- while every item's local
  // fieldsDraft/stageStatuses had already been optimistically changed with no
  // indication of which items, if any, never actually persisted.
  //
  // Bug (model-builder/t-029 cycle 9): that last part -- "no indication of
  // which items never actually persisted" -- was more than a messaging gap.
  // items/batch.patch.ts validates and applies every entry independently (a
  // single failing entry does not abort the others), so a real-world failure
  // here is usually *partial*: most items persist, one or two are rejected
  // (e.g. a concurrent edit made that item's FIELDS_AND_PROMPTS no longer
  // editable server-side by the time this batch reached it). Every entry's
  // item was already mutated optimistically before the request was sent, and
  // this used to leave ALL of them, including the rejected ones, showing
  // their new fieldsDraft/stageStatuses forever -- the UI kept claiming a
  // field was set to a value that was never actually written, with nothing
  // short of a full reload to reveal the discrepancy. batchPushItems now
  // reports exactly which ids failed so only those get reverted below.
  async function batchSetField(
    outputKey: string,
    fieldKey: string,
    value: string,
  ): Promise<void> {
    const items = groupItems(outputKey)
    const entries: Array<{
      item: BuildItem
      payload: Record<string, unknown>
      meta?: { stage?: string; reason?: string }
    }> = []
    // Snapshotted before each item's optimistic mutation below so a
    // server-rejected entry can be reverted to exactly what it held before
    // this call, instead of keeping an edit that never actually persisted.
    const previous = new Map<
      string,
      { fieldsDraft: string; stages: BuildItem['stages'] }
    >()
    for (const item of items) {
      // Skip items whose FIELDS_AND_PROMPTS is already approved/locked — see
      // isStageEditable's doc comment.
      if (!isStageEditable(item, 'FIELDS_AND_PROMPTS')) continue
      const modelType = state.run
        ? resolveTargetModel(item.action, item.outputKey, state.run.sourceType)
        : undefined
      const next = setFieldLine(item.fieldsDraft, fieldKey, value, modelType)
      if (next === item.fieldsDraft) continue
      previous.set(item.id, {
        fieldsDraft: item.fieldsDraft,
        stages: item.stages,
      })
      item.fieldsDraft = next
      markDownstreamStale(item, 'FIELDS_AND_PROMPTS')
      entries.push({
        item,
        payload: { stageStatuses: item.stages, fieldsDraft: item.fieldsDraft },
        meta: { stage: 'FIELDS_AND_PROMPTS', reason: 'edited fields' },
      })
    }
    batchingOutputSingleton.claim(outputKey)
    try {
      const { ok, failedIds } = await batchPushItems(entries)
      // On failure, batchPushItems already surfaced the real error via
      // setStatusForRun -- reporting a blanket "success" here too would be
      // actively misleading.
      if (ok) {
        setStatus(
          'success',
          `Set ${fieldKey} on ${entries.length}/${items.length} items.`,
        )
      } else if (failedIds.size) {
        // Revert exactly the entries the server rejected -- see this
        // function's own doc comment and batchPushItems' for why a partial
        // failure must not leave those items showing an unpersisted edit.
        for (const entry of entries) {
          if (!failedIds.has(entry.item.id)) continue
          const prior = previous.get(entry.item.id)
          if (prior) {
            entry.item.fieldsDraft = prior.fieldsDraft
            entry.item.stages = prior.stages
          }
        }
      }
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  // Approve a stage for every (unlocked) item in a group at once. Persists
  // the whole group in a single batch request rather than N per-item
  // PATCHes, and reports success only once that request actually confirms it
  // -- mirrors batchSetField (see its own doc comment for the identical
  // race). The pre-fix shape called the single-item approveStage (whose own
  // pushItem is a fire-and-forget background PATCH) in a loop and
  // unconditionally showed an "Approved N items." success toast the instant
  // the loop finished, before any of those N background writes had actually
  // resolved. That's fine for a fire-and-forget action reporting on
  // separately-confirmed local work (e.g. generateItemAsset's toast reports
  // the *render* succeeding, with pushItem persisting it alongside) -- but
  // "approved" has no meaning other than "persisted": there's no separate
  // local accomplishment being confirmed the way a rendered asset is. A
  // concurrent run cancellation (or any other server-side rejection, e.g.
  // assertRunWritable) during that loop could pop a false "Approved N
  // items." success toast, immediately followed by pushItem's own
  // unrelated-looking "Failed to save changes." error moments later -- with
  // every item's local stageStatuses already optimistically flipped to
  // 'approved' either way, same as batchSetField's pre-fix bug.
  //
  // Bug (model-builder/t-029 cycle 9): fixing the toast (this function
  // already did, per the paragraph above) left a second, quieter half of the
  // same bug in place -- see batchPushItems' and batchSetField's own doc
  // comments for the full picture. A *partial* server-side rejection (one
  // item's stage is no longer approvable by the time this batch reaches it,
  // the rest persist fine) used to leave every item, including the rejected
  // one, showing 'approved' locally forever: the toast stopped lying, but the
  // badge kept lying. batchPushItems now reports exactly which ids failed so
  // only those get reverted below.
  async function batchApproveStage(
    outputKey: string,
    stageKey: BuildStageKey,
  ): Promise<void> {
    const entries: Array<{
      item: BuildItem
      payload: Record<string, unknown>
      meta?: { stage?: string; reason?: string }
    }> = []
    // Snapshotted before each item's optimistic mutation below so a
    // server-rejected entry can be reverted to exactly the stages it held
    // before this call, instead of keeping an approval that never actually
    // persisted.
    const previousStages = new Map<string, BuildItem['stages']>()
    for (const item of groupItems(outputKey)) {
      if (item.stages[stageKey].status === 'locked') continue
      previousStages.set(item.id, { ...item.stages })
      item.stages[stageKey] = { status: 'approved' }
      const next = BUILD_STAGES[stageIndex(stageKey) + 1]
      if (next && item.stages[next.key].status === 'locked') {
        item.stages[next.key] = { status: 'ready' }
      }
      entries.push({
        item,
        payload: { stageStatuses: item.stages },
        meta: { stage: stageKey },
      })
    }
    batchingOutputSingleton.claim(outputKey)
    try {
      const { ok, failedIds } = await batchPushItems(entries)
      // On failure, batchPushItems already surfaced the real error via
      // setStatusForRun -- reporting a blanket "success" here too would be
      // actively misleading.
      if (ok) {
        setStatus(
          'success',
          `Approved ${stageKey} for ${entries.length} items.`,
        )
      } else if (failedIds.size) {
        // Revert exactly the entries the server rejected -- see this
        // function's own doc comment and batchPushItems' for why a partial
        // failure must not leave those items showing an unpersisted approval.
        for (const entry of entries) {
          if (!failedIds.has(entry.item.id)) continue
          const previous = previousStages.get(entry.item.id)
          if (previous) entry.item.stages = previous
        }
      }
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  // Auto-build (draft → generate → commit with defaults) every not-yet-committed
  // item in a single group.
  async function batchAutoBuild(outputKey: string): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    batchingOutputSingleton.claim(outputKey)
    clearStatus()
    let committed = 0
    let skipped = 0
    let failed = 0
    try {
      for (const item of items) {
        if (item.stages.COMMIT.status === 'approved') {
          committed++
          // See autoBuildRun's identical branch: keep the badge from
          // showing a stale 'failed' for an item already committed before
          // this pass reached it.
          item.lastAutoBuildOutcome = 'committed'
          continue
        }
        const outcome = await autoBuildItem(item.id)
        // See autoBuildRun's identical line -- mirrors the outcome onto the
        // item itself for model-builder-progress-matrix.vue's per-item
        // badge and model-builder-batch-editor.vue's own per-item badge.
        item.lastAutoBuildOutcome = outcome
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
        else failed++
      }
      // Same gap as autoBuildRun's identical summary (see its doc comment):
      // a 'failed' outcome is neither committed nor skipped, so it must be
      // counted and reflected in the tone here too, or a rejected commit
      // (e.g. the ASSET_ONLY attachability re-check) inside this group
      // reports as an unconditional green "success" with an unexplained gap
      // between committed+skipped and items.length.
      const skippedNote = skipped
        ? ` (${skipped} skipped — manual action in progress, retry after it finishes)`
        : ''
      const failedNote = failed
        ? ` (${failed} failed — see the item's own error for details)`
        : ''
      setStatus(
        failed ? 'error' : 'success',
        `Auto-built ${committed}/${items.length} in this group${failedNote}${skippedNote}.`,
      )
    } finally {
      batchingOutputSingleton.release(outputKey)
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
        if (
          response.success &&
          response.data &&
          response.data.status !== 'CANCELLED'
        ) {
          data = response.data
        } else if (response.success && response.data) {
          // The remembered run exists but was cancelled (e.g. cancelled from
          // another tab/run, so this tab's shared localStorage key was never
          // cleared by cancelRun's own-run check). Stop remembering it so we
          // don't keep resuming a dead run into a read-only 409 trap.
          safeRemove(runIdKey)
        }
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
        // Resuming the run that's already active must not swap in a fresh object:
        // adaptRun/adaptItem reset the client-only artJobId/queueState fields to
        // null, and a component remount (e.g. navigating away from and back to
        // the Model Builder page) re-runs resumeRun() unconditionally. Replacing
        // state.run here would orphan pollAsyncArtJob's reference to the live item
        // object mid-poll, making an in-flight async generation silently vanish
        // from the UI even though it's still running (and completes against the
        // now-detached object) — the same failure mode openRun() already guards
        // against for its own reopen path.
        if (state.run?.id === String(data.id)) {
          state.step = 'run'
          setActiveRunId(data.id)
        } else {
          state.run = adaptRun(data)
          state.sourceType = data.sourceType as SourceTypeKey
          state.recipeKey = data.recipeKey as RecipeKey
          state.step = 'run'
          setActiveRunId(data.id)
        }
      }
    } catch {
      // Not signed in, or no runs yet — start fresh at the source picker.
    }
  }

  // --- run history ----------------------------------------------------------

  // fetchRuns() re-fires on every mount of model-builder-run-history.vue
  // (onMounted) and on its "Refresh" button — unlike loadSources(), which
  // guards the identical class of race with `requestedType`, this had no
  // request-scoping at all. Toggling History closed then open again (a
  // normal double-click, not exotic timing) starts a second call while the
  // first is still in flight; nothing here stopped the FIRST call's response
  // from landing after the second's and unconditionally overwriting
  // state.runs with its older snapshot — silently resurrecting a run the
  // user cancelled in between (cancelRun's own `state.runs = state.runs.
  // filter(...)` gets clobbered), losing one created in between, or just
  // flipping loadingRuns back to false while the newer, still-in-flight call
  // is the one that should own that spinner. Captured a request ticket, same
  // pattern as loadSources' requestedType, so a stale response is discarded
  // instead of applied.
  let fetchRunsRequestId = 0

  async function fetchRuns(): Promise<void> {
    const requestId = ++fetchRunsRequestId
    state.loadingRuns = true
    try {
      const response = await performFetch<ServerRun[]>(
        '/api/model-builder/runs?take=50',
      )
      if (fetchRunsRequestId !== requestId) return
      if (response.success && Array.isArray(response.data)) {
        state.runs = response.data.map(adaptRun)
      } else if (!response.success) {
        setStatus('error', response.message || 'Failed to load run history.')
      }
    } catch (error) {
      if (fetchRunsRequestId !== requestId) return
      handleError(error, 'loading run history')
    } finally {
      if (fetchRunsRequestId === requestId) state.loadingRuns = false
    }
  }

  // openRun's fallback fetch (below) had no request-scoping at all -- unlike
  // fetchRuns() and loadSources(), which each guard this identical class of
  // bug (an async list/record fetch whose response can land out of order) by
  // capturing a ticket up front and discarding any response that arrives
  // after state has moved on. The run-history "Open" button has no in-flight
  // guard of its own (only cancellingRunId disables it), so a user can click
  // Open on run A -- not yet in state.runs, so this falls through to the
  // network fetch -- then, before it resolves, click Open on run B. If B is
  // already cached (or becomes the active run) it resolves synchronously, but
  // A's slower response can still land afterward and unconditionally
  // overwrite state.run with the WRONG run -- silently discarding the user's
  // actual last click. Fixed with the same monotonic-ticket pattern as
  // fetchRunsRequestId: captured at the very top of every call (so a newer
  // call -- sync or async -- always invalidates an older call's pending
  // fetch), and checked before applying the response in both the success and
  // catch branches.
  let openRunRequestId = 0

  async function openRun(runId: string): Promise<void> {
    const requestId = ++openRunRequestId

    // Reopening the run that's already active must not swap in a fresh object:
    // fetchRuns()/the fallback fetch below both rebuild items via adaptRun/adaptItem,
    // which reset the client-only artJobId/queueState fields to null. Replacing
    // state.run here would orphan pollAsyncArtJob's reference to the live item object
    // mid-poll, making an in-flight async generation silently vanish from the UI even
    // though it's still running (and completes against the now-detached object).
    if (state.run?.id === runId) {
      state.step = 'run'
      return
    }

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
      if (openRunRequestId !== requestId) return
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
      if (openRunRequestId !== requestId) return
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
      // Record the cancellation so a synchronous generateItemAsset call still
      // in flight for one of this run's items can tell it was cancelled (see
      // generateItemAsset / cancelledRunIds above).
      cancelledRunIds.add(runId)
      // Stop any in-flight async art-generation polls (generateItemAssetAsync)
      // for this run's items. pollAsyncArtJob's while loop keys off
      // item.artJobId === jobId, so clearing it makes the loop exit at its
      // next check instead of finishing minutes later and PATCHing/POSTing
      // artifacts onto items that belong to a run the user just cancelled —
      // and popping a misleading "Generated a candidate" success toast for
      // work they said they no longer want.
      //
      // adaptRun/adaptItem never memoize, so state.runs (populated
      // independently by fetchRuns(), e.g. when the History panel mounts)
      // and state.run (the currently open run) can each hold a distinct
      // object instance for the same run id. pollAsyncArtJob's closure
      // references whichever item object was live in state.run at the time
      // generateItemAssetAsync queued the job — clearing only ONE of the two
      // copies (the old `??` picked at most one) can null the state.runs
      // duplicate while leaving state.run's original untouched, orphaning
      // the poll instead of stopping it. Clear both copies whenever present.
      const cancelledRuns = [
        state.runs.find((entry) => entry.id === runId),
        state.run?.id === runId ? state.run : null,
      ].filter((entry): entry is BuildRun => entry != null)
      cancelledRuns.forEach((run) => {
        run.items.forEach((item) => {
          item.artJobId = null
          item.queueState = null
        })
      })
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
    // Clear the same store-wide "who's in flight" singletons resetAll() clears
    // (see its comment) -- resetRun() is reachable from ordinary UI clicks
    // ("New run" in the progress matrix and run history, plus cancelRun()
    // cancelling the active run) without going through resetAll(), so it was
    // leaking the same stale-busy-indicator bug through a second path: e.g.
    // starting a batch on output group "rewards" in Run A, then resetting to
    // Run B before it finishes left Run B's same-named "rewards" batch
    // controls reading busy until Run A's abandoned call happened to resolve.
    state.generatingItemId = null
    state.committingItemId = null
    state.autoBuilding = false
    state.autoBuildingItemId = null
    state.batchingOutputKey = null
    draftingField.value = null
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
    // Clear the remaining store-wide "who's in flight" singletons too --
    // they are not scoped to the run being abandoned here, so a reset while
    // one is still claimed (e.g. mid auto-build or mid commit) would
    // otherwise leak into the next run: its Auto-build/batch controls would
    // read as busy until the abandoned run's own in-flight call resolves.
    state.committingItemId = null
    state.autoBuilding = false
    state.autoBuildingItemId = null
    state.batchingOutputKey = null
    draftingField.value = null
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
    isItemManualActionInFlight,
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
