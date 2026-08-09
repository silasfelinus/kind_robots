// /server/utils/podVendorClient.ts
//
// Vendor-agnostic print-on-demand submission client (digital-storefront/t-040,
// splitting the "reversible integration/test plumbing" half of the task from
// the account-creation/credentials half, which stays needs-human).
//
// Printful was the provider decision (digital-storefront/t-015,
// projects/digital-storefront/research/pod-provider.md) but no account or
// API key has been provisioned yet. This module is structurally inert until
// PRINTFUL_API_KEY is set in the environment: submitPodOrder() throws a
// clear "not configured" error rather than attempting any network call, so
// wiring it into a caller (e.g. the Stripe webhook's PrintJob creation) is
// safe to land now and self-activates the moment Silas adds the key.
//
// Env vars this expects once an account exists (documented here since the
// repo has no .env.example to add them to):
//   PRINTFUL_API_KEY   - Printful Private Token / OAuth2 Bearer token
//   PRINTFUL_STORE_ID  - Printful store id the Sync-Order API call targets
import { createError } from 'h3'
import type { PrintJobStatus } from '~/prisma/generated/prisma/client'

export class PodVendorNotConfiguredError extends Error {
  constructor() {
    super(
      'Printful is not configured (PRINTFUL_API_KEY missing) -- ' +
        'digital-storefront/t-040 remains needs-human until Silas ' +
        'provisions a vendor account.',
    )
    this.name = 'PodVendorNotConfiguredError'
  }
}

export class PodVendorInvalidVariantError extends Error {
  constructor(printfulVariantId: string) {
    super(
      `refusing to submit a PrintJob with placeholder variant id ` +
        `"${printfulVariantId}" -- podCatalog.ts's ids are not real ` +
        `Printful catalog ids yet (digital-storefront/t-015)`,
    )
    this.name = 'PodVendorInvalidVariantError'
  }
}

export interface PodOrderRequest {
  printfulVariantId: string
  quantity: number
  recipientName: string
  addressLine1: string
  addressLine2?: string
  city: string
  stateCode?: string
  countryCode: string
  zip: string
  imageUrl: string
}

export interface PodOrderResult {
  printfulOrderId: string
  status: PrintJobStatus
}

// Any podCatalog.ts / test fixture id that hasn't been replaced with a real
// Printful catalog variant id yet.
export function isPlaceholderVariantId(printfulVariantId: string): boolean {
  return printfulVariantId.startsWith('PLACEHOLDER_')
}

// Maps a Printful Sync-Order `status` value onto our PrintJobStatus enum.
// Printful's real status vocabulary (draft/pending/inprocess/onhold/partial/
// fulfilled/canceled/failed) per their Orders API docs. Exported standalone
// so the mapping itself is testable without a live call.
export function mapPrintfulStatus(printfulStatus: string): PrintJobStatus {
  switch (printfulStatus) {
    case 'pending':
    case 'draft':
      return 'SUBMITTED'
    case 'inprocess':
    case 'onhold':
    case 'partial':
      return 'IN_PRODUCTION'
    case 'fulfilled':
      return 'SHIPPED'
    case 'canceled':
    case 'failed':
      return 'FAILED'
    default:
      // Unknown status from the vendor: don't guess at SHIPPED/FAILED,
      // leave the job exactly where it already is (caller keeps existing
      // status when this branch is hit -- see submitPodOrder's caller
      // contract in the webhook wiring this unblocks).
      return 'SUBMITTED'
  }
}

function isConfigured(): boolean {
  return Boolean(process.env.PRINTFUL_API_KEY)
}

// Submits a PrintJob to Printful's Sync-Order create endpoint. Throws
// PodVendorNotConfiguredError if no API key is set (always true in this
// sandbox/session) and PodVendorInvalidVariantError if the caller passes a
// still-placeholder variant id -- both fail loudly before any network call
// rather than silently no-op, so a caller can't accidentally treat "did
// nothing" as "succeeded."
export async function submitPodOrder(
  request: PodOrderRequest,
): Promise<PodOrderResult> {
  if (isPlaceholderVariantId(request.printfulVariantId)) {
    throw new PodVendorInvalidVariantError(request.printfulVariantId)
  }
  if (!isConfigured()) {
    throw new PodVendorNotConfiguredError()
  }

  const storeId = process.env.PRINTFUL_STORE_ID
  const response = await fetch('https://api.printful.com/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
      ...(storeId ? { 'X-PF-Store-Id': storeId } : {}),
    },
    body: JSON.stringify({
      recipient: {
        name: request.recipientName,
        address1: request.addressLine1,
        address2: request.addressLine2,
        city: request.city,
        state_code: request.stateCode,
        country_code: request.countryCode,
        zip: request.zip,
      },
      items: [
        {
          sync_variant_id: request.printfulVariantId,
          quantity: request.quantity,
          files: [{ url: request.imageUrl }],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Printful order submission failed: HTTP ${response.status}`,
    })
  }

  const body = (await response.json()) as {
    result: { id: number; status: string }
  }

  return {
    printfulOrderId: String(body.result.id),
    status: mapPrintfulStatus(body.result.status),
  }
}

// True when submitPodOrder() would actually attempt a live call -- callers
// (e.g. the webhook's PrintJob creation) use this to decide whether to try
// submission at all, so an unconfigured environment stays a silent no-op
// (today's behavior) instead of throwing on every checkout.
export function isPodVendorConfigured(): boolean {
  return isConfigured()
}
