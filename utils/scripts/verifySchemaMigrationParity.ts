// /utils/scripts/verifySchemaMigrationParity.ts
//
// Fails a PR whose prisma/*.prisma diff makes a structural change (a real
// field/model/enum edit, not a comment/reorder/reflow) without migration
// coverage. Normally that means a new file under prisma/migrations/. For an
// intentional expand-then-client rollout, the migration may already have
// landed on the base branch; in that case this diff must add a narrowly scoped
// provenance marker under prisma/migration-provenance/ that references the
// already-landed migration. For the inverse contract-then-migration sequence,
// a removal-only schema diff may add a `.pending.txt` marker naming the future
// migration. Pending markers are one-shot: they cannot cover schema additions,
// and they become invalid as soon as their migration exists on HEAD.
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

function gitObjectExists(revision: string, path: string): boolean {
  try {
    execFileSync('git', ['cat-file', '-e', `${revision}:${path}`], {
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
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

function trackedFiles(pathPrefix: string): string[] {
  return git(['ls-files', '--', pathPrefix])
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

function readMigrationPath(provenancePath: string): {
  migrationPath: string
  migrationDirectory: string
} {
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
  if (basename(dirname(migrationPath)) !== migrationDirectory) {
    failProvenance(`${provenancePath} migration directory does not match its path`)
  }

  return { migrationPath, migrationDirectory }
}

/**
 * A pre-expansion provenance marker is intentionally tiny and one-shot. Its
 * filename must be the already-landed migration directory plus `.txt`, and
 * its sole non-comment line must be that directory's migration.sql path. Most
 * importantly, the migration must exist at the diff BASE, not merely on HEAD.
 * That makes the marker useful only for genuine migration-first/client-second
 * rollouts, not as a generic waiver.
 */
function validatePreexpandedMigrations(
  base: string,
  provenancePaths: string[],
): string[] {
  return provenancePaths.map((provenancePath) => {
    const { migrationPath, migrationDirectory } =
      readMigrationPath(provenancePath)
    const expectedMarker = `prisma/migration-provenance/${migrationDirectory}.txt`
    if (provenancePath !== expectedMarker) {
      failProvenance(
        `${provenancePath} must be named ${expectedMarker} for ${migrationPath}`,
      )
    }

    if (!gitObjectExists(base, migrationPath)) {
      failProvenance(
        `${provenancePath} references ${migrationPath}, but that migration does not exist on the diff base ${base}`,
      )
    }

    return migrationPath
  })
}

/**
 * A pending marker records the opposite rollout direction: the schema/client
 * contracts first, and a destructive migration is intentionally created only
 * after the narrowed client is deployed. The marker filename names that exact
 * future migration and the migration must not exist yet. Every tracked pending
 * marker is checked on every run, so the later migration PR must remove its
 * marker in the same diff rather than leaving a permanent waiver behind.
 */
function validatePendingMigrations(provenancePaths: string[]): Map<string, string> {
  const migrationByMarker = new Map<string, string>()

  for (const provenancePath of provenancePaths) {
    const { migrationPath, migrationDirectory } =
      readMigrationPath(provenancePath)
    const expectedMarker = `prisma/migration-provenance/${migrationDirectory}.pending.txt`
    if (provenancePath !== expectedMarker) {
      failProvenance(
        `${provenancePath} must be named ${expectedMarker} for ${migrationPath}`,
      )
    }

    if (gitObjectExists('HEAD', migrationPath)) {
      failProvenance(
        `${provenancePath} is still pending but ${migrationPath} now exists on HEAD; remove the pending marker in the migration PR`,
      )
    }

    migrationByMarker.set(provenancePath, migrationPath)
  }

  return migrationByMarker
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
const addedPendingProvenancePaths = addedProvenancePaths.filter((path) =>
  path.endsWith('.pending.txt'),
)
const addedPreexpandedProvenancePaths = addedProvenancePaths.filter(
  (path) => !path.endsWith('.pending.txt'),
)
const preexpandedMigrationPaths = validatePreexpandedMigrations(
  base,
  addedPreexpandedProvenancePaths,
)

const allPendingProvenancePaths = trackedFiles(
  'prisma/migration-provenance',
).filter((path) => path.endsWith('.pending.txt'))
const pendingMigrationByMarker = validatePendingMigrations(
  allPendingProvenancePaths,
)
const deferredMigrationPaths = addedPendingProvenancePaths.map(
  (path) => pendingMigrationByMarker.get(path)!,
)

const result = checkSchemaMigrationParity({
  schemaDiffs,
  addedMigrationPaths,
  removedMigrationPaths,
  preexpandedMigrationPaths,
  deferredMigrationPaths,
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
    ...deferredMigrationPaths.map((p) => `deferred:${p}`),
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
