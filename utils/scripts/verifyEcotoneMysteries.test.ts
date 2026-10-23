// Ecotone Mysteries contract (conductor weird-humboldt t-062):
//   npx tsx utils/scripts/verifyEcotoneMysteries.test.ts
import assert from 'node:assert/strict'
import { ALL_CARDS } from '../ecotone/engine'
import {
  advance,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  createRun,
  findCard,
  restoreRun,
  setLiveEdits,
  type RunState,
} from '../ecotone/engine'
import { buildEcotonePlaybook } from '../playbook/ecotone'
import { mysteryEndingKey } from '../playbook/ecotoneMysteries'
import type { EventId } from '../ecotone/content'
import { ROUTES } from '../ecotone/story'
import { openingLensChoices } from '../ecotone/openingLensChoices'
import {
  MYSTERIES,
  MYSTERY_CARDS,
  PASSES_FOR_TRUE_PATH,
  caseRecord,
  gateTriggers,
  mergeCaseRecord,
  mysteryCardId,
  mysteryCardMeta,
  mysteryEnding,
  mysteryPasses,
  pickMystery,
  runMystery,
  sanitizeCaseFiles,
  validateMystery,
  type Mystery,
} from '../ecotone/mysteries'

// Twelve authored cases, one per temperament, every rule satisfied.
assert.equal(MYSTERIES.length, 12, 'twelve mysteries')
assert.deepEqual(
  MYSTERIES.map((m) => m.number),
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  'cases are numbered I-XII in order',
)
for (const key of ['id', 'sign', 'title'] as const)
  assert.equal(
    new Set(MYSTERIES.map((m) => m[key])).size,
    12,
    `every case has its own ${key}`,
  )
assert.equal(new Set(MYSTERIES.map((m) => m.design.motif)).size, 12)
const problems = MYSTERIES.flatMap(validateMystery)
assert.deepEqual(problems, [], problems.join('\n'))

const cardIds = MYSTERY_CARDS.map((card) => card.id)
assert.equal(new Set(cardIds).size, cardIds.length, 'mystery card ids unique')
for (const card of MYSTERY_CARDS) {
  assert.ok(!ALL_CARDS.some((other) => other.id === card.id))
  assert.equal(findCard(card.id), card, `${card.id} resolves in play`)
  assert.ok(mysteryCardMeta(card.id), `${card.id} knows its case`)
  assert.ok(card.choices.length >= 2 && card.choices.length <= 4)
}

// Unopened cases come first; once all are open, any case can return.
const opened = MYSTERIES.slice(0, 11).map((m) => m.id)
for (let seed = 1; seed < 40; seed += 1)
  assert.equal(pickMystery(seed, opened), MYSTERIES[11]!.id)
const spread = new Set(
  Array.from({ length: 400 }, (_, seed) => pickMystery(seed)),
)
assert.equal(spread.size, 12, 'every case turns up across seeds')

type Chooser = (state: RunState, cardId: string) => string | undefined

function play(
  seed: number,
  event: EventId,
  mystery: string,
  choose: Chooser = () => undefined,
) {
  let state = createRun(seed, 'reporter', mystery)
  state = advance(chooseEvent(state, event))
  const seen: { card: string; step: number }[] = []
  let guard = 0
  while (state.phase !== 'end') {
    assert.ok((guard += 1) < 120, 'runs finish')
    if (state.phase === 'fork') {
      state = chooseFork(state, state.offered[0]!)
      continue
    }
    if (state.phase === 'crossroads') {
      state = advance(chooseCrossroads(state, seed % 2 === 0))
      continue
    }
    const card = findCard(state.card)!
    assert.ok(card, 'a beat is in play')
    if (mysteryCardMeta(card.id)) seen.push({ card: card.id, step: state.step })
    const playable = openingLensChoices(card).filter((c) => !c.locked)
    const picked =
      choose(state, card.id) ??
      (playable.find((c) => c.meet === true) ?? playable[0])!.id
    state = advance(chooseBeat(state, picked))
  }
  return { state, seen }
}

const investigate: Chooser = (_state, cardId) =>
  mysteryCardMeta(cardId)?.kind === 'gate'
    ? findCard(cardId)!.choices[0]!.id
    : undefined

