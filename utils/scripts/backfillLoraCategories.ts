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
// Usage:
//   DATABASE_URL=... tsx utils/scripts/backfillLoraCategories.ts                 # dry-run
//   DATABASE_URL=... tsx utils/scripts/backfillLoraCategories.ts --apply
//   DATABASE_URL=... CIVITAI_TOKEN=... tsx utils/scripts/backfillLoraCategories.ts --fetch-tags --apply
//   DATABASE_URL=... tsx utils/scripts/backfillLoraCategories.ts --recheck --apply
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
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
    return Array.isArray(payload.tags)
      ? payload.tags.map((tag) => String(tag))
      : null
  } catch {
    return null
  }
}

async function main(): Promise<void> {
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

  for (const row of rows) {
    if (!canReclassify(row.loraCategorySource)) {
      protectedRows.push(`#${row.id} ${row.customLabel || row.name}`)
      continue
    }

    let tags: string[] | null = null
    if (fetchTags && row.civitaiModelId) {
      tags = await civitaiTags(row.civitaiModelId)
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
  if (fetchTags) console.log(`Fetched Civitai tags for ${fetched} row(s).`)
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
      `  #${change.id} ${change.label} — ${change.from} -> ${change.to} (${change.source}${change.signal ? `: ${change.signal}` : ''})`,
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
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
