import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ARCHETYPES,
  COMPANIONS,
  ENDING_IDS,
  type Choice,
  type CompanionId,
  type EventId,
} from '../ecotone/content'
import {
  MAX_METER,
  advance,
  chanceToSucceed,
  checkBonus,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  createRun,
  crossroadsNewcomer,
  drawFork,
  encounterEligible,
  findCard,
  restoreRun,
  routeFor,
  type CrossroadsChoice,
  type RunState,
} from '../ecotone/engine'
import {
  COMPANION_TIME,
  COMPANION_TIME_DECLINE,
  COMPANION_TIME_FLAGS,
  companionTimeSpent,
} from '../ecotone/companionTime'
import {
  CHOSEN_FAMILY_MIN_GUIDES,
  chosenFamilyEnding,
} from '../ecotone/chosenFamily'
import {
  COMPANION_HANGOUTS,
  chosenFamilyCoda,
  companionBondCounts,
} from '../ecotone/companionHangouts'
import { QUEST_CARDS } from '../ecotone/questExpansion'
import { ecotoneArtSlots, cardArtKey, outcomeArtKey } from '../ecotone/artSlots'
import { ecotoneArtPrompt } from '../ecotone/artPrompts'
import { contextualOpeningChoices } from '../ecotone/sceneOffers'
import { EVENTS, ROUTES } from '../ecotone/story'

// weird-humboldt t-045: a free hour with every guide you have met, and the
// chosen-family ending it can lead to.
const IDS: CompanionId[] = COMPANIONS.map((c) => c.id)
const nameOf = (id: CompanionId) =>
  COMPANIONS.find((c) => c.id === id)?.name ?? id
const slots = ecotoneArtSlots()
const TIME_IDS = new Set(Object.values(COMPANION_TIME).map((card) => card.id))

// --- The four scenes: light, distinct, optional -----------------------------
assert.deepEqual(Object.keys(COMPANION_TIME).sort(), [...IDS].sort())
assert.equal(TIME_IDS.size, 4)
const bodies = new Set<string>()
for (const id of IDS) {
  const card = COMPANION_TIME[id]
  const name = nameOf(id)
  assert.ok(card.body.join(' ').includes(name), `${card.id} is about ${name}`)
  bodies.add(card.body.join(' '))
  assert.equal(findCard(card.id)?.id, card.id, 'saves can find the scene')
  assert.ok(slots.cards.includes(cardArtKey(card.id)))
  assert.ok(ecotoneArtPrompt(cardArtKey(card.id)), `${card.id} has a prompt`)
  assert.equal(card.choices.length, 3)
  const decline = card.choices.at(-1)!
  assert.equal(decline.id, COMPANION_TIME_DECLINE, 'saying no is always there')
  assert.deepEqual(decline.success.effects, {}, 'saying no costs nothing')
  const engaged = card.choices.slice(0, 2)
  assert.equal(
    engaged.filter((choice) => choice.success.effects.nerve === 1).length,
    1,
    `${card.id}: exactly one way to spend it steadies your nerve`,
  )
  for (const choice of card.choices) {
    assert.ok(!choice.check, `${card.id}/${choice.id}: no dice, no difficulty`)
    assert.ok(!choice.success.effects.goodwill, 'free hours never buy goodwill')
    assert.ok(!choice.success.effects.evidence, 'or evidence')
    assert.ok(
      slots.outcomes.includes(outcomeArtKey(card.id, choice.id, 'success')),
    )
  }
  for (const choice of engaged) {
    const flag = choice.success.effects.flag
    assert.ok(flag?.startsWith(`bond_${id}_time_`), `${choice.id} is a memory`)
    assert.equal(COMPANION_TIME_FLAGS[flag!], id)
  }
  // Other guides who happen to be traveling step aside in their own voice.
  for (const other of IDS.filter((x) => x !== id))
    assert.ok(card.leadLines?.[other], `${other} has a line in ${card.id}`)
  assert.ok(!card.leadLines?.[id])
  // Never dealt by a random fork.
  const quest = QUEST_CARDS.find((candidate) => candidate.id === card.id)
  assert.ok(quest?.digressionOnly)
  assert.equal(
    encounterEligible(quest!, createRun(3, 'reporter')),
    false,
    'a free hour is never a white-rabbit card',
  )
}
assert.equal(bodies.size, 4, 'each guide has their own scene')
assert.equal(Object.keys(COMPANION_TIME_FLAGS).length, 8)

