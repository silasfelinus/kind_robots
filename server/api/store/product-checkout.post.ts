// /server/api/store/product-checkout.post.ts
// Generic single-Product Stripe Checkout Session creator (digital-storefront
// t-023, SPEC.md §5) — for catalog entries that grant an Entitlement
// (DIGITAL_PDF, DLC) rather than the multi-line giftshop cart flow
// (server/api/stripe/checkout.post.ts) or a print order (pod-checkout.post.ts).
// First consumer: the Mermaids of Venice PDF (slug "mermaids-of-venice-pdf",
// seeded by scripts/seed_products.ts).
import { createError, defineEventHandler, readBody } from 'h3'
import Stripe from 'stripe'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'

let stripe: Stripe | null = null

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw createError({
      statusCode: 500,
      message: 'Stripe secret key is not configured',
    })
  }

  stripe ??= new Stripe(secretKey)
  return stripe
}

// POD has its own route (pod-checkout.post.ts, per-ArtImage pricing);
// SUBSCRIPTION/MANA_TOPUP/DONATION have their own dedicated flows already
// (subscribe.post.ts, topup.post.ts, the giftshop cart). This route is only
// for products whose fulfillment is a plain Entitlement row.
const ENTITLEMENT_PRODUCT_TYPES = new Set(['DIGITAL_PDF', 'DLC'])

function parseSlug(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: 'Checkout payload is required.',
    })
  }

  const record = body as Record<string, unknown>
  const unsupportedFields = Object.keys(record).filter(
    (field) => field !== 'slug',
  )

  if (unsupportedFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported checkout fields: ${unsupportedFields.join(', ')}.`,
    })
  }

  if (typeof record.slug !== 'string' || !record.slug.trim()) {
    throw createError({
      statusCode: 400,
      message: 'A product slug is required.',
    })
  }

  return record.slug.trim()
}

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const slug = parseSlug(await readBody<unknown>(event))

    const product = await prisma.product.findUnique({ where: { slug } })

    if (!product || !product.active) {
      throw createError({
        statusCode: 404,
        message: `Unknown or inactive product: ${slug}.`,
      })
    }

    if (!ENTITLEMENT_PRODUCT_TYPES.has(product.type)) {
      throw createError({
        statusCode: 400,
        message: `Product "${slug}" is not purchasable through this route.`,
      })
    }

    const existingEntitlement = await prisma.entitlement.findFirst({
      where: { userId: user.id, productId: product.id, revokedAt: null },
    })

    if (existingEntitlement) {
      throw createError({
        statusCode: 400,
        message: `You already own "${product.title}".`,
      })
    }

    const stripeClient = getStripeClient()
    const email = user.email || `user-${user.id}@kindrobots.org`

    const customerId =
      user.stripeCustomerId ??
      (await stripeClient.customers.create({ email })).id

    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: { name: product.title },
            unit_amount: product.priceCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        productSlug: product.slug,
        userId: String(user.id),
      },
      // Hardcoded to /mermaids: the only entitlement product today. A future
      // DLC product will need a real redirect target derived per-product —
      // add it then, not speculatively now.
      success_url: `${process.env.BASE_URL}/mermaids?purchase=success`,
      cancel_url: `${process.env.BASE_URL}/mermaids?purchase=cancelled`,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      data: { url: session.url },
      message: '🧾 Stripe checkout ready',
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    if (statusCode >= 500) {
      console.error('Product checkout failed:', error)
    }

    event.node.res.statusCode = statusCode

    return {
      success: false,
      data: null,
      message: handled.message || '😵 Product checkout failed',
      statusCode,
    }
  }
})
