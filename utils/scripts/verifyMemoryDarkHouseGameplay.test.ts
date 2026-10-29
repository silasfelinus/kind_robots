import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DARK_HOUSE_PUZZLES,
  DARK_HOUSE_TRIALS,
  darkHouseTrialFaces,
  validateDarkHouseChallenges,
} from '../memoryDungeon/darkHouseChallenges'
import {
  DARK_HOUSE_ROOMS,
  newDarkHouseProgress,
  restoreDarkHouseProgress,
  darkHouseTrialSolved,
  darkHousePuzzleSolved,
  darkHouseFlip,
  darkHouseCloseMismatch,
  darkHouseRecall,
  darkHouseAnswerPuzzle,
  darkHousePuzzleHint,
  darkHouseChoose,
  darkHouseMove,
  darkHouseExits,
  darkHouseRoomResolved,
  darkHouseEchoes,
  darkHouseStrain,
  darkHouseVerdict,
  type DarkHouseProgress,
} from '../memoryDungeon/darkHouse'

assert.deepEqual(validateDarkHouseChallenges(), [])
assert.equal(Object.keys(DARK_HOUSE_TRIALS).length, 6)
assert.equal(Object.keys(DARK_HOUSE_PUZZLES).length, 5)
assert.equal(
  new Set([
    ...Object.keys(DARK_HOUSE_TRIALS),
    ...Object.keys(DARK_HOUSE_PUZZLES),
  ]).size,
  11,
)

// Saved challenge fixtures follow actual passages; teleporting directly into
// a chamber would be discarded by the graph-aware save restorer.
const mirrorPaths = new Map<string, string[]>([['HD-01', ['HD-01']]])
const mirrorQueue = ['HD-01']
for (let i = 0; i < mirrorQueue.length; i++) {
  const room = mirrorQueue[i]!
  for (const next of DARK_HOUSE_ROOMS[room]!.exits) {
    if (mirrorPaths.has(next)) continue
    mirrorPaths.set(next, [...mirrorPaths.get(room)!, next])
    mirrorQueue.push(next)
  }
}
const visitedMirrorRooms = (
  ...rooms: string[]
): DarkHouseProgress['visited'] => {
  const visited = new Set<DarkHouseProgress['current']>(['HD-01'])
  for (const room of rooms) {
    const path = mirrorPaths.get(room)
    assert.ok(path, `Authored mirror route to ${room} exists`)
    for (const step of path) visited.add(step as DarkHouseProgress['current'])
  }
  return [...visited]
}

// Every generated board is deterministic, fully exposed by exact pair IDs, and
// has two different concrete faces per pair. No network or delivered art needed.
for (const [room, trial] of Object.entries(DARK_HOUSE_TRIALS)) {
  const faces = darkHouseTrialFaces(room)
  assert.deepEqual(faces, darkHouseTrialFaces(room))
  assert.equal(faces.length, trial.pairs.length * 2)
  assert.equal(new Set(faces.map((face) => face.id)).size, faces.length)
  for (const pairId of new Set(faces.map((face) => face.pair))) {
    const two = faces.filter((face) => face.pair === pairId)
    assert.equal(two.length, 2)
    assert.notEqual(two[0]!.label, two[1]!.label)
  }
  let challenge: DarkHouseProgress = {
    ...newDarkHouseProgress(),
    active: true,
    current: room as DarkHouseProgress['current'],
    visited: visitedMirrorRooms(room),
  }
  assert.equal(
    darkHouseChoose(challenge, 'attend'),
    challenge,
    'Cannot skip a memory encounter with dialogue',
  )
  assert.equal(darkHouseRoomResolved(challenge), false)
  for (const pairId of new Set(faces.map((face) => face.pair))) {
    const two = faces.filter((face) => face.pair === pairId)
    challenge = darkHouseFlip(challenge, two[0]!.id)
    assert.deepEqual(challenge.trials[room]!.faceUp, [two[0]!.id])
    challenge = darkHouseFlip(challenge, two[1]!.id)
    assert.equal(challenge.trials[room]!.faceUp.length, 0)
    assert.ok(challenge.trials[room]!.matched.includes(two[0]!.id))
    assert.ok(challenge.trials[room]!.matched.includes(two[1]!.id))
  }
  assert.equal(darkHouseTrialSolved(challenge, room), true)
  assert.equal(darkHouseRoomResolved(challenge), true)
  assert.equal(darkHouseEchoes(challenge), 1)
  const submitted = darkHouseChoose(challenge, 'attend')
  assert.equal(submitted.decisions[room], 'attend')
  assert.equal(
    darkHouseChoose(submitted, 'refuse'),
    submitted,
    'Committed choice must stay immutable',
  )
  const roundtrip = restoreDarkHouseProgress(
    JSON.parse(JSON.stringify(submitted)),
  )
  assert.equal(roundtrip.decisions[room], 'attend')
  assert.equal(darkHouseTrialSolved(roundtrip, room), true)
  assert.equal(darkHouseEchoes(roundtrip), 1)
}

