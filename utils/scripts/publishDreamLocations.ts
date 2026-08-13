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

const DRY_RUN = process.argv.includes('--dry-run')
const OWNER_USER_ID = 1
const EXPECTED_RELEASE_GATE = 'GPT-5.6 Sol'
const dir = join(process.cwd(), 'config', 'dream-locations')

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
  const [existingDreams, scenarios, owner] = await Promise.all([
    // Whole tables, filtered in memory -- a large IN list hung another lane's
    // dry run for fourteen minutes through ProxySQL.
    prisma.dream.findMany({ select: { id: true, slug: true, title: true } }),
    prisma.scenario.findMany({
      select: { id: true, title: true, isPublic: true, isActive: true },
    }),
    prisma.user.findUnique({
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

  let created = 0
  let adopted = 0
  let linked = 0

  for (const location of locations) {
    let dreamId = bySlug.get(location.slug)?.id
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

    console.log(
      'LOCATION_DONE',
      JSON.stringify({ slug: location.slug, dreamId, scenarios: location.scenarioIds.length }),
    )
  }

  console.log(
    'LOCATIONS_COMPLETE',
    JSON.stringify({ created, adopted, linked }),
  )
}

await main()
