// /server/api/tzaddik/[id]/image.get.ts
//
// Same-origin portrait proxy for Wikipedia/Wikimedia sourced Tzaddik images.
// The browser never needs to hotlink upload.wikimedia.org directly; source
// provenance stays on the candidate record and this route only serves the
// allow-listed URL that the source refresher stored.
import {
  createError,
  defineEventHandler,
  getRouterParam,
  setHeader,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'

const FETCH_TIMEOUT_MS = 15_000
const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const USER_AGENT =
  'KindRobotsTzaddikGallery/1.0 (https://kindrobots.org; contact via kindrobots.org)'

function isAllowedSource(raw: string): boolean {
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' && url.hostname === 'upload.wikimedia.org'
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Tzaddik candidate id.',
      })
    }

    const candidate = await prisma.tzaddikCandidate.findUnique({
      where: { id },
      select: {
        curationState: true,
        imageFileUrl: true,
      },
    })

    if (
      !candidate ||
      candidate.curationState !== 'APPROVED' ||
      !candidate.imageFileUrl
    ) {
      throw createError({
        statusCode: 404,
        message: 'Tzaddik portrait not found.',
      })
    }

    if (!isAllowedSource(candidate.imageFileUrl)) {
      throw createError({
        statusCode: 502,
        message: 'Stored Tzaddik portrait source is not an allowed Wikimedia URL.',
      })
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(candidate.imageFileUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
        },
        redirect: 'follow',
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) {
      throw createError({
        statusCode: 502,
        message: `Wikimedia portrait fetch failed with HTTP ${response.status}.`,
      })
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.toLowerCase().startsWith('image/')) {
      throw createError({
        statusCode: 502,
        message: 'Wikimedia portrait source did not return an image.',
      })
    }

    const declaredLength = Number(response.headers.get('content-length') || 0)
    if (declaredLength > MAX_IMAGE_BYTES) {
      throw createError({
        statusCode: 502,
        message: 'Wikimedia portrait exceeds the maximum supported size.',
      })
    }

    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length > MAX_IMAGE_BYTES) {
      throw createError({
        statusCode: 502,
        message: 'Wikimedia portrait exceeds the maximum supported size.',
      })
    }

    setHeader(
      event,
      'Cache-Control',
      'public, max-age=86400, stale-while-revalidate=604800',
    )
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    return bytes
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load Tzaddik portrait.',
    }
  }
})
