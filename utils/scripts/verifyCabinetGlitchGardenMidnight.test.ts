import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create, PRISM_ORDER, type Prism } from '../arcade/games/glitchGarden'
import {
  CAMPAIGN, GARDENS, MIDNIGHT_GARDEN, MIDNIGHT_INDEX, MIDNIGHT_STEPS,
  PLAYS_PER_LAP, campaignPlay, gardenStart,
} from '../arcade/games/glitchGardenGardens'
import { readGardenSave, type GardenSave } from '../arcade/games/glitchGardenSave'
import { emptyInput } from '../arcade/types'

type Beam = { x: number; y: number; powers: Prism[]; pierce: number; child: boolean }
type Probe = {
  garden: { id: string }
  boss: { id: string; phase: number; defeated: boolean } | null
  menu: { items: Array<{ garden: number; overgrown?: boolean }>; cursor: number } | null
  credits: string | null
  save: GardenSave | null
  flowers: Array<{ col: number; row: number; prism: Prism }>
  rootLane: number
  worms: unknown[]
  pumpkins: unknown[]
  snowballs: unknown[]
  leafPiles: unknown[]
  inchworms: unknown[]
  crow: unknown
  crowTimer: number
  lap: number
  level: number
  update(input: ReturnType<typeof emptyInput>): void
  beginStep(index: number, lap: number, level: number): void
  advance(): void
  newBeam(x: number, y: number, child: boolean): Beam
  pickUpPower(beam: Beam, col: number, row: number): void
  hitRootKernel(beam: Beam): boolean
  stepBeam(beam: Beam): boolean
  updateCrow(): void
  rootPosition(): { x: number; y: number }
}
const all = GARDENS.map((g) => g.id)
const legacy = { v: 1, reached: 8, trowels: all, run: null } as const
const make = (resume: unknown) => create({
  rng: mulberry32(501), sound: { play: () => {} }, demo: false,
  hiScore: 0, selectScreen: true, resume,
}) as unknown as Probe
const press = (g: Probe) => {
  const frame = emptyInput()
  frame.pressed.a = true
  g.update(frame)
}
assert.equal(PLAYS_PER_LAP, 44)
assert.equal(campaignPlay(45).lap, 1)
assert.equal(MIDNIGHT_STEPS.length, 6)
assert.ok(MIDNIGHT_GARDEN.layout.every((row) => row.length === 30))
assert.equal(MIDNIGHT_GARDEN.layout.length, 36)
const locked = make({ ...legacy, trowels: all.slice(0, 7) })
assert.ok(!locked.menu!.items.some((item) => item.garden === MIDNIGHT_INDEX))
const g = make(legacy)
g.menu!.cursor = g.menu!.items.findIndex((item) => item.garden === MIDNIGHT_INDEX)
press(g)
assert.equal(g.garden.id, MIDNIGHT_GARDEN.id)
assert.equal(g.save?.run?.garden, MIDNIGHT_INDEX)
assert.equal(readGardenSave(g.save)?.run?.garden, MIDNIGHT_INDEX)
assert.equal(readGardenSave({ ...g.save, trowels: [] })?.run, null)
g.beginStep(gardenStart(MIDNIGHT_INDEX) + 5, 0, 50)
assert.equal(g.boss?.id, 'root-kernel')
for (let phase = 1; phase <= 3; phase++) {
  assert.equal(g.boss?.phase, phase)
  const root = g.rootPosition()
  const weak = g.newBeam(root.x, root.y, false)
  assert.ok(g.hitRootKernel(weak))
  assert.equal(g.boss?.phase, phase, 'unpowered spray cannot damage the core')
  assert.ok(!g.boss?.defeated)
  if (phase === 2) {
    g.crowTimer = 0
    g.updateCrow()
    assert.equal(g.crow, null, 'a crow cannot steal required core prisms')
  }
  // Isolate the core from the moving enemies, then fly a real beam from
  // the flowerbed through the authored firing lane, not a synthetic hit.
  g.worms = []
  g.pumpkins = []
  g.snowballs = []
  g.leafPiles = []
  g.inchworms = []
  const full = g.newBeam(root.x, 288, false)
  for (let i = 0; i < 60; i++) {
    if (!g.stepBeam(full)) break
  }
  assert.deepEqual(full.powers, PRISM_ORDER)
  assert.ok(
    g.boss?.phase === phase + 1 || g.boss?.defeated,
    'a real four-colour beam advances the core',
  )
}
assert.ok(g.boss?.defeated)
g.advance()
assert.equal(g.credits, 'true')
assert.equal(g.save?.trueChampion, true)
assert.equal(g.save?.run, null)
press(g)
assert.ok(g.menu?.items.some((item) => item.overgrown))
g.menu!.cursor = g.menu!.items.findIndex((item) => item.overgrown)
press(g)
assert.equal(g.lap, 1)
assert.equal(g.level, 45)
const normal = make({ ...legacy, trowels: [] })
normal.beginStep(CAMPAIGN.length - 1, 0, 44)
normal.advance()
assert.equal(normal.credits, 'season')
assert.equal(normal.save?.champion, true)
assert.equal(normal.save?.trueChampion, undefined)
console.log('glitch garden midnight, prism core and endings: ok')
