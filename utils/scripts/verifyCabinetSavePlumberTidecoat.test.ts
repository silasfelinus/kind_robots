import assert from 'node:assert/strict'
import {
  HERO_HALF,
  HERO_TALL,
  PlumberRun,
} from '../arcade/games/savePlumberPreview'
import {
  SOLID_GROUND,
  SOLID_WATER,
  TILE,
  type StageDef,
} from '../arcade/games/savePlumberLevels'
import {
  PLUMBER_ROSTER,
  seedForRoster,
} from '../arcade/games/savePlumberRoster'
import { emptyInput, type ArcadeButton } from '../arcade/types'

const cols = 80
const surface = 18 * TILE
const exit = 40 * TILE
const floor = 23 * TILE
const rows = Array.from({ length: 24 }, (_, row) => {
  const cells = Array.from({ length: cols }, (_, col) => {
    if (row === 23) return '#'
    if (row >= 18 && col >= 18 && col < 40) return 'w'
    if (row === 22 && col === 2) return '@'
    if (row === 22 && col === 8) return '6'
    if (row === 22 && col === 75) return 'G'
    return '.'
  })
  return cells.join('')
})
const pool: StageDef = { code: '2-1', name: 'Tidecoat Lab', rows }
const options = {
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
}

function inWater(run: PlumberRun) {
  return (
    run.solidAt(
      Math.floor(run.hero.x / TILE),
      Math.floor((run.hero.y + HERO_TALL - 6) / TILE),
    ) === SOLID_WATER
  )
}

function assertSafe(run: PlumberRun, label: string) {
  assert.equal(run.mode, 'play', label)
  assert.equal(run.lives, 3, label)
  assert.equal(run.hearts, 3, label)
  assert.equal(run.deaths, 0, label)
  for (
    let row = Math.floor((run.heroTop + 1) / TILE);
    row <= Math.floor((run.hero.y + HERO_TALL - 1) / TILE);
    row++
  ) {
    for (
      let col = Math.floor((run.hero.x - HERO_HALF + 1) / TILE);
      col <= Math.floor((run.hero.x + HERO_HALF - 1) / TILE);
      col++
    ) {
      assert.notEqual(run.solidAt(col, row), SOLID_GROUND, label)
    }
  }
}

function start(index: number, autopilot = false, suited = true, def = pool) {
  const run = new PlumberRun(options, { customLevel: def, autopilot })
  run.heroineSeed = seedForRoster(index, () => 0.5)
  assert.equal(run.member.key, PLUMBER_ROSTER[index]!.key)
  if (suited) {
    const pickup = run.pickups.find((item) => item.kind === 'tidecoat')!
    assert.ok(pickup)
    run.hero = { x: pickup.x, y: pickup.y - 12, vx: 0, vy: 0 }
    run.update(emptyInput())
    assert.equal(run.power, 'tidecoat')
    assert.ok(pickup.taken)
  }
  run.hero = { x: 25 * TILE + 8, y: 20 * TILE, vx: 0, vy: 0 }
  run.ground = false
  assert.ok(inWater(run))
  return run
}

function step(
  run: PlumberRun,
  ticks: number,
  held: ArcadeButton[],
  label: string,
  special = false,
) {
  for (let tick = 0; tick < ticks; tick++) {
    const input = emptyInput()
    for (const key of held) input.held[key] = true
    if (special) input.pressed.y = true
    run.update(input)
    assertSafe(run, label)
  }
}

