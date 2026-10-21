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

export function paidPatronInvoiceSubscriptionId(invoice: unknown): string | null {
  if (!invoice || typeof invoice !== 'object') return null

  const row = invoice as PatronInvoiceSnapshot
  if (row.status !== 'paid') return null
  if (!Number.isSafeInteger(row.amount_paid) || (row.amount_paid ?? 0) <= 0)
    return null
  if (
    row.billing_reason !== 'subscription_create' &&
    row.billing_reason !== 'subscription_cycle'
  )
    return null

  const sub =
    row.parent?.subscription_details?.subscription ?? row.subscription

  if (typeof sub === 'string') return sub.startsWith('sub_') ? sub : null
  if (sub && typeof sub.id === 'string' && sub.id.startsWith('sub_'))
    return sub.id
  return null
}

export function checkoutHasPaidSubscription(
  session: { mode?: string | null; payment_status?: string | null },
): boolean {
  return session.mode === 'subscription' && session.payment_status === 'paid'
}
