// /server/api/stripe/subscribe.post.ts
import { defineEventHandler, readBody } from 'h3'
import Stripe from 'stripe'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'

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
    const { userId } = await readBody<{ userId: number }>(event)

    if (!userId)
      return errorHandler({ message: 'No user ID provided', statusCode: 400 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user)
      return errorHandler({ message: 'User not found', statusCode: 404 })

    const stripe = getStripeClient()
    const email = user.email || `user-${user.id}@kindrobots.org`

    const customerId =
      user.stripeCustomerId ?? (await stripe.customers.create({ email })).id

    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: userId },
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
