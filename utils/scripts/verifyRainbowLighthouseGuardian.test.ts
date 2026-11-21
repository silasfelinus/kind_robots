import assert from 'node:assert/strict'
import {
  LIGHTHOUSE,
  LIGHTHOUSE_GUARDIAN,
  lighthouseBellkeeperVolley,
  lighthouseGuardianActive,
  lighthouseRouteUnlocked,
} from '../arcade/games/rainbowSunkenLighthouse'
import { CROWN_REEF_PYLONS } from '../arcade/games/rainbowCrownReef'
import {
  RAINBOW_GUARDIAN,
  createRainbowGuardian,
  rainbowGuardianGone,
  rainbowGuardianWarning,
  stepRainbowGuardian,
  type RainbowGuardianShot,
} from '../arcade/games/rainbowGuardian'

const crew = [{ x: 82, y: 130, lives: 3 }]
const fourCrew = [
  { x: 82, y: 70, lives: 3 },
  { x: 82, y: 108, lives: 3 },
  { x: 82, y: 150, lives: 3 },
  { x: 82, y: 190, lives: 3 },
]
assert.deepEqual(LIGHTHOUSE_GUARDIAN, {
  name: 'Drowned Bellkeeper',
  from: 6690,
  to: 7320,
  kind: 'lampkeeper',
})
assert.ok(
  LIGHTHOUSE_GUARDIAN.to - LIGHTHOUSE_GUARDIAN.from >
    RAINBOW_GUARDIAN.firstVolley + RAINBOW_GUARDIAN.escapeLead,
)
assert.equal(lighthouseRouteUnlocked('relay', true, CROWN_REEF_PYLONS), true)
assert.equal(lighthouseRouteUnlocked('relay', false, CROWN_REEF_PYLONS), false)
assert.equal(lighthouseRouteUnlocked('cache', true, CROWN_REEF_PYLONS), false)

for (const [frame, expected] of [
  [LIGHTHOUSE.guardianFrom - 1, false],
  [LIGHTHOUSE.guardianFrom, true],
  [LIGHTHOUSE.guardianTo - 1, true],
  [LIGHTHOUSE.guardianTo, false],
] as const) {
  assert.equal(
    lighthouseGuardianActive(frame, 'relay', true, CROWN_REEF_PYLONS),
    expected,
  )
  assert.equal(
    lighthouseGuardianActive(frame, 'cache', true, CROWN_REEF_PYLONS),
    false,
  )
  assert.equal(
    lighthouseGuardianActive(frame, 'relay', false, CROWN_REEF_PYLONS),
    false,
  )
  assert.equal(
    lighthouseGuardianActive(frame, 'relay', true, CROWN_REEF_PYLONS - 1),
    false,
  )
}

for (const pilots of [1, 4]) {
  const guardian = createRainbowGuardian('lampkeeper', pilots)
  const targetCrew = pilots === 1 ? crew : fourCrew
  const baseline = guardian.maxHp
  assert.ok(baseline > 0)
  let warningFrames = 0
  for (let frame = 1; frame <= RAINBOW_GUARDIAN.firstVolley; frame++) {
    const pellets = stepRainbowGuardian(guardian, targetCrew, false)
    if (rainbowGuardianWarning(guardian)) warningFrames++
    if (frame < RAINBOW_GUARDIAN.firstVolley) {
      assert.deepEqual(pellets, [])
    } else {
      const authored = lighthouseBellkeeperVolley(1)
      assert.equal(guardian.volleys, 1)
      assert.equal(pellets.length, authored.length)
      for (const [index, projectile] of pellets.entries()) {
        const { angle, speed } = authored[index]!
        assert.ok(Math.abs(projectile.vx - Math.cos(angle) * speed) < 1e-9)
        assert.ok(Math.abs(projectile.vy - Math.sin(angle) * speed) < 1e-9)
      }
    }
  }
  assert.equal(
    warningFrames,
    RAINBOW_GUARDIAN.warningFrames,
    'the first bell volley is readable for a full 36-frame warning',
  )

  guardian.hp = guardian.maxHp / 2
  let secondVolley: RainbowGuardianShot[] = []
  while (guardian.volleys < 2) {
    secondVolley = stepRainbowGuardian(guardian, targetCrew, false)
    assert.ok(guardian.frame < 500, 'the second bell must fire on schedule')
  }
  assert.equal(secondVolley.length, lighthouseBellkeeperVolley(2, true).length)
  assert.equal(secondVolley.length, 8, 'the enrage crescent retains its gap')
  assert.ok(secondVolley.every((shot) => shot.vx < 0))
  assert.ok(secondVolley.some((shot) => shot.vy > 0))
  assert.ok(secondVolley.some((shot) => shot.vy < 0))

  const volleyCount = guardian.volleys
  guardian.nextVolley = guardian.frame + 1
  for (let frame = 0; frame < 100; frame++)
    assert.deepEqual(stepRainbowGuardian(guardian, targetCrew, true), [])
  assert.equal(guardian.volleys, volleyCount, 'escape cancels pending volleys')
  assert.equal(rainbowGuardianGone(guardian), true)
  assert.ok(guardian.x > 520)
}
assert.ok(
  createRainbowGuardian('lampkeeper', 4).maxHp >
    createRainbowGuardian('lampkeeper', 1).maxHp,
  'four pilots gain health scaling, not faster undodgeable pellets',
)
assert.equal(LIGHTHOUSE.lampsToLight, 6)
console.log(
  'Drowned Bellkeeper guardian: solo and four-seat scaled HP, visible charge,' +
    ' alternating authored safe-gapped volleys, half-health remix, and escape passed',
)
