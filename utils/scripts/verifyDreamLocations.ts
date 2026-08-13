// /utils/scripts/verifyDreamLocations.ts
//
// Offline contract for the new LOCATION Dreams. No database.
//
//   npm run test:dream-locations
//
// Checks the things that are cheap here and expensive on a production runner:
// the slug is free, the title is not already taken by another world, the
// description carries all three house-style parts in order, and every Scenario
// named actually exists, is public, and does not already have a Dream.
//
// That last one matters more than it looks. A Scenario that already belongs
// somewhere and gets a second home is not an error the database will refuse --
// Scenario.Dreams is many-to-many -- it just quietly means the place a reader
// lands in depends on which link the UI picks first.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  descriptionPartsInOrder,
  slugLooksValid,
  MAX_DESCRIPTION_WORDS,
  MAX_FLAVOR_WORDS,
  MIN_DESCRIPTION_WORDS,
  MIN_FLAVOR_WORDS,
  type DreamLocationBatch,
} from '@/utils/comments/dreamLocations'
import { createFetcher } from '@/utils/comments/fitnessLoader'

/**
 * The Dream list endpoint, asked for all of them.
 *
 * `/api/dreams` defaults to a `take` of 48 and there are 75. Every tool in this
 * lane fetched the bare path and therefore validated against a truncated
 * catalog, which produced one real false positive: the connection contract
 * refused four assignments with "Dream #50 does not exist in production" when
 * Dream 50 was simply row 49.
 *
 * That failure was fail-closed and got caught. The dangerous one was silent:
 * verifyDreamLocations checks new slugs and titles against this list, so a new
 * location colliding with an existing Dream past row 48 would have been created
 * as a duplicate world. (Checked after the fact -- none of the sixteen
 * collided.)
 *
 * Characters, Scenarios and Bots return everything by default; only Dreams cap.
 */
const ALL_DREAMS = '/api/dreams?take=1000'

function arg(name: string, fallback = ''): string {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}

const baseUrl = arg('base', 'https://kindrobots.org').replace(/\/+$/, '')
const EXPECTED_RELEASE_GATE = 'GPT-5.6 Sol'
const dir = join(process.cwd(), 'config', 'dream-locations')

/**
 * Scenarios the connection lane is about to give a Dream to.
 *
 * The two lanes are disjoint today and nothing was enforcing it. A Scenario that
 * gets a home from both would not error -- Scenario.Dreams is many-to-many -- it
 * would just mean the place a reader lands in depends on which link the UI
 * happens to read first, which is the kind of thing nobody notices for months.
 */
function pendingConnectionDreams(): Map<number, string> {
  const dir = join(process.cwd(), 'config', 'connection-assignments')
  const map = new Map<number, string>()
  if (!existsSync(dir)) return map
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    const batch = JSON.parse(readFileSync(join(dir, name), 'utf8')) as {
      assignments?: Array<{ kind: string; scenarioId?: number; dreamTitle?: string }>
    }
    for (const assignment of batch.assignments || []) {
      if (assignment.kind !== 'SCENARIO_DREAM' || !assignment.scenarioId) continue
      map.set(assignment.scenarioId, `${name} -> ${assignment.dreamTitle || 'a Dream'}`)
    }
  }
  return map
}

const failures: string[] = []
const fail = (message: string) => failures.push(message)
const words = (value: string) => value.trim().split(/\s+/).filter(Boolean).length

