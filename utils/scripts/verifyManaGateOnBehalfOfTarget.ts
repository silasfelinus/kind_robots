// /utils/scripts/verifyManaGateOnBehalfOfTarget.ts
//
// Regression guard for kind-robots/t-043 (server/api/economy/mana/charge.post.ts,
// pitches/2026-07-21-sketchy-cross-app-mana-charge-endpoint.md): the on-behalf-of
// mana-charge authorization boundary must reject any caller that is not a
// server key from redirecting a charge onto a different user's balance. This
// is the entire security property the trusted-caller endpoint depends on, so
// it gets a direct DB-free test against the real exported function rather
// than only integration coverage.
import assert from 'node:assert/strict'
import { resolveManaGateTarget } from '../../server/utils/manaGateTarget'

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

check(
  'same-user charge is always allowed, regardless of server-key status',
  () => {
    assert.deepEqual(
      resolveManaGateTarget({
        callerUserId: 5,
        isServerKey: false,
        targetUserId: 5,
      }),
      { userId: 5, onBehalfOfOtherUser: false },
    )
  },
)

check(
  'no targetUserId resolves to the caller, regardless of server-key status',
  () => {
    assert.deepEqual(
      resolveManaGateTarget({ callerUserId: 5, isServerKey: false }),
      {
        userId: 5,
        onBehalfOfOtherUser: false,
      },
    )
  },
)

check('a non-server-key caller cannot charge a different user', () => {
  assert.throws(
    () =>
      resolveManaGateTarget({
        callerUserId: 5,
        isServerKey: false,
        targetUserId: 9,
      }),
    (error: unknown) =>
      error instanceof Error &&
      (error as { statusCode?: number }).statusCode === 403,
  )
})

check('a server-key caller CAN charge a different user', () => {
  assert.deepEqual(
    resolveManaGateTarget({
      callerUserId: 1,
      isServerKey: true,
      targetUserId: 9,
    }),
    { userId: 9, onBehalfOfOtherUser: true },
  )
})

check(
  'a server-key caller charging its own id is not flagged on-behalf-of',
  () => {
    assert.deepEqual(
      resolveManaGateTarget({
        callerUserId: 1,
        isServerKey: true,
        targetUserId: 1,
      }),
      { userId: 1, onBehalfOfOtherUser: false },
    )
  },
)

if (failures > 0) {
  console.error(`\n${failures} failure(s).`)
  process.exitCode = 1
} else {
  console.log('\nAll mana-gate on-behalf-of target self-tests passed.')
}
