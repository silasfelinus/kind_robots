// /server/api/stripe/cancel-subscription.post.ts
import { createError, defineEventHandler } from 'h3'
import Stripe from 'stripe'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { patronPeriodEnd } from '~/server/utils/patronBilling'

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
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    )
    const subscriptionCustomer =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id
    if (
      !user.stripeCustomerId ||
      user.stripeCustomerId !== subscriptionCustomer
    ) {
      throw createError({
        statusCode: 403,
        message: 'This subscription does not belong to your account',
      })
    }

    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) {
      throw createError({
        statusCode: 500,
        message: 'Patron subscription price is not configured',
      })
    }
    const endDate = patronPeriodEnd(subscription, priceId)
    if (
      !endDate ||
      !Number.isFinite(endDate.getTime()) ||
      endDate <= new Date()
    ) {
      throw createError({
        statusCode: 409,
        message: 'Could not confirm the remaining paid billing period',
      })
    }

    // Preserve access already purchased. Stripe cancels the subscription at
    // the period boundary and then sends customer.subscription.deleted.
    // Already-scheduled cancellation is idempotent and is safe to retry.
    if (!subscription.cancel_at_period_end) {
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        memberUntil: endDate,
      },
    })

    response = {
      success: true,
      endsAt: endDate.toISOString(),
      message: 'Renewal cancelled. Your Patron access stays active until the end of the paid period.',
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
