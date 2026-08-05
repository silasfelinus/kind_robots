// /server/api/art/images/[id]/file.get.ts
import {
  createError,
  defineEventHandler,
  getHeader,
  getRouterParam,
  sendRedirect,
  setHeader,
} from 'h3'
import sharp from 'sharp'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'
import { userIsAdmin } from '../../../../utils/authUser'

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  webp: 'image/webp',
}

// Formats worth converting. Stored webp is already small, and anything else
// is an unknown container sharp may not decode.
const TRANSCODABLE_TYPES = new Set(['png', 'jpeg', 'jpg'])

// 82 measured 8.3x smaller than the source PNG with no visible artefacts at
// card size; q90 only reached 6.3x for a much larger file.
const WEBP_QUALITY = 82

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid ArtImage ID.' })
    }

    const image = await prisma.artImage.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        imageData: true,
        imagePath: true,
        fileType: true,
        isPublic: true,
        isMature: true,
        isActive: true,
        updatedAt: true,
      },
    })

    if (!image || image.isActive === false) {
      throw createError({ statusCode: 404, message: 'Art image not found.' })
    }

    let mayView = image.isPublic === true && image.isMature !== true
    if (!mayView && getHeader(event, 'authorization')?.startsWith('Bearer ')) {
      try {
        const auth = await validateApiKey(event)
        mayView = Boolean(
          auth.isValid &&
            auth.user &&
            (userIsAdmin(auth.user) || auth.user.id === image.userId),
        )
      } catch {
        mayView = false
      }
    }

    if (!mayView) {
      throw createError({ statusCode: 403, message: 'You cannot view this image.' })
    }

    if (image.imagePath && !image.imagePath.includes(`/api/art/images/${id}/file`)) {
      return sendRedirect(event, image.imagePath, 302)
    }

    if (!image.imageData) {
      throw createError({ statusCode: 404, message: 'Image bytes are unavailable.' })
    }

    const fileType = String(image.fileType || '').toLowerCase()
    const original = Buffer.from(image.imageData, 'base64')

    setHeader(
      event,
      'Cache-Control',
      image.isPublic
        ? 'public, max-age=31536000, immutable'
        : 'private, max-age=3600',
    )
    setHeader(event, 'X-Content-Type-Options', 'nosniff')

    /*
     * Entity art is stored as base64 PNG in the ArtImage row and served from
     * here verbatim, so a card is ~575KB on the wire (measured: 512x768 PNG,
     * 588,351 bytes; 496KB mean over nine live cards). A 213-card character
     * gallery therefore ships ~103MB. The same file at webp q82 is 69KB --
     * 8.3x smaller -- and the dimensions are already card-sized, so this is
     * purely a container-format cost with no resizing involved.
     *
     * Transcoding HERE rather than in the render queue means no migration, no
     * backfill, no re-render and no client change, and every gallery benefits
     * at once. The Cache-Control above is immutable for public art, so an
     * image converts once and is then served from CDN cache.
     */
    /*
     * NO `Vary: Accept`, AND NO ACCEPT NEGOTIATION — deliberately, and this is
     * the load-bearing part of this handler.
     *
     * Negotiating on Accept was correct HTTP, but it made the response depend
     * on a request header, which forces `Vary: Accept`, which keys the CDN
     * cache on that header's raw value. Browsers send wildly different strings
     * for it — Chrome, Firefox and Safari each send a different list, and it
     * changes between versions — so a single image fragmented into many cache
     * entries, and every one of them had to be populated by invoking this
     * function, hitting Prisma, and opening a ProxySQL session to read a
     * LongText blob.
     *
     * That matters here more than almost anywhere else in the app: this route
     * was 1591 requests in a two-hour window on 2026-08-05 — 34% of all
     * function invocations and 3x the next busiest route — because gallery
     * pages mount 140+ images at once. Fragmenting its cache multiplies
     * database sessions by exactly the factor you least want during a
     * connection-capacity incident.
     *
     * Always transcoding makes the response a pure function of the image id,
     * so one cache entry serves every client forever under the immutable
     * Cache-Control above. WebP has been universally supported since Safari 14
     * (2020), and the two fallbacks below still cover every real failure —
     * a client that somehow cannot read WebP is a far smaller risk than the
     * cache behaviour this replaces.
     */
    const canTranscode = TRANSCODABLE_TYPES.has(fileType)

    if (canTranscode) {
      /*
       * Deliberate degradation, not error handling: any sharp failure (a
       * corrupt row, an unavailable native binding) must fall through to the
       * original bytes rather than 500. Serving a large image is always
       * better than serving none.
       */
      try {
        const webp = await sharp(original).webp({ quality: WEBP_QUALITY }).toBuffer()

        // A transcode that grew the file helps nobody — keep the original.
        if (webp.length < original.length) {
          setHeader(event, 'Content-Type', 'image/webp')
          return webp
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`❌ webp transcode failed for ArtImage ${id}: ${message}`)
      }
    }

    setHeader(
      event,
      'Content-Type',
      CONTENT_TYPES[fileType] || 'application/octet-stream',
    )
    return original
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load art image.',
    }
  }
})
