// /utils/scripts/verifyStripeWebhookFixture.test.ts
//
// Offline fixture coverage for server/api/stripe/webhook.post.ts
// (kind-economy/t-011). Runs without a Stripe account, a real
// STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET, or a reachable database --
// exactly the "worth doing FIRST" kaizen t-011's own note names, since the
// full checkout/webhook/fulfillment matrix needs live TEST-mode credentials
// this sandbox does not have.
//
// What this covers:
//   1. resolveCheckoutSessionRoute() -- the pure metadata/mode -> handler
//      routing decision the webhook's checkout.session.completed branch
//      dispatches on, including the priority order between mana_topup,
//      subscription, product_purchase, and giftshop_cart when more than one
//      condition could match.
//   2. Real Stripe signature verification (Stripe.webhooks.constructEvent +
//      generateTestHeaderString) -- this is local HMAC-SHA256 crypto, no
//      network call and no live account required, so it exercises the
//      actual auth boundary the webhook route depends on (Stripe IS the
//      caller; signature verification is the only guard).
//   3. Tamper rejection -- a payload byte-flipped after signing must fail
//      constructEvent against the original signature.
//   4. Redelivery stability -- Stripe retries a webhook by resending the
//      same event; two independently-signed deliveries of the identical
//      payload must decode to the identical checkout session id, which is
//      the idempotency key handleManaTopup/handleProductPurchase/
//      handleGiftshopCartPurchase actually key their "already fulfilled,
//      skip" guard on (refId / stripeSessionId = session.id, not event.id).
//
// What this does NOT cover (documented, not silently skipped): the actual
// Prisma reads/writes inside handleManaTopup, handleProductPurchase,
// handleGiftshopCartPurchase, handleSubscriptionCheckout, and
// handleSubscriptionLifecycle -- those need a reachable database, which
// this sandbox does not have (no vitest/jest + mocking library is installed
// either, so a mocked-Prisma-client run isn't wired up here). Also not
// covered: real Stripe API calls (checkout.sessions.listLineItems), which
// need live TEST-mode credentials. See kind-economy/t-011's roadmap note
// for what still needs Silas to supply (test keys + a reachable DB, or to
// run the matrix himself against staging).
//
// Requires a DATABASE_URL environment variable to be *set* (any well-formed
// mysql://-shaped placeholder, per scripts/provision_kind_robots_deps.sh in
// the conductor repo) -- not a *reachable* one. Importing webhook.post.ts
// transitively imports server/utils/prisma.ts, whose module-level singleton
// throws at import time if DATABASE_URL is unset at all, but never opens a
// connection for any path this file exercises. verifyManaResourceSplit.test.ts
// carries the identical constraint (it imports server/utils/mana.ts, which
// also imports prisma.ts) for the same reason.
import assert from 'node:assert/strict'
import Stripe from 'stripe'

import {
  resolveCheckoutSessionRoute,
  type CheckoutSessionRoute,
} from '../../server/api/stripe/webhook.post.js'

// --- resolveCheckoutSessionRoute -----------------------------------------

type Fixture = {
  name: string
  session: Pick<Stripe.Checkout.Session, 'metadata' | 'mode'>
  expected: CheckoutSessionRoute
}

const fixtures: Fixture[] = [
  {
    name: 'mana top-up (topup.post.ts sets metadata.kind=mana_topup, mode=payment)',
    session: { mode: 'payment', metadata: { kind: 'mana_topup' } },
    expected: 'mana_topup',
  },
  {
    name: 'supporter subscription (subscribe.post.ts sets no metadata, mode=subscription)',
    session: { mode: 'subscription', metadata: null },
    expected: 'subscription',
  },
  {
    name: 'digital-storefront product purchase (metadata.productSlug, mode=payment)',
    session: { mode: 'payment', metadata: { productSlug: 'mermaids-pdf' } },
    expected: 'product_purchase',
  },
  {
    name: 'giftshop cart checkout (metadata.kind=giftshop_checkout, mode=payment)',
    session: { mode: 'payment', metadata: { kind: 'giftshop_checkout' } },
    expected: 'giftshop_cart',
  },
  {
    name: 'payment session with neither productSlug nor a recognized kind',
    session: { mode: 'payment', metadata: {} },
    expected: 'unhandled',
  },
  {
    name: 'payment session with null metadata',
    session: { mode: 'payment', metadata: null },
    expected: 'unhandled',
  },
  {
    name: 'priority: mana_topup wins even if productSlug is also (incorrectly) present',
    session: {
      mode: 'payment',
      metadata: { kind: 'mana_topup', productSlug: 'should-be-ignored' },
    },
    expected: 'mana_topup',
  },
  {
    name: 'priority: subscription mode wins over a stray productSlug/giftshop kind',
    session: {
      mode: 'subscription',
      metadata: { productSlug: 'should-be-ignored', kind: 'giftshop_checkout' },
    },
    expected: 'subscription',
  },
]

for (const { name, session, expected } of fixtures) {
  assert.equal(
    resolveCheckoutSessionRoute(session),
    expected,
    `routing mismatch for: ${name}`,
  )
}

