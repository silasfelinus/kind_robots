import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create, type Bike } from '../arcade/games/ribbonRiders'
import { emptyInput } from '../arcade/types'
import {
  FAIRGROUNDS,
  arenaById,
  encoreArena,
  type FairArena,
} from '../arcade/ribbonRiders/fairgrounds'
import {
  newKit,
  readFestivalSave,
  type FestivalSave,
} from '../arcade/ribbonRiders/festival'
import { GRID, idx } from '../arcade/ribbonRiders/grid'

type Inner = {
  ready: number
  freeze: number
  roundTicks: number
  cells: Uint8Array
  fill: Uint8Array
  bikes: Bike[]
  level: number
  encore: boolean
  titleChoices: string[]
  save: FestivalSave | null
  playArena(a: FairArena): void
  lay(b: Bike, x?: number, y?: number): void
  openFairground(fair: number): void
  finishFestival(): void
}

const checkpoint: FestivalSave = {
  v: 1,
  fair: 0,
  score: 0,
  lives: 3,
  tickets: 0,
  continued: false,
  champion: true,
  kit: { ...newKit(), grip: true },
}

function game(resume?: FestivalSave, selectScreen = true) {
  return create({
    rng: mulberry32(22),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
    selectScreen,
    resume,
  })
}

const stars = FAIRGROUNDS.find((f) => f.id === 'starlight')!
const comet = arenaById(stars, 'sl-comets')
assert.equal(comet.ribbonLifetime, 360)

{
  const instance = game(undefined, false)
  const g = instance as unknown as Inner
  g.playArena(comet)
  g.ready = 0
  const p = g.bikes[0]!
  const r = g.bikes[1]!
  p.acc = -1e9
  g.freeze = 100
  const head = idx(p.x, p.y)
  const trail = idx(3, 3)
  const rivalTrail = idx(4, 3)
  const gift = idx(5, 3)
  g.lay(p, 3, 3)
  g.lay(r, 4, 3)
  g.cells[gift] = p.id
  g.fill[gift] = 1
  g.roundTicks = 358
  instance.update(emptyInput())
  assert.equal(g.cells[trail], p.id, 'solid until exactly six seconds')
  instance.update(emptyInput())
  assert.equal(g.cells[trail], 0, 'old rider trail expires')
  assert.equal(g.cells[rivalTrail], 0, 'old rival trail expires')
  assert.equal(g.cells[gift], p.id, 'wrapped gifts are not trails')
  assert.equal(g.cells[head], p.id, 'occupied head remains solid')
  g.playArena(arenaById(stars, 'sl-mirror'))
  g.ready = 0
  const fresh = g.bikes[0]!
  fresh.acc = -1e9
  g.freeze = 100
  g.lay(fresh, 3, 3)
  g.roundTicks = 359
  instance.update(emptyInput())
  assert.equal(g.cells[trail], fresh.id, 'ordinary trails remain permanent')
}

{
  const normal = arenaById(stars, 'sl-comets')
  const mirrored = encoreArena(normal)
  assert.equal(mirrored.id, normal.id)
  assert.equal(mirrored.tier, normal.tier + 4)
  assert.equal(mirrored.ribbonLifetime, normal.ribbonLifetime)
  const pad = normal.features.find((f) => f.kind === 'pad')!
  const flipped = mirrored.features.find((f) => f.kind === 'pad')!
  assert.equal(flipped.x, GRID - 1 - pad.x)
  assert.equal(flipped.kind === 'pad' && flipped.dir, 3)
  assert.equal(pad.kind === 'pad' && pad.dir, 1)
  const race = arenaById(FAIRGROUNDS[2]!, 'cb-arches')
  const encoreRace = encoreArena(race)
  assert.equal(
    encoreRace.arches![0]!.x,
    GRID - race.arches![0]!.x - race.arches![0]!.w,
  )
}

{
  assert.ok(readFestivalSave(checkpoint), 'legacy v1 save remains valid')
  assert.equal(readFestivalSave({ ...checkpoint, encore: true })?.encore, true)
  assert.equal(
    readFestivalSave({ ...checkpoint, champion: false, encore: true }),
    null,
    'Encore cannot be unlocked by an unfinished save',
  )
  const beginner = game() as unknown as Inner
  assert.ok(!beginner.titleChoices.includes('encore'))
  const instance = game(checkpoint)
  const g = instance as unknown as Inner
  assert.ok(g.titleChoices.includes('encore'))
  for (let t = 0; t < 9; t++) instance.update(emptyInput())
  const down = emptyInput()
  down.pressed.down = true
  instance.update(down)
  instance.update(down)
  const choose = emptyInput()
  choose.pressed.a = true
  instance.update(choose)
  assert.equal(g.encore, true, 'champion can start Encore from the title')
  assert.equal(g.save?.encore, true, 'Encore survives a checkpoint')
  assert.equal(g.save?.kit.grip, true, 'champion keeps earned kit')
  g.playArena(comet)
  assert.equal(g.level, comet.tier + 4)
  g.finishFestival()
  assert.equal(g.save?.champion, true)
  assert.equal(g.save?.encore, false, 'finished Encore is not an active run')
}

console.log('ribbon riders comet trails and Encore: ok')
