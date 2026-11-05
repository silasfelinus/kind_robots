import assert from 'node:assert/strict'
import {
  CHOKING_WORKS,
  CHOKING_ENDINGS,
  type ChokingEntry,
  type ChokingProgress,
  type ChokingRoomId,
} from '../memoryDungeon/chokingWorks'
import { BREATHING_WORKS, WORKS_ENDINGS } from '../memoryDungeon/breathingWorks'

const D = CHOKING_WORKS
assert.deepEqual(D.validate(), [])
assert.equal(Object.keys(D.rooms).length, 36)

/** Walk to a room along currently open doors, one passage at a time. */
function goTo(progress: ChokingProgress, target: ChokingRoomId) {
  const previous = new Map<ChokingRoomId, ChokingRoomId>()
  const queue: ChokingRoomId[] = [progress.current]
  const seen = new Set(queue)
  for (let i = 0; i < queue.length && !seen.has(target); i++)
    for (const next of D.exits(progress, queue[i]!))
      if (!seen.has(next)) {
        seen.add(next)
        previous.set(next, queue[i]!)
        queue.push(next)
      }
  assert.ok(seen.has(target), 'no open route to ' + target)
  const path: ChokingRoomId[] = []
  for (let step = target; step !== progress.current; step = previous.get(step)!)
    path.unshift(step)
  for (const step of path) {
    const moved = D.travel(progress, step)
    assert.notEqual(moved, progress, 'blocked at ' + step)
    progress = moved
  }
  return progress
}

function settle(progress: ChokingProgress): ChokingProgress {
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

function exploreUpper(entry: ChokingEntry): ChokingProgress {
  let progress = settle(D.newProgress(entry))
  for (let n = 2; n <= 31; n++)
    progress = settle(
      goTo(progress, ('CW-' + String(n).padStart(2, '0')) as ChokingRoomId),
    )
  return progress
}

// Gates.
const fresh = D.newProgress('listened')
assert.ok(!D.exits(fresh, 'CW-32').includes('CW-33'))
assert.ok(!D.exits(fresh, 'CW-35').includes('CW-36'))

for (const entry of ['pulled', 'listened'] as const) {
  const upper = exploreUpper(entry)
  assert.equal(upper.visited.length, 31)
  assert.ok(upper.evidence >= 4, entry + ': evidence 4 is earnable')
  let atWarden = goTo(upper, 'CW-32')
  const proof = D.rooms['CW-32']!.choices.find(
    (choice) => choice.id === 'show-evidence',
  )!
  assert.equal(D.choiceLock(atWarden, proof), null)
  assert.notEqual(D.choiceLock(D.newProgress(entry), proof), null)
  assert.ok(!D.exits(atWarden).includes('CW-33'))
  atWarden = D.choose(atWarden, 'truth')
  assert.ok(atWarden.guardianPassed)
  for (const ending of CHOKING_ENDINGS) {
    let run = goTo(atWarden, 'CW-35')
    run = D.choose(run, ending)
    assert.equal(run.ending, ending)
    run = D.choose(goTo(run, 'CW-36'), 'climb')
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
  let run = goTo(settle(D.newProgress('pulled')), 'CW-18')
  assert.ok(!D.exits(run).includes('CW-05'))
  run = D.choose(run, 'open-hatch')
  assert.ok(D.exits(run).includes('CW-05'))
  run = D.choose(goTo(run, 'CW-24'), 'wedge')
  assert.ok(D.exits(run).includes('CW-31'))
}
for (const room of Object.values(D.rooms).filter((r) => r.autoChoiceId)) {
  const run = goTo(settle(D.newProgress('pulled')), room.id)
  assert.equal(run.decisions[room.id], room.autoChoiceId)
}

// Forged saves cannot assert a guardian pass, an ending or totals.
{
  const forged = D.restore(
    {
      visited: Object.keys(D.rooms),
      order: [
        ['CW-35', 'char-holds-key'],
        ['CW-36', 'climb'],
      ],
      current: 'CW-36',
      guardianPassed: true,
      ending: 'char-holds-key',
      evidence: 99,
    },
    'listened',
  )
  assert.equal(forged.guardianPassed, false)
  assert.equal(forged.ending, null)
  assert.ok(!forged.completed && forged.evidence < 99)
}

// The choking rooms remember their breathing twins and how the Works ended.
const echoes = Object.values(D.rooms).flatMap((room) => room.echoes ?? [])
assert.ok(echoes.length >= 20, 'expected 20+ echoes, got ' + echoes.length)
const sameRoom = Object.values(D.rooms).filter((room) =>
  room.echoes?.some((echo) =>
    echo.flag.startsWith(room.id.replace('CW-', 'GT-') + ':'),
  ),
)
assert.ok(sameRoom.length >= 18, 'expected 18+ rooms echoing their GT twin')
for (const flag of [
  ...WORKS_ENDINGS.map((ending) => 'GT-35:' + ending),
  'e05:run-again',
  'e05:stay',
  'e05:tell-char',
  'e04:char-lost-in-present',
  'e04:char-alive-commuters-stranded',
  'e04:char-alive-district-at-risk',
  'entry:pulled',
  'entry:listened',
])
  assert.ok(
    echoes.some((echo) => echo.flag === flag),
    'nothing remembers ' + flag,
  )
assert.ok(
  echoes.some((echo) => echo.flag.startsWith('e06:')),
  'no room remembers the e06 overworld',
)
for (const ending of CHOKING_ENDINGS)
  assert.ok(
    D.rooms['CW-36']!.echoes?.some((echo) => echo.flag === 'CW-35:' + ending),
    'the exit forgets CW-35:' + ending,
  )
for (const room of Object.values(D.rooms))
  assert.notEqual(
    room.title,
    BREATHING_WORKS.rooms[room.id.replace('CW-', 'GT-') as `GT-${string}`]
      ?.title,
    room.id + ' title must differ from its breathing twin',
  )
{
  const door = D.rooms['CW-01']!
  assert.notEqual(
    D.opening(door, D.flags(D.newProgress('pulled'))),
    D.opening(door, D.flags(D.newProgress('listened'))),
  )
  const twin = sameRoom[0]!
  const flag = twin.echoes!.find((echo) =>
    echo.flag.startsWith(twin.id.replace('CW-', 'GT-') + ':'),
  )!.flag
  const run = D.newProgress('pulled')
  assert.notEqual(
    D.opening(twin, D.flags(run)),
    D.opening(twin, [...D.flags(run), flag]),
    'Breathing Works flags must reach the choking rooms',
  )
}

console.log(
  'Choking Works: 36 rooms on the Breathing Works plan, ' +
    echoes.length +
    ' echoes (' +
    sameRoom.length +
    ' remember their breathing twin); both entries reach all three endings; gates, shortcuts, instants and tamper-proof restore hold.',
)