const corpus = JSON.stringify(COMPANION_TIME)
assert.doesNotMatch(
  corpus,
  /divorc|split up|separat|broke up|jealous/i,
  "no jealousy, and Cedar's parents stay together",
)
assert.match(COMPANION_TIME.cedar.body.join(' '), /Mom made it, Dad corrected/)

// --- Seeded play drivers ------------------------------------------------------
type Style = 'warm' | 'careless' | 'distracted'

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

type Trace = {
  offered: CompanionId[]
  restoredMidScene: number
}

/**
 * warm: accepts the opening guide, invites newcomers along, spends every free
 * hour (alternating the two ways by seed) and otherwise picks the choice with
 * the best expected effect. careless: also invites everyone along (so private
 * interludes alone are tested), but turns down every free hour and picks the
 * worst expected effect. distracted: spends every free hour but otherwise
 * plays like careless, so the county itself is at risk.
 */
function play(
  event: EventId,
  seed: number,
  archetype: string,
  style: Style,
  trace?: Trace,
): RunState {
  let state = advance(chooseEvent(createRun(seed, archetype), event))
  let turns = 0
  while (state.phase !== 'end') {
    assert.ok(++turns < 160, `stalled: ${event} ${seed} ${style}`)
    if (state.phase === 'fork') {
      state = chooseFork(state, state.offered[seed % state.offered.length]!)
      continue
    }
    if (state.phase === 'crossroads') {
      assert.ok(crossroadsNewcomer(state))
      const answer: CrossroadsChoice = state.activeLead ? 'together' : 'follow'
      state = advance(chooseCrossroads(state, answer))
      continue
    }
    const card = findCard(state.card)!
    if (TIME_IDS.has(card.id)) {
      const who = IDS.find((id) => COMPANION_TIME[id].id === card.id)!
      assert.ok(state.meetingOrder.includes(who), 'only a met guide offers')
      assert.ok(!trace || !trace.offered.includes(who), 'offered once a run')
      // It sits between days, or just before the finale.
      const route = routeFor(state)
      const here = route[state.step]!
      const next = route[state.step + 1]!
      assert.ok(next.kind === 'finale' || next.day !== here.day)
      if (trace) {
        trace.offered.push(who)
        assert.deepEqual(restoreRun(JSON.parse(JSON.stringify(state))), state)
        trace.restoredMidScene++
      }
      const before = state
      const pick =
        style === 'careless'
          ? COMPANION_TIME_DECLINE
          : card.choices[seed % 2]!.id
      state = chooseBeat(state, pick)
      if (pick === COMPANION_TIME_DECLINE) {
        for (const key of [
          'nerve',
          'goodwill',
          'weird',
          'wild',
          'evidence',
          'flags',
        ] as const)
          assert.deepEqual(state[key], before[key], `declining keeps ${key}`)
      }
      state = advance(state)
      continue
    }
    const choices = contextualOpeningChoices(card, state).filter(
      (choice) => !choice.locked,
    )
    let pick: Choice
    if (!state.openingState && choices.some((choice) => choice.lens))
      pick = choices.filter((choice) => choice.lens)[seed % 3] ?? choices[0]!
    else if (!state.prospect && choices.some((choice) => choice.prospect))
      pick = choices.filter((choice) => choice.prospect)[seed % 2]!
    else if (choices.some((choice) => choice.meet !== undefined))
      pick = choices.find((choice) => choice.meet === true)!
    else {
      const sign = style === 'warm' ? 1 : -1
      pick = [...choices].sort(
        (a, b) =>
          sign * (stakes(state, b) - stakes(state, a)) ||
          a.id.localeCompare(b.id),
      )[0]!
    }
    state = advance(chooseBeat(state, pick.id))
  }
  assert.ok(ENDING_IDS.includes(state.ending!))
  assert.ok(state.nerve >= 0 && state.nerve <= MAX_METER, 'nerve stays bounded')
  for (const meter of [state.nerve, state.goodwill, state.weird, state.wild])
    assert.ok(Number.isFinite(meter) && meter >= 0, 'meters stay real')
  return state
}

