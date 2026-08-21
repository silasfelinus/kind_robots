// /utils/scripts/verifyMigrationDriftCheck.ts
//
// Contract for the boot-time migration drift check.
//
// 2026-08-19: PR #1956 added `User.tokens` (migration
// 20260819120000_split_mana_tokens_resource). The Alexandria container was
// updated to the new image; the migration was never run against the database.
// The first symptom was a raw Prisma error in a user-facing response --
// "The column `User.tokens` does not exist in the current database" -- and
// nothing in the app had noticed the mismatch at boot, when it was already
// knowable.
//
// CI cannot catch that class at all: every migration check in .github/workflows
// is structural and none of them connect to a production database. So this
// contract holds the runtime check to the two properties that make it useful:
//
//   1. It computes drift correctly (behavioural, real inputs).
//   2. It cannot take the site down. A boot check that throws on pending
//      migrations turns a partial outage into a total one, during a deploy.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  compareMigrations,
  describeMigrationDrift,
  hasMigrationDrift,
} from '../../server/utils/migrationDrift'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const PLUGIN_PATH = join(
  repositoryRoot,
  'server/plugins/01-migration-drift-check.ts',
)

function applied(name: string, overrides = {}) {
  return {
    migration_name: name,
    finished_at: new Date('2026-08-19T00:00:00Z'),
    rolled_back_at: null,
    ...overrides,
  }
}

