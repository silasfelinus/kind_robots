// /utils/scripts/enqueuePageBackdropArtViaApi.ts
//
// Queue page backdrop art over HTTP instead of straight into the database.
//
// enqueuePageBackdropArt.ts writes to Prisma directly, which only works from a
// host that can reach the database. This does the identical work through
// POST /api/art/queue, so it runs from anywhere with KR_API_TOKEN — including a
// sandbox that can reach the site but not the tailnet.
//
// The payload comes from buildPageBackdropPayload, the same builder the
// direct script uses, so a job queued here is indistinguishable from one
// queued there. Engine is passed explicitly: the
// route now defaults to COMFY, but relying on a default is how sixty jobs got
// routed to a dead A1111 once already.
//
//   npx tsx utils/scripts/enqueuePageBackdropArtViaApi.ts                  # dry run
//   npx tsx utils/scripts/enqueuePageBackdropArtViaApi.ts --write
//   npx tsx utils/scripts/enqueuePageBackdropArtViaApi.ts --write --limit 6
//   npx tsx utils/scripts/enqueuePageBackdropArtViaApi.ts --write --only index,about
//   npx tsx utils/scripts/enqueuePageBackdropArtViaApi.ts --write --only mermaids --variant desktop
//
// Picking a render instead of hoping for one. Arthemy re-centres a hero on some
// scenes whatever the prompt says, so seed choice matters as much as wording:
//   ... --write --only bots --candidates 4     # 4 seeds per variant, off-site
//   ... --write --only bots --variant desktop --seed 123456   # make one live
// Candidates go to project page-backdrop-candidates under a suffixed
// requestId, so /api/art/backdrop never serves them; --seed re-renders the
// chosen one under the real requestId.
//
// Each candidate also needs its OWN imagePath. The media agent files a render
// at the job's declared imagePath, and every ArtImage filed there serves the
// same bytes -- so the first candidate batch (ArtJobs 34680-34703) wrote four
// seeds into background/bots-desktop.webp, kept only the last, and replaced
// the live backdrop with it as well.
import 'dotenv/config'
import { pageBackdropArtPrompts } from './../../stores/seeds/pageBackdropArtPrompts'
import { buildPageBackdropPayload } from './pageBackdropPayload'

const WRITE = process.argv.includes('--write')
const PROJECT_SLUG = 'page-backdrops'
const CANDIDATE_PROJECT_SLUG = 'page-backdrop-candidates'
const ENGINE = 'COMFY' as const

const BASE = (
  process.env.KR_API_BASE || 'https://kindrobots.org'
).replace(/\/+$/, '')
const TOKEN = process.env.KR_API_TOKEN?.trim() || ''

function flag(name: string): string | null {
  const index = process.argv.indexOf(name)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

const LIMIT = Number(flag('--limit') || 0)
const PRIORITY = Number(flag('--priority') || 100)
const CANDIDATES = Number(flag('--candidates') || 0)
const SEED = flag('--seed') === null ? undefined : Number(flag('--seed'))
const ONLY = (flag('--only') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
// A page has three genuinely different framings, so re-rendering one breakpoint
// is a real thing to want — the desktop backdrop can be wrong while the phone
// one is fine. Without this, repairing one image costs three renders.
const VARIANTS = (flag('--variant') || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)

async function main() {
  if (!TOKEN) {
    console.error('❌ KR_API_TOKEN is not set.')
    process.exitCode = 1
    return
  }

  let entries = pageBackdropArtPrompts
  if (ONLY.length) entries = entries.filter((e) => ONLY.includes(e.page))
  if (VARIANTS.length) entries = entries.filter((e) => VARIANTS.includes(e.variant))
  if (LIMIT > 0) entries = entries.slice(0, LIMIT)
  if (!entries.length) {
    console.error('❌ No entries matched --only / --variant.')
    process.exitCode = 1
    return
  }

  if (SEED !== undefined && (!Number.isInteger(SEED) || SEED < 0)) {
    console.error('❌ --seed must be a non-negative integer.')
    process.exitCode = 1
    return
  }

  const jobs = entries.flatMap((entry) => {
    if (CANDIDATES <= 0) {
      return [{ entry, seed: SEED, projectSlug: PROJECT_SLUG }]
    }
    return Array.from({ length: CANDIDATES }, () => {
      const seed = Math.floor(Math.random() * 2_147_483_647)
      return {
        entry: {
          ...entry,
          requestId: `${entry.requestId}-candidate-${seed}`,
          imagePath: `background/candidates/${entry.page}-${entry.variant}-${seed}.webp`,
        },
        seed,
        projectSlug: CANDIDATE_PROJECT_SLUG,
      }
    })
  })

  console.log(`Target: ${BASE}`)
  console.log(
    `Entries: ${entries.length} (${new Set(entries.map((e) => e.page)).size} pages)`,
  )
  console.log(
    `Engine ${ENGINE}, priority ${PRIORITY}, project ${CANDIDATES > 0 ? CANDIDATE_PROJECT_SLUG : PROJECT_SLUG}, jobs ${jobs.length}`,
  )
  console.log(`Mode: ${WRITE ? 'WRITE' : 'dry run'}\n`)

  if (!WRITE) {
    for (const { entry } of jobs.slice(0, 8)) {
      console.log(`  WOULD  ${entry.requestId.padEnd(38)} ${entry.width}x${entry.height}`)
    }
    if (jobs.length > 8) console.log(`  … and ${jobs.length - 8} more`)
    console.log(`\nDry run only. Re-run with --write to queue ${jobs.length}.`)
    return
  }

  let queued = 0
  let deduped = 0
  const failures: string[] = []

  for (const [index, { entry, seed, projectSlug }] of jobs.entries()) {
    const response = await fetch(`${BASE}/api/art/queue`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        engine: ENGINE,
        payload: buildPageBackdropPayload(entry, seed),
        priority: PRIORITY,
        projectSlug,
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

    if ((index + 1) % 15 === 0 || index === jobs.length - 1) {
      console.log(
        `  ${index + 1}/${jobs.length}  queued ${queued}, deduped ${deduped}, failed ${failures.length}`,
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
