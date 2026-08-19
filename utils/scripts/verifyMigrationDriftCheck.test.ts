// /utils/scripts/verifyMigrationDriftCheck.test.ts
//
// Self-test for verifyMigrationDriftCheck.ts. The behavioural half runs the
// real comparison against real inputs, so it is exercised directly; the plugin
// checker is fed a would-block-boot fixture to prove it actually catches the
// regression it exists for, rather than passing on anything.
import assert from 'node:assert/strict'

import {
  checkDriftBehaviour,
  checkPluginCannotBlockBoot,
} from './verifyMigrationDriftCheck.js'

const PLUGIN_SAFE = `
export default defineNitroPlugin(() => {
  void (async () => {
    let onDisk
    try {
      onDisk = migrationsOnDisk()
    } catch (error) {
      console.warn('[migration-drift] skipping', error)
      return
    }
    let applied
    try {
      applied = await appliedMigrations()
    } catch (error) {
      console.warn('[migration-drift] skipping', error)
      return
    }
    console.error('[migration-drift]', describeMigrationDrift(compareMigrations(onDisk, applied)))
  })()
})
`

// The tempting version: fail fast so nobody can miss it. It also means a
// pending migration takes the whole site down instead of the routes that
// touch the new columns.
const PLUGIN_THROWS = PLUGIN_SAFE.replace(
  "console.error('[migration-drift]',",
  "throw new Error('pending migrations: ' + String(",
)

// Both guards removed: a fresh database with no _prisma_migrations table
// would take an unhandled rejection through boot.
const PLUGIN_UNGUARDED = `
export default defineNitroPlugin(() => {
  void (async () => {
    const onDisk = migrationsOnDisk()
    const applied = await appliedMigrations()
    console.error('[migration-drift]', compareMigrations(onDisk, applied))
  })()
})
`

function run(): void {
  const behaviourErrors = checkDriftBehaviour()
  assert.deepEqual(
    behaviourErrors,
    [],
    `drift comparison misbehaved: ${behaviourErrors.join('; ')}`,
  )

  assert.deepEqual(
    checkPluginCannotBlockBoot(PLUGIN_SAFE),
    [],
    'the warn-only plugin shape must pass',
  )

  const throwErrors = checkPluginCannotBlockBoot(PLUGIN_THROWS)
  assert.ok(
    throwErrors.some((e) => /throws/.test(e)),
    'a plugin that throws on drift must be rejected',
  )

  const unguardedErrors = checkPluginCannotBlockBoot(PLUGIN_UNGUARDED)
  assert.ok(
    unguardedErrors.some((e) => /no longer guards both/.test(e)),
    'a plugin with no try/catch around either read must be rejected',
  )

  // The credential-lane check must actually fire on a real read, not merely on
  // a plugin that happens to mention the variable in a comment.
  const elevatedErrors = checkPluginCannotBlockBoot(
    PLUGIN_SAFE.replace(
      'let onDisk',
      'const url = process.env.MIGRATION_DATABASE_URL\n    let onDisk',
    ),
  )
  assert.ok(
    elevatedErrors.some((e) => /reads MIGRATION_DATABASE_URL/.test(e)),
    'a plugin reaching for the elevated migration credential must be rejected',
  )
  assert.deepEqual(
    checkPluginCannotBlockBoot(
      `${PLUGIN_SAFE}\n// MIGRATION_DATABASE_URL is deliberately not read here.`,
    ),
    [],
    'naming the credential in a comment must stay allowed',
  )

  console.log(
    'Migration drift check self-test passed: the real comparison behaves, ' +
      'the warn-only plugin shape passes, and both the throws-on-drift and ' +
      'unguarded-reads regressions are caught.',
  )
}

run()
