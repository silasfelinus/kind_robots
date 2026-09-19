// /server/api/lora/download-request.post.ts
//
// A logged-in user enqueues a model download from the Discover browser. Mirrors
// the ArtJob enqueue: the server never dials the home network — the import
// home downloader pulls PENDING rows via /api/lora/download/claim. We de-dupe against
// in-flight requests and already-owned Resources so a double-click or a re-
// browse can't queue the same version twice.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import {
  DOWNLOADABLE_RESOURCE_TYPES,
  type DownloadableResourceType,
} from '~/utils/resourceDownloads'

type DownloadSource = 'CIVITAI' | 'CIVARCHIVE' | 'URL'

// Only file-backed Resource kinds belong in the home model download queue.
// URL/API/SAMPLER Resources are real schema values, but are not model binaries
// and must never be silently dumped into the LoRA directory.
type DownloadRequestBody = {
  source?: string | null
  resourceType?: string | null
  civitaiModelId?: number | null
  civitaiModelVersionId?: number | null
  downloadUrl?: string | null
  fileName?: string | null
  label?: string | null
  isMature?: boolean | null
}

function normalizeSource(value: unknown): DownloadSource {
  const candidate = String(value ?? '').toUpperCase()
  if (candidate === 'CIVARCHIVE') return 'CIVARCHIVE'
  if (candidate === 'URL') return 'URL'
  return 'CIVITAI'
}

function normalizeResourceType(value: unknown): DownloadableResourceType {
  const candidate = String(value ?? 'LORA').toUpperCase()
  if (
    (DOWNLOADABLE_RESOURCE_TYPES as readonly string[]).includes(candidate)
  ) {
    return candidate as DownloadableResourceType
  }
  throw createError({
    statusCode: 400,
    message: `Unsupported downloadable Resource type: ${candidate || '(empty)'}.`,
  })
}

function optionalPositiveInt(value: unknown): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function optionalText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = (await readBody<DownloadRequestBody>(event).catch(
      () => null,
    )) as DownloadRequestBody | null

    if (!body) {
      throw createError({ statusCode: 400, message: 'Missing request body.' })
    }

    const source = normalizeSource(body.source)
    const resourceType = normalizeResourceType(body.resourceType)
    const civitaiModelId = optionalPositiveInt(body.civitaiModelId)
    const civitaiModelVersionId = optionalPositiveInt(body.civitaiModelVersionId)
    const downloadUrl = optionalText(body.downloadUrl, 2000)

    // Need somewhere to download from: a Civitai version id, or a direct URL.
    if (!civitaiModelVersionId && !downloadUrl) {
      throw createError({
        statusCode: 400,
        message:
          'A civitaiModelVersionId or a downloadUrl is required to queue a download.',
      })
    }

    // Already owned? If a Resource already carries this version id, don't queue.
    if (civitaiModelVersionId) {
      const owned = await prisma.resource.findFirst({
        where: { civitaiModelVersionId },
        select: { id: true, name: true },
      })

      if (owned) {
        event.node.res.statusCode = 200
        return {
          success: true,
          message: 'Already in your library.',
          data: { alreadyOwned: true, resourceId: owned.id, request: null },
          statusCode: 200,
        }
      }

      // In-flight de-dupe: reuse an existing PENDING/CLAIMED request.
      const inFlight = await prisma.downloadRequest.findFirst({
        where: {
          civitaiModelVersionId,
          status: { in: ['PENDING', 'CLAIMED'] },
        },
        orderBy: { id: 'desc' },
      })

      if (inFlight) {
        event.node.res.statusCode = 200
        return {
          success: true,
          message: 'Download already queued.',
          data: { alreadyQueued: true, request: inFlight },
          statusCode: 200,
        }
      }
    }

    const request = await prisma.downloadRequest.create({
      data: {
        status: 'PENDING',
        source,
        resourceType,
        civitaiModelId,
        civitaiModelVersionId,
        downloadUrl,
        fileName: optionalText(body.fileName, 512),
        label: optionalText(body.label, 512),
        isMature: body.isMature === true,
        userId: auth.user.id,
      },
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Download queued.',
      data: { request },
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to queue download.',
      statusCode,
    }
  }
})
