import assert from 'node:assert/strict'
import {
  CAMPAIGN,
  SOLID_WATER,
  TILE,
  type StageDef,
} from '../arcade/games/savePlumberLevels'
import { HERO_TALL, PlumberRun } from '../arcade/games/savePlumberPreview'
import {
  readPlumberFile,
  validPlumberCloudSave,
} from '../arcade/games/savePlumberSave'
import { emptyInput, type ArcadeButton } from '../arcade/types'

const cols = 48
const pool: StageDef = {
  code: '2-1',
  name: 'Gurgle training pool',
  gurgleBarrel: { col: 4, row: 20 },
  rows: Array.from({ length: 24 }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      if (row >= 21) return col >= 12 && col < 30 && row < 23 ? 'w' : '#'
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

const wharves = CAMPAIGN.find((stage) => stage.code === '2-1')!
assert.ok(wharves.gurgleBarrel, 'the campaign introduces Gurgle')
const wharfRun = new PlumberRun(options, { customLevel: wharves })
frame(wharfRun)
for (let i = 0; i < 90 && wharfRun.hero.x < 5 * TILE; i++)
  frame(wharfRun, ['right'])
frame(wharfRun, ['down'], ['x'])
assert.equal(wharfRun.gurgle?.state, 'mounted')
assert.equal(wharfRun.gurgle?.water, false)
for (let i = 0; i < 180 && wharfRun.hero.x < 13 * TILE + 8; i++) {
  frame(wharfRun, ['right'])
  assert.equal(wharfRun.mode, 'play', 'the first wharf pool is safe')
}
assert.ok(wharfRun.hero.x >= 13 * TILE + 8, 'Gurgle reaches the far bank')
assert.equal(wharfRun.gurgle?.water, true, 'the pool charges the spout hop')
assert.equal(wharfRun.hearts, 3)
assert.equal(wharfRun.deaths, 0)

const boneyard = CAMPAIGN.find((stage) => stage.code === '2-2')!
function reachColumn(run: PlumberRun, col: number, swim = false) {
  const x = col * TILE + TILE / 2
  for (let i = 0; i < 300 && Math.abs(run.hero.x - x) > 3; i++) {
    const held: ArcadeButton[] = [run.hero.x < x ? 'right' : 'left']
    if (swim) held.push('a')
    frame(run, held)
    assert.equal(run.mode, 'play')
  }
  assert.ok(Math.abs(run.hero.x - x) <= 3, 'reaches the target bank')
  for (let i = 0; i < 25; i++) frame(run)
  assert.equal(run.mode, 'play')
  assert.equal(run.ground, true)
}

for (const mounted of [false, true]) {
  const wreck = new PlumberRun(options, {
    customLevel: mounted
      ? { ...boneyard, gurgleBarrel: { col: 2, row: 20 } }
      : boneyard,
  })
  frame(wreck)
  if (mounted) {
    frame(wreck, ['down'], ['x'])
    assert.equal(wreck.gurgle?.state, 'mounted')
  }
  reachColumn(wreck, 7)
  frame(wreck, [], ['down'])
  assert.ok(wreck.activePipeRoom)
  reachColumn(wreck, 26)
  assert.equal(wreck.power, 'tidecoat')
  assert.equal(wreck.solidAt(29, 8), SOLID_WATER)
  const before = wreck.tokens
  reachColumn(wreck, 39, !mounted)
  reachColumn(wreck, 37)
  reachColumn(wreck, 39)
  assert.equal(wreck.tokens, before + 2)
  if (mounted) assert.equal(wreck.gurgle?.water, true)
  reachColumn(wreck, 24, !mounted)
  frame(wreck, [], ['down'])
  assert.equal(wreck.activePipeRoom, undefined)
  assert.equal(wreck.deaths, 0)
  assert.equal(wreck.hearts, 3)
  assert.equal(wreck.save, undefined)
}

function rollerArena(blocked = false): StageDef {
  return {
    ...pool,
    name: 'Gurgle roller practice',
    rows: pool.rows.map((line, row) =>
      Array.from(line.replace(/w/g, '#'), (cell, col) => {
        if (blocked && col === 5 && (row === 19 || row === 20)) return 'B'
        if (row === 20 && col === 6) return 'r'
        if (row === 20 && col === 10) return 'p'
        return cell
      }).join(''),
    ),
  }
}

const snack = new PlumberRun(options, { customLevel: rollerArena() })
frame(snack)
frame(snack, ['down'], ['x'])
assert.equal(snack.gurgle?.state, 'mounted')
frame(snack, [], ['x'])
const swallowed = snack.heldRoller
assert.ok(swallowed, 'mounted X captures a live roller')
assert.equal(snack.foes.includes(swallowed), false)
frame(snack, ['down'], ['x'])
assert.equal(snack.gurgle?.state, 'mounted', 'spit before dismounting')
assert.equal(snack.heldRoller, swallowed)
for (let i = 0; i < 22; i++) frame(snack)
frame(snack, [], ['x'])
assert.equal(snack.heldRoller, null)
assert.equal(swallowed.state, 'kicked')
assert.ok(swallowed.vx > 0)
const target = snack.foes.find((foe) => foe.kind === 'pumpbug')!
for (let i = 0; i < 50 && !target.fade && target.state !== 'gone'; i++)
  frame(snack)
assert.ok(target.fade || target.state === 'gone', 'spat roller strikes a foe')
assert.equal(snack.hearts, 3)

const screened = new PlumberRun(options, { customLevel: rollerArena(true) })
frame(screened)
frame(screened, ['down'], ['x'])
frame(screened, [], ['x'])
assert.equal(screened.gurgle?.state, 'mounted')
assert.equal(screened.heldRoller, null, 'solid wall blocks the slurp')
assert.notEqual(screened.foes[0]?.state, 'stunned', 'wall blocks the strike')

function supplyArena(blocked = false): StageDef {
  return {
    ...pool,
    name: 'Gurgle supply practice',
    rows: pool.rows.map((line, row) =>
      Array.from(line, (cell, col) => {
        if (blocked && col === 5 && (row === 19 || row === 20)) return 'B'
        if (row === 20 && col === 6) return '1'
        if (row === 21 && col === 6) return 'w'
        return cell
      }).join(''),
    ),
  }
}
const supply = new PlumberRun(options, { customLevel: supplyArena() })
frame(supply)
frame(supply, ['down'], ['x'])
const pickup = supply.pickups[0]!
assert.ok(pickup && !pickup.taken)
frame(supply, [], ['x'])
assert.equal(supply.power, 'springstep')
assert.equal(pickup.taken, true)
assert.equal(supply.gurgle?.water, false, 'one supply per slurp')
for (let i = 0; i < 22; i++) frame(supply)
frame(supply, [], ['x'])
assert.equal(supply.gurgle?.water, true, 'dry mount can sip nearby water')
assert.equal(supply.solidAt(6, 21), SOLID_WATER, 'water stays in the course')
assert.equal(supply.hearts, 3)
const walledSupply = new PlumberRun(options, {
  customLevel: supplyArena(true),
})
frame(walledSupply)
frame(walledSupply, ['down'], ['x'])
frame(walledSupply, [], ['x'])
assert.equal(walledSupply.power, null, 'wall occludes pickup slurp')
assert.equal(walledSupply.gurgle?.water, false, 'wall occludes water slurp')
assert.equal(walledSupply.pickups[0]!.taken, false)

function smallFoeArena(glyph: string, blocked = false): StageDef {
  return {
    ...pool,
    rows: pool.rows.map((line, row) =>
      Array.from(line.replace(/w/g, '#'), (cell, col) => {
        if (blocked && col === 5 && (row === 19 || row === 20)) return 'B'
        if (row === 20 && col === 6) return glyph
        if (row === 20 && col === 7 && glyph === 'p') return 'k'
        return cell
      }).join(''),
    ),
  }
}

const gulp = new PlumberRun(options, { customLevel: smallFoeArena('p') })
frame(gulp)
frame(gulp, ['down'], ['x'])
const bug = gulp.foes[0]!
const crab = gulp.foes[1]!
crab.x = gulp.hero.x + 39
const tokensBefore = gulp.tokens
frame(gulp, [], ['x'])
assert.ok(bug.fade, 'mounted wrench swallows a pumpbug')
assert.equal(crab.fade, 0, 'one small enemy per slurp')
assert.equal(gulp.tokens, tokensBefore + 1)
assert.equal(gulp.heldRoller, null)
for (let i = 0; i < 22; i++) frame(gulp)
crab.x = gulp.hero.x + 32
frame(gulp, [], ['x'])
assert.ok(crab.fade, 'mounted wrench swallows a cork crab')
assert.equal(gulp.tokens, tokensBefore + 2, 'no duplicate swallow reward')

const screenedBug = new PlumberRun(options, {
  customLevel: smallFoeArena('p', true),
})
frame(screenedBug)
frame(screenedBug, ['down'], ['x'])
frame(screenedBug, [], ['x'])
assert.equal(screenedBug.foes[0]?.fade, 0, 'wall blocks a small-enemy gulp')
assert.equal(screenedBug.tokens, 0)

const fishRun = new PlumberRun(options, { customLevel: smallFoeArena('m') })
frame(fishRun)
frame(fishRun, ['down'], ['x'])
const fish = fishRun.foes[0]!
fish.y = fish.homeY - 8
frame(fishRun, [], ['x'])
assert.ok(fish.fade, 'Gurgle catches a leaping minnow')
assert.equal(fishRun.gurgle?.water, true, 'a minnow refills the spout hop')
assert.equal(fishRun.tokens, 0)

const soloBug = new PlumberRun(options, { customLevel: smallFoeArena('p') })
frame(soloBug)
frame(soloBug, [], ['x'])
assert.ok(soloBug.foes[0]?.fade)
assert.equal(soloBug.tokens, 0, 'ordinary wrench gives no swallow reward')

const stageIndex = CAMPAIGN.findIndex((stage) => stage.code === '2-1')
const seedFile = readPlumberFile({
  v: 3,
  active: 0,
  slots: [
    {
      heroine: 3,
      stage: stageIndex,
      node: '2-1',
      score: 0,
      lives: 3,
      tokens: 0,
    },
    { heroine: 4, stage: 0, score: 0, lives: 3, tokens: 0 },
  ],
})
const traveler = new PlumberRun({ ...options, resume: seedFile })
frame(traveler, [], ['start'])
frame(traveler, [], ['a'])
frame(traveler, [], ['a'])
frame(traveler, [], ['a'])
assert.equal(traveler.mode, 'play')
const barrel = traveler.gurgle!
traveler.hero.x = barrel.x
traveler.hero.y = barrel.y - HERO_TALL
traveler.ground = true
frame(traveler, ['down'], ['x'])
assert.equal(traveler.gurgle?.state, 'mounted')
;(traveler as unknown as { stageClear(): void }).stageClear()
for (let i = 0; i < 240 && traveler.modeTimer; i++) frame(traveler)
assert.equal(traveler.mode, 'map')
const travelingFile = readPlumberFile(traveler.save)
assert.equal(travelingFile.slots[0]?.gurgle, true)
assert.equal(travelingFile.slots[1]?.gurgle, undefined)
assert.ok(validPlumberCloudSave(travelingFile))
const resumed = new PlumberRun({ ...options, resume: travelingFile })
resumed.loadStage(stageIndex + 1)
assert.equal(resumed.gurgle?.state, 'mounted')
assert.equal(resumed.gurgle?.water, false, 'charges do not cross courses')
const separate = new PlumberRun({
  ...options,
  resume: { ...travelingFile, active: 1 },
})
separate.loadStage(stageIndex + 1)
assert.equal(separate.gurgle, null, 'companion is slot-scoped')
const maker = new PlumberRun(
  { ...options, resume: travelingFile },
  { customLevel: pool },
)
assert.equal(maker.gurgle?.state, 'parked', 'maker starts independently')
assert.equal(
  readPlumberFile({
    ...travelingFile,
    slots: [{ ...travelingFile.slots[0], gurgle: 'yes' }],
  }).slots[0]?.gurgle,
  undefined,
  'untrusted companion flag is rejected',
)

console.log(
  'Save the Plumber Gurgle mount, surface swim, spit and supplies: OK',
)
