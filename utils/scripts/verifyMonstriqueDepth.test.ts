// MONSTRIQUE case depth (utils/monstressConvention/depth.ts): the shared
// notebook's clue comparisons, Norb's own deduction in every Chapter One
// room, the ghosts' shared reactive topics, dialogue exhaustion, a second
// route for every required topic, Norb's hands-off rule and save round-trip,
// in both editions.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  EVIDENCE,
  HOTEL_ROOMS,
  ITEMS,
  TOPICS,
  availableTopics,
  beginChapterTwo,
  caseScore,
  chapterScore,
  maxScore,
  newCase,
  newChapterTwo,
  performAction,
  restoreCase,
  switchInvestigator,
  topicAnswerers,
  topicChips,
  topicExhausted,
  type CaseAction,
  type CaseResult,
  type CaseState,
  type RoomId,
} from '../monstressConvention/prologue'
import {
  CHAPTER_ONE_ROOM_IDS,
  CLUE_COMPARISONS,
  COMPARE_MISSES,
  DEDUCTIONS,
  GHOSTS_AGREE,
  NORB_DEDUCTIONS,
  ODETTE_BACKS_VIOLET,
  REACTIVE_TOPICS,
  REACTIVE_TOPIC_SOURCES,
  VIOLET_BACKS_ODETTE,
  norbHunch,
  reactiveLine,
} from '../monstressConvention/depth'
import {
  CHAPTER_TWO_ROOM_IDS,
  chapterTwoMaxScore,
} from '../monstressConvention/chapterTwo'
import {
  actionForAudience,
  roomForAudience,
  topicInEdition,
  travelForAudience,
  type MonstriqueAudience,
} from '../monstressConvention/edition'
import { travelRoute } from '../monstressConvention/navigation'
import {
  generalSafeCase,
  parseAccountSave,
} from '../monstressConvention/accountSave'

const editions: MonstriqueAudience[] = ['general', 'mature']
const SPOILER = /draculina|countess/i
const UNSAFE = /kiss|back seat|necker|fun way|\bgin\b|\bsex/i

function player(edition: MonstriqueAudience, start: CaseState = newCase(11)) {
  let state = start
  const apply = (result: CaseResult, label: string) => {
    assert.equal(result.changed, true, `${edition}: ${label}: ${result.line}`)
    state = result.state
    return result
  }
  return {
    get state() {
      return state
    },
    act(
      verb: CaseAction['verb'],
      target: string,
      extra: Partial<CaseAction> = {},
    ) {
      return apply(
        actionForAudience(state, { verb, target, ...extra }, edition),
        verb + ' ' + target + (extra.topic ? ':' + extra.topic : ''),
      )
    },
    attempt(verb: CaseAction['verb'], target: string, extra = {}) {
      return actionForAudience(state, { verb, target, ...extra }, edition)
    },
    go(room: RoomId) {
      if (state.room === room) return
      apply(
        travelRoute(state, room, (here, there) =>
          travelForAudience(here, there, edition),
        ),
        'travel ' + room,
      )
    },
    as(actor: 'iris' | 'nico') {
      if (state.actor !== actor) apply(switchInvestigator(state), 'switch')
    },
  }
}
type Player = ReturnType<typeof player>
const holds = (p: Player | CaseState, key: string) => {
  const s = 'state' in p ? p.state : p
  return (
    s.evidence.includes(key) ||
    s.flags.includes(key) ||
    s.inventory.includes(key) ||
    (s.deductions ?? []).includes(key)
  )
}

// --- 1. The tables hold together -------------------------------------------

