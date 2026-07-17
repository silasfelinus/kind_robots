// /server/api/stripe/topup.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import Stripe from 'stripe'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { usdToMana } from '~/server/utils/mana'

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

// Trusted server-side tiers — client only ever sends a tier id, never a price,
// so a tampered request body can't buy mana below its real USD cost.
export const MANA_TOPUP_TIERS = [
  { id: 'small', priceUsd: 5, label: 'Small mana top-up' },
  { id: 'medium', priceUsd: 10, label: 'Medium mana top-up' },
  { id: 'large', priceUsd: 25, label: 'Large mana top-up' },
] as const

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const { tierId } = await readBody<{ tierId: string }>(event)

    const tier = MANA_TOPUP_TIERS.find((t) => t.id === tierId)
    if (!tier)
      throw createError({ statusCode: 400, message: 'Invalid top-up tier' })

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

    const manaAmount = usdToMana(tier.priceUsd)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tier.label,
              description: `${manaAmount} mana`,
            },
            unit_amount: Math.round(tier.priceUsd * 100), // cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: 'mana_topup',
        userId: String(user.id),
        manaAmount: String(manaAmount),
      },
      success_url: `${process.env.BASE_URL}/sanctuary?manaTopup=success`,
      cancel_url: `${process.env.BASE_URL}/sanctuary?manaTopup=cancelled`,
    })

    response = {
      success: true,
      url: session.url,
      message: '🧾 Mana top-up checkout ready',
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    console.error('🔥 Stripe Top-up Error:', error)
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || '😵 Mana top-up checkout failed',
    }
  }

  return response
})
