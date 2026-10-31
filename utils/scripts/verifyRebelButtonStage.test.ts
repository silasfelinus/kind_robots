import assert from 'node:assert/strict'
import {
  REBEL_MAX_WALLS,
  REBEL_MIN_SCALE,
  rebelScaleFor,
  rebelStageFor,
  rebelWallsFor,
} from '../rebelButtonStage'

for (let p = 0; p <= 10; p++) {
  assert.deepEqual(
    rebelStageFor(p, 123),
    { x: 50, y: 50, scale: 1, walls: 0, rebelling: false },
    `press ${p} must be calm`,
  )
}
assert.equal(rebelStageFor(11, 123).rebelling, true)
assert.deepEqual(rebelStageFor(37, 99), rebelStageFor(37, 99))
assert.notDeepEqual(rebelStageFor(37, 99), rebelStageFor(37, 100))

let lastScale = 1
let lastWalls = 0
for (let p = 1; p <= 150; p++) {
  const s = rebelStageFor(p, 7)
  assert.ok(s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100, `press ${p} in bounds`)
  assert.ok(s.scale >= REBEL_MIN_SCALE && s.scale <= lastScale, 'scale only shrinks')
  assert.ok(s.walls >= lastWalls && s.walls <= REBEL_MAX_WALLS, 'walls only rise, capped')
  lastScale = s.scale
  lastWalls = s.walls
}
assert.equal(rebelScaleFor(11), 0.92)
assert.equal(rebelWallsFor(11), 1)
assert.equal(rebelWallsFor(100), REBEL_MAX_WALLS)
assert.ok(rebelScaleFor(100) < 1)
console.log('rebel button stage: ok')
