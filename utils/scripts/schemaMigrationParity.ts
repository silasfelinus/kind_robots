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
  /**
   * Future migration paths referenced by a newly added `.pending.txt`
   * provenance marker. The repository-aware verifier proves the migration
   * does not exist yet. This coverage is deliberately accepted only for a
   * contract-only schema change: structural removals with zero structural
   * additions. That preserves the original t-071 protection for additions,
   * whose required deploy order is migration first, client second.
   */
  deferredMigrationPaths?: string[]
}

export type SchemaMigrationParityResult = {
  ok: boolean
  structuralSchemaChange: boolean
  message?: string
}

type StructuralDirections = {
  hasAddition: boolean
  hasRemoval: boolean
}

// A diff line is exempt (does not itself require a migration) when its
// content -- with the leading +/- stripped -- is blank, a `///` Prisma doc
// comment, or a plain `//` comment. Reordering fields, rewording a doc
// comment, or reflowing a block all produce only exempt lines.
const EXEMPT_LINE = /^\s*(\/\/\/?.*)?$/

function structuralDirections(diff: string): StructuralDirections {
  const directions: StructuralDirections = {
    hasAddition: false,
    hasRemoval: false,
  }

  for (const line of diff.split('\n')) {
    // Unified diff hunk lines start with + or -; the file-header lines
    // (+++ / ---) do too, so exclude those explicitly before stripping.
    if (line.startsWith('+++') || line.startsWith('---')) continue
    if (!line.startsWith('+') && !line.startsWith('-')) continue
    const content = line.slice(1)
    if (EXEMPT_LINE.test(content)) continue

    if (line.startsWith('+')) directions.hasAddition = true
    if (line.startsWith('-')) directions.hasRemoval = true
  }

  return directions
}

export function checkSchemaMigrationParity(
  input: SchemaMigrationParityInput,
): SchemaMigrationParityResult {
  const directions = input.schemaDiffs.reduce<StructuralDirections>(
    (combined, diff) => {
      const current = structuralDirections(diff)
      return {
        hasAddition: combined.hasAddition || current.hasAddition,
        hasRemoval: combined.hasRemoval || current.hasRemoval,
      }
    },
    { hasAddition: false, hasRemoval: false },
  )
  const structuralSchemaChange =
    directions.hasAddition || directions.hasRemoval

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

  if ((input.deferredMigrationPaths ?? []).length > 0) {
    if (directions.hasRemoval && !directions.hasAddition) {
      return { ok: true, structuralSchemaChange: true }
    }

    return {
      ok: false,
      structuralSchemaChange: true,
      message:
        'a deferred migration provenance marker may cover only a contract-first ' +
        'schema contraction (structural removals with zero structural additions). ' +
        'This diff adds schema structure, so it still needs a migration in this diff ' +
        'or a validated pre-expansion marker. The deferred path must never waive the ' +
        'migration-first protection added after kind-robots/t-071.',
    }
  }

  return {
    ok: false,
    structuralSchemaChange: true,
    message:
      'prisma/*.prisma changed with a structural edit (not just comments/reordering/' +
      'formatting) but this diff has neither a migration file move nor a newly added ' +
      'migration provenance marker. Every real schema change needs migration ' +
      'coverage -- see kind-robots/t-072 and docs/runbooks/migration-credential-boundary.md. ' +
      'For the normal case, add the matching prisma/migrations/*/migration.sql. For an ' +
      'intentional expand-then-client rollout whose migration already landed on the base ' +
      'branch, add prisma/migration-provenance/<migration-directory>.txt containing that ' +
      'existing migration.sql path. For an intentional contract-then-migration removal, ' +
      'add prisma/migration-provenance/<future-migration-directory>.pending.txt containing ' +
      'the future migration.sql path; pending coverage is accepted only for removals, and ' +
      'the repository-aware verifier rejects the marker once that migration exists. If ' +
      'this is truly a no-op schema edit, double-check that assumption rather than ' +
      'bypassing the guardrail.',
  }
}
