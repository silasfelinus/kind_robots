// /server/api/stripe/webhook.post.ts
import { createError, defineEventHandler, getHeader, readRawBody } from 'h3'
import Stripe from 'stripe'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { applyMana, usdToMana } from '~/server/utils/mana'
import { cartItems, type CartItem } from '@/stores/seeds/cartItems'
import type { ProductType } from '~/prisma/generated/prisma/client'
import { checkPrintEligibility } from '../art/utils/printEligibility'
import { userIsAdmin } from '~/server/utils/authUser'

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

  // Read the real purchased quantity from the session's line items instead of
  // hardcoding 1 — required for POD orders (digital-storefront/t-030), where
  // a caller can print more than one copy of the same image.
  let quantity = 1
  try {
    const lineItems = await getStripeClient().checkout.sessions.listLineItems(
      session.id,
      { limit: 1 },
    )
    const firstQuantity = lineItems.data[0]?.quantity
    if (Number.isInteger(firstQuantity) && (firstQuantity ?? 0) > 0) {
      quantity = firstQuantity as number
    }
  } catch (error) {
    console.error(
      `⚠️ Stripe webhook: failed to read line items for session ${session.id}, defaulting to quantity 1`,
      error,
    )
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        stripeSessionId: session.id,
        stripeCustomerId: customerId ?? null,
        status: 'PAID',
        totalCents: session.amount_total ?? product.priceCents * quantity,
      },
    })

    const item = await tx.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        quantity,
        priceCents: product.priceCents,
      },
    })

    if (product.type === 'POD') {
      // Physical fulfillment goes through PrintJob, not Entitlement — a print
      // order isn't "owned" the way a digital good is, it ships. Stays
      // PENDING until the Printful vendor integration itself is built
      // (needs-human, no account/API key yet) actually submits the order.
      let podMetadata: { artImageId?: unknown; printfulVariantId?: unknown } =
        {}
      try {
        podMetadata = product.metadata ? JSON.parse(product.metadata) : {}
      } catch (error) {
        console.error(
          `⚠️ Stripe webhook: unparseable metadata on POD product "${slug}"`,
          error,
        )
      }

      const artImageId = Number(podMetadata.artImageId)
      const printfulVariantId =
        typeof podMetadata.printfulVariantId === 'string'
          ? podMetadata.printfulVariantId
          : null

      if (!Number.isInteger(artImageId) || !printfulVariantId) {
        console.error(
          `⚠️ Stripe webhook: POD product "${slug}" missing artImageId/printfulVariantId metadata, skipping PrintJob creation`,
        )
        return
      }

      // Re-check print eligibility against the ArtImage's CURRENT state, not
      // whatever it was at checkout-creation time (digital-storefront/t-032,
      // gallery-to-swag-pipeline.md §4 "Takedown path"): a moderation action
      // taken between "added to cart" and "payment completed" — isActive
      // flipped false, isMature flagged, or the caller's own access revoked
      // — must not silently ship. Reuses the same eligibility function
      // pod-checkout.post.ts calls at checkout time, unmodified.
      const [image, buyer] = await Promise.all([
        tx.artImage.findUnique({
          where: { id: artImageId },
          select: {
            userId: true,
            isMature: true,
            isPublic: true,
            isActive: true,
            checkpointResourceId: true,
            CheckpointResource: { select: { commercialSafe: true } },
          },
        }),
        tx.user.findUnique({
          where: { id: userId },
          select: { id: true, Role: true },
        }),
      ])

      const eligibility = image
        ? checkPrintEligibility(image, image.CheckpointResource, {
            userId,
            isAdmin: buyer ? userIsAdmin(buyer) : false,
          })
        : { eligible: false, reason: 'ArtImage no longer exists.' }

      if (!eligibility.eligible) {
        console.error(
          `⚠️ Stripe webhook: POD product "${slug}" (artImageId ${artImageId}) failed re-check at payment time (${eligibility.reason}) — creating PrintJob as FAILED instead of shipping it`,
        )
        await tx.printJob.create({
          data: {
            orderItemId: item.id,
            artImageId,
            printfulVariantId,
            status: 'FAILED',
          },
        })
        return
      }

      await tx.printJob.create({
        data: {
          orderItemId: item.id,
          artImageId,
          printfulVariantId,
        },
      })
    } else {
      await tx.entitlement.create({
        data: {
          userId,
          productId: product.id,
          orderItemId: item.id,
        },
      })
    }
  })

  console.log(
    product.type === 'POD'
      ? `🖨️ Created PrintJob for product "${slug}" (user ${userId}, session ${session.id})`
      : `🎟️ Granted entitlement for product "${slug}" to user ${userId} (session ${session.id})`,
  )
}

