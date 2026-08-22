// utils/scripts/verifyAcademyFailureModeCoverage.ts
//
// ai-art-academy/t-071: historical t-025 backfilled a bespoke `failureMode`
// ("what tends to go wrong" note for the Try It beat) for every movement that
// existed when it closed, but the curriculum has since expanded and nothing
// re-checked the denominator. academy-style-detail.vue falls back to a
// generic mode-level note for any style without one, so a gap is silent in
// the UI (the Try It beat still renders) and easy to lose track of as new
// styles are added. This is a lightweight coverage contract, not a schema
// check: it reports the bespoke-vs-fallback split and fails only when a
// style has no `failureMode` and isn't listed in the exceptions below with a
// documented reason — so a newly-added style surfaces explicitly instead of
// silently shrinking the coverage percentage.
//
// Run: npm run test:academy-failuremode-coverage

import { academyStyles } from '../../stores/seeds/academyStyles'

// Slugs intentionally left on the generic mode-level fallback, with why.
// Empty today (t-071 brought coverage to 47/47) — add an entry here only
// with a documented policy reason, never to silence a routine gap.
const DOCUMENTED_FALLBACK_EXCEPTIONS: Record<string, string> = {}

function main(): void {
  const missing: string[] = []
  const undocumentedExceptions: string[] = []

  for (const style of academyStyles) {
    const hasFailureMode =
      typeof style.failureMode === 'string' && style.failureMode.trim() !== ''
    if (!hasFailureMode) missing.push(style.slug)
  }

  for (const slug of Object.keys(DOCUMENTED_FALLBACK_EXCEPTIONS)) {
    if (!missing.includes(slug)) {
      undocumentedExceptions.push(
        `${slug}: listed in DOCUMENTED_FALLBACK_EXCEPTIONS but already has a failureMode — remove the stale exception entry`,
      )
    }
  }

  const trulyMissing = missing.filter(
    (slug) => !(slug in DOCUMENTED_FALLBACK_EXCEPTIONS),
  )

  const total = academyStyles.length
  const covered = total - missing.length
  const pct = total === 0 ? 100 : Math.round((covered / total) * 100)

  if (trulyMissing.length || undocumentedExceptions.length) {
    console.error(
      `Academy failureMode coverage contract failed (${covered}/${total} styles, ${pct}% bespoke):`,
    )
    for (const slug of trulyMissing) {
      console.error(
        `- ${slug}: no failureMode set and not in DOCUMENTED_FALLBACK_EXCEPTIONS. Add a bespoke ` +
          '"what tends to go wrong" note grounded in this lesson\'s remix template, or add a ' +
          'documented exception if the generic fallback is the deliberate choice.',
      )
    }
    for (const message of undocumentedExceptions) console.error(`- ${message}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Academy failureMode coverage contract passed: ${covered}/${total} styles (${pct}%) have a bespoke failureMode` +
      (Object.keys(DOCUMENTED_FALLBACK_EXCEPTIONS).length
        ? `; ${Object.keys(DOCUMENTED_FALLBACK_EXCEPTIONS).length} documented exception(s) rely on the generic mode-level fallback.`
        : '.'),
  )
}

main()
