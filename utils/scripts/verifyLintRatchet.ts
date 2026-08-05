// /utils/scripts/verifyLintRatchet.ts
//
// interface-vision/t-099: make ESLint a CI gate without first fixing 554
// pre-existing problems.
//
// THE DECISION THIS TASK ASKED FOR. t-099 said to scope the choice — pre-commit
// hook, ratcheted CI job, or keep relying on review — rather than assume the CI
// job was wanted. It is a ratcheted CI job, for three reasons:
//
//   1. Review demonstrably does not catch this. t-072 (#1444) shipped five dead
//      pieces — a computed-and-discarded `legacyKind`, an imported-but-uncalled
//      helper in two files, an unused import, and a `const extra` whose only
//      consumer had been deleted. Every one is a plain no-unused-vars error
//      that `npx eslint` reports instantly. They survived because vue-tsc is
//      the only linter in CI and it does not care about unused values. The same
//      thing happened again in t-066 (#1456): collapsing three copies of a
//      fetch into a composable left three now-unused imports that typechecked
//      clean.
//   2. A pre-commit hook does not fit how this repo is actually written. Much
//      of the work arrives from agent sandboxes and API-based pushes that never
//      run local hooks, so the check has to live where the commits land.
//   3. The ratchet pattern is already the house style — verifyLayoutContract.ts
//      and auditWonderLabPreviews.ts both use it, and ratchetBaseline.ts was
//      extracted in t-095 specifically so a third consumer would not copy it.
//
// HOW IT RATCHETS. Problems are bucketed BY RULE, and a bucket may only ever
// shrink. Per-rule rather than one total is the point: with a single number,
// deleting twenty unused variables would silently pay for twenty new `any`s.
// A rule absent from the baseline counts as zero, so a newly-enabled rule with
// any hits reads as growth rather than being waved through.
//
//   npx tsx utils/scripts/verifyLintRatchet.ts             # check
//   npx tsx utils/scripts/verifyLintRatchet.ts --update    # re-record (shrink only)
//   npx tsx utils/scripts/verifyLintRatchet.ts --self-test # no ESLint run
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import {
  grownRatchetBuckets,
  loadRatchetBaseline,
  ratchetDelta,
  ratchetNote,
  ratchetRecordedAt,
  writeRatchetBaseline,
  type RatchetEntries,
} from './ratchetBaseline'

const root = process.cwd()
const BASELINE = resolve(root, 'utils/scripts/lint-ratchet-baseline.json')
const SCRIPT = 'utils/scripts/verifyLintRatchet.ts'

/** A file that fails to parse reports no ruleId; it still must not multiply. */
const PARSE_BUCKET = '(parse error)'

type EslintMessage = {
  ruleId: string | null
  line?: number
  column?: number
  severity: number
}

type EslintResult = {
  filePath: string
  messages: EslintMessage[]
}

type LintBaseline = {
  note: string
  recorded: string
  total: number
  violations: RatchetEntries
}

/**
 * Group ESLint's JSON report into ratchet buckets keyed by rule.
 *
 * Entries are `path:line:column` and are sorted, so the baseline file diffs
 * meaningfully instead of reshuffling whenever ESLint changes traversal order.
 * Pure, so the bucketing is testable without running ESLint over the repo.
 */
export function bucketByRule(
  results: readonly EslintResult[],
  repoRoot: string,
): RatchetEntries {
  const buckets: RatchetEntries = {}

  for (const result of results) {
    const relative = result.filePath.startsWith(repoRoot)
      ? result.filePath.slice(repoRoot.length).replace(/^[/\\]/, '')
      : result.filePath

    for (const message of result.messages ?? []) {
      const rule = message.ruleId ?? PARSE_BUCKET
      const where = `${relative}:${message.line ?? 0}:${message.column ?? 0}`
      ;(buckets[rule] ??= []).push(where)
    }
  }

  for (const rule of Object.keys(buckets)) {
    buckets[rule] = (buckets[rule] as string[]).sort((a, b) =>
      a.localeCompare(b),
    )
  }

  return buckets
}

