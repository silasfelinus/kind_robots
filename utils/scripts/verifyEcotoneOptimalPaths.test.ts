import assert from 'node:assert/strict'
import {
  ARCHETYPES,
  COMPANIONS,
  CROSSROADS,
  CROSSROADS_REUNION,
  ENDING_IDS,
  ENDING_LENSES,
  LENSES,
  type Choice,
  type CompanionId,
  type EventId,
  type LensId,
} from '../ecotone/content'
import {
  ALL_CARDS,
  advance,
  chanceToSucceed,
  checkBonus,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  computeEnding,
  createRun,
  crossroadsNewcomer,
  declinedGuideReunion,
  findCard,
  isCrossroadsReunion,
  restoreRun,
  type CrossroadsChoice,
  type RunState,
} from '../ecotone/engine'
import { contextualOpeningChoices } from '../ecotone/sceneOffers'
import * as STORY from '../ecotone/story'
import { EVENTS, FUTURES, ROUTES, SIGNATURES } from '../ecotone/story'

// weird-humboldt t-018: adversarial playtest of the four optimal companion
// paths. Every run plays only the choices the board actually offers
// (contextualOpeningChoices), with real seeded dice and no forced rolls.
const STATES = LENSES.map((lens) => lens.id)
const PERSONAL: CompanionId[] = ['mara', 'kit', 'juniper', 'cedar']
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8]

type Style = 'careful' | 'careless'
type Plan = {
  event: EventId
  lens: LensId
  archetype: string
  seed: number
  area: number
  target: CompanionId
  declineFirst: boolean
  style: Style
}

// Expected change to the three future meters, as the card's own odds show it.
function stakes(state: RunState, choice: Choice): number {
  const worth = (effects: Choice['success']['effects'] | undefined) =>
    (effects?.goodwill ?? 0) +
    (effects?.evidence && !state.evidence.includes(effects.evidence) ? 1 : 0) +
    (effects?.nerve ?? 0) * 0.3
  if (!choice.check) return worth(choice.success.effects)
  const odds = chanceToSucceed(
    choice.check.target - checkBonus(state, choice.check),
  )
  return (
    odds * worth(choice.success.effects) +
    (1 - odds) * worth(choice.failure?.effects ?? choice.success.effects)
  )
}

function crossroadsAnswer(state: RunState, plan: Plan): CrossroadsChoice {
  const newcomer = crossroadsNewcomer(state)
  if (state.activeLead === plan.target) return 'stay'
  return newcomer === plan.target || !state.activeLead ? 'follow' : 'stay'
}

/** Returns null when the board never offers this lens on this route. */
function play(plan: Plan): RunState | null {
  let state = advance(
    chooseEvent(createRun(plan.seed, plan.archetype), plan.event),
  )
  let turns = 0
  let reunions = 0
  while (state.phase !== 'end') {
    assert.ok(++turns < 150, `stalled: ${JSON.stringify(plan)}`)
    if (state.phase === 'fork') {
      assert.ok(state.offered.length >= 2, 'a fork is a real choice')
      state = chooseFork(
        state,
        state.offered[(plan.seed + state.step) % state.offered.length]!,
      )
      continue
    }
    if (state.phase === 'crossroads') {
      const newcomer = crossroadsNewcomer(state)
      assert.ok(newcomer, 'a crossroads always names who is there')
      if (isCrossroadsReunion(state)) {
        reunions++
        assert.equal(newcomer, state.meetingOrder[0])
        assert.deepEqual(
          restoreRun(JSON.parse(JSON.stringify(state))),
          state,
          'a reunion offer survives save/load',
        )
      }
      const before = state.meetingOrder.length
      state = advance(chooseCrossroads(state, crossroadsAnswer(state, plan)))
      assert.equal(new Set(state.meetingOrder).size, state.meetingOrder.length)
      assert.ok(state.meetingOrder.length - before <= 1)
      continue
    }
    const card = findCard(state.card)
    assert.ok(card, 'the route resolves an authored scene')
    const choices = contextualOpeningChoices(card, state).filter(
      (choice) => !choice.locked,
    )
    assert.ok(choices.length, `${card.id} offers a playable choice`)
    let pick: Choice | undefined
    if (!state.openingState && choices.some((choice) => choice.lens)) {
      pick = choices.find((choice) => choice.lens === plan.lens)
      if (!pick) return null
    } else if (!state.prospect && choices.some((choice) => choice.prospect)) {
      const areas = choices.filter((choice) => choice.prospect)
      pick = areas[plan.area % areas.length]
    } else if (choices.some((choice) => choice.meet !== undefined)) {
      pick =
        choices.find((choice) => choice.meet === !plan.declineFirst) ??
        choices.find((choice) => choice.meet !== undefined)
    } else {
      const sign = plan.style === 'careful' ? 1 : -1
      pick = [...choices].sort(
        (a, b) =>
          sign * (stakes(state, b) - stakes(state, a)) ||
          a.id.localeCompare(b.id),
      )[0]
    }
    state = advance(chooseBeat(state, pick!.id))
  }
  assert.ok(reunions <= 1, 'a declined guide comes back at most once')
  if (!state.flags.includes('started_alone'))
    assert.equal(reunions, 0, 'only a declined introduction earns a reunion')
  assert.equal(state.ending, computeEnding(state).id)
  assert.ok(ENDING_IDS.includes(state.ending!))
  for (const meter of [state.nerve, state.goodwill, state.weird, state.wild])
    assert.ok(Number.isFinite(meter) && meter >= 0, 'meters stay real')
  return state
}

