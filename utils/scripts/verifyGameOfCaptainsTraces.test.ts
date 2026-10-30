import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CAPTAIN_IDS,
  NEMESES,
  act,
  controls,
  inspect,
  playVoyage,
  randomWalk,
  seedsFacing,
  type Driver,
} from './spaceCouchTraceHarness'
import {
  ANTAGONISTS,
  CAPTAINS,
  antagonistFor,
  counterCrew,
  finishVoyage,
  startVoyage,
  type CaptainId,
  type CrewId,
  type VoyageRun,
} from '../gameOfCaptains/rules'
import { GALACTIC_ENDINGS } from '../gameOfCaptains/galacticEndings'
import {
  UNCLAIMED_ENDINGS,
  UNCLAIMED_ENDING_CAPTAINS,
  type UnclaimedEnding,
} from '../gameOfCaptains/baseEndingCaptains'
import { NEMESIS_COUNTERPLAY } from '../gameOfCaptains/crewJourneys'
import {
  BASE_ENDINGS,
  WARP_ENDINGS,
  endingArtKey,
  endingFamilyTitle,
  voyageStageArt,
} from '../gameOfCaptains/artSlots'
import { warpArt } from '../gameOfCaptains/artManifest'
import { TRIO_ADVENTURES } from '../gameOfCaptains/trioAdventures'

/**
 * t-010: antagonist × captain × crew adversarial traces and every-ending
 * seeded traces, played from the title screen through the page's own path
 * (travel, expedition quests, episode decks, call, order, errands,
 * interludes, finale) by spaceCouchTraceHarness.ts. Every state a trace
 * passes through must save and load intact, keep finite stats, read without
 * template leaks and leave the player a control that moves the voyage.
 *
 * The default run is the CI subset. `--full` (npm run
 * test:game-of-captains:traces) plays the exhaustive matrix: every
 * antagonist × captain × five crew sets × six play styles, every ending ×
 * captain with every state inspected, and a random walk for all 220 parties.
 */
const FULL =
  process.argv.includes('--full') || process.env.SPACE_COUCH_TRACES === 'full'
const started = Date.now()
let voyages = 0

const familyLine = (title: string, captain: CaptainId) =>
  GALACTIC_ENDINGS.find((e) => e.title === title)?.captains[captain] ??
  UNCLAIMED_ENDING_CAPTAINS[title as UnclaimedEnding]?.[captain]
const KNOWN_TITLES = new Set<string>([...WARP_ENDINGS, ...UNCLAIMED_ENDINGS])

/** What every finished voyage owes the player, whatever path reached it. */
function endingContract(run: VoyageRun, where: string) {
  assert.equal(run.phase, 'ending', where)
  const family = endingFamilyTitle(run.ending!)
  assert.ok(KNOWN_TITLES.has(family), `${where}: unknown ending ${run.ending}`)
  const line = familyLine(family, run.captain)
  assert.ok(line && run.scene.includes(line), `${where}: ${run.captain} line`)
  assert.ok(
    run.nemesisEnding?.startsWith(antagonistFor(run).id + '-'),
    `${where}: the nemesis's own ending`,
  )
  assert.ok(
    run.log.some((l) => l.startsWith(`Final captain's log: ${family}.`)),
    `${where}: the final log`,
  )
  // A coda title (`· sign`, `· The Rights of Copies`) never hides the
  // family's own painting.
  if ((BASE_ENDINGS as readonly string[]).includes(family))
    assert.equal(
      voyageStageArt({ ...run, nemesisEnding: null }),
      warpArt(endingArtKey(family)),
      `${where}: ${run.ending} shows the ${family} art`,
    )
}

