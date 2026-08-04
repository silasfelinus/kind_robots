// /server/api/stripe/checkout-status.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import Stripe from 'stripe'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'

let stripe: Stripe | null = null

function getStripeClient(): Stripe {
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

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const rawSessionId = getQuery(event).session_id
    const sessionId =
      typeof rawSessionId === 'string' ? rawSessionId.trim() : ''

    if (!sessionId.startsWith('cs_') || sessionId.length > 255) {
      throw createError({
        statusCode: 400,
        message: 'A valid Stripe checkout session ID is required.',
      })
    }

    const session = await getStripeClient().checkout.sessions.retrieve(sessionId)
    const sessionUserId = Number(session.metadata?.userId)

    if (
      session.metadata?.kind !== 'giftshop_checkout' ||
      !Number.isInteger(sessionUserId) ||
      sessionUserId !== user.id
    ) {
      throw createError({
        statusCode: 403,
        message: 'This checkout session does not belong to the signed-in user.',
      })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        paid: session.payment_status === 'paid',
        amountTotal: session.amount_total ?? 0,
        currency: session.currency ?? 'usd',
      },
      message:
        session.payment_status === 'paid'
          ? 'Stripe payment confirmed.'
          : 'Stripe checkout has not reported a completed payment.',
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    if (statusCode >= 500) {
      console.error('Stripe checkout-status lookup failed:', error)
    }

    event.node.res.statusCode = statusCode

    return {
      success: false,
      data: null,
      message: handled.message || 'Unable to verify Stripe checkout.',
      statusCode,
    }
  }
})
