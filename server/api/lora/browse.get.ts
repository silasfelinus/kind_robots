// /server/api/lora/browse.get.ts
//
// Discover-tab browse proxy. Queries Civitai's public model search server-side
// (keeps any future token off the client) and returns normalized LoRA cards,
// each flagged `owned` when a Resource already carries its model-version id.
// Maturity is clamped to the caller's opt-in: a user who hasn't enabled mature
// content can never surface nsfw results, whatever the query says.
import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'

const CIVITAI_MODELS_URL = 'https://civitai.com/api/v1/models'

type CivitaiImage = { url?: string; nsfwLevel?: number }
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

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const query = getQuery(event)

    const q = String(query.q ?? '').trim()
    const limit = clampInt(query.limit, 24, 1, 50)
    const cursor = String(query.cursor ?? '').trim()
    const baseModel = String(query.baseModel ?? '').trim()

    // Maturity: user opt-in is the ceiling. Only allow nsfw when the account
    // enabled it AND the request asked for it.
    const requestedNsfw = String(query.nsfw ?? '') === 'true'
    const allowMature = Boolean(auth.user.showMature)
    const nsfw = allowMature && requestedNsfw

    const params = new URLSearchParams({
      types: 'LORA',
      limit: String(limit),
      sort: 'Highest Rated',
      nsfw: nsfw ? 'true' : 'false',
    })
    if (q) params.set('query', q)
    if (cursor) params.set('cursor', cursor)
    if (baseModel) params.set('baseModels', baseModel)

    let payload: CivitaiResponse
    try {
      payload = await $fetch<CivitaiResponse>(
        `${CIVITAI_MODELS_URL}?${params.toString()}`,
        { headers: { accept: 'application/json' }, timeout: 15000 },
      )
    } catch {
      event.node.res.statusCode = 502
      return {
        success: false,
        message: 'Civitai is unreachable right now — try again shortly.',
        data: { items: [], nextCursor: null },
        statusCode: 502,
      }
    }

    const rawItems = Array.isArray(payload.items) ? payload.items : []

    const cards = rawItems
      .map((model) => {
        const version = model.modelVersions?.[0]
        if (!model.id || !version?.id) return null

        const image = version.images?.find((img) => img?.url)?.url ?? null
        const primaryFile =
          version.files?.find((file) => file?.primary) ??
          version.files?.find((file) => file?.type === 'Model') ??
          version.files?.[0]

        return {
          civitaiModelId: model.id,
          civitaiModelVersionId: version.id,
          name: model.name ?? version.name ?? `Model ${model.id}`,
          baseModel: version.baseModel ?? '',
          previewImageUrl: image,
          downloadUrl: version.downloadUrl ?? null,
          fileName: primaryFile?.name ?? null,
          creator: model.creator?.username ?? null,
          isMature: model.nsfw === true,
          owned: false,
        }
      })
      .filter(
        (card): card is NonNullable<typeof card> => card !== null,
      )

    // Flag owned rows: any card whose model-version id already lives in a
    // Resource. One indexed query for the whole page.
    const versionIds = cards.map((card) => card.civitaiModelVersionId)
    if (versionIds.length) {
      const owned = await prisma.resource.findMany({
        where: { civitaiModelVersionId: { in: versionIds } },
        select: { civitaiModelVersionId: true },
      })
      const ownedSet = new Set(
        owned
          .map((row) => row.civitaiModelVersionId)
          .filter((value): value is number => typeof value === 'number'),
      )
      for (const card of cards) {
        card.owned = ownedSet.has(card.civitaiModelVersionId)
      }
    }

    return {
      success: true,
      message: `${cards.length} result${cards.length === 1 ? '' : 's'}.`,
      data: { items: cards, nextCursor: payload.metadata?.nextCursor ?? null },
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
