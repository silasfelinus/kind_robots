import assert from 'node:assert/strict'
import {
  CAMPAIGN,
  parseStage,
  SOLID_LEDGE,
  TILE,
} from '../arcade/games/savePlumberLevels'
import {
  PLUMBER_WILDWATER_MUSIC,
  PLUMBER_WORLD_MUSIC,
} from '../arcade/games/savePlumberMusic'
import { HERO_TALL, PlumberRun } from '../arcade/games/savePlumberPreview'
import {
  readPlumberFile,
  validPlumberCloudSave,
} from '../arcade/games/savePlumberSave'
import { emptyInput, type ArcadeButton } from '../arcade/types'

const def = CAMPAIGN[0]!
const wild = def.wildwater!
const stage = parseStage(def)
assert.ok(wild)
for (const step of wild.steps) {
  for (let col = step.from; col <= step.to; col++) {
    assert.equal(stage.solid[step.row * stage.cols + col], 0)
  }
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

function walkTo(run: PlumberRun, col: number) {
  const x = col * TILE + TILE / 2
  for (let i = 0; i < 240 && Math.abs(run.hero.x - x) > 3; i++) {
    frame(run, [run.hero.x < x ? 'right' : 'left'])
    assert.equal(run.mode, 'play')
  }
  assert.ok(Math.abs(run.hero.x - x) <= 3, 'walk reaches its destination')
  for (let i = 0; i < 8; i++) frame(run)
}

function turnTap(run: PlumberRun) {
  walkTo(run, 5)
  frame(run, [], ['down'])
  assert.ok(run.activePipeRoom)
  walkTo(run, wild.tap.col)
  frame(run, [], ['x'])
  assert.equal(run.wildwaterActive, true)
  assert.equal(run.music, PLUMBER_WILDWATER_MUSIC)
  for (const step of wild.steps)
    assert.equal(run.solidAt(step.from, step.row), SOLID_LEDGE)
  walkTo(run, 27)
  frame(run, [], ['down'])
  assert.equal(run.activePipeRoom, undefined)
  for (let i = 0; i < 8; i++) frame(run)
}

function jumpTo(run: PlumberRun, col: number, row: number) {
  const x = col * TILE + TILE / 2
  assert.equal(run.ground, true)
  for (let i = 0; i < 100; i++) {
    const held: ArcadeButton[] = ['a']
    const error = x - run.hero.x - run.hero.vx * 5
    if (error > 3) held.push('right')
    if (error < -3) held.push('left')
    frame(run, held, i === 0 ? ['a'] : [])
    assert.equal(run.mode, 'play')
    if (
      i > 0 &&
      run.ground &&
      Math.abs(run.hero.y + HERO_TALL - row * TILE) < 0.1
    ) {
      for (let settle = 0; settle < 8; settle++) frame(run)
      assert.equal(run.ground, true)
      return
    }
  }
  assert.fail(`cannot reach frozen rain step ${col},${row}`)
}

const run = new PlumberRun(options, { customLevel: def })
frame(run)
assert.equal(run.wildwaterActive, false)
assert.equal(run.solidAt(6, 18), 0)
frame(run, [], ['x'])
assert.equal(run.wildwaterActive, false, 'distant wrench is not a tap')
turnTap(run)
assert.equal(run.power, null, 'the route uses the shared base jump')
for (const [col, row] of [
  [7, 18],
  [10, 15],
  [13, 12],
  [16, 9],
  [19, 6],
  [22, 3],
] as const)
  jumpTo(run, col, row)
walkTo(run, wild.pearl.col)
assert.ok(run.pearls.has(def.code))
assert.equal(run.wildwaterActive, false)
assert.equal(run.solidAt(6, 18), 0)
assert.equal(run.music, PLUMBER_WORLD_MUSIC[0])
assert.equal(run.save, undefined, 'Maker runs do not write campaign saves')

const retry = new PlumberRun(options, { customLevel: def })
frame(retry)
turnTap(retry)
;(retry as unknown as { die(): void }).die()
assert.equal(retry.wildwaterActive, false)
assert.equal(retry.solidAt(6, 18), 0)
for (let i = 0; i < 100 && retry.mode !== 'play'; i++) frame(retry)
assert.equal(retry.mode, 'play')
turnTap(retry)
assert.equal(retry.pearls.size, 0)

const seed = readPlumberFile({
  v: 3,
  active: 0,
  slots: [{ heroine: 3, stage: 0, node: '1-1', score: 0, lives: 3, tokens: 0 }],
})
const campaign = new PlumberRun({ ...options, resume: seed })
frame(campaign, [], ['start'])
frame(campaign, [], ['a'])
frame(campaign, [], ['a'])
frame(campaign, [], ['a'])
assert.equal(campaign.mode, 'play')
turnTap(campaign)
for (const [col, row] of [
  [7, 18],
  [10, 15],
  [13, 12],
  [16, 9],
  [19, 6],
  [22, 3],
] as const)
  jumpTo(campaign, col, row)
walkTo(campaign, wild.pearl.col)
const saved = readPlumberFile(campaign.save)
assert.deepEqual(saved.slots[0]?.pearls, ['1-1'])
assert.deepEqual(saved.album.pearls, ['1-1'])
assert.ok(validPlumberCloudSave(saved))
assert.deepEqual(
  readPlumberFile({ ...saved, slots: [null, null, null] }).album.pearls,
  ['1-1'],
)
const resumed = new PlumberRun({ ...options, resume: saved })
assert.ok(resumed.pearls.has('1-1'))
assert.equal(resumed.wildwaterActive, false)
assert.equal(
  readPlumberFile({
    ...saved,
    slots: [{ ...saved.slots[0], pearls: ['invalid', '1-2'] }],
  }).slots[0]?.pearls,
  undefined,
)
console.log('Save the Plumber Rain Stands Still Wildwater: OK')
