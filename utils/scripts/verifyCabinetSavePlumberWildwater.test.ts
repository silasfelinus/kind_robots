import assert from 'node:assert/strict'
import {
  CAMPAIGN,
  DRIP_PARLOUR,
  HUSH_CEILING_ROW,
  HUSH_FLOOR_ROW,
  parseStage,
  RUSTBOLT_KEEP,
  SLUICEGATE_STEPS,
  SOLID_BELT_RIGHT,
  SOLID_LADDER,
  SOLID_LEDGE,
  TILE,
  WILDWATER_COURSE_CODES,
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
    slots: [{ ...saved.slots[0], pearls: ['invalid', '1-4'] }],
  }).slots[0]?.pearls,
  undefined,
)
console.log('Save the Plumber Rain Stands Still Wildwater: OK')

const greenhouse = CAMPAIGN.find((course) => course.code === '1-2')!
const overgrowth = greenhouse.wildwater!
assert.equal(overgrowth.name, 'Overgrowth')
const garden = new PlumberRun(options, { customLevel: greenhouse })
frame(garden)
const pistons = garden.platforms.filter(
  (platform) => platform.kind === 'piston',
)
assert.equal(pistons.length, 3)
assert.notEqual(
  garden.platformAt(pistons[0]!, 0).y,
  garden.platformAt(pistons[0]!, 110).y,
)
// The greenhouse gate stands ahead of the pipes and pistons: turn its valve.
walkTo(garden, 3)
frame(garden, [], ['x'])
for (let i = 0; i < 20; i++) frame(garden)
assert.equal(garden.valves[0]?.open, true)
walkTo(garden, 9)
frame(garden, [], ['down'])
assert.ok(garden.activePipeRoom)
walkTo(garden, overgrowth.tap.col)
frame(garden, [], ['x'])
assert.equal(garden.wildwaterActive, true)
for (const piston of pistons) {
  assert.equal(garden.platformAt(piston, 0).y, piston.baseY)
  assert.equal(garden.platformAt(piston, 110).y, piston.baseY)
}
walkTo(garden, 30)
frame(garden, [], ['down'])
assert.equal(garden.activePipeRoom, undefined)
for (let i = 0; i < 8; i++) frame(garden)
jumpTo(garden, 7, 18)

function bounceTo(col: number, jump: boolean) {
  const x = col * TILE + TILE / 2
  for (let i = 0; i < 120; i++) {
    const held: ArcadeButton[] = jump ? ['a'] : []
    const error = x - garden.hero.x - garden.hero.vx * 5
    if (error > 3) held.push('right')
    if (error < -3) held.push('left')
    frame(garden, held, jump && i === 0 ? ['a'] : [])
    assert.equal(garden.mode, 'play')
    if (Math.abs(garden.hero.x - x) < TILE * 2 && garden.hero.vy < -11) return
  }
  assert.fail(`could not bounce on bloom at column ${col}`)
}
bounceTo(10, true)
bounceTo(14, false)
const summit = overgrowth.pearl.col * TILE + TILE / 2
for (let i = 0; i < 120 && garden.wildwaterActive; i++) {
  const error = summit - garden.hero.x - garden.hero.vx * 5
  frame(garden, error > 3 ? ['right'] : error < -3 ? ['left'] : [])
  assert.equal(garden.mode, 'play')
}
assert.ok(garden.pearls.has('1-2'), 'the bloom chain reaches the pearl')
assert.equal(garden.wildwaterActive, false)
assert.equal(garden.solidAt(6, 18), 0)
assert.notEqual(
  garden.platformAt(pistons[0]!, 0).y,
  garden.platformAt(pistons[0]!, 110).y,
)
assert.equal(garden.save, undefined)
assert.deepEqual(
  readPlumberFile({
    ...saved,
    slots: [{ ...saved.slots[0], pearls: ['1-1', '1-2', 'invalid'] }],
  }).slots[0]?.pearls,
  ['1-1', '1-2'],
)
console.log('Save the Plumber Overgrowth bloom chain: OK')

