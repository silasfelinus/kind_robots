import assert from 'node:assert/strict'
import {
  createClawburstBoss,
  stepClawburstBoss,
} from '../arcade/games/rainbowClawburst'
import {
  createDelphionBoss,
  stepDelphionBoss,
} from '../arcade/games/rainbowDelphion'
import {
  createEclipseCrownBoss,
  stepEclipseCrownBoss,
} from '../arcade/games/rainbowEclipseCrown'

// Conductor rainbow t-013 (#4146 sections 4 and 9: hide/idle exploits). The scripted fail-and-retry personas found
// a four-pilot crew parked just above Delphion's link core in phase 3: the walking ring never reached it and its
// shots never reached the boss, so the fight stalled for an hour. Every lane a ship can hold must come under fire
// in that phase. A ship parks at its home x in each lane, holds still, and its hits are counted (a pellet within
// the 7 px core, invulnerability ignored).

const HIT = 7
const FRAMES = 1800
type Pellet = { x: number; y: number; vx: number; vy: number; ghost?: boolean }
type Boss = { hp: number; phase: number }
/** Hits a ship parked at (x, y) takes over FRAMES, firing every step's pellets forward. */
function hitsAt(
  make: () => Boss,
  step: (
    boss: Boss,
    targets: { x: number; y: number; lives: number }[],
  ) => Pellet[],
  y: number,
  phase: number,
  x = 90,
): number {
  const boss = make()
  const target = { x, y, lives: 3 }
  const pellets: Pellet[] = []
  let hits = 0
  for (let frame = 0; frame < FRAMES; frame++) {
    for (const pellet of step(boss, [target]))
      if (!pellet.ghost) pellets.push({ ...pellet })
    for (let i = pellets.length - 1; i >= 0; i--) {
      const p = pellets[i]!
      p.x += p.vx
      p.y += p.vy
      if (Math.hypot(p.x - target.x, p.y - target.y) < HIT) {
        hits++
        pellets.splice(i, 1)
      } else if (p.x < -20 || p.x > 520 || p.y < 0 || p.y > 290)
        pellets.splice(i, 1)
    }
  }
  assert.equal(boss.phase, phase)
  return hits
}
function safeLanes(
  make: () => Boss,
  step: (
    boss: Boss,
    targets: { x: number; y: number; lives: number }[],
  ) => Pellet[],
  phase: number,
  x = 90,
): number[] {
  const safe: number[] = []
  for (let y = 40; y <= 240; y += 4)
    if (hitsAt(make, step, y, phase, x) === 0) safe.push(y)
  return safe
}

// B04 Delphion, phase 3: the link core's walking ring plus each wide twin's aimed fan.
const delphion = safeLanes(
  () => Object.assign(createDelphionBoss(300), { hp: 90 }),
  stepDelphionBoss as never,
  3,
)
assert.deepEqual(
  delphion,
  [],
  `Delphion phase 3 leaves no safe lane (safe: ${delphion.join(', ')})`,
)

// B09 Eclipse Crown, phase 1 (independent gameplay critic D6): the spokes walked in 20 degree steps, so a crew
// parked between two bearings took no hits for 200 s while shredding the ring. Alternate volleys now aim.
const crown = safeLanes(
  () => createEclipseCrownBoss(300),
  stepEclipseCrownBoss as never,
  1,
)
assert.deepEqual(
  crown,
  [],
  `Crown phase 1 leaves no safe lane (safe: ${crown.join(', ')})`,
)

// B03 Clawburst, phase 1 (gameplay critic r2 G5): the rail shot aimed at a point in front of the pilot (x 80), so
// a crew parked at the far left edge at (20, 60) sat above its line for all of phase 1 while still hitting the
// boss. The rail now aims at the pilot's own x and y, at the left edge as well as the home line.
for (const x of [20, 90]) {
  const claw = safeLanes(
    () => createClawburstBoss(450),
    stepClawburstBoss as never,
    1,
    x,
  )
  assert.deepEqual(
    claw,
    [],
    `Clawburst phase 1 leaves no safe lane at x ${x} (safe: ${claw.join(', ')})`,
  )
}
assert.ok(
  hitsAt(
    () => createClawburstBoss(450),
    stepClawburstBoss as never,
    60,
    1,
    20,
  ) > 0,
  'the reported pocket at (20, 60) comes under fire',
)

console.log(
  'rainbow boss camping: ok (Delphion phase 3, the Crown phase 1 and Clawburst phase 1 fire on every lane from y 40 to 240)',
)
