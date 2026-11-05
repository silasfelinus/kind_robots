import assert from 'node:assert/strict'
import {
  SUBLEVEL_ENDINGS,
  SUBLEVEL_ROOMS,
  chooseSublevel,
  newSublevelProgress,
  restoreSublevelProgress,
  sublevelChoiceLock,
  sublevelExits,
  sublevelFlags,
  sublevelOpening,
  travelSublevel,
  validateSublevel,
  type SublevelEnding,
  type SublevelEntry,
  type SublevelProgress,
  type SublevelRoomId,
} from '../memoryDungeon/sublevelB'

assert.deepEqual(validateSublevel(), [])
assert.equal(Object.keys(SUBLEVEL_ROOMS).length, 36)

/** Walk to a room along currently open doors, one passage at a time. */
function goTo(progress: SublevelProgress, target: SublevelRoomId) {
  const previous = new Map<SublevelRoomId, SublevelRoomId>()
  const queue: SublevelRoomId[] = [progress.current]
  const seen = new Set(queue)
  for (let i = 0; i < queue.length && !seen.has(target); i++)
    for (const next of sublevelExits(progress, queue[i]!))
      if (!seen.has(next)) {
        seen.add(next)
        previous.set(next, queue[i]!)
        queue.push(next)
      }
  assert.ok(seen.has(target), 'no open route to ' + target)
  const path: SublevelRoomId[] = []
  for (let step = target; step !== progress.current; step = previous.get(step)!)
    path.unshift(step)
  for (const step of path) {
    const moved = travelSublevel(progress, step)
    assert.notEqual(moved, progress, 'blocked at ' + step)
    progress = moved
  }
  return progress
}

/** Settle the current room with the best available evidence-gaining answer. */
function settle(progress: SublevelProgress): SublevelProgress {
  const room = SUBLEVEL_ROOMS[progress.current]!
  if (progress.decisions[room.id]) return progress
  const open = room.choices.filter(
    (choice) => !sublevelChoiceLock(progress, choice),
  )
  assert.ok(open.length, room.id + ' has no playable choice')
  const pick = [...open].sort(
    (a, b) => (b.gain?.evidence ?? 0) - (a.gain?.evidence ?? 0),
  )[0]!
  const next = chooseSublevel(progress, pick.id)
  assert.notEqual(next, progress)
  return next
}

/** Visit and settle every room reachable before Hollis, in atlas order. */
function exploreUpper(entry: SublevelEntry): SublevelProgress {
  let progress = settle(newSublevelProgress(entry))
  for (let n = 2; n <= 31; n++) {
    const id = ('SB-' + String(n).padStart(2, '0')) as SublevelRoomId
    progress = settle(goTo(progress, id))
  }
  return progress
}

// Gates: the vault and the exit stay shut until earned.
const fresh = newSublevelProgress('badge')
assert.ok(!sublevelExits(fresh, 'SB-32').includes('SB-33'))
assert.ok(!sublevelExits(fresh, 'SB-35').includes('SB-36'))

for (const entry of ['escort', 'badge'] as const) {
  const upper = exploreUpper(entry)
  assert.equal(upper.visited.length, 31)
  assert.ok(upper.evidence >= 4, entry + ': evidence 4 is earnable')
  assert.ok(upper.battery >= 0 && upper.battery <= 5)

  // Hollis: Walt can vouch only if he came down; the truth always works.
  let atHollis = goTo(upper, 'SB-32')
  const hollis = SUBLEVEL_ROOMS['SB-32']!
  const walt = hollis.choices.find((choice) => choice.id === 'walt-vouches')!
  assert.equal(
    sublevelChoiceLock(atHollis, walt) === null,
    entry === 'escort',
    entry + ': walt-vouches lock',
  )
  if (entry === 'badge')
    assert.equal(chooseSublevel(atHollis, 'walt-vouches'), atHollis)
  assert.ok(!sublevelExits(atHollis).includes('SB-33'))
  atHollis = chooseSublevel(atHollis, 'truth')
  assert.ok(atHollis.hollisPassed)

  for (const ending of SUBLEVEL_ENDINGS) {
    let run = goTo(atHollis, 'SB-35')
    assert.ok(!sublevelExits(run).includes('SB-36'))
    run = chooseSublevel(run, ending)
    assert.equal(run.ending, ending)
    run = goTo(run, 'SB-36')
    run = chooseSublevel(run, 'climb')
    assert.ok(run.completed)
    assert.equal(run.visited.length, 36)
    assert.equal(travelSublevel(run, 'SB-35'), run, 'no moves after leaving')

    // Restore replays the save into the identical state.
    const saved = JSON.parse(
      JSON.stringify({
        version: 1,
        visited: run.visited,
        order: run.order,
        current: run.current,
      }),
    )
    assert.deepEqual(restoreSublevelProgress(saved, entry), run)
  }
}