// Gates arrive as digressions at the three trigger points of every route,
// and the route resumes exactly where it left off.
for (const event of Object.keys(ROUTES) as EventId[]) {
  const triggers = gateTriggers(ROUTES[event])
  assert.ok(triggers.every((t) => t > 0 && t < ROUTES[event].length))
  assert.ok(triggers[0] < triggers[1] && triggers[1] < triggers[2])
  for (const mystery of MYSTERIES) {
    const { state, seen } = play(41, event, mystery.id, investigate)
    const gates = seen.filter((s) => /-G\d$/.test(s.card))
    assert.deepEqual(
      gates.map((s) => s.card),
      ['G1', 'G2', 'G3'].map((g) => mysteryCardId(mystery, g as 'G1')),
      `${event}/${mystery.id} plays three gates in order`,
    )
    gates.forEach((gate, n) =>
      assert.equal(gate.step, triggers[n]! - 1, 'gate sits before its step'),
    )
    const passes = mysteryPasses(state.flags)
    const record = caseRecord(state)!
    assert.equal(record.id, mystery.id)
    assert.equal(record.gates.filter((g) => g === 'pass').length, passes)
    if (passes >= PASSES_FOR_TRUE_PATH) {
      assert.ok(state.played.includes(mysteryCardId(mystery, 'REVEAL')))
      assert.ok(mysteryEnding(state), 'the true path reaches a Real Ending')
      assert.ok(record.truePath && record.endings.length === 1)
      assert.ok(
        state.evidence.includes(`Case closed: ${mystery.title}`),
        'a closed case counts as evidence for the county’s future',
      )
    } else {
      assert.ok(state.played.includes(mysteryCardId(mystery, 'COLD')))
      assert.ok(!state.played.includes(mysteryCardId(mystery, 'REVEAL')))
      assert.ok(record.cold && !record.truePath)
    }
    assert.equal(state.ending !== null, true, 'the weekend still ends')
  }
}

// Walking away at Gate I closes the case for the run.
for (const mystery of MYSTERIES) {
  const { state, seen } = play(5, 'green-ribbon', mystery.id, (_s, cardId) =>
    mysteryCardMeta(cardId)?.gate === 1 ? 'decline' : undefined,
  )
  assert.deepEqual(
    seen.map((s) => s.card),
    [mysteryCardId(mystery, 'G1')],
  )
  assert.deepEqual(caseRecord(state)?.gates, [null, null, null])
}

// Every branch and Real Ending of every case is reachable in seeded play.
function leafPaths(mystery: Mystery): string[][] {
  return mystery.reveal.choices.flatMap((choice) =>
    choice.next
      ? mystery.branches[choice.next]!.choices.map((leaf) => [
          choice.id,
          leaf.id,
        ])
      : [[choice.id]],
  )
}
let truePathSeeds = 0
for (const mystery of MYSTERIES) {
  let seed = 1
  while (
    mysteryPasses(play(seed, 'quiet', mystery.id, investigate).state.flags) <
    PASSES_FOR_TRUE_PATH
  ) {
    seed += 1
    assert.ok(seed < 400, `${mystery.id} can open its true path`)
  }
  truePathSeeds += seed
  const reached = new Set<string>()
  for (const path of leafPaths(mystery)) {
    const queue = [...path]
    const { state } = play(seed, 'quiet', mystery.id, (s, cardId) => {
      const meta = mysteryCardMeta(cardId)
      if (meta?.kind === 'gate') return findCard(cardId)!.choices[0]!.id
      if (meta?.kind === 'reveal' || meta?.kind === 'branch')
        return queue.shift()
      return undefined
    })
    const ending = mysteryEnding(state)
    assert.ok(ending, `${mystery.id} ${path.join('>')} ends`)
    reached.add(ending.id)
  }
  assert.deepEqual(
    [...reached].sort(),
    mystery.endings.map((e) => e.id).sort(),
    `${mystery.id} reaches all its Real Endings`,
  )
}

