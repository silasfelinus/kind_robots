// /stores/modelBuilderStore.ts
//
// Model Builder — a resumable, human-gated recipe runner for Kind Robots
// records. A user selects a source model, a recipe, and individual outputs;
// each output becomes a BuildItem that advances through PITCH,
// FIELDS_AND_PROMPTS, GENERATE_ASSETS, and COMMIT. Users may edit, approve,
// reject, rerun, or resume at any stage; editing upstream work marks
// downstream work stale without deleting it.
//
// This front-end slice keeps run state on the client (localStorage) for resume
// and reuses the existing art generator for GENERATE_ASSETS. Durable
// server-side BuildRun/BuildItem persistence and the idempotent final COMMIT
// write are a later, human-gated milestone (see conductor model-builder
// roadmap t-004 / t-013 / t-014); COMMIT here produces a preview diff only and
// never silently rewrites a canonical model.

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
  id: string // stable within a run: `${outputKey}#${quantityIndex}`
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
  generatingItemId: string | null
  statusMessage: string
  statusTone: 'success' | 'error'
}

const isClient = typeof window !== 'undefined'
const runStorageKey = 'modelBuilder:run'
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

function makeRunId(sourceType: SourceTypeKey, sourceId: number): string {
  // No Math.random / Date.now dependency for the id core so a resumed run keeps
  // a stable identity; createdAt carries the timestamp separately.
  return `${sourceType.toLowerCase()}-${sourceId}-${BUILD_STAGES.length}`
}

// Initial stage map: PITCH is workable, the rest are locked behind it.
function freshStages(): Record<BuildStageKey, StageState> {
  const stages = {} as Record<BuildStageKey, StageState>
  BUILD_STAGES.forEach((stage, index) => {
    stages[stage.key] = { status: index === 0 ? 'ready' : 'locked' }
  })
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
    return typeof value === 'string' && value.trim()
      ? value
      : `#${record.id}`
  }

  const selectedRecipe = computed(() =>
    state.recipeKey ? getRecipe(state.recipeKey) : undefined,
  )

  const recipeOutputs = computed<BuildOutputConfig[]>(() =>
    state.recipeKey ? getOutputsForRecipe(state.recipeKey) : [],
  )

  const selectedOutputCount = computed(
    () =>
      Object.values(state.selections).filter((selection) => selection.on)
        .length,
  )

  const canStartRun = computed(
    () => Boolean(state.selectedSource && state.recipeKey && selectedOutputCount.value > 0),
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

  // --- step 3: build run + gated stage advancement -------------------------

  function startRun(): void {
    if (!state.selectedSource || !state.sourceType || !state.recipeKey) return

    const items: BuildItem[] = []
    for (const output of recipeOutputs.value) {
      const selection = state.selections[output.key]
      if (!selection?.on) continue

      const count = output.quantity ? selection.quantity : 1
      for (let index = 0; index < count; index++) {
        items.push({
          id: `${output.key}#${index}`,
          outputKey: output.key,
          label: count > 1 ? `${output.label} ${index + 1}` : output.label,
          action: output.action,
          generation: output.generation,
          quantityIndex: index,
          stages: freshStages(),
          pitch: '',
          fieldsDraft: '',
          promptDraft: '',
          artImageId: null,
          imagePath: null,
          error: null,
        })
      }
    }

    state.run = {
      id: makeRunId(state.sourceType, state.selectedSource.id),
      createdAt: nowIso(),
      sourceType: state.sourceType,
      sourceId: state.selectedSource.id,
      sourceLabel: sourceLabel(state.selectedSource),
      recipeKey: state.recipeKey,
      items,
    }
    state.step = 'run'
    persistRun()
    setStatus('success', `Started a ${getRecipe(state.recipeKey)?.label} run with ${items.length} item${items.length === 1 ? '' : 's'}.`)
  }

  function findItem(itemId: string): BuildItem | undefined {
    return state.run?.items.find((item) => item.id === itemId)
  }

  // Stale-invalidation: editing an upstream stage marks every downstream stage
  // stale (unless still locked). Commit is always downstream of everything.
  function markDownstreamStale(item: BuildItem, fromStage: BuildStageKey): void {
    const from = stageIndex(fromStage)
    BUILD_STAGES.forEach((stage, index) => {
      if (index <= from) return
      const current = item.stages[stage.key].status
      if (current === 'approved' || current === 'ready' || current === 'in-progress') {
        item.stages[stage.key] = { status: 'stale' }
      }
    })
  }

  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'approved' }
    // Unlock the next stage.
    const next = BUILD_STAGES[stageIndex(stageKey) + 1]
    if (next && item.stages[next.key].status === 'locked') {
      item.stages[next.key] = { status: 'ready' }
    }
    persistRun()
  }

  function rejectStage(itemId: string, stageKey: BuildStageKey, note?: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'rejected', note }
    markDownstreamStale(item, stageKey)
    persistRun()
  }

  // Reopen a stale/approved stage for editing and invalidate downstream.
  function reopenStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'ready' }
    markDownstreamStale(item, stageKey)
    persistRun()
  }

  function updatePitch(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.pitch = value
    markDownstreamStale(item, 'PITCH')
    persistRun()
  }

  function updateFields(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.fieldsDraft = value
    markDownstreamStale(item, 'FIELDS_AND_PROMPTS')
    persistRun()
  }

  function updatePrompt(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.promptDraft = value
    markDownstreamStale(item, 'FIELDS_AND_PROMPTS')
    persistRun()
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
      // Route through the manual-edit setters so downstream stages stale exactly
      // as they would on a hand edit.
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

  async function generateItemAsset(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false

    if (item.generation !== 'image') {
      // Non-image generation kinds (text, plan, video, 3d) are described in the
      // brief but not wired into this front-end slice yet.
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
    const { width, height } = sizeToDimensions(output?.size)
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
        width,
        height,
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
      setStatus('success', `Generated a candidate for ${item.label}.`)
      persistRun()
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

  // Records the user's approval of the final diff. The actual durable create /
  // update / link / promote happens through model APIs in a later gated
  // milestone — this scaffold only marks the item as approved-for-commit.
  function approveCommit(itemId: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages.COMMIT = {
      status: 'approved',
      note: 'Approved for commit — durable write pending backend execution.',
    }
    persistRun()
    setStatus('success', `${item.label} approved for commit.`)
  }

  // --- persistence / resume -------------------------------------------------

  function persistRun(): void {
    if (!state.run) {
      safeRemove(runStorageKey)
      return
    }
    safeSet(runStorageKey, JSON.stringify(state.run))
  }

  function resumeRun(): void {
    const raw = safeGet(runStorageKey)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as BuildRun
      if (parsed && Array.isArray(parsed.items)) {
        state.run = parsed
        state.sourceType = parsed.sourceType
        state.recipeKey = parsed.recipeKey
        state.step = 'run'
      }
    } catch {
      safeRemove(runStorageKey)
    }
  }

  function goToStep(step: BuilderStep): void {
    state.step = step
  }

  function resetRun(): void {
    state.run = null
    state.step = state.selectedSource ? 'recipe' : 'source'
    safeRemove(runStorageKey)
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
    safeRemove(runStorageKey)
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

function nowIso(): string {
  return new Date().toISOString()
}