type Tally = { runs: number; hope: number; seeds: Set<number> }
const careful = new Map<string, Tally>()
const careless = new Map<string, Tally>()
const rejoined = new Map<string, number>()
// The Kinetic party offers one seeded party favor (sceneOffers.ts), so a
// lens can exist on only some seeds. Hope is judged on the seeds it exists.
const offeredSeeds = new Map<LensId, Set<number>>()
let runs = 0
for (const target of PERSONAL)
  for (const lens of STATES)
    for (const event of EVENTS)
      for (const archetype of ARCHETYPES)
        for (const seed of SEEDS)
          for (const area of [0, 1])
            for (const declineFirst of [true, false])
              for (const style of ['careful', 'careless'] as Style[]) {
                const run = play({
                  event: event.id,
                  lens,
                  archetype: archetype.id,
                  seed,
                  area,
                  target,
                  declineFirst,
                  style,
                })
                if (!run) continue
                runs++
                offeredSeeds.set(
                  lens,
                  (offeredSeeds.get(lens) ?? new Set<number>()).add(seed),
                )
                const ending = computeEnding(run)
                if (ending.lead !== target) continue
                const key = `${target}.${lens}`
                const tally = (style === 'careful' ? careful : careless).get(
                  key,
                ) ?? { runs: 0, hope: 0, seeds: new Set<number>() }
                tally.runs++
                if (ending.fate === 'hope') {
                  tally.hope++
                  tally.seeds.add(seed)
                }
                ;(style === 'careful' ? careful : careless).set(key, tally)
                if (
                  run.meetingOrder[0] === target &&
                  run.flags.includes('started_alone') &&
                  ending.fate === 'hope'
                )
                  rejoined.set(key, (rejoined.get(key) ?? 0) + 1)
              }

for (const companion of PERSONAL)
  for (const lens of STATES) {
    const key = `${companion}.${lens}`
    const good = careful.get(key)
    const poor = careless.get(key)
    assert.ok(good && good.hope > 0, `${key}: a hopeful ending is reachable`)
    // No RNG-only lockout: on every seed that offers this lens, careful play
    // finds the hopeful end.
    const offered = [...(offeredSeeds.get(lens) ?? [])].sort((a, b) => a - b)
    assert.ok(offered.length >= SEEDS.length / 2, `${lens} is really offered`)
    assert.deepEqual(
      [...good.seeds].sort((a, b) => a - b),
      offered,
      `${key}: hope is earned on every seed, not only lucky ones`,
    )
    // Choices matter: careless play can lose the county, careful play does better.
    assert.ok(poor && poor.runs > poor.hope, `${key}: careless play can fail`)
    assert.ok(
      good.hope / good.runs > poor.hope / poor.runs,
      `${key}: careful choices earn hope more often than careless ones`,
    )
  }

// Declining an introduction does not lock that companion's hope
// (COMPANION-OPTIMAL-PATHS.md rule 4): every guide an opening introduces can
// be turned down, met again after the last crossroads and still followed to
// their hopeful personal ending.
const introduced = new Set<string>()
for (const event of EVENTS)
  for (const area of [0, 1, 2, 3]) {
    const opening = advance(chooseEvent(createRun(5, 'local'), event.id))
    let state = opening
    while (!state.prospect && state.phase === 'beat') {
      const card = findCard(state.card)!
      const choices = contextualOpeningChoices(card, state)
      const areas = choices.filter((choice) => choice.prospect)
      const pick = areas.length
        ? areas[area % areas.length]!
        : (choices.find((choice) => choice.lens === 'sober') ?? choices[0]!)
      state = advance(chooseBeat(state, pick.id))
    }
    if (state.prospect) introduced.add(`${event.id}:${state.prospect}`)
  }