// Case Files keep the best result per gate and never trust raw storage.
const a = {
  id: MYSTERIES[0]!.id,
  gates: ['fail', 'pass', null] as const,
  truePath: false,
  cold: true,
  endings: [],
}
const b = {
  id: a.id,
  gates: ['pass', 'fail', 'fail'] as const,
  truePath: true,
  cold: false,
  endings: [MYSTERIES[0]!.endings[0]!.id],
}
const merged = mergeCaseRecord(
  { ...a, gates: [...a.gates] },
  { ...b, gates: [...b.gates] },
)
assert.deepEqual(merged.gates, ['pass', 'pass', 'fail'])
assert.ok(merged.truePath && merged.cold && merged.endings.length === 1)
assert.deepEqual(
  sanitizeCaseFiles({
    [a.id]: { gates: ['pass', 'maybe'], endings: ['nope', b.endings[0]] },
    'no-such-case': { gates: ['pass'] },
  }),
  {
    [a.id]: {
      id: a.id,
      gates: ['pass', null, null],
      truePath: false,
      cold: false,
      endings: [b.endings[0]],
    },
  },
)

// Older version-4 saves carry no mystery: the seed chooses one, and the
// first gate arrives at the next route step instead of being lost.
const legacy = createRun(77, 'local')
delete (legacy as Partial<RunState>).mystery
assert.equal(runMystery(legacy).id, pickMystery(77))
let midRun = advance(
  chooseEvent(createRun(78, 'local', 'midnight-mane'), 'kinetic'),
)
while (midRun.phase === 'beat' && !mysteryCardMeta(midRun.card)) {
  const card = findCard(midRun.card)!
  midRun = advance(chooseBeat(midRun, openingLensChoices(card)[0]!.id))
}
assert.equal(midRun.card, 'MY-05-G1', 'Gate I interrupts before the first fork')
assert.equal(midRun.step, gateTriggers(ROUTES.kinetic)[0] - 1)
const restored = restoreRun(JSON.parse(JSON.stringify(midRun)))
assert.equal(restored?.card, 'MY-05-G1', 'a save mid-gate resumes the gate')
const withoutMystery = { ...JSON.parse(JSON.stringify(midRun)) }
delete withoutMystery.mystery
assert.ok(restoreRun(withoutMystery), 'saves without a mystery still load')
assert.equal(
  restoreRun({ ...JSON.parse(JSON.stringify(midRun)), mystery: 'nope' }),
  null,
  'an unknown mystery is rejected',
)

// The Playbook Manager lists every scene and Real Ending, chained as play reaches them,
// and its live edits reach mystery cards in play.
const playbook = buildEcotonePlaybook()
const mysterySections = playbook.sections.filter((s) =>
  s.title.startsWith('Case '),
)
assert.equal(mysterySections.length, 12, 'one Collection per case')
for (const card of MYSTERY_CARDS) {
  const node = playbook.nodes[card.id]
  assert.ok(node, `${card.id} is in the Playbook`)
  assert.equal(node.kind, 'quest')
  assert.ok(node.editable && node.needsArt !== undefined)
}
for (const mystery of MYSTERIES)
  for (const ending of mystery.endings)
    assert.ok(
      playbook.nodes[mysteryEndingKey(mystery, ending.id)],
      `${mystery.id}/${ending.id} Real Ending node`,
    )
for (const node of Object.values(playbook.nodes))
  for (const choice of node.choices)
    if (choice.leadsTo)
      assert.ok(
        playbook.nodes[choice.leadsTo],
        `${node.key}/${choice.id} leads somewhere`,
      )
assert.equal(
  playbook.nodes['MY-05-G1']?.choices.find((c) => c.id === 'gossip')?.leadsTo,
  'MY-05-G2',
)
setLiveEdits({ 'MY-05-G1': { title: 'Edited in the Playbook' } })
assert.equal(findCard('MY-05-G1')?.title, 'Edited in the Playbook')
setLiveEdits({})
assert.equal(findCard('MY-05-G1')?.title, 'The Lion Who Knew the Old Callbacks')

console.log(
  `Ecotone mysteries: 12 cases, ${MYSTERY_CARDS.length} scenes, ${MYSTERIES.reduce((n, m) => n + m.endings.length, 0)} Real Endings, gates on ${Object.keys(ROUTES).length} routes; true path found within ${truePathSeeds} seeds in total`,
)
