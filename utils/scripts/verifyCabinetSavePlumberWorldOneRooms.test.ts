import assert from 'node:assert/strict'
import {
  CAMPAIGN,
  enclosedPipeRooms,
  parseStage,
  RUSTBOLT_KEEP,
  SOLID_LOCK,
  TILE,
  type StageDef,
} from '../arcade/games/savePlumberLevels'
import { PlumberRun } from '../arcade/games/savePlumberPreview'
import { emptyInput, type ArcadeButton } from '../arcade/types'

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
  assert.equal(run.mode, 'play')
}

function makeRun(def: StageDef) {
  const stage = parseStage(def)
  assert.equal(stage.doors.length, 2)
  assert.equal(enclosedPipeRooms(stage).length, 1)
  const run = new PlumberRun(options, { customLevel: def })
  for (let i = 0; i < 8; i++) frame(run)
  return run
}

function walkTo(run: PlumberRun, col: number, crouch = false) {
  const x = col * TILE + TILE / 2
  for (let i = 0; i < 600 && Math.abs(run.hero.x - x) > 3; i++) {
    const held: ArcadeButton[] = [run.hero.x < x ? 'right' : 'left']
    if (crouch) held.push('down')
    frame(run, held)
  }
  assert.ok(Math.abs(run.hero.x - x) <= 3, 'walk reaches its destination')
}

function enter(run: PlumberRun, col: number, exit: number) {
  walkTo(run, col)
  assert.ok(run.ground)
  frame(run, [], ['down'])
  assert.equal(run.hero.x, exit * TILE + TILE / 2)
  assert.ok(run.activePipeRoom)
}

function leave(run: PlumberRun, col: number, exit: number) {
  walkTo(run, col)
  frame(run, [], ['down'])
  assert.equal(run.hero.x, exit * TILE + TILE / 2)
  assert.equal(run.activePipeRoom, undefined)
  assert.equal(run.deaths, 0)
  assert.equal(run.save, undefined)
}

{
  const run = makeRun(RUSTBOLT_KEEP)
  enter(run, 35, 32)
  assert.notEqual(run.solidAt(28, 20), SOLID_LOCK)
  const tokens = run.tokens
  for (let i = 0; i < 100; i++) frame(run, ['right'])
  assert.ok(run.hero.x < 36 * TILE, 'standing cannot enter the low duct')
  walkTo(run, 43, true)
  assert.equal(run.tokens, tokens + 2)
  walkTo(run, 32, true)
  leave(run, 32, 35)
  assert.equal(run.hearts, 3)
}

{
  const tower = CAMPAIGN.find((stage) => stage.code === '1-4')!
  const run = makeRun(tower)
  run.hearts = 2
  enter(run, 7, 28)
  const tokens = run.tokens
  walkTo(run, 38)
  assert.equal(run.hearts, 3)
  assert.equal(run.tokens, tokens + 2)
  leave(run, 28, 7)
  run.hearts = 2
  enter(run, 7, 28)
  walkTo(run, 38)
  assert.equal(run.hearts, 2, 'boiler heart cannot be farmed by re-entry')
  assert.equal(run.tokens, tokens + 2)
  leave(run, 28, 7)
}

console.log('Save the Plumber World One press duct and boiler loop: OK')
