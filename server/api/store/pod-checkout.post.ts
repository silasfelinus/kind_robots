// /server/api/store/pod-checkout.post.ts
// Real print-on-demand checkout for print-swag.vue (digital-storefront/t-030),
// replacing its console.log + alert() mock. Creates/reuses a POD Product row
// and a real Stripe Checkout Session (test mode); the webhook's
// handleProductPurchase branch (server/api/stripe/webhook.post.ts) creates the
// PrintJob fulfillment record once payment completes. Submitting the order to
// a POD vendor (Printful) is intentionally NOT part of this route — no
// vendor account/API key exists yet (digital-storefront/t-015, needs-human).
import { createError, defineEventHandler, readBody } from 'h3'
import Stripe from 'stripe'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { checkPrintEligibility } from '../art/utils/printEligibility'

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

// Placeholder Printful catalog — variant ids are not real Printful catalog
// ids (no vendor account exists yet). Pricing mirrors the display-only
// stores/seeds/cartItems.ts tiers so this doesn't introduce a second price
// for the same product type.
const POD_CATALOG: Record<
  string,
  { title: string; priceCents: number; printfulVariantId: string }
> = {
  print: {
    title: 'Art Print',
    priceCents: 1299,
    printfulVariantId: 'PLACEHOLDER_PRINT',
  },
  shirt: {
    title: 'T-Shirt',
    priceCents: 2499,
    printfulVariantId: 'PLACEHOLDER_SHIRT',
  },
  sticker: {
    title: 'Sticker',
    priceCents: 499,
    printfulVariantId: 'PLACEHOLDER_STICKER',
  },
  mug: {
    title: 'Mug',
    priceCents: 1649,
    printfulVariantId: 'PLACEHOLDER_MUG',
  },
}

function parseBody(body: unknown): {
  printType: string
  catalogEntry: (typeof POD_CATALOG)[string]
  artImageId: number
  quantity: number
} {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: 'Checkout payload is required.',
    })
  }

  const record = body as Record<string, unknown>
  const printType = typeof record.printType === 'string' ? record.printType : ''
  const catalogEntry = POD_CATALOG[printType]

  if (!catalogEntry) {
    throw createError({
      statusCode: 400,
      message: `Invalid print type: ${printType || '(none)'}.`,
    })
  }

  const artImageId = Number(record.artImageId)
  if (!Number.isInteger(artImageId) || artImageId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'A valid artImageId is required.',
    })
  }

  const quantity = Number(record.quantity)
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 25) {
    throw createError({
      statusCode: 400,
      message: 'Quantity must be an integer from 1 to 25.',
    })
  }

  return { printType, catalogEntry, artImageId, quantity }
}

export default defineEventHandler(async (event) => {
  try {
    const { user, isAdmin } = await requireApiUser(event)
    const { printType, catalogEntry, artImageId, quantity } = parseBody(
      await readBody<unknown>(event),
    )

    const image = await prisma.artImage.findUnique({
      where: { id: artImageId },
      select: {
        userId: true,
        isMature: true,
        isPublic: true,
        isActive: true,
        checkpointResourceId: true,
        CheckpointResource: { select: { commercialSafe: true } },
      },
    })

    if (!image) {
      throw createError({ statusCode: 404, message: 'ArtImage not found.' })
    }

    // Re-check eligibility server-side rather than trusting the client's
    // disabled-button state (t-029's gate is also called client-side for UX,
    // but this is the enforcement point).
    const eligibility = checkPrintEligibility(image, image.CheckpointResource, {
      userId: user.id,
      isAdmin,
    })

    if (!eligibility.eligible) {
      throw createError({ statusCode: 403, message: eligibility.reason })
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

    // One Product row per (printType, artImageId) pair, reused across repeat
    // orders of the same print instead of growing the catalog unbounded.
    const slug = `pod-${printType}-art${artImageId}`
    const metadata = JSON.stringify({
      artImageId,
      printfulVariantId: catalogEntry.printfulVariantId,
    })

    const product = await prisma.product.upsert({
      where: { slug },
      create: {
        slug,
        type: 'POD',
        title: `${catalogEntry.title} — ArtImage #${artImageId}`,
        priceCents: catalogEntry.priceCents,
        metadata,
      },
      update: {},
    })

    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: product.title },
            unit_amount: product.priceCents,
          },
          quantity,
        },
      ],
      metadata: {
        productSlug: product.slug,
        userId: String(user.id),
      },
      success_url: `${process.env.BASE_URL}/shop/success`,
      cancel_url: `${process.env.BASE_URL}/shop/cancel`,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      data: { url: session.url },
      message: '🖨️ Print checkout ready',
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    if (statusCode >= 500) {
      console.error('POD checkout failed:', error)
    }

    event.node.res.statusCode = statusCode

    return {
      success: false,
      data: null,
      message: handled.message || '😵 Print checkout failed',
      statusCode,
    }
  }
})
