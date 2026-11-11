import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SPACE_COUCH_KIT } from '../playbookKit/games/spaceCouch'
import {
  SPACE_COUCH_KIT_ID,
  spaceCouchKitUnlocks,
  type SpaceCouchKitUnlocks,
} from '../gameOfCaptains/kitUnlocks'
import { WARP_ENDINGS } from '../gameOfCaptains/artSlots'
import { UNCLAIMED_ENDINGS } from '../gameOfCaptains/baseEndingCaptains'
import {
  ANTAGONISTS,
  CREW,
  startVoyage,
  type VoyageRun,
} from '../gameOfCaptains/rules'

// The run-state -> kit mapper only ever names ids the Space Couch kit spec
// declares, earns nothing without a run, and every moment, reveal and ending
// the spec declares is reachable from some VoyageRun the game can save.

const spec = SPACE_COUCH_KIT
assert.equal(SPACE_COUCH_KIT_ID, 'game-of-captains')

const empty = spaceCouchKitUnlocks(null)
assert.deepEqual(empty, { moments: [], reveals: [], endings: [] })

const known = {
  moments: new Set(spec.moments.map((m) => m.id)),
  reveals: new Set(spec.reveals.map((r) => r.id)),
  endings: new Set(spec.endings.map((e) => e.id)),
}
const seen = {
  moments: new Set<string>(),
  reveals: new Set<string>(),
  endings: new Set<string>(),
}
const check = (label: string, got: SpaceCouchKitUnlocks) => {
  for (const kind of ['moments', 'reveals', 'endings'] as const)
    for (const id of got[kind]) {
      assert.ok(
        known[kind].has(id),
        `${label}: ${kind} ${id} is not in the spec`,
      )
      seen[kind].add(id)
    }
  return got
}

const fresh = startVoyage('fluke', ['pell', 'vela', 'tess'], 7)
const start = check('fresh', spaceCouchKitUnlocks(fresh))
assert.deepEqual(start.reveals, [], 'a new voyage reveals nothing yet')
assert.deepEqual(start.endings, [])
assert.ok(start.moments.includes('captain-choice'))
assert.ok(!start.moments.includes('homeward'))
// The mapper is pure: the same run gives the same answer and is not mutated.
const snapshot = JSON.stringify(fresh)
assert.deepEqual(spaceCouchKitUnlocks(fresh), start)
assert.equal(JSON.stringify(fresh), snapshot)

const variant = (patch: Partial<VoyageRun>) =>
  ({ ...fresh, ...patch }) as VoyageRun
const mission = (missionId: string) => ({
  chapter: 1,
  missionId,
  system: 'test',
  policy: 'aid' as const,
  result: 'success' as const,
})

check(
  'launched',
  spaceCouchKitUnlocks(
    variant({
      phase: 'transit',
      shieldCharge: 0,
      missionHistory: [
        mission('foundry-strike'),
        mission('serendipity-last-call'),
      ],
    }),
  ),
)
check('holodeck', spaceCouchKitUnlocks(variant({ pocketRoom: 'holodeck' })))
check('war room', spaceCouchKitUnlocks(variant({ pocketRoom: 'war-room' })))
check('finale', spaceCouchKitUnlocks(variant({ phase: 'finale' })))
for (const [index, nemesis] of ANTAGONISTS.entries())
  check(
    nemesis.id,
    spaceCouchKitUnlocks(variant({ antagonist: index, nemesisPressure: 1 })),
  )
check(
  'every detour',
  spaceCouchKitUnlocks(
    variant({
      journeyHistory: CREW.map((c) => ({
        crewId: c.id,
        step: 1,
        system: 'test',
        approach: 'careful' as const,
      })),
    }),
  ),
)
for (const title of new Set([...WARP_ENDINGS, ...UNCLAIMED_ENDINGS])) {
  const got = check(
    title,
    spaceCouchKitUnlocks(variant({ phase: 'ending', ending: title })),
  )
  assert.equal(got.endings.length, 1, `${title} unlocks exactly one ending`)
  assert.ok(got.moments.includes('homeward'))
}

// A missed call does not count as answering it.
const missed = spaceCouchKitUnlocks(
  variant({
    missionHistory: [{ ...mission('foundry-strike'), policy: 'missed' }],
  }),
)
assert.ok(!missed.reveals.includes('strike-secret'))
assert.ok(!missed.moments.includes('first-contact'))

for (const kind of ['moments', 'reveals', 'endings'] as const)
  assert.deepEqual(
    [...known[kind]].filter((id) => !seen[kind].has(id)),
    [],
    `every spec ${kind} id is reachable from a VoyageRun`,
  )

// The store feeds the kit on every save and keeps the voyage save key.
const store = readFileSync(
  new URL('../../stores/gameOfCaptainsStore.ts', import.meta.url),
  'utf8',
)
assert.match(store, /const SAVE_KEY = 'game-of-captains-voyage-v1'/)
assert.match(store, /function persist\(\) \{\n\s+recordKitUnlocks\(\)/)
assert.match(store, /spaceCouchKitUnlocks\(run\.value\)/)

console.log(
  `Space Couch kit unlocks: ${seen.moments.size} moments, ${seen.reveals.size} reveals and ${seen.endings.size} endings reachable from saved runs.`,
)