for (let index = 0; index < PLUMBER_ROSTER.length; index++) {
  const run = start(index)
  const label = PLUMBER_ROSTER[index]!.key
  assert.equal(run.specialKind, PLUMBER_ROSTER[index]!.special.key)
  run.specialTimer = 12
  run.floating = true
  const entryX = run.hero.x
  const entryY = run.hero.y
  step(run, 12, ['right', 'down'], label, true)
  assert.ok(run.hero.x > entryX + 16, label + ': dive steering')
  assert.ok(run.hero.y > entryY + 12, label + ': dive')
  assert.equal(run.specialTimer, 0, label + ': no land special in water')
  assert.equal(run.floating, false, label + ': no land float in water')
  const depth = run.hero.y
  step(run, 24, [], label)
  assert.ok(run.hero.y < depth - 6, label + ': neutral buoyancy')
  assert.ok(inWater(run), label)
  step(run, 40, ['a'], label)
  assert.ok(
    run.hero.y + HERO_TALL < surface,
    label + ': jump stroke breaches the surface',
  )
  // Reset to the common submerged entry and traverse the actual pool boundary.
  run.hero = { x: 25 * TILE + 8, y: 20 * TILE, vx: 0, vy: 0 }
  run.ground = false
  for (let tick = 0; tick < 160 && run.hero.x < exit + TILE; tick++)
    step(run, 1, ['right', 'up'], label)
  assert.ok(run.hero.x >= exit + TILE, label + ': exits onto dry land')
  assert.equal(inWater(run), false, label)
  step(run, 90, [], label)
  assert.equal(run.ground, true, label + ': lands after swimming')
  assert.equal(run.hero.y + HERO_TALL, floor, label)

  const unsuited = start(index, false, false)
  unsuited.update(emptyInput())
  assert.equal(unsuited.mode, 'dying', label + ': water requires Tidecoat')
}

for (const speedRoute of [false, true]) {
  const run = start(0, true)
  run.endless = speedRoute
  const label = speedRoute ? 'speed-route pilot' : 'campaign pilot'
  assert.equal(run.runnerOn, speedRoute)
  let breached = false
  for (let tick = 0; tick < 160 && run.hero.x < exit + TILE; tick++) {
    step(run, 1, [], label)
    if (run.hero.y + HERO_TALL < surface) breached = true
  }
  assert.ok(breached, label + ': surfaces without human input')
  assert.ok(run.hero.x >= exit + TILE, label + ': exits without stalling')
  assert.equal(inWater(run), false, label)
}

// A kick is an underwater, edge-triggered burst, never a land special.
for (const index of PLUMBER_ROSTER.keys()) {
  for (const direction of ['left', 'right'] as const) {
    const run = start(index)
    const control = start(index)
    const sign = direction === 'right' ? 1 : -1
    const x = run.hero.x
    const input = emptyInput()
    input.held[direction] = true
    input.held.b = true
    input.pressed.b = true
    run.update(input)
    assert.ok(run.hero.vx * sign >= 5)
    assert.ok(run.tideKickCooldown > 0)
    step(run, 7, [direction, 'b'], 'kick burst')
    step(control, 8, [direction], 'ordinary swimming')
    assert.ok(
      (run.hero.x - x) * sign > (control.hero.x - x) * sign + 15,
      'kick provides useful burst distance',
    )
    const cooldown = run.tideKickCooldown
    run.update(input)
    assert.equal(run.tideKickCooldown, cooldown - 1)
    assert.equal(run.tideKick, 0)
    assertSafe(run, 'kick cooldown')
    for (let tick = 0; tick < 40; tick++) run.update(emptyInput())
    assert.equal(run.tideKickCooldown, 0)
  }
}

const reverse = start(0)
const rightKick = emptyInput()
rightKick.held.right = rightKick.held.b = rightKick.pressed.b = true
reverse.update(rightKick)
step(reverse, 1, ['left'], 'reverse kick')
assert.equal(reverse.tideKick, 0, 'counter-steering cancels the burst')

const wallCol = 27
const wall = start(0, false, true, {
  ...pool,
  rows: pool.rows.map((row, index) =>
    index >= 18 && index < 23
      ? row.slice(0, wallCol) + '#' + row.slice(wallCol + 1)
      : row,
  ),
})
wall.update(rightKick)
step(wall, 8, ['right'], 'kick into wall')
assert.ok(wall.hero.x + HERO_HALF <= wallCol * TILE + 0.01)
assert.equal(wall.tideKick, 0)
assertSafe(wall, 'kick cannot tunnel through a wall')

const land = start(0)
land.hero = { x: 10 * TILE, y: floor - HERO_TALL, vx: 0, vy: 0 }
land.ground = true
land.update(rightKick)
assert.equal(land.tideKick, 0)
assert.equal(land.tideKickCooldown, 0)

console.log('Save the Plumber Tidecoat: eight heroines and both pilots passed')
