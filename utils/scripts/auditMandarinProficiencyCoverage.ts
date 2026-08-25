// /utils/scripts/auditMandarinProficiencyCoverage.ts
//
// mandarin-tutor/t-008: reports catalog coverage against the currently
// applicable Mandarin proficiency standard (HSK 3.0 by default -- see
// utils/mandarinProficiencyStandards.ts). Checks live in
// utils/mandarinProficiencyCoverage.ts (pure, no I/O); this file supplies
// data to them two ways, matching utils/scripts/auditMandarinCatalog.ts's
// established shape:
//
//   npm run audit:mandarin-proficiency-coverage
//     Live report: fetches the served catalog (GET /api/mandarin) plus the
//     pinned upstream source's raw per-level entry counts, for every level
//     of the standard -- including levels the catalog does not source yet.
//
//   npm run audit:mandarin-proficiency-coverage -- --strict
//     Exits 1 if a SOURCED level's card count is under half its reference
//     size (a genuine regression). Never fails on an unsourced level --
//     that is expected, measured future work, not a defect.
//
//   npm run test:mandarin-proficiency-coverage-selftest
//     --self-test: a fixed in-memory fixture, no network, no database --
//     this is the one CI runs.
import type { MandarinCard, MandarinCatalogPayload } from '../mandarin'
import {
  computeMandarinProficiencyCoverage,
  type MandarinProficiencyCoverageReport,
} from '../mandarinProficiencyCoverage'
import {
  DEFAULT_MANDARIN_PROFICIENCY_STANDARD,
  type MandarinProficiencyStandard,
} from '../mandarinProficiencyStandards'

const selfTest = process.argv.includes('--self-test')
const strict = process.argv.includes('--strict')
const baseUrlArg = process.argv.find((arg) => arg.startsWith('--base-url='))
const baseUrl = baseUrlArg
  ? baseUrlArg.slice('--base-url='.length)
  : (process.env.MANDARIN_AUDIT_BASE_URL ?? 'https://kindrobots.org')

/* -------------------------------------------------------------------------- */
/* self-test -- the check logic, provable without a database or the network   */
/* -------------------------------------------------------------------------- */

function fixtureCard(overrides: Partial<MandarinCard>): MandarinCard {
  return {
    key: 'fixture:x',
    simplified: 'x',
    pinyin: 'xie',
    meaning: 'placeholder',
    meanings: ['placeholder'],
    kind: 'word',
    partsOfSpeech: [],
    classifiers: [],
    categories: [],
    components: [],
    historyStatus: 'pending',
    source: { label: 'fixture', version: 'fixture' },
    ...overrides,
  }
}

if (selfTest) {
  const failures: string[] = []

  const cards: MandarinCard[] = [
    fixtureCard({
      key: 'l1-a',
      hskLevel: 1,
      historyStatus: 'starter',
      components: [{ glyph: 'x', role: 'radical', label: 'r' }],
    }),
    fixtureCard({ key: 'l1-b', hskLevel: 1 }),
    fixtureCard({ key: 'l2-a', hskLevel: 2 }),
    fixtureCard({ key: 'no-level' }),
  ]

  const report = computeMandarinProficiencyCoverage(cards, {
    upstreamCumulativeVocabulary: { 3: 2225 },
  })

  const byLevel = (level: number) =>
    report.levels.find((entry) => entry.level === level)

  const expectations: [boolean, string][] = [
    [byLevel(1)?.sourced === true, 'level 1 should be sourced (has cards)'],
    [byLevel(1)?.cardCount === 2, 'level 1 should count 2 cards'],
    [
      byLevel(1)?.withCharacterHistory === 1,
      'level 1 should count 1 card with character history',
    ],
    [
      byLevel(1)?.withComponentBreakdown === 1,
      'level 1 should count 1 card with a component breakdown',
    ],
    [byLevel(2)?.sourced === true, 'level 2 should be sourced'],
    [byLevel(3)?.sourced === false, 'level 3 should not be sourced (no cards)'],
    [
      byLevel(3)?.upstreamCumulativeVocabulary === 2225,
      'level 3 should carry the supplied upstream count',
    ],
    [byLevel(7)?.sourced === false, 'level 7 should not be sourced'],
    [
      report.totals.cardsWithLevel === 3,
      'totals.cardsWithLevel should count the 3 leveled cards',
    ],
    [
      report.totals.cardsWithoutLevel === 1,
      'totals.cardsWithoutLevel should count the 1 unleveled card',
    ],
    [
      report.totals.sourcedLevelCount === 2,
      'totals.sourcedLevelCount should be 2 (levels 1 and 2)',
    ],
    [
      report.totals.totalLevelCount ===
        DEFAULT_MANDARIN_PROFICIENCY_STANDARD.levels.length,
      'totalLevelCount should match the standard',
    ],
    [
      report.nextTargets.length ===
        report.totals.totalLevelCount - report.totals.sourcedLevelCount,
      'nextTargets should list every unsourced level',
    ],
    [
      report.nextTargets[0]?.includes('Level 3') === true,
      'the lowest unsourced level should sort first',
    ],
  ]

  for (const [passed, message] of expectations) {
    if (!passed) failures.push(message)
  }

  if (failures.length) {
    console.error('❌ Mandarin proficiency-coverage self-test FAILED:')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
  }

  console.log(
    `✅ Mandarin proficiency-coverage self-test passed (${expectations.length} checks).`,
  )
  process.exit(0)
}

