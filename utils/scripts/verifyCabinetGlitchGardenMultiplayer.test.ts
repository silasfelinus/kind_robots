import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create } from '../arcade/games/glitchGarden'
import { CROSSFIRE_POINTS, CROSSFIRE_TICKS, RIVALS_TICKS } from '../arcade/games/glitchGardenModes'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

type Worm = {
  trail: Array<{ x: number; y: number }>
  segments: number
  dx: 1 | -1
  dy: 1 | -1
  crossfire?: { player: 0 | 1; tick: number }
}
type Beam = { x: number; y: number; player?: 0 | 1; powers: string[]; child: boolean }
type Probe = {
  px: number
  py: number
  p2: { x: number; y: number }
  grid: unknown[]
  beams: Beam[]
  worms: Worm[]
  flowers: Array<{ col: number; row: number; prism: string }>
  menu: { items: Array<{ mode?: string }>; cursor: number } | null
  mode: string
  score: number
  scoreBoard: string | null
  save: unknown
  lives: number
  tick: number
  crossfires: number
  rivalsFixed: [number, number]
  rivalsTicks: number
  rivalsShield: [number, number]
  over: boolean
  banner: { text: string }
  update(input: InputFrame, players?: InputFrame[]): void
  hitWorm(x: number, y: number, freeze?: boolean, player?: 0 | 1): string | null
  creditWorm(w: Worm, player: 0 | 1, x: number, y: number): void
  pickUpPower(beam: Beam, col: number, row: number): void
  checkHits(player?: 0 | 1): void
  newBeam(x: number, y: number, child: boolean, player?: 0 | 1): Beam
  moveSprayer(frame: InputFrame, player?: 0 | 1): void
  withSecondSprayer(action: () => void): void
  advance(): void
}
const make = (players: number) => create({
  rng: mulberry32(91), sound: { play: () => {} }, demo: false,
  hiScore: 0, players, selectScreen: true,
}) as unknown as Probe
function choose(g: Probe, mode?: string) {
  g.menu!.cursor = g.menu!.items.findIndex((item) => item.mode === mode)
  assert.ok(g.menu!.cursor >= 0)
  const f = emptyInput()
  f.pressed.a = true
  g.update(f)
}
const solo = make(1)
assert.ok(!solo.menu!.items.some((i) => i.mode === 'rivals'))
const coop = make(2)
assert.ok(!coop.menu!.items.some((i) => i.mode === 'daily'))
choose(coop)
coop.grid.fill(null)
const left = emptyInput()
left.held.left = true
left.held.a = true
const right = emptyInput()
right.held.right = true
right.held.a = true
const before = [coop.px, coop.p2.x]
coop.update(left, [left, right])
assert.ok(coop.px < before[0]!)
assert.ok(coop.p2.x > before[1]!)
assert.deepEqual(coop.beams.map((beam) => beam.player), [0, 1])
const flower = { col: 5, row: 20, prism: 'pink' }
coop.flowers = [flower]
for (const player of [0, 1] as const) {
  const beam = coop.newBeam(44, 180, false, player)
  coop.pickUpPower(beam, 5, 20)
  assert.deepEqual(beam.powers, ['pink'])
  assert.ok(coop.beams.some((b) => b.child && b.player === player))
}
const worm: Worm = {
  segments: 3, dx: 1, dy: 1,
  trail: Array.from({ length: 25 }, (_, i) => ({ x: 80 - i, y: 80 })),
}
coop.worms = [worm]
coop.tick = 100
assert.equal(coop.hitWorm(68, 83, false, 0), 'fix')
const fragment = coop.worms.find((w) => w.crossfire?.player === 0)!
assert.ok(fragment, 'split inherits the original hit')
coop.tick += CROSSFIRE_TICKS
const prior = coop.score
coop.creditWorm(fragment, 1, 80, 80)
assert.equal(coop.score, prior + CROSSFIRE_POINTS)
assert.equal(coop.crossfires, 1)
coop.tick += CROSSFIRE_TICKS + 1
coop.creditWorm(fragment, 0, 80, 80)
assert.equal(coop.crossfires, 1)
coop.worms = [{ segments: 1, dx: 1, dy: 1, trail: [{ x: coop.p2.x - 4, y: coop.p2.y - 4 }] }]
const lives = coop.lives
coop.checkHits(1)
assert.equal(coop.lives, lives - 1)
const rival = make(2)
const save = JSON.stringify(rival.save)
choose(rival, 'rivals')
assert.equal(rival.scoreBoard, null)
assert.equal(rival.rivalsTicks, RIVALS_TICKS)
rival.grid.fill(null)
rival.px = 116
rival.p2.x = 124
for (let i = 0; i < 20; i++) {
  rival.moveSprayer(right)
  rival.withSecondSprayer(() => rival.moveSprayer(left, 1))
}
assert.equal(rival.px, 116)
assert.equal(rival.p2.x, 124)
rival.worms = [worm]
rival.creditWorm(worm, 1, 80, 80)
assert.deepEqual(rival.rivalsFixed, [0, 1])
assert.equal(rival.score, 0)
rival.worms = [{ segments: 1, dx: 1, dy: 1, trail: [{ x: rival.p2.x - 4, y: rival.p2.y - 4 }] }]
const rivalLives = rival.lives
rival.checkHits(1)
assert.equal(rival.lives, rivalLives)
assert.ok(rival.rivalsShield[1] > 0)
rival.rivalsTicks = 1
rival.update(emptyInput(), [emptyInput(), emptyInput()])
assert.equal(rival.over, true)
assert.equal(rival.banner.text, 'PLAYER 2 WINS!')
assert.equal(JSON.stringify(rival.save), save)
console.log('glitch garden two sprayers, crossfire and rivals: ok')
