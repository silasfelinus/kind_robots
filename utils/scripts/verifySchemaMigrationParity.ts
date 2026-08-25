// /utils/scripts/verifySchemaMigrationParity.ts
//
// Fails a PR whose prisma/*.prisma diff makes a structural change (a real
// field/model/enum edit, not a comment/reorder/reflow) but adds no new file
// under prisma/migrations/. kind-robots/t-072, the second half of the fix
// for the class of bug that broke production in kind-robots/t-071: a
// migration is easy to forget once `prisma generate` has already made the
// client match the new schema locally, because nothing else complains until
// a query hits the missing column in production. The other half --
// server/plugins/01-migration-drift-check.ts, warning at boot when the
// database doesn't have what the build expects -- already exists; this is
// the earlier, cheaper catch, at PR time instead of at boot.
//
// Decision logic lives in schemaMigrationParity.ts so it can be unit-tested
// against synthetic diffs (schemaMigrationParity.test.ts) without a real git
// repository. This file's only job is gathering the real diff and reporting
// the result.
//
//   npx tsx utils/scripts/verifySchemaMigrationParity.ts
import { execFileSync } from 'node:child_process'

import { checkSchemaMigrationParity } from './schemaMigrationParity'

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' })
}

/**
 * The commit to diff against. In a PR, GITHUB_BASE_REF names the target
 * branch (e.g. "main") but not a specific SHA, so the merge-base with the
 * fetched remote-tracking ref is what actually isolates this PR's own
 * commits -- the base branch keeps moving while a PR sits open, and diffing
 * straight against `origin/main`'s current tip would flag unrelated schema
 * changes that landed on main after this branch forked. Falls back to
 * HEAD~1 outside a PR (e.g. a push to main, or a local run) so the script
 * still does something reasonable rather than requiring a PR context to run
 * at all.
 */
function resolveDiffBase(): string | null {
  const baseRef = process.env.GITHUB_BASE_REF
  if (baseRef) {
    try {
      git(['fetch', '--depth=50', 'origin', baseRef])
      const remote = `origin/${baseRef}`
      return git(['merge-base', 'HEAD', remote]).trim()
    } catch (error) {
      console.warn(
        `[schema-migration-parity] could not resolve merge-base against origin/${baseRef}; ` +
          'falling back to HEAD~1.',
        error,
      )
    }
  }

  try {
    return git(['rev-parse', 'HEAD~1']).trim()
  } catch {
    // A single-commit history (e.g. a fresh checkout with fetch-depth: 1).
    // Nothing to diff against -- pass rather than fail on missing context
    // this check did not cause.
    return null
  }
}

function changedFiles(base: string, pattern: string): string[] {
  return git(['diff', '--name-only', `${base}...HEAD`, '--', pattern])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function addedFiles(base: string, pattern: string): string[] {
  return git([
    'diff',
    '--name-only',
    '--diff-filter=A',
    `${base}...HEAD`,
    '--',
    pattern,
  ])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function fileDiff(base: string, path: string): string {
  return git(['diff', `${base}...HEAD`, '--', path])
}

const base = resolveDiffBase()

if (!base) {
  console.warn(
    '[schema-migration-parity] no base commit to diff against (shallow single-commit ' +
      'checkout); skipping.',
  )
  process.exit(0)
}

// Only prisma/*.prisma directly -- excludes prisma/migrations/** and
// prisma/generated/** on its own, since those are the generated/authored
// artifacts this check is comparing the schema *against*, not more schema.
const changedSchemaFiles = changedFiles(base, 'prisma/*.prisma')
const schemaDiffs = changedSchemaFiles.map((path) => fileDiff(base, path))
const addedMigrationPaths = addedFiles(base, 'prisma/migrations/*')

const result = checkSchemaMigrationParity({ schemaDiffs, addedMigrationPaths })

if (!result.ok) {
  console.error(`[schema-migration-parity] ${result.message}`)
  console.error(
    `[schema-migration-parity] changed schema files: ${changedSchemaFiles.join(', ') || '(none)'}`,
  )
  process.exit(1)
}

if (result.structuralSchemaChange) {
  console.log(
    `[schema-migration-parity] schema changed with a matching new migration ` +
      `(${addedMigrationPaths.join(', ')}) -- ok.`,
  )
} else {
  console.log(
    '[schema-migration-parity] no structural schema change in this diff -- ok.',
  )
}
