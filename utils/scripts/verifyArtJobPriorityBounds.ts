// Contract test for utils/artJobPriority.ts and the admin endpoint that is the
// only API-reachable way to reorder the render queue.
//
// The bug this file exists for, in full: the relay claims work by `priority
// DESC, id ASC`, and producers deliberately queue below zero — /api/art/queue's
// bulk lanes (Facet catalog, daily-dream builds) sit at 0 or under, while
// /api/art/enqueue's interactive work defaults to 100. On 2026-08-13 the live
// PENDING backlog was 389 jobs at -15 and 34 at -20. But the admin priority
// endpoint validated against `MIN_PRIORITY = 0`, so every value those lanes
// actually use was rejected: an operator could promote a job and could never
// demote one. Asked that day to move two flux jobs (priority 0) behind 424 krea2
// jobs (-15/-20), no legal request expressed it — the only API-reachable route
// was raising all 424 of the others instead.
//
// The floor is now negative and the endpoint delegates to the shared parse. The
// checks below pin both halves: the range must still admit the tiers in real
// use, and the endpoint must not drift back to a hand-rolled bound.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BACK_OF_QUEUE_PRIORITY,
  FRONT_OF_QUEUE_PRIORITY,
  MAX_ART_JOB_PRIORITY,
  MIN_ART_JOB_PRIORITY,
  NORMAL_QUEUE_PRIORITY,
  describeArtJobPriorityChange,
  parseArtJobPriority,
} from '../artJobPriority'

const failures: string[] = []

function check(name: string, run: () => void): void {
  try {
    run()
  } catch (error) {
    failures.push(
      `${name}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

// --- The regression itself -------------------------------------------------

check('negative priorities are accepted', () => {
  for (const priority of [-1, -15, -20, -100, MIN_ART_JOB_PRIORITY]) {
    const parsed = parseArtJobPriority(priority)
    assert.deepEqual(
      parsed,
      { ok: true, priority },
      `priority ${priority} must be accepted — bulk lanes queue below zero`,
    )
  }
})

check('the floor reaches past every bulk lane in use', () => {
  // -15 and -20 were the live PENDING tiers on 2026-08-13; the back-of-queue
  // constant has to sit below them or "send to back" lands mid-backlog.
  assert.ok(
    BACK_OF_QUEUE_PRIORITY < -20,
    `BACK_OF_QUEUE_PRIORITY (${BACK_OF_QUEUE_PRIORITY}) must be below the -20 bulk lane`,
  )
  assert.ok(
    MIN_ART_JOB_PRIORITY < BACK_OF_QUEUE_PRIORITY,
    'the accepted floor must be reachable past the back-of-queue constant',
  )
})

check('the range is symmetric and ordered', () => {
  assert.equal(MIN_ART_JOB_PRIORITY, -MAX_ART_JOB_PRIORITY)
  assert.ok(MIN_ART_JOB_PRIORITY < NORMAL_QUEUE_PRIORITY)
  assert.ok(NORMAL_QUEUE_PRIORITY < FRONT_OF_QUEUE_PRIORITY)
  assert.ok(FRONT_OF_QUEUE_PRIORITY <= MAX_ART_JOB_PRIORITY)
})

// --- Everything the old validation got right, still rejected ---------------

check('out-of-range values are rejected', () => {
  for (const priority of [
    MIN_ART_JOB_PRIORITY - 1,
    MAX_ART_JOB_PRIORITY + 1,
    -100000,
    100000,
  ]) {
    const parsed = parseArtJobPriority(priority)
    assert.equal(parsed.ok, false, `priority ${priority} must be rejected`)
  }
})

check('non-integers and junk are rejected', () => {
  for (const value of [
    1.5,
    -1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    'front',
    {},
    true,
  ]) {
    const parsed = parseArtJobPriority(value)
    assert.equal(
      parsed.ok,
      false,
      `${JSON.stringify(value) ?? String(value)} must be rejected`,
    )
  }
})

check('a missing or malformed body is not coerced to 0', () => {
  // `Number(null)`, `Number('')` and `Number([])` are all 0. The old bare
  // `Number(body?.priority)` therefore turned an unparseable request into a
  // silent write of priority 0 — a real demotion now that the floor is negative.
  for (const value of [null, undefined, '', '   ', []]) {
    const parsed = parseArtJobPriority(value)
    assert.equal(
      parsed.ok,
      false,
      `${JSON.stringify(value) ?? String(value)} must be rejected, not read as priority 0`,
    )
  }
})

check('numeric strings still parse, for tolerant clients', () => {
  assert.deepEqual(parseArtJobPriority('-20'), { ok: true, priority: -20 })
  assert.deepEqual(parseArtJobPriority('100'), { ok: true, priority: 100 })
})

check('the rejection message states the real range', () => {
  const parsed = parseArtJobPriority('nope')
  assert.equal(parsed.ok, false)
  if (parsed.ok) return
  assert.match(parsed.message, new RegExp(String(MIN_ART_JOB_PRIORITY)))
  assert.match(parsed.message, new RegExp(String(MAX_ART_JOB_PRIORITY)))
})

// --- Confirmation copy distinguishes a demotion from a reset ----------------

check('a demotion does not report as "returned to normal"', () => {
  assert.match(describeArtJobPriorityChange(7, -20), /moved back/)
  assert.match(
    describeArtJobPriorityChange(7, FRONT_OF_QUEUE_PRIORITY),
    /ahead/,
  )
  assert.match(
    describeArtJobPriorityChange(7, NORMAL_QUEUE_PRIORITY),
    /normal priority/,
  )
})

// --- The endpoint must keep delegating -------------------------------------

const ENDPOINT = 'server/api/art/queue/[id]/priority.post.ts'

check('the endpoint delegates to the shared parse', () => {
  const source = readFileSync(ENDPOINT, 'utf8')

  assert.match(
    source,
    /parseArtJobPriority/,
    `${ENDPOINT} must validate through parseArtJobPriority`,
  )
  assert.doesNotMatch(
    source,
    /const\s+MIN_PRIORITY\s*=/,
    `${ENDPOINT} must not re-declare its own floor — that is the bug this test pins`,
  )
  assert.doesNotMatch(
    source,
    /const\s+MAX_PRIORITY\s*=/,
    `${ENDPOINT} must not re-declare its own ceiling`,
  )
})

check('the priority store offers a demotion path', () => {
  const source = readFileSync('stores/artJobPriorityStore.ts', 'utf8')

  assert.match(
    source,
    /sendToBack/,
    'the dashboard store must expose a demotion action now that the API allows one',
  )
  assert.doesNotMatch(
    source,
    /const\s+FRONT_OF_QUEUE_PRIORITY\s*=/,
    'the store must import the shared constants, not fork its own copy',
  )
})

// --- Report ----------------------------------------------------------------

if (failures.length) {
  console.error(`ArtJob priority bounds contract FAILED (${failures.length}):`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('ArtJob priority bounds contract passed.')
