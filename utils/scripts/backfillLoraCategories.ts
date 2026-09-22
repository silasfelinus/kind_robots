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
// Nothing here needs a secret pasted into a shell. dotenv loads the repo's own
// .env before anything else, and process.env covers a persistent Windows
// variable set with setx -- so whichever way the token is already stored, this
// finds it. A secret that has to be re-typed to run a routine sweep is a secret
// in three shell histories by the end of the week.
//
// The token is looked for under BOTH names this project uses, because it has
// two: ops/home-server/README.md tells you to `setx KR_CIVITAI_TOKEN` for the
// relay's gated downloads, while scan_loras.py and scan_models.py read
// CIVITAI_TOKEN. Reading only one of them means telling someone who already
// has the secret to go copy it again under a different name.
//
// Usage, from the repo root:
//   npm run backfill:lora-categories                            # dry run
//   npm run backfill:lora-categories -- --apply
//   npm run backfill:lora-categories -- --fetch-tags            # dry run, asks Civitai
//   npm run backfill:lora-categories -- --fetch-tags --apply
//   npm run backfill:lora-categories -- --recheck --apply
//   npm run backfill:lora-categories -- --reset-heuristic --apply
//   npm run backfill:lora-categories -- --fetch-tags --limit 25   # 20s sanity check
//
// A full --fetch-tags sweep is ~2,200 Civitai round trips at FETCH_DELAY_MS
// apiece: twenty-five minutes of work. It now prints its reach, its credential
// and its planned fetch count BEFORE any of that, then a progress line every
// PROGRESS_EVERY rows -- because under the old shape the first output of any
// kind came after the last fetch, and a working run was indistinguishable from
// a wedged one for the whole duration (Silas, 2026-09-22: "It just hangs after
// prisma. Maybe it's running, but there's no output."). Start with --limit 25.
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
/*
 * --limit N caps the sweep. A full pass is ~2,200 network round trips at
 * FETCH_DELAY_MS apiece -- half an hour before a single line prints, under the
 * old shape. `--fetch-tags --limit 25` answers "is this working at all" in
 * twenty seconds, which is the check that would have caught the
 * reached-2-of-1,221 bug immediately instead of after a full silent run.
 */
const limitArg = args.find((arg) => arg.startsWith('--limit'))
const limitValue = limitArg
  ? ((limitArg.includes('=')
      ? limitArg.split('=')[1]
      : args[args.indexOf(limitArg) + 1]) ?? '')
  : ''
const limit = Number.parseInt(limitValue, 10)
const rowLimit = Number.isInteger(limit) && limit > 0 ? limit : null
/*
 * Priority order, not preference: the first one actually set wins. The run
 * reports WHICH NAME answered -- never the value -- so "do I have a token, and
 * where is it coming from" is answerable without echoing a secret anywhere.
 */
const CIVITAI_TOKEN_VARS = ['CIVITAI_TOKEN', 'KR_CIVITAI_TOKEN'] as const

const civitaiTokenVar = CIVITAI_TOKEN_VARS.find((name) =>
  (process.env[name] ?? '').trim(),
)
const civitaiToken = civitaiTokenVar
  ? (process.env[civitaiTokenVar] ?? '').trim()
  : ''

const CIVITAI_MODEL = 'https://civitai.com/api/v1/models/'
// Civitai rate-limits, and a catalog sweep is not urgent. One request every
// 350ms is well inside what the scan_loras.py lookups already use.
const FETCH_DELAY_MS = 350
/*
 * `fetch` with no signal waits on undici's own defaults, which is minutes for a
 * stalled connection and looks exactly like the sweep still working. A sweep
 * this long cannot afford one socket to decide how long the whole run takes.
 */
const FETCH_TIMEOUT_MS = 15_000
const PROGRESS_EVERY = 50

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/*
 * Returns the tags AND why there are none. The old shape collapsed "this model
 * has no tags", "Civitai rate-limited us", and "the socket died" into one
 * `null`, so a sweep that got 429'd on row 40 and returned nothing for the
 * remaining 2,000 finished with a clean-looking report and no way to tell.
 * That is the same silent-nothing shape as the id lookup this script already
 * had to fix once.
 */