// Evidence route through Hollis without the truth.
{
  const upper = exploreUpper('badge')
  const atHollis = goTo(upper, 'SB-32')
  const passed = chooseSublevel(atHollis, 'show-evidence')
  assert.ok(passed.hollisPassed)
}
{
  const early = goTo(settle(newSublevelProgress('badge')), 'SB-07')
  const show = SUBLEVEL_ROOMS['SB-32']!.choices.find(
    (choice) => choice.id === 'show-evidence',
  )!
  assert.ok(sublevelChoiceLock(early, show), 'evidence 4 lock at the start')
}

// Shortcuts open only after their decision.
{
  let run = settle(newSublevelProgress('escort'))
  run = goTo(run, 'SB-18')
  assert.ok(!sublevelExits(run).includes('SB-05'))
  run = chooseSublevel(run, 'unlatch')
  assert.ok(sublevelExits(run).includes('SB-05'))
  run = goTo(run, 'SB-24')
  run = chooseSublevel(run, 'wedge')
  assert.ok(sublevelExits(run).includes('SB-31'))
}

// Instant rooms resolve once, on arrival.
for (const room of Object.values(SUBLEVEL_ROOMS).filter(
  (r) => r.autoChoiceId,
)) {
  let run = settle(newSublevelProgress('escort'))
  run = goTo(run, room.id)
  assert.equal(run.decisions[room.id], room.autoChoiceId)
  assert.equal(chooseSublevel(run, room.autoChoiceId!), run)
}

// Tampered saves cannot assert totals, a guardian pass or an ending.
{
  const forged = restoreSublevelProgress(
    {
      version: 1,
      visited: Object.keys(SUBLEVEL_ROOMS),
      order: [['SB-35', 'finish'], ['SB-36', 'climb'], ['SB-99', 'x'], 'junk'],
      current: 'SB-36',
      evidence: 99,
      hollisPassed: true,
      ending: 'finish',
      completed: true,
    },
    'badge',
  )
  assert.equal(forged.hollisPassed, false)
  assert.equal(forged.ending, null)
  assert.equal(forged.completed, false)
  assert.ok(!forged.visited.includes('SB-33'))
  assert.notEqual(forged.current, 'SB-36')
  assert.ok(forged.evidence < 99)
  assert.deepEqual(
    restoreSublevelProgress(null, 'escort'),
    newSublevelProgress('escort'),
  )
  assert.deepEqual(
    restoreSublevelProgress('{oops', 'badge'),
    newSublevelProgress('badge'),
  )
}

// Echoes: the door remembers how Morrow came in.
{
  const door = SUBLEVEL_ROOMS['SB-01']!
  const escort = sublevelOpening(
    door,
    sublevelFlags(newSublevelProgress('escort')),
  )
  const badge = sublevelOpening(
    door,
    sublevelFlags(newSublevelProgress('badge')),
  )
  assert.notEqual(escort, badge)
  assert.ok(escort.startsWith(door.opening) && badge.startsWith(door.opening))
}

// Content shape: each room has an unconditional choice; climax endings are distinct.
const echoCount = Object.values(SUBLEVEL_ROOMS).reduce(
  (sum, room) => sum + (room.echoes?.length ?? 0),
  0,
)
assert.ok(echoCount >= 16, 'expected 16+ echoes, got ' + echoCount)
const endingOutcomes = SUBLEVEL_ROOMS['SB-35']!.choices.map((c) => c.outcome)
assert.equal(new Set(endingOutcomes).size, 3)
const endings: SublevelEnding[] = ['return', 'finish', 'confess']
assert.deepEqual(SUBLEVEL_ENDINGS, endings)

console.log(
  'Sublevel B: 36 rooms, ' +
    echoCount +
    ' echoes; both entries reach all three endings; gates, shortcuts, instants and tamper-proof restore hold.',
)