// A failed match remains visible until explicitly dismissed; returning to the
// game cannot reshuffle the board or turn a mismatch into a matched pair.
let duel: DarkHouseProgress = {
  ...newDarkHouseProgress(),
  active: true,
  current: 'HD-09',
  visited: visitedMirrorRooms('HD-09'),
}
const cards = darkHouseTrialFaces('HD-09')
const first = cards[0]!
const other = cards.find((face) => face.pair !== first.pair)!
duel = darkHouseFlip(duel, first.id)
duel = darkHouseFlip(duel, other.id)
assert.equal(duel.trials['HD-09']!.failures, 1)
assert.deepEqual(duel.trials['HD-09']!.faceUp, [first.id, other.id])
assert.equal(
  darkHouseFlip(duel, cards[2]!.id),
  duel,
  'Third flip forbidden while mismatched faces remain up',
)
duel = restoreDarkHouseProgress(JSON.parse(JSON.stringify(duel)))
assert.deepEqual(duel.trials['HD-09']!.faceUp, [first.id, other.id])
duel = darkHouseCloseMismatch(duel)
assert.deepEqual(duel.trials['HD-09']!.faceUp, [])
assert.equal(darkHouseCloseMismatch(duel), duel)
assert.equal(darkHouseTrialSolved(duel, 'HD-09'), false)

// Three actual mismatches create a narrative fracture, never a hard-lock or
// loss of already-solved evidence.
for (let k = 0; k < 2; k++) {
  duel = darkHouseFlip(duel, first.id)
  duel = darkHouseFlip(duel, other.id)
  duel = darkHouseCloseMismatch(duel)
}
assert.equal(darkHouseStrain(duel), 1)
assert.equal(duel.trials['HD-09']!.failures, 3)
assert.equal(darkHouseEchoes(duel), 0)

// Failed deduction attempts give different evidence and cannot farm penalties.
// Completing a puzzle awards one recall echo and opens the dialogue gate.
for (const [room, puzzle] of Object.entries(DARK_HOUSE_PUZZLES)) {
  let p: DarkHouseProgress = {
    ...newDarkHouseProgress(),
    active: true,
    current: room as DarkHouseProgress['current'],
    visited: visitedMirrorRooms(room),
  }
  assert.equal(darkHouseChoose(p, 'attend'), p)
  assert.equal(darkHouseRoomResolved(p), false)
  const wrong = puzzle.options.find((option) => option.id !== puzzle.answer)!
  p = darkHouseAnswerPuzzle(p, wrong.id)
  assert.equal(p.puzzles[room]?.wrong.length, 1)
  assert.equal(darkHouseAnswerPuzzle(p, wrong.id), p)
  assert.equal(darkHouseStrain(p), 1)
  p = darkHouseAnswerPuzzle(p, puzzle.answer)
  assert.equal(darkHousePuzzleSolved(p, room), true)
  assert.equal(darkHouseEchoes(p), 1)
  assert.equal(darkHouseChoose(p, 'refuse').decisions[room], 'refuse')
  const restored = restoreDarkHouseProgress(JSON.parse(JSON.stringify(p)))
  assert.equal(darkHousePuzzleSolved(restored, room), true)
}

// Spending earned echoes for real hints consumes a single resource only once.
let insight: DarkHouseProgress = {
  ...newDarkHouseProgress(),
  active: true,
  current: 'HD-03',
  visited: visitedMirrorRooms('HD-03'),
}
insight = darkHouseAnswerPuzzle(insight, 'south')
assert.equal(darkHouseEchoes(insight), 1)
insight = {
  ...insight,
  current: 'HD-09',
  visited: visitedMirrorRooms('HD-03', 'HD-09'),
}
insight = darkHouseRecall(insight)
assert.equal(darkHouseEchoes(insight), 0)
assert.ok(insight.trials['HD-09']?.clue)
assert.equal(darkHouseRecall(insight), insight)
insight = restoreDarkHouseProgress(JSON.parse(JSON.stringify(insight)))
assert.equal(darkHouseEchoes(insight), 0)
assert.ok(insight.trials['HD-09']!.clue)

let hint: DarkHouseProgress = {
  ...newDarkHouseProgress(),
  active: true,
  current: 'HD-03',
}
hint = darkHouseAnswerPuzzle(hint, 'south')
hint = { ...hint, current: 'HD-08' }
hint = darkHousePuzzleHint(hint)
assert.equal(hint.puzzles['HD-08']?.hint, true)
assert.equal(darkHouseEchoes(hint), 0)
assert.equal(darkHousePuzzleHint(hint), hint)

