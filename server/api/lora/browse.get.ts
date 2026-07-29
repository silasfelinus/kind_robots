// /server/api/lora/browse.get.ts
//
// Discover-tab browse proxy. Two sources, both server-side:
//   - civitai:    keyword search of Civitai's public model API.
//   - civarchive: by-id lookup of civitaiarchive.com (a mirror of models Civitai
//                 has removed). CivArchive has no keyword search, so `q` is
//                 treated as a model id or a URL to extract one from.
// Returns normalized LoRA cards, each flagged `owned` when a Resource already
// carries its model-version id, and `updatable` when a DIFFERENT version of the
// same model is owned. Maturity is clamped to the caller's opt-in.
import { createError, defineEventHandler, getQuery } from 'h3'
import { ofetch } from 'ofetch'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'

const CIVITAI_MODELS_URL = 'https://civitai.com/api/v1/models'
const CIVARCHIVE_MODEL_URL = 'https://civitaiarchive.com/api/models'

type BrowseCard = {
  civitaiModelId: number
  civitaiModelVersionId: number
  name: string
  baseModel: string
  previewImageUrl: string | null
  downloadUrl: string | null
  fileName: string | null
  creator: string | null
  isMature: boolean
  source: 'CIVITAI' | 'CIVARCHIVE'
  owned: boolean
  updatable: boolean
}

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

// --- Civitai keyword search -------------------------------------------------

type CivitaiImage = { url?: string }
type CivitaiFile = { name?: string; primary?: boolean; type?: string }
type CivitaiVersion = {
  id?: number
  name?: string
  baseModel?: string
  downloadUrl?: string
  images?: CivitaiImage[]
  files?: CivitaiFile[]
}
type CivitaiModel = {
  id?: number
  name?: string
  nsfw?: boolean
  creator?: { username?: string }
  modelVersions?: CivitaiVersion[]
}
type CivitaiResponse = {
  items?: CivitaiModel[]
  metadata?: { nextCursor?: string | null }
}

async function browseCivitai(options: {
  q: string
  limit: number
  cursor: string
  baseModel: string
  nsfw: boolean
}): Promise<{ cards: BrowseCard[]; nextCursor: string | null }> {
  const params = new URLSearchParams({
    types: 'LORA',
    limit: String(options.limit),
    sort: 'Highest Rated',
    nsfw: options.nsfw ? 'true' : 'false',
  })
  if (options.q) params.set('query', options.q)
  if (options.cursor) params.set('cursor', options.cursor)
  if (options.baseModel) params.set('baseModels', options.baseModel)

  const payload = (await ofetch(`${CIVITAI_MODELS_URL}?${params.toString()}`, {
    headers: { accept: 'application/json' },
    timeout: 15000,
  })) as CivitaiResponse

  const cards = (Array.isArray(payload.items) ? payload.items : [])
    .map((model): BrowseCard | null => {
      const version = model.modelVersions?.[0]
      if (!model.id || !version?.id) return null

      const primaryFile =
        version.files?.find((file) => file?.primary) ??
        version.files?.find((file) => file?.type === 'Model') ??
        version.files?.[0]

      return {
        civitaiModelId: model.id,
        civitaiModelVersionId: version.id,
        name: model.name ?? version.name ?? `Model ${model.id}`,
        baseModel: version.baseModel ?? '',
        previewImageUrl: version.images?.find((img) => img?.url)?.url ?? null,
        downloadUrl: version.downloadUrl ?? null,
        fileName: primaryFile?.name ?? null,
        creator: model.creator?.username ?? null,
        isMature: model.nsfw === true,
        source: 'CIVITAI',
        owned: false,
        updatable: false,
      }
    })
    .filter((card): card is BrowseCard => card !== null)

  return { cards, nextCursor: payload.metadata?.nextCursor ?? null }
}

// --- CivArchive by-id lookup ------------------------------------------------

type ArchiveFile = {
  name?: string
  primary?: boolean
  type?: string
  downloadUrl?: string
  mirrors?: Array<{ url?: string; source?: string }>
}
type ArchiveVersion = {
  id?: number
  name?: string
  baseModel?: string
  downloadUrl?: string
  images?: Array<{ url?: string }>
  files?: ArchiveFile[]
}
type ArchiveModel = {
  id?: number
  name?: string
  is_nsfw?: boolean
  creator_name?: string
  creator?: { username?: string }
  versions?: ArchiveVersion[]
}

function extractModelId(input: string): number | null {
  const match = input.match(/(\d{2,})/)
  const id = match ? Number(match[1]) : NaN
  return Number.isInteger(id) && id > 0 ? id : null
}

function archiveDownloadUrl(version: ArchiveVersion): string | null {
  const file =
    version.files?.find((entry) => entry?.primary) ??
    version.files?.find((entry) => entry?.type === 'Model') ??
    version.files?.[0]

  return firstString(
    file?.downloadUrl,
    file?.mirrors?.find((mirror) => mirror?.url)?.url,
    version.downloadUrl,
  )
}

