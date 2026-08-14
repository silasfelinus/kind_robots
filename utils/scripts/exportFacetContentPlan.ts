// /utils/scripts/exportFacetContentPlan.ts
//
// The authoring input for facet catalog content. Offline: public API only.
//
//   npx tsx utils/scripts/exportFacetContentPlan.ts                 # summary
//   npx tsx utils/scripts/exportFacetContentPlan.ts --taxonomy ANIMAL
//   npx tsx utils/scripts/exportFacetContentPlan.ts --out plan.json
//
// WHY
// ---
// 630 Facets are held out of art generation by the catalog audit, and the
// reason is almost always the same one wearing three different names:
//
//   unreviewed-legacy-record   randomizable, but no description, no flavor
//                              text, no examples, no art prompt, imported at
//                              sourceRank >= 80
//   underspecified-title       one word of ten characters or fewer, and again
//                              no description, no flavor text, no examples
//   sentence-title             the whole thing is a nine-plus word sentence
//                              crammed into the title field
//
// The first two say the row is a bare word. `MATERIAL "Adamantium"` with no
// description gives an image model nothing; ask it for 630 of those and you get
// 630 generic blobs and a catalog that looks worse than the empty one. So the
// gate is right to hold them, and the unlock is not an art run -- it is
// somebody writing what these things ARE.
//
// This script is the input to that writing. It emits every held Facet with the
// context an author needs (taxonomy, group, weight, siblings that already have
// descriptions to match tone against) and, deliberately, no generated text.
//
// WHAT IT LEAVES ALONE
// --------------------
// `sentence-title` is not fixable by adding a description -- the rule is purely
// a word count on the title. Those rows need the sentence moved INTO the
// description and a short handle put in the title, which is a rename, so they
// are reported separately rather than mixed into the writing queue.
//
// Whole taxonomies that do not want art at all are not this script's problem
// either. COLOR already demonstrates the mechanism: 180 rows, zero art, all 180
// `artRequired: false`. A taxonomy where the name IS the content gets switched
// off, not described.
import { writeFileSync } from 'node:fs'
import { auditFacetCatalog, type FacetAuditInput } from './../../utils/facetCatalogAudit'

const BLOCKING_REASON_CODES = new Set([
  'missing-profile',
  'duplicate-title',
  'prompt-cargo-cult',
  'parenthetical-genre',
  'composite-genre',
  'setting-shaped-genre',
  'subject-shaped-genre',
  'occupation-shaped-personality',
  'worldview-shaped-personality',
  'quirk-shaped-backstory',
  'sentence-title',
  'underspecified-title',
  'unreviewed-legacy-record',
])

/** Reasons a description actually clears. */
const CONTENT_FIXABLE = new Set([
  'underspecified-title',
  'unreviewed-legacy-record',
])

type Row = Record<string, unknown>

const base = (process.env.KR_API_BASE || 'https://kindrobots.org').replace(/\/$/, '')

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}

const clean = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : ''

function hasArt(row: Row): boolean {
  return Boolean(
    clean(row.imagePath) ||
      clean(row.cardPath) ||
      clean(row.heroPath) ||
      clean(row.iconPath) ||
      (row.artImageId !== null && row.artImageId !== undefined),
  )
}

/** `/api/facets` caps take at 250, so it is walked rather than asked once. */
async function allFacets(): Promise<Row[]> {
  const rows: Row[] = []
  for (;;) {
    const response = await fetch(`${base}/api/facets?take=250&skip=${rows.length}`)
    if (!response.ok) throw new Error(`facets -> ${response.status}`)
    const body = (await response.json()) as { data?: unknown }
    const page = (body?.data ?? body) as Row[]
    if (!Array.isArray(page) || !page.length) break
    rows.push(...page)
    if (rows.length > 6000) break
  }
  return rows
}

