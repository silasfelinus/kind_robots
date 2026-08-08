// /server/api/admin/packs/[id]/product.post.ts
//
// digital-storefront/t-004: turn a Packmaker `Pack` into a purchasable DLC
// `Product`. The webhook side already works -- server/api/stripe/webhook.post.ts's
// handleProductPurchase creates a PACK Grant when product.type === 'DLC' and
// metadata.packId is present -- this route is what actually gives it a row to
// sell. Idempotent by Product.slug: re-running with the same slug updates the
// existing row (price/title/active) instead of creating a duplicate.
import {
  createError,
  defineEventHandler,
  getRouterParam,
  H3Error,
  readBody,
} from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'

type PackProductBody = {
  slug?: unknown
  title?: unknown
  priceCents?: unknown
  currency?: unknown
  active?: unknown
}

function positivePackId(value: unknown): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const packId = positivePackId(getRouterParam(event, 'id'))
    if (!packId) {
      throw createError({ statusCode: 400, message: 'Invalid Pack ID.' })
    }

    const pack = await prisma.pack.findUnique({ where: { id: packId } })
    if (!pack) {
      throw createError({
        statusCode: 404,
        message: `Pack with ID ${packId} not found.`,
      })
    }

    const body = await readBody<PackProductBody>(event)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'A product payload is required.',
      })
    }

    const priceCents = Number(body.priceCents)
    if (!Number.isInteger(priceCents) || priceCents <= 0) {
      throw createError({
        statusCode: 400,
        message: 'priceCents must be a positive integer (price in cents).',
      })
    }

    let slug = `pack-${pack.slug}`
    if (body.slug !== undefined) {
      if (typeof body.slug !== 'string' || !body.slug.trim()) {
        throw createError({
          statusCode: 400,
          message: 'slug must be a non-empty string.',
        })
      }
      slug = body.slug.trim()
    }

    let title = pack.title
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || !body.title.trim()) {
        throw createError({
          statusCode: 400,
          message: 'title must be a non-empty string.',
        })
      }
      title = body.title.trim()
    }

    let currency = 'usd'
    if (body.currency !== undefined) {
      if (typeof body.currency !== 'string' || !body.currency.trim()) {
        throw createError({
          statusCode: 400,
          message: 'currency must be a non-empty string.',
        })
      }
      currency = body.currency.trim().toLowerCase()
    }

    let active = true
    if (body.active !== undefined) {
      if (typeof body.active !== 'boolean') {
        throw createError({
          statusCode: 400,
          message: 'active must be a boolean.',
        })
      }
      active = body.active
    }

    // Same JSON-in-metadata convention the webhook's POD branch already uses
    // for artImageId/printfulVariantId -- see webhook.post.ts's DLC branch.
    const metadata = JSON.stringify({ packId: pack.id })

    const existing = await prisma.product.findUnique({ where: { slug } })

    const product = await prisma.product.upsert({
      where: { slug },
      update: { title, priceCents, currency, active, metadata, type: 'DLC' },
      create: {
        slug,
        title,
        priceCents,
        currency,
        active,
        metadata,
        type: 'DLC',
      },
    })

    event.node.res.statusCode = existing ? 200 : 201

    return {
      success: true,
      data: product,
      message: existing
        ? `Product "${slug}" updated for Pack ${packId}.`
        : `Product "${slug}" created for Pack ${packId}.`,
      statusCode: existing ? 200 : 201,
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
