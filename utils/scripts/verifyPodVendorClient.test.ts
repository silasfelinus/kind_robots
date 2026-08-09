// /utils/scripts/verifyPodVendorClient.test.ts
//
// Self-test for server/utils/podVendorClient.ts (digital-storefront/t-040).
// No network access, no DB, no env vars set -- exercises the pure status
// mapping plus the two guarded-throw paths (placeholder variant id,
// unconfigured vendor) that keep submitPodOrder() structurally incapable of
// a live call until Silas provisions PRINTFUL_API_KEY.
import assert from 'node:assert/strict'

import {
  isPlaceholderVariantId,
  mapPrintfulStatus,
  isPodVendorConfigured,
  submitPodOrder,
  PodVendorNotConfiguredError,
  PodVendorInvalidVariantError,
} from '../../server/utils/podVendorClient'

// -- isPlaceholderVariantId --------------------------------------------
assert.equal(isPlaceholderVariantId('PLACEHOLDER_STICKER'), true)
assert.equal(isPlaceholderVariantId('12345'), false)

// -- mapPrintfulStatus ---------------------------------------------------
assert.equal(mapPrintfulStatus('draft'), 'SUBMITTED')
assert.equal(mapPrintfulStatus('pending'), 'SUBMITTED')
assert.equal(mapPrintfulStatus('inprocess'), 'IN_PRODUCTION')
assert.equal(mapPrintfulStatus('onhold'), 'IN_PRODUCTION')
assert.equal(mapPrintfulStatus('partial'), 'IN_PRODUCTION')
assert.equal(mapPrintfulStatus('fulfilled'), 'SHIPPED')
assert.equal(mapPrintfulStatus('canceled'), 'FAILED')
assert.equal(mapPrintfulStatus('failed'), 'FAILED')
// Unknown vendor status: don't guess terminal states.
assert.equal(mapPrintfulStatus('some_future_status'), 'SUBMITTED')

// -- isPodVendorConfigured / submitPodOrder guards -----------------------
// This process never has PRINTFUL_API_KEY set in CI or this sandbox, so the
// "not configured" branch is the real, always-exercised path.
assert.equal(process.env.PRINTFUL_API_KEY, undefined)
assert.equal(isPodVendorConfigured(), false)

const baseRequest = {
  printfulVariantId: 'PLACEHOLDER_STICKER',
  quantity: 1,
  recipientName: 'Test Recipient',
  addressLine1: '1 Test St',
  city: 'Testville',
  countryCode: 'US',
  zip: '00000',
  imageUrl: 'https://example.com/kr-logo.png',
}

await assert.rejects(
  () => submitPodOrder(baseRequest),
  PodVendorInvalidVariantError,
  'expected a placeholder variant id to be rejected before checking configuration',
)

await assert.rejects(
  () => submitPodOrder({ ...baseRequest, printfulVariantId: '98765' }),
  PodVendorNotConfiguredError,
  'expected an unconfigured vendor (no PRINTFUL_API_KEY) to throw rather than attempt a live call',
)

console.log(
  'POD vendor client verified: status mapping is correct for every known ' +
    'Printful status plus an unknown-status fallback, and submitPodOrder() ' +
    'refuses placeholder variant ids and unconfigured credentials before ' +
    'any network call -- structurally inert until PRINTFUL_API_KEY is set.',
)
