// utils/scripts/verifyAppAccountPrivileges.test.ts
//
// kind-robots/t-073. The redaction is the part that must not be wrong, so it is
// tested against the real SHAPES of the grants this account actually holds.
//
// No real hash appears here. The placeholder below is deliberately obvious --
// the point of the redactor is that a hash never reaches a log, and a test that
// embedded one to prove that would defeat itself.
//
//   npx tsx utils/scripts/verifyAppAccountPrivileges.test.ts

import assert from 'node:assert/strict'
import {
  isGlobal,
  privilegesIn,
  redactGrant,
} from './verifyAppAccountPrivileges'

// Deliberately NOT hash-shaped. The redactor matches whatever sits inside the
// quotes, so the test proves just as much with a string no scanner or reader
// could ever mistake for a real credential.
const FAKE_HASH = 'PLACEHOLDER-NOT-A-REAL-CREDENTIAL'

// --- redaction -------------------------------------------------------------
{
  const line = `GRANT ALL PRIVILEGES ON *.* TO \`kindrobot\`@\`%\` IDENTIFIED BY PASSWORD '${FAKE_HASH}' WITH GRANT OPTION`
  const out = redactGrant(line)
  assert.ok(!out.includes(FAKE_HASH), 'password hash survived redaction')
  assert.ok(
    out.includes("IDENTIFIED BY PASSWORD '<redacted>'"),
    'hash was not replaced in place',
  )
  assert.ok(
    out.includes('WITH GRANT OPTION'),
    'redaction destroyed the part we need to read',
  )
  assert.ok(
    out.includes('ALL PRIVILEGES'),
    'redaction destroyed the privilege list',
  )
}
{
  // Plaintext form, which some servers return.
  const out = redactGrant(
    `GRANT USAGE ON *.* TO \`app\`@\`%\` IDENTIFIED BY 'hunter2'`,
  )
  assert.ok(!out.includes('hunter2'), 'plaintext password survived redaction')
}
{
  // MariaDB's auth-plugin form.
  const out = redactGrant(
    `GRANT USAGE ON *.* TO \`app\`@\`%\` IDENTIFIED VIA ed25519 USING '${FAKE_HASH}'`,
  )
  assert.ok(
    !out.includes(FAKE_HASH),
    'auth-plugin credential survived redaction',
  )
}
{
  // A grant with no credential material must pass through untouched.
  const line =
    'GRANT SELECT, INSERT, UPDATE, DELETE ON `kindblank_fresh`.* TO `kindrobot`@`%`'
  assert.equal(
    redactGrant(line),
    line,
    'redactor altered a credential-free grant',
  )
}

// --- privilege parsing -----------------------------------------------------
assert.deepEqual(
  privilegesIn(
    'GRANT SELECT, INSERT, UPDATE, DELETE ON `kindblank_fresh`.* TO `kindrobot`@`%`',
  ),
  ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
)
assert.deepEqual(
  privilegesIn('GRANT ALL PRIVILEGES ON *.* TO `kindrobot`@`%`'),
  ['ALL PRIVILEGES'],
)
assert.deepEqual(privilegesIn('GRANT USAGE ON *.* TO `kindrobot`@`%`'), [
  'USAGE',
])
// Column-scoped grants carry a parenthesised column list that is not a privilege.
assert.deepEqual(
  privilegesIn('GRANT SELECT (id, name), UPDATE (name) ON `db`.`t` TO `u`@`%`'),
  ['SELECT', 'UPDATE'],
)
assert.deepEqual(privilegesIn('not a grant line'), [])

// --- global vs database scope ----------------------------------------------
assert.equal(isGlobal('GRANT ALL PRIVILEGES ON *.* TO `kindrobot`@`%`'), true)
assert.equal(
  isGlobal('GRANT ALL PRIVILEGES ON `kindblank_fresh`.* TO `kindrobot`@`%`'),
  false,
)
assert.equal(isGlobal('GRANT SELECT ON `db`.`table` TO `u`@`%`'), false)

// --- the five grants t-073 actually found, as a whole ----------------------
// If the narrowing lands, every one of these must stop matching.
{
  const observed = [
    `GRANT ALL PRIVILEGES ON *.* TO \`kindrobot\`@\`%\` IDENTIFIED BY PASSWORD '${FAKE_HASH}' WITH GRANT OPTION`,
    'GRANT ALL PRIVILEGES ON `kindrobots`.* TO `kindrobot`@`%`',
    'GRANT ALL PRIVILEGES ON `kindblank`.* TO `kindrobot`@`%`',
    'GRANT ALL PRIVILEGES ON `kindblank_fresh`.* TO `kindrobot`@`%`',
    'GRANT ALL PRIVILEGES ON `kindblank_shadow`.* TO `kindrobot`@`%`',
  ]
  for (const grant of observed) {
    assert.ok(
      !redactGrant(grant).includes(FAKE_HASH),
      'a hash reached the output',
    )
    assert.ok(
      privilegesIn(grant).includes('ALL PRIVILEGES'),
      `failed to flag ALL PRIVILEGES in: ${grant}`,
    )
  }
  // And the target state passes.
  const target =
    'GRANT SELECT, INSERT, UPDATE, DELETE ON `kindblank_fresh`.* TO `kindrobot`@`%`'
  const allowed = new Set(['SELECT', 'INSERT', 'UPDATE', 'DELETE'])
  assert.ok(
    privilegesIn(target).every((p) => allowed.has(p)),
    'target grant would be rejected',
  )
  assert.equal(isGlobal(target), false)
}

console.log('verifyAppAccountPrivileges: all assertions passed')