assert.equal(maxScore('mature'), 205, 'Chapter One keeps its 205')
assert.equal(chapterTwoMaxScore('mature'), 64, 'Chapter Two keeps its 64')
const ids = Object.keys(DEDUCTIONS)
assert.equal(new Set(ids).size, ids.length, 'deduction ids are unique')
for (const comparison of CLUE_COMPARISONS) {
  const [a, b] = comparison.clues
  assert.ok(EVIDENCE[a] && EVIDENCE[b], comparison.id + ' compares real clues')
  assert.notEqual(a, b)
  assert.ok(!(comparison.id in EVIDENCE), 'deductions are not evidence')
}
const pairs = CLUE_COMPARISONS.map(({ clues }) => [...clues].sort().join('+'))
assert.equal(new Set(pairs).size, pairs.length, 'each pair compares once')
assert.ok(
  CLUE_COMPARISONS.filter((c) => DEDUCTIONS[c.id]!.chapter === 2).length >= 2,
  'Chapter Two shares the notebook',
)
assert.deepEqual(
  [...CHAPTER_ONE_ROOM_IDS].sort(),
  (Object.keys(HOTEL_ROOMS) as RoomId[])
    .filter(
      (room) => !(CHAPTER_TWO_ROOM_IDS as readonly string[]).includes(room),
    )
    .sort(),
  'every Chapter One room is listed',
)
for (const topic of Object.keys(REACTIVE_TOPICS)) {
  assert.ok(TOPICS[topic], topic + ' is a topic')
  assert.ok(EVIDENCE[REACTIVE_TOPIC_SOURCES[topic]!])
  for (const edition of editions) assert.ok(topicInEdition(topic, edition))
}

const allLines = [
  ...CLUE_COMPARISONS.map((c) => c.line),
  ...Object.values(NORB_DEDUCTIONS).map((d) => d.line),
  ...COMPARE_MISSES,
]
for (const flags of [
  [],
  [VIOLET_BACKS_ODETTE],
  [ODETTE_BACKS_VIOLET],
  [VIOLET_BACKS_ODETTE, ODETTE_BACKS_VIOLET],
])
  for (const target of ['odette-ghost', 'violet-ghost', 'nico'])
    for (const topic of Object.keys(REACTIVE_TOPICS)) {
      const reaction = reactiveLine({ ...newCase(), flags }, target, topic)
      assert.ok(reaction, target + ' answers ' + topic)
      allLines.push(reaction.line)
    }
for (const line of allLines) {
  assert.doesNotMatch(line, SPOILER, 'spoiler-free: ' + line)
  assert.doesNotMatch(line, UNSAFE, 'general-safe: ' + line)
}

// --- 2. Every comparison, in both editions, by either investigator ----------

for (const edition of editions)
  for (const comparison of CLUE_COMPARISONS) {
    const [a, b] = comparison.clues
    const base: CaseState = { ...newCase(3), evidence: [a, b] }
    for (const actor of ['iris', 'nico'] as const)
      for (const [first, second] of [
        [a, b],
        [b, a],
      ] as const) {
        const state = { ...base, actor }
        const result = actionForAudience(
          state,
          { verb: 'compare', target: first, item: second },
          edition,
        )
        assert.equal(result.changed, true, `${edition} ${comparison.id}`)
        assert.equal(result.line, comparison.line, 'no edition rewrite needed')
        assert.deepEqual(result.state.deductions, [comparison.id])
        for (const flag of comparison.grants?.flags ?? [])
          assert.ok(result.state.flags.includes(flag))
        for (const topic of comparison.grants?.topics ?? [])
          assert.ok(result.state.topics.includes(topic))
        assert.equal(
          chapterScore(result.state, edition),
          chapterScore(state, edition),
          'deductions are unscored',
        )
        const again = actionForAudience(
          result.state,
          { verb: 'compare', target: first, item: second },
          edition,
        )
        assert.equal(again.changed, false, 'a deduction is drawn once')
        if (edition === 'general') assert.ok(generalSafeCase(result.state))
      }
    const missing = actionForAudience(
      { ...base, evidence: [a] },
      { verb: 'compare', target: a, item: b },
      edition,
    )
    assert.equal(missing.changed, false, 'both clues must be in the notebook')
    assert.equal(
      actionForAudience(base, { verb: 'compare', target: a, item: a }, edition)
        .changed,
      false,
      'one clue is not a comparison',
    )
  }
const miss = performAction(
  { ...newCase(2), evidence: ['motel-photo', 'billboard-shot', 'fan-photo'] },
  { verb: 'compare', target: 'motel-photo', item: 'fan-photo' },
)
assert.equal(miss.changed, false, 'unrelated clues change nothing')
assert.ok(COMPARE_MISSES.includes(miss.line), 'and get a joke')

// --- 3. Norb's deduction in every Chapter One room --------------------------

