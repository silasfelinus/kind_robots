// /utils/scripts/publishFacetContent.ts
//
// Write authored descriptions and flavor text onto Facets, so the catalog audit
// stops holding them out of art generation.
//
//   npx tsx utils/scripts/publishFacetContent.ts                 # dry run
//   npx tsx utils/scripts/publishFacetContent.ts --apply
//   npx tsx utils/scripts/publishFacetContent.ts --apply --taxonomy ANIMAL
//
//   export KR_API_BASE=https://kindrobots.org
//   export KR_API_TOKEN=<admin token>
//
// WHY
// ---
// `generate_facet_art.ts` holds 630 Facets back from art because they carry
// nothing but a title. That is the correct call -- `MATERIAL "Adamantium"` with
// no description gives an image model nothing, and 630 of those would render
// 630 generic blobs. The unlock is content, not a bigger art run.
//
// IDEMPOTENT, AND FAIL-CLOSED ON OVERWRITES
// -----------------------------------------
// A Facet that already has a description is SKIPPED, not overwritten. The point
// is to fill blanks; silently replacing curated prose with a batch file would
// be the kind of quiet damage nobody notices for a month. `--force` exists for
// the case where a batch is a deliberate revision, and it names every row it
// replaces on the way through.
//
// The audit clears a row on description OR flavorText OR examples, so a
// description alone is enough. Flavor text is written where the entry has one
// and left off where it would only be padding.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

type Entry = {
  facetId: number
  slug?: string
  title: string
  taxonomy: string
  description: string
  flavorText?: string
}

type Batch = {
  version: number
  taxonomy?: string
  note?: string
  entries: Entry[]
}

const APPLY = process.argv.includes('--apply')
const FORCE = process.argv.includes('--force')
const base = (process.env.KR_API_BASE || 'https://kindrobots.org').replace(/\/$/, '')
const token = process.env.KR_API_TOKEN || ''
const dir = join(process.cwd(), 'config', 'facet-content')

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}

export function loadFacetContentBatches(): Entry[] {
  if (!existsSync(dir)) return []
  const entries: Entry[] = []
  const seen = new Set<number>()
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    const batch = JSON.parse(readFileSync(join(dir, name), 'utf8')) as Batch
    if (batch.version !== 1) {
      throw new Error(`${name}: unexpected version ${batch.version}.`)
    }
    for (const entry of batch.entries || []) {
      if (seen.has(entry.facetId)) {
        throw new Error(`${name}: facet ${entry.facetId} appears twice in the corpus.`)
      }
      seen.add(entry.facetId)
      entries.push(entry)
    }
  }
  return entries
}

const clean = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : ''

async function liveFacets(): Promise<Map<number, Record<string, unknown>>> {
  const rows: Array<Record<string, unknown>> = []
  for (;;) {
    const response = await fetch(`${base}/api/facets?take=250&skip=${rows.length}`)
    if (!response.ok) throw new Error(`facets -> ${response.status}`)
    const body = (await response.json()) as { data?: unknown }
    const page = (body?.data ?? body) as Array<Record<string, unknown>>
    if (!Array.isArray(page) || !page.length) break
    rows.push(...page)
    if (rows.length > 6000) break
  }
  return new Map(rows.map((row) => [Number(row.id), row]))
}

async function patch(entry: Entry): Promise<void> {
  const payload: Record<string, string> = { description: entry.description }
  if (entry.flavorText) payload.flavorText = entry.flavorText
  const response = await fetch(`${base}/api/facets/${entry.facetId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`facet ${entry.facetId} "${entry.title}": ${response.status} ${text.slice(0, 200)}`)
  }
}

async function main(): Promise<void> {
  if (APPLY && !token) throw new Error('--apply requires KR_API_TOKEN.')
  const only = arg('taxonomy')?.toUpperCase()
  const all = loadFacetContentBatches()
  const entries = only ? all.filter((e) => e.taxonomy.toUpperCase() === only) : all
  console.log(`Authored entries: ${all.length}${only ? ` (${entries.length} in ${only})` : ''}`)

  const live = await liveFacets()

  const work: Entry[] = []
  const missing: string[] = []
  const drifted: string[] = []
  const alreadyWritten: string[] = []

  for (const entry of entries) {
    const row = live.get(entry.facetId)
    if (!row) {
      missing.push(`#${entry.facetId} "${entry.title}" is not in the live catalog`)
      continue
    }
    // A batch keyed on the wrong id would write a wolf's description onto a
    // teapot, and nothing downstream would ever flag it.
    if (clean(row.title) !== clean(entry.title)) {
      drifted.push(
        `#${entry.facetId}: batch says "${entry.title}", live says "${clean(row.title)}"`,
      )
      continue
    }
    if (clean(row.description) && !FORCE) {
      alreadyWritten.push(`#${entry.facetId} "${entry.title}"`)
      continue
    }
    if (clean(row.description) && FORCE) {
      console.log(`  --force replacing #${entry.facetId} "${entry.title}"`)
    }
    work.push(entry)
  }

  if (drifted.length) {
    console.error(`\nTitle drift on ${drifted.length} row(s) — refusing to write:`)
    for (const line of drifted) console.error(`  - ${line}`)
    process.exitCode = 1
    return
  }
  if (missing.length) {
    console.error(`\n${missing.length} row(s) not found — refusing to write:`)
    for (const line of missing) console.error(`  - ${line}`)
    process.exitCode = 1
    return
  }

  console.log(
    `${work.length} to write, ${alreadyWritten.length} already had a description and were skipped.`,
  )
  if (!APPLY) {
    console.log('\nDry run. Add --apply to write.')
    return
  }

  let written = 0
  const failures: string[] = []
  for (const entry of work) {
    try {
      await patch(entry)
      written += 1
      if (written % 50 === 0) console.log(`  … ${written}/${work.length}`)
    } catch (error) {
      failures.push(String(error instanceof Error ? error.message : error))
    }
  }
  console.log(`\nWrote ${written} of ${work.length}.`)
  if (failures.length) {
    console.error(`${failures.length} failed:`)
    for (const failure of failures.slice(0, 20)) console.error(`  - ${failure}`)
    process.exitCode = 1
  }
}

if (process.argv[1]?.includes('publishFacetContent')) await main()