async function civitaiTags(
  modelId: number,
): Promise<{ tags: string[] | null; failure: string | null }> {
  try {
    const response = await fetch(`${CIVITAI_MODEL}${modelId}`, {
      headers: civitaiToken
        ? { Authorization: `Bearer ${civitaiToken}` }
        : undefined,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!response.ok) return { tags: null, failure: `HTTP ${response.status}` }
    const payload = (await response.json()) as { tags?: unknown }
    return { tags: civitaiTagNames(payload.tags), failure: null }
  } catch (error) {
    const name = error instanceof Error ? error.name : 'Error'
    return { tags: null, failure: name === 'TimeoutError' ? 'timeout' : name }
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
    ...(rowLimit ? { take: rowLimit } : {}),
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

  /*
   * PASS ONE -- no network at all. Resolving ids, counting reach and picking
   * out the protected rows is pure local work, which means the two lines that
   * actually answer "is this sweep going to do anything" can print BEFORE the
   * half-hour of round trips rather than after it. Under the old single-loop
   * shape the first output of any kind came after the last fetch, so a run
   * that was working and a run that had wedged on a dead socket looked
   * identical from the terminal for twenty-five minutes (Silas, 2026-09-22:
   * "It just hangs after prisma. Maybe it's running, but there's no output.").
   */
  const plan: Array<{ row: (typeof rows)[number]; modelId: number | null }> = []
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

    plan.push({ row, modelId: ids.modelId })
  }

  console.log(
    `Examined ${rows.length} LoRA row(s)${recheck ? ' (recheck mode)' : ' with no category'}${rowLimit ? ` (--limit ${rowLimit})` : ''}.`,
  )
  console.log(
    `Civitai reach: ${reachableByColumn} by column, ${reachableByUrl} recovered from a url, ${unreachable} with no id anywhere.`,
  )

  const due = fetchTags ? plan.filter((entry) => entry.modelId).length : 0
  if (fetchTags) {
    /*
     * Say which credential was used. Running unauthenticated still works for
     * public models but rate-limits much harder, and the difference is
     * otherwise invisible until a sweep starts returning nothing -- the same
     * silent-nothing shape as the id lookup this run already fixed.
     */
    console.log(
      civitaiTokenVar
        ? `Civitai auth: token found in ${civitaiTokenVar}.`
        : `Civitai auth: NONE. Looked for ${CIVITAI_TOKEN_VARS.join(' and ')} in the environment and in .env. Public models still answer, but rate limits are much tighter on a sweep this size.`,
    )
    const minutes = Math.ceil((due * FETCH_DELAY_MS) / 60_000)
    console.log(
      `Asking Civitai about ${due} row(s), one every ${FETCH_DELAY_MS}ms -- at least ~${minutes} minute(s). Progress every ${PROGRESS_EVERY}.\n`,
    )
  }

  // PASS TWO -- the slow one, now that you know what it is about to do.
  const startedAt = Date.now()
  const failures = new Map<string, number>()
  for (const entry of plan) {
    const row = entry.row

    let tags: string[] | null = null
    if (fetchTags && entry.modelId) {
      const result = await civitaiTags(entry.modelId)
      tags = result.tags
      if (result.failure) {
        failures.set(result.failure, (failures.get(result.failure) ?? 0) + 1)
      }
      fetched += 1
      if (fetched % PROGRESS_EVERY === 0 || fetched === due) {
        const elapsed = (Date.now() - startedAt) / 1000
        const remaining = Math.max(
          0,
          Math.round((elapsed / fetched) * (due - fetched)),
        )
        console.log(
          `  ...${fetched}/${due} fetched (${Math.round(elapsed)}s elapsed, ~${remaining}s left)`,
        )
      }
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

  if (fetchTags) {
    console.log(`\nFetched Civitai tags for ${fetched} row(s).`)
    const emptied = [...failures.values()].reduce((sum, n) => sum + n, 0)
    if (emptied) {
      const worst = [...failures.entries()].sort((a, b) => b[1] - a[1])
      console.log(
        `  ${emptied} of those came back with nothing: ${worst
          .map(([reason, count]) => `${count}x ${reason}`)
          .join(', ')}.`,
      )
      /*
       * A 429 wall is the one failure that silently invalidates the whole
       * sweep rather than a handful of rows: every row after it classifies on
       * title alone while still reporting as a clean tag-fetching run.
       */
      if ([...failures.keys()].some((reason) => reason.includes('429'))) {
        console.log(
          '  HTTP 429 means Civitai rate-limited this sweep. Rows after that point were classified on title alone -- raise FETCH_DELAY_MS, or set CIVITAI_TOKEN, and re-run with --recheck.',
        )
      }
    }
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