// Play styles from the t-010 brief: rescuer, noninterventionist, exploiter,
// legalist, a captain who misses calls, and one who runs the hold and the
// force bubble dry while sending nobody (absent crew).
const STYLES: Driver[] = [
  {
    name: 'rescuer',
    order: () => 'aid',
    finale: 'protect',
    errand: (run) => [run.crew[run.chapter % 3]!, 'careful', 'careful'],
    romance: (_run, ids) => ids[0] ?? null,
    instinct: () => 'restraint',
  },
  {
    name: 'noninterventionist',
    order: () => 'observe',
    finale: 'compromise',
    episode: () => 'document',
    sideQuests: false,
    trio: () => 1,
  },
  {
    name: 'exploiter',
    order: () => 'intervene',
    finale: 'compromise',
    episode: () => 'override',
    redshirtsFirst: true,
    instinct: () => 'impulse',
    errand: (run) => [run.crew[run.chapter % 3]!, 'bold', 'bold'],
    romance: (_run, ids) => ids.find((id) => id === 'press') ?? null,
  },
  {
    name: 'legalist',
    order: (run) => (run.chapter % 2 ? 'observe' : 'aid'),
    finale: (run) => (counterCrew(run).length ? 'counter' : 'protect'),
    episode: (run) => (run.chapter % 2 ? 'document' : 'ask'),
    errand: (run) => [run.crew[0]!, 'bold', 'careful'],
    trio: (_run, step) => (step % 2) as 0 | 1,
  },
  {
    name: 'misser',
    order: (run) => (run.chapter % 3 === 1 ? 'miss' : 'aid'),
    finale: 'protect',
    trio: () => null,
  },
  {
    name: 'depleted',
    order: (run) => (run.chapter < 4 ? 'aid' : 'intervene'),
    finale: 'protect',
    room: () => 'infirmary',
    away: () => [],
    instinct: () => 'impulse',
    errand: (run) => [run.crew[run.chapter % 3]!, 'careful', 'careful'],
  },
]
const CREW_SETS: CrewId[][] = [
  ['pell', 'vela', 'tess'],
  ['rue', 'mox', 'jex'],
  ['sora', 'kivo', 'taal'],
  ['brin', 'omi', 'fen'],
  ['vela', 'jex', 'kivo'],
]
/** One of the nemesis's own counter officers, with two others. */
function counterSet(nemesis: string, offset: number): CrewId[] {
  const counter = NEMESIS_COUNTERPLAY[nemesis]![0]!
  const others = CREW_SETS.flat().filter(
    (id, i, all) =>
      all.indexOf(id) === i && !NEMESIS_COUNTERPLAY[nemesis]!.includes(id),
  )
  return [
    counter,
    others[offset % others.length]!,
    others[(offset + 3) % others.length]!,
  ]
}

// 1. Antagonist × captain × crew. Every nemesis meets every captain.
const seenEndings = new Set<string>()
NEMESES.forEach((nemesis, n) => {
  const seeds = seedsFacing(nemesis, FULL ? 3 : 1)
  assert.equal(seeds.length, FULL ? 3 : 1, `${nemesis}: seeds`)
  CAPTAIN_IDS.forEach((captain, c) => {
    const crews = FULL
      ? [counterSet(nemesis, c), ...CREW_SETS]
      : [counterSet(nemesis, c)]
    const styles = FULL ? STYLES : [STYLES[(n + c) % STYLES.length]!]
    crews.forEach((crew, k) => {
      for (const style of styles) {
        const seed = seeds[k % seeds.length]!
        const { run } = playVoyage(captain, crew, seed, style)
        voyages++
        const where = `${nemesis}/${captain}/${crew.join('+')}/${style.name}`
        assert.equal(antagonistFor(run).id, nemesis, where)
        endingContract(run, where)
        seenEndings.add(endingFamilyTitle(run.ending!))
      }
    })
  })
})
assert.ok(
  seenEndings.size >= 5,
  `the matrix reaches varied endings: ${[...seenEndings]}`,
)

// 2. Every ending × every captain, from a new voyage on the page's path. The
// plans are the ones verifyGameOfCaptains.test.ts charts on the short path;
// the expedition layer moves trust and supplies, so each captain keeps the
// first seed (and episode style) that earns the family, pinned below.
type TraceOrder = 'aid' | 'observe' | 'intervene' | 'miss'
type TraceStep = {
  order: TraceOrder
  at?: string
  errand?: [CrewId, 'careful' | 'bold', 'careful' | 'bold']
}
const call = (
  order: TraceOrder,
  at?: string,
  errand?: TraceStep['errand'],
): TraceStep => ({ order, at, errand })
const calls = (count: number, order: TraceOrder) =>
  Array.from({ length: count }, () => call(order))