const meterDef = CAMPAIGN.find((course) => course.code === '1-3')!
const backward = meterDef.wildwater!
assert.equal(backward.name, 'Meter Runs Backward')
const meter = new PlumberRun(options, { customLevel: meterDef })
frame(meter)
const lift = meter.platforms.find((platform) => platform.kind === 'lift')!
assert.ok(lift)
walkTo(meter, 9)
frame(meter, [], ['down'])
assert.ok(meter.activePipeRoom)
walkTo(meter, backward.tap.col)
const activation = meter.tick + 1
const oldAt = meter.platformAt(lift, activation)
const oldBefore = meter.platformAt(lift, activation - 10)
const oldAfter = meter.platformAt(lift, activation + 10)
frame(meter, [], ['x'])
assert.equal(meter.wildwaterActive, true)
assert.deepEqual(meter.platformAt(lift, activation), oldAt)
assert.deepEqual(meter.platformAt(lift, activation + 10), oldBefore)
assert.notEqual(oldAfter.x, oldBefore.x)
walkTo(meter, 38)
frame(meter, [], ['down'])
assert.equal(meter.activePipeRoom, undefined)
for (let i = 0; i < 8; i++) frame(meter)
jumpTo(meter, 9, 18)
jumpTo(meter, 11, 15)

for (let i = 0; i < 120; i++) {
  const future = meter.platformAt(lift, meter.tick + 1)
  const target = future.x + lift.w / 2
  const error = target - meter.hero.x - meter.hero.vx * 5
  const held: ArcadeButton[] = ['a']
  if (error > 3) held.push('right')
  if (error < -3) held.push('left')
  frame(meter, held, i === 0 ? ['a'] : [])
  assert.equal(meter.mode, 'play')
  if (meter.ground && Math.abs(meter.hero.y + HERO_TALL - lift.y) < 0.1) break
}
assert.ok(meter.ground)
assert.equal(meter.hero.y + HERO_TALL, lift.y)
for (let i = 0; i < 300 && meter.hero.x > 120; i++) {
  frame(meter)
  assert.equal(meter.mode, 'play')
  assert.ok(meter.ground, 'the reversing lift carries its rider')
}
assert.ok(meter.hero.x <= 120, 'lift reaches the left-hand return path')
jumpTo(meter, 4, 9)
for (let i = 0; i < 100 && meter.wildwaterActive; i++) frame(meter, ['left'])
assert.ok(meter.pearls.has('1-3'))
assert.equal(meter.wildwaterActive, false)
for (const step of backward.steps)
  assert.equal(meter.solidAt(step.from, step.row), 0)
assert.ok(Math.abs(lift.x - meter.platformAt(lift, meter.tick).x) < 0.1)
assert.equal(meter.save, undefined)
assert.deepEqual(
  readPlumberFile({
    ...saved,
    slots: [{ ...saved.slots[0], pearls: ['1-1', '1-2', '1-3'] }],
  }).slots[0]?.pearls,
  ['1-1', '1-2', '1-3'],
)
console.log('Save the Plumber Meter Runs Backward: OK')

const parlour = new PlumberRun(options, { customLevel: DRIP_PARLOUR })
frame(parlour)
frame(parlour, [], ['x'])
assert.equal(parlour.wildwaterActive, true)
for (let i = 0; i < 100 && !parlour.ground; i++) frame(parlour)
assert.equal(parlour.hero.y, HUSH_CEILING_ROW * TILE)
assert.equal(parlour.ground, true)
walkTo(parlour, 5)
frame(parlour, [], ['down'])
assert.equal(parlour.hero.x, 12 * TILE + TILE / 2, 'wrong door loops back')
assert.equal(parlour.pearls.has('1-h'), false)
for (let i = 0; i < 40; i++) frame(parlour, ['right'])
assert.ok(parlour.hero.x < 16 * TILE, 'ceiling beam blocks walking')
assert.equal(parlour.ground, true)
const doorX = 18 * TILE + TILE / 2
for (let i = 0; i < 120; i++) {
  const error = doorX - parlour.hero.x - parlour.hero.vx * 5
  const held: ArcadeButton[] = ['a']
  if (error > 3) held.push('right')
  if (error < -3) held.push('left')
  frame(parlour, held, i === 0 ? ['a'] : [])
  if (i > 0 && parlour.ground && Math.abs(parlour.hero.x - doorX) < 10) break
}
assert.ok(Math.abs(parlour.hero.x - doorX) < 10)
assert.equal(parlour.hero.y, HUSH_CEILING_ROW * TILE)
frame(parlour, [], ['down'])
assert.equal(parlour.hero.x, 36 * TILE + TILE / 2)
walkTo(parlour, 29)
frame(parlour, [], ['down'])
assert.equal(parlour.hero.x, 60 * TILE + TILE / 2)
walkTo(parlour, 66)
frame(parlour, [], ['down'])
assert.equal(parlour.hero.x, 12 * TILE + TILE / 2)
assert.equal(parlour.mode, 'play', 'ceiling exit loops rather than clearing')
walkTo(parlour, 8)
assert.equal(parlour.pearls.has('1-h'), true)
assert.equal(parlour.wildwaterActive, false)
for (let i = 0; i < 100 && !parlour.ground; i++) frame(parlour)
assert.equal(parlour.hero.y + HERO_TALL, HUSH_FLOOR_ROW * TILE)
assert.equal(parlour.save, undefined)
assert.deepEqual(
  readPlumberFile({
    ...saved,
    slots: [{ ...saved.slots[0], pearls: ['1-h', 'not-a-course'] }],
  }).slots[0]?.pearls,
  ['1-h'],
)
console.log('Save the Plumber Upside Parlour ceiling loop: OK')