assert.ok(introduced.size >= 6, 'each route introduces two different guides')
assert.ok(rejoined.size >= 14, 'rejoining works from every offered lens')
const rejoinedGuides = new Set(
  [...rejoined.keys()].map((key) => key.split('.')[0]),
)
for (const pair of introduced)
  assert.ok(
    rejoinedGuides.has(pair.split(':')[1]!),
    `${pair}: a declined guide can be rejoined for a hopeful ending`,
  )

// The reunion is a real two-way choice: staying alone keeps the solo line.
{
  let state = advance(chooseEvent(createRun(3, 'reporter'), 'green-ribbon'))
  let offered: CompanionId | null = null
  let turns = 0
  while (state.phase !== 'end' && turns++ < 150) {
    if (state.phase === 'fork') state = chooseFork(state, state.offered[0]!)
    else if (state.phase === 'crossroads') {
      if (isCrossroadsReunion(state)) offered = crossroadsNewcomer(state)
      state = advance(chooseCrossroads(state, 'stay'))
    } else {
      const card = findCard(state.card)!
      const choices = contextualOpeningChoices(card, state)
      const pick =
        choices.find((choice) => choice.meet === false) ??
        choices.find((choice) => choice.lens === 'sober') ??
        choices[0]!
      state = advance(chooseBeat(state, pick.id))
    }
  }
  assert.ok(offered, 'the declined guide is offered again')
  assert.equal(offered, state.meetingOrder[0])
  assert.equal(state.activeLead, null)
  assert.equal(declinedGuideReunion(state), null, 'never offered twice')
  assert.ok(state.flags.includes(`stayed_at_${offered}`))
  const last = [...state.log]
    .reverse()
    .find((entry) => entry.source === 'CROSSROADS')
  assert.ok(last?.title.startsWith('Crossroads again'))
  assert.doesNotMatch(last!.text, /will cross again/)
  assert.ok(computeEnding(state).id.startsWith('alone.'))
}

// Reunion prose is its own second meeting, never the first-meeting card.
for (const companion of PERSONAL) {
  const lines = CROSSROADS_REUNION[companion]
  assert.ok(lines.length >= 2)
  const name = COMPANIONS.find((c) => c.id === companion)!.name
  assert.ok(lines.join(' ').includes(name))
  for (const line of lines) assert.ok(!CROSSROADS[companion].includes(line))
}

// The 56 companion ending slots (4 companions x 7 states x 2 fates) are
// distinct, separate from the solo and Wild Way lines.
const companionSlots = ENDING_IDS.filter((id) =>
  PERSONAL.includes(id.split('.')[0] as CompanionId),
)
assert.equal(companionSlots.length, 56)
assert.equal(new Set(companionSlots).size, 56)
assert.equal(ENDING_LENSES.length, 7)
assert.ok(COMPANIONS.length >= 4)
for (const id of companionSlots) {
  const [lead, lens] = id.split('.')
  assert.ok(SIGNATURES[`${lead}.${lens}`], `${id} has a signature`)
}

// Cedar's parents are together in every Cedar epilogue, whatever the lens or
// fate: the line lives in the shared epilogue, not behind a check or a lens.
const parentsTogether =
  /(parents|folks)[^.]{0,80}(together|still-married|holding hands)|still-married parents/i
for (const fate of ['hope', 'dark'] as const) {
  const epilogue = FUTURES.cedar[fate].join(' ')
  assert.match(epilogue, parentsTogether, `Cedar ${fate} epilogue`)
}
const corpus = JSON.stringify([ALL_CARDS, STORY, CROSSROADS_REUNION])
assert.doesNotMatch(
  corpus,
  /Cedar[^"]{0,120}parents[^"]{0,60}(divorc|split up|separat|broke up|left each other)/i,
  "Cedar's parents never separate",
)
assert.doesNotMatch(corpus, /parents_apart|parents_split|parents_divorce/)

// Every route keeps a regular crossroads before its finale, so the reunion
// slot after the last one always exists.
for (const route of Object.values(ROUTES))
  assert.ok(
    route.map((step) => step.kind).lastIndexOf('crossroads') < route.length - 1,
  )

console.log(
  `Ecotone optimal paths: ${runs} board-faithful runs; ${careful.size} companion/lens pairs earn hope on all ${SEEDS.length} seeds; ${rejoined.size} pairs rejoin a declined guide for hope`,
)