const ENDING_TRACES: {
  title: string
  captain: CaptainId
  crew: CrewId[]
  order: 'protect' | 'compromise'
  plan: TraceStep[]
  /** How the rest of the voyage is played, when it is not the default. */
  style?: Partial<Driver>
}[] = [
  {
    title: 'CAPTAIN OF THE OPEN HORIZON',
    captain: 'vale',
    crew: ['pell', 'mox', 'rue'],
    order: 'protect',
    plan: [...calls(5, 'aid'), ...calls(4, 'observe')],
  },
  {
    title: 'THE LAST SHIP HOME',
    captain: 'solace',
    crew: ['fen', 'sora', 'jex'],
    order: 'protect',
    plan: [
      ...calls(4, 'intervene'),
      ...calls(3, 'aid'),
      ...calls(2, 'observe'),
    ],
  },
  {
    title: 'THE GALACTIC BARGAIN',
    captain: 'quill',
    crew: ['tess', 'omi', 'kivo'],
    order: 'compromise',
    plan: [...calls(4, 'aid'), ...calls(5, 'observe')],
  },
  {
    title: 'THE COST OF COMMAND',
    captain: 'fluke',
    crew: ['pell', 'mox', 'rue'],
    order: 'compromise',
    plan: [...calls(4, 'intervene'), ...calls(5, 'aid')],
  },
  {
    title: 'RETURN TO SENDER',
    captain: 'fluke',
    crew: ['pell', 'mox', 'rue'],
    order: 'protect',
    plan: [call('miss'), call('miss'), ...calls(7, 'aid')],
  },
  {
    title: 'THE COMPLETE RECORD',
    captain: 'vale',
    crew: ['pell', 'mox', 'rue'],
    order: 'compromise',
    plan: calls(9, 'observe'),
  },
  {
    title: 'THE PERMANENT HEARING',
    captain: 'rex',
    crew: ['fen', 'sora', 'jex'],
    order: 'protect',
    plan: calls(9, 'intervene'),
  },
  {
    title: 'A MOTION OF NO CONFIDENCE',
    captain: 'solace',
    crew: ['tess', 'omi', 'kivo'],
    order: 'protect',
    // A crew loses faith only under a captain who ignores, watches and
    // overrides everything: the episode decks otherwise keep trust high.
    plan: [call('miss'), ...calls(4, 'observe'), ...calls(4, 'intervene')],
    style: {
      episode: () => 'override',
      redshirtsFirst: true,
      away: () => [],
      instinct: () => 'impulse',
      errand: (run) => [run.crew[run.chapter % 3]!, 'bold', 'bold'],
    },
  },
  {
    title: 'SANCTUARY WITHOUT A MAP',
    captain: 'ro',
    crew: ['tess', 'kivo', 'fen'],
    order: 'protect',
    plan: [
      call('aid', 'windglass'),
      ...calls(7, 'aid'),
      call('aid', 'windglass-exodus'),
    ],
  },
  {
    title: 'NAMES ON THE HULL THAT ISN’T',
    captain: 'rex',
    crew: ['pell', 'fen', 'omi'],
    order: 'protect',
    plan: [
      call('aid', 'ashdock'),
      ...calls(6, 'aid'),
      call('aid', 'cushion-recall'),
      call('aid'),
    ],
  },
  {
    title: 'THE UNLICENSED CURE',
    captain: 'quill',
    crew: ['vela', 'taal', 'omi'],
    order: 'protect',
    plan: [
      call('aid', undefined, ['vela', 'careful', 'careful']),
      call('aid', 'haleth', ['vela', 'careful', 'careful']),
      call('aid', undefined, ['vela', 'careful', 'careful']),
      ...calls(6, 'aid'),
    ],
  },
  {
    title: 'THE RIGHT TO REFUSE',
    captain: 'vale',
    crew: ['mox', 'sora', 'pell'],
    order: 'compromise',
    plan: [
      call('aid'),
      call('aid', 'archive'),
      call('aid'),
      call('aid', 'sesh-backups'),
      ...calls(3, 'aid'),
      call('aid', 'foundry-strike'),
      call('aid'),
    ],
  },
  {
    title: 'A TABLE FOR EVERY GUEST',
    captain: 'fluke',
    crew: ['jex', 'omi', 'tess'],
    order: 'compromise',
    plan: [
      ...calls(2, 'aid'),
      call('observe', 'bar'),
      ...calls(3, 'aid'),
      call('observe', 'serendipity-last-call'),
      ...calls(2, 'aid'),
    ],
  },
  {
    title: 'THE COURTESY ACCORD',
    captain: 'ro',
    crew: ['rue', 'taal', 'jex'],
    order: 'compromise',
    plan: [
      ...calls(3, 'aid'),
      call('aid', 'courtesy-reactor'),
      ...calls(3, 'aid'),
      call('aid', 'twins-summit'),
      call('aid'),
    ],
  },
  {
    title: 'THE CUSHIONS ARE DONATED',
    captain: 'solace',
    crew: ['vela', 'brin', 'pell'],
    order: 'protect',
    plan: calls(9, 'aid'),
  },
  {
    title: 'THE MEMOIRS',
    captain: 'rex',
    crew: ['jex', 'omi', 'kivo'],
    order: 'compromise',
    plan: Array.from({ length: 9 }, (_, i) =>
      call(
        'aid',
        undefined,
        i < 4
          ? [(['jex', 'omi', 'kivo'] as const)[i % 3]!, 'bold', 'bold']
          : undefined,
      ),
    ),
  },
]
type Pin = [
  seed: number,
  episode: 'ask' | 'document' | 'override',
  sideQuests: boolean,
]
const ENDING_PINS: Record<string, Record<CaptainId, Pin>> = {
  'CAPTAIN OF THE OPEN HORIZON': {
    fluke: [1, 'ask', true],
    vale: [1, 'ask', true],
    solace: [1, 'ask', true],
    rex: [1, 'ask', true],
    quill: [1, 'ask', true],
    ro: [1, 'ask', true],
  },
  'THE LAST SHIP HOME': {
    fluke: [3, 'override', true],
    vale: [1, 'override', true],
    solace: [1, 'override', true],
    rex: [1, 'override', true],
    quill: [1, 'override', true],
    ro: [3, 'override', true],
  },
  'THE GALACTIC BARGAIN': {
    fluke: [1, 'override', true],
    vale: [1, 'override', true],
    solace: [1, 'override', true],
    rex: [1, 'override', true],
    quill: [1, 'override', true],
    ro: [1, 'override', true],
  },
  'THE COST OF COMMAND': {
    fluke: [1, 'ask', true],
    vale: [1, 'ask', true],
    solace: [1, 'ask', true],
    rex: [1, 'ask', true],
    quill: [1, 'ask', true],
    ro: [1, 'ask', true],
  },
  'RETURN TO SENDER': {
    fluke: [1, 'ask', true],
    vale: [1, 'ask', true],
    solace: [1, 'ask', true],
    rex: [1, 'ask', true],
    quill: [1, 'ask', true],
    ro: [1, 'ask', true],
  },
  'THE COMPLETE RECORD': {
    fluke: [1, 'ask', true],
    vale: [1, 'ask', true],
    solace: [1, 'ask', true],
    rex: [1, 'ask', true],
    quill: [1, 'ask', true],
    ro: [1, 'ask', true],
  },
  'THE PERMANENT HEARING': {
    fluke: [1, 'ask', true],
    vale: [1, 'ask', true],
    solace: [1, 'ask', true],
    rex: [1, 'ask', true],
    quill: [1, 'ask', true],
    ro: [1, 'ask', true],
  },
  'A MOTION OF NO CONFIDENCE': {
    fluke: [3, 'override', true],
    vale: [2, 'override', true],
    solace: [4, 'override', true],
    rex: [2, 'override', true],
    quill: [3, 'override', true],
    ro: [2, 'override', true],
  },
  'SANCTUARY WITHOUT A MAP': {
    fluke: [1, 'ask', true],
    vale: [1, 'ask', true],
    solace: [1, 'ask', true],
    rex: [1, 'ask', true],
    quill: [1, 'ask', true],
    ro: [1, 'ask', true],
  },
  'NAMES ON THE HULL THAT ISN’T': {
    fluke: [1, 'ask', true],
    vale: [1, 'ask', true],
    solace: [1, 'ask', true],
    rex: [1, 'ask', true],
    quill: [1, 'ask', true],
    ro: [1, 'ask', true],
  },
  'THE UNLICENSED CURE': {
    fluke: [6, 'ask', true],
    vale: [6, 'ask', true],
    solace: [6, 'ask', true],
    rex: [6, 'ask', true],
    quill: [6, 'ask', true],
    ro: [6, 'ask', true],
  },
  'THE RIGHT TO REFUSE': {
    fluke: [1, 'ask', true],
    vale: [1, 'ask', true],
    solace: [1, 'ask', true],
    rex: [1, 'ask', true],
    quill: [1, 'ask', true],
    ro: [1, 'ask', true],
  },
  'A TABLE FOR EVERY GUEST': {
    fluke: [1, 'ask', true],
    vale: [1, 'ask', true],
    solace: [1, 'ask', true],
    rex: [1, 'ask', true],
    quill: [1, 'ask', true],
    ro: [1, 'ask', true],
  },
  'THE COURTESY ACCORD': {
    fluke: [1, 'ask', true],
    vale: [1, 'ask', true],
    solace: [1, 'ask', true],
    rex: [1, 'ask', true],
    quill: [1, 'ask', true],
    ro: [1, 'ask', true],
  },
  'THE CUSHIONS ARE DONATED': {
    fluke: [1, 'ask', true],
    vale: [1, 'ask', true],
    solace: [1, 'ask', true],
    rex: [1, 'ask', true],
    quill: [1, 'ask', true],
    ro: [1, 'ask', true],
  },
  'THE MEMOIRS': {
    fluke: [1, 'ask', true],
    vale: [1, 'ask', true],
    solace: [1, 'ask', true],
    rex: [1, 'ask', true],
    quill: [1, 'ask', true],
    ro: [1, 'ask', true],
  },
}
assert.deepEqual(
  ENDING_TRACES.map((t) => t.title).sort(),
  [...WARP_ENDINGS].sort(),
  'one trace per family',
)
for (const trace of ENDING_TRACES)
  for (const captain of CAPTAINS) {
    const [seed, episode, sideQuests] = ENDING_PINS[trace.title]![captain.id]
    const driver: Driver = {
      name: trace.title,
      order: (run) => trace.plan[run.chapter - 1]?.order ?? 'aid',
      chart: (run) => trace.plan[run.chapter - 1]?.at,
      errand: (run) => {
        const errand = trace.plan[run.chapter - 1]?.errand
        return errand ? [...errand] : null
      },
      trio: () => null,
      episode: () => episode,
      sideQuests,
      finale: trace.order,
      ...trace.style,
    }
    const { run } = playVoyage(captain.id, trace.crew, seed, driver, {
      inspectEvery: FULL || captain.id === trace.captain,
    })
    voyages++
    const where = `${trace.title} × ${captain.id} (seed ${seed})`
    assert.equal(endingFamilyTitle(run.ending!), trace.title, where)
    endingContract(run, where)
  }