for (const room of CHAPTER_ONE_ROOM_IDS) {
  const deduction = NORB_DEDUCTIONS[room]
  const hotspot = HOTEL_ROOMS[room].hotspots.find(
    (spot) => spot.id === deduction.hotspot,
  )
  assert.ok(hotspot, room + ': ' + deduction.hotspot + ' is in the room')
  assert.ok(hotspot.verbs.includes('look'), 'Norb only has to look')
  assert.equal(DEDUCTIONS[deduction.id]?.kind, 'norb')
  for (const edition of editions) {
    assert.ok(
      roomForAudience(room, edition).hotspots.some(
        (spot) => spot.id === deduction.hotspot && spot.verbs.includes('look'),
      ),
      `${edition}: Norb can see ${deduction.hotspot}`,
    )
    const ready: CaseState = {
      ...newCase(7),
      room,
      evidence: [...deduction.needs],
      flags:
        room === 'city-map' || room === 'convention-center'
          ? ['city-lead']
          : [],
    }
    const iris = actionForAudience(
      ready,
      { verb: 'look', target: deduction.hotspot },
      edition,
    )
    assert.ok(
      !(iris.state.deductions ?? []).includes(deduction.id),
      `${edition} ${room}: Iris looks but does not deduce`,
    )
    const norbState = { ...ready, actor: 'nico' as const }
    assert.equal(norbHunch(norbState)?.id, deduction.id, 'the stage can hint')
    const norb = actionForAudience(
      norbState,
      { verb: 'look', target: deduction.hotspot },
      edition,
    )
    assert.equal(norb.changed, true, `${edition} ${room}: ${norb.line}`)
    assert.equal(norb.line, deduction.line, `${edition}: Norb’s own words`)
    assert.ok(norb.state.deductions?.includes(deduction.id))
    for (const clue of deduction.grants?.evidence ?? [])
      assert.ok(norb.state.evidence.includes(clue))
    for (const flag of deduction.grants?.flags ?? [])
      assert.ok(norb.state.flags.includes(flag))
    assert.equal(norbHunch(norb.state), null, 'one deduction per room')
    if (deduction.needs.length) {
      const early = actionForAudience(
        { ...norbState, evidence: [] },
        { verb: 'look', target: deduction.hotspot },
        edition,
      )
      assert.ok(
        !(early.state.deductions ?? []).includes(deduction.id),
        room + ': Norb needs his notes first',
      )
    }
  }
}
assert.equal(
  norbHunch({ ...newChapterTwo(3), room: 'motel-exterior', actor: 'nico' }),
  null,
  'Chapter One deductions stay in Chapter One',
)

// --- 4. A full case: every deduction, both editions, to the full file -------

