// /utils/scripts/verifyConnectionAssignments.ts
//
// Offline contract for the fitness-pass assignments. No database.
//
//   npm run test:connections
//
// Everything checkable without a write is checked here, because the publisher
// runs behind Tailscale on a production database and aborts on the first
// problem: without this, a batch with eleven bad rows costs eleven production
// runs to discover. The author-name drift check earned its keep on the comment
// lane for exactly that reason and is repeated here.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  ASSIGNMENT_KINDS,
  assignmentKey,
  KIND_FIELDS,
  MAX_WHY_WORDS,
  MIN_WHY_WORDS,
  type AssignmentBatch,
  type AssignmentKind,
} from '@/utils/comments/connectionAssignments'
import { createFetcher } from '@/utils/comments/fitnessLoader'

function arg(name: string, fallback = ''): string {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}

const baseUrl = arg('base', 'https://kindrobots.org').replace(/\/+$/, '')
const EXPECTED_RELEASE_GATE = 'GPT-5.6 Sol'
const dir = join(process.cwd(), 'config', 'connection-assignments')

const failures: string[] = []
const fail = (message: string) => failures.push(message)

function loadBatches(): Array<{ name: string; batch: AssignmentBatch }> {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({
      name,
      batch: JSON.parse(readFileSync(join(dir, name), 'utf8')) as AssignmentBatch,
    }))
}

async function main() {
  const batches = loadBatches()
  if (!batches.length) {
    console.log('No connection assignment batches yet; nothing to verify.')
    return
  }

  const get = createFetcher(baseUrl)
  const [characters, dreams, scenarios] = await Promise.all([
    get<Array<{ id: number; name: string; isPublic?: boolean; isActive?: boolean }>>(
      '/api/characters',
    ),
    get<Array<{ id: number; title: string; isPublic?: boolean; isActive?: boolean }>>(
      '/api/dreams',
    ),
    get<
      Array<{
        id: number
        title: string
        isPublic?: boolean
        isActive?: boolean
        Dreams?: Array<{ id: number }>
        Characters?: Array<{ id: number }>
      }>
    >('/api/scenarios'),
  ])

  const characterById = new Map(characters.map((row) => [row.id, row]))
  const dreamById = new Map(dreams.map((row) => [row.id, row]))
  const scenarioById = new Map(scenarios.map((row) => [row.id, row]))

  // What production already has, so a batch that re-proposes an existing link is
  // reported rather than silently counted as new work.
  const existing = new Set<string>()
  for (const scenario of scenarios) {
    for (const dream of scenario.Dreams || []) {
      existing.add(`SCENARIO_DREAM:${scenario.id}:${dream.id}`)
    }
    for (const character of scenario.Characters || []) {
      existing.add(`SCENARIO_CHARACTER:${scenario.id}:${character.id}`)
    }
  }

  const seen = new Map<string, string>()
  let total = 0
  let alreadyLinked = 0
  const perKind = new Map<AssignmentKind, number>()

  for (const { name, batch } of batches) {
    if (batch.version !== 1) {
      fail(`${name}: unexpected version ${batch.version}.`)
      continue
    }
    if (batch.releaseGate !== EXPECTED_RELEASE_GATE) {
      fail(`${name}: unexpected release gate ${batch.releaseGate}.`)
    }
    if (!Array.isArray(batch.assignments) || !batch.assignments.length) {
      fail(`${name}: no assignments.`)
      continue
    }

    for (const [index, assignment] of batch.assignments.entries()) {
      const at = `${name}[${index}]`
      total += 1

      if (!ASSIGNMENT_KINDS.includes(assignment.kind)) {
        fail(`${at}: unknown kind ${assignment.kind}.`)
        continue
      }
      perKind.set(assignment.kind, (perKind.get(assignment.kind) || 0) + 1)

      const [leftField, rightField] = KIND_FIELDS[assignment.kind]
      for (const field of [leftField!, rightField!]) {
        const value = (assignment as unknown as Record<string, unknown>)[field]
        if (!Number.isInteger(value) || (value as number) <= 0) {
          fail(`${at}: ${field} must be a positive integer, got ${String(value)}.`)
        }
      }

      const why = String(assignment.why || '').trim()
      const whyWords = why.split(/\s+/).filter(Boolean).length
      if (whyWords < MIN_WHY_WORDS) {
        fail(`${at}: why is ${whyWords} word(s); at least ${MIN_WHY_WORDS} needed.`)
      }
      if (whyWords > MAX_WHY_WORDS) {
        fail(`${at}: why is ${whyWords} word(s); at most ${MAX_WHY_WORDS}.`)
      }

      const key = assignmentKey(assignment)
      const previous = seen.get(key)
      if (previous) {
        fail(`${at}: duplicate of ${previous} (${key}).`)
      } else {
        seen.set(key, at)
      }
      if (existing.has(key)) alreadyLinked += 1

      // Row existence and name drift. A renamed row whose id still resolves is
      // the dangerous case: the link would be written, correctly, onto an object
      // the author was not looking at.
      const checkRow = (
        id: number | undefined,
        title: string | undefined,
        label: string,
        lookup: Map<number, { isPublic?: boolean; isActive?: boolean }>,
        liveName: (row: never) => string,
      ) => {
        if (!Number.isInteger(id)) return
        const row = lookup.get(id as number)
        if (!row) {
          fail(`${at}: ${label} #${id} does not exist in production.`)
          return
        }
        if (row.isPublic === false || row.isActive === false) {
          fail(`${at}: ${label} #${id} is not public/active.`)
        }
        if (title) {
          const live = liveName(row as never)
          if (live !== title) {
            fail(
              `${at}: ${label} #${id} is "${live}" in production, batch says "${title}".`,
            )
          }
        }
      }

      checkRow(
        assignment.characterId,
        assignment.characterName,
        'Character',
        characterById,
        (row: { name: string }) => row.name,
      )
      checkRow(
        assignment.dreamId,
        assignment.dreamTitle,
        'Dream',
        dreamById,
        (row: { title: string }) => row.title,
      )
      checkRow(
        assignment.scenarioId,
        assignment.scenarioTitle,
        'Scenario',
        scenarioById,
        (row: { title: string }) => row.title,
      )
    }
  }

  if (failures.length) {
    console.error(`Connection assignment contract FAILED (${failures.length}):`)
    for (const message of failures) console.error(`  - ${message}`)
    process.exit(1)
  }

  const summary = [...perKind.entries()]
    .map(([kind, n]) => `${kind} ${n}`)
    .join(', ')
  console.log(
    `Connection assignments verified: ${total} across ${batches.length} batch file(s) -- ${summary}.`,
  )
  if (alreadyLinked) {
    console.log(
      `${alreadyLinked} already present in production; the publisher will skip them.`,
    )
  }
}

await main()