export function checkDriftBehaviour(): string[] {
  const errors: string[] = []

  const check = (label: string, run: () => void): void => {
    try {
      run()
    } catch (error) {
      errors.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  check('the real incident is detected', () => {
    // The exact shape of 2026-08-19: the build carries the token-split
    // migration, the database stops one migration earlier.
    const report = compareMigrations(
      [
        '20260818190000_add_brainstorm_output_domain',
        '20260819120000_split_mana_tokens_resource',
      ],
      [applied('20260818190000_add_brainstorm_output_domain')],
    )
    assert.deepEqual(report.pending, [
      '20260819120000_split_mana_tokens_resource',
    ])
    assert.equal(hasMigrationDrift(report), true)
  })

  check('a fully migrated database is quiet', () => {
    const report = compareMigrations(
      ['20260818190000_a', '20260819120000_b'],
      [applied('20260818190000_a'), applied('20260819120000_b')],
    )
    assert.deepEqual(report, { pending: [], failed: [], ahead: [] })
    assert.equal(hasMigrationDrift(report), false)
  })

  check('a started-but-unfinished migration is not counted as applied', () => {
    // Prisma leaves the row behind with finished_at NULL. Treating that as
    // applied is how a half-run migration reads as a healthy deploy.
    const report = compareMigrations(
      ['20260819120000_b'],
      [applied('20260819120000_b', { finished_at: null })],
    )
    assert.deepEqual(report.pending, ['20260819120000_b'])
    assert.deepEqual(report.failed, ['20260819120000_b'])
    assert.equal(hasMigrationDrift(report), true)
  })

  check('a rolled-back migration is not counted as applied', () => {
    const report = compareMigrations(
      ['20260819120000_b'],
      [
        applied('20260819120000_b', {
          rolled_back_at: new Date('2026-08-19T01:00:00Z'),
        }),
      ],
    )
    assert.deepEqual(report.pending, ['20260819120000_b'])
    assert.deepEqual(report.failed, ['20260819120000_b'])
  })

  check('a later successful retry clears an older failed attempt', () => {
    // Prisma stores retry attempts as separate rows with the same name. The
    // Alexandria database has several old rolled-back rows followed by a later
    // successful row; those recovered migrations must not keep warning forever.
    const report = compareMigrations(
      ['20260819120000_b'],
      [
        applied('20260819120000_b', {
          finished_at: null,
          rolled_back_at: new Date('2026-08-19T00:30:00Z'),
        }),
        applied('20260819120000_b'),
      ],
    )
    assert.deepEqual(report.pending, [])
    assert.deepEqual(report.failed, [])
    assert.equal(hasMigrationDrift(report), false)
  })

  check('a database ahead of the build is reported separately', () => {
    // Rollback shape: the schema has moved on, this image has not. Queries
    // still work, so it must not read as the dangerous direction.
    const report = compareMigrations(
      ['20260818190000_a'],
      [applied('20260818190000_a'), applied('20260819120000_b')],
    )
    assert.deepEqual(report.pending, [])
    assert.deepEqual(report.ahead, ['20260819120000_b'])
    assert.equal(
      hasMigrationDrift(report),
      false,
      'being behind the database is not a runtime hazard and must not read as one',
    )
  })

  check('pre-squash migration history is not reported as database-ahead drift', () => {
    const report = compareMigrations(
      [
        '00000000000000_squashed',
        '20260717103700_first_post_squash',
        '20260819120000_current',
      ],
      [
        applied('00000000000000_baseline'),
        applied('20260714210000_last_legacy'),
        applied('00000000000000_squashed'),
        applied('20260717103700_first_post_squash'),
        applied('20260819120000_current'),
      ],
    )
    assert.deepEqual(report.pending, [])
    assert.deepEqual(report.failed, [])
    assert.deepEqual(report.ahead, [])
  })

  check('a genuinely newer post-squash migration is still reported as ahead', () => {
    const report = compareMigrations(
      ['00000000000000_squashed', '20260717103700_current'],
      [
        applied('00000000000000_baseline'),
        applied('00000000000000_squashed'),
        applied('20260717103700_current'),
        applied('20260820000000_future'),
      ],
    )
    assert.deepEqual(report.ahead, ['20260820000000_future'])
  })

  check('an empty database reports every migration as pending', () => {
    const report = compareMigrations(
      ['20260818190000_a', '20260819120000_b'],
      [],
    )
    assert.deepEqual(report.pending, ['20260818190000_a', '20260819120000_b'])
  })

  check('the message names the migration and the remedy', () => {
    // A drift warning nobody can act on is the failure this whole check
    // exists to prevent, so the wording is part of the contract.
    const message = describeMigrationDrift(
      compareMigrations(['20260819120000_split_mana_tokens_resource'], []),
    )
    assert.match(message, /20260819120000_split_mana_tokens_resource/)
    assert.match(message, /prisma-migrate-deploy\.mjs/)
    assert.match(message, /migration-credential-boundary\.md/)
  })

  return errors
}

export function checkPluginCannotBlockBoot(content: string): string[] {
  const errors: string[] = []

  // `throw` anywhere in the plugin body, or an un-caught await, is the
  // difference between "one loud line" and "the site does not come up".
  if (/\bthrow\b/.test(content)) {
    errors.push(
      'The drift plugin throws. It must only warn: refusing to serve on a ' +
        'pending migration turns a partial outage into a total one, in the ' +
        'middle of a deploy.',
    )
  }

  for (const guarded of ['migrationsOnDisk', 'appliedMigrations']) {
    if (!content.includes(`${guarded}(`)) {
      errors.push(`The drift plugin no longer calls ${guarded}().`)
    }
  }

  // Two try/catch blocks: one for the filesystem read, one for the query.
  const catches = content.match(/\}\s*catch\s*\(/g) || []
  if (catches.length < 2) {
    errors.push(
      'The drift plugin no longer guards both the prisma/migrations read and ' +
        'the _prisma_migrations query. A fresh database (no bookkeeping ' +
        'table) or a slimmed image (no prisma/ directory) must not break boot.',
    )
  }

  // The plugin may name the elevated credential in a comment; it must never
  // read one. This check lives in the ordinary application lane because it
  // needs to know what was migrated, never to migrate.
  if (/process\.env\.MIGRATION_DATABASE_URL/.test(content)) {
    errors.push(
      'The drift plugin reads MIGRATION_DATABASE_URL. It only needs to read ' +
        'what was migrated, never to migrate -- see ' +
        'docs/runbooks/migration-credential-boundary.md.',
    )
  }

  return errors
}

function main(): void {
  const errors = [
    ...checkDriftBehaviour(),
    ...checkPluginCannotBlockBoot(readFileSync(PLUGIN_PATH, 'utf8')),
  ]

  if (errors.length) {
    console.error('Migration drift check contract failed:')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Migration drift check contract passed: a build whose migrations are not ' +
      'in the database says so at boot, names them, and cannot refuse to serve.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