for (const edition of editions) {
  const p = player(edition)
  p.as('nico')
  p.act('look', 'gavin')
  p.as('iris')
  p.act('photograph', 'fan-camera')
  assert.ok(!holds(p, 'fan-exonerated'), 'the photos came before the clock')
  p.go('front-office')
  p.as('nico')
  p.act('look', 'guest-ledger')
  p.as('iris')
  p.act('photograph', 'memorabilia-case')
  p.act('talk', 'marta')
  p.act('ask', 'marta', { topic: 'room-access' })
  p.go('neighbor-room')
  p.act('talk', 'neighbor')
  p.act('ask', 'neighbor', { topic: 'unknown-visitor' })
  p.as('nico')
  p.act('look', 'wall-clock')
  p.go('investigators-room')
  p.act('look', 'desk')
  assert.ok(holds(p, 'fan-exonerated'), 'Norb’s desk clears Gavin')
  p.as('iris')
  p.go('odette-room')
  p.act('photograph', 'knife')
  p.act('photograph', 'violet-body')
  p.act('look', 'ice-ring')
  p.act('talk', 'odette-ghost')
  p.act('ask', 'odette-ghost', { topic: 'agent-deals' })
  p.act('ask', 'odette-ghost', { topic: 'ghost-accounts' })
  p.act('ask', 'odette-ghost', { topic: 'harker-files' })
  assert.ok(p.state.topics.includes('floating-knife'), 'Odette’s claim opens')
  p.as('nico')
  p.act('look', 'violet-ghost')
  p.act('look', 'knife')
  assert.ok(p.state.topics.includes('unopened-door'), 'Violet’s claim opens')
  p.as('iris')
  p.act('talk', 'violet-ghost')
  const violet = p.act('ask', 'violet-ghost', { topic: 'floating-knife' })
  assert.match(violet.line, /^Violet: She says it FLOATED/)
  const odette = p.act('ask', 'odette-ghost', { topic: 'unopened-door' })
  assert.match(odette.line, /backed my floating knife/, 'Odette heard Violet')
  assert.ok(holds(p, GHOSTS_AGREE.id), 'the ghosts vouch for each other')
  p.go('balcony')
  p.as('nico')
  p.act('look', 'footprints')
  p.go('ice-alcove')
  p.act('look', 'maintenance-log')
  assert.equal(
    p.attempt('use', 'ice-machine').changed,
    false,
    'Norb leaves the elbow-deep part to Iris',
  )
  p.as('iris')
  p.act('use', 'ice-machine')
  assert.ok(holds(p, 'makeup-smear') && holds(p, 'plastic-fangs'))
  p.go('odette-room')
  p.act('use', 'violet-ghost', { item: 'plastic-fangs' })
  for (const comparison of CLUE_COMPARISONS.filter(
    (c) => DEDUCTIONS[c.id]!.chapter === 1,
  ))
    p.act('compare', comparison.clues[0], { item: comparison.clues[1] })
  p.go('investigators-room')
  p.act('use', 'desk')
  p.go('city-map')
  p.as('nico')
  p.act('look', 'drive-in')
  p.go('convention-center')
  p.act('look', 'mummy-actress')
  p.as('iris')
  p.act('photograph', 'idol-poster')
  assert.equal(p.state.ending, 'fifth-hexblade', edition + ' files in full')
  const made = p.state.deductions ?? []
  for (const id of ids.filter((id) => DEDUCTIONS[id]!.chapter === 1))
    assert.ok(made.includes(id), `${edition}: ${id} was drawn`)
  assert.ok(caseScore(p.state) <= 205)
  if (edition === 'general') assert.ok(generalSafeCase(p.state))
  const chapterTwo = beginChapterTwo(p.state)
  assert.deepEqual(
    chapterTwo.state.deductions,
    made,
    'the notebook carries into Chapter Two',
  )
}

// Chapter Two shares the notebook and its comparisons.
for (const edition of editions) {
  const start = newChapterTwo(4)
  const p = player(edition, {
    ...start,
    evidence: [
      ...start.evidence,
      'reel-1964',
      'prop-invoice',
      'merch-license',
      'five-blueprint',
      'empty-case',
      'shrine-photo',
    ],
  })
  const before = chapterScore(p.state, edition)
  for (const comparison of CLUE_COMPARISONS.filter(
    (c) => DEDUCTIONS[c.id]!.chapter === 2,
  ))
    p.act('compare', comparison.clues[1], { item: comparison.clues[0] })
  assert.equal(chapterScore(p.state, edition), before, 'still unscored')
}

// --- 5. A second route for every required topic ------------------------------

function withAccess(p: Player): void {
  p.go('front-office')
  p.act('look', 'guest-ledger')
  p.act('use', 'marta')
}

type Route = [string, (p: Player) => void]
const REQUIRED: Record<
  string,
  {
    target: string
    payoff: string
    setup?: (p: Player) => void
    routes: Route[]
  }