const spillway = SLUICEGATE_STEPS.wildwater!
assert.equal(spillway.name, 'Spillway Opens')
assert.ok(WILDWATER_COURSE_CODES.includes(SLUICEGATE_STEPS.code))
const damStage = parseStage(SLUICEGATE_STEPS)
for (const step of spillway.steps) {
  for (let col = step.from; col <= step.to; col++)
    assert.equal(damStage.solid[step.row * damStage.cols + col], 0)
}
const sheet = spillway.escalators![0]!
for (let row = sheet.top; row <= sheet.bottom; row++) {
  for (let col = sheet.col; col <= sheet.col + sheet.width; col++)
    assert.equal(damStage.solid[row * damStage.cols + col], 0, 'sheet is open')
}
assert.notEqual(
  damStage.solid[(sheet.bottom + 1) * damStage.cols + sheet.col],
  0,
  'the sheet rises from the dam crest',
)
assert.notEqual(
  damStage.solid[spillway.tap.row * damStage.cols + spillway.tap.col],
  0,
  'the tap stands on the crest',
)

const dam = new PlumberRun(options, { customLevel: SLUICEGATE_STEPS })
frame(dam)
walkTo(dam, 29)
assert.equal(dam.solidAt(29, 20), SOLID_LADDER)
frame(dam, ['up'])
assert.ok(dam.climbing, 'the dam rope is reachable')
for (let i = 0; i < 120 && dam.climbing; i++) frame(dam, ['up'])
for (let i = 0; i < 12; i++) frame(dam, ['right'])
for (let i = 0; i < 12; i++) frame(dam)
assert.equal(dam.hero.y + HERO_TALL, 13 * TILE, 'she stands on the dam crest')

// Before the Tap, the spillway column is ordinary dry air.
walkTo(dam, sheet.col)
for (let i = 0; i < 30; i++) frame(dam)
assert.equal(dam.ground, true)
assert.equal(dam.hero.y + HERO_TALL, 13 * TILE)
walkTo(dam, spillway.tap.col)
frame(dam, [], ['x'])
assert.equal(dam.wildwaterActive, true)
assert.equal(dam.music, PLUMBER_WILDWATER_MUSIC)
for (const step of spillway.steps)
  assert.equal(dam.solidAt(step.from, step.row), SOLID_LEDGE)

walkTo(dam, sheet.col)
let crest = Infinity
for (let i = 0; i < 160; i++) {
  frame(dam)
  assert.equal(dam.mode, 'play')
  crest = Math.min(crest, dam.hero.y + HERO_TALL)
}
assert.ok(crest <= sheet.top * TILE + 4, 'the sheet carries her to its crest')
assert.ok(crest > (sheet.top - 2) * TILE, 'she bobs at the crest, not beyond')
assert.ok(dam.hero.y + HERO_TALL < 5 * TILE, 'she keeps riding near the top')
assert.equal(dam.ground, false)

