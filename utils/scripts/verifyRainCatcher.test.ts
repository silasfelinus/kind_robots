import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create } from '../arcade/games/rainCatcher'
import { emptyInput } from '../arcade/types'
import { rainWaveForLevel, weatherForVolley } from '../arcade/rainCatcher/waves'
import type { RainWeather } from '../arcade/rainCatcher/waves'

type Falling = {
  x: number
  y: number
  vx: number
  vy: number
  hits: number
  hitCooldown: number
  kind: RainWeather
}
type Bloom = { x: number; y: number; t: number; petal?: boolean }
type TestGame = {
  beds: number[]
  ammo: number[]
  soaked: boolean[]
  shots: Array<{ x: number; y: number }>
  ready: number
  sightX: number
  sightY: number
  barrels: number[]
  chain: number
  hail: Falling[]
  blooms: Bloom[]
  readonly lives: number
  readonly level: number
  readonly score: number
  readonly over: boolean
  makeHail(x: number, y: number, sprite?: boolean, kind?: RainWeather): Falling
  land(hail: Falling): void
  catchHail(hail: Falling, bloom: Bloom): void
  updateBlooms(): void
  updateHail(): void
  release(): void
  demoInput(): ReturnType<typeof emptyInput>
  volleyTimer: number
  toRelease: number
  startWave(wave: number): void
  update(input: ReturnType<typeof emptyInput>): void
}

function gameFor(seed: number, demo = false): TestGame {
  return create({
    rng: mulberry32(seed),
    sound: { play: () => undefined },
    demo,
    hiScore: 0,
  }) as unknown as TestGame
}

{
  const game = gameFor(11)
  const initial = game.lives
  const rain = game.makeHail(54, 16, false, 'rain')
  rain.x = 54
  game.land(rain)
  assert.equal(game.beds[0], 3, 'rain grows a bed')
  for (let i = 0; i < 9; i++) {
    const next = game.makeHail(54, 16, false, 'rain')
    next.x = 54
    game.land(next)
  }
  assert.equal(game.beds[0], 5, 'fruit stage is capped at five')
  game.startWave(2)
  assert.equal(game.beds[0], 5, 'growth persists between waves')
  assert.ok(game.ammo[0]! > 10, 'fruit replenishes nearby umbrellas')
  for (let i = 0; i < 5; i++) {
    const hail = game.makeHail(54, 16)
    hail.x = 54
    game.land(hail)
  }
  assert.equal(game.beds[0], 0, 'hail knocks growth down one stage')
  assert.equal(game.lives, initial - 1)
}

{
  const game = gameFor(12)
  game.ammo[0] = 1
  for (let i = 0; i < 3; i++) {
    const rain = game.makeHail(138, 170, false, 'rain')
    rain.x = 138
    rain.y = 170
    game.catchHail(rain, { x: 138, y: 170, t: 18 })
  }
  assert.equal(game.barrels[0], 0, 'barrel empties at capacity')
  assert.equal(game.ammo[0], 6, 'full barrel refills launcher')
}

{
  const game = gameFor(13)
  const first = game.makeHail(120, 100)
  const second = game.makeHail(131, 100)
  first.x = 120
  first.y = 100
  second.x = 131
  second.y = 100
  game.hail.push(first, second)
  game.blooms.push({ x: 110, y: 100, t: 18 })
  for (let tick = 0; tick < 23; tick++) game.updateBlooms()
  assert.ok(game.chain >= 2, 'petal bloom catches neighbouring hail')
  assert.ok(game.score >= 75, 'petal cascade earns chain score')
}

{
  const game = gameFor(14)
  const snowball = game.makeHail(120, 80, false, 'snowball')
  game.catchHail(snowball, { x: 120, y: 80, t: 18 })
  assert.equal(snowball.hits, 1)
  assert.notEqual(snowball.vy, 0, 'one bloom does not destroy a snowball')
  snowball.hitCooldown = 0
  const secondBloom = { x: 125, y: 80, t: 18 }
  game.catchHail(snowball, secondBloom)
  assert.equal(snowball.vy, 0, 'a second bloom destroys the snowball')
}

{
  const game = gameFor(16)
  game.startWave(2)
  const sleet = game.makeHail(54, 210, false, 'sleet')
  sleet.x = 54
  sleet.y = 210
  game.hail.push(sleet)
  game.updateHail()
  assert.ok(sleet.vy === 0 && sleet.vx !== 0, 'sleet skids on landing')
  for (let tick = 0; tick < 25; tick++) game.updateHail()
  assert.ok(
    game.beds.some((stage) => stage < 2),
    'skidding sleet hits a bed',
  )
}

{
  const game = gameFor(17)
  game.startWave(3)
  const forecast = rainWaveForLevel(3)
  const index = Array.from({ length: forecast.hailCount }, (_, i) => i).find(
    (i) => weatherForVolley(forecast, i) === 'moth',
  )
  assert.notEqual(index, undefined, 'wave three includes a moth cluster')
  game.toRelease = forecast.hailCount - index!
  game.volleyTimer = 1
  game.release()
  assert.ok(
    game.hail.filter((hail) => hail.kind === 'moth').length >= 8,
    'one moth volley creates a clustered flock',
  )
}

{
  const game = gameFor(18)
  game.ready = 0
  game.sightX = 160
  game.sightY = 100
  const shot = emptyInput()
  shot.pressed.a = true
  const before = game.ammo[1]!
  game.update(shot)
  assert.equal(game.ammo[1], before - 1, 'A uses the middle launcher')
  assert.equal(game.shots.length, 1, 'player input fires an umbrella')
  for (let tick = 0; tick < 22; tick++) game.update(emptyInput())
  assert.ok(game.blooms.length > 0, 'umbrella arrives and blooms')
}

function pilot(seed: number) {
  const game = gameFor(seed, true)
  for (let tick = 0; tick < 1000 && !game.over; tick++) {
    game.update(emptyInput())
  }
  return {
    wave: game.level,
    beds: game.beds.slice(),
    barrels: game.barrels.slice(),
    falling: game.hail.length,
    over: game.over,
    score: game.score,
  }
}
assert.deepEqual(pilot(15), pilot(15), 'seeded rain pilot is repeatable')
assert.equal(pilot(15).score, 0, 'attract mode cannot post a score')
for (const seed of [5, 15, 42]) {
  const game = gameFor(seed)
  let shots = 0
  for (let tick = 0; tick < 18_000 && game.level < 6 && !game.over; tick++) {
    const input = game.demoInput()
    if (input.pressed.a) shots++
    game.update(input)
  }
  assert.equal(
    game.level,
    6,
    `seed ${seed}: clear all five Orchard Hills waves`,
  )
  assert.ok(shots > 0 && game.score > 0, `seed ${seed}: active scoring run`)
}

console.log(
  'Rain Catcher: bed growth, barrels, petal chains, snowballs and pilot',
)
