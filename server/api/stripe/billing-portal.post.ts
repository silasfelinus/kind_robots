// /server/api/stripe/billing-portal.post.ts
// A logged-in Patron can update their payment method directly at Stripe.
// Never accept a customer ID or return URL from the browser.
import { createError, defineEventHandler } from 'h3'
import Stripe from 'stripe'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'

let stripe: Stripe | null = null

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key)
    throw createError({
      statusCode: 500,
      message: 'Stripe secret key is not configured',
    })
  stripe ??= new Stripe(key)
  return stripe
}

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    if (!user.stripeCustomerId)
      throw createError({
        statusCode: 400,
        message: 'No Stripe customer is linked to this account',
      })

    const rawUrl = process.env.APP_BASE_URL || process.env.BASE_URL
    let baseUrl: URL
    try {
      baseUrl = new URL(rawUrl || '')
      const local =
        baseUrl.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(baseUrl.hostname)
      if (baseUrl.protocol !== 'https:' && !local)
        throw new Error('HTTPS is required')
    } catch {
      throw createError({
        statusCode: 500,
        message: 'Payment return URL must be a valid HTTPS URL',
      })
    }

    const session = await getStripeClient().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: new URL('/sanctuary?billing=returned', baseUrl).toString(),
    })
    event.node.res.statusCode = 200
    return { success: true, url: session.url }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Could not open secure billing',
      statusCode,
    }
  }
})