> = {
  'room-access': {
    target: 'marta',
    payoff: 'crime-room-access',
    routes: [
      [
        'Marta, asked',
        (p) => {
          p.go('front-office')
          p.act('talk', 'marta')
          p.act('ask', 'marta', { topic: 'room-access' })
        },
      ],
      ['Marta’s key after the register', withAccess],
      [
        'Dolores and the fire escape',
        (p) => {
          p.go('neighbor-room')
          p.act('talk', 'neighbor')
          p.act('ask', 'neighbor', { topic: 'unknown-visitor' })
        },
      ],
    ],
  },
  'agent-deals': {
    target: 'odette-ghost',
    payoff: 'ghost-odette',
    setup: withAccess,
    routes: [
      [
        'Odette, asked',
        (p) => {
          p.go('odette-room')
          p.act('talk', 'odette-ghost')
          p.act('ask', 'odette-ghost', { topic: 'agent-deals' })
        },
      ],
      [
        'the Harker Files',
        (p) => {
          p.go('odette-room')
          p.act('talk', 'odette-ghost')
          p.act('ask', 'odette-ghost', { topic: 'harker-files' })
        },
      ],
    ],
  },
  'violet-witness': {
    target: 'violet-ghost',
    payoff: 'ghost-violet',
    setup: withAccess,
    routes: [
      [
        'Violet, asked',
        (p) => {
          p.go('odette-room')
          p.act('talk', 'violet-ghost')
          p.act('ask', 'violet-ghost', { topic: 'violet-witness' })
        },
      ],
      [
        'Norb watches her watch the door',
        (p) => {
          p.go('odette-room')
          p.as('nico')
          p.act('look', 'violet-ghost')
        },
      ],
    ],
  },
  'ice-clank': {
    target: 'neighbor',
    payoff: 'ice-timing',
    routes: [
      [
        'Dolores, asked',
        (p) => {
          p.go('neighbor-room')
          p.act('talk', 'neighbor')
          p.act('ask', 'neighbor', { topic: 'ice-clank' })
        },
      ],
      [
        'the clock, photographed',
        (p) => {
          p.go('neighbor-room')
          p.act('photograph', 'wall-clock')
        },
      ],
      [
        'Norb corrects the fast clock',
        (p) => {
          p.go('neighbor-room')
          p.act('talk', 'neighbor')
          p.act('ask', 'neighbor', { topic: 'unknown-visitor' })
          p.as('nico')
          p.act('look', 'wall-clock')
        },
      ],
    ],
  },
  'fan-alibi': {
    target: 'gavin',
    payoff: 'fan-exonerated',
    routes: [
      [
        'Gavin, asked after the clock',
        (p) => {
          p.go('neighbor-room')
          p.act('photograph', 'wall-clock')
          p.go('motel-exterior')
          p.act('talk', 'gavin')
          p.act('ask', 'gavin', { topic: 'fan-alibi' })
        },
      ],
      [
        'his camera, after the clock',
        (p) => {
          p.go('neighbor-room')
          p.act('photograph', 'wall-clock')
          p.go('motel-exterior')
          p.act('photograph', 'fan-camera')
        },
      ],
      [
        'Norb pins the photos to the clock at the desk',
        (p) => {
          p.act('photograph', 'fan-camera')
          p.go('neighbor-room')
          p.act('photograph', 'wall-clock')
          p.go('investigators-room')
          p.as('nico')
          p.act('look', 'desk')
        },
      ],
    ],
  },
  'knife-origin': {
    target: 'nico',
    payoff: 'knife-prop-mark',
    setup: withAccess,
    routes: [
      [
        'Norb, asked about the photo',
        (p) => {
          p.go('odette-room')
          p.act('photograph', 'knife')
          p.go('investigators-room')
          p.act('ask', 'nico', { topic: 'knife-origin' })
        },
      ],
      [
        'Norb reads the photo in the room',
        (p) => {
          p.go('odette-room')
          p.act('photograph', 'knife')
          p.as('nico')
          p.act('look', 'knife')
        },
      ],
    ],
  },
  'missing-fangs': {
    target: 'violet-ghost',
    payoff: 'makeup-smear',
    setup: withAccess,
    routes: [
      [
        'Violet, asked',
        (p) => {
          p.go('odette-room')
          p.act('talk', 'violet-ghost')
          p.act('ask', 'violet-ghost', { topic: 'missing-fangs' })
          p.go('ice-alcove')
          p.act('use', 'ice-machine')
        },
      ],
      [
        'the notebook: bare gums and a wet ring',
        (p) => {
          p.go('odette-room')
          p.act('look', 'ice-ring')
          p.act('photograph', 'violet-body')
          p.act('compare', 'violet-photo', { item: 'ice-ring' })
          p.go('ice-alcove')
          p.act('use', 'ice-machine')
        },
      ],
      [
        'Norb follows the drips on the balcony',
        (p) => {
          p.go('odette-room')
          p.act('photograph', 'ice-ring')
          p.go('balcony')
          p.as('nico')
          p.act('look', 'footprints')
          p.as('iris')
          p.go('ice-alcove')
          p.act('use', 'ice-machine')
        },
      ],
      [
        'Norb reads Pip’s log',
        (p) => {
          p.go('ice-alcove')
          p.act('photograph', 'ice-machine')
          p.as('nico')
          p.act('look', 'maintenance-log')
          p.as('iris')
          p.act('use', 'ice-machine')
        },
      ],
    ],
  },
}

