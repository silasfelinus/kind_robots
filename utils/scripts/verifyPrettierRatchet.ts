// /utils/scripts/verifyPrettierRatchet.ts
//
// interface-vision/t-137: gate Prettier formatting without a repo-wide reformat.
//
// THE MEASUREMENT (2026-09-14, on t-137's filing) found 1178 files failing
// `prettier --check .` — not the ~33 a single task touches. A single reformat
// PR would be a giant diff that conflicts with every in-flight branch and
// hides any real behaviour change inside pure whitespace noise. package.json
// already declares `lint:prettier` as half of `npm run lint`, but nothing in
// CI runs it, so the drift is unbounded and the declared standard is
// decorative.
//
// SAME SHAPE AS verifyLintRatchet.ts: a bucket may only ever shrink, so
// existing debt never blocks new work but nothing new may be added to it.
// Buckets here are the top-level directory of each unformatted file (the
// same breakdown t-137's own measurement used — server/, utils/,
// components/, prisma/, config/, …) rather than one flat count, so a bounded
// slice can shrink one directory's bucket without the ratchet needing to
// track which individual files moved.
//
// NOT the shared grownRatchetBuckets() alone. ratchetBaseline.ts's count-only
// comparison is right for verifyLintRatchet.ts, whose entries carry line:column
// and would false-positive on every unrelated line shift in a file -- membership
// there is too strict to be useful. Prettier's entries are bare file paths with
// no such churn, so a same-bucket SUBSTITUTION (fixing one baseline file while a
// different file in the same directory goes unformatted) would hold the count
// steady and slip through count-only comparison. substitutedRatchetBuckets()
// below closes that gap by checking membership, on top of (not instead of) the
// shared shrink-only count check.
//
//   npx tsx utils/scripts/verifyPrettierRatchet.ts             # check
//   npx tsx utils/scripts/verifyPrettierRatchet.ts --update    # re-record (shrink only)
//   npx tsx utils/scripts/verifyPrettierRatchet.ts --self-test # no Prettier run
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
const BASELINE = resolve(root, 'utils/scripts/prettier-ratchet-baseline.json')
const SCRIPT = 'utils/scripts/verifyPrettierRatchet.ts'

/** A path with no directory component (a repo-root file) buckets here. */
const ROOT_BUCKET = '(root)'

type PrettierBaseline = {
  note: string
  recorded: string
  total: number
  violations: RatchetEntries
}

/**
 * Group Prettier's list-different output into ratchet buckets keyed by the
 * file's top-level directory.
 *
 * Pure, so the bucketing is testable without running Prettier over the repo.
 * Paths are expected relative to the repo root, forward-slash separated
 * (what `prettier --list-different` prints).
 */
export function bucketByTopDir(files: readonly string[]): RatchetEntries {
  const buckets: RatchetEntries = {}

  for (const file of files) {
    const slash = file.indexOf('/')
    const bucket = slash === -1 ? ROOT_BUCKET : file.slice(0, slash)
    ;(buckets[bucket] ??= []).push(file)
  }

  for (const bucket of Object.keys(buckets)) {
    buckets[bucket] = (buckets[bucket] as string[]).sort((a, b) =>
      a.localeCompare(b),
    )
  }

  return buckets
}

/** Total unformatted files across every bucket. */
export function totalProblems(buckets: RatchetEntries): number {
  return Object.values(buckets).reduce((sum, list) => sum + list.length, 0)
}

/**
 * Buckets containing a CURRENT file that isn't in the baseline's list for
 * that bucket -- a growth the count-only `grownRatchetBuckets` check alone
 * cannot see when it lands alongside a same-bucket fix (baseline count 2,
 * one old entry fixed, one new entry appears, count stays 2).
 *
 * A bucket entirely absent from the baseline counts as all-new, same as
 * `grownRatchetBuckets`'s "missing bucket counts as zero" rule.
 */
export function substitutedRatchetBuckets(
  current: RatchetEntries,
  baseline: RatchetEntries | null,
): string[] {
  if (!baseline) return []
  return Object.keys(current).filter((bucket) => {
    const known = new Set(baseline[bucket] ?? [])
    return (current[bucket] ?? []).some((entry) => !known.has(entry))
  })
}

