// /server/api/stripe/webhook.post.ts
import { createError, defineEventHandler, getHeader, readRawBody } from 'h3'
import Stripe from 'stripe'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { applyMana } from '~/server/utils/mana'

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

// Stripe's signature verification IS the auth for this route — the caller is
// Stripe itself, not a logged-in user, so no validateApiKey/requireApiUser guard.
async function handleManaTopup(session: Stripe.Checkout.Session) {
  const userId = Number(session.metadata?.userId)
  const manaAmount = Number(session.metadata?.manaAmount)

  if (
    !Number.isInteger(userId) ||
    userId <= 0 ||
    !Number.isInteger(manaAmount) ||
    manaAmount <= 0
  ) {
    console.error(
      `⚠️ Stripe webhook: mana_topup session ${session.id} has invalid metadata`,
    )
    return
  }

  // Idempotency: Stripe can redeliver the same event id on retry. Guard against
  // double-crediting by checking whether this session was already fulfilled.
  const existing = await prisma.manaTransaction.findFirst({
    where: { refId: session.id, reason: 'PURCHASE' },
  })
  if (existing) {
    console.log(
      `💤 Stripe webhook: session ${session.id} already credited, skipping`,
    )
    return
  }

  await applyMana({
    userId,
    amount: manaAmount,
    reason: 'PURCHASE',
    refId: session.id,
    provider: 'stripe',
    costUsd: (session.amount_total ?? 0) / 100,
    note: 'Mana top-up via Stripe checkout',
  })

  console.log(
    `💰 Credited ${manaAmount} mana to user ${userId} (session ${session.id})`,
  )
}

export default defineEventHandler(async (event) => {
  let response

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw createError({
        statusCode: 500,
        message: 'Stripe webhook secret is not configured',
      })
    }

    const signature = getHeader(event, 'stripe-signature')
    const rawBody = await readRawBody(event)

    if (!signature || !rawBody)
      throw createError({
        statusCode: 400,
        message: 'Missing Stripe signature or body',
      })

    const stripe = getStripeClient()
    const stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    )

    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      if (session.metadata?.kind === 'mana_topup') {
        await handleManaTopup(session)
      }
    }

    response = { received: true }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    console.error('🔥 Stripe Webhook Error:', error)
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 400
    response = {
      success: false,
      message: handledError.message || '😵 Stripe webhook handling failed',
    }
  }

  return response
})