async function browseCivArchive(options: {
  q: string
  allowMature: boolean
}): Promise<{ cards: BrowseCard[]; nextCursor: string | null }> {
  const modelId = extractModelId(options.q)
  if (!modelId) {
    throw createError({
      statusCode: 400,
      message: 'CivArchive lookup needs a model id or a model URL.',
    })
  }

  const model = (await ofetch(`${CIVARCHIVE_MODEL_URL}/${modelId}`, {
    headers: { accept: 'application/json' },
    timeout: 15000,
  })) as ArchiveModel

  const isMature = model.is_nsfw === true
  if (isMature && !options.allowMature) {
    return { cards: [], nextCursor: null }
  }

  const creator = firstString(model.creator?.username, model.creator_name)

  const cards = (Array.isArray(model.versions) ? model.versions : [])
    .map((version): BrowseCard | null => {
      if (!model.id || !version?.id) return null

      const file =
        version.files?.find((entry) => entry?.primary) ?? version.files?.[0]

      return {
        civitaiModelId: model.id,
        civitaiModelVersionId: version.id,
        name: `${model.name ?? `Model ${model.id}`}${
          version.name ? ` — ${version.name}` : ''
        }`,
        baseModel: version.baseModel ?? '',
        previewImageUrl: version.images?.find((img) => img?.url)?.url ?? null,
        downloadUrl: archiveDownloadUrl(version),
        fileName: firstString(file?.name),
        creator,
        isMature,
        source: 'CIVARCHIVE',
        owned: false,
        updatable: false,
      }
    })
    .filter((card): card is BrowseCard => card !== null)

  return { cards, nextCursor: null }
}

// --- Ownership / update flags -----------------------------------------------

async function flagOwnership(cards: BrowseCard[]): Promise<void> {
  if (!cards.length) return

  const versionIds = cards.map((card) => card.civitaiModelVersionId)
  const modelIds = [...new Set(cards.map((card) => card.civitaiModelId))]

  const owned = await prisma.resource.findMany({
    where: {
      OR: [
        { civitaiModelVersionId: { in: versionIds } },
        { civitaiModelId: { in: modelIds } },
      ],
    },
    select: { civitaiModelId: true, civitaiModelVersionId: true },
  })

  const ownedVersions = new Set(
    owned
      .map((row) => row.civitaiModelVersionId)
      .filter((value): value is number => typeof value === 'number'),
  )

  // model id -> the set of version ids owned for that model
  const ownedByModel = new Map<number, Set<number>>()
  for (const row of owned) {
    if (typeof row.civitaiModelId !== 'number') continue
    const set = ownedByModel.get(row.civitaiModelId) ?? new Set<number>()
    if (typeof row.civitaiModelVersionId === 'number') {
      set.add(row.civitaiModelVersionId)
    }
    ownedByModel.set(row.civitaiModelId, set)
  }

  for (const card of cards) {
    card.owned = ownedVersions.has(card.civitaiModelVersionId)
    if (card.owned) continue

    // Updatable: we own some OTHER version of this same model.
    const ownedForModel = ownedByModel.get(card.civitaiModelId)
    card.updatable = Boolean(
      ownedForModel &&
        [...ownedForModel].some(
          (versionId) => versionId !== card.civitaiModelVersionId,
        ),
    )
  }
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const query = getQuery(event)

    const q = String(query.q ?? '').trim()
    const source = String(query.source ?? 'civitai').toLowerCase()
    const allowMature = Boolean(auth.user.showMature)

    let result: { cards: BrowseCard[]; nextCursor: string | null }

    try {
      if (source === 'civarchive') {
        result = await browseCivArchive({ q, allowMature })
      } else {
        const requestedNsfw = String(query.nsfw ?? '') === 'true'
        result = await browseCivitai({
          q,
          limit: clampInt(query.limit, 24, 1, 50),
          cursor: String(query.cursor ?? '').trim(),
          baseModel: String(query.baseModel ?? '').trim(),
          nsfw: allowMature && requestedNsfw,
        })
      }
    } catch (fetchError) {
      // A 400 from our own validation should surface; upstream failures are 502.
      const handled = errorHandler(fetchError)
      if (handled.statusCode === 400) throw fetchError

      event.node.res.statusCode = 502
      return {
        success: false,
        message:
          source === 'civarchive'
            ? 'CivArchive is unreachable or has no such model.'
            : 'Civitai is unreachable right now — try again shortly.',
        data: { items: [], nextCursor: null },
        statusCode: 502,
      }
    }

    await flagOwnership(result.cards)

    return {
      success: true,
      message: `${result.cards.length} result${
        result.cards.length === 1 ? '' : 's'
      }.`,
      data: { items: result.cards, nextCursor: result.nextCursor },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to browse LoRAs.',
      data: { items: [], nextCursor: null },
      statusCode,
    }
  }
})
