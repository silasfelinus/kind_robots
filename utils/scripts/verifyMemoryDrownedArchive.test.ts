import assert from 'node:assert/strict'
import {
  DROWNED_ARCHIVE,
  DROWNED_ENDINGS,
  type DrownedEntry,
  type DrownedProgress,
  type DrownedRoomId,
} from '../memoryDungeon/drownedArchive'
import { SUBLEVEL_ROOMS } from '../memoryDungeon/sublevelB'

const D = DROWNED_ARCHIVE
assert.deepEqual(D.validate(), [])
assert.equal(Object.keys(D.rooms).length, 36)

/** Walk to a room along currently open doors, one passage at a time. */
function goTo(progress: DrownedProgress, target: DrownedRoomId) {
  const previous = new Map<DrownedRoomId, DrownedRoomId>()
  const queue: DrownedRoomId[] = [progress.current]
  const seen = new Set(queue)
  for (let i = 0; i < queue.length && !seen.has(target); i++)
    for (const next of D.exits(progress, queue[i]!))
      if (!seen.has(next)) {
        seen.add(next)
        previous.set(next, queue[i]!)
        queue.push(next)
      }
  assert.ok(seen.has(target), 'no open route to ' + target)
  const path: DrownedRoomId[] = []
  for (let step = target; step !== progress.current; step = previous.get(step)!)
    path.unshift(step)
  for (const step of path) {
    const moved = D.travel(progress, step)
    assert.notEqual(moved, progress, 'blocked at ' + step)
    progress = moved
  }
  return progress
}

function settle(progress: DrownedProgress): DrownedProgress {
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

function exploreUpper(entry: DrownedEntry): DrownedProgress {
  let progress = settle(D.newProgress(entry))
  for (let n = 2; n <= 31; n++)
    progress = settle(
      goTo(progress, ('DA-' + String(n).padStart(2, '0')) as DrownedRoomId),
    )
  return progress
}

// Gates.
const fresh = D.newProgress('alone')
assert.ok(!D.exits(fresh, 'DA-32').includes('DA-33'))
assert.ok(!D.exits(fresh, 'DA-35').includes('DA-36'))

for (const entry of ['walt', 'alone'] as const) {
  const upper = exploreUpper(entry)
  assert.equal(upper.visited.length, 31)
  assert.ok(upper.evidence >= 4, entry + ': evidence 4 is earnable')
  let atLedger = goTo(upper, 'DA-32')
  const anchor = D.rooms['DA-32']!.choices.find(
    (choice) => choice.id === 'walt-anchors',
  )!
  assert.equal(D.choiceLock(atLedger, anchor) === null, entry === 'walt')
  assert.ok(!D.exits(atLedger).includes('DA-33'))
  atLedger = D.choose(atLedger, 'truth')
  assert.ok(atLedger.guardianPassed)
  for (const ending of DROWNED_ENDINGS) {
    let run = goTo(atLedger, 'DA-35')
    run = D.choose(run, ending)
    assert.equal(run.ending, ending)
    run = D.choose(goTo(run, 'DA-36'), 'climb')
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

// Shortcuts and instants.
{
  let run = goTo(settle(D.newProgress('walt')), 'DA-18')
  assert.ok(!D.exits(run).includes('DA-05'))
  run = D.choose(run, 'swim-through')
  assert.ok(D.exits(run).includes('DA-05'))
  run = D.choose(goTo(run, 'DA-24'), 'wedge')
  assert.ok(D.exits(run).includes('DA-31'))
}
for (const room of Object.values(D.rooms).filter((r) => r.autoChoiceId)) {
  const run = goTo(settle(D.newProgress('walt')), room.id)
  assert.equal(run.decisions[room.id], room.autoChoiceId)
}

// Forged saves cannot assert a guardian pass, an ending or totals.
{
  const forged = D.restore(
    {
      visited: Object.keys(D.rooms),
      order: [
        ['DA-35', 'rescue'],
        ['DA-36', 'climb'],
      ],
      current: 'DA-36',
      guardianPassed: true,
      ending: 'rescue',
      evidence: 99,
    },
    'alone',
  )
  assert.equal(forged.guardianPassed, false)
  assert.equal(forged.ending, null)
  assert.ok(!forged.completed && forged.evidence < 99)
}

// The flooded rooms remember their dry twins and how Sublevel B ended.
const echoes = Object.values(D.rooms).flatMap((room) => room.echoes ?? [])
assert.ok(echoes.length >= 20, 'expected 20+ echoes, got ' + echoes.length)
const sameRoom = Object.values(D.rooms).filter((room) =>
  room.echoes?.some((echo) =>
    echo.flag.startsWith(room.id.replace('DA-', 'SB-') + ':'),
  ),
)
assert.ok(sameRoom.length >= 10, 'expected 10+ rooms echoing their SB twin')
for (const ending of ['return', 'finish', 'confess'])
  assert.ok(
    echoes.some((echo) => echo.flag === 'SB-35:' + ending),
    'no room remembers SB-35:' + ending,
  )
for (const room of Object.values(D.rooms))
  assert.notEqual(
    room.title,
    SUBLEVEL_ROOMS[room.id.replace('DA-', 'SB-') as `SB-${string}`]?.title,
    room.id + ' title must differ from its dry twin',
  )
{
  const door = D.rooms['DA-01']!
  assert.notEqual(
    D.opening(door, D.flags(D.newProgress('walt'))),
    D.opening(door, D.flags(D.newProgress('alone'))),
  )
}

console.log(
  'Drowned Archive: 36 rooms on Sublevel B’s plan, ' +
    echoes.length +
    ' echoes (' +
    sameRoom.length +
    ' remember their dry twin); both entries reach all three endings; gates, shortcuts, instants and tamper-proof restore hold.',
)
