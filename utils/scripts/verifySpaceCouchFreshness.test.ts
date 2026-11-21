import assert from 'node:assert/strict'
import {
  ACT_THREE_OPENINGS,
  ACT_TWO_OPENINGS,
  CONSTELLATION_CODAS,
  ERRAND_AFTERMATH,
  ERRAND_CALLBACKS,
  ERRAND_ENTRANCES,
  FINALE_LINES,
  POLICY_LINES,
  SETBACK_LINES,
  freshLine,
} from '../gameOfCaptains/freshLines'
import {
  ARRIVAL_LINES,
  CLEAN_SWEEP_LINES,
  DETOUR_LINES,
  LAUNCH_LINES,
  PLOT_TABLE_LINES,
  RETURN_LINES,
  ROUTE_MEMORY_LINES,
  TRAVEL_LINES,
  WAITING_LINES,
} from '../gameOfCaptains/transitLines'
import { PLANET_CARDS } from '../gameOfCaptains/episodeConsole'
import { ACT_TWO_RESUPPLY } from '../gameOfCaptains/actTwo'
import { ACT_THREE_RESUPPLY } from '../gameOfCaptains/actThree'
import type { CrewId } from '../gameOfCaptains/rules'
import {
  CAPTAIN_IDS,
  CREW_IDS,
  playVoyage,
  type Driver,
} from './spaceCouchTraceHarness'

/**
 * Space Couch freshness pass (t-038, 2026-11-11 PT). A 36-voyage seeded
 * probe found 169 sentences shown in at least two-thirds of all voyages, so
 * a returning player reread the same jokes. These checks keep the stock
 * beats in seeded pools and pin the cross-voyage repetition well below that.
 */

// 1. Pools are full, distinct and free of placeholder lines.
const words = (line: string) => line.split(/\s+/).length
const pools: Record<string, readonly string[]> = {
  ...Object.fromEntries(
    Object.entries(SETBACK_LINES).flatMap(([deck, byChoice]) =>
      Object.entries(byChoice).map(([choice, pool]) => [
        `setback:${deck}:${choice}`,
        pool,
      ]),
    ),
  ),
  ...Object.fromEntries(
    Object.entries(ERRAND_ENTRANCES).map(([k, v]) => [`entrance:${k}`, v]),
  ),
  ...Object.fromEntries(
    Object.entries(ERRAND_AFTERMATH).map(([k, v]) => [`aftermath:${k}`, v]),
  ),
  ...Object.fromEntries(
    Object.entries(ERRAND_CALLBACKS).map(([k, v]) => [`callback:${k}`, v]),
  ),
  ...Object.fromEntries(
    Object.entries(CONSTELLATION_CODAS).map(([k, v]) => [`coda:${k}`, v]),
  ),
  ...Object.fromEntries(
    Object.entries(POLICY_LINES).map(([k, v]) => [`policy:${k}`, v]),
  ),
  ACT_TWO_OPENINGS,
  ACT_THREE_OPENINGS,
  FINALE_LINES,
}
const everyLine = new Set<string>()
for (const [name, pool] of Object.entries(pools)) {
  assert.ok(pool.length >= 4, `${name} has a real pool`)
  for (const line of pool) {
    assert.ok(words(line) >= 5, `${name}: too short: ${line}`)
    assert.ok(!/TODO|lorem|\{|\}/i.test(line), `${name}: placeholder: ${line}`)
    assert.ok(!everyLine.has(line), `${name}: duplicate line: ${line}`)
    everyLine.add(line)
  }
}
// Every errand pool covers all nine errand steps of a voyage without repeats.
for (const pool of [
  ...Object.values(ERRAND_ENTRANCES),
  ...Object.values(ERRAND_AFTERMATH),
  ...Object.values(ERRAND_CALLBACKS),
])
  assert.ok(pool.length >= 9, 'errand pools cover three crew times three steps')