// General multi-item giftshop cart checkout (digital-storefront/t-031).
// Unlike handleProductPurchase (one Product per session, via
// metadata.productSlug), a cart session can mix several
// stores/seeds/cartItems.ts catalog types in one Stripe session -- each line
// item carries its own `metadata.giftshopType` (set by checkout.post.ts's
// per-line `metadata` field) instead of a single session-level productSlug.
// One Order is created per session with one OrderItem per line item.
//
// Scope of this pass: every purchased line item gets a real Order/OrderItem
// audit record (closing the "succeeds at Stripe, no Order ever created" gap),
// and 'tokens' additionally credits real mana in the same transaction
// (mirroring handleManaTopup's PURCHASE-reason pattern) since leaving that
// unfulfilled would mean charging a user real money for boost tokens and
// granting nothing. Deliberately NOT implemented here: PrintJob creation for
// print/shirt/sticker/mug/book -- unlike pod-checkout.post.ts's dedicated
// route, the general cart's checkout() payload only ever sends `{id,
// quantity}` per line (stores/cartStore.ts), even though its own CartItem
// interface tracks a real artImageId client-side; wiring that through plus a
// server-side checkPrintEligibility re-check is real-art-selection work
// still needed as a follow-up. Filing a PrintJob against a fabricated
// artImageId here would misrepresent what art is being printed, so this pass
// records the sale for those four types and stops there.
const GIFTSHOP_TYPE_TO_PRODUCT_TYPE: Record<CartItem['type'], ProductType> = {
  print: 'POD',
  shirt: 'POD',
  sticker: 'POD',
  mug: 'POD',
  book: 'POD',
  donation: 'DONATION',
  tokens: 'MANA_TOPUP',
}

async function handleGiftshopCartPurchase(session: Stripe.Checkout.Session) {
  const userId = Number(session.metadata?.userId)

  if (!Number.isInteger(userId) || userId <= 0) {
    console.error(
      `⚠️ Stripe webhook: giftshop cart session ${session.id} missing/invalid userId metadata`,
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

  const lineItems = await getStripeClient().checkout.sessions.listLineItems(
    session.id,
    { limit: 100 },
  )

  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id

  let fulfilledCount = 0
  let skippedCount = 0

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        stripeSessionId: session.id,
        stripeCustomerId: customerId ?? null,
        status: 'PAID',
        totalCents: session.amount_total ?? 0,
      },
    })

    for (const line of lineItems.data) {
      const cartType = line.metadata?.giftshopType
      const catalogEntry = cartItems.find((entry) => entry.id === cartType)
      const productType = catalogEntry
        ? GIFTSHOP_TYPE_TO_PRODUCT_TYPE[catalogEntry.type]
        : undefined

      if (!catalogEntry || !productType) {
        console.error(
          `⚠️ Stripe webhook: giftshop cart session ${session.id} has a line item with unknown giftshopType "${cartType}", skipping`,
        )
        skippedCount += 1
        continue
      }

      const quantity = line.quantity ?? 1
      const priceCents = Math.round(catalogEntry.price * 100)
      const slug = `giftshop-${catalogEntry.id}`

      const product = await tx.product.upsert({
        where: { slug },
        create: {
          slug,
          type: productType,
          title: catalogEntry.label,
          priceCents,
        },
        update: {},
      })

      const item = await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity,
          priceCents,
        },
      })

      if (catalogEntry.type === 'tokens') {
        // Real fulfillment, not just an audit record -- unlike donation/POD,
        // "100 Boost Tokens" has nothing else that represents ownership, so
        // if mana isn't credited here the user paid real money for nothing.
        // Passed the same `tx` so this commits atomically with the Order/
        // OrderItem above rather than opening its own transaction.
        const manaAmount = usdToMana(catalogEntry.price) * quantity

        await applyMana({
          userId,
          amount: manaAmount,
          reason: 'PURCHASE',
          refId: `${session.id}:${item.id}`,
          provider: 'stripe',
          costUsd: catalogEntry.price * quantity,
          note: `Giftshop cart purchase: ${catalogEntry.label}`,
          tx,
        })
      }

      fulfilledCount += 1
    }
  })

  console.log(
    `🛍️ Fulfilled giftshop cart session ${session.id} for user ${userId} (${fulfilledCount} line item(s), ${skippedCount} skipped)`,
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
      } else if (
        session.mode === 'payment' &&
        session.metadata?.kind === 'giftshop_checkout'
      ) {
        await handleGiftshopCartPurchase(session)
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