/* -------------------------------------------------------------------------- */
/* live report                                                                */
/* -------------------------------------------------------------------------- */

type CatalogResponse = {
  success: boolean
  message?: string
  data: MandarinCatalogPayload | null
}

async function fetchLiveCatalog(): Promise<MandarinCatalogPayload> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/mandarin`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`GET ${url} -> HTTP ${response.status}`)
  }
  const body = (await response.json()) as CatalogResponse
  if (!body.success || !body.data) {
    throw new Error(
      `GET ${url} responded without a usable catalog: ${body.message ?? 'no message'}`,
    )
  }
  return body.data
}

// The upstream source's per-level files are plain static JSON served over
// HTTPS -- reachable directly, same as server/utils/mandarinCatalog.ts's own
// fetchLevel, just without the Nuxt-only $fetch helper (this runs as a plain
// tsx process, not inside Nitro).
async function fetchUpstreamCumulativeCount(
  standard: MandarinProficiencyStandard,
  level: number,
): Promise<number | undefined> {
  const repoPath = standard.sourceUrl.replace('https://github.com/', '')
  const url = `https://raw.githubusercontent.com/${repoPath}/${standard.sourceCommit}/wordlists/inclusive/new/${level}.min.json`
  try {
    const response = await fetch(url)
    if (!response.ok) return undefined
    const entries = (await response.json()) as unknown
    return Array.isArray(entries) ? entries.length : undefined
  } catch {
    return undefined
  }
}

function printReport(report: MandarinProficiencyCoverageReport): void {
  const output = {
    generatedAt: new Date().toISOString(),
    mode: strict ? 'strict' : 'report',
    standard: report.standard,
    levels: report.levels,
    totals: report.totals,
    nextTargets: report.nextTargets,
  }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
}

async function main(): Promise<void> {
  const standard = DEFAULT_MANDARIN_PROFICIENCY_STANDARD

  const [catalog, upstreamCounts] = await Promise.all([
    fetchLiveCatalog(),
    Promise.all(
      standard.levels.map(
        async (levelMeta) =>
          [
            levelMeta.level,
            await fetchUpstreamCumulativeCount(standard, levelMeta.level),
          ] as const,
      ),
    ),
  ])

  const upstreamCumulativeVocabulary = Object.fromEntries(
    upstreamCounts.filter(
      (entry): entry is [number, number] => typeof entry[1] === 'number',
    ),
  ) as Partial<Record<number, number>>

  const report = computeMandarinProficiencyCoverage(catalog.cards, {
    standard,
    upstreamCumulativeVocabulary,
  })

  printReport(report)

  if (strict) {
    const regressions = report.levels.filter(
      (entry) =>
        entry.sourced &&
        typeof entry.referenceCumulativeVocabulary === 'number' &&
        entry.cardCount < entry.referenceCumulativeVocabulary / 2,
    )
    if (regressions.length) {
      throw new Error(
        `Strict Mandarin proficiency-coverage check failed: ${regressions
          .map(
            (entry) =>
              `${entry.label} has ${entry.cardCount} cards, under half its ${entry.referenceCumulativeVocabulary}-word reference size`,
          )
          .join('; ')}.`,
      )
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
