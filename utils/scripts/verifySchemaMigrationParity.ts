// /utils/scripts/verifySchemaMigrationParity.ts
//
// Fails a PR whose prisma/*.prisma diff makes a structural change (a real
// field/model/enum edit, not a comment/reorder/reflow) without migration
// coverage. Normally that means a new file under prisma/migrations/. For an
// intentional expand-then-client rollout, the migration may already have
// landed on the base branch; in that case this diff must add a narrowly scoped
// provenance marker under prisma/migration-provenance/ that references the
// already-landed migration. The marker is validated against the diff base, so
// it cannot point at a migration that only exists on the feature branch.
//
// kind-robots/t-072 added this guard for the class of bug that broke
// production in kind-robots/t-071: a migration is easy to forget once
// `prisma generate` has already made the client match the new schema locally,
// because nothing else complains until a query hits the missing column in
// production.
//
// Decision logic lives in schemaMigrationParity.ts so it can be unit-tested
// against synthetic diffs without a real git repository. This file gathers
// and validates the real repository diff.
//
//   npx tsx utils/scripts/verifySchemaMigrationParity.ts
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { basename, dirname } from 'node:path'

import { checkSchemaMigrationParity } from './schemaMigrationParity'

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' })
}

/**
 * The commit to diff against. In a PR, GITHUB_BASE_REF names the target
 * branch (e.g. "main") but not a specific SHA, so the merge-base with the
 * fetched remote-tracking ref is what actually isolates this PR's own
 * commits. Falls back to HEAD~1 outside a PR (e.g. a push to main).
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

function removedFiles(base: string, pattern: string): string[] {
  return git([
    'diff',
    '--name-only',
    '--diff-filter=D',
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

function failProvenance(message: string): never {
  console.error(`[schema-migration-parity] invalid migration provenance: ${message}`)
  process.exit(1)
}

/**
 * A provenance marker is intentionally tiny and one-shot. Its filename must
 * be the already-landed migration directory plus `.txt`, and its sole
 * non-comment line must be that directory's migration.sql path. Most
 * importantly, `git cat-file` verifies the migration exists at the diff BASE,
 * not merely on HEAD. That makes the marker useful only for genuine
 * migration-first/client-second rollouts, not as a generic waiver.
 */
function validatePreexpandedMigrations(
  base: string,
  provenancePaths: string[],
): string[] {
  return provenancePaths.map((provenancePath) => {
    const lines = readFileSync(provenancePath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))

    if (lines.length !== 1) {
      failProvenance(
        `${provenancePath} must contain exactly one non-comment migration.sql path`,
      )
    }

    const migrationPath = lines[0]!
    const match = migrationPath.match(
      /^prisma\/migrations\/([^/]+)\/migration\.sql$/,
    )
    if (!match) {
      failProvenance(
        `${provenancePath} must reference prisma/migrations/<directory>/migration.sql`,
      )
    }

    const migrationDirectory = match[1]!
    const expectedMarker = `prisma/migration-provenance/${migrationDirectory}.txt`
    if (provenancePath !== expectedMarker) {
      failProvenance(
        `${provenancePath} must be named ${expectedMarker} for ${migrationPath}`,
      )
    }

    // Guard against odd path tricks even though the regex is already strict.
    if (basename(dirname(migrationPath)) !== migrationDirectory) {
      failProvenance(`${provenancePath} migration directory does not match its path`)
    }

    try {
      git(['cat-file', '-e', `${base}:${migrationPath}`])
    } catch {
      failProvenance(
        `${provenancePath} references ${migrationPath}, but that migration does not exist on the diff base ${base}`,
      )
    }

    return migrationPath
  })
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
// prisma/generated/**. Those are artifacts this check compares against.
const changedSchemaFiles = changedFiles(base, 'prisma/*.prisma')
const schemaDiffs = changedSchemaFiles.map((path) => fileDiff(base, path))
const addedMigrationPaths = addedFiles(base, 'prisma/migrations/*')
const removedMigrationPaths = removedFiles(base, 'prisma/migrations/*')
const addedProvenancePaths = addedFiles(base, 'prisma/migration-provenance/*')
const preexpandedMigrationPaths = validatePreexpandedMigrations(
  base,
  addedProvenancePaths,
)

const result = checkSchemaMigrationParity({
  schemaDiffs,
  addedMigrationPaths,
  removedMigrationPaths,
  preexpandedMigrationPaths,
})

if (!result.ok) {
  console.error(`[schema-migration-parity] ${result.message}`)
  console.error(
    `[schema-migration-parity] changed schema files: ${changedSchemaFiles.join(', ') || '(none)'}`,
  )
  process.exit(1)
}

if (result.structuralSchemaChange) {
  const parts = [
    ...addedMigrationPaths.map((p) => `+${p}`),
    ...removedMigrationPaths.map((p) => `-${p}`),
    ...preexpandedMigrationPaths.map((p) => `preexpanded:${p}`),
  ]
  console.log(
    `[schema-migration-parity] schema changed with migration coverage ` +
      `(${parts.join(', ')}) -- ok.`,
  )
} else {
  console.log(
    '[schema-migration-parity] no structural schema change in this diff -- ok.',
  )
}
