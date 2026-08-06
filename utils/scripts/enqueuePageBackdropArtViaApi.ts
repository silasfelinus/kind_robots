// /utils/scripts/enqueuePageBackdropArtViaApi.ts
//
// Queue page backdrop art over HTTP instead of straight into the database.
//
// enqueuePageBackdropArt.ts writes to Prisma directly, which only works from a
// host that can reach the database. This does the identical work through
// POST /api/art/queue, so it runs from anywhere with KR_API_TOKEN — including a
// sandbox that can reach the site but not the tailnet.
//
// The payload is built by the SAME buildKrea2WorkflowFromRequest and
// enrichArtJobPayload the direct script uses, so a job queued here is
// indistinguishable from one queued there. Engine is passed explicitly: the
// route now defaults to COMFY, but relying on a default is how sixty jobs got
// routed to a dead A1111 once already.
//
//   npx tsx utils/scripts/enqueuePageBackdropArtViaApi.ts                  # dry run
//   npx tsx utils/scripts/enqueuePageBackdropArtViaApi.ts --write
//   npx tsx utils/scripts/enqueuePageBackdropArtViaApi.ts --write --limit 6
//   npx tsx utils/scripts/enqueuePageBackdropArtViaApi.ts --write --only index,about
import 'dotenv/config'
import { pageBackdropArtPrompts } from './../../stores/seeds/pageBackdropArtPrompts'
import {
  KREA2_DEFAULT_CFG,
  KREA2_DEFAULT_STEPS,
  buildKrea2WorkflowFromRequest,
} from './../../server/api/comfy/krea2/utils/workflow'
import { enrichArtJobPayload } from './../../server/utils/artJobProvenance'

const WRITE = process.argv.includes('--write')
const PROJECT_SLUG = 'page-backdrops'
const PRIORITY = 100
const ENGINE = 'COMFY' as const

const BASE = (
  process.env.KR_API_BASE || 'https://kind-robots.vercel.app'
).replace(/\/+$/, '')
const TOKEN = process.env.KR_API_TOKEN?.trim() || ''

function flag(name: string): string | null {
  const index = process.argv.indexOf(name)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

const LIMIT = Number(flag('--limit') || 0)
const ONLY = (flag('--only') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

function buildPayload(entry: (typeof pageBackdropArtPrompts)[number]) {
  const { workflow, seed } = buildKrea2WorkflowFromRequest({
    prompt: entry.promptString,
    negativePrompt: entry.negativePrompt,
    width: entry.width,
    height: entry.height,
    steps: KREA2_DEFAULT_STEPS,
    cfg: KREA2_DEFAULT_CFG,
  })

  const { payload } = enrichArtJobPayload(ENGINE, {
    requestId: entry.requestId,
    title: entry.title,
    page: entry.page,
    variant: entry.variant,
    promptString: entry.promptString,
    negativePrompt: entry.negativePrompt,
    width: entry.width,
    height: entry.height,
    steps: KREA2_DEFAULT_STEPS,
    cfg: KREA2_DEFAULT_CFG,
    seed,
    workflow,
    /*
     * The destination the relay's media agent reads, and now the destination
     * resolveArtImageFilePath honours too — so these file under background/
     * instead of the unsorted landing zone.
     */
    imagePath: entry.imagePath,
    save: {
      isPublic: true,
      isMature: false,
      designer: 'Kind Robots / Page Backdrops',
    },
  })

  return payload
}

async function main() {
  if (!TOKEN) {
    console.error('❌ KR_API_TOKEN is not set.')
    process.exitCode = 1
    return
  }

  let entries = pageBackdropArtPrompts
  if (ONLY.length) entries = entries.filter((e) => ONLY.includes(e.page))
  if (LIMIT > 0) entries = entries.slice(0, LIMIT)

  console.log(`Target: ${BASE}`)
  console.log(
    `Entries: ${entries.length} (${new Set(entries.map((e) => e.page)).size} pages)`,
  )
  console.log(`Engine ${ENGINE}, priority ${PRIORITY}, project ${PROJECT_SLUG}`)
  console.log(`Mode: ${WRITE ? 'WRITE' : 'dry run'}\n`)

  if (!WRITE) {
    for (const entry of entries.slice(0, 8)) {
      console.log(`  WOULD  ${entry.requestId.padEnd(38)} ${entry.width}x${entry.height}`)
    }
    if (entries.length > 8) console.log(`  … and ${entries.length - 8} more`)
    console.log(`\nDry run only. Re-run with --write to queue ${entries.length}.`)
    return
  }

  let queued = 0
  let deduped = 0
  const failures: string[] = []

  for (const [index, entry] of entries.entries()) {
    const response = await fetch(`${BASE}/api/art/queue`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        engine: ENGINE,
        payload: buildPayload(entry),
        priority: PRIORITY,
        projectSlug: PROJECT_SLUG,
      }),
    }).catch((error: unknown) => {
      failures.push(
        `${entry.requestId}: ${error instanceof Error ? error.message : String(error)}`,
      )
      return null
    })

    if (!response) continue

    const body = (await response.json().catch(() => null)) as {
      success?: boolean
      message?: string
      data?: { deduplicated?: boolean }
    } | null

    if (!response.ok || !body?.success) {
      failures.push(
        `${entry.requestId}: HTTP ${response.status} ${body?.message || ''}`.trim(),
      )
    } else if (body.data?.deduplicated) {
      deduped += 1
    } else {
      queued += 1
    }

    if ((index + 1) % 15 === 0 || index === entries.length - 1) {
      console.log(
        `  ${index + 1}/${entries.length}  queued ${queued}, deduped ${deduped}, failed ${failures.length}`,
      )
    }
  }

  console.log(`\nQueued ${queued}, already present ${deduped}, failed ${failures.length}.`)
  for (const failure of failures.slice(0, 15)) console.log(`  ✗ ${failure}`)
  if (failures.length > 15) console.log(`  … and ${failures.length - 15} more`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
