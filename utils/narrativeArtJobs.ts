// /utils/narrativeArtJobs.ts
import type {
  GenerateArtData,
  QueuedArtJob,
} from '@/stores/artStore'
import {
  getNarrativeArtDimensions,
  getNarrativeArtProfile,
  type NarrativeArtMoment,
  type NarrativeArtSurface,
  type NarrativeProduct,
} from '@/utils/narrativeArtProfiles'

export type NarrativeArtJobStatus =
  | 'queueing'
  | 'queued'
  | 'rendering'
  | 'done'
  | 'failed'
  | 'cancelled'

export type NarrativeArtJobState = {
  dedupeKey: string
  product: NarrativeProduct
  moment: NarrativeArtMoment
  surface: NarrativeArtSurface
  profileKey: string
  promptString: string
  status: NarrativeArtJobStatus
  jobId?: number
  artImageId?: number
  imagePath?: string | null
  error?: string | null
  requestedAt: string
  updatedAt: string
}

export type NarrativeArtPromptContext = {
  product: NarrativeProduct
  sessionId: string
  beatId: string
  moment: NarrativeArtMoment
  surface?: NarrativeArtSurface
  narrative: string
  title?: string | null
  objective?: string | null
  location?: string | null
  cast?: string[]
  facets?: string[]
}

function nowIso(): string {
  return new Date().toISOString()
}

function compact(value: string | null | undefined, max = 1_800): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

export function buildNarrativeArtDedupeKey(input: {
  product: NarrativeProduct
  sessionId: string
  beatId: string
  moment: NarrativeArtMoment
}): string {
  return [input.product, input.sessionId, input.beatId, input.moment].join(':')
}

export function buildNarrativeArtPrompt(
  context: NarrativeArtPromptContext,
): string {
  const profile = getNarrativeArtProfile(context.product)
  const scene = compact(context.narrative)
  const title = compact(context.title, 180)
  const objective = compact(context.objective, 280)
  const location = compact(context.location, 280)
  const cast = (context.cast ?? []).map((item) => compact(item, 160)).filter(Boolean)
  const facets = (context.facets ?? [])
    .map((item) => compact(item, 120))
    .filter(Boolean)

  return [
    profile.styleDirective,
    `Illustrate a ${context.moment.replace(/-/g, ' ')} from an unfolding ${context.product} narrative.`,
    title ? `Story title: ${title}.` : '',
    objective ? `The practical objective must remain visually legible: ${objective}.` : '',
    location ? `Location: ${location}.` : '',
    cast.length ? `Featured cast: ${cast.join(', ')}.` : '',
    facets.length ? `Creative direction: ${facets.join(', ')}.` : '',
    `Scene: ${scene}`,
    'Show one coherent illustrated moment without captions, interface elements, or written text.',
  ]
    .filter(Boolean)
    .join(' ')
}

export function createNarrativeArtJobState(
  context: NarrativeArtPromptContext,
): NarrativeArtJobState {
  const surface = context.surface ?? 'scene-landscape'
  const profile = getNarrativeArtProfile(context.product)
  const timestamp = nowIso()

  return {
    dedupeKey: buildNarrativeArtDedupeKey(context),
    product: context.product,
    moment: context.moment,
    surface,
    profileKey: profile.key,
    promptString: buildNarrativeArtPrompt({ ...context, surface }),
    status: 'queueing',
    requestedAt: timestamp,
    updatedAt: timestamp,
  }
}

export function buildNarrativeArtGenerationData(
  state: NarrativeArtJobState,
): GenerateArtData {
  const profile = getNarrativeArtProfile(state.product)
  const dimensions = getNarrativeArtDimensions(state.surface)

  return {
    promptString: state.promptString,
    negativePrompt: profile.negativePrompt,
    engine: profile.engine,
    generationRequirement: { provider: 'comfy' },
    transport: 'backend',
    steps: profile.steps,
    cfg: profile.cfg,
    sampler: profile.sampler,
    scheduler: profile.scheduler,
    denoise: profile.denoise,
    width: dimensions.width,
    height: dimensions.height,
    designer: profile.designer,
    projectSlug: profile.projectSlug,
    isPublic: false,
    isMature: false,
    seed: null,
    narrativeContext: {
      product: state.product,
      moment: state.moment,
      dedupeKey: state.dedupeKey,
    },
  }
}

export function applyQueuedArtJobToNarrativeState(
  state: NarrativeArtJobState,
  job: QueuedArtJob,
): NarrativeArtJobState {
  const status: NarrativeArtJobStatus =
    job.status === 'PENDING'
      ? 'queued'
      : job.status === 'RUNNING'
        ? 'rendering'
        : job.status === 'DONE'
          ? 'done'
          : job.status === 'CANCELLED'
            ? 'cancelled'
            : 'failed'

  return {
    ...state,
    status,
    jobId: job.id,
    artImageId: job.artImageId ?? state.artImageId,
    error: job.error ?? null,
    updatedAt: nowIso(),
  }
}

export function isNarrativeArtTerminal(
  state: NarrativeArtJobState | null | undefined,
): boolean {
  return Boolean(
    state &&
      (state.status === 'done' ||
        state.status === 'failed' ||
        state.status === 'cancelled'),
  )
}
