// /server/utils/patronBilling.ts
//
// Pure Stripe invoice eligibility checks for the $5/month Patron plan.
// Do not grant tokens from checkout redirects, subscription status events,
// zero-dollar invoices or non-recurring invoices: only a paid initial or
// monthly renewal invoice can earn the 1,000-token entitlement.
export const PATRON_MONTHLY_TOKENS = 1000

type StripeSubscriptionReference = string | { id?: string } | null

type PatronInvoiceSnapshot = {
  status?: string | null
  amount_paid?: number | null
  billing_reason?: string | null
  // Modern Stripe Invoice: parent.subscription_details.subscription.
  parent?: {
    subscription_details?: {
      subscription?: StripeSubscriptionReference
    } | null
  } | null
  // Older Stripe API versions include Invoice.subscription at top level.
  subscription?: StripeSubscriptionReference
}

export function paidPatronInvoiceSubscriptionId(
  invoice: unknown,
): string | null {
  if (!invoice || typeof invoice !== 'object') return null

  const row = invoice as PatronInvoiceSnapshot
  if (row.status !== 'paid') return null
  if (
    typeof row.amount_paid !== 'number' ||
    !Number.isSafeInteger(row.amount_paid) ||
    row.amount_paid <= 0
  )
    return null
  if (
    row.billing_reason !== 'subscription_create' &&
    row.billing_reason !== 'subscription_cycle'
  )
    return null

  const sub = row.parent?.subscription_details?.subscription ?? row.subscription

  if (typeof sub === 'string') return sub.startsWith('sub_') ? sub : null
  if (sub && typeof sub.id === 'string' && sub.id.startsWith('sub_'))
    return sub.id
  return null
}

export function checkoutHasPaidSubscription(session: {
  mode?: string | null
  payment_status?: string | null
}): boolean {
  return session.mode === 'subscription' && session.payment_status === 'paid'
}

export function isFiveDollarMonthlyPatronPrice(price: {
  active?: boolean
  currency?: string
  unit_amount?: number | null
  recurring?: { interval?: string; interval_count?: number } | null
}): boolean {
  return (
    price.active === true &&
    price.currency === 'usd' &&
    price.unit_amount === 500 &&
    price.recurring?.interval === 'month' &&
    price.recurring?.interval_count === 1
  )
}

/**
 * Stripe's modern Subscription objects put current_period_end on line items,
 * while older snapshots carried it at subscription level. Keep the date
 * tied to the configured Patron price rather than a different invoice line.
 */
export function patronPeriodEnd(
  subscription: {
    current_period_end?: number | null
    items?: {
      data?: Array<{
        price?: { id?: string }
        current_period_end?: number | null
      }>
    }
  },
  patronPriceId: string,
): Date | null {
  const item = subscription.items?.data?.find(
    (candidate) => candidate.price?.id === patronPriceId,
  )
  const seconds = item?.current_period_end ?? subscription.current_period_end
  if (
    typeof seconds !== 'number' ||
    !Number.isSafeInteger(seconds) ||
    seconds <= 0
  )
    return null
  return new Date(seconds * 1000)
}