// 3. The counter council: an officer whose odyssey reached its second stop
// against this nemesis can present the evidence instead of either order.
for (const nemesis of NEMESES) {
  const [seed] = seedsFacing(nemesis, 1)
  const crew = counterSet(nemesis, 1)
  const counsel = crew[0]!
  const driver: Driver = {
    name: 'counter',
    order: () => 'aid',
    errand: (run) =>
      run.chapter <= 3 ? [counsel, 'careful', 'careful'] : null,
    finale: 'counter',
    trio: () => 0,
  }
  for (const captain of FULL
    ? CAPTAIN_IDS
    : [CAPTAIN_IDS[NEMESES.indexOf(nemesis) % 6]!]) {
    let finale: VoyageRun | null = null
    const { run } = playVoyage(captain, crew, seed!, driver, {
      onStep: (_label, _before, after) => {
        if (after.phase === 'finale') finale = after
      },
    })
    voyages++
    const where = `counter/${nemesis}/${captain}`
    assert.ok(finale && counterCrew(finale).includes(counsel), where)
    assert.equal(
      endingFamilyTitle(run.ending!),
      nemesis === 'showrunner'
        ? 'THE UNION CANCELLATION'
        : 'THE WITNESS COALITION',
      where,
    )
    endingContract(run, where)
  }
  // Without the errands the council is not offered, and the order is refused.
  const { run: idle } = playVoyage(
    CAPTAIN_IDS[0]!,
    crew,
    seed!,
    {
      ...driver,
      errand: () => null,
      finale: 'protect',
    },
    {
      inspectEvery: false,
      onStep: (_l, _b, after) => {
        if (after.phase === 'finale') {
          assert.equal(counterCrew(after).length, 0, `${nemesis}: no counsel`)
          assert.equal(
            finishVoyage(after, 'counter'),
            after,
            `${nemesis}: refused`,
          )
          assert.ok(!controls(after).some((c) => c.label === 'finish:counter'))
        }
      },
    },
  )
  voyages++
  assert.notEqual(endingFamilyTitle(idle.ending!), 'THE WITNESS COALITION')
}

