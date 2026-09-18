// /server/api/resources/[id]/previews.put.ts
//
// Replace a Resource's upstream preview list.
//
// Admin-only and machine-shaped: the caller is the Civitai backfill
// (scripts/backfill_civitai_previews.py), not a person editing one row. It is
// idempotent by design -- the whole list for a source is replaced, so a second
// pass refreshes metadata and drops previews the upstream model no longer has,
// rather than accumulating.
//
// `Resource.previewImageUrl` is deliberately NOT touched. That column is the
// card's single face and has its own provenance; this is the gallery behind it.
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'

type PreviewInput = {
  url?: unknown
  sortOrder?: unknown
  nsfwLevel?: unknown
  isMature?: unknown
  width?: unknown
  height?: unknown
  blurHash?: unknown
  mediaType?: unknown
}

/** At most this many per Resource; Civitai pages are well under it. */
const MAX_PREVIEWS = 60

function positiveInt(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to replace resource previews.',
      })
    }

    const resourceId = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Resource ID.' })
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true },
    })

    if (!resource) {
      throw createError({ statusCode: 404, message: 'Resource not found.' })
    }

    const body = await readBody<{ previews?: PreviewInput[]; source?: string }>(
      event,
    )
    const source = String(body?.source || 'civitai').slice(0, 32)

    if (!Array.isArray(body?.previews)) {
      throw createError({
        statusCode: 400,
        message: '`previews` must be an array.',
      })
    }

    const seen = new Set<string>()
    const rows = body.previews
      .map((preview, index) => {
        const url = String(preview?.url || '').trim()
        if (!url || url.length > 764 || seen.has(url)) return null
        seen.add(url)

        const nsfwLevel = Number(preview?.nsfwLevel)

        return {
          resourceId,
          url,
          source,
          sortOrder: Number.isInteger(Number(preview?.sortOrder))
            ? Number(preview?.sortOrder)
            : index,
          nsfwLevel: Number.isInteger(nsfwLevel) ? nsfwLevel : null,
          isMature: preview?.isMature === true,
          width: positiveInt(preview?.width),
          height: positiveInt(preview?.height),
          blurHash: preview?.blurHash
            ? String(preview.blurHash).slice(0, 64)
            : null,
          mediaType: preview?.mediaType
            ? String(preview.mediaType).slice(0, 16)
            : null,
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .slice(0, MAX_PREVIEWS)

    /*
     * Replace rather than merge, inside one transaction: the upstream list is
     * the authority, so a preview it dropped should not survive here. Scoped to
     * the source, so a future non-Civitai list can coexist.
     */
    const [, created] = await prisma.$transaction([
      prisma.resourcePreview.deleteMany({ where: { resourceId, source } }),
      prisma.resourcePreview.createMany({ data: rows, skipDuplicates: true }),
    ])

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `${created.count} preview(s) stored for Resource ${resourceId}.`,
      data: { resourceId, source, count: created.count },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to store resource previews.',
      data: null,
      statusCode,
    }
  }
})
