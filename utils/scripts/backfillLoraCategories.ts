// Classify the existing LoRA catalog into loraCategory buckets.
//
// Resource.loraCategory landed empty on ~1,500 rows, and an empty category is
// an empty randomizer pool: "{character} running in {style}" resolves to
// nothing until something fills them in. This is the one-time pass that does
// it from what the catalog already knows -- names, labels, descriptions and
// trigger words -- plus, with --fetch-tags, the Civitai model tags for rows
// that recorded a civitaiModelId.
//
// WHAT IT WILL NOT DO: overwrite a HUMAN decision. That is the guarantee that
// makes this safe to re-run, and the reason the editor's corrections survive
// the next catalog scan. --recheck refreshes rows previously classified by an
// earlier CIVITAI/HEURISTIC pass; without it, only unclassified rows are
// touched.
//
// DATABASE_URL and CIVITAI_TOKEN are read from the repo's own .env (this
// script imports dotenv before anything else), so neither needs exporting into
// a shell. That matters for the token specifically: a secret that has to be
// pasted into a terminal to run a routine sweep is a secret in three shell
// histories by the end of the week. Put it in .env once -- see .env.example.
//
// Usage, from the repo root:
//   npm run backfill:lora-categories                            # dry run
//   npm run backfill:lora-categories -- --apply
//   npm run backfill:lora-categories -- --fetch-tags            # dry run, asks Civitai
//   npm run backfill:lora-categories -- --fetch-tags --apply
//   npm run backfill:lora-categories -- --recheck --apply
//   npm run backfill:lora-categories -- --reset-heuristic --apply
//
// --reset-heuristic clears every CIVITAI/HEURISTIC classification back to NULL,
// leaving HUMAN decisions alone. It exists because a classifier change can
// invalidate a whole prior run -- the 2026-09-22 pass wrote 1,004 rows off the
// description field and got character LoRAs filed as CLOTHING -- and "start
// from unclassified" is a cleaner recovery than re-deciding row by row.
import 'dotenv/config'
import {
  PrismaClient,
  type Prisma,
} from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { civitaiTagNames, resolveCivitaiIds } from './../civitaiIds'
import {
  LORA_CATEGORIES,
  canReclassify,
  inferLoraCategory,
  type LoraCategory,
} from './../loraCategory'

const databaseUrl: string = process.env.DATABASE_URL ?? ''
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const recheck = args.includes('--recheck')
const resetHeuristic = args.includes('--reset-heuristic')
const fetchTags = args.includes('--fetch-tags')
const civitaiToken = process.env.CIVITAI_TOKEN ?? ''

const CIVITAI_MODEL = 'https://civitai.com/api/v1/models/'
// Civitai rate-limits, and a catalog sweep is not urgent. One request every
// 350ms is well inside what the scan_loras.py lookups already use.
const FETCH_DELAY_MS = 350

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function civitaiTags(modelId: number): Promise<string[] | null> {
  try {
    const response = await fetch(`${CIVITAI_MODEL}${modelId}`, {
      headers: civitaiToken
        ? { Authorization: `Bearer ${civitaiToken}` }
        : undefined,
    })
    if (!response.ok) return null
    const payload = (await response.json()) as { tags?: unknown }
    return civitaiTagNames(payload.tags)
  } catch {
    return null
  }
}

async function resetHeuristicClassifications(): Promise<void> {
  const where: Prisma.ResourceWhereInput = {
    resourceType: { in: ['LORA', 'LYCORIS'] },
    loraCategory: { not: null },
    OR: [
      { loraCategorySource: { not: 'HUMAN' } },
      { loraCategorySource: null },
    ],
  }

  const doomed = await prisma.resource.findMany({
    where,
    select: {
      id: true,
      name: true,
      customLabel: true,
      loraCategory: true,
      loraCategorySource: true,
    },
    orderBy: { id: 'asc' },
  })

  console.log(
    `${doomed.length} non-human classification(s) would be cleared back to unclassified.`,
  )
  for (const row of doomed.slice(0, 15)) {
    console.log(
      `  #${row.id} ${row.customLabel || row.name} — ${row.loraCategory} (${row.loraCategorySource ?? 'no source'})`,
    )
  }
  if (doomed.length > 15) console.log(`  ... and ${doomed.length - 15} more.`)

  const kept = await prisma.resource.count({
    where: {
      resourceType: { in: ['LORA', 'LYCORIS'] },
      loraCategorySource: 'HUMAN',
    },
  })
  console.log(`${kept} human-classified row(s) will be left alone.`)

  if (!apply) {
    console.log('\nDry run. Re-run with --apply to clear.')
    return
  }

  const result = await prisma.resource.updateMany({
    where,
    data: { loraCategory: null, loraCategorySource: null },
  })
  console.log(`\nCleared ${result.count} classification(s).`)
}

