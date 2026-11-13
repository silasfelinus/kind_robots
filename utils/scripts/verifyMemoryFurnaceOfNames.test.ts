import assert from 'node:assert/strict'
import {
  FURNACE_OF_NAMES,
  FURNACE_ENDINGS,
  type FurnaceEntry,
  type FurnaceProgress,
  type FurnaceRoomId,
} from '../memoryDungeon/furnaceOfNames'
import { HOSHIMORI_OVEN_ROOMS } from '../memoryDungeon/hoshimoriWarm'
import {
  HOSHIMORI_NIGHT_SITES,
  advanceHoshimoriNight,
  canMoveHoshimoriNight,
  newHoshimoriNightProgress,
  restoreHoshimoriNight,
} from '../memoryDungeon/hoshimoriNight'

const D = FURNACE_OF_NAMES
assert.deepEqual(D.validate(), [])
assert.equal(Object.keys(D.rooms).length, 36)

/** Walk to a room along currently open doors, one passage at a time. */
function goTo(progress: FurnaceProgress, target: FurnaceRoomId) {
  const previous = new Map<FurnaceRoomId, FurnaceRoomId>()
  const queue: FurnaceRoomId[] = [progress.current]
  const seen = new Set(queue)
  for (let i = 0; i < queue.length && !seen.has(target); i++)
    for (const next of D.exits(progress, queue[i]!))
      if (!seen.has(next)) {
        seen.add(next)
        previous.set(next, queue[i]!)
        queue.push(next)
      }
  assert.ok(seen.has(target), 'no open route to ' + target)
  const path: FurnaceRoomId[] = []
  for (let step = target; step !== progress.current; step = previous.get(step)!)
    path.unshift(step)
  for (const step of path) {
    const moved = D.travel(progress, step)
    assert.notEqual(moved, progress, 'blocked at ' + step)
    progress = moved
  }
  return progress
}

function settle(progress: FurnaceProgress): FurnaceProgress {
  const room = D.rooms[progress.current]!
  if (progress.decisions[room.id]) return progress
  const open = room.choices.filter((choice) => !D.choiceLock(progress, choice))
  assert.ok(open.length, room.id + ' has no playable choice')
  const pick = [...open].sort(
    (a, b) => (b.gain?.evidence ?? 0) - (a.gain?.evidence ?? 0),
  )[0]!
  const next = D.choose(progress, pick.id)
  assert.notEqual(next, progress)
  return next
}

function exploreUpper(entry: FurnaceEntry): FurnaceProgress {
  let progress = settle(D.newProgress(entry))
  for (let n = 2; n <= 31; n++)
    progress = settle(
      goTo(progress, ('FN-' + String(n).padStart(2, '0')) as FurnaceRoomId),
    )
  return progress
}

// Gates.
const fresh = D.newProgress('unnamed')
assert.ok(!D.exits(fresh, 'FN-32').includes('FN-33'))
assert.ok(!D.exits(fresh, 'FN-35').includes('FN-36'))

for (const entry of ['named', 'unnamed'] as const) {
  const upper = exploreUpper(entry)
  assert.equal(upper.visited.length, 31)
  assert.ok(upper.evidence >= 4, entry + ': evidence 4 is earnable')
  let atWarden = goTo(upper, 'FN-32')
  const proof = D.rooms['FN-32']!.choices.find(
    (choice) => choice.id === 'show-evidence',
  )!
  assert.equal(D.choiceLock(atWarden, proof), null)
  assert.notEqual(D.choiceLock(D.newProgress(entry), proof), null)
  assert.ok(!D.exits(atWarden).includes('FN-33'))
  atWarden = D.choose(atWarden, 'truth')
  assert.ok(atWarden.guardianPassed)
  for (const ending of FURNACE_ENDINGS) {
    let run = goTo(atWarden, 'FN-35')
    run = D.choose(run, ending)
    assert.equal(run.ending, ending)
    run = D.choose(goTo(run, 'FN-36'), 'climb')
    assert.ok(run.completed)
    assert.equal(run.visited.length, 36)
    const saved = JSON.parse(
      JSON.stringify({
        version: 1,
        visited: run.visited,
        order: run.order,
        current: run.current,
      }),
    )
    assert.deepEqual(D.restore(saved, entry), run)
  }
}

