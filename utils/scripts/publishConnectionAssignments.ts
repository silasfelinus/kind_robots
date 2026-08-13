// /utils/scripts/publishConnectionAssignments.ts
//
// Production writer for the fitness pass.
//
//   npx tsx utils/scripts/publishConnectionAssignments.ts --dry-run
//   npx tsx utils/scripts/publishConnectionAssignments.ts
//
// Only `connect` is used. There is no disconnect, no set, no delete anywhere in
// this file, and that is the point: `connect` on an existing link is a no-op in
// Prisma, so a re-run after a partial failure resumes instead of duplicating,
// and a mistaken batch adds a wrong link rather than removing a right one.
//
// `set` would be the natural-looking call for "these are the Characters" and it
// is the one to never reach for -- it replaces the whole relation, so a batch
// listing two Characters for a Scenario that already had five would silently
// drop three.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import prisma from '@/server/utils/prisma'
import {
  ASSIGNMENT_KINDS,
  assignmentKey,
  type Assignment,
  type AssignmentBatch,
} from '@/utils/comments/connectionAssignments'

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
const EXPECTED_RELEASE_GATE = 'GPT-5.6 Sol'
const dir = join(process.cwd(), 'config', 'connection-assignments')

function loadAssignments(): Assignment[] {
  if (!existsSync(dir)) throw new Error(`No batch directory at ${dir}.`)
  const names = readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
  if (!names.length) throw new Error(`No batch files in ${dir}.`)

  const all: Assignment[] = []
  const seen = new Set<string>()
  for (const name of names) {
    const batch = JSON.parse(
      readFileSync(join(dir, name), 'utf8'),
    ) as AssignmentBatch
    if (batch.version !== 1) {
      throw new Error(`${name}: unexpected version ${batch.version}.`)
    }
    if (batch.releaseGate !== EXPECTED_RELEASE_GATE) {
      throw new Error(`${name}: unexpected release gate ${batch.releaseGate}.`)
    }
    for (const [index, assignment] of (batch.assignments || []).entries()) {
      if (!ASSIGNMENT_KINDS.includes(assignment.kind)) {
        throw new Error(`${name}[${index}]: unknown kind ${assignment.kind}.`)
      }
      const key = assignmentKey(assignment)
      if (seen.has(key)) throw new Error(`${name}[${index}]: duplicate ${key}.`)
      seen.add(key)
      all.push(assignment)
    }
  }
  return all
}

async function main() {
  const assignments = loadAssignments()

  // Re-check every referenced row against live state before writing anything.
  // A batch authored yesterday against a Scenario that has since been
  // unpublished must not quietly attach a cast to it.
  const characterIds = new Set<number>()
  const dreamIds = new Set<number>()
  const scenarioIds = new Set<number>()
  for (const assignment of assignments) {
    if (assignment.characterId) characterIds.add(assignment.characterId)
    if (assignment.dreamId) dreamIds.add(assignment.dreamId)
    if (assignment.scenarioId) scenarioIds.add(assignment.scenarioId)
  }

  // Fetch whole tables and filter in memory rather than sending
  // `WHERE id IN (...)` with a couple of hundred parameters.
  //
  // The first dry run sat in this step for fourteen minutes and had to be
  // cancelled. The population publisher queries the same tables in about three
  // seconds -- the only difference was that it selects everything and filters
  // locally. Prisma's MariaDB adapter runs in text-query mode through ProxySQL
  // here, and a 250-parameter IN list is evidently pathological for that path.
  //
  // These tables are hundreds of rows, not millions. Reading all of them is
  // cheaper than being clever.
  const [allCharacters, allDreams, allScenarios] = await serial([
    () => prisma.character.findMany({
      select: { id: true, name: true, isPublic: true, isActive: true },
    }),
    () => prisma.dream.findMany({
      select: { id: true, title: true, isPublic: true, isActive: true },
    }),
    () => prisma.scenario.findMany({
      select: { id: true, title: true, isPublic: true, isActive: true },
    }),
  ])
  const characters = allCharacters.filter((row) => characterIds.has(row.id))
  const dreams = allDreams.filter((row) => dreamIds.has(row.id))
  const scenarios = allScenarios.filter((row) => scenarioIds.has(row.id))

  const characterById = new Map(characters.map((row) => [row.id, row]))
  const dreamById = new Map(dreams.map((row) => [row.id, row]))
  const scenarioById = new Map(scenarios.map((row) => [row.id, row]))

  for (const assignment of assignments) {
    const key = assignmentKey(assignment)
    const check = (
      id: number | undefined,
      label: string,
      row: { isPublic: boolean; isActive: boolean } | undefined,
      liveName: string | undefined,
      claimed: string | undefined,
    ) => {
      if (!id) return
      if (!row) throw new Error(`${key}: ${label} #${id} not found.`)
      if (!row.isPublic || !row.isActive) {
        throw new Error(`${key}: ${label} #${id} is not public/active.`)
      }
      if (claimed && liveName !== claimed) {
        throw new Error(
          `${key}: ${label} #${id} is "${liveName}" in production, batch says "${claimed}".`,
        )
      }
    }
    const character = characterById.get(assignment.characterId as number)
    const dream = dreamById.get(assignment.dreamId as number)
    const scenario = scenarioById.get(assignment.scenarioId as number)
    check(assignment.characterId, 'Character', character, character?.name, assignment.characterName)
    check(assignment.dreamId, 'Dream', dream, dream?.title, assignment.dreamTitle)
    check(assignment.scenarioId, 'Scenario', scenario, scenario?.title, assignment.scenarioTitle)
  }

  console.log(
    'CONNECTIONS_VALIDATED',
    JSON.stringify({
      assignments: assignments.length,
      characters: characterIds.size,
      dreams: dreamIds.size,
      scenarios: scenarioIds.size,
    }),
  )

  if (DRY_RUN) {
    console.log('CONNECTIONS_DRY_RUN', JSON.stringify({ wouldWrite: assignments.length }))
    return
  }

  let written = 0
  for (const assignment of assignments) {
    const key = assignmentKey(assignment)
    switch (assignment.kind) {
      case 'SCENARIO_CHARACTER':
        await prisma.scenario.update({
          where: { id: assignment.scenarioId! },
          data: { Characters: { connect: { id: assignment.characterId! } } },
        })
        break
      case 'SCENARIO_DREAM':
        await prisma.scenario.update({
          where: { id: assignment.scenarioId! },
          data: { Dreams: { connect: { id: assignment.dreamId! } } },
        })
        break
      case 'CHARACTER_DREAM':
        await prisma.character.update({
          where: { id: assignment.characterId! },
          data: { Dreams: { connect: { id: assignment.dreamId! } } },
        })
        break
      default: {
        const never: never = assignment.kind
        throw new Error(`Unhandled kind ${String(never)}`)
      }
    }
    written += 1
    if (written % 50 === 0) {
      console.log('CONNECTIONS_PROGRESS', JSON.stringify({ written, last: key }))
    }
  }

  console.log(
    'CONNECTIONS_COMPLETE',
    JSON.stringify({ assignments: assignments.length, written }),
  )
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