// Corrupt saves cannot mint half-pairs, invalid cards, imaginary hints,
// hallucinated rooms or unearned echoes. Preserve pre-upgrade commitments.
const forged = restoreDarkHouseProgress({
  active: true,
  current: 'HD-09',
  visited: visitedMirrorRooms('HD-09'),
  version: 2,
  trials: {
    'HD-09': {
      matched: [cards[0]!.id, 'invented-card'],
      faceUp: ['invented-card'],
      failures: -2,
      clue: 'fiction',
    },
  },
  puzzles: { 'HD-03': { solved: true, wrong: ['wrong-id'], hint: true } },
  spentEchoes: -50,
})
assert.equal(forged.trials['HD-09']!.matched.length, 0)
assert.deepEqual(forged.trials['HD-09']!.faceUp, [])
assert.equal(forged.trials['HD-09']!.failures, 0)
assert.equal(forged.trials['HD-09']!.clue, null)
assert.equal(forged.puzzles['HD-03'], undefined)
assert.equal(darkHouseEchoes(forged), 0)
const unvisitedTrial = darkHouseTrialFaces('HD-22')
const hiddenRewards = restoreDarkHouseProgress({
  active: true,
  current: 'HD-01',
  visited: ['HD-01'],
  decisions: { 'HD-01': 'attend', 'HD-22': 'attend', 'HD-35': 'refuse' },
  trials: {
    'HD-22': {
      matched: unvisitedTrial.map((face) => face.id),
      faceUp: [],
      failures: 0,
      clue: null,
      note: '',
    },
  },
  puzzles: {
    'HD-03': { solved: true, wrong: [], hint: true, note: '' },
  },
  spentEchoes: 3,
})
assert.deepEqual(hiddenRewards.decisions, { 'HD-01': 'attend' })
assert.equal(hiddenRewards.trials['HD-22'], undefined)
assert.equal(hiddenRewards.puzzles['HD-03'], undefined)
assert.equal(hiddenRewards.ending, null)
assert.equal(hiddenRewards.spentEchoes, 0)
assert.equal(darkHouseEchoes(hiddenRewards), 0)
assert.deepEqual(
  restoreDarkHouseProgress(JSON.parse(JSON.stringify(hiddenRewards))),
  hiddenRewards,
  'A cleaned save must remain clean after another reload',
)

const legacy = restoreDarkHouseProgress({
  version: 1,
  active: true,
  current: 'HD-32',
  visited: visitedMirrorRooms('HD-32'),
  decisions: { 'HD-32': 'attend' },
})
assert.equal(darkHouseRoomResolved(legacy), true)
assert.ok(darkHouseExits(legacy).includes('HD-33'))

// New guardians require actual memory skill as well as a final testimony.
let guardian: DarkHouseProgress = {
  ...newDarkHouseProgress(),
  active: true,
  current: 'HD-32',
  visited: visitedMirrorRooms('HD-32'),
}
assert.ok(!darkHouseExits(guardian).includes('HD-33'))
assert.equal(darkHouseMove(guardian, 'HD-33'), guardian)
assert.equal(darkHouseChoose(guardian, 'attend'), guardian)
const guardianFaces = darkHouseTrialFaces('HD-32')
for (const pairId of new Set(guardianFaces.map((face) => face.pair))) {
  for (const face of guardianFaces.filter((face) => face.pair === pairId))
    guardian = darkHouseFlip(guardian, face.id)
}
guardian = darkHouseChoose(guardian, 'attend')
assert.ok(darkHouseExits(guardian).includes('HD-33'))
assert.equal(darkHouseMove(guardian, 'HD-33').current, 'HD-33')

// Both endings respond to evidence recovered and strain accumulated.
const returned = restoreDarkHouseProgress({
  visited: visitedMirrorRooms('HD-35'),
  decisions: { 'HD-32': 'attend', 'HD-35': 'attend' },
})
const commons = restoreDarkHouseProgress({
  visited: visitedMirrorRooms('HD-35'),
  decisions: { 'HD-32': 'refuse', 'HD-35': 'refuse' },
})
assert.notEqual(darkHouseVerdict(returned), darkHouseVerdict(commons))
assert.ok(darkHouseVerdict(returned).includes('individual owners'))
assert.ok(darkHouseVerdict(commons).includes('revocable commons'))
const damaged = restoreDarkHouseProgress({
  visited: visitedMirrorRooms('HD-03', 'HD-13', 'HD-35'),
  decisions: { 'HD-32': 'attend', 'HD-35': 'attend' },
  puzzles: {
    'HD-03': { solved: true, wrong: ['north', 'same'] },
    'HD-13': { solved: true, wrong: ['oven', 'cook'] },
  },
})
assert.ok(darkHouseVerdict(damaged).includes('visible fractures'))

