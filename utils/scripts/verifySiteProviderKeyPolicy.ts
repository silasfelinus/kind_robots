// /utils/scripts/verifySiteProviderKeyPolicy.ts
//
// Regression guard for the 2026-09-04 provider-credit leak: a request whose
// mana charge was waived because it claimed its own resource (`useOwnResource`
// with no key, or a public non-official Server saved without one) must never
// fall through to the SITE's Anthropic/OpenAI key. Covers the two pure,
// DB-free pieces every cloud text route now goes through:
//   - siteKeyAllowedForFreeReason (server/utils/siteProviderKeyPolicy.ts),
//     the policy manaGate.ts evaluates into `gate.siteKeyAllowed`
//   - resolveGatedProviderKey (server/utils/textProviderService.ts), the
//     precedence resolver the routes call instead of resolveApiKeyPrecedence
import assert from 'node:assert/strict'
import { siteKeyAllowedForFreeReason } from '../../server/utils/siteProviderKeyPolicy'
import { resolveGatedProviderKey } from '../../server/utils/textProviderService'

let failures = 0

function check(label: string, fn: () => void): void {
  try {
    fn()
    console.log(`ok - ${label}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL - ${label}`)
    console.error(error instanceof Error ? error.message : error)
  }
}

function statusOf(fn: () => unknown): number | null {
  try {
    fn()
    return null
  } catch (error) {
    return (error as { statusCode?: number }).statusCode ?? -1
  }
}

// -- siteKeyAllowedForFreeReason --------------------------------------------

check('a paid request (no free reason) may use the site key', () => {
  assert.equal(siteKeyAllowedForFreeReason(null), true)
})

check('admin, server-key, FAMILY, and internal kind-free keep site-key access', () => {
  for (const reason of ['admin', 'server-key', 'family', 'kind-free'] as const) {
    assert.equal(siteKeyAllowedForFreeReason(reason), true, reason)
  }
})

check('own-resource and free-server waivers do NOT unlock the site key', () => {
  assert.equal(siteKeyAllowedForFreeReason('own-resource'), false)
  assert.equal(siteKeyAllowedForFreeReason('free-server'), false)
})

// -- resolveGatedProviderKey ------------------------------------------------

check('user key wins regardless of gating', () => {
  assert.equal(
    resolveGatedProviderKey({
      siteKeyAllowed: false,
      userApiKey: ' sk-user ',
      serverApiKey: 'sk-server',
      runtimeApiKey: 'sk-site',
      providerLabel: 'Anthropic',
    }),
    'sk-user',
  )
})

check('stored Server key is the caller\'s own resource and is always usable', () => {
  assert.equal(
    resolveGatedProviderKey({
      siteKeyAllowed: false,
      serverApiKey: 'sk-server',
      runtimeApiKey: 'sk-site',
      providerLabel: 'OpenAI',
    }),
    'sk-server',
  )
})

check('site key backs a request the gate allowed', () => {
  assert.equal(
    resolveGatedProviderKey({
      siteKeyAllowed: true,
      runtimeApiKey: 'sk-site',
      providerLabel: 'Anthropic',
    }),
    'sk-site',
  )
})

check('the leak: own-resource request with no key of its own is refused with 402', () => {
  assert.equal(
    statusOf(() =>
      resolveGatedProviderKey({
        siteKeyAllowed: false,
        userApiKey: '',
        serverApiKey: null,
        runtimeApiKey: 'sk-site',
        providerLabel: 'Anthropic',
      }),
    ),
    402,
  )
})

check('refusal message tells the caller how to proceed', () => {
  try {
    resolveGatedProviderKey({
      siteKeyAllowed: false,
      runtimeApiKey: 'sk-site',
      providerLabel: 'OpenAI',
    })
    assert.fail('expected a throw')
  } catch (error) {
    const message = String((error as { message?: string }).message)
    assert.match(message, /OpenAI/)
    assert.match(message, /userApiKey/)
    assert.match(message, /useOwnResource/)
  }
})

check('no key anywhere resolves to "" for the route\'s own assertProviderApiKey', () => {
  assert.equal(
    resolveGatedProviderKey({
      siteKeyAllowed: false,
      runtimeApiKey: '',
      providerLabel: 'Anthropic',
    }),
    '',
  )
  assert.equal(
    resolveGatedProviderKey({
      siteKeyAllowed: true,
      providerLabel: 'Anthropic',
    }),
    '',
  )
})

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}

console.log('\nsite provider key policy: all checks passed')
