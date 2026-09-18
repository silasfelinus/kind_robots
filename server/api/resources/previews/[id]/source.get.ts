// /server/api/resources/previews/[id]/source.get.ts
//
// An upstream preview, as bytes this site can generate from.
//
// Silas, 2026-09-18: "we should be able to select them and modify them, even if
// they come from a civitai sample."
//
// A generated ArtImage already has a bytes route (/api/art/images/:id/file), so
// the client can turn one into a data URI by itself. A ResourcePreview cannot:
// it is a URL on image.civitai.com that this site has never owned, and a
// browser cannot read cross-origin pixels back out of an <img> to hand them to
// the generator. So the fetch happens here, where the response is ours.
//
// WHY THE CALLER NEVER SUPPLIES A URL. Taking one would make this an open
// proxy -- point it at an internal address and the server fetches it. The
// caller names a ResourcePreview ROW; the URL comes from our own table, and is
// still checked against the scheme and host allowlist below, because a row is
// only as trustworthy as whatever wrote it.
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import {
  canView,
  maturityAllowsRow,
  viewerShowsMature,
} from '~/server/utils/contentAccess'
import { isFetchablePreviewUrl } from '~/utils/previewSource'

/** Refuse anything larger; these are model sample images, not video masters. */
const MAX_BYTES = 12 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const previewId = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(previewId) || previewId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid preview ID. It must be a positive integer.',
      })
    }

    const [preview, auth] = await Promise.all([
      prisma.resourcePreview.findUnique({
        where: { id: previewId },
        select: {
          id: true,
          url: true,
          isMature: true,
          mediaType: true,
          Resource: {
            select: {
              id: true,
              userId: true,
              isPublic: true,
              isMature: true,
              isActive: true,
            },
          },
        },
      }),
      getOptionalApiUser(event),
    ])

    const resource = preview?.Resource

    if (!preview || !resource?.isActive) {
      throw createError({ statusCode: 404, message: 'Preview not found.' })
    }

    /*
     * THE SAME GATE THE GALLERY USES. Handing out bytes is strictly more than
     * showing a thumbnail, so it cannot be a weaker check: the Resource must be
     * one this viewer may see at all, and the preview's OWN maturity rating has
     * to pass too -- a non-mature LoRA can ship an R-rated sample.
     *
     * No owner carve-out on the preview's maturity, unlike a Resource row:
     * these are upstream urls, nobody's own work, so the "hidden for
     * situational propriety, not gone for good" argument does not apply.
     */
    const isAdmin = auth?.isAdmin ?? false
    const allowed = await canView(
      { id: resource.id, userId: resource.userId, isPublic: resource.isPublic },
      'RESOURCE',
      auth ? { id: auth.user.id, isAdmin } : null,
    )

    if (
      !allowed ||
      !maturityAllowsRow(resource, auth?.user) ||
      (preview.isMature && !viewerShowsMature(auth?.user))
    ) {
      throw createError({ statusCode: 404, message: 'Preview not found.' })
    }

    if (preview.mediaType && preview.mediaType !== 'image') {
      throw createError({
        statusCode: 415,
        message: 'Only image previews can be used as a generation source.',
      })
    }

    if (!isFetchablePreviewUrl(preview.url)) {
      throw createError({
        statusCode: 422,
        message: 'This preview is not hosted where previews are fetched from.',
      })
    }

    const upstream = await fetch(preview.url, {
      headers: { accept: 'image/*' },
      redirect: 'follow',
    })

    if (!upstream.ok) {
      throw createError({
        statusCode: 502,
        message: `The upstream preview could not be fetched (${upstream.status}).`,
      })
    }

    const contentType = (upstream.headers.get('content-type') || '').split(
      ';',
    )[0]

    if (!contentType?.startsWith('image/')) {
      throw createError({
        statusCode: 502,
        message: 'The upstream preview is not an image.',
      })
    }

    const bytes = Buffer.from(await upstream.arrayBuffer())

    // Checked after reading rather than trusting Content-Length, which the
    // upstream is free to omit or lie about.
    if (bytes.byteLength > MAX_BYTES) {
      throw createError({
        statusCode: 413,
        message: 'That preview is too large to use as a generation source.',
      })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Preview source loaded.',
      data: {
        previewId: preview.id,
        resourceId: resource.id,
        contentType,
        byteLength: bytes.byteLength,
        dataUri: `data:${contentType};base64,${bytes.toString('base64')}`,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to load the preview source.',
      data: null,
      statusCode,
    }
  }
})