/** Total problems across every bucket. */
export function totalProblems(buckets: RatchetEntries): number {
  return Object.values(buckets).reduce((sum, list) => sum + list.length, 0)
}

/**
 * Buckets that appear now but not in the baseline at all — reported separately
 * from ones that merely grew, because a brand-new rule firing is usually a
 * config change rather than a regression and deserves a different message.
 */
export function newRuleBuckets(
  current: RatchetEntries,
  baseline: RatchetEntries | null,
): string[] {
  if (!baseline) return []
  return Object.keys(current).filter((rule) => !(rule in baseline))
}

function runEslint(): EslintResult[] {
  // --format json to stdout. ESLint exits 1 when it finds problems, which is
  // the normal case here — the ratchet decides pass/fail, not ESLint's code.
  const run = spawnSync(
    'npx',
    ['eslint', '.', '--format', 'json', '--no-warn-ignored'],
    { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
  )

  if (run.error) throw new Error(`Could not run ESLint: ${run.error.message}`)

  const stdout = (run.stdout ?? '').trim()
  if (!stdout) {
    throw new Error(
      `ESLint produced no JSON output (exit ${run.status}).\n${run.stderr ?? ''}`,
    )
  }

  // ESLint may print warnings before the JSON; take from the first bracket.
  const start = stdout.indexOf('[')
  if (start === -1) {
    throw new Error(`ESLint output was not JSON (exit ${run.status}).`)
  }

  return JSON.parse(stdout.slice(start)) as EslintResult[]
}

/* ------------------------------------------------------------------------ */

/**
 * Mutation-checked self-test. Per t-063, a ratchet only ever seen to pass is
 * indistinguishable from one that cannot fail, and the failure modes that
 * matter here are the SILENT ones: a rule that grew, and a rule that is new.
 */
function selfTest(): void {
  const results: EslintResult[] = [
    {
      filePath: '/repo/server/a.ts',
      messages: [
        { ruleId: 'no-unused-vars', line: 3, column: 1, severity: 2 },
        {
          ruleId: '@typescript-eslint/no-explicit-any',
          line: 9,
          column: 4,
          severity: 2,
        },
      ],
    },
    {
      filePath: '/repo/stores/b.ts',
      messages: [{ ruleId: 'no-unused-vars', line: 1, column: 1, severity: 2 }],
    },
    // A file ESLint could not parse reports a null ruleId.
    {
      filePath: '/repo/c.vue',
      messages: [{ ruleId: null, line: 1, column: 1, severity: 2 }],
    },
    { filePath: '/repo/clean.ts', messages: [] },
  ]

  const buckets = bucketByRule(results, '/repo')

  const expected = {
    'no-unused-vars': ['server/a.ts:3:1', 'stores/b.ts:1:1'],
    '@typescript-eslint/no-explicit-any': ['server/a.ts:9:4'],
    [PARSE_BUCKET]: ['c.vue:1:1'],
  }

  if (JSON.stringify(buckets) !== JSON.stringify(expected)) {
    throw new Error(
      `bucketByRule mismatch.\n  got      ${JSON.stringify(buckets)}\n  expected ${JSON.stringify(expected)}`,
    )
  }

  if (totalProblems(buckets) !== 4) {
    throw new Error(`totalProblems = ${totalProblems(buckets)}, expected 4`)
  }

  // A rule that grew must be caught.
  const grew = grownRatchetBuckets(buckets, {
    'no-unused-vars': ['server/a.ts:3:1'],
    '@typescript-eslint/no-explicit-any': ['server/a.ts:9:4'],
    [PARSE_BUCKET]: ['c.vue:1:1'],
  })
  if (JSON.stringify(grew) !== JSON.stringify(['no-unused-vars'])) {
    throw new Error(`growth not detected, got ${JSON.stringify(grew)}`)
  }

  // A rule absent from the baseline counts as zero, so it reads as growth —
  // this is the case that would otherwise wave a whole new rule through.
  const fresh = grownRatchetBuckets(buckets, { 'no-unused-vars': ['x', 'y'] })
  if (!fresh.includes('@typescript-eslint/no-explicit-any')) {
    throw new Error(`a rule missing from the baseline must count as growth`)
  }
  if (
    !newRuleBuckets(buckets, { 'no-unused-vars': [] }).includes(PARSE_BUCKET)
  ) {
    throw new Error(
      'newRuleBuckets must report buckets absent from the baseline',
    )
  }

  // Shrinking, and holding steady, must both pass.
  const shrunk = grownRatchetBuckets(buckets, {
    'no-unused-vars': ['a', 'b', 'c'],
    '@typescript-eslint/no-explicit-any': ['a', 'b'],
    [PARSE_BUCKET]: ['a'],
  })
  if (shrunk.length) {
    throw new Error(`shrinking must not fail, got ${JSON.stringify(shrunk)}`)
  }

  console.log('✅ verifyLintRatchet self-test passed.')
}

/* ------------------------------------------------------------------------ */

function main(): void {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }

  selfTest()

  const update = process.argv.includes('--update')
  const buckets = bucketByRule(runEslint(), root)
  const total = totalProblems(buckets)
  const baseline = loadRatchetBaseline<LintBaseline>(BASELINE)
  const grown = grownRatchetBuckets(buckets, baseline?.violations ?? null)
  const fresh = newRuleBuckets(buckets, baseline?.violations ?? null)

  process.stdout.write(
    `ESLint ratchet: ${total} problem(s) across ${Object.keys(buckets).length} rule(s)` +
      `${ratchetDelta(total, baseline?.total)}\n`,
  )

  if (update) {
    if (grown.length) {
      console.error(
        `Refusing to record a LARGER baseline. These rules grew:\n` +
          grown
            .map(
              (rule) =>
                `  ${rule}: ${baseline?.violations[rule]?.length ?? 0} → ${buckets[rule]?.length ?? 0}`,
            )
            .join('\n') +
          `\n\nFix them, or explain in the PR why the baseline should rise and edit it by hand.`,
      )
      process.exitCode = 1
      return
    }

    writeRatchetBaseline(BASELINE, {
      note: ratchetNote('ESLint', SCRIPT),
      recorded: ratchetRecordedAt(),
      total,
      violations: buckets,
    } satisfies LintBaseline)

    process.stdout.write(`Baseline updated: ${BASELINE}\n`)
    return
  }

  if (!baseline) {
    console.error(
      `No baseline at ${BASELINE}. Record one with:\n  npm run test:lint-ratchet -- --update`,
    )
    process.exitCode = 1
    return
  }

  if (!grown.length) {
    process.stdout.write('ESLint ratchet holds — no rule got worse.\n')
    return
  }

  console.error(`\n❌ ${grown.length} ESLint rule(s) got worse:\n`)

  for (const rule of grown) {
    const was = baseline.violations[rule]?.length ?? 0
    const now = buckets[rule]?.length ?? 0
    const label = fresh.includes(rule) ? ' (rule is new to this repo)' : ''
    console.error(`  ${rule}: ${was} → ${now}${label}`)

    const known = new Set(baseline.violations[rule] ?? [])
    for (const entry of (buckets[rule] ?? []).filter((e) => !known.has(e))) {
      console.error(`      ${entry}`)
    }
  }

  console.error(
    `\nThis gate never asks you to fix pre-existing problems — only not to add` +
      `\nnew ones. Fix the entries above, or if you genuinely reduced some other` +
      `\nrule and want the file re-recorded, run:` +
      `\n  npm run test:lint-ratchet -- --update\n`,
  )
  process.exitCode = 1
}

// Importable for the self-test without shelling out to ESLint.
if (process.argv[1]?.endsWith('verifyLintRatchet.ts')) {
  main()
}
