import assert from 'node:assert/strict'
import {
  createDelphionBoss,
  stepDelphionBoss,
} from '../arcade/games/rainbowDelphion'

// Conductor rainbow t-013 (#4146 sections 4 and 9: hide/idle exploits). The scripted fail-and-retry personas found
// a four-pilot crew parked just above Delphion's link core in phase 3: the walking ring never reached it and its
// shots never reached the boss, so the fight stalled for an hour. Every lane a ship can hold must come under fire
// in that phase. A ship parks at its home x in each lane, holds still, and its hits are counted (a pellet within
// the 7 px core, invulnerability ignored).

const HIT = 7
const FRAMES = 1500
const hitsAt = (y: number) => {
  const boss = createDelphionBoss(300)
  boss.hp = 90 // phase 3
  const target = { x: 90, y, lives: 3 }
  const pellets: { x: number; y: number; vx: number; vy: number }[] = []
  let hits = 0
  for (let frame = 0; frame < FRAMES; frame++) {
    pellets.push(...stepDelphionBoss(boss, [target]))
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
  assert.equal(boss.phase, 3)
  return hits
}

const safe: number[] = []
for (let y = 40; y <= 240; y += 4) if (hitsAt(y) === 0) safe.push(y)
assert.deepEqual(
  safe,
  [],
  `Delphion phase 3 leaves no safe lane (safe: ${safe.join(', ')})`,
)
console.log(
  'rainbow boss camping: ok (Delphion phase 3 fires on every lane from y 40 to 240)',
)
