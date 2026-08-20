// /stores/buildBenchStore.ts
//
// Build Bench: a head-to-head A/B test bench for image-generation builds. Each
// side is a full build (engine + prompt + settings). "Run both" enqueues two
// ArtJobs (reusing /api/art/enqueue + every engine), polls them, and shows the
// renders side by side so you can eyeball and pick a winner. A clone button
// copies one side's whole config onto the other so you can vary a single knob.
//
// The bench is intentionally experimental, but each engine starts from the
// same product-owned quality profile used by the primary image generator.
import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { resolveArtImageSource } from '~/utils/artImageSource'
import { performFetch } from '@/stores/utils'
import { getPreset, presetSettings } from '@/utils/artGeneratorPresets'

export type BenchSide = 'A' | 'B'
export type BenchEngineKey = 'krea2' | 'flux2' | 'sdxl' | 'flux'

export interface BenchEngineDef {
  key: BenchEngineKey
  label: string
  hint: string
  presetId: string
  defaults: {
    steps: number
    cfg: number
    guidance: number
    sampler: string
    scheduler: string
    width: number
    height: number
  }
}

function defaultsFromPreset(presetId: string): BenchEngineDef['defaults'] {
  const settings = presetSettings(getPreset(presetId))
  return {
    steps: settings.steps,
    cfg: settings.cfg,
    guidance: settings.guidance ?? 0,
    sampler: settings.sampler ?? 'euler',
    scheduler: settings.scheduler ?? 'normal',
    width: settings.width,
    height: settings.height,
  }
}

export const BENCH_ENGINES: BenchEngineDef[] = [
  {
    key: 'krea2',
    label: 'Krea 2 Turbo',
    hint: 'House default, fast illustration/creative lane',
    presetId: 'krea2-turbo',
    defaults: defaultsFromPreset('krea2-turbo'),
  },
  {
    key: 'flux2',
    label: 'Flux.2 Klein',
    hint: 'Fast structured/JSON lane',
    presetId: 'flux2-klein',
    defaults: defaultsFromPreset('flux2-klein'),
  },
  {
    key: 'sdxl',
    label: 'SDXL Turbo',
    hint: 'Checkpoint lane, aligned with the current Turbo fallback',
    presetId: 'sdxl-distilled',
    defaults: defaultsFromPreset('sdxl-distilled'),
  },
  {
    key: 'flux',
    label: 'Flux dev',
    hint: 'Slow quality lane',
    presetId: 'flux-dev',
    defaults: defaultsFromPreset('flux-dev'),
  },
]

export interface BuildConfig {
  engine: BenchEngineKey
  prompt: string
  negativePrompt: string
  steps: number
  cfg: number
  guidance: number
  seed: number | null
  width: number
  height: number
  sampler: string
  scheduler: string
  loraName: string
  loraStrength: number
}

export type BenchStatus = 'idle' | 'queued' | 'rendering' | 'done' | 'failed'

export interface BuildResult {
  status: BenchStatus
  jobId: number | null
  artImageId: number | null
  src: string
  seed: number | null
  error: string | null
  elapsedMs: number | null
}

export interface SavedMatchup {
  id: string
  at: string
  a: BuildConfig
  b: BuildConfig
  resultA: BuildResult
  resultB: BuildResult
  winner: BenchSide | null
  note: string
}

interface BuildBenchState {
  buildA: BuildConfig
  buildB: BuildConfig
  resultA: BuildResult
  resultB: BuildResult
  winner: BenchSide | null
  note: string
  saved: SavedMatchup[]
  error: string | null
}

const STORAGE_KEY = 'kr_build_bench_v1'
const POLL_MS = 5_000
const BENCH_PRIORITY = 100

function engineDef(key: BenchEngineKey): BenchEngineDef {
  return BENCH_ENGINES.find((e) => e.key === key) ?? BENCH_ENGINES[0]!
}

