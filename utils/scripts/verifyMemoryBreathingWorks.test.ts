import assert from 'node:assert/strict'
import {
  BREATHING_WORKS,
  WORKS_ENDINGS,
  type WorksEntry,
  type WorksProgress,
  type WorksRoomId,
} from '../memoryDungeon/breathingWorks'

const D = BREATHING_WORKS
assert.deepEqual(D.validate(), [])
assert.equal(Object.keys(D.rooms).length, 36)

/** Walk to a room along currently open doors, one passage at a time. */
function goTo(progress: WorksProgress, target: WorksRoomId) {
  const previous = new Map<WorksRoomId, WorksRoomId>()
  const queue: WorksRoomId[] = [progress.current]
  const seen = new Set(queue)
  for (let i = 0; i < queue.length && !seen.has(target); i++)
    for (const next of D.exits(progress, queue[i]!))
      if (!seen.has(next)) {
        seen.add(next)
        previous.set(next, queue[i]!)
        queue.push(next)
      }
  assert.ok(seen.has(target), 'no open route to ' + target)
  const path: WorksRoomId[] = []
  for (let step = target; step !== progress.current; step = previous.get(step)!)
    path.unshift(step)
  for (const step of path) {
    const moved = D.travel(progress, step)
    assert.notEqual(moved, progress, 'blocked at ' + step)
    progress = moved
  }
  return progress
}

function settle(progress: WorksProgress): WorksProgress {
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

function exploreUpper(entry: WorksEntry): WorksProgress {
  let progress = settle(D.newProgress(entry))
  for (let n = 2; n <= 31; n++)
    progress = settle(
      goTo(progress, ('GT-' + String(n).padStart(2, '0')) as WorksRoomId),
    )
  return progress
}

// Gates.
const fresh = D.newProgress('still')
assert.ok(!D.exits(fresh, 'GT-32').includes('GT-33'))
assert.ok(!D.exits(fresh, 'GT-35').includes('GT-36'))

for (const entry of ['current', 'still'] as const) {
  const upper = exploreUpper(entry)
  assert.equal(upper.visited.length, 31)
  assert.ok(upper.evidence >= 4, entry + ': evidence 4 is earnable')
  let atWarden = goTo(upper, 'GT-32')
  const proof = D.rooms['GT-32']!.choices.find(
    (choice) => choice.id === 'show-evidence',
  )!
  assert.equal(D.choiceLock(atWarden, proof), null)
  assert.notEqual(D.choiceLock(D.newProgress(entry), proof), null)
  assert.ok(!D.exits(atWarden).includes('GT-33'))
  atWarden = D.choose(atWarden, 'truth')
  assert.ok(atWarden.guardianPassed)
  for (const ending of WORKS_ENDINGS) {
    let run = goTo(atWarden, 'GT-35')
    run = D.choose(run, ending)
    assert.equal(run.ending, ending)
    run = D.choose(goTo(run, 'GT-36'), 'climb')
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
  let run = goTo(settle(D.newProgress('current')), 'GT-18')
  assert.ok(!D.exits(run).includes('GT-05'))
  run = D.choose(run, 'open-hatch')
  assert.ok(D.exits(run).includes('GT-05'))
  run = D.choose(goTo(run, 'GT-24'), 'wedge')
  assert.ok(D.exits(run).includes('GT-31'))
}
for (const room of Object.values(D.rooms).filter((r) => r.autoChoiceId)) {
  const run = goTo(settle(D.newProgress('current')), room.id)
  assert.equal(run.decisions[room.id], room.autoChoiceId)
}

// Forged saves cannot assert a guardian pass, an ending or totals.
{
  const forged = D.restore(
    {
      visited: Object.keys(D.rooms),
      order: [
        ['GT-35', 'give-key'],
        ['GT-36', 'climb'],
      ],
      current: 'GT-36',
      guardianPassed: true,
      ending: 'give-key',
      evidence: 99,
    },
    'still',
  )
  assert.equal(forged.guardianPassed, false)
  assert.equal(forged.ending, null)
  assert.ok(!forged.completed && forged.evidence < 99)
}

// The works remember the entry, the e04 tide gate and Scylla's e05 choices.
const echoes = Object.values(D.rooms).flatMap((room) => room.echoes ?? [])
assert.ok(echoes.length >= 20, 'expected 20+ echoes, got ' + echoes.length)
for (const flag of [
  'entry:current',
  'entry:still',
  'e04:char-lost-in-present',
  'e04:char-alive-commuters-stranded',
  'e04:char-alive-district-at-risk',
])
  assert.ok(
    echoes.some((echo) => echo.flag === flag),
    'nothing remembers ' + flag,
  )
assert.ok(
  echoes.some((echo) => echo.flag.startsWith('e05:')),
  'no room remembers the e05 overworld',
)
for (const ending of WORKS_ENDINGS)
  assert.ok(
    D.rooms['GT-36']!.echoes?.some((echo) => echo.flag === 'GT-35:' + ending),
    'the exit forgets GT-35:' + ending,
  )
{
  const door = D.rooms['GT-01']!
  assert.notEqual(
    D.opening(door, D.flags(D.newProgress('current'))),
    D.opening(door, D.flags(D.newProgress('still'))),
  )
  const lost = Object.values(D.rooms).find((room) =>
    room.echoes?.some((echo) => echo.flag === 'e04:char-lost-in-present'),
  )!
  const run = D.newProgress('current')
  assert.notEqual(
    D.opening(lost, D.flags(run)),
    D.opening(lost, [...D.flags(run), 'e04:char-lost-in-present']),
    'external e04 flags must reach the works',
  )
}

console.log(
  'Breathing Works: 36 rooms on the shared plan, ' +
    echoes.length +
    ' echoes; both entries reach all three endings; gates, shortcuts, instants and tamper-proof restore hold.',
)
