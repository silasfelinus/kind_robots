// /utils/scripts/publishDreamLocations.ts
//
// Creates the new LOCATION Dreams and links their Scenarios.
//
//   npx tsx utils/scripts/publishDreamLocations.ts --dry-run
//   npx tsx utils/scripts/publishDreamLocations.ts
//
// This is the only lane in the fitness pass that CREATES rows rather than
// joining existing ones, so it is the one that can leave a mess. Two things
// keep it clean:
//
//   Idempotent on slug. A Dream whose slug is already present is adopted, not
//   recreated. A re-run after a half-finished run therefore continues; without
//   this, the second attempt would fill the catalog with near-identical worlds
//   distinguishable only by id.
//
//   Additive linking only. `connect`, never `set` -- a Scenario that gained a
//   Dream by another route in the meantime keeps it.
//
// Nothing here deletes or unpublishes. If a location turns out to be wrong the
// repair is to unpublish that one row by hand, which is a smaller and more
// reversible operation than anything this script could do on its own.
//
// ART -- the gap this lane shipped with
// ------------------------------------
// The first run created sixteen LOCATION Dreams and queued art for none of
// them. Nothing failed and nothing warned; every new world simply arrived with
// `artPrompt: null, artImageId: null, imagePath: null` and stayed that way,
// which is why Silas saw no spike in the art queue and asked (2026-08-13):
// "did the new objects, such as locations, get artjobs queued? We should have
// an artjob for each new object."
//
// He should not have had to ask. A creation lane that leaves its objects
// pictureless is not finished, so this script now enqueues art for every
// location that has none -- newly created OR adopted, which makes the same code
// path the backfill for the sixteen already out there.
//
// Art costs mana and GPU time, so it is opt-in per run:
//
//   KR_API_BASE=https://kindrobots.org KR_API_TOKEN=... \
//     npx tsx utils/scripts/publishDreamLocations.ts --queue-art
//
// Without --queue-art the script still counts the art-less locations and says
// so on the way out. The one thing it will not do again is finish quietly.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import prisma from '@/server/utils/prisma'
import {
  descriptionPartsInOrder,
  slugLooksValid,
  LOCATION_DESIGNER,
  type DreamLocation,
  type DreamLocationBatch,
} from '@/utils/comments/dreamLocations'

/**
 * Run thunks one at a time, returning results in order.
 *
 * Serialized deliberately: four lanes hung indefinitely on their first query
 * from a CI runner while production stayed healthy, and a database + ProxySQL
 * reboot did not clear it. The one job that has always worked against this
 * database is run_facet_catalog_maintenance, whose own step is named "Run
 * serialized Facet catalog maintenance". Every hanging lane opened its reads
 * with Promise.all. If the CI user's connection allowance is small, a parallel
 * fan-out does not fail -- it waits, forever, with nothing to report.
 *
 * Tuple-typed because a plain array collapses differently-shaped queries into
 * one union and every destructured name comes back wrong.
 */
async function serial<T extends readonly (() => Promise<unknown>)[]>(
  thunks: [...T],
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const out: unknown[] = []
  for (const thunk of thunks) out.push(await thunk())
  return out as { [K in keyof T]: Awaited<ReturnType<T[K]>> }
}

const DRY_RUN = process.argv.includes('--dry-run')
const QUEUE_ART = process.argv.includes('--queue-art')
const OWNER_USER_ID = 1
const EXPECTED_RELEASE_GATE = 'GPT-5.6 Sol'
const dir = join(process.cwd(), 'config', 'dream-locations')

// dream.imagePath is the primary slot in ENTITY_FIELDS -- 512x768, the same
// portrait shape every other Dream card renders at.
const DREAM_ART = { field: 'imagePath', width: 512, height: 768 } as const

/**
 * A location's art prompt, built from what the location already says.
 *
 * Deliberately not invented: title, then flavor text, then description, joined
 * and truncated. `buildEntityArtPrompt` on the server enriches whatever it
 * receives, so this only has to supply the world's own creative seed. A
 * location with nothing to say gets no job rather than a generic one.
 */