function freshConfig(engine: BenchEngineKey): BuildConfig {
  const d = engineDef(engine).defaults
  return {
    engine,
    prompt: '',
    negativePrompt: '',
    steps: d.steps,
    cfg: d.cfg,
    guidance: d.guidance,
    seed: null,
    width: d.width,
    height: d.height,
    sampler: d.sampler,
    scheduler: d.scheduler,
    loraName: '',
    loraStrength: 1,
  }
}

function freshResult(): BuildResult {
  return {
    status: 'idle',
    jobId: null,
    artImageId: null,
    src: '',
    seed: null,
    error: null,
    elapsedMs: null,
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

export const useBuildBenchStore = defineStore('buildBenchStore', () => {
  const state = reactive<BuildBenchState>({
    buildA: freshConfig('krea2'),
    buildB: freshConfig('flux2'),
    resultA: freshResult(),
    resultB: freshResult(),
    winner: null,
    note: '',
    saved: [],
    error: null,
  })

  function persist(): void {
    if (!import.meta.client) return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          buildA: state.buildA,
          buildB: state.buildB,
          saved: state.saved,
        }),
      )
    } catch {
      /* Local bench persistence is optional. */
    }
  }

  function hydrate(): void {
    if (!import.meta.client) return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed.buildA) Object.assign(state.buildA, parsed.buildA)
      if (parsed.buildB) Object.assign(state.buildB, parsed.buildB)
      if (Array.isArray(parsed.saved)) state.saved = parsed.saved
    } catch {
      /* Ignore corrupt local bench state and start fresh. */
    }
  }

  function configOf(side: BenchSide): BuildConfig {
    return side === 'A' ? state.buildA : state.buildB
  }

  function resultOf(side: BenchSide): BuildResult {
    return side === 'A' ? state.resultA : state.resultB
  }

  function setEngine(side: BenchSide, engine: BenchEngineKey): void {
    const cfg = configOf(side)
    const d = engineDef(engine).defaults
    cfg.engine = engine
    cfg.steps = d.steps
    cfg.cfg = d.cfg
    cfg.guidance = d.guidance
    cfg.sampler = d.sampler
    cfg.scheduler = d.scheduler
    cfg.width = d.width
    cfg.height = d.height
    persist()
  }

  function cloneTo(from: BenchSide): void {
    const to: BenchSide = from === 'A' ? 'B' : 'A'
    const source = clone(configOf(from))
    if (to === 'A') state.buildA = source
    else state.buildB = source
    persist()
  }

  function resetResults(): void {
    state.resultA = freshResult()
    state.resultB = freshResult()
    state.winner = null
    state.note = ''
  }

  function newMatchup(): void {
    state.buildA = freshConfig('krea2')
    state.buildB = freshConfig('flux2')
    resetResults()
    persist()
  }

  function enqueueBody(cfg: BuildConfig): Record<string, unknown> {
    const def = engineDef(cfg.engine)
    return {
      engine: cfg.engine,
      presetId: def.presetId,
      promptString: cfg.prompt.trim(),
      negativePrompt: cfg.negativePrompt.trim() || null,
      steps: cfg.steps,
      cfg: cfg.cfg,
      guidance: cfg.guidance,
      seed: cfg.seed,
      width: cfg.width,
      height: cfg.height,
      sampler: cfg.sampler || null,
      scheduler: cfg.scheduler || null,
      loraName: cfg.loraName.trim() || null,
      loraStrength: cfg.loraName.trim() ? cfg.loraStrength : null,
      priority: BENCH_PRIORITY,
      projectSlug: 'build-bench',
      designer: 'Build Bench',
      isPublic: true,
    }
  }

  async function pollJob(
    jobId: number,
  ): Promise<{
    status: string
    artImageId: number | null
    error: string | null
    seed: number | null
  }> {
    while (true) {
      const res = await performFetch<{
        job: { status: string; artImageId: number | null; error: string | null }
      }>(`/api/art/queue/${jobId}`, { method: 'GET' }, 2, 20_000)
      const job = res.success ? res.data?.job : null
      if (job && ['DONE', 'FAILED', 'CANCELLED'].includes(job.status)) {
        return {
          status: job.status,
          artImageId: job.artImageId ?? null,
          error: job.error ?? null,
          seed: null,
        }
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_MS))
    }
  }

  async function loadImage(
    artImageId: number,
  ): Promise<{ src: string; seed: number | null }> {
    const res = await performFetch<ArtImage & { seed?: number | null }>(
      `/api/art/image/${artImageId}?includeImageData=true`,
      { method: 'GET' },
      1,
      30_000,
    )
    if (!res.success || !res.data) {
      throw new Error('Rendered image could not be loaded.')
    }
    return {
      src: resolveArtImageSource(res.data).src,
      seed: res.data.seed ?? null,
    }
  }

  async function runSide(side: BenchSide): Promise<void> {
    const cfg = configOf(side)
    if (!cfg.prompt.trim()) {
      state.error = `Build ${side}: add a prompt first.`
      return
    }
    state.error = null
    const result = freshResult()
    result.status = 'queued'
    if (side === 'A') state.resultA = result
    else state.resultB = result
    state.winner = null

    const startedAt = Date.now()
    try {
      const enq = await performFetch<{ jobId: number }>(
        '/api/art/enqueue',
        { method: 'POST', body: JSON.stringify(enqueueBody(cfg)) },
        2,
        60_000,
      )
      if (!enq.success || !enq.data?.jobId) {
        throw new Error(enq.message || 'Enqueue failed.')
      }
      result.jobId = enq.data.jobId
      result.status = 'rendering'

      const job = await pollJob(result.jobId)
      if (job.status !== 'DONE' || !job.artImageId) {
        throw new Error(job.error || `Render ${job.status.toLowerCase()}.`)
      }
      result.artImageId = job.artImageId
      const img = await loadImage(job.artImageId)
      result.src = img.src
      result.seed = img.seed
      result.status = 'done'
    } catch (error) {
      result.status = 'failed'
      result.error = error instanceof Error ? error.message : String(error)
    } finally {
      result.elapsedMs = Date.now() - startedAt
    }
  }

  async function runBoth(): Promise<void> {
    await Promise.all([runSide('A'), runSide('B')])
  }

  function pickWinner(side: BenchSide): void {
    state.winner = state.winner === side ? null : side
  }

  function saveMatchup(): void {
    if (state.resultA.status !== 'done' && state.resultB.status !== 'done') {
      state.error = 'Render at least one side before saving.'
      return
    }
    const entry: SavedMatchup = {
      id: `${state.resultA.artImageId ?? 'x'}-${state.resultB.artImageId ?? 'x'}-${state.saved.length + 1}`,
      at: new Date().toISOString(),
      a: clone(state.buildA),
      b: clone(state.buildB),
      resultA: clone(state.resultA),
      resultB: clone(state.resultB),
      winner: state.winner,
      note: state.note,
    }
    state.saved.unshift(entry)
    state.saved = state.saved.slice(0, 50)
    persist()
  }

  function loadSaved(entry: SavedMatchup): void {
    state.buildA = clone(entry.a)
    state.buildB = clone(entry.b)
    state.resultA = clone(entry.resultA)
    state.resultB = clone(entry.resultB)
    state.winner = entry.winner
    state.note = entry.note
  }

  function deleteSaved(id: string): void {
    state.saved = state.saved.filter((m) => m.id !== id)
    persist()
  }

  return {
    state,
    BENCH_ENGINES,
    hydrate,
    setEngine,
    cloneTo,
    resetResults,
    newMatchup,
    runSide,
    runBoth,
    pickWinner,
    saveMatchup,
    loadSaved,
    deleteSaved,
    persist,
  }
})
