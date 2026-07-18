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

// Subscription checkout completes with no metadata (subscribe.post.ts sets none) —
// route on session.mode instead. Idempotent by construction: this only ever sets
// isMember/stripeSubscriptionId to their new value, it never accumulates like mana.
async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id

  if (!customerId || !subscriptionId) {
    console.error(
      `⚠️ Stripe webhook: subscription checkout session ${session.id} missing customer/subscription id`,
    )
    return
  }

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  })
  if (!user) {
    console.error(
      `⚠️ Stripe webhook: no user found for Stripe customer ${customerId} (session ${session.id})`,
    )
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isMember: true,
      memberUntil: null,
      stripeSubscriptionId: subscriptionId,
    },
  })

  console.log(
    `🎫 Activated membership for user ${user.id} (subscription ${subscriptionId})`,
  )
}

// digital-storefront Product purchase (digital-storefront/t-022): checkout
// sessions for catalog items carry `metadata.productSlug` (set by the
// checkout-creation route, mirroring mana_topup's `metadata.kind` convention)
// so this handler knows which Product to fulfill. Order.stripeSessionId is
// the idempotency key (unique constraint from t-011's migration) — a
// redelivered webhook event finds the existing Order and returns without
// double-fulfilling.
async function handleProductPurchase(session: Stripe.Checkout.Session) {
  const slug = session.metadata?.productSlug
  const userId = Number(session.metadata?.userId)

  if (!slug || !Number.isInteger(userId) || userId <= 0) {
    console.error(
      `⚠️ Stripe webhook: payment session ${session.id} missing productSlug/userId metadata`,
    )
    return
  }

  const existingOrder = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  })
  if (existingOrder) {
    console.log(
      `💤 Stripe webhook: session ${session.id} already fulfilled, skipping`,
    )
    return
  }

  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product || !product.active) {
    console.error(
      `⚠️ Stripe webhook: session ${session.id} references unknown/inactive product "${slug}"`,
    )
    return
  }

  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        stripeSessionId: session.id,
        stripeCustomerId: customerId ?? null,
        status: 'PAID',
        totalCents: session.amount_total ?? product.priceCents,
      },
    })

    const item = await tx.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        quantity: 1,
        priceCents: product.priceCents,
      },
    })

    await tx.entitlement.create({
      data: {
        userId,
        productId: product.id,
        orderItemId: item.id,
      },
    })
  })

  console.log(
    `🎟️ Granted entitlement for product "${slug}" to user ${userId} (session ${session.id})`,
  )
}

// customer.subscription.updated/deleted — keeps isMember in sync with Stripe's
// view of the subscription (renewal, cancellation, payment failure) independent
// of whether the cancellation was initiated from our UI or the Stripe dashboard.
async function handleSubscriptionLifecycle(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id

  if (!customerId) return

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  })
  if (!user) return

  // Only act on the subscription we're currently tracking for this user —
  // an old/replaced subscription's late event shouldn't clobber a newer one.
  if (
    user.stripeSubscriptionId &&
    user.stripeSubscriptionId !== subscription.id
  )
    return

  const isActive =
    subscription.status === 'active' || subscription.status === 'trialing'

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isMember: isActive,
      memberUntil: isActive ? null : new Date(),
      stripeSubscriptionId: isActive ? subscription.id : null,
    },
  })

  console.log(
    `🎫 Subscription ${subscription.id} for user ${user.id} -> ${subscription.status} (isMember=${isActive})`,
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
      } else if (session.mode === 'subscription') {
        await handleSubscriptionCheckout(session)
      } else if (session.mode === 'payment' && session.metadata?.productSlug) {
        await handleProductPurchase(session)
      }
    } else if (
      stripeEvent.type === 'customer.subscription.updated' ||
      stripeEvent.type === 'customer.subscription.deleted'
    ) {
      await handleSubscriptionLifecycle(
        stripeEvent.data.object as Stripe.Subscription,
      )
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
