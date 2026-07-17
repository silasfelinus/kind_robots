// /server/api/stripe/cancel-subscription.post.ts
import { createError, defineEventHandler } from 'h3'
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

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    if (!user.stripeSubscriptionId)
      throw createError({
        statusCode: 400,
        message: 'No active subscription to cancel',
      })

    const stripe = getStripeClient()
    await stripe.subscriptions.cancel(user.stripeSubscriptionId)

    // Cancel immediately rather than waiting on the customer.subscription.deleted
    // webhook so the UI reflects the change right away; the webhook redelivering
    // the same state afterward is a harmless no-op.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isMember: false,
        memberUntil: new Date(),
        stripeSubscriptionId: null,
      },
    })

    response = {
      success: true,
      message: '💔 Subscription cancelled',
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    console.error('🔥 Stripe Cancel Subscription Error:', error)
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || '😵 Subscription cancellation failed',
    }
  }

  return response
})