function artPromptFor(location: DreamLocation): string {
  const seen = new Set<string>()
  const prompt = [location.title, location.flavorText, location.description]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value && !seen.has(value) && seen.add(value))
    .join('. ')
  return prompt.length >= 3 ? prompt.slice(0, 900) : ''
}

async function enqueueLocationArt(
  base: string,
  token: string,
  dreamId: number,
  prompt: string,
): Promise<number> {
  const response = await fetch(`${base.replace(/\/$/, '')}/api/art/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      engine: 'krea2',
      promptString: prompt,
      width: DREAM_ART.width,
      height: DREAM_ART.height,
      isPublic: true,
      isMature: false,
      designer: LOCATION_DESIGNER,
      projectSlug: 'dream-locations',
      entityArt: {
        entityType: 'dream',
        entityId: dreamId,
        field: DREAM_ART.field,
        preserveOriginal: true,
        mode: 'recreate',
      },
    }),
  })

  const body = (await response.json().catch(() => null)) as {
    success?: boolean
    message?: string
    data?: { jobId?: number }
  } | null

  if (!response.ok || !body?.success || !body.data?.jobId) {
    throw new Error(
      `Dream #${dreamId}: HTTP ${response.status} ${body?.message || 'enqueue failed'}`,
    )
  }
  return Number(body.data.jobId)
}

function loadLocations(): DreamLocation[] {
  if (!existsSync(dir)) throw new Error(`No batch directory at ${dir}.`)
  const names = readdirSync(dir).filter((n) => n.endsWith('.json')).sort()
  if (!names.length) throw new Error(`No batch files in ${dir}.`)

  const all: DreamLocation[] = []
  const slugs = new Set<string>()
  for (const name of names) {
    const batch = JSON.parse(
      readFileSync(join(dir, name), 'utf8'),
    ) as DreamLocationBatch
    if (batch.version !== 1) {
      throw new Error(`${name}: unexpected version ${batch.version}.`)
    }
    if (batch.releaseGate !== EXPECTED_RELEASE_GATE) {
      throw new Error(`${name}: unexpected release gate ${batch.releaseGate}.`)
    }
    for (const location of batch.locations || []) {
      if (!slugLooksValid(location.slug)) {
        throw new Error(`${name}: bad slug ${location.slug}.`)
      }
      if (!descriptionPartsInOrder(location.description || '')) {
        throw new Error(`${name}: ${location.slug} description is out of house style.`)
      }
      if (slugs.has(location.slug)) {
        throw new Error(`${name}: duplicate slug ${location.slug}.`)
      }
      slugs.add(location.slug)
      all.push(location)
    }
  }
  return all
}

