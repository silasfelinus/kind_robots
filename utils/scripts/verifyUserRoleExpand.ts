// /utils/scripts/verifyUserRoleExpand.ts
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Contract for the multi-role expand migration.
//
// Silas, 2026-08-01: "our Role system is too restrictive, as we only allow one
// Role, and this means that I can't make say, a Child and Admin, or Family an
// Admin, etc. We need to revise to have roles, but there are a lot of places
// this might touch, so proceed with awareness."
//
// "Proceed with awareness" is the whole point of this file. The expand half is
// safe ONLY because it holds three properties at once, and each one is easy to
// break later without noticing:
//
//   1. ADDITIVE. It must not DROP or MODIFY anything, and must not touch the
//      `User` table at all. `User.Role` stays and keeps being written, so the
//      49 inline `user.Role === 'ADMIN'` comparisons still live in server/
//      keep working untouched while phase 3 consolidates them.
//   2. BACKFILLED. Every user gets a UserRole row matching their current Role,
//      so the join table is complete on its own and a reader never has to
//      consult both places to get a correct answer.
//   3. IDEMPOTENT. The backfill must survive being applied twice -- to a
//      hand-repaired database, or one restored from a snapshot taken between
//      the CREATE TABLE and the INSERT. verify-known-migration-repair.mjs
//      exists because that exact situation has already happened in this repo.
//
// This is a source-text contract on purpose: it needs no database, so it can
// gate every pull request alongside the other fast contract verifiers.
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const MIGRATION_PATH =
  'prisma/migrations/20260801234000_user_role_expand/migration.sql'
const SCHEMA_PATH = 'prisma/schema.prisma'

function read(relativePath: string): string {
  return readFileSync(resolve(repositoryRoot, relativePath), 'utf8')
}

/** Statement text with `-- ...` comment lines stripped, so prose can mention
 *  words like DROP without tripping the destructive-statement checks. */
function statements(sql: string): string {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n')
}

function main(): void {
  const failures: string[] = []
  const migration = read(MIGRATION_PATH)
  const sql = statements(migration)
  const schema = read(SCHEMA_PATH)

  const check = (condition: boolean, message: string): void => {
    if (condition) {
      console.log(`ok - ${message}`)
      return
    }
    failures.push(message)
    console.error(`FAIL - ${message}`)
  }

  // 1. Additive.
  check(
    !/\bDROP\b/i.test(sql),
    'expand migration contains no DROP statement',
  )
  check(
    !/\bMODIFY\b/i.test(sql) && !/\bCHANGE\s+COLUMN\b/i.test(sql),
    'expand migration retypes no existing column',
  )
  check(
    !/ALTER\s+TABLE\s+`User`/i.test(sql),
    'expand migration does not alter the User table',
  )
  check(
    !/\bTRUNCATE\b/i.test(sql),
    'expand migration truncates nothing',
  )
  // A bare DELETE/UPDATE would rewrite live rows. `ON DELETE CASCADE` inside a
  // foreign-key clause is not a statement, so match only statement-initial use.
  check(
    !/^\s*(DELETE|UPDATE)\s/im.test(sql),
    'expand migration issues no standalone DELETE or UPDATE',
  )

  // 2. Backfilled -- from User.Role, covering every user with no WHERE clause.
  const backfill = sql.match(/INSERT\s+INTO\s+`UserRole`[\s\S]*?;/i)?.[0] ?? ''
  check(backfill.length > 0, 'expand migration backfills UserRole')
  check(
    /SELECT\s+`id`,\s*`Role`[^;]*?\sFROM\s+`User`/i.test(backfill),
    'backfill sources each row from that user\'s existing User.Role',
  )
  check(
    !/\bWHERE\b/i.test(backfill),
    'backfill covers every user (no WHERE clause), so the join table is complete on its own',
  )

  // 3. Idempotent.
  check(
    /ON\s+DUPLICATE\s+KEY\s+UPDATE/i.test(backfill),
    'backfill is idempotent via ON DUPLICATE KEY UPDATE',
  )
  check(
    /ON\s+DUPLICATE\s+KEY\s+UPDATE\s+`userId`\s*=\s*`userId`/i.test(backfill),
    'the ON DUPLICATE clause is a no-op self-assignment, not a real rewrite',
  )

  // Schema side: the model must keep the shape the migration created, and
  // User.Role must survive. A composite primary key is what makes the backfill
  // conflict-safe -- without it ON DUPLICATE KEY has nothing to catch on.
  const model = schema.match(/model\s+UserRole\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
  check(model.length > 0, 'schema declares the UserRole model')
  check(
    /@@id\(\[userId,\s*role\]\)/.test(model),
    'UserRole is keyed on (userId, role), which is what makes the backfill conflict-safe',
  )
  check(
    /onDelete:\s*Cascade/.test(model),
    'UserRole rows are removed with their user',
  )
  check(
    /@@index\(\[role\]\)/.test(model),
    'UserRole indexes role so "everyone who is an ADMIN" stays a cheap query',
  )
  check(
    /\n\s*Role\s+Role\s+@default\(USER\)/.test(schema),
    'User.Role still exists as the primary/display role',
  )
  check(
    /\n\s*UserRoles\s+UserRole\[\]/.test(schema),
    'User exposes the UserRoles back-relation so auth can load roles in one query',
  )

  if (failures.length) {
    console.error(
      `\nUserRole expand contract failed with ${failures.length} error(s).`,
    )
    process.exitCode = 1
    return
  }

  console.log('\nUserRole expand contract passed: all checks behaved as expected.')
}

main()