// Act openers keep the act heading and the supply count the engine delivers.
const crates = ['no', 'one', 'two', 'three', 'four']
for (const line of ACT_TWO_OPENINGS) {
  assert.ok(line.startsWith('ACT II: UNWELCOME RESPONSIBILITY. '), line)
  assert.ok(line.toLowerCase().includes(`${crates[ACT_TWO_RESUPPLY]} crates`))
}
for (const line of ACT_THREE_OPENINGS) {
  assert.ok(line.startsWith('ACT III: THE LAST COMMAND. '), line)
  assert.ok(line.toLowerCase().includes(`${crates[ACT_THREE_RESUPPLY]} crates`))
}
// A failed card never claims the objective was won.
for (const byChoice of Object.values(SETBACK_LINES))
  for (const pool of Object.values(byChoice))
    for (const line of pool)
      assert.ok(!/\b(secures?|succeeds? in securing)\b/i.test(line), line)
// Connective transit pools are large enough that no line is in most voyages.
for (const [name, pool] of Object.entries({
  TRAVEL_LINES,
  ARRIVAL_LINES,
  LAUNCH_LINES,
  RETURN_LINES,
  CLEAN_SWEEP_LINES,
  DETOUR_LINES,
  ROUTE_MEMORY_LINES,
  PLOT_TABLE_LINES,
}))
  assert.ok(pool.length >= 20, `${name} holds 20 lines`)
assert.ok(WAITING_LINES.length >= 26, 'WAITING_LINES holds 26 lines')

// Each planet/order has its own comic follow-through without changing the
// first clause: new successes keep a stable rescue beat and meaningful follow-through.
const planetSuccessLeads = [
  {
    title: 'The Moon That Requested Custody',
    ask: 'Local residents vote to lend the moon its tides on alternate Thursdays.',
    document: 'The ancient ownership deed names the moon as its own guardian.',
    override:
      'The couch redirects a lethal tide before it reaches the fishing village.',
  },
  {
    title: 'A Refugee Named Wednesday',
    ask: 'The traveler chooses a safe place to wait for the paradox.',
    document: 'A protected testimony makes the arrest order invalid.',
    override: 'The cushions shelter Wednesday until the warrant expires.',
  },
  {
    title: 'The Union of Unpaid Suns',
    ask: 'The workers negotiate a rotating daylight schedule.',
    document:
      'Payroll records reveal the star owners have been billing the planets twice.',
    override:
      'The couch restarts a striking sun long enough to thaw the nursery’s emergency heaters, then hands the switch back to the union.',
  },
  {
    title: 'The Garden That Refused Oxygen',
    ask: 'A public forum funds an alternative oxygen supply.',
    document: 'The grove establishes that its employment contract was forged.',
    override:
      'The couch forces one last breath from the orchard to keep the clinic alive until backup arrives.',
  },
  {
    title: 'The Diplomatic Temperature Incident',
    ask: 'The delegates insist on an interpreter they actually trust.',
    document: 'An archived thermal recording identifies the disputed vote.',
    override:
      'The bubble warms a freezing delegate before the frost vote becomes a medical emergency.',
  },
  {
    title: 'A Planet Requests an Exit Interview',
    ask: 'The planet dictates terms to a neutral mediator.',
    document: 'Mineral ledgers prove centuries of unpaid extraction.',
    override:
      'The couch stops the drill and opens a corridor wide enough for trapped miners to reach daylight.',
  },
  {
    title: 'The Twelve-Hour Apology',
    ask: 'Survivors choose whether any apology will be heard.',
    document:
      'Unaltered recordings preserve the evidence before the broadcast is stopped.',
    override:
      'The couch cuts the broadcast before another child loses their memories.',
  },
  {
    title: 'The Missing Note Committee',
    ask: 'Residents decide when the alarm may be sounded.',
    document:
      'The missing waveform identifies who silenced the original warning.',
    override:
      'The couch sounds every bell before the surge reaches the schools, shattering the palace’s ceremonial windows.',
  },
  {
    title: 'The Interstellar Costume Inspector',
    ask: 'The inspector interviews the passengers and reinstates their personhood.',
    document:
      'An old registration stamp proves the couch has always been a vehicle.',
    override:
      'The couch crosses the checkpoint before its imaginary passengers can be stranded in vacuum.',
  },
  {
    title: 'The Gravity Refund Office',
    ask: 'Tenants negotiate a public gravity guarantee.',
    document: 'The hidden meter exposes the company’s fraudulent readings.',
    override:
      'The couch steadies an apartment tower while it reroutes the gravity meter; nobody falls through the stairwell.',
  },
]
const planetSuccessScenes = new Set<string>()
assert.equal(PLANET_CARDS.length, 10)
for (const card of PLANET_CARDS) {
  const expected = planetSuccessLeads.find(
    (entry) => entry.title === card.title,
  )
  assert.ok(expected, `Unrecognized planet card: ${card.title}`)
  for (const order of ['ask', 'document', 'override'] as const) {
    const scene = card[order]
    assert.ok(
      scene.startsWith(`${expected[order]} `),
      `Original ${card.title} ${order} result changed`,
    )
    assert.ok(
      scene.slice(expected[order].length).trim().length >= 35,
      `No specific second beat for ${card.title} ${order}`,
    )
    assert.ok(
      !planetSuccessScenes.has(scene),
      `Duplicate planet success: ${card.title} ${order}`,
    )
    planetSuccessScenes.add(scene)
  }
}
assert.equal(planetSuccessScenes.size, 30)

