// /server/api/stripe/checkout.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import Stripe from 'stripe'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { cartItems } from '@/stores/seeds/cartItems'
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

type ParsedCartEntry = {
  id: string
  quantity: number
  // Only set (and required) for catalog items where needsArt is true
  // (print/shirt/sticker/mug — see stores/seeds/cartItems.ts). null for
  // every other type (donation, tokens, book, ...).
  artImageId: number | null
}

function parseCart(body: unknown): ParsedCartEntry[] {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: 'Checkout payload is required.',
    })
  }

  const record = body as Record<string, unknown>
  const unsupportedFields = Object.keys(record).filter(
    (field) => field !== 'cart',
  )

  if (unsupportedFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported checkout fields: ${unsupportedFields.join(', ')}. User identity comes from authentication.`,
    })
  }

  if (!Array.isArray(record.cart) || !record.cart.length) {
    throw createError({
      statusCode: 400,
      message: 'Checkout cart must be a non-empty array.',
    })
  }

  if (record.cart.length > 50) {
    throw createError({
      statusCode: 400,
      message: 'Checkout cart may contain at most 50 entries.',
    })
  }

  // Dedup key for needsArt items includes artImageId so two different prints
  // of the same product type (e.g. two different "print" line items) stay as
  // distinct entries instead of being merged into one combined-quantity line
  // with no way to tell which art each unit is for.
  const entries = new Map<string, ParsedCartEntry>()

  for (const entry of record.cart) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw createError({
        statusCode: 400,
        message: 'Each checkout cart entry must be an object.',
      })
    }

    const item = entry as Record<string, unknown>
    const invalidFields = Object.keys(item).filter(
      (field) =>
        field !== 'id' && field !== 'quantity' && field !== 'artImageId',
    )

    if (invalidFields.length) {
      throw createError({
        statusCode: 400,
        message: `Unsupported cart entry fields: ${invalidFields.join(', ')}.`,
      })
    }

    if (typeof item.id !== 'string' || !item.id.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Each cart entry requires a valid item ID.',
      })
    }

    const id = item.id.trim()
    const trustedItem = cartItems.find((candidate) => candidate.id === id)

    if (!trustedItem) {
      throw createError({
        statusCode: 400,
        message: `Invalid cart item: ${id}.`,
      })
    }

    if (!Number.isSafeInteger(item.quantity)) {
      throw createError({
        statusCode: 400,
        message: `Quantity for ${id} must be an integer from 1 to 25.`,
      })
    }

    const quantity = Number(item.quantity)

    if (quantity < 1 || quantity > 25) {
      throw createError({
        statusCode: 400,
        message: `Quantity for ${id} must be an integer from 1 to 25.`,
      })
    }

    let artImageId: number | null = null

    if (trustedItem.needsArt) {
      if (
        !Number.isSafeInteger(item.artImageId) ||
        (item.artImageId as number) <= 0
      ) {
        throw createError({
          statusCode: 400,
          message: `A valid artImageId is required for ${id}.`,
        })
      }

      artImageId = Number(item.artImageId)
    }

    const dedupeKey = artImageId != null ? `${id}:${artImageId}` : id
    const existing = entries.get(dedupeKey)
    const combinedQuantity = (existing?.quantity || 0) + quantity

    if (combinedQuantity > 25) {
      throw createError({
        statusCode: 400,
        message: `Combined quantity for ${id} may not exceed 25.`,
      })
    }

    entries.set(dedupeKey, { id, artImageId, quantity: combinedQuantity })
  }

  return Array.from(entries.values())
}

export default defineEventHandler(async (event) => {
  try {
    const { user, isAdmin } = await requireApiUser(event)
    const cart = parseCart(await readBody<unknown>(event))
    const stripeClient = getStripeClient()
    const email = user.email || `user-${user.id}@kindrobots.org`

    // Re-check print eligibility server-side for every art-requiring line
    // before creating the Stripe session — never trust the client's
    // disabled-button state (same enforcement point as pod-checkout.post.ts).
    // Any ineligible line fails the whole checkout rather than silently
    // dropping just that item, so the user is never charged for less than
    // the cart they reviewed.
    for (const { id, artImageId } of cart) {
      if (artImageId == null) continue

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
        throw createError({
          statusCode: 404,
          message: `ArtImage ${artImageId} for ${id} not found.`,
        })
      }

      const eligibility = checkPrintEligibility(
        image,
        image.CheckpointResource,
        {
          userId: user.id,
          isAdmin,
        },
      )

      if (!eligibility.eligible) {
        throw createError({
          statusCode: 403,
          message: `${id} (ArtImage ${artImageId}): ${eligibility.reason}`,
        })
      }
    }

    const customerId =
      user.stripeCustomerId ??
      (await stripeClient.customers.create({ email })).id

    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const lineItems = cart.map(({ id, quantity, artImageId }) => {
      const item = cartItems.find((candidate) => candidate.id === id)

      if (!item) {
        throw createError({
          statusCode: 400,
          message: `Invalid cart item: ${id}.`,
        })
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.label,
            images: [item.image],
            description: item.description,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity,
        // Carried through to the webhook's listLineItems() response verbatim
        // (Stripe LineItem objects have their own metadata field, distinct
        // from price_data.product_data) so handleGiftshopCartPurchase can
        // fulfil each line item by its cart catalog type without needing to
        // parse it back out of the display name. artImageId (string — Stripe
        // metadata values are always strings) is only present for needsArt
        // types, so handleGiftshopCartPurchase can create a real PrintJob.
        metadata: {
          giftshopType: id,
          ...(artImageId != null ? { artImageId: String(artImageId) } : {}),
        },
      }
    })

    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: lineItems,
      metadata: {
        kind: 'giftshop_checkout',
        userId: String(user.id),
      },
      success_url: `${process.env.BASE_URL}/shop/success`,
      cancel_url: `${process.env.BASE_URL}/shop/cancel`,
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
      console.error('Stripe checkout failed:', error)
    }

    event.node.res.statusCode = statusCode

    return {
      success: false,
      data: null,
      message: handled.message || '😵 Stripe checkout failed',
      statusCode,
    }
  }
})
