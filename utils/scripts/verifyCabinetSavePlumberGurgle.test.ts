import assert from 'node:assert/strict'
import {
  CAMPAIGN,
  TILE,
  type StageDef,
} from '../arcade/games/savePlumberLevels'
import {
  HERO_TALL,
  PlumberRun,
} from '../arcade/games/savePlumberPreview'
import { emptyInput, type ArcadeButton } from '../arcade/types'

const cols = 48
const pool: StageDef = {
  code: '2-1',
  name: 'Gurgle training pool',
  gurgleBarrel: { col: 4, row: 20 },
  rows: Array.from({ length: 24 }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      if (row >= 21)
        return col >= 12 && col < 30 && row < 23 ? 'w' : '#'
      if (row === 20 && col === 4) return '@'
      if (row === 20 && col === 43) return 'G'
      return '.'
    }).join(''),
  ),
}
const options = {
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
}
function frame(
  run: PlumberRun,
  held: ArcadeButton[] = [],
  pressed: ArcadeButton[] = [],
) {
  const input = emptyInput()
  for (const key of held) input.held[key] = true
  for (const key of pressed) input.pressed[key] = true
  run.update(input)
}

const run = new PlumberRun(options, { customLevel: pool })
frame(run)
assert.ok(run.gurgle)
assert.equal(run.gurgle.state, 'parked')
frame(run, ['down'], ['x'])
assert.equal(run.gurgle.state, 'mounted')
assert.equal(run.power, null)
for (let i = 0; i < 240 && run.hero.x < 32 * TILE; i++) {
  frame(run, ['right'])
  assert.equal(run.mode, 'play', 'mounted swimmer survives the pool')
}
assert.ok(run.hero.x >= 32 * TILE)
assert.equal(run.gurgle.water, true)
assert.equal(run.hearts, 3)
assert.equal(run.deaths, 0)
for (let i = 0; i < 30; i++) frame(run)
assert.equal(run.ground, true)
frame(run, ['a'], ['a'])
for (let i = 0; i < 12; i++) frame(run, ['a'])
assert.equal(run.ground, false)
frame(run, ['a'], ['a'])
assert.equal(run.gurgle.water, false)
assert.equal(run.gurgle.hopped, true)
assert.ok(run.hero.vy < -4)
for (let i = 0; i < 65; i++) frame(run)
assert.equal(run.ground, true)
frame(run, ['down'], ['x'])
assert.equal(run.gurgle.state, 'parked')
frame(run, ['down'], ['x'])
assert.equal(run.gurgle.state, 'mounted')
assert.equal(run.save, undefined)

const solo = new PlumberRun(options, { customLevel: pool })
solo.hero = {
  x: 18 * TILE,
  y: 21 * TILE + 9 - HERO_TALL,
  vx: 0,
  vy: 0,
}
frame(solo)
assert.equal(solo.mode, 'dying', 'unmounted water still requires Tidecoat')

const pilot = new PlumberRun(options, { customLevel: pool, autopilot: true })
assert.equal(pilot.gurgle, null, 'pilots retain their existing route')
assert.ok(CAMPAIGN.find((stage) => stage.code === '2-1')?.gurgleBarrel)
assert.equal(CAMPAIGN.filter((stage) => stage.gurgleBarrel).length, 1)

console.log('Save the Plumber Gurgle mount and surface swim: OK')
