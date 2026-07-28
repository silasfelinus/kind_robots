from pathlib import Path


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one match in {path}, found {count}: {old[:120]!r}")
    path.write_text(text.replace(old, new, 1))


art_store = Path("stores/artStore.ts")
enqueue = Path("server/api/art/enqueue.post.ts")

replace_once(
    art_store,
    """export type ArtImageGenerationEngine =
  'a1111' | 'comfy' | 'flux' | 'kontext' | 'openai'
""",
    """export type ArtImageGenerationEngine =
  | 'a1111'
  | 'comfy'
  | 'flux'
  | 'krea2'
  | 'kontext'
  | 'openai'
""",
)

replace_once(
    art_store,
    """export interface GenerateArtData {
""",
    """export type NarrativeArtEnqueueContext = {
  product: 'storymaker' | 'taskmaster'
  sessionId: string
  beatId: string
  moment: string
  dedupeKey: string
}

export interface GenerateArtData {
""",
)

replace_once(
    art_store,
    """  sampler?: string
  steps?: number
""",
    """  sampler?: string
  scheduler?: string
  steps?: number
""",
)

replace_once(
    art_store,
    """  serverId?: number | null
  serverName?: string | null

  engine?: ArtImageGenerationEngine
""",
    """  serverId?: number | null
  serverName?: string | null
  projectSlug?: string | null
  narrativeContext?: NarrativeArtEnqueueContext | null

  engine?: ArtImageGenerationEngine
""",
)

replace_once(
    art_store,
    """    if (data.engine === 'comfy') {
      return { provider: 'comfy' }
    }
""",
    """    if (data.engine === 'comfy' || data.engine === 'krea2') {
      return { provider: 'comfy' }
    }
""",
)

replace_once(
    art_store,
    """    if (engine === 'comfy') return server.serverType === 'COMFY'
""",
    """    if (engine === 'comfy' || engine === 'krea2') {
      return server.serverType === 'COMFY'
    }
""",
)

replace_once(
    art_store,
    """      `Server \"${server.title}\" is ${server.serverType}. This generator supports A1111, Comfy, Flux, Kontext, and OpenAI image routes.`,
""",
    """      `Server \"${server.title}\" is ${server.serverType}. This generator supports A1111, Comfy, Krea, Flux, Kontext, and OpenAI image routes.`,
""",
)

replace_once(
    art_store,
    """      comfy: '/api/comfy/sdxl/generate',
      flux: '/api/comfy/flux/generate',
""",
    """      comfy: '/api/comfy/sdxl/generate',
      flux: '/api/comfy/flux/generate',
      krea2: '/api/art/enqueue',
""",
)

replace_once(
    art_store,
    """      sampler:
        artData?.sampler ||
        state.artForm.sampler ||
        checkpointStore.selectedSampler?.name ||
        '',
      steps: artData?.steps ?? state.artForm.steps ?? 25,
""",
    """      sampler:
        artData?.sampler ||
        state.artForm.sampler ||
        checkpointStore.selectedSampler?.name ||
        '',
      scheduler: artData?.scheduler ?? state.artForm.scheduler,
      steps: artData?.steps ?? state.artForm.steps ?? 25,
""",
)

replace_once(
    art_store,
    """      serverName: explicitServerNameProvided
        ? (artData?.serverName ?? null)
        : null,

      generationRequirement:
""",
    """      serverName: explicitServerNameProvided
        ? (artData?.serverName ?? null)
        : null,
      projectSlug: artData?.projectSlug ?? state.artForm.projectSlug ?? null,
      narrativeContext:
        artData?.narrativeContext ?? state.artForm.narrativeContext ?? null,

      generationRequirement:
""",
)

replace_once(
    enqueue,
    """type JsonRecord = Record<string, unknown>

type ArtEnqueueRequest = {
""",
    """type JsonRecord = Record<string, unknown>

type NarrativeEnqueueContext = {
  product: 'storymaker' | 'taskmaster'
  sessionId: string
  beatId: string
  moment: string
  dedupeKey: string
}

type ArtEnqueueRequest = {
""",
)

replace_once(
    enqueue,
    """  projectSlug?: string | null
  priority?: number | null
""",
    """  projectSlug?: string | null
  priority?: number | null
  narrativeContext?: NarrativeEnqueueContext | null
""",
)

