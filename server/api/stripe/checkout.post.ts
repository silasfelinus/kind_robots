// /server/api/stripe/checkout.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import Stripe from 'stripe'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { cartItems } from '@/stores/seeds/cartItems'

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

function parseCart(body: unknown): Array<{ id: string; quantity: number }> {
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

  const quantities = new Map<string, number>()

  for (const entry of record.cart) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw createError({
        statusCode: 400,
        message: 'Each checkout cart entry must be an object.',
      })
    }

    const item = entry as Record<string, unknown>
    const invalidFields = Object.keys(item).filter(
      (field) => field !== 'id' && field !== 'quantity',
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

    const combinedQuantity = (quantities.get(id) || 0) + quantity

    if (combinedQuantity > 25) {
      throw createError({
        statusCode: 400,
        message: `Combined quantity for ${id} may not exceed 25.`,
      })
    }

    quantities.set(id, combinedQuantity)
  }

  return Array.from(quantities, ([id, quantity]) => ({ id, quantity }))
}

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const cart = parseCart(await readBody<unknown>(event))
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

    const lineItems = cart.map(({ id, quantity }) => {
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