async function main() {
  if (!existsSync(dir)) {
    console.log('No dream-location batches yet; nothing to verify.')
    return
  }
  const names = readdirSync(dir).filter((n) => n.endsWith('.json')).sort()
  if (!names.length) {
    console.log('No dream-location batches yet; nothing to verify.')
    return
  }

  const get = createFetcher(baseUrl)
  const [dreams, scenarios] = await Promise.all([
    get<Array<{ id: number; title: string; slug?: string | null }>>(ALL_DREAMS),
    get<
      Array<{
        id: number
        title: string
        isPublic?: boolean
        isActive?: boolean
        Dreams?: Array<{ id: number; title: string }>
      }>
    >('/api/scenarios'),
  ])

  const liveSlugs = new Set(
    dreams.map((d) => String(d.slug || '').toLowerCase()).filter(Boolean),
  )
  const liveTitles = new Map(
    dreams.map((d) => [d.title.trim().toLowerCase(), d]),
  )
  const scenarioById = new Map(scenarios.map((s) => [s.id, s]))

  const pendingDreams = pendingConnectionDreams()
  const seenSlugs = new Map<string, string>()
  const seenScenarios = new Map<number, string>()
  let locations = 0
  let links = 0

  for (const name of names) {
    const batch = JSON.parse(
      readFileSync(join(dir, name), 'utf8'),
    ) as DreamLocationBatch
    if (batch.version !== 1) {
      fail(`${name}: unexpected version ${batch.version}.`)
      continue
    }
    if (batch.releaseGate !== EXPECTED_RELEASE_GATE) {
      fail(`${name}: unexpected release gate ${batch.releaseGate}.`)
    }

    for (const [index, location] of (batch.locations || []).entries()) {
      const at = `${name}[${index}] ${location.slug || '?'}`
      locations += 1

      if (!slugLooksValid(location.slug || '')) {
        fail(`${at}: slug is not kebab-case.`)
      }
      // A slug that already exists is this location, already created. The
      // publisher adopts by slug rather than recreating, so a re-run is safe --
      // and a contract that refuses what the publisher handles correctly just
      // makes the lane un-rerunnable after its first success.
      const alreadyCreated = liveSlugs.has(String(location.slug).toLowerCase())
      const previousSlug = seenSlugs.get(location.slug)
      if (previousSlug) fail(`${at}: slug duplicates ${previousSlug}.`)
      else seenSlugs.set(location.slug, at)

      const titleKey = String(location.title || '').trim().toLowerCase()
      if (!titleKey) fail(`${at}: no title.`)
      const clash = liveTitles.get(titleKey)
      if (clash && !alreadyCreated) {
        fail(`${at}: title "${location.title}" is already Dream #${clash.id}.`)
      }

      const description = String(location.description || '')
      const descriptionWords = words(description)
      if (
        descriptionWords < MIN_DESCRIPTION_WORDS ||
        descriptionWords > MAX_DESCRIPTION_WORDS
      ) {
        fail(
          `${at}: description is ${descriptionWords} words; want ${MIN_DESCRIPTION_WORDS}-${MAX_DESCRIPTION_WORDS}.`,
        )
      }
      if (!descriptionPartsInOrder(description)) {
        fail(
          `${at}: description must carry "Known for", "Local rule:" and "Best scene:" in that order.`,
        )
      }

      const flavorWords = words(String(location.flavorText || ''))
      if (flavorWords < MIN_FLAVOR_WORDS || flavorWords > MAX_FLAVOR_WORDS) {
        fail(
          `${at}: flavorText is ${flavorWords} words; want ${MIN_FLAVOR_WORDS}-${MAX_FLAVOR_WORDS}.`,
        )
      }
      if (words(String(location.why || '')) < 4) {
        fail(`${at}: why must explain, in at least four words, why this place is needed.`)
      }

      if (!Array.isArray(location.scenarioIds) || !location.scenarioIds.length) {
        fail(`${at}: a new location with no Scenario is a world nobody enters.`)
      }
      for (const scenarioId of location.scenarioIds || []) {
        links += 1
        const scenario = scenarioById.get(scenarioId)
        if (!scenario) {
          fail(`${at}: Scenario #${scenarioId} does not exist.`)
          continue
        }
        if (scenario.isPublic === false || scenario.isActive === false) {
          fail(`${at}: Scenario #${scenarioId} is not public/active.`)
        }
        // Belonging to THIS location is the lane having already run. Belonging
        // to a different one is the double-homing this check exists to stop.
        const homes = scenario.Dreams || []
        const elsewhere = homes.filter((d) => d.title !== location.title)
        if (elsewhere.length) {
          fail(
            `${at}: Scenario #${scenarioId} "${scenario.title}" already belongs to ${elsewhere.map((d) => d.title).join(', ')}.`,
          )
        }
        const pending = pendingDreams.get(scenarioId)
        if (pending) {
          fail(
            `${at}: Scenario #${scenarioId} is also given a Dream by the connection lane (${pending}); one home each.`,
          )
        }
        const previous = seenScenarios.get(scenarioId)
        if (previous) {
          fail(`${at}: Scenario #${scenarioId} is also claimed by ${previous}.`)
        } else seenScenarios.set(scenarioId, at)
      }
    }
  }

  if (failures.length) {
    console.error(`Dream location contract FAILED (${failures.length}):`)
    for (const message of failures) console.error(`  - ${message}`)
    process.exit(1)
  }

  console.log(
    `Dream locations verified: ${locations} new place(s) across ${names.length} batch file(s), settling ${links} Scenario(s).`,
  )
}

await main()
