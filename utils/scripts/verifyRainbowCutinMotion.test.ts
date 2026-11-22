import assert from 'node:assert/strict'
import { rainbowCutinPose } from '../arcade/games/rainbowGameArt'

for (let seat = 0; seat < 4; seat++) {
  const entering = rainbowCutinPose(seat, 0)
  const settled = rainbowCutinPose(seat, 18)
  assert.equal(entering.scale, 1.08)
  assert.equal(entering.offsetX, seat % 2 === 0 ? -8 : 8)
  assert.equal(entering.offsetY, 3)
  assert.ok(Math.abs(settled.offsetX) < 1)
  assert.ok(Math.abs(settled.offsetY) < 1)
  for (let frame = 0; frame <= 42; frame++) {
    const pose = rainbowCutinPose(seat, frame)
    assert.ok(pose.scale >= 0.99 && pose.scale <= 1.09)
    assert.ok(Math.abs(pose.offsetX) <= 8)
    assert.ok(Math.abs(pose.offsetY) <= 3.4)
    assert.ok(Number.isFinite(pose.scale))
  }
  for (const frame of [0, 6, 18, 42, 100]) {
    assert.deepEqual(rainbowCutinPose(seat, frame, true), {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    })
  }
  assert.deepEqual(rainbowCutinPose(seat, -10), rainbowCutinPose(seat, 0))
  assert.deepEqual(rainbowCutinPose(seat, 999), rainbowCutinPose(seat, 42))
}
console.log(
  'four painted princess cut-ins: bounded 42-frame motion and calm fallback passed',
)