async function main() {
  const locations = loadLocations()

  const scenarioIds = [...new Set(locations.flatMap((l) => l.scenarioIds))]
  const [existingDreams, scenarios, owner] = await serial([
    // Whole tables, filtered in memory -- a large IN list hung another lane's
    // dry run for fourteen minutes through ProxySQL.
    () => prisma.dream.findMany({
      select: { id: true, slug: true, title: true, imagePath: true },
    }),
    () => prisma.scenario.findMany({
      select: { id: true, title: true, isPublic: true, isActive: true },
    }),
    () => prisma.user.findUnique({
      where: { id: OWNER_USER_ID },
      select: { id: true, username: true },
    }),
  ])

  if (!owner) throw new Error(`Owner user #${OWNER_USER_ID} does not exist.`)

  const scenarioIdSet = new Set(scenarioIds)
  const scenarioById = new Map(
    scenarios.filter((s) => scenarioIdSet.has(s.id)).map((s) => [s.id, s]),
  )
  for (const location of locations) {
    for (const scenarioId of location.scenarioIds) {
      const scenario = scenarioById.get(scenarioId)
      if (!scenario) {
        throw new Error(`${location.slug}: Scenario #${scenarioId} not found.`)
      }
      if (!scenario.isPublic || !scenario.isActive) {
        throw new Error(
          `${location.slug}: Scenario #${scenarioId} is not public/active.`,
        )
      }
    }
  }

  const wantedSlugs = new Set(locations.map((l) => l.slug))
  const bySlug = new Map(
    existingDreams
      .filter((d) => d.slug && wantedSlugs.has(d.slug))
      .map((d) => [d.slug || '', d]),
  )
  console.log(
    'LOCATIONS_VALIDATED',
    JSON.stringify({
      locations: locations.length,
      alreadyPresent: bySlug.size,
      scenarios: scenarioIds.length,
      owner,
    }),
  )

  if (DRY_RUN) {
    console.log(
      'LOCATIONS_DRY_RUN',
      JSON.stringify({
        wouldCreate: locations.filter((l) => !bySlug.has(l.slug)).length,
        wouldAdopt: locations.filter((l) => bySlug.has(l.slug)).length,
        wouldLink: locations.reduce((n, l) => n + l.scenarioIds.length, 0),
      }),
    )
    return
  }

  const artBase = process.env.KR_API_BASE || ''
  const artToken = process.env.KR_API_TOKEN || ''
  if (QUEUE_ART && (!artBase || !artToken)) {
    throw new Error('--queue-art requires KR_API_BASE and KR_API_TOKEN.')
  }

  let created = 0
  let adopted = 0
  let linked = 0
  let artQueued = 0
  const artless: string[] = []

  for (const location of locations) {
    const existing = bySlug.get(location.slug)
    let dreamId = existing?.id
    if (dreamId) {
      adopted += 1
    } else {
      const dream = await prisma.dream.create({
        data: {
          title: location.title,
          slug: location.slug,
          description: location.description,
          flavorText: location.flavorText,
          dreamType: 'LOCATION',
          creationSource: 'AI',
          designer: LOCATION_DESIGNER,
          userId: owner.id,
          isPublic: true,
          isActive: true,
          isMature: false,
          allowReviews: true,
        },
        select: { id: true },
      })
      dreamId = dream.id
      created += 1
    }

    for (const scenarioId of location.scenarioIds) {
      await prisma.scenario.update({
        where: { id: scenarioId },
        data: { Dreams: { connect: { id: dreamId } } },
      })
      linked += 1
    }

    // A location the run just created has no art by definition; an adopted one
    // may still be carrying the gap this lane shipped with.
    let jobId: number | null = null
    if (!existing?.imagePath) {
      const prompt = artPromptFor(location)
      if (!prompt) {
        console.log(
          'LOCATION_ART_SKIPPED',
          JSON.stringify({ slug: location.slug, reason: 'no prompt source' }),
        )
      } else if (QUEUE_ART) {
        jobId = await enqueueLocationArt(artBase, artToken, dreamId, prompt)
        artQueued += 1
      } else {
        artless.push(location.slug)
      }
    }

    console.log(
      'LOCATION_DONE',
      JSON.stringify({
        slug: location.slug,
        dreamId,
        scenarios: location.scenarioIds.length,
        artJobId: jobId,
      }),
    )
  }

  console.log(
    'LOCATIONS_COMPLETE',
    JSON.stringify({ created, adopted, linked, artQueued }),
  )

  // Never finish quietly on art-less worlds again -- that silence is the whole
  // reason the first sixteen went out pictureless.
  if (artless.length) {
    console.warn(
      `\n${artless.length} location(s) have no art and none was queued: ` +
        `${artless.join(', ')}\n` +
        'Re-run with KR_API_BASE, KR_API_TOKEN and --queue-art to give them one.',
    )
  }
}

await main()

// The pool does not close itself.
//
// A dry run printed POPULATION_DRY_RUN at 15:37:06 and the job then sat idle
// until 15:57:12 before cleanup -- twenty minutes of nothing, on work that took
// three seconds. Prisma's adapter here reports `poolLifecycle:
// 'singleton-per-runtime', poolProfile: 'long-lived'`, so its handles keep the
// event loop alive after main() resolves and the process never exits on its own.
//
// This was mistaken for a database hang, twice, and two runs were cancelled
// mid-"hang" that had in fact already finished their work.
await prisma.$disconnect()
