import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import gloomInvaders, {
  COURIER_DURATION,
  COURIER_POWERS,
  type CourierPower,
  type GloomMode,
} from '../arcade/games/gloomInvaders'
import { newDrop } from '../arcade/gloomInvaders/weather'
import { emptyInput } from '../arcade/types'

type Cloud = {
  alive: boolean
  x: number
  y: number
  h: number
}
type Plane = { x: number; dir: 1 | -1; power: CourierPower }
type Beam = {
  x: number
  y: number
  half: number
  pierce: boolean
  helper: boolean
}
type Probe = {
  mode: GloomMode
  level: number
  px: number
  tick: number
  clouds: Cloud[]
  drops: ReturnType<typeof newDrop>[]
  beam: Beam | null
  extraBeam: Beam | null
  helperBeams: Beam[]
  plane: Plane | null
  planeTimer: number
  dropTimer: number
  prismShots: number
  doubleTicks: number
  sunglassesTicks: number
  umbrellas: Array<{ cells: boolean[] }>
  chooseMode(mode: GloomMode): void
  startWave(wave: number): void
  collectCourier(power: CourierPower): void
  update(input: ReturnType<typeof emptyInput>): void
  render(g: CanvasRenderingContext2D): void
}

const open = () =>
  gloomInvaders.create({
    rng: mulberry32(17),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
  }) as unknown as Probe

const step = (game: Probe, pressed = false) => {
  const input = emptyInput()
  input.pressed.a = pressed
  game.update(input)
}

assert.deepEqual(COURIER_POWERS, [
  'prism',
  'double',
  'umbrella-patch',
  'sunglasses',
  'solar-flare',
])

{
  const game = open()
  assert.equal(
    game.mode,
    'weather',
    'the original cabinet mode stays untouched',
  )
  game.chooseMode('calendar')
  game.startWave(8)
  for (let i = 0; i < 6; i++) step(game)
  assert.ok(game.plane, 'May Kite Festival calls a paper-plane courier')
  game.plane = { x: game.px, dir: 1, power: 'prism' }
  game.planeTimer = 1000
  game.beam = {
    x: game.px,
    y: 50,
    half: 0,
    pierce: false,
    helper: false,
  }
  step(game)
  assert.equal(game.plane, null, 'a real traveling beam catches the courier')
  assert.equal(
    game.prismShots,
    3,
    'the caught courier grants three prism shots',
  )
  assert.equal(game.beam, null, 'the ordinary beam is spent on the courier')
  step(game, true)
  assert.equal(game.prismShots, 2, 'firing consumes one prism charge')
  assert.equal(game.helperBeams.length, 2, 'one shot adds two side beams')
}

{
  const game = open()
  game.chooseMode('calendar')
  game.collectCourier('double')
  assert.equal(game.doubleTicks, COURIER_DURATION)
  step(game, true)
  assert.ok(game.beam)
  step(game, true)
  assert.ok(game.extraBeam, 'a second live shot can fly alongside the first')
}

{
  const game = open()
  game.chooseMode('calendar')
  game.umbrellas[0]!.cells.fill(false)
  assert.ok(game.umbrellas[0]!.cells.every((cell) => !cell))
  game.collectCourier('umbrella-patch')
  assert.ok(
    game.umbrellas[0]!.cells.some(Boolean),
    'the patch restores actual shelter cells',
  )
}

{
  const game = open()
  game.chooseMode('calendar')
  game.collectCourier('sunglasses')
  game.dropTimer = 9999
  const drop = newDrop('straight', 144, 100, 2)
  game.drops = [drop]
  const y = drop.y
  step(game)
  step(game)
  assert.equal(drop.y - y, 2, 'sunglasses move drops at half speed')
  assert.equal(game.sunglassesTicks, COURIER_DURATION - 2)
}

{
  const game = open()
  game.chooseMode('calendar')
  const lowest = Math.max(...game.clouds.map((c) => c.y + c.h))
  const bottom = game.clouds.filter((c) => c.y + c.h >= lowest - 4)
  assert.ok(bottom.length > 0)
  game.collectCourier('solar-flare')
  assert.ok(
    bottom.every((c) => !c.alive),
    'solar flare cheers the lowest row',
  )
  assert.ok(
    game.clouds.some((c) => c.alive),
    'upper clouds remain for continued play',
  )
}

console.log('Gloom Invaders paper-plane courier: 5 powers and beam capture OK')
