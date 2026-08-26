// /utils/scripts/schemaMigrationParity.ts
//
// Pure decision logic for utils/scripts/verifySchemaMigrationParity.ts --
// separated so the rule can be exercised against synthetic diffs without a
// real git repository. See that script for how the inputs are gathered and
// kind-robots/t-072 for why this exists: "a CI check that fails a PR whose
// schema.prisma diff has no corresponding migration file" was the other half
// of the fix for the class of bug that took production down in
// kind-robots/t-071 (a schema.prisma edit shipped with the client
// regenerated and no migration written at all).

export type SchemaMigrationParityInput = {
  /** Every changed prisma/*.prisma file's raw unified diff, one per file. */
  schemaDiffs: string[]
  /** Paths newly added under prisma/migrations/ in this diff range. */
  addedMigrationPaths: string[]
  /**
   * Paths removed from under prisma/migrations/ in this diff range. Optional
   * for backward compatibility with existing callers/tests that never pass
   * it (treated as empty). A structural schema change paired with a removed
   * migration file is the shape of a clean revert of a migration that was
   * never applied to production -- e.g. `git revert` on a PR caught before
   * deploy -- and is exactly as sound as the forward case this check was
   * built for (an added migration file matching an added field).
   */
  removedMigrationPaths?: string[]
  /**
   * Migration paths referenced by a provenance marker newly added in this
   * diff. The repository-aware verifier only puts entries here after proving
   * that the referenced migration already exists at the diff base. This is
   * the safe shape for an expand-then-client rollout: migration first, schema
   * client second. Because the provenance marker itself must be new in this
   * diff, it cannot become a permanent waiver for later schema edits.
   */
  preexpandedMigrationPaths?: string[]
}

export type SchemaMigrationParityResult = {
  ok: boolean
  structuralSchemaChange: boolean
  message?: string
}

// A diff line is exempt (does not itself require a migration) when its
// content -- with the leading +/- stripped -- is blank, a `///` Prisma doc
// comment, or a plain `//` comment. Reordering fields, rewording a doc
// comment, or reflowing a block all produce only exempt lines.
const EXEMPT_LINE = /^\s*(\/\/\/?.*)?$/

function hasStructuralChange(diff: string): boolean {
  for (const line of diff.split('\n')) {
    // Unified diff hunk lines start with + or -; the file-header lines
    // (+++ / ---) do too, so exclude those explicitly before stripping.
    if (line.startsWith('+++') || line.startsWith('---')) continue
    if (!line.startsWith('+') && !line.startsWith('-')) continue
    const content = line.slice(1)
    if (!EXEMPT_LINE.test(content)) return true
  }
  return false
}

export function checkSchemaMigrationParity(
  input: SchemaMigrationParityInput,
): SchemaMigrationParityResult {
  const structuralSchemaChange = input.schemaDiffs.some(hasStructuralChange)

  if (!structuralSchemaChange) {
    return { ok: true, structuralSchemaChange: false }
  }

  if (input.addedMigrationPaths.length > 0) {
    return { ok: true, structuralSchemaChange: true }
  }

  if ((input.removedMigrationPaths ?? []).length > 0) {
    return { ok: true, structuralSchemaChange: true }
  }

  if ((input.preexpandedMigrationPaths ?? []).length > 0) {
    return { ok: true, structuralSchemaChange: true }
  }

  return {
    ok: false,
    structuralSchemaChange: true,
    message:
      'prisma/*.prisma changed with a structural edit (not just comments/reordering/' +
      'formatting) but this diff has neither a migration file move nor a newly added ' +
      'pre-expansion provenance marker. Every real schema change needs migration ' +
      'coverage -- see kind-robots/t-072 and docs/runbooks/migration-credential-boundary.md. ' +
      'For the normal case, add the matching prisma/migrations/*/migration.sql. For an ' +
      'intentional expand-then-client rollout whose migration already landed on the base ' +
      'branch, add prisma/migration-provenance/<migration-directory>.txt containing that ' +
      'existing migration.sql path; the repository-aware verifier proves the referenced ' +
      'migration really exists on the diff base. If this is truly a no-op schema edit, ' +
      'double-check that assumption rather than bypassing the guardrail.',
  }
}