for (const edition of editions)
  for (const [topic, { target, payoff, setup, routes }] of Object.entries(
    REQUIRED,
  )) {
    assert.ok(TOPICS[topic], topic + ' is a topic')
    assert.ok(routes.length >= 2, topic + ' has a second route')
    routes.forEach(([name, route], index) => {
      const p = player(edition)
      setup?.(p)
      assert.ok(!holds(p, payoff), `${topic}: ${payoff} starts missing`)
      route(p)
      assert.ok(holds(p, payoff), `${edition}: ${topic} via ${name}`)
      const askedPrimary = p.state.asked.some((entry) =>
        entry.endsWith(':' + target + ':' + topic),
      )
      if (index > 0)
        assert.ok(!askedPrimary, `${name} does not ask ${target} ${topic}`)
    })
  }

// --- 6. Norb never handles an object ----------------------------------------

const chapterTwoStart = newChapterTwo(9)
for (const room of Object.keys(HOTEL_ROOMS) as RoomId[]) {
  const chapterTwo = (CHAPTER_TWO_ROOM_IDS as readonly string[]).includes(room)
  const state: CaseState = {
    ...(chapterTwo ? chapterTwoStart : newCase(9)),
    room,
    actor: 'nico',
    inventory: Object.keys(ITEMS),
    evidence: Object.keys(EVIDENCE),
    flags: [
      ...(chapterTwo ? chapterTwoStart.flags : []),
      'fangs-lost',
      'bucket-traced',
    ],
  }
  for (const hotspot of HOTEL_ROOMS[room].hotspots) {
    for (const verb of ['take', 'use', 'photograph'] as const) {
      const result = performAction(state, { verb, target: hotspot.id })
      assert.equal(result.changed, false, `Norb will not ${verb} ${hotspot.id}`)
      assert.equal(result.state, state, 'and nothing changes')
    }
    for (const item of Object.keys(ITEMS)) {
      const result = performAction(state, {
        verb: 'use',
        target: hotspot.id,
        item,
      })
      assert.equal(result.changed, false, `Norb will not hand over ${item}`)
    }
  }
  for (const first of Object.keys(ITEMS))
    for (const second of Object.keys(ITEMS))
      assert.equal(
        performAction(state, { verb: 'combine', item: first, target: second })
          .changed,
        false,
        'Norb combines nothing',
      )
}

// --- 7. Dialogue exhaustion --------------------------------------------------

{
  let state: CaseState = {
    ...newCase(5),
    room: 'odette-room',
    topics: ['ghost-accounts'],
    flags: ['crime-room-access'],
  }
  function ask(target: string, topic: string): void {
    const result = performAction(state, { verb: 'ask', target, topic })
    assert.equal(result.changed, true, target + ':' + topic)
    state = result.state
  }
  assert.deepEqual(topicAnswerers('ghost-accounts').sort(), [
    'nico',
    'odette-ghost',
    'violet-ghost',
  ])
  const status = (target: string) =>
    topicChips(state, target).find((chip) => chip.topic === 'ghost-accounts')
      ?.status
  assert.equal(status('odette-ghost'), 'new')
  ask('odette-ghost', 'ghost-accounts')
  assert.equal(status('odette-ghost'), 'spent', 'Iris has asked Odette')
  assert.ok(!availableTopics(state, 'odette-ghost').includes('ghost-accounts'))
  state = switchInvestigator(state).state
  assert.equal(status('odette-ghost'), 'echo', 'Norb can still ask, second')
  assert.equal(topicExhausted(state, 'ghost-accounts'), false)
  ask('violet-ghost', 'ghost-accounts')
  state = { ...state, room: 'investigators-room' }
  state = switchInvestigator(state).state
  assert.equal(topicExhausted(state, 'ghost-accounts'), false)
  ask('nico', 'ghost-accounts')
  assert.equal(
    topicExhausted(state, 'ghost-accounts'),
    true,
    'everyone who can answer has',
  )
  assert.equal(topicExhausted(state, 'idol-schedule'), false, 'a lead')

  // Shared reactive topics exhaust like any other, ghost by ghost.
  state = {
    ...newCase(6),
    room: 'odette-room',
    flags: ['crime-room-access'],
    evidence: ['ghost-violet'],
  }
  state = performAction(state, { verb: 'look', target: 'knife' }).state
  assert.ok(state.topics.includes('unopened-door'), 'Violet’s claim opens')
  assert.ok(!state.topics.includes('floating-knife'), 'not Odette’s yet')
  const first = performAction(state, {
    verb: 'ask',
    target: 'violet-ghost',
    topic: 'unopened-door',
  })
  assert.match(first.line, /stake my deposit/, 'before Odette reacts')
  ask('odette-ghost', 'unopened-door')
  assert.ok(state.flags.includes(ODETTE_BACKS_VIOLET))
  ask('violet-ghost', 'unopened-door')
  assert.match(state.transcript.at(-1)!, /love letter/, 'Violet heard Odette')
  state = { ...state, room: 'investigators-room' }
  ask('nico', 'unopened-door')
  assert.ok(topicExhausted(state, 'unopened-door'))
  assert.ok(!(state.deductions ?? []).includes(GHOSTS_AGREE.id))

  // Chapter Two characters only count once Chapter Two is open.
  assert.ok(!topicAnswerers('iris-neck', 1).includes('clem'))
  assert.ok(topicAnswerers('iris-neck', 2).includes('clem'))
  const two = newChapterTwo(8)
  assert.ok(topicAnswerers('starlite-findings', 2).includes('violet-ghost'))
  assert.equal(topicExhausted(two, 'starlite-findings'), false)
}