// Adversarial full-house expedition. Earlier graph-only tests could report
// every chamber reachable even though a player could advance past 25+ authored
// choices with no response. Exercise the *actual reducer*, both ethical
// endings, all puzzle/trial rooms, repeated save/load and DFS backtracking.
function completeRoom(
  original: DarkHouseProgress,
  philosophy: 'attend' | 'refuse',
): DarkHouseProgress {
  let progress = original
  const id = progress.current
  if (DARK_HOUSE_TRIALS[id]) {
    const faces = darkHouseTrialFaces(id)
    for (const pairId of new Set(faces.map((face) => face.pair)))
      for (const face of faces.filter((card) => card.pair === pairId))
        progress = darkHouseFlip(progress, face.id)
  }
  if (DARK_HOUSE_PUZZLES[id])
    progress = darkHouseAnswerPuzzle(progress, DARK_HOUSE_PUZZLES[id]!.answer)
  assert.equal(darkHouseRoomResolved(progress), true, `${id} must resolve`)
  assert.equal(
    darkHouseExits(progress).filter((next) => !progress.visited.includes(next))
      .length,
    0,
    `${id} cannot be skipped even when memory or puzzle is solved`,
  )
  progress = darkHouseChoose(progress, philosophy)
  assert.equal(progress.decisions[id], philosophy, `${id} decision committed`)
  return progress
}
for (const philosophy of ['attend', 'refuse'] as const) {
  let run: DarkHouseProgress = { ...newDarkHouseProgress(), active: true }
  const newlyVisited = new Set<string>([run.current])
  let moves = 0
  function explore(): void {
    const room = run.current
    run = completeRoom(run, philosophy)
    // Every room is allowed to retain its solved response after save/reload.
    run = restoreDarkHouseProgress(JSON.parse(JSON.stringify(run)))
    assert.equal(run.decisions[room], philosophy)
    for (const exit of DARK_HOUSE_ROOMS[room]!.exits) {
      if (newlyVisited.has(exit)) continue
      assert.ok(
        darkHouseExits(run).includes(exit),
        `${philosophy}: cannot reach ${exit} from ${room}`,
      )
      run = darkHouseMove(run, exit)
      assert.equal(run.current, exit)
      newlyVisited.add(exit)
      assert.ok(++moves < 150, 'Bounded thirty-six-room expedition')
      explore()
      assert.ok(
        darkHouseExits(run).includes(room),
        `${philosophy}: backtrack from ${run.current} to ${room}`,
      )
      run = darkHouseMove(run, room)
    }
  }
  explore()
  assert.equal(newlyVisited.size, 36, `${philosophy}: full dungeon reachable`)
  assert.equal(
    Object.keys(run.decisions).length,
    36,
    `${philosophy}: all authored rooms actually receive a choice`,
  )
  assert.equal(
    run.ending,
    philosophy === 'attend' ? 'return' : 'commons',
    'Opposite moral philosophies earn distinct House endings',
  )
  assert.ok(
    darkHouseVerdict(run).includes(
      philosophy === 'attend' ? 'individual owners' : 'revocable commons',
    ),
  )
  const old = run.decisions['HD-35']
  const reloaded = restoreDarkHouseProgress(JSON.parse(JSON.stringify(run)))
  assert.equal(reloaded.decisions['HD-35'], old)
  assert.equal(reloaded.ending, run.ending)
  assert.equal(
    darkHouseChoose(reloaded, philosophy === 'attend' ? 'refuse' : 'attend'),
    reloaded,
  )
}
console.log(
  'Adversarial mirrored House: both complete 36-room ethical playthroughs, 72 real choices, save/reload, witness gate and every backtrack verified',
)

const component = readFileSync(
  'components/memory-dungeon/dark-house-stage.vue',
  'utf8',
)
const store = readFileSync('stores/memoryWorldStore.ts', 'utf8')
assert.ok(component.includes('data-testid="dark-house-memory-trial"'))
assert.ok(component.includes('data-testid="dark-house-logic-puzzle"'))
assert.ok(component.includes('world.darkHouseFlipCard(face.id)'))
assert.ok(component.includes('world.darkHouseTurnCardsOver()'))
assert.ok(component.includes('world.darkHouseAnswer(answer.id)'))
assert.ok(component.includes('world.darkHouseReady'))
assert.ok(component.includes('data-testid="dark-house-verdict"'))
assert.ok(store.includes('persistReality()'))
assert.ok(store.includes('darkHouseUseRecall'))
console.log(
  'Dark House gameplay: 6 evidence-match challenges, 5 real deduction puzzles, save integrity, resource hints, guardian gates and reactive verdict pass',
)