async function main(): Promise<void> {
  if (resetHeuristic) {
    await resetHeuristicClassifications()
    return
  }

  const rows = await prisma.resource.findMany({
    where: {
      resourceType: { in: ['LORA', 'LYCORIS'] },
      ...(recheck ? {} : { loraCategory: null }),
    },
    select: {
      id: true,
      name: true,
      customLabel: true,
      description: true,
      triggerWords: true,
      loraCategory: true,
      loraCategorySource: true,
      civitaiModelId: true,
      civitaiModelVersionId: true,
      civitaiUrl: true,
      customUrl: true,
    },
    orderBy: { id: 'asc' },
  })

  const counts = new Map<LoraCategory | 'UNCLASSIFIED', number>()
  const protectedRows: string[] = []
  const changes: Array<{
    id: number
    label: string
    from: string
    to: LoraCategory
    source: string
    signal: string | null
  }> = []

  let fetched = 0
  let reachableByColumn = 0
  let reachableByUrl = 0
  let unreachable = 0
  const recoveredIds: Array<{
    id: number
    modelId: number
    versionId: number | null
  }> = []

  for (const row of rows) {
    if (!canReclassify(row.loraCategorySource)) {
      protectedRows.push(`#${row.id} ${row.customLabel || row.name}`)
      continue
    }

    /*
     * The ids mostly are NOT in the columns -- rows imported before those
     * existed carry them only inside civitaiUrl. Keying the lookup on the
     * column alone is what made --fetch-tags reach 2 rows out of 1,221 on
     * 2026-09-22: not a network problem, a "we never asked" problem.
     */
    const ids = resolveCivitaiIds(row)
    if (ids.modelIdSource === 'column') reachableByColumn += 1
    else if (ids.modelIdSource === 'url') reachableByUrl += 1
    else unreachable += 1

    if (ids.modelIdSource === 'url' && ids.modelId) {
      recoveredIds.push({
        id: row.id,
        modelId: ids.modelId,
        versionId: ids.versionId,
      })
    }

    let tags: string[] | null = null
    if (fetchTags && ids.modelId) {
      tags = await civitaiTags(ids.modelId)
      fetched += 1
      await sleep(FETCH_DELAY_MS)
    }

    const inference = inferLoraCategory({
      name: row.name,
      customLabel: row.customLabel,
      description: row.description,
      triggerWords: row.triggerWords,
      civitaiTags: tags,
    })

    const bucket = inference.category ?? 'UNCLASSIFIED'
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1)

    if (!inference.category || inference.category === row.loraCategory) continue

    changes.push({
      id: row.id,
      label: row.customLabel || row.name,
      from: row.loraCategory ?? '(none)',
      to: inference.category,
      source: inference.source ?? 'HEURISTIC',
      signal: inference.signal,
    })
  }

  console.log(
    `Examined ${rows.length} LoRA row(s)${recheck ? ' (recheck mode)' : ' with no category'}.`,
  )
  console.log(
    `Civitai reach: ${reachableByColumn} by column, ${reachableByUrl} recovered from a url, ${unreachable} with no id anywhere.`,
  )
  if (fetchTags) {
    /*
     * Say which credential was used. Running unauthenticated still works for
     * public models but rate-limits much harder, and the difference is
     * otherwise invisible until a sweep starts returning nothing -- the same
     * silent-nothing shape as the id lookup this run already fixed.
     */
    console.log(
      civitaiToken
        ? 'Civitai auth: token found in the environment (.env or shell).'
        : 'Civitai auth: NONE. Public models still answer, but rate limits are much tighter -- set CIVITAI_TOKEN in .env for a sweep this size.',
    )
    console.log(`Fetched Civitai tags for ${fetched} row(s).`)
  } else if (reachableByColumn + reachableByUrl > 0) {
    console.log(
      `Re-run with --fetch-tags to ask Civitai about those ${reachableByColumn + reachableByUrl} row(s); it is the only signal that classifies a character LoRA.`,
    )
  }
  if (protectedRows.length) {
    console.log(
      `Left ${protectedRows.length} human-classified row(s) alone: ${protectedRows.slice(0, 5).join(', ')}${protectedRows.length > 5 ? ', ...' : ''}`,
    )
  }

  console.log('\nProposed distribution:')
  for (const category of [...LORA_CATEGORIES, 'UNCLASSIFIED' as const]) {
    const count = counts.get(category) ?? 0
    if (count) console.log(`  ${String(category).padEnd(14)} ${count}`)
  }

  console.log(`\n${changes.length} row(s) would change.`)
  for (const change of changes.slice(0, 25)) {
    console.log(
      `  #${change.id} ${change.label}\n      ${change.from} -> ${change.to}  [${change.source}${change.signal ? ` ${change.signal}` : ''}]`,
    )
  }
  if (changes.length > 25) console.log(`  ... and ${changes.length - 25} more.`)

  if (!apply) {
    console.log('\nDry run. Re-run with --apply to write.')
    return
  }

  for (const change of changes) {
    await prisma.resource.update({
      where: { id: change.id },
      data: {
        loraCategory: change.to,
        loraCategorySource: change.source,
      },
    })
  }

  console.log(`\nWrote ${changes.length} classification(s).`)

  /*
   * Write the url-recovered ids into the columns they belong in. The next run
   * then reaches those rows without re-parsing, and so do the Discover browse
   * and download lanes, which key off civitaiModelVersionId and are blind to a
   * row that knows its own id only inside a url string.
   */
  if (recoveredIds.length) {
    for (const recovered of recoveredIds) {
      await prisma.resource.update({
        where: { id: recovered.id },
        data: {
          civitaiModelId: recovered.modelId,
          ...(recovered.versionId
            ? { civitaiModelVersionId: recovered.versionId }
            : {}),
        },
      })
    }
    console.log(
      `Recovered ${recoveredIds.length} Civitai id(s) from urls into their columns.`,
    )
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