const offeredBy = new Map<CompanionId, number>()
const familyByEvent = new Map<EventId, number>()
const familyMembers = new Set<CompanionId>()
const fatesByStyle = new Map<string, Set<string>>()
let warmRuns = 0
let carelessFamilies = 0
let distractedRuns = 0
let distractedFamilies = 0
let codaRuns = 0
let restoredMidScene = 0
const SEEDS = Array.from({ length: 24 }, (_, i) => i + 1)
for (const event of EVENTS)
  for (const archetype of ARCHETYPES)
    for (const seed of SEEDS)
      for (const style of ['warm', 'careless', 'distracted'] as Style[]) {
        const trace: Trace = { offered: [], restoredMidScene: 0 }
        const run = play(event.id, seed, archetype.id, style, trace)
        restoredMidScene += trace.restoredMidScene
        for (const who of trace.offered)
          offeredBy.set(who, (offeredBy.get(who) ?? 0) + 1)
        // Every met guide got their offer before the weekend ended.
        assert.deepEqual(
          [...trace.offered].sort(),
          [...run.meetingOrder].sort(),
          'every guide you met offers a free hour',
        )
        const fate = run.ending!.split('.')[2]!
        const key = `${style}:${event.id}`
        fatesByStyle.set(key, (fatesByStyle.get(key) ?? new Set()).add(fate))
        const family = chosenFamilyEnding(
          run,
          fate === 'hope' ? 'hope' : 'dark',
          nameOf,
        )
        if (style === 'careless') {
          if (family) carelessFamilies++
          assert.deepEqual(companionTimeSpent(run.flags, run.meetingOrder), [])
          continue
        }
        if (style === 'distracted') {
          distractedRuns++
          if (family) distractedFamilies++
          continue
        }
        warmRuns++
        if (chosenFamilyCoda(run.flags, nameOf)) codaRuns++
        if (!family) continue
        familyByEvent.set(event.id, (familyByEvent.get(event.id) ?? 0) + 1)
        assert.equal(fate, 'hope', 'a utopia needs a hopeful county')
        assert.ok(family.members.length >= CHOSEN_FAMILY_MIN_GUIDES)
        for (const member of family.members) {
          familyMembers.add(member)
          assert.ok(run.meetingOrder.includes(member), 'only people you met')
          assert.ok(companionBondCounts(run.flags)[member] >= 1)
        }
        assert.ok(restoreRun(JSON.parse(JSON.stringify(run))))
      }

// Each guide's free hour turns up in ordinary seeded play.
for (const id of IDS)
  assert.ok(
    (offeredBy.get(id) ?? 0) > 0,
    `${id}'s free hour is reachable in play`,
  )
assert.ok(restoredMidScene > 0, 'a free hour survives a mid-scene save')

// The chosen-family ending: reachable on every route by warm play, never by
// careless play, and each guide can be part of it.
for (const event of EVENTS)
  assert.ok(
    (familyByEvent.get(event.id) ?? 0) > 0,
    `${event.id}: the chosen-family ending is reachable`,
  )
assert.equal(carelessFamilies, 0, 'careless play never reaches it')
assert.deepEqual([...familyMembers].sort(), [...IDS].sort())
const familyTotal = [...familyByEvent.values()].reduce((a, b) => a + b, 0)
// Earned, not automatic: spending the hours is not enough if the county is
// lost along the way.
assert.ok(
  distractedFamilies < distractedRuns,
  'free hours alone do not guarantee it',
)
assert.ok(familyTotal / warmRuns > distractedFamilies / distractedRuns)
// Invitations plus free hours finally let two guides become close friends,
// so the existing chosen-family coda is reachable in play, not only in theory.
assert.ok(codaRuns > 0, 'the chosen-family coda is reachable')

// Free hours never take a fate off the table: on every route a player who
// spends every hour can still lose the county, and one who turns them all
// down can still lose it or (with warm play elsewhere) win it.
for (const event of EVENTS) {
  for (const style of ['careless', 'distracted'] as Style[])
    assert.ok(
      fatesByStyle.get(`${style}:${event.id}`)?.has('dark'),
      `${style} ${event.id}: dark stays reachable`,
    )
  assert.ok(fatesByStyle.get(`warm:${event.id}`)?.has('hope'))
}