// Follow the real e08 night route into the Furnace and finish each earned exit.
for (const ovenChoice of ['name-the-cost', 'feed-without-claim'] as const) {
  let night = newHoshimoriNightProgress(17)
  night = advanceHoshimoriNight(night, {
    type: 'choose',
    id: HOSHIMORI_NIGHT_SITES[0]!.choices[0]!.id,
  })
  for (const key of [
    '2,1',
    '3,1',
    '4,1',
    '4,2',
    '3,2',
    '2,2',
    '1,2',
    '1,3',
    '2,3',
    '3,3',
    '4,3',
  ]) {
    assert.equal(canMoveHoshimoriNight(night, key), true)
    night = advanceHoshimoriNight(night, { type: 'move', to: key })
    const choice =
      key === '4,3'
        ? ovenChoice
        : HOSHIMORI_NIGHT_SITES.find((site) => site.key === key)!.choices[0]!.id
    night = advanceHoshimoriNight(night, { type: 'choose', id: choice })
    assert.equal(night.choices[key], choice)
  }
  const restoredNight = restoreHoshimoriNight(JSON.parse(JSON.stringify(night)))
  assert.deepEqual(restoredNight, night)
  const entry =
    restoredNight!.choices['4,3'] === 'feed-without-claim'
      ? 'unnamed'
      : 'named'
  for (const ending of FURNACE_ENDINGS) {
    let dungeon = exploreUpper(entry)
    dungeon = D.choose(goTo(dungeon, 'FN-32'), 'truth')
    assert.equal(dungeon.guardianPassed, true)
    dungeon = D.choose(goTo(dungeon, 'FN-35'), ending)
    dungeon = D.choose(goTo(dungeon, 'FN-36'), 'climb')
    assert.equal(dungeon.completed, true)
    assert.equal(dungeon.ending, ending)
    const saved = {
      version: 1,
      visited: dungeon.visited,
      order: dungeon.order,
      current: dungeon.current,
    }
    assert.deepEqual(
      D.restore(JSON.parse(JSON.stringify(saved)), entry),
      dungeon,
    )
  }
}

// Shortcuts and instants.
{
  let run = goTo(settle(D.newProgress('named')), 'FN-18')
  assert.ok(!D.exits(run).includes('FN-05'))
  run = D.choose(run, 'climb-flue')
  assert.ok(D.exits(run).includes('FN-05'))
  run = D.choose(goTo(run, 'FN-24'), 'prop-line')
  assert.ok(D.exits(run).includes('FN-31'))
}
for (const room of Object.values(D.rooms).filter((r) => r.autoChoiceId)) {
  const run = goTo(settle(D.newProgress('named')), room.id)
  assert.equal(run.decisions[room.id], room.autoChoiceId)
}

// Forged saves cannot assert a guardian pass, an ending or totals.
{
  const forged = D.restore(
    {
      visited: Object.keys(D.rooms),
      order: [
        ['FN-35', 'vesper-signs'],
        ['FN-36', 'climb'],
      ],
      current: 'FN-36',
      guardianPassed: true,
      ending: 'vesper-signs',
      evidence: 99,
    },
    'unnamed',
  )
  assert.equal(forged.guardianPassed, false)
  assert.equal(forged.ending, null)
  assert.ok(!forged.completed && forged.evidence < 99)
}

// The burning rooms remember the warm Oven room by room.
const echoes = Object.values(D.rooms).flatMap((room) => room.echoes ?? [])
assert.ok(echoes.length >= 20, 'expected 20+ echoes, got ' + echoes.length)
const oven = new Map(HOSHIMORI_OVEN_ROOMS.map((room) => [room.id, room]))
const sameRoom = Object.values(D.rooms).filter((room) =>
  room.echoes?.some((echo) =>
    echo.flag.startsWith(room.id.replace('FN-', 'OV-') + ':'),
  ),
)
assert.ok(sameRoom.length >= 18, 'expected 18+ rooms echoing their OV twin')
for (const echo of echoes.filter((e) => e.flag.startsWith('OV-'))) {
  const [id, choice] = echo.flag.split(':')
  assert.ok(
    oven.get(id!)?.choices.some((c) => c.id === choice),
    'echo names no real Red Oven choice: ' + echo.flag,
  )
}
for (const flag of ['entry:named', 'entry:unnamed'])
  assert.ok(
    echoes.some((echo) => echo.flag === flag),
    'nothing remembers ' + flag,
  )
assert.ok(
  echoes.some((echo) => echo.flag.startsWith('e07:')),
  'no room remembers the e07 overworld',
)
assert.ok(
  echoes.some((echo) => echo.flag.startsWith('e08:')),
  'no room remembers the e08 overworld',
)
for (const ending of FURNACE_ENDINGS)
  assert.ok(
    D.rooms['FN-36']!.echoes?.some((echo) => echo.flag === 'FN-35:' + ending),
    'the exit forgets FN-35:' + ending,
  )
for (const room of Object.values(D.rooms))
  assert.notEqual(
    room.title,
    oven.get(room.id.replace('FN-', 'OV-'))?.title,
    room.id + ' title must differ from its Red Oven twin',
  )
{
  const door = D.rooms['FN-01']!
  assert.notEqual(
    D.opening(door, D.flags(D.newProgress('named'))),
    D.opening(door, D.flags(D.newProgress('unnamed'))),
  )
  const twin = sameRoom[0]!
  const flag = twin.echoes!.find((echo) =>
    echo.flag.startsWith(twin.id.replace('FN-', 'OV-') + ':'),
  )!.flag
  const run = D.newProgress('named')
  assert.notEqual(
    D.opening(twin, D.flags(run)),
    D.opening(twin, [...D.flags(run), flag]),
    'Red Oven choices must reach the Furnace rooms',
  )
}

console.log(
  'Furnace of Names: 36 rooms, ' +
    echoes.length +
    ' echoes (' +
    sameRoom.length +
    ' remember their Red Oven twin); both entries reach all three endings; gates, shortcuts, instants and tamper-proof restore hold.',
)