function toAuditInput(row: Row): FacetAuditInput {
  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    slug: (row.slug as string) ?? null,
    taxonomy: (row.taxonomy as FacetAuditInput['taxonomy']) ?? null,
    groupKey: (row.groupKey as string) ?? null,
    groupLabel: (row.groupLabel as string) ?? null,
    isRandomizable: Boolean(row.isRandomizable),
    randomWeight: Number(row.randomWeight ?? 0),
    sourceRank:
      row.sourceRank === null || row.sourceRank === undefined
        ? null
        : Number(row.sourceRank),
    description: (row.description as string) ?? null,
    flavorText: (row.flavorText as string) ?? null,
    examples: (row.examples as string) ?? null,
    artPrompt: (row.artPrompt as string) ?? null,
    aliases: [],
    artBacked: hasArt(row),
  }
}

async function main(): Promise<void> {
  const rows = await allFacets()
  const report = auditFacetCatalog(rows.map(toAuditInput))
  const byId = new Map(rows.map((row) => [Number(row.id), row]))

  const held = new Map<number, string[]>()
  for (const candidate of report.candidates) {
    const row = byId.get(candidate.id)
    if (!row || hasArt(row) || row.artRequired === false) continue
    const codes = candidate.reasons
      .map((reason) => reason.code)
      .filter((code) => BLOCKING_REASON_CODES.has(code))
    if (codes.length) held.set(candidate.id, codes)
  }

  const writable: Row[] = []
  const renameFirst: Row[] = []
  const otherwiseBlocked: Row[] = []

  for (const [id, codes] of held) {
    const row = byId.get(id)
    if (!row) continue
    const entry = { ...row, __reasons: codes }
    if (codes.includes('sentence-title')) renameFirst.push(entry)
    else if (codes.every((code) => CONTENT_FIXABLE.has(code))) writable.push(entry)
    else otherwiseBlocked.push(entry)
  }

  const taxonomyOf = (row: Row) => String(row.taxonomy ?? '?')
  const only = arg('taxonomy')
  const selected = only
    ? writable.filter((row) => taxonomyOf(row) === only.toUpperCase())
    : writable

  // Siblings that already carry a description, so an author can match the
  // catalog's existing register instead of inventing a house style per batch.
  const exemplars = new Map<string, Row[]>()
  for (const row of rows) {
    if (!clean(row.description)) continue
    const taxonomy = taxonomyOf(row)
    const list = exemplars.get(taxonomy) ?? []
    if (list.length < 4) list.push(row)
    exemplars.set(taxonomy, list)
  }

  const counts = new Map<string, number>()
  for (const row of writable) {
    const taxonomy = taxonomyOf(row)
    counts.set(taxonomy, (counts.get(taxonomy) ?? 0) + 1)
  }

  console.log(
    `Held by the audit: ${held.size}\n` +
      `  needs writing (a description clears it): ${writable.length}\n` +
      `  needs a rename first (sentence-title):   ${renameFirst.length}\n` +
      `  blocked for another reason:              ${otherwiseBlocked.length}\n`,
  )
  console.log('needs writing, by taxonomy:')
  for (const [taxonomy, count] of [...counts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)}  ${taxonomy}`)
  }

  if (otherwiseBlocked.length) {
    console.log('\nblocked for another reason (decide, do not describe):')
    for (const row of otherwiseBlocked) {
      console.log(
        `  ${taxonomyOf(row).padEnd(20)} #${row.id} "${row.title}" — ${(row.__reasons as string[]).join(', ')}`,
      )
    }
  }

  const out = arg('out')
  if (!out) {
    console.log('\nNo --out given, so nothing was written.')
    return
  }

  writeFileSync(
    out,
    JSON.stringify(
      {
        generatedFrom: base,
        counts: Object.fromEntries(counts),
        exemplars: Object.fromEntries(
          [...exemplars].map(([taxonomy, list]) => [
            taxonomy,
            list.map((row) => ({
              title: row.title,
              description: row.description,
              flavorText: row.flavorText,
            })),
          ]),
        ),
        writable: selected.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          taxonomy: row.taxonomy,
          groupKey: row.groupKey,
          groupLabel: row.groupLabel,
          reasons: row.__reasons,
        })),
        renameFirst: renameFirst.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          taxonomy: row.taxonomy,
        })),
      },
      null,
      2,
    ),
  )
  console.log(`\nWrote ${selected.length} writable entries to ${out}.`)
}

await main()
