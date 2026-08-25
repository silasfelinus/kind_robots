// /utils/scripts/auditMandarinCatalog.ts
//
// mandarin-tutor/t-011: content-quality and provenance audits for the
// Mandarin Tutor catalog. Checks live in utils/mandarinContentAudit.ts (pure,
// no I/O); this file is the CLI wrapper that supplies data to them two ways:
//
//   npm run audit:mandarin-provenance             # fetch the LIVE served
//                                                  # catalog (GET /api/mandarin
//                                                  # on kindrobots.org by
//                                                  # default) and report
//   npm run audit:mandarin-provenance -- --strict  # exit 1 if any issues found
//   npm run audit:mandarin-provenance -- --base-url=http://localhost:3000
//   npm run test:mandarin-content-audit            # --self-test: a fixed
//                                                  # in-memory fixture, no
//                                                  # network, no database --
//                                                  # this is the one CI runs
//
// WHY A PLAIN HTTPS FETCH INSTEAD OF IMPORTING THE SERVER CATALOG BUILDER
// -------------------------------------------------------------------------
// server/utils/mandarinCatalog.ts and mandarinCharacterData.ts call Nuxt's
// auto-imported `$fetch`, which only exists inside the Nuxt/Nitro runtime --
// not in a plain `tsx` process. GET /api/mandarin (server/api/mandarin/index.get.ts)
// already calls getMandarinCatalog() and returns the exact payload this audit
// wants, unauthenticated, so hitting it over HTTPS is both simpler and closer
// to what a real client sees than re-deriving the catalog here would be. This
// follows the same "plain HTTPS against kindrobots.org is a normal, working
// verification path from this sandbox" precedent documented in this repo's
// AGENTS.md for other post-deploy checks.
import {
  BUILT_IN_SET_TERMS,
  CURATED_MANDARIN_CARDS,
  type MandarinCard,
  type MandarinCatalogPayload,
  type MandarinStudySet,
} from '../mandarin'
import {
  auditMandarinCatalog,
  type MandarinAuditReport,
} from '../mandarinContentAudit'

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

  const goodCard = fixtureCard({ key: 'good', simplified: '好', pinyin: 'hǎo' })
  const badPinyinCard = fixtureCard({
    key: 'bad-pinyin',
    simplified: '坏',
    pinyin: 'h4o!!',
  })
  const missingAudioCard = fixtureCard({
    key: 'no-audio',
    simplified: '',
    pinyin: 'wú',
  })
  const matureMeaningCard = fixtureCard({
    key: 'mature',
    simplified: '色',
    pinyin: 'sè',
    meaning: 'nsfw content',
    meanings: ['nsfw content'],
  })
  const ungroundedEtymologyCard = fixtureCard({
    key: 'ungrounded',
    simplified: '青',
    pinyin: 'qīng',
    components: [{ glyph: '青', role: 'phonetic', label: 'sound component' }],
  })
  const claimedButEmptyHistoryCard = fixtureCard({
    key: 'empty-history',
    simplified: '空',
    pinyin: 'kōng',
    historyStatus: 'starter',
    history: undefined,
  })

  const cards: MandarinCard[] = [
    goodCard,
    badPinyinCard,
    missingAudioCard,
    matureMeaningCard,
    ungroundedEtymologyCard,
    claimedButEmptyHistoryCard,
  ]

  const sets: MandarinStudySet[] = [
    {
      id: 'demo-set',
      label: 'Demo',
      description: 'demo',
      cardKeys: ['good', 'this-key-does-not-exist'],
    },
  ]

  const builtInSetTerms = { animals: ['好', 'this-term-matches-nothing'] }

  const duplicateCurated: MandarinCard[] = [
    fixtureCard({ key: 'curated:重', simplified: '重', pinyin: 'zhòng' }),
    fixtureCard({ key: 'curated:重', simplified: '重', pinyin: 'chóng' }),
  ]

  const report = auditMandarinCatalog({
    cards,
    sets,
    builtInSetTerms,
    curatedCards: duplicateCurated,
  })

  const has = (code: string, subject: string) =>
    report.issues.some((issue) => issue.code === code && issue.subject === subject)

  const expectations: [boolean, string][] = [
    [has('malformed-pinyin', 'bad-pinyin'), 'expected malformed-pinyin for bad-pinyin'],
    [!has('malformed-pinyin', 'good'), 'good card must not be flagged for pinyin'],
    [has('missing-audio-contract', 'no-audio'), 'expected missing-audio-contract for no-audio'],
    [has('adult-or-irrelevant-meaning', 'mature'), 'expected adult-or-irrelevant-meaning for mature'],
    [
      has('unsupported-etymology-claim', 'ungrounded'),
      'expected unsupported-etymology-claim for an unsourced phonetic component',
    ],
    [
      has('unsupported-etymology-claim', 'empty-history'),
      'expected unsupported-etymology-claim for historyStatus=starter with empty history',
    ],
    [
      has('orphan-set-card-key', 'demo-set'),
      'expected orphan-set-card-key for demo-set\'s dangling cardKey',
    ],
    [
      has('orphan-set-term', 'animals'),
      'expected orphan-set-term for a BUILT_IN_SET_TERMS entry matching no card',
    ],
    [
      has('duplicate-curated-seed', '重'),
      'expected duplicate-curated-seed for the repeated 重 fixture',
    ],
    [report.totals.cards === cards.length, 'totals.cards must match the input card count'],
  ]

  for (const [passed, message] of expectations) {
    if (!passed) failures.push(message)
  }

  // A real, non-crashing pass over the actual static curated data + built-in
  // set terms -- the fixture cases above prove each rule fires; this proves
  // the rules also run clean against the real hand-authored data they exist
  // to guard, without needing the network to fetch the full live catalog.
  try {
    const realReport = auditMandarinCatalog({
      cards: CURATED_MANDARIN_CARDS,
      sets: [],
      curatedCards: CURATED_MANDARIN_CARDS,
    })
    const realDuplicates = realReport.issues.filter(
      (issue) => issue.code === 'duplicate-curated-seed',
    )
    if (realDuplicates.length) {
      failures.push(
        `CURATED_SEEDS has ${realDuplicates.length} real duplicate(s): ${realDuplicates
          .map((issue) => issue.subject)
          .join(', ')}`,
      )
    }
  } catch (error: unknown) {
    failures.push(
      `auditMandarinCatalog threw against the real curated data: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  if (failures.length) {
    console.error('❌ Mandarin content-audit self-test FAILED:')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
  }

  console.log(
    `✅ Mandarin content-audit self-test passed (${expectations.length} fixture checks, ` +
      `${CURATED_MANDARIN_CARDS.length} real curated cards clean of duplicates).`,
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
    throw new Error(`GET ${url} responded without a usable catalog: ${body.message ?? 'no message'}`)
  }
  return body.data
}

function printReport(report: MandarinAuditReport): void {
  const output = {
    generatedAt: new Date().toISOString(),
    mode: strict ? 'strict' : 'report',
    totals: report.totals,
    byCode: report.byCode,
    issues: report.issues,
  }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
}

async function main(): Promise<void> {
  const catalog = await fetchLiveCatalog()
  const report = auditMandarinCatalog({
    cards: catalog.cards,
    sets: catalog.sets,
    builtInSetTerms: BUILT_IN_SET_TERMS,
    curatedCards: CURATED_MANDARIN_CARDS,
  })

  printReport(report)

  if (strict && report.totals.issues > 0) {
    throw new Error(
      `Strict Mandarin content audit failed: ${report.totals.issues} issue(s) across ${Object.keys(report.byCode).length} categor${Object.keys(report.byCode).length === 1 ? 'y' : 'ies'}.`,
    )
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
