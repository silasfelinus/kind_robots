import assert from 'node:assert/strict'
import {
  ARRIVAL_LINES,
  CLEAN_SWEEP_LINES,
  DETOUR_LINES,
  LAUNCH_LINES,
  PLOT_TABLE_LINES,
  RETURN_LINES,
  ROUTE_MEMORY_LINES,
  TRAVEL_LINES,
  transitLine,
} from '../gameOfCaptains/transitLines'
import {
  restoreVoyage,
  type CrewId,
  type VoyageRun,
} from '../gameOfCaptains/rules'
import { VOYAGE_CHAPTERS } from '../gameOfCaptains/voyageMap'
import {
  CAPTAIN_IDS,
  CREW_IDS,
  act,
  playVoyage,
  randomWalk,
  type Driver,
} from './spaceCouchTraceHarness'

/**
 * Space Couch readability pass (2026-11-04 PT editorial playtest). About a
 * third of the sentences a player read in one voyage were the same stock
 * transit lines, the most common mission result was one shared sentence for
 * all thirty calls, and the final log was a single ~650-word paragraph.
 * These checks keep connective prose from repeating inside a voyage and
 * keep the ending readable in labelled parts.
 */

const pools: Record<string, readonly unknown[]> = {
  TRAVEL_LINES,
  ARRIVAL_LINES,
  LAUNCH_LINES,
  RETURN_LINES,
  CLEAN_SWEEP_LINES,
  DETOUR_LINES,
  ROUTE_MEMORY_LINES,
  PLOT_TABLE_LINES,
}
const render = (line: unknown) =>
  typeof line === 'function'
    ? (line as (s: string) => string)('Nowhere')
    : String(line)
for (const [name, pool] of Object.entries(pools)) {
  assert.ok(pool.length >= VOYAGE_CHAPTERS, `${name} covers a whole voyage`)
  const texts = pool.map(render)
  assert.equal(new Set(texts).size, texts.length, `${name} has no duplicates`)
  for (const text of texts) assert.ok(text.length > 20, `${name}: ${text}`)
  // Any seed walks nine distinct lines across nine chapters.
  for (const seed of [1, 2, 77, 2026, 99991]) {
    const picks = Array.from({ length: VOYAGE_CHAPTERS }, (_, n) =>
      render(transitLine(pool, name, seed, n)),
    )
    assert.equal(new Set(picks).size, VOYAGE_CHAPTERS, `${name} seed ${seed}`)
  }
}
// Different voyages open on different lines.
const openers = new Set(
  Array.from({ length: 40 }, (_, seed) =>
    transitLine(TRAVEL_LINES, 'travel', seed + 1, 0),
  ),
)
assert.ok(openers.size >= 6, 'voyages do not all open on the same line')

const connective = new Set(
  Object.values(pools)
    .flatMap((pool) => pool.map(render))
    .map((text) => text.split(' Nowhere')[0]!),
)

const sentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 25)

const careful: Driver = {
  name: 'readability',
  order: (run) => (['aid', 'observe', 'intervene'] as const)[run.chapter % 3]!,
  authoredChoices: true,
  errand: (run) => [
    run.crew[run.chapter % run.crew.length]!,
    'careful',
    'bold',
  ],
  finale: (run) => (run.seed % 2 ? 'protect' : 'compromise'),
}

let voyages = 0
let repeats = 0
let total = 0
for (let i = 0; i < 18; i++) {
  const captain = CAPTAIN_IDS[i % CAPTAIN_IDS.length]!
  const crew = [0, 1, 2].map(
    (k) => CREW_IDS[(i * 5 + k * 3) % CREW_IDS.length]!,
  ) as CrewId[]
  const seen = new Set<string>()
  const seenConnective = new Set<string>()
  const { run } = playVoyage(captain, crew, 500 + i * 13, careful, {
    inspectEvery: false,
    onStep: (_label, before, after) => {
      if (!after.scene || after.scene === before.scene) return
      for (const line of sentences(after.scene)) {
        total++
        if (seen.has(line)) repeats++
        seen.add(line)
      }
      for (const line of connective)
        if (after.scene.includes(line)) {
          assert.ok(
            !seenConnective.has(line),
            `${captain}/${crew.join('+')}: connective line repeated in one voyage: ${line}`,
          )
          seenConnective.add(line)
        }
    },
  })
  voyages++
  assert.equal(run.phase, 'ending')
  // The ending reads in labelled parts carrying the whole verdict.
  const sections = run.endingSections ?? []
  assert.ok(sections.length >= 3, 'ending has labelled sections')
  assert.equal(sections[0]!.label, 'The verdict')
  for (const section of sections) {
    assert.ok(section.label.length > 2)
    assert.ok(section.lines.length > 0, section.label)
    for (const line of section.lines)
      assert.ok(line.trim().length > 0, section.label)
  }
  // The verdict and the nemesis's own ending are the same words as the log.
  assert.ok(run.scene.includes(sections[1]!.lines[0]!), 'nemesis ending')
  assert.ok(
    run.scene.startsWith(sections[0]!.lines[0]!.slice(0, 60)),
    'verdict leads the scene',
  )
  // Saves keep the sections; malformed sections are refused.
  const saved = JSON.parse(JSON.stringify(run)) as VoyageRun
  assert.deepEqual(restoreVoyage(saved), run)
  assert.equal(
    restoreVoyage({ ...saved, endingSections: [{ label: 3, lines: [] }] }),
    null,
  )
  const { endingSections: _dropped, ...older } = saved
  assert.ok(restoreVoyage(older), 'older saves without sections still load')
}
const share = repeats / total
assert.ok(
  share < 0.25,
  `within-voyage repeated sentences ${(share * 100).toFixed(1)}% should stay under 25%`,
)

// Random play also ends with sections.
for (const seed of [3, 41, 808]) {
  const { run } = randomWalk(
    act.begin('rex', ['pell', 'omi', 'tess'], seed),
    seed + 9,
  )
  assert.ok((run.endingSections ?? []).length >= 3)
}

console.log(
  `Space Couch readability: ${voyages} voyages, ${(share * 100).toFixed(1)}% repeated sentences, no connective line twice per voyage, sectioned endings OK`,
)