for (let i = 0; i < 80 && !dam.ground; i++) {
  frame(dam, ['right'])
  assert.equal(dam.mode, 'play')
}
assert.equal(dam.ground, true)
assert.equal(dam.hero.y + HERO_TALL, spillway.pearl.row * TILE)
for (let i = 0; i < 100 && dam.wildwaterActive; i++) {
  const target = spillway.pearl.col * TILE + TILE / 2
  frame(dam, [dam.hero.x < target ? 'right' : 'left'])
}
assert.equal(dam.wildwaterActive, false)
assert.ok(dam.pearls.has(SLUICEGATE_STEPS.code))
for (const step of spillway.steps)
  assert.equal(dam.solidAt(step.from, step.row), 0)
for (let i = 0; i < 120; i++) frame(dam)
assert.equal(dam.ground, true)
assert.equal(dam.hero.y + HERO_TALL, 13 * TILE, 'she drops safely to the crest')
assert.equal(dam.mode, 'play')

// After the Pearl the spillway runs dry again.
walkTo(dam, sheet.col)
for (let i = 0; i < 30; i++) frame(dam)
assert.equal(dam.hero.y + HERO_TALL, 13 * TILE)
frame(dam, [], ['x'])
assert.equal(dam.wildwaterActive, false, 'a spent tap stays spent')
assert.equal(dam.save, undefined)
assert.deepEqual(
  readPlumberFile({
    ...saved,
    slots: [{ ...saved.slots[0], pearls: ['1-sluice', '1-4', '1-h'] }],
  }).slots[0]?.pearls,
  ['1-sluice', '1-h'],
)
console.log('Save the Plumber Spillway Opens: OK')

const assembly = RUSTBOLT_KEEP.wildwater!
const factory = new PlumberRun(options, { customLevel: RUSTBOLT_KEEP })
frame(factory)
walkTo(factory, 35)
frame(factory, [], ['down'])
assert.ok(factory.activePipeRoom)
walkTo(factory, assembly.tap.col)
const foesBefore = factory.foes.length
assert.ok(foesBefore > 0)
frame(factory, [], ['x'])
assert.equal(factory.wildwaterActive, true)
assert.equal(factory.foes.length, 0)
assert.equal(factory.solidAt(38, 21), SOLID_BELT_RIGHT)
const crates = factory.platforms.filter((p) => p.kind === 'assembly')
assert.equal(crates.length, 3)
assert.notEqual(
  factory.platformAt(crates[0]!, 0).x,
  factory.platformAt(crates[0]!, 25).x,
)
walkTo(factory, 32)
frame(factory, [], ['down'])
assert.equal(factory.activePipeRoom, undefined)
for (let i = 0; i < 8; i++) frame(factory)
for (const crate of crates) {
  for (let i = 0; i < 100; i++) {
    const target = factory.platformAt(crate, factory.tick + 1).x + crate.w / 2
    const error = target - factory.hero.x - factory.hero.vx * 5
    const held: ArcadeButton[] = ['a']
    if (error > 3) held.push('right')
    if (error < -3) held.push('left')
    frame(factory, held, i === 0 ? ['a'] : [])
    assert.equal(factory.mode, 'play')
    if (factory.ground && Math.abs(factory.hero.y + HERO_TALL - crate.y) < 0.1)
      break
  }
  assert.equal(factory.hero.y + HERO_TALL, crate.y)
  frame(factory, [], ['x'])
  assert.equal(crate.sign, 0, 'X secures the crate stack')
}
for (let i = 0; i < 80 && factory.wildwaterActive; i++) {
  const target = assembly.pearl.col * TILE + TILE / 2
  const error = target - factory.hero.x
  frame(factory, error > 3 ? ['right'] : error < -3 ? ['left'] : [])
}
assert.ok(factory.pearls.has('1-f'))
assert.equal(factory.wildwaterActive, false)
assert.equal(factory.platforms.some((p) => p.kind === 'assembly'), false)
assert.notEqual(factory.solidAt(38, 21), SOLID_BELT_RIGHT)
assert.equal(factory.foes.length, foesBefore)
assert.equal(factory.save, undefined)
assert.deepEqual(
  readPlumberFile({
    ...saved,
    slots: [{ ...saved.slots[0], pearls: ['1-f', '1-h', 'invalid'] }],
  }).slots[0]?.pearls,
  ['1-f', '1-h'],
)
console.log('Save the Plumber Assembly Line: OK')
