// /server/api/stripe/subscribe.post.ts
import { defineEventHandler } from 'h3'
import Stripe from 'stripe'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'

let stripe: Stripe | null = null

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    const error = new Error('Stripe secret key is not configured') as Error & {
      statusCode: number
    }
    error.statusCode = 500
    throw error
  }

  stripe ??= new Stripe(secretKey)
  return stripe
}

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)

    const stripe = getStripeClient()
    const email = user.email || `user-${user.id}@kindrobots.org`

    const customerId =
      user.stripeCustomerId ?? (await stripe.customers.create({ email })).id

    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.BASE_URL}/sanctuary?subscription=success`,
      cancel_url: `${process.env.BASE_URL}/sanctuary?subscription=cancelled`,
    })

    return {
      success: true,
      url: session.url,
      message: '✨ Subscription checkout initialized',
    }
  } catch (error: any) {
    console.error('🔥 Stripe Subscribe Error:', error)
    return errorHandler({
      error,
      message: '😵 Subscription failed',
      statusCode: error?.statusCode || 500,
    })
  }
})
