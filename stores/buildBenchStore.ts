// /stores/buildBenchStore.ts
//
// Build Bench: a head-to-head A/B test bench for image-generation builds. Each
// side is a full build (engine + prompt + settings). "Run both" enqueues two
// ArtJobs (reusing /api/art/enqueue + every engine), polls them, and shows the
// renders side by side so you can eyeball and pick a winner. A clone button
// copies one side's whole config onto the other so you can vary a single knob
// (e.g. clone A->B, then double B's steps, or swap B's engine to Flux.2).
//
// Local-first: bench state + saved matchups persist to localStorage; the two
// rendered images are real ArtImages in the gallery. No new backend — this is a
// thin driver over the existing enqueue/queue/image endpoints.
import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { resolveArtImageSource } from '~/utils/artImageSource'
import { performFetch } from '@/stores/utils'

export type BenchSide = 'A' | 'B'
export type BenchEngineKey = 'krea2' | 'flux2' | 'sdxl' | 'flux'

export interface BenchEngineDef {
  key: BenchEngineKey
  label: string
  hint: string
  defaults: { steps: number; cfg: number; guidance: number; sampler: string; scheduler: string }
}

// The engines the bench can pit against each other. `key` is sent as the enqueue
// `engine` (sdxl is aliased to the comfy graph server-side). Defaults auto-fill
// each engine's native cadence when you switch.
export const BENCH_ENGINES: BenchEngineDef[] = [
  { key: 'krea2', label: 'Krea 2 Turbo', hint: '8-step, illustration/creative', defaults: { steps: 8, cfg: 1, guidance: 3.5, sampler: 'euler', scheduler: 'simple' } },
  { key: 'flux2', label: 'Flux.2 Klein', hint: '4-step, structured/JSON', defaults: { steps: 4, cfg: 1, guidance: 3.5, sampler: 'euler', scheduler: 'simple' } },
  { key: 'sdxl', label: 'SDXL', hint: 'big LoRA ecosystem, cfg matters', defaults: { steps: 25, cfg: 6, guidance: 3.5, sampler: 'euler', scheduler: 'normal' } },
  { key: 'flux', label: 'Flux dev', hint: '30-step, the old default', defaults: { steps: 30, cfg: 1, guidance: 3.5, sampler: 'euler', scheduler: 'beta' } },
]

export interface BuildConfig {
  engine: BenchEngineKey
  prompt: string
  negativePrompt: string
  steps: number
  cfg: number
  guidance: number
  seed: number | null // null = random (server assigns; recorded on the result)
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
const POLL_TIMEOUT_MS = 20 * 60_000 // krea first-load on a small box is slow
const BENCH_PRIORITY = 100 // jump the shared queue so bench renders come fast

function engineDef(key: BenchEngineKey): BenchEngineDef {
  return BENCH_ENGINES.find((e) => e.key === key) ?? BENCH_ENGINES[0]
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
    width: 1024,
    height: 1536,
    sampler: d.sampler,
    scheduler: d.scheduler,
    loraName: '',
    loraStrength: 1,
  }
}