// --- 8. Saves round-trip ------------------------------------------------------

{
  const p = player('general')
  withAccess(p)
  p.go('odette-room')
  p.act('look', 'ice-ring')
  p.act('photograph', 'violet-body')
  p.act('compare', 'ice-ring', { item: 'violet-photo' })
  p.act('talk', 'violet-ghost')
  p.act('ask', 'violet-ghost', { topic: 'ghost-accounts' })
  p.as('nico')
  p.act('look', 'violet-ghost')
  const saved = JSON.parse(JSON.stringify(p.state)) as CaseState
  const restored = restoreCase(saved)
  assert.deepEqual(restored, p.state, 'deductions survive a reload')
  assert.deepEqual(restored?.deductions, ['fangs-in-bucket', 'watched-door'])
  assert.deepEqual(
    topicChips(restored!, 'violet-ghost'),
    topicChips(p.state, 'violet-ghost'),
    'exhaustion survives a reload',
  )
  for (const edition of editions) {
    const account = parseAccountSave(
      {
        version: 1,
        savedAt: '2026-11-28T07:00:00.000Z',
        case: saved,
        kit: null,
        runs: [],
      },
      edition,
    )
    assert.deepEqual(account?.case, p.state, edition + ' account save')
  }

  const old = JSON.parse(JSON.stringify(newCase(4))) as CaseState
  assert.ok(!('deductions' in old))
  const oldRestored = restoreCase(old)
  assert.ok(oldRestored, 'a save from before the notebook restores')
  assert.ok(!('deductions' in oldRestored), 'without inventing the field')
  assert.deepEqual(oldRestored, newCase(4))
  assert.equal(
    restoreCase({ ...saved, deductions: 'fangs-in-bucket' }),
    null,
    'a malformed notebook is refused',
  )
  assert.equal(restoreCase({ ...saved, deductions: [7] }), null)
  assert.deepEqual(
    restoreCase({
      ...saved,
      deductions: ['watched-door', 'made-up', 'watched-door'],
    })?.deductions,
    ['watched-door'],
    'unknown and repeated deductions are dropped',
  )
  assert.equal(restoreCase(saved)?.version, 3, 'saves stay version 3')
}

// --- 9. The stage shows the notebook ---------------------------------------

const scene = readFileSync(
  new URL(
    '../../components/monstress-convention/monstress-convention-scene.vue',
    import.meta.url,
  ),
  'utf8',
)
for (const hook of [
  'data-testid="monstrique-clue"',
  'data-testid="monstrique-deductions"',
  'data-testid="monstrique-norb-hunch"',
  'data-testid="monstrique-topic"',
  "verb: 'compare'",
  'topicChips(',
  'topicExhausted(',
  'topicInEdition(',
])
  assert.ok(scene.includes(hook), 'scene wires ' + hook)
assert.doesNotMatch(scene, /\$fetch|localStorage/, 'the scene stays store-fed')

console.log(
  `Monstrique depth: ${CLUE_COMPARISONS.length} comparisons, ${CHAPTER_ONE_ROOM_IDS.length} Norb deductions, ${Object.keys(REQUIRED).length} required topics with second routes, shared ghost topics, exhaustion and saves passed in both editions`,
)