// 2. Selection is deterministic and walks a pool without repeats.
for (const seed of [1, 42, 2026]) {
  const picks = Array.from({ length: 6 }, (_, n) =>
    freshLine(SETBACK_LINES.planet.ask, 'setback:planet:ask', seed, n),
  )
  assert.equal(new Set(picks).size, 6, `setbacks walk the pool, seed ${seed}`)
  assert.deepEqual(
    picks,
    Array.from({ length: 6 }, (_, n) =>
      freshLine(SETBACK_LINES.planet.ask, 'setback:planet:ask', seed, n),
    ),
  )
}
const openers = new Set(
  Array.from({ length: 60 }, (_, seed) =>
    freshLine(ACT_TWO_OPENINGS, 'act-two', seed + 1, 0),
  ),
)
assert.ok(openers.size >= 5, 'voyages open Act II differently')

// 3. Cross-voyage freshness: whole voyages, read as a returning player.
const sentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 25)
const orders = ['aid', 'observe', 'intervene'] as const
const VOYAGES = 36
const freq = new Map<string, number>()
for (let i = 0; i < VOYAGES; i++) {
  const captain = CAPTAIN_IDS[i % CAPTAIN_IDS.length]!
  const crew = [0, 1, 2].map(
    (k) => CREW_IDS[(i * 7 + k * 5) % CREW_IDS.length]!,
  ) as CrewId[]
  const driver: Driver = {
    name: 'freshness',
    order: (run) => orders[(run.chapter + i) % 3]!,
    authoredChoices: true,
    errand: (run) => [
      run.crew[run.chapter % run.crew.length]!,
      i % 2 ? 'careful' : 'bold',
      'bold',
    ],
    finale: (run) => (run.seed % 2 ? 'protect' : 'compromise'),
  }
  const seen = new Set<string>()
  const { run } = playVoyage(captain, crew, 900 + i * 31, driver, {
    inspectEvery: false,
    onStep: (_label, before, after) => {
      if (!after.scene || after.scene === before.scene) return
      for (const line of sentences(after.scene)) seen.add(line)
    },
  })
  assert.equal(run.phase, 'ending')
  for (const line of seen) freq.set(line, (freq.get(line) ?? 0) + 1)
}
const common = [...freq].filter(([, n]) => n >= (VOYAGES * 2) / 3)
// 169 before the pass; 39 after. Leave headroom for new structural lines.
assert.ok(
  common.length <= 60,
  `${common.length} sentences appear in two-thirds of voyages:\n` +
    common
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([line, n]) => `${n}  ${line}`)
      .join('\n'),
)
// No stock joke from the pools here is in nearly every voyage (the act
// headings are fixed on purpose).
const stale = [...freq].filter(
  ([line, n]) =>
    !line.startsWith('ACT ') &&
    n >= VOYAGES - 2 &&
    [...everyLine].some((l) => l.includes(line)),
)
assert.deepEqual(stale, [], 'a pooled line shows up in almost every voyage')

console.log(
  `Space Couch freshness: ${everyLine.size} pooled lines; ${common.length} sentences in two-thirds of ${VOYAGES} voyages`,
)
