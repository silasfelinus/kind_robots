// utils/scripts/verifyAppAccountPrivileges.test.ts
//
// kind-robots/t-073. Regression coverage for grant parsing, scope checks, and
// credential redaction. The observed grant fixture matches the live 2026-08-27
// state after the historical global superuser grant had already been removed.
//
// No real hash appears here. The placeholder below is deliberately obvious.
//
//   npx tsx utils/scripts/verifyAppAccountPrivileges.test.ts

import assert from 'node:assert/strict'
import {
  databaseScopeIn,
  isGlobal,
  privilegesIn,
  redactGrant,
} from './verifyAppAccountPrivileges'

const FAKE_HASH = 'PLACEHOLDER-NOT-A-REAL-CREDENTIAL'

// --- redaction -------------------------------------------------------------
{
  const line = `GRANT USAGE ON *.* TO \`kindrobot\`@\`%\` IDENTIFIED BY PASSWORD '${FAKE_HASH}'`
  const out = redactGrant(line)
  assert.ok(!out.includes(FAKE_HASH), 'password hash survived redaction')
  assert.ok(
    out.includes("IDENTIFIED BY PASSWORD '<redacted>'"),
    'hash was not replaced in place',
  )
}
{
  const out = redactGrant(
    `GRANT USAGE ON *.* TO \`app\`@\`%\` IDENTIFIED BY 'hunter2'`,
  )
  assert.ok(!out.includes('hunter2'), 'plaintext password survived redaction')
}
{
  const out = redactGrant(
    `GRANT USAGE ON *.* TO \`app\`@\`%\` IDENTIFIED VIA ed25519 USING '${FAKE_HASH}'`,
  )
  assert.ok(
    !out.includes(FAKE_HASH),
    'auth-plugin credential survived redaction',
  )
}
{
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
  privilegesIn('GRANT ALL PRIVILEGES ON `kindblank_fresh`.* TO `kindrobot`@`%`'),
  ['ALL PRIVILEGES'],
)
assert.deepEqual(privilegesIn('GRANT USAGE ON *.* TO `kindrobot`@`%`'), [
  'USAGE',
])
assert.deepEqual(
  privilegesIn('GRANT SELECT (id, name), UPDATE (name) ON `db`.`t` TO `u`@`%`'),
  ['SELECT', 'UPDATE'],
)
assert.deepEqual(privilegesIn('not a grant line'), [])

// --- grant scope -----------------------------------------------------------
assert.equal(isGlobal('GRANT USAGE ON *.* TO `kindrobot`@`%`'), true)
assert.equal(
  isGlobal('GRANT ALL PRIVILEGES ON `kindblank_fresh`.* TO `kindrobot`@`%`'),
  false,
)
assert.equal(
  databaseScopeIn(
    'GRANT SELECT, INSERT ON `kindblank_fresh`.* TO `kindrobot`@`%`',
  ),
  'kindblank_fresh',
)
assert.equal(databaseScopeIn('GRANT SELECT ON kindblank_fresh.* TO `u`@`%`'), 'kindblank_fresh')
assert.equal(databaseScopeIn('GRANT USAGE ON *.* TO `u`@`%`'), null)
assert.equal(databaseScopeIn('GRANT SELECT ON `db`.`table` TO `u`@`%`'), null)

// --- live 2026-08-27 grant shape ------------------------------------------
{
  const observed = [
    `GRANT USAGE ON *.* TO \`kindrobot\`@\`%\` IDENTIFIED BY PASSWORD '${FAKE_HASH}'`,
    'GRANT ALL PRIVILEGES ON `kindrobots`.* TO `kindrobot`@`%`',
    'GRANT ALL PRIVILEGES ON `kindblank`.* TO `kindrobot`@`%`',
    'GRANT ALL PRIVILEGES ON `kindblank_fresh`.* TO `kindrobot`@`%`',
    'GRANT ALL PRIVILEGES ON `kindblank_shadow`.* TO `kindrobot`@`%`',
  ]

  assert.ok(!redactGrant(observed[0]!).includes(FAKE_HASH))
  assert.deepEqual(privilegesIn(observed[0]!), ['USAGE'])
  assert.equal(isGlobal(observed[0]!), true)

  for (const grant of observed.slice(1)) {
    assert.ok(
      privilegesIn(grant).includes('ALL PRIVILEGES'),
      `failed to flag ALL PRIVILEGES in: ${grant}`,
    )
  }

  assert.deepEqual(
    observed.slice(1).map((grant) => databaseScopeIn(grant)),
    ['kindrobots', 'kindblank', 'kindblank_fresh', 'kindblank_shadow'],
  )
}

// The intended final state is global USAGE for account existence/auth plus one
// database-wide DML grant on the live application schema.
{
  const target =
    'GRANT SELECT, INSERT, UPDATE, DELETE ON `kindblank_fresh`.* TO `kindrobot`@`%`'
  const allowed = new Set(['SELECT', 'INSERT', 'UPDATE', 'DELETE'])
  assert.ok(
    privilegesIn(target).every((p) => allowed.has(p)),
    'target grant would be rejected',
  )
  assert.equal(isGlobal(target), false)
  assert.equal(databaseScopeIn(target), 'kindblank_fresh')
}

console.log('verifyAppAccountPrivileges: all assertions passed')