// 4. Softlock probes: a seeded player who presses any enabled control, in
// any order (waiting out calls, hiring, recharging, skipping interludes,
// abandoning errands half-way), always reaches an ending.
const walks = FULL
  ? TRIO_ADVENTURES.map((adventure, i) => ({
      crew: [...adventure.crew],
      seed: 1000 + i,
    }))
  : Array.from({ length: 12 }, (_, i) => ({
      crew: [...TRIO_ADVENTURES[(i * 37) % TRIO_ADVENTURES.length]!.crew],
      seed: 500 + i,
    }))
for (const { crew, seed } of walks) {
  const captain = CAPTAIN_IDS[seed % CAPTAIN_IDS.length]!
  const { run } = randomWalk(act.begin(captain, crew as CrewId[], seed), seed)
  voyages++
  endingContract(run, `walk ${seed}`)
}

// 5. Old saves. Saves written by the engine before 2026-10-30's merges (220
// trios, 96 captain endings, 90 mission results) still load and play on to
// an ending, through the page's path and through random play.
const fixture = JSON.parse(
  readFileSync(
    new URL('./fixtures/spaceCouchSaves-2026-10-29.json', import.meta.url),
    'utf8',
  ),
) as { saves: { label: string; save: VoyageRun }[] }
assert.ok(fixture.saves.length >= 6)
for (const { label, save } of fixture.saves) {
  const loaded = act.load(save)
  assert.ok(loaded, `${label}: loads`)
  inspect(loaded, label)
  if (loaded.phase === 'ending') {
    assert.ok(loaded.ending, label)
    continue
  }
  const continued = playVoyage(
    loaded.captain,
    loaded.crew,
    loaded.seed,
    STYLES[0]!,
    {
      from: loaded,
    },
  )
  voyages++
  endingContract(continued.run, `${label}: played on`)
  const walked = randomWalk(loaded, loaded.seed + 7, 900, label)
  voyages++
  endingContract(walked.run, `${label}: walked on`)
}
// The oldest save shape: a version-1 voyage from before origins, star
// charts, expeditions, venues, clones, instincts and party records.
const OPTIONAL: (keyof VoyageRun)[] = [
  'origin',
  'starAssessment',
  'pocketRoom',
  'shieldCharge',
  'missionId',
  'captainInstincts',
  'captainBonus',
  'missionHistory',
  'worldFlags',
  'redshirtRoster',
  'cloneProgram',
  'redshirtFallen',
  'expeditionVisit',
  'expeditionHistory',
  'venueProgress',
  'day',
  'postedDay',
  'active',
  'injuredUntil',
  'journeyProgress',
  'journeyHistory',
  'detourChapter',
  'detour',
  'nemesisPressure',
  'nemesisEnding',
]
for (const captain of FULL ? CAPTAIN_IDS : CAPTAIN_IDS.slice(0, 2)) {
  const fresh = startVoyage(captain, ['pell', 'mox', 'rue'], 77) as Record<
    string,
    unknown
  >
  for (const key of OPTIONAL) delete fresh[key]
  const loaded = act.load(fresh)
  assert.ok(loaded, `${captain}: a bare version-1 save loads`)
  const { run } = randomWalk(loaded, 91, 900, `bare ${captain}`)
  voyages++
  endingContract(run, `bare ${captain}`)
}

// A star or clone coda suffixes the title; the family painting still shows.
const suffixed = {
  ...startVoyage('ro', ['pell', 'mox', 'rue'], 3),
  phase: 'ending' as const,
  ending: 'CAPTAIN OF THE OPEN HORIZON · The Royal Dust Bunny',
  nemesisEnding: null,
}
assert.equal(
  voyageStageArt(suffixed),
  warpArt('endings/captain-of-the-open-horizon'),
)
assert.equal(ANTAGONISTS.length, 8)

console.log(
  `Space Couch ${FULL ? 'exhaustive' : 'CI'} trace matrix: ${voyages} voyages OK in ${Math.round((Date.now() - started) / 1000)}s`,
)