// --- The ending itself ---------------------------------------------------------
{
  const flags = [
    'bond_mara_time_line',
    'bond_kit_time_roadie',
    'bond_cedar_time_stars',
  ]
  const order: CompanionId[] = ['cedar', 'kit', 'mara', 'juniper']
  const run = { flags, meetingOrder: order }
  const ending = chosenFamilyEnding(run, 'hope', nameOf)
  assert.ok(ending)
  assert.deepEqual(ending.members, ['cedar', 'kit', 'mara'])
  const text = ending.paragraphs.join(' ')
  assert.match(ending.paragraphs[0]!, /Cedar, Kit and Mara/)
  assert.match(text, /still married/, "Cedar's parents are together")
  assert.match(text, /asked for out loud/, 'every kind of love is consensual')
  assert.doesNotMatch(text, /jealous|rival|winner|choose between/i)
  assert.equal(chosenFamilyEnding(run, 'dark', nameOf), null)
  assert.equal(
    chosenFamilyEnding(
      { flags: flags.slice(0, 2), meetingOrder: order },
      'hope',
      nameOf,
    ),
    null,
    'two guides is a friendship, not yet a household',
  )
  // Interludes alone (no free hours) do not make a household either.
  assert.equal(
    chosenFamilyEnding(
      {
        flags: ['bond_kit_repair', 'bond_mara_space', 'bond_cedar_walk'],
        meetingOrder: order,
      },
      'hope',
      nameOf,
    ),
    null,
  )
  // Every member line is written and distinct.
  const all = chosenFamilyEnding(
    { flags: Object.keys(COMPANION_TIME_FLAGS), meetingOrder: IDS },
    'hope',
    nameOf,
  )!
  assert.equal(all.members.length, 4)
  for (const id of IDS)
    for (const choice of COMPANION_TIME[id].choices.slice(0, 2)) {
      const single = chosenFamilyEnding(
        {
          flags: [
            choice.success.effects.flag!,
            ...IDS.filter((x) => x !== id).map(
              (x) => COMPANION_TIME[x].choices[0]!.success.effects.flag!,
            ),
          ],
          meetingOrder: IDS,
        },
        'hope',
        nameOf,
      )!
      assert.ok(single.paragraphs[1]!.split('. ').length >= 4)
    }
  // Bond counts include free hours; a hangout plus a free hour is "close".
  assert.deepEqual(
    companionBondCounts(['bond_kit_repair', 'bond_kit_time_cascade']),
    { kit: 2, juniper: 0, cedar: 0, mara: 0 },
  )
}

// A guide's free hour waits until after their private interlude, but the
// finale slot never skips anyone.
for (const host of IDS)
  for (const guest of IDS.filter((id) => id !== host)) {
    let state: RunState = {
      ...createRun(11, 'reporter'),
      phase: 'crossroads',
      event: 'quiet',
      step: ROUTES.quiet.findIndex((step) => step.kind === 'crossroads'),
      day: 1,
      prospect: host,
      openingState: 'sober',
      currentState: 'sober',
      activeLead: host,
      meetingOrder: [host],
      newcomerOrder: [guest],
      played: [COMPANION_TIME[host].id],
    }
    state = advance(chooseCrossroads(state, 'together'))
    assert.equal(state.card, COMPANION_HANGOUTS[guest].id)
    state = advance(
      chooseBeat(state, COMPANION_HANGOUTS[guest].choices.at(-1)!.id),
    )
    assert.equal(state.card, COMPANION_HANGOUTS[host].id)
    state = advance(
      chooseBeat(state, COMPANION_HANGOUTS[host].choices.at(-1)!.id),
    )
    assert.notEqual(
      state.card,
      COMPANION_TIME[guest].id,
      'the same guide is not on stage twice in a row',
    )
  }

// Forks never deal a free hour.
{
  const run: RunState = {
    ...createRun(9, 'reporter'),
    event: 'green-ribbon',
    meetingOrder: [...IDS],
    activeLead: 'kit',
  }
  for (const ix of ROUTES['green-ribbon'].keys())
    for (const id of drawFork(run, ix)) assert.ok(!TIME_IDS.has(id))
}

const board = readFileSync('components/ecotone-board.vue', 'utf8')
assert.match(board, /chosenFamilyEnding/)
assert.match(board, /data-testid="chosen-family-ending"/)
assert.match(board, /A free hour · optional/)

console.log(
  `Ecotone companion time: chosen family in ${familyTotal}/${warmRuns} warm runs (${[...familyByEvent].map(([e, n]) => `${e} ${n}`).join(', ')}), ${distractedFamilies}/${distractedRuns} distracted, 0 careless; ${codaRuns} coda runs`,
)