replace_once(
    enqueue,
    """function facetRequest(body: ArtEnqueueRequest | null): {
""",
    """function narrativeRequest(
  body: ArtEnqueueRequest | null,
): NarrativeEnqueueContext | null {
  const raw = asRecord(body?.narrativeContext)
  if (!Object.keys(raw).length) return null

  const product = String(raw.product || '')
  const sessionId = String(raw.sessionId || '').trim()
  const beatId = String(raw.beatId || '').trim()
  const moment = String(raw.moment || '').trim()
  const dedupeKey = String(raw.dedupeKey || '').trim()
  const allowedMoments = new Set([
    'opening',
    'chapter',
    'location',
    'character-introduction',
    'pivotal-event',
    'finale',
  ])

  if (product !== 'storymaker' && product !== 'taskmaster') {
    throw createError({ statusCode: 400, message: 'Invalid narrative product.' })
  }
  if (!sessionId || sessionId.length > 160 || !beatId || beatId.length > 160) {
    throw createError({
      statusCode: 400,
      message: 'Invalid narrative session or beat identity.',
    })
  }
  if (!allowedMoments.has(moment)) {
    throw createError({ statusCode: 400, message: 'Invalid narrative art moment.' })
  }

  const expectedKey = [product, sessionId, beatId, moment].join(':')
  if (dedupeKey !== expectedKey || dedupeKey.length > 400) {
    throw createError({
      statusCode: 400,
      message: 'Invalid narrative art dedupe key.',
    })
  }

  return {
    product,
    sessionId,
    beatId,
    moment,
    dedupeKey,
  }
}

function facetRequest(body: ArtEnqueueRequest | null): {
""",
)

replace_once(
    enqueue,
    """    const videoFrames = VIDEO_ENGINES.has(engine)
      ? resolveVideoFrames(engine, body)
      : null
""",
    """    const projectSlug = body?.projectSlug?.trim().toLowerCase() || null
    if (projectSlug && !SLUG_PATTERN.test(projectSlug)) {
      throw createError({ statusCode: 400, message: 'Invalid projectSlug.' })
    }
    const narrativeContext = narrativeRequest(body)

    const videoFrames = VIDEO_ENGINES.has(engine)
      ? resolveVideoFrames(engine, body)
      : null
""",
)

replace_once(
    enqueue,
    """    const isAdmin = Boolean((gate.user as { isAdmin?: boolean }).isAdmin)
    const resolvedLora = await resolveEnqueueLoraResource({
""",
    """    const isAdmin = Boolean((gate.user as { isAdmin?: boolean }).isAdmin)

    if (narrativeContext) {
      const existingJob = await prisma.artJob.findFirst({
        where: {
          userId: gate.user.id,
          projectSlug,
          status: { notIn: ['FAILED', 'CANCELLED'] },
          payload: {
            contains: `\"dedupeKey\":\"${narrativeContext.dedupeKey}\"`,
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (existingJob) {
        event.node.res.statusCode = 200
        return {
          success: true,
          message: 'Existing narrative art job reused.',
          statusCode: 200,
          data: {
            jobId: existingJob.id,
            status: existingJob.status,
            deduplicated: true,
            mana: { charged: 0 },
          },
        }
      }
    }

    const resolvedLora = await resolveEnqueueLoraResource({
""",
)

replace_once(
    enqueue,
    """    const projectSlug =
      resolvedBody.projectSlug?.trim().toLowerCase() || null
    if (projectSlug && !SLUG_PATTERN.test(projectSlug)) {
      throw createError({ statusCode: 400, message: 'Invalid projectSlug.' })
    }
    const priority = Number.isInteger(resolvedBody.priority)
""",
    """    const priority = Number.isInteger(resolvedBody.priority)
""",
)

replace_once(
    enqueue,
    """    applyArtFacetsToPayload(payload, basePromptString, facets)

    const provenanceResources = {
""",
    """    applyArtFacetsToPayload(payload, basePromptString, facets)
    if (narrativeContext) payload.narrativeContext = narrativeContext

    const provenanceResources = {
""",
)

replace_once(
    enqueue,
    """        status: job.status,
        mana: { balance, charged: gate.cost },
""",
    """        status: job.status,
        deduplicated: false,
        mana: { balance, charged: gate.cost },
""",
)

print("Applied narrative art queue contract")
