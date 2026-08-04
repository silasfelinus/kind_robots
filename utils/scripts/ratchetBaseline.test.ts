// /utils/scripts/ratchetBaseline.test.ts
//
// Self-test for ratchetBaseline.ts (interface-vision t-095).
//
// The helper is now load-bearing for two CI gates -- test:layout-contract and
// audit:wonderlab-previews -- and both of them call it in the ONE direction
// that is hard to notice when it breaks: `grownRatchetBuckets` returning an
// empty array is what lets `--update` write a new allow-list. A regression that
// made it always return [] would not fail either gate; it would quietly turn
// the ratchet into a rubber stamp, which is exactly the failure t-063 found
// five times over in workflow steps that could never go red.
//
// So the cases below lean on growth-detection, and each asserts against the
// real exported function rather than a reimplementation.
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  grownRatchetBuckets,
  loadRatchetBaseline,
  ratchetDelta,
  ratchetNote,
  ratchetRecordedAt,
  writeRatchetBaseline,
} from './ratchetBaseline'

const scratch = mkdtempSync(join(tmpdir(), 'ratchet-baseline-'))

try {
  /* --- grownRatchetBuckets --------------------------------------------- */

  // No baseline yet: nothing can have grown, so a seeding --update is allowed.
  assert.deepEqual(grownRatchetBuckets({ a: ['x', 'y'] }, null), [])

  // Shrinking and holding steady both pass.
  assert.deepEqual(
    grownRatchetBuckets({ a: ['x'], b: ['y'] }, { a: ['x', 'z'], b: ['y'] }),
    [],
  )

  // Growth is caught, and only the buckets that grew are named.
  assert.deepEqual(
    grownRatchetBuckets(
      { a: ['x', 'z'], b: ['y'], c: ['w', 'v'] },
      { a: ['x'], b: ['y'], c: ['w', 'v'] },
    ),
    ['a'],
  )

  // A bucket absent from the baseline counts as zero, not as "unknown, allow
  // it" -- a newly added rule with violations must read as growth. This is the
  // case that separates a real ratchet from a rubber stamp.
  assert.deepEqual(grownRatchetBuckets({ fresh: ['x'] }, { old: [] }), ['fresh'])

  // ...but a newly added rule with NO violations is not growth.
  assert.deepEqual(grownRatchetBuckets({ fresh: [] }, { old: [] }), [])

  // Same count, different members is not growth. The ratchet gates on size;
  // both callers separately diff membership to report what is NEW.
  assert.deepEqual(grownRatchetBuckets({ a: ['q'] }, { a: ['x'] }), [])

  /* --- ratchetDelta ----------------------------------------------------- */

  assert.equal(ratchetDelta(4, undefined), '')
  assert.equal(ratchetDelta(4, 4), '  (unchanged)')
  assert.equal(ratchetDelta(1, 4), '  (-3) ✅')
  assert.equal(ratchetDelta(6, 4), '  (+2) ❌')
  assert.equal(ratchetDelta(0, 0), '  (unchanged)')

  /* --- loadRatchetBaseline / writeRatchetBaseline ------------------------ */

  const missing = join(scratch, 'nope.json')
  assert.equal(
    loadRatchetBaseline(missing),
    null,
    'an absent baseline reads as null, so --update can seed it',
  )

  const corrupt = join(scratch, 'corrupt.json')
  writeRatchetBaseline(corrupt, undefined)
  assert.equal(
    loadRatchetBaseline(corrupt),
    null,
    'an unparseable baseline reads as null rather than throwing -- a hard ' +
      'failure here would block the very --update that rewrites it',
  )

  const roundTrip = join(scratch, 'baseline.json')
  const payload = {
    note: ratchetNote('Example allow-list.', 'utils/scripts/example.ts'),
    recorded: ratchetRecordedAt(),
    entries: { a: ['x'] },
  }
  writeRatchetBaseline(roundTrip, payload)
  assert.deepEqual(loadRatchetBaseline(roundTrip), payload)

  const raw = readFileSync(roundTrip, 'utf8')
  assert.ok(raw.endsWith('}\n'), 'baselines end with a trailing newline')
  assert.ok(raw.includes('\n  "note"'), 'baselines are written 2-space indented')

  /* --- ratchetNote / ratchetRecordedAt ---------------------------------- */

  assert.equal(
    ratchetNote('Layout-contract allow-list.', 'utils/scripts/x.ts'),
    'Layout-contract allow-list. RATCHET: this file may only ever shrink. ' +
      '--update refuses to record a larger count. See utils/scripts/x.ts.',
  )
  assert.match(ratchetRecordedAt(), /^\d{4}-\d{2}-\d{2}$/)
} finally {
  rmSync(scratch, { recursive: true, force: true })
}

console.log('ratchetBaseline self-test passed.')
