// /utils/scripts/auditMandarinLessons.ts
//
// mandarin-tutor/t-026: lesson-quality audit for the teaching layer (utils/mandarinLesson.ts,
// t-022). Checks live in utils/mandarinLessonAudit.ts (pure, no I/O); this file is the CLI
// wrapper, same split as utils/scripts/auditMandarinCatalog.ts (t-011):
//
//   npm run audit:mandarin-lesson-coverage              # fetch the LIVE served catalog
//                                                        # (GET /api/mandarin on
//                                                        # kindrobots.org by default) and
//                                                        # report
//   npm run audit:mandarin-lesson-coverage -- --strict   # exit 1 on a real lesson-build
//                                                         # regression (never on the mere
//                                                         # existence of vocabulary-only
//                                                         # cards -- see the coverage
//                                                         # section of the pure module)
//   npm run audit:mandarin-lesson-coverage -- --base-url=http://localhost:3000
//   npm run test:mandarin-lesson-coverage-selftest       # --self-test: a fixed in-memory
//                                                         # fixture, no network, no
//                                                         # database -- this is the one CI
//                                                         # runs
//
// Reuses auditMandarinCatalog.ts's precedent for why a plain HTTPS fetch against the live
// GET /api/mandarin route is the right data source here rather than re-deriving the
// catalog: that route already calls getMandarinCatalog() and returns the exact payload
// this audit wants, unauthenticated, closer to what a real client sees than importing
// server/utils/mandarinCatalog.ts (which needs Nuxt's auto-imported `$fetch`) would be.
import {
  buildMandarinLessonIndex,
  type MandarinLessonIndex,
} from '../mandarinLesson'
import {
  auditMandarinLessons,
  type MandarinLessonAuditReport,
} from '../mandarinLessonAudit'
import type { MandarinCard, MandarinCatalogPayload } from '../mandarin'

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
    pinyin: 'xiè',
    meaning: 'placeholder',
    meanings: ['placeholder'],
    kind: 'character',
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

  const vocabularyCard = fixtureCard({
    key: 'vocab-only',
    simplified: '好',
    pinyin: 'hǎo',
  })
  const structuralCard = fixtureCard({
    key: 'structural',
    simplified: '请',
    pinyin: 'qǐng',
    components: [
      {
        glyph: '青',
        role: 'phonetic',
        character: '请',
        label: '请 sound clue',
        note: 'Make Me a Hanzi decomposition',
      },
    ],
  })
  const malformedPinyinCard = fixtureCard({
    key: 'bad-pinyin',
    simplified: '坏',
    pinyin: '',
  })

  const cards: MandarinCard[] = [
    vocabularyCard,
    structuralCard,
    malformedPinyinCard,
  ]

  const index: MandarinLessonIndex = buildMandarinLessonIndex(cards)
  const report = auditMandarinLessons(cards, index)

  const has = (code: string, subject: string) =>
    report.issues.some(
      (issue) => issue.code === code && issue.subject === subject,
    )

  const expectations: [boolean, string][] = [
    [
      has('lesson-empty-pinyin-anatomy', 'bad-pinyin'),
      'expected lesson-empty-pinyin-anatomy for a card with blank pinyin',
    ],
    [
      !has('lesson-empty-pinyin-anatomy', 'structural'),
      'a well-formed pinyin card must not be flagged for empty anatomy',
    ],
    [
      report.coverage.vocabularyOnlyCards.includes('vocab-only'),
      'expected vocab-only to be reported in coverage.vocabularyOnlyCards, not as an issue',
    ],
    [
      !has('lesson-build-failed', 'vocab-only') &&
        !report.issues.some((issue) => issue.subject === 'vocab-only'),
      'a vocabulary-only lesson is a valid, honest outcome -- it must never itself be an issue',
    ],
    [
      report.coverage.structural === 1,
      'expected exactly one structural card in the fixture',
    ],
    [
      report.coverage.vocabularyOnly === 2,
      'expected exactly two vocabulary-only cards (vocab-only, bad-pinyin) in the fixture',
    ],
    [
      report.totals.cards === cards.length,
      'totals.cards must match the input card count',
    ],
  ]

  for (const [passed, message] of expectations) {
    if (!passed) failures.push(message)
  }

  if (failures.length) {
    console.error('❌ Mandarin lesson-coverage self-test FAILED:')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
  }

  console.log(
    `✅ Mandarin lesson-coverage self-test passed (${expectations.length} fixture checks).`,
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

function printReport(report: MandarinLessonAuditReport): void {
  const output = {
    generatedAt: new Date().toISOString(),
    mode: strict ? 'strict' : 'report',
    totals: report.totals,
    byCode: report.byCode,
    coverage: report.coverage,
    issues: report.issues,
  }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
}

async function main(): Promise<void> {
  const catalog = await fetchLiveCatalog()
  const index = buildMandarinLessonIndex(catalog.cards)
  const report = auditMandarinLessons(catalog.cards, index)

  printReport(report)

  if (strict && report.totals.issues > 0) {
    throw new Error(
      `Strict Mandarin lesson-coverage audit failed: ${report.totals.issues} issue(s) across ${Object.keys(report.byCode).length} categor${Object.keys(report.byCode).length === 1 ? 'y' : 'ies'}. (${report.coverage.vocabularyOnly} vocabulary-only card(s) is not itself a failure -- see coverage in the report above.)`,
    )
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