function runPrettier(): string[] {
  // --list-different prints one relative path per line and exits 1 when any
  // file needs formatting — the ratchet decides pass/fail, not Prettier's
  // exit code. --no-error-on-unmatched-pattern keeps a stale .prettierignore
  // entry from turning into a hard failure here.
  const run = spawnSync(
    'npx',
    ['prettier', '--list-different', '.', '--no-error-on-unmatched-pattern'],
    { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
  )

  if (run.error) throw new Error(`Could not run Prettier: ${run.error.message}`)

  // status is null only if the process itself could not start/was killed.
  if (run.status === null) {
    throw new Error(`Prettier did not exit cleanly.\n${run.stderr ?? ''}`)
  }

  return (run.stdout ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/* ------------------------------------------------------------------------ */

/**
 * Mutation-checked self-test, same discipline as verifyLintRatchet.ts's: a
 * ratchet only ever seen to pass is indistinguishable from one that cannot
 * fail, and the failure modes that matter are the SILENT ones — a bucket
 * that grew, and a bucket that is new.
 */
function selfTest(): void {
  const files = ['server/api/a.ts', 'server/api/b.ts', 'utils/c.ts', 'app.vue']

  const buckets = bucketByTopDir(files)

  const expected = {
    server: ['server/api/a.ts', 'server/api/b.ts'],
    utils: ['utils/c.ts'],
    [ROOT_BUCKET]: ['app.vue'],
  }

  if (JSON.stringify(buckets) !== JSON.stringify(expected)) {
    throw new Error(
      `bucketByTopDir mismatch.\n  got      ${JSON.stringify(buckets)}\n  expected ${JSON.stringify(expected)}`,
    )
  }

  if (totalProblems(buckets) !== 4) {
    throw new Error(`totalProblems = ${totalProblems(buckets)}, expected 4`)
  }

  // A bucket that grew must be caught.
  const grew = grownRatchetBuckets(buckets, {
    server: ['server/api/a.ts'],
    utils: ['utils/c.ts'],
    [ROOT_BUCKET]: ['app.vue'],
  })
  if (JSON.stringify(grew) !== JSON.stringify(['server'])) {
    throw new Error(`growth not detected, got ${JSON.stringify(grew)}`)
  }

  // A bucket absent from the baseline counts as zero, so it reads as growth
  // — this is the case that would otherwise wave a whole new directory through.
  const fresh = grownRatchetBuckets(buckets, { server: ['x', 'y'] })
  if (!fresh.includes('utils') || !fresh.includes(ROOT_BUCKET)) {
    throw new Error(`a bucket missing from the baseline must count as growth`)
  }

  // Shrinking, and holding steady, must both pass.
  const shrunk = grownRatchetBuckets(buckets, {
    server: ['a', 'b', 'c'],
    utils: ['a', 'b'],
    [ROOT_BUCKET]: ['a'],
  })
  if (shrunk.length) {
    throw new Error(`shrinking must not fail, got ${JSON.stringify(shrunk)}`)
  }

  // SUBSTITUTION: fixing one baseline file while a different file in the same
  // bucket goes unformatted holds the count steady, so grownRatchetBuckets
  // alone must NOT catch it -- that is exactly the gap substitutedRatchetBuckets
  // exists to close.
  const sameCountBaseline = { server: ['server/api/a.ts', 'server/api/old.ts'] }
  const sameCountCurrent = bucketByTopDir([
    'server/api/a.ts',
    'server/api/new.ts',
  ])
  if (grownRatchetBuckets(sameCountCurrent, sameCountBaseline).length) {
    throw new Error(
      'grownRatchetBuckets unexpectedly caught a same-count substitution -- test fixture is wrong',
    )
  }
  const substituted = substitutedRatchetBuckets(
    sameCountCurrent,
    sameCountBaseline,
  )
  if (JSON.stringify(substituted) !== JSON.stringify(['server'])) {
    throw new Error(
      `substitution not detected, got ${JSON.stringify(substituted)}`,
    )
  }

  // Only removing baseline entries (no new ones) must NOT read as substitution.
  const onlyRemoved = substitutedRatchetBuckets(
    bucketByTopDir(['server/api/a.ts']),
    { server: ['server/api/a.ts', 'server/api/old.ts'] },
  )
  if (onlyRemoved.length) {
    throw new Error(
      `removing entries must not read as substitution, got ${JSON.stringify(onlyRemoved)}`,
    )
  }

  console.log('✅ verifyPrettierRatchet self-test passed.')
}

/* ------------------------------------------------------------------------ */

function main(): void {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }

  selfTest()

  const update = process.argv.includes('--update')
  const buckets = bucketByTopDir(runPrettier())
  const total = totalProblems(buckets)
  const baseline = loadRatchetBaseline<PrettierBaseline>(BASELINE)
  const baselineViolations = baseline?.violations ?? null
  const grown = grownRatchetBuckets(buckets, baselineViolations)
  const substituted = substitutedRatchetBuckets(buckets, baselineViolations)
  // Union: a bucket that grew, had a substitution, or both is worse either way.
  const worse = [...new Set([...grown, ...substituted])].sort((a, b) =>
    a.localeCompare(b),
  )

  process.stdout.write(
    `Prettier ratchet: ${total} unformatted file(s) across ${Object.keys(buckets).length} director${Object.keys(buckets).length === 1 ? 'y' : 'ies'}` +
      `${ratchetDelta(total, baseline?.total)}\n`,
  )

  if (update) {
    if (worse.length) {
      console.error(
        `Refusing to record a LARGER baseline. These directories got worse:\n` +
          worse
            .map((dir) => {
              const was = baseline?.violations[dir]?.length ?? 0
              const now = buckets[dir]?.length ?? 0
              const label = grown.includes(dir)
                ? `${was} → ${now}`
                : `${now} (same count, different file(s))`
              return `  ${dir}: ${label}`
            })
            .join('\n') +
          `\n\nFormat the new files, or explain in the PR why the baseline should rise and edit it by hand.`,
      )
      process.exitCode = 1
      return
    }

    writeRatchetBaseline(BASELINE, {
      note: ratchetNote('Prettier', SCRIPT),
      recorded: ratchetRecordedAt(),
      total,
      violations: buckets,
    } satisfies PrettierBaseline)

    process.stdout.write(`Baseline updated: ${BASELINE}\n`)
    return
  }

  if (!baseline) {
    console.error(
      `No baseline at ${BASELINE}. Record one with:\n  npm run test:prettier-ratchet -- --update`,
    )
    process.exitCode = 1
    return
  }

  if (!worse.length) {
    process.stdout.write('Prettier ratchet holds — no directory got worse.\n')
    return
  }

  console.error(
    `\n❌ ${worse.length} director${worse.length === 1 ? 'y' : 'ies'} got worse:\n`,
  )

  for (const dir of worse) {
    const was = baseline.violations[dir]?.length ?? 0
    const now = buckets[dir]?.length ?? 0
    const label = grown.includes(dir)
      ? `${was} → ${now}`
      : `${now} (same count, different file(s) -- a substitution)`
    console.error(`  ${dir}: ${label}`)

    const known = new Set(baseline.violations[dir] ?? [])
    for (const entry of (buckets[dir] ?? []).filter((e) => !known.has(e))) {
      console.error(`      ${entry}`)
    }
  }

  console.error(
    `\nThis gate never asks you to fix pre-existing formatting — only not to add` +
      `\nnew unformatted files. Run \`npx prettier --write <file>\` on the entries above,` +
      `\nor if you genuinely reformatted a bounded slice and want the file re-recorded, run:` +
      `\n  npm run test:prettier-ratchet -- --update\n`,
  )
  process.exitCode = 1
}

// Importable for the self-test without shelling out to Prettier.
if (process.argv[1]?.endsWith('verifyPrettierRatchet.ts')) {
  main()
}