console.log(
  `✅ resolveCheckoutSessionRoute: all ${fixtures.length} routing fixtures resolve to the expected handler`,
)

// --- Signature verification + tamper rejection ---------------------------

const TEST_WEBHOOK_SECRET = 'whsec_offline_fixture_secret_do_not_use_live'

function buildCheckoutCompletedPayload(overrides: {
  eventId: string
  sessionId: string
  metadata: Record<string, string>
  mode?: 'payment' | 'subscription'
}) {
  return JSON.stringify({
    id: overrides.eventId,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: overrides.sessionId,
        object: 'checkout.session',
        mode: overrides.mode ?? 'payment',
        metadata: overrides.metadata,
        amount_total: 500,
        customer: 'cus_offline_fixture',
      },
    },
  })
}

const payload = buildCheckoutCompletedPayload({
  eventId: 'evt_offline_fixture_1',
  sessionId: 'cs_offline_fixture_1',
  metadata: { kind: 'mana_topup', userId: '42', manaAmount: '500' },
})

const header = Stripe.webhooks.generateTestHeaderString({
  payload,
  secret: TEST_WEBHOOK_SECRET,
})

const verified = Stripe.webhooks.constructEvent(
  payload,
  header,
  TEST_WEBHOOK_SECRET,
)
assert.equal(verified.type, 'checkout.session.completed')
assert.equal(verified.id, 'evt_offline_fixture_1')
assert.equal(
  (verified.data.object as Stripe.Checkout.Session).id,
  'cs_offline_fixture_1',
)
assert.equal(
  resolveCheckoutSessionRoute(verified.data.object as Stripe.Checkout.Session),
  'mana_topup',
  'a real signed-and-verified event must still route the same way as the raw fixture',
)
console.log(
  '✅ Stripe.webhooks.constructEvent verifies a correctly-signed payload and round-trips its routing',
)

// Wrong secret (e.g. a stale/misconfigured STRIPE_WEBHOOK_SECRET) must be rejected.
assert.throws(
  () => Stripe.webhooks.constructEvent(payload, header, 'whsec_wrong_secret'),
  /signature/i,
  'verification against the wrong webhook secret must fail',
)

// A byte-tampered payload (same signature, different body) must be rejected --
// this is the actual authenticity guarantee the webhook route relies on.
const tamperedPayload = payload.replace(
  '"manaAmount":"500"',
  '"manaAmount":"999999"',
)
assert.notEqual(tamperedPayload, payload)
assert.throws(
  () =>
    Stripe.webhooks.constructEvent(
      tamperedPayload,
      header,
      TEST_WEBHOOK_SECRET,
    ),
  /signature/i,
  'a tampered payload must fail signature verification against the original header',
)
console.log(
  '✅ Stripe.webhooks.constructEvent rejects a wrong secret and a tampered payload',
)

// --- Redelivery stability (idempotency key) -------------------------------

// Stripe retries a webhook delivery by resending the identical event payload.
// Two independently-generated signatures (each call mints a fresh timestamp)
// for the SAME payload must both verify, and must decode to the SAME
// checkout session id -- that id is what handleManaTopup/handleProductPurchase/
// handleGiftshopCartPurchase key their "already fulfilled, skip" idempotency
// guard on (ManaTransaction.refId / Order.stripeSessionId = session.id).
const redeliveryPayload = buildCheckoutCompletedPayload({
  eventId: 'evt_offline_fixture_redelivery',
  sessionId: 'cs_offline_fixture_redelivery',
  metadata: { productSlug: 'mermaids-pdf', userId: '7' },
})

const firstDeliveryHeader = Stripe.webhooks.generateTestHeaderString({
  payload: redeliveryPayload,
  secret: TEST_WEBHOOK_SECRET,
})
const secondDeliveryHeader = Stripe.webhooks.generateTestHeaderString({
  payload: redeliveryPayload,
  secret: TEST_WEBHOOK_SECRET,
})

const firstEvent = Stripe.webhooks.constructEvent(
  redeliveryPayload,
  firstDeliveryHeader,
  TEST_WEBHOOK_SECRET,
)
const secondEvent = Stripe.webhooks.constructEvent(
  redeliveryPayload,
  secondDeliveryHeader,
  TEST_WEBHOOK_SECRET,
)

const firstSession = firstEvent.data.object as Stripe.Checkout.Session
const secondSession = secondEvent.data.object as Stripe.Checkout.Session

assert.equal(
  firstEvent.id,
  secondEvent.id,
  'redelivery must carry the same event id',
)
assert.equal(
  firstSession.id,
  secondSession.id,
  'redelivery must decode to the same checkout session id -- the idempotency key the handlers actually check',
)
assert.equal(
  resolveCheckoutSessionRoute(firstSession),
  resolveCheckoutSessionRoute(secondSession),
  'redelivery must route identically both times',
)
console.log(
  '✅ redelivered signatures for the same payload verify independently but decode to the same session id -- the idempotency guard has a stable key to check',
)

console.log('✅ verifyStripeWebhookFixture: all assertions passed')
