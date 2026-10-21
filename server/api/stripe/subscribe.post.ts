// /server/api/stripe/subscribe.post.ts
import { defineEventHandler } from 'h3'
import Stripe from 'stripe'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { isNineDollarMonthlyPatronPrice } from '~/server/utils/patronBilling'

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

// Mirrors getStripeClient()'s explicit-guard shape (digital-storefront/t-039):
// the bare `process.env.STRIPE_PRICE_ID!` non-null assertion this used to pass
// straight into `line_items` doesn't check anything at runtime, so an unset
// price id fell through to a raw Stripe "No such price: 'undefined'" API
// error instead of the app's own structured 500 every other Stripe route
// returns when its own required config is missing.
function getSubscriptionPriceId() {
  const priceId = process.env.STRIPE_PRICE_ID

  if (!priceId) {
    const error = new Error(
      'Stripe subscription price is not configured',
    ) as Error & { statusCode: number }
    error.statusCode = 500
    throw error
  }

  return priceId
}

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)

    const stripe = getStripeClient()
    const priceId = getSubscriptionPriceId()

    // Past-due, incomplete, or paused subscriptions remain attached to the
    // customer. Do not create a second recurring charge as a way to recover
    // from a failed payment: use Stripe's secure Billing Portal instead.
    if (user.stripeSubscriptionId) {
      const existing = await stripe.subscriptions.retrieve(
        user.stripeSubscriptionId,
      )
      if (
        existing.status !== 'canceled' &&
        existing.status !== 'incomplete_expired'
      ) {
        const error = new Error(
          'You already have a subscription. Use Manage Billing to update your payment method.',
        ) as Error & { statusCode: number }
        error.statusCode = 409
        throw error
      }
    }

    // The screen promises $9 USD per month. Never silently sell a different
    // amount/currency/interval just because STRIPE_PRICE_ID was misconfigured.
    const price = await stripe.prices.retrieve(priceId)
    if (!isNineDollarMonthlyPatronPrice(price)) {
      const error = new Error(
        'Patron Stripe price must be an active $9 USD monthly recurring price',
      ) as Error & { statusCode: number }
      error.statusCode = 500
      throw error
    }

    const rawBaseUrl = process.env.APP_BASE_URL || process.env.BASE_URL
    if (!rawBaseUrl) {
      const error = new Error(
        'Payment return URL is not configured',
      ) as Error & {
        statusCode: number
      }
      error.statusCode = 500
      throw error
    }
    let baseUrl: URL
    try {
      baseUrl = new URL(rawBaseUrl)
      const localDev =
        baseUrl.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(baseUrl.hostname)
      if (baseUrl.protocol !== 'https:' && !localDev)
        throw new Error('Payment return URLs must use HTTPS')
    } catch {
      const error = new Error(
        'Payment return URL must be a valid HTTPS URL',
      ) as Error & {
        statusCode: number
      }
      error.statusCode = 500
      throw error
    }

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
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: new URL(
        '/sanctuary?subscription=success',
        baseUrl,
      ).toString(),
      cancel_url: new URL(
        '/sanctuary?subscription=cancelled',
        baseUrl,
      ).toString(),
    })

    return {
      success: true,
      url: session.url,
      message: '✨ Subscription checkout initialized',
    }
  } catch (error: unknown) {
    // errorHandler takes the error itself, not a wrapper object — passing
    // { error, message, statusCode } fell through to the generic branch and,
    // because the HTTP status was never set, returned 200 on failure (audit P6
    // MEDIUM). Use the standard envelope + status wiring instead.
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
