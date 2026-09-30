// /server/api/tzaddik/[id]/image.get.ts
//
// Same-origin portrait proxy for Tzaddik images. Wikipedia/Wikimedia sourced
// portraits remain the default, while explicit editor imageUrlOverride values
// are allowed as a fallback for people with no usable Wikimedia portrait.
// Every outbound URL is validated on every redirect hop by safeFetch so an
// admin-set override cannot turn this route into an SSRF primitive.
import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { safeFetch } from '~/server/utils/safeFetch'

const FETCH_TIMEOUT_MS = 15_000
const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const USER_AGENT =
  'KindRobotsTzaddikGallery/1.0 (https://kindrobots.org; contact via kindrobots.org)'

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
        imageUrlOverride: true,
        imageFileUrl: true,
      },
    })

    const source =
      candidate?.imageUrlOverride?.trim() ||
      candidate?.imageFileUrl?.trim() ||
      ''

    if (!candidate || candidate.curationState !== 'APPROVED' || !source) {
      throw createError({
        statusCode: 404,
        message: 'Tzaddik portrait not found.',
      })
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await safeFetch(
        source,
        {
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
          },
        },
        {
          connectTimeoutMs: FETCH_TIMEOUT_MS,
          signal: controller.signal,
        },
      )

      if (!response.ok) {
        throw createError({
          statusCode: 502,
          message: `Tzaddik portrait fetch failed with HTTP ${response.status}.`,
        })
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.toLowerCase().startsWith('image/')) {
        throw createError({
          statusCode: 502,
          message: 'Tzaddik portrait source did not return an image.',
        })
      }

      const declaredLength = Number(response.headers.get('content-length') || 0)
      if (declaredLength > MAX_IMAGE_BYTES) {
        throw createError({
          statusCode: 502,
          message: 'Tzaddik portrait exceeds the maximum supported size.',
        })
      }

      const bytes = Buffer.from(await response.arrayBuffer())
      if (bytes.length > MAX_IMAGE_BYTES) {
        throw createError({
          statusCode: 502,
          message: 'Tzaddik portrait exceeds the maximum supported size.',
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
    } finally {
      clearTimeout(timer)
    }
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
