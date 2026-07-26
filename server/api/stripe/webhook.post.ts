// /server/api/stripe/webhook.post.ts
import { createError, defineEventHandler, getHeader, readRawBody } from 'h3'
import Stripe from 'stripe'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { applyMana, usdToMana } from '~/server/utils/mana'
import { cartItems, type CartItem } from '@/stores/seeds/cartItems'
import type { ProductType } from '~/prisma/generated/prisma/client'
import { checkPrintEligibility } from '../art/utils/printEligibility'
import { POD_CATALOG } from '../store/podCatalog'

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

// prisma is $extends()-wrapped (see server/utils/prisma.ts), so its
// $transaction callback's tx param has extended InternalArgs that don't
// structurally match the plain Prisma.TransactionClient type. Derive the
// type from the actual instance instead (same pattern as server/utils/mana.ts).
type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0]

// Shared by handleProductPurchase's POD branch and fulfillGiftshopPrintJob
// (digital-storefront/t-035, kaizen from t-034): both independently
// re-checked print eligibility against the ArtImage's *current* state and
// skipped the PrintJob insert when the ArtImage no longer exists, since
// PrintJob.artImageId is a required, non-null FK to ArtImage with no
// onDelete: SetNull -- inserting one referencing a nonexistent row would
// throw and roll back the whole transaction, including the Order/OrderItem
// already created in it. Returns whether a PrintJob was created (true for
// both the eligible and FAILED-status cases; false only when skipped
// entirely because the ArtImage is gone).
async function createPrintJobIfEligible(
  tx: TransactionClient,
  params: {
    orderItemId: number
    artImageId: number
    printfulVariantId: string
    userId: number
  },
  context: string,
): Promise<boolean> {
  const { orderItemId, artImageId, printfulVariantId, userId } = params

  const artImage = await tx.artImage.findUnique({
    where: { id: artImageId },
    select: {
      userId: true,
      isMature: true,
      isPublic: true,
      isActive: true,
      checkpointResourceId: true,
      CheckpointResource: { select: { commercialSafe: true } },
    },
  })

  if (!artImage) {
    console.error(
      `⚠️ Stripe webhook: ${context} references ArtImage ${artImageId} which no longer exists, skipping PrintJob`,
    )
    return false
  }

  const eligibility = checkPrintEligibility(
    artImage,
    artImage.CheckpointResource,
    { userId },
  )

  await tx.printJob.create({
    data: {
      orderItemId,
      artImageId,
      printfulVariantId,
      status: eligibility.eligible ? undefined : 'FAILED',
    },
  })

  if (!eligibility.eligible) {
    console.error(
      `⚠️ Stripe webhook: ${context} failed print-eligibility re-check at fulfillment time for ArtImage ${artImageId} (${eligibility.reason}), failing PrintJob instead of shipping it`,
    )
  }

  return true
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

      // Re-check print eligibility against the ArtImage's *current* state —
      // pod-checkout.post.ts only checked this at session-creation time, and
      // an image can be taken down (isActive/isMature flipped) during the
      // window between "added to cart" and "payment completed" (t-029's gate,
      // gallery-to-swag-pipeline.md §4). Don't trust anything cached on the
      // Product/session from checkout-creation time.
      await createPrintJobIfEligible(
        tx,
        { orderItemId: item.id, artImageId, printfulVariantId, userId },
        `POD product "${slug}"`,
      )
    } else {
      const entitlement = await tx.entitlement.create({
        data: {
          userId,
          productId: product.id,
          orderItemId: item.id,
        },
      })

      if (product.type === 'DLC') {
        // DLC products carry the Pack they unlock in metadata (same
        // JSON-in-metadata convention as the POD branch's artImageId/
        // printfulVariantId). Grant.level uses VIEW, not the "UNLOCK" level
        // digital-storefront/t-026's original note named — GrantLevel only
        // defines VIEW/ADMIN (kind-robots/t-037's "flat first cut" schema)
        // and server/utils/contentAccess.ts already gates Pack-owned content
        // on an active PACK Grant at GrantLevel.VIEW, so VIEW is the level
        // that actually unlocks the pack's content for this user.
        let dlcMetadata: { packId?: unknown } = {}
        try {
          dlcMetadata = product.metadata ? JSON.parse(product.metadata) : {}
        } catch (error) {
          console.error(
            `⚠️ Stripe webhook: unparseable metadata on DLC product "${slug}"`,
            error,
          )
        }

        const packId = Number(dlcMetadata.packId)
        if (Number.isInteger(packId) && packId > 0) {
          await tx.grant.create({
            data: {
              granteeId: userId,
              subjectType: 'PACK',
              subjectId: packId,
              level: 'VIEW',
              source: 'PURCHASE',
              refId: entitlement.id,
              status: 'ACTIVE',
            },
          })
        } else {
          console.error(
            `⚠️ Stripe webhook: DLC product "${slug}" missing/invalid packId metadata, skipping Grant creation`,
          )
        }
      }
    }
  })

  console.log(
    product.type === 'POD'
      ? `🖨️ Created PrintJob for product "${slug}" (user ${userId}, session ${session.id})`
      : product.type === 'DLC'
        ? `🎟️📦 Granted entitlement + Pack unlock for product "${slug}" to user ${userId} (session ${session.id})`
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
// Scope: every purchased line item gets a real Order/OrderItem audit record
// (closing the "succeeds at Stripe, no Order ever created" gap); 'tokens'
// additionally credits real mana (mirroring handleManaTopup's PURCHASE-reason
// pattern); and print/shirt/sticker/mug (needsArt in stores/seeds/cartItems.ts)
// get a real PrintJob (digital-storefront/t-033) using the artImageId
// checkout.post.ts now carries through per-line metadata. 'book' is also POD
// but needsArt is false -- it's the fixed "Mermaids of Venice (Signed)"
// product, not a print of a specific ArtImage, and has no POD_CATALOG entry
// (no Printful variant), so it stays Order/OrderItem-only like donation.
const GIFTSHOP_TYPE_TO_PRODUCT_TYPE: Record<CartItem['type'], ProductType> = {
  print: 'POD',
  shirt: 'POD',
  sticker: 'POD',
  mug: 'POD',
  book: 'POD',
  donation: 'DONATION',
  tokens: 'MANA_TOPUP',
}

// Creates a PrintJob for one needsArt line item via the shared
// createPrintJobIfEligible helper above (re-checks print eligibility against
// the ArtImage's *current* state -- checkout.post.ts only checked this at
// session-creation time, and an image can be taken down during the window
// before payment completes, t-029's gate).
async function fulfillGiftshopPrintJob(
  tx: TransactionClient,
  orderItemId: number,
  catalogEntry: CartItem,
  rawArtImageId: string | undefined,
  userId: number,
): Promise<boolean> {
  const podEntry = POD_CATALOG[catalogEntry.id]
  const artImageId = Number(rawArtImageId)

  if (!podEntry) {
    console.error(
      `⚠️ Stripe webhook: giftshop cart line "${catalogEntry.id}" has no POD_CATALOG entry, skipping PrintJob`,
    )
    return false
  }

  if (!Number.isInteger(artImageId) || artImageId <= 0) {
    console.error(
      `⚠️ Stripe webhook: giftshop cart line "${catalogEntry.id}" missing/invalid artImageId metadata, skipping PrintJob`,
    )
    return false
  }

  return createPrintJobIfEligible(
    tx,
    {
      orderItemId,
      artImageId,
      printfulVariantId: podEntry.printfulVariantId,
      userId,
    },
    `giftshop cart line "${catalogEntry.id}"`,
  )
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
      } else if (catalogEntry.needsArt) {
        await fulfillGiftshopPrintJob(
          tx,
          item.id,
          catalogEntry,
          line.metadata?.artImageId,
          userId,
        )
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