function freshResult(): BuildResult {
  return { status: 'idle', jobId: null, artImageId: null, src: '', seed: null, error: null, elapsedMs: null }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function presetBuild(engine: BenchEngineKey, overrides: Partial<BuildConfig>): BuildConfig {
  return { ...freshConfig(engine), ...overrides, engine }
}

// A creative, in-house-style prompt that shows off the inked-comic coloring
// look — a good stress test for "which engine renders the weird concept best".
const SHOOTOUT_PROMPT =
  'A twisted-fairy-tale portrait: a former mermaid passing as human at a ' +
  'moonlit fish market, damp glamorous gown, pained smile hiding sharp teeth, ' +
  'gulls and tangled seaweed following her like a curse. Bold inked-comic ' +
  'coloring-book style: thick clean black contours, flat cel-shaded color, one ' +
  'strong silhouette, dense organized storybook detail. Portrait 2:3.'

export interface BenchPreset {
  key: string
  label: string
  hint: string
  a: BuildConfig
  b: BuildConfig
}

// Starter matchups so the bench opens on a useful comparison, not blank panels.
// A locked seed on both sides makes each a controlled test (change one knob and
// the composition stays comparable).
export const BENCH_PRESETS: BenchPreset[] = [
  {
    key: 'krea-vs-klein',
    label: 'Krea 2 vs Flux.2 Klein',
    hint: 'engine shootout — same prompt + seed',
    a: presetBuild('krea2', { prompt: SHOOTOUT_PROMPT, seed: 840020 }),
    b: presetBuild('flux2', { prompt: SHOOTOUT_PROMPT, seed: 840020 }),
  },
  {
    key: 'steps-8-vs-16',
    label: 'Krea 2: 8 vs 16 steps',
    hint: 'does doubling steps help? same engine + seed',
    a: presetBuild('krea2', { prompt: SHOOTOUT_PROMPT, seed: 840020, steps: 8 }),
    b: presetBuild('krea2', { prompt: SHOOTOUT_PROMPT, seed: 840020, steps: 16 }),
  },
  {
    key: 'krea-vs-sdxl',
    label: 'Krea 2 vs SDXL',
    hint: 'creativity vs the big LoRA ecosystem',
    a: presetBuild('krea2', { prompt: SHOOTOUT_PROMPT, seed: 840020 }),
    b: presetBuild('sdxl', { prompt: SHOOTOUT_PROMPT, seed: 840020, cfg: 6 }),
  },
  {
    key: 'two-seeds',
    label: 'Krea 2: same build, two seeds',
    hint: 'variety check — how much does the seed swing it?',
    a: presetBuild('krea2', { prompt: SHOOTOUT_PROMPT, seed: 111 }),
    b: presetBuild('krea2', { prompt: SHOOTOUT_PROMPT, seed: 222 }),
  },
]

export const useBuildBenchStore = defineStore('buildBenchStore', () => {
  const state = reactive<BuildBenchState>({
    // open on the first starter matchup instead of blank panels (localStorage
    // overrides this on hydrate if the user has edited before)
    buildA: clone(BENCH_PRESETS[0].a),
    buildB: clone(BENCH_PRESETS[0].b),
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
        JSON.stringify({ buildA: state.buildA, buildB: state.buildB, saved: state.saved }),
      )
    } catch {
      /* storage full / unavailable — non-fatal */
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
      /* ignore corrupt storage */
    }
  }

  function configOf(side: BenchSide): BuildConfig {
    return side === 'A' ? state.buildA : state.buildB
  }
  function resultOf(side: BenchSide): BuildResult {
    return side === 'A' ? state.resultA : state.resultB
  }

  // Switching engine auto-fills that engine's native step/cfg/sampler cadence
  // (only the fields the user hasn't obviously customized are worth resetting;
  // here we reset the cadence fields so a fresh engine behaves as designed).
  function setEngine(side: BenchSide, engine: BenchEngineKey): void {
    const cfg = configOf(side)
    const d = engineDef(engine).defaults
    cfg.engine = engine
    cfg.steps = d.steps
    cfg.cfg = d.cfg
    cfg.guidance = d.guidance
    cfg.sampler = d.sampler
    cfg.scheduler = d.scheduler
    persist()
  }

  // Clone one side's ENTIRE build onto the other — the controlled-comparison
  // move: copy, then change a single knob on the target.
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

  // Load a starter matchup (both sides) — a quick way to open a controlled test.
  function loadPreset(key: string): void {
    const preset = BENCH_PRESETS.find((p) => p.key === key)
    if (!preset) return
    state.buildA = clone(preset.a)
    state.buildB = clone(preset.b)
    resetResults()
    persist()
  }

  // --- enqueue + poll + load, mirroring stores/artStore.ts's queue path -------
  function enqueueBody(cfg: BuildConfig): Record<string, unknown> {
    return {
      engine: cfg.engine,
      promptString: cfg.prompt.trim(),
      negativePrompt: cfg.negativePrompt.trim() || null,
      steps: cfg.steps,
      cfg: cfg.cfg,
      guidance: cfg.guidance,
      seed: cfg.seed, // null -> server randomizes and bakes a concrete seed
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
  ): Promise<{ status: string; artImageId: number | null; error: string | null; seed: number | null }> {
    const started = Date.now()
    while (Date.now() - started < POLL_TIMEOUT_MS) {
      const res = await performFetch<{
        job: { status: string; artImageId: number | null; error: string | null }
      }>(`/api/art/queue/${jobId}`, { method: 'GET' }, 2, 20_000)
      const job = res.success ? res.data?.job : null
      if (job && ['DONE', 'FAILED', 'CANCELLED'].includes(job.status)) {
        return { status: job.status, artImageId: job.artImageId ?? null, error: job.error ?? null, seed: null }
      }
      await new Promise((r) => setTimeout(r, POLL_MS))
    }
    throw new Error('Timed out waiting for the render (the job stays queued; its image will still land).')
  }

  async function loadImage(artImageId: number): Promise<{ src: string; seed: number | null }> {
    const res = await performFetch<ArtImage & { seed?: number | null }>(
      `/api/art/image/${artImageId}?includeImageData=true`,
      { method: 'GET' },
      1,
      30_000,
    )
    if (!res.success || !res.data) throw new Error('Rendered image could not be loaded.')
    return { src: resolveArtImageSource(res.data).src, seed: res.data.seed ?? null }
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
    // clearing the winner whenever a render (re)starts keeps the pick honest
    state.winner = null

    const startedAt = Date.now()
    try {
      const enq = await performFetch<{ jobId: number }>(
        '/api/art/enqueue',
        { method: 'POST', body: JSON.stringify(enqueueBody(cfg)) },
        2,
        60_000,
      )
      if (!enq.success || !enq.data?.jobId) throw new Error(enq.message || 'Enqueue failed.')
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
    BENCH_PRESETS,
    hydrate,
    setEngine,
    cloneTo,
    resetResults,
    newMatchup,
    loadPreset,
    runSide,
    runBoth,
    pickWinner,
    saveMatchup,
    loadSaved,
    deleteSaved,
    persist,
  }
})
