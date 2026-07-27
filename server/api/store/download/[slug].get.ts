// /server/api/store/download/[slug].get.ts
// Secure delivery of a paid digital-good file (SPEC.md §5, digital-storefront
// t-023). Never re-check happens client-side or via a cached URL — every
// request re-verifies the caller's Entitlement, then streams the file from
// getProductStorageRoot() (outside public/, so Nitro's static server never
// exposes it directly).
import { createError, defineEventHandler, getRouterParam, sendStream } from 'h3'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import prisma from '../../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { getProductStorageRoot } from '~/server/utils/productStorageRoot'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const slug = getRouterParam(event, 'slug')

    if (!slug) {
      throw createError({
        statusCode: 400,
        message: 'A product slug is required.',
      })
    }

    const product = await prisma.product.findUnique({ where: { slug } })

    if (!product || !product.active) {
      throw createError({
        statusCode: 404,
        message: `Unknown or inactive product: ${slug}.`,
      })
    }

    // Only DIGITAL_PDF products stream bytes through this route — DLC
    // "unlocks" gate a feature/route via entitlements.get.ts instead
    // (SPEC.md §5's closing paragraph), never a file download.
    if (product.type !== 'DIGITAL_PDF') {
      throw createError({
        statusCode: 400,
        message: `Product "${slug}" is not a downloadable file.`,
      })
    }

    const entitlement = await prisma.entitlement.findFirst({
      where: { userId: user.id, productId: product.id, revokedAt: null },
    })

    if (!entitlement) {
      throw createError({
        statusCode: 403,
        message: `You do not own "${product.title}".`,
      })
    }

    // Filename is derived from the slug (not stored client-side or in
    // Entitlement), same convention as the seeded catalog: <slug>.pdf under
    // the private storage root.
    const filePath = path.join(getProductStorageRoot(), `${slug}.pdf`)

    const fileStat = await stat(filePath).catch(() => null)
    if (!fileStat || !fileStat.isFile()) {
      console.error(
        `⚠️ Download route: entitled file missing on disk for product "${slug}" (${filePath})`,
      )
      throw createError({
        statusCode: 500,
        message: 'The file for this product is temporarily unavailable.',
      })
    }

    event.node.res.setHeader('Content-Type', 'application/pdf')
    event.node.res.setHeader(
      'Content-Disposition',
      `attachment; filename="${slug}.pdf"`,
    )
    event.node.res.setHeader('Content-Length', String(fileStat.size))

    console.log(`📥 Streaming "${slug}" to user ${user.id}`)

    return sendStream(event, createReadStream(filePath))
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    if (statusCode >= 500) {
      console.error('Product download failed:', error)
    }

    event.node.res.statusCode = statusCode

    return {
      success: false,
      data: null,
      message: handled.message || '😵 Product download failed',
      statusCode,
    }
  }
})
