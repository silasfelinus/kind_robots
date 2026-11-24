import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create } from '../arcade/games/petalPost'
import {
  PRIMROSE_DAYS,
  primroseDay,
  valleyGazette,
} from '../arcade/games/petalPostPrimrose'
import type { InputFrame } from '../arcade/types'

type House = {
  side: 'left' | 'right'
  y: number
  subscriber: boolean
  delivered: boolean
  bloom: number
  gifts: number
  request: 'mailbox' | 'porch' | null
  color: string
}
type Hazard = {
  kind: string
  x: number
  y: number
  gone: boolean
}
type Probe = {
  score: number
  level: number
  lives: number
  over: boolean
  bx: number
  by: number
  speed: number
  carry: number
  packets: Array<{
    x: number
    y: number
    vx: number
    side: 'left' | 'right'
  }>
  houses: House[]
  hazards: Hazard[]
  weather: string
  gazette: null | {
    headline: string
    subscribers: number
    delivered: number
    cancellations: number
    requestsMet: number
    signups: number
    homes: Array<{ bloom: number; subscriber: boolean }>
  }
  requestsMet: number
  tips: number
  dayEnd: number
  startDay(day: number): void
  update(input: InputFrame): void
  endDay(): void
  deliver(
    house: House,
    points: number,
    label: string,
    packet: { x: number; y: number; vy: number; t: number },
    location: 'mailbox' | 'porch',
  ): void
}

const empty = {
  up: false,
  down: false,
  left: false,
  right: false,
  a: false,
  b: false,
  start: false,
}
const idle = (): InputFrame => ({
  held: { ...empty },
  pressed: { ...empty },
})
const press = (button: keyof typeof empty): InputFrame => ({
  held: { ...empty, [button]: true },
  pressed: { ...empty, [button]: true },
})
const make = (seed: number, demo = false): Probe =>
  create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
  }) as unknown as Probe

assert.equal(PRIMROSE_DAYS.length, 6, 'Monday through Saturday are authored')
assert.deepEqual(
  PRIMROSE_DAYS.map((d) => d.weekday),
  ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
)
assert.equal(primroseDay(7), null, 'Sunday remains the next roadmap slice')
for (const [index, day] of PRIMROSE_DAYS.entries()) {
  assert.ok(day.encounters.length >= 3)
  for (const encounter of day.encounters) {
    assert.ok(encounter.gap >= 0 && encounter.gap < 12)
  }
  const game = make(11)
  game.startDay(index + 1)
  assert.equal(game.level, index + 1)
  assert.equal(game.weather, day.weather)
  assert.equal(game.houses.filter((h) => h.side === 'left').length, 6)
  assert.equal(game.houses.filter((h) => h.side === 'right').length, 6)
  for (const encounter of day.encounters) {
    assert.ok(
      game.hazards.some(
        (h) =>
          h.kind === encounter.kind &&
          h.y === -220 - (encounter.gap + 0.5) * 110,
      ),
      `day ${index + 1} places its authored ${encounter.kind}`,
    )
  }
  const again = make(11)
  again.startDay(index + 1)
  assert.deepEqual(
    game.hazards,
    again.hazards,
    `day ${index + 1} is seeded and deterministic`,
  )
}
assert.ok(!PRIMROSE_DAYS[1]!.encounters.some((e) => e.kind === 'puppy'))
assert.ok(PRIMROSE_DAYS[2]!.encounters.some((e) => e.kind === 'puppy'))
assert.ok(PRIMROSE_DAYS[3]!.encounters.some((e) => e.kind === 'kite'))
assert.ok(PRIMROSE_DAYS[4]!.encounters.some((e) => e.kind === 'puddle'))

{
  const game = make(12)
  game.startDay(3)
  const house = game.houses.find((h) => h.request !== null)
  assert.ok(house, 'the request signs are available on Wednesday')
  house.subscriber = true
  house.delivered = false
  house.bloom = 1
  const request = house.request!
  game.deliver(
    house,
    100,
    'DOORSTEP',
    { x: 64, y: house.y, vy: -1, t: 0 },
    request,
  )
  assert.equal(house.bloom, 3, 'meeting a request adds two bloom stages')
  assert.equal(game.requestsMet, 1)
  assert.equal(game.tips, 75, 'a full bloom pays a flower tip')
  assert.equal(game.score, 325, '100 delivery + 150 request + 75 tip')
}

{
  const game = make(13)
  game.startDay(5)
  for (const house of game.houses) {
    house.subscriber = true
    house.delivered = true
    house.bloom = 2
  }
  game.houses[0]!.delivered = false
  game.houses[0]!.bloom = 1
  game.endDay()
  assert.equal(game.gazette?.cancellations, 1)
  assert.equal(game.gazette?.subscribers, 11)
  assert.equal(game.gazette?.homes[0]?.bloom, 0)
  assert.equal(game.dayEnd, 170, 'the Gazette holds on screen')
  const copy = game.gazette!
  game.update(press('a'))
  assert.equal(game.level, 6, 'A advances to the next authored weekday')
  assert.equal(game.gazette, null)
  assert.equal(copy.homes[0]!.bloom, 0, 'the newspaper is a snapshot')
}

{
  const game = make(14)
  game.startDay(5)
  const puddle = game.hazards.find((h) => h.kind === 'puddle')!
  game.by = puddle.y + 1
  game.bx = puddle.x
  const lives = game.lives
  game.update(idle())
  assert.equal(game.lives, lives, 'a puddle slides but does not injure')
  assert.equal(puddle.gone, true)
  assert.ok(game.bx > puddle.x)
}

{
  const game = make(15)
  game.startDay(3)
  const puppy = game.hazards.find((h) => h.kind === 'puppy')!
  game.by = puppy.y + 25
  game.bx = 130
  const x = puppy.x
  game.update(idle())
  assert.ok(puppy.x > x, 'puppy chases toward the nearby player')
}

{
  const homes = [
    { subscriber: true, delivered: true, bloom: 3 },
    { subscriber: false, delivered: false, bloom: 0 },
  ]
  const paper = valleyGazette(2, homes, 2, 0, 1, 75)
  assert.equal(paper.weekday, 'TUE')
  assert.equal(paper.headline, 'NEW NEIGHBOURS JOIN!')
  assert.equal(paper.requestsMet, 2)
  homes[0]!.bloom = 0
  assert.equal(paper.homes[0]!.bloom, 3, 'reports copy persistent state')
}

for (const seed of [3, 7]) {
  const game = make(seed, true)
  for (let tick = 0; tick < 60 * 60 * 3 && !game.over; tick++)
    game.update(idle())
  assert.equal(game.score, 0, 'attract pilots never score')
  assert.ok(game.level >= 1)
}

// Drive the actual cabinet through its A/B input path, not private delivery hooks.
for (const side of ['left', 'right'] as const) {
  const game = make(30)
  game.hazards = []
  const house = game.houses.find((h) => h.side === side)!
  const other = game.houses.find((h) => h.side !== side)!
  house.subscriber = true
  house.request = 'mailbox'
  house.delivered = false
  house.bloom = 1
  other.subscriber = true
  other.delivered = false
  game.bx = 128
  game.speed = 1.3
  const mailbox = side === 'left' ? 74 : 182
  const direction = side === 'left' ? -1 : 1
  const travel =
    (mailbox - game.bx - direction * 6) /
    (direction * (1.2 + game.speed * 0.65))
  game.by = house.y + 22 + 4 + game.speed * (travel + 1)
  const carry = game.carry
  game.update(press(side === 'left' ? 'a' : 'b'))
  assert.equal(game.carry, carry - 1)
  assert.equal(game.packets[0]?.side, side)
  assert.equal(Math.sign(game.packets[0]!.vx), direction)
  for (let i = 0; i < 40; i++) game.update(idle())
  assert.equal(house.delivered, true, `${side} mailbox is reachable`)
  assert.equal(house.bloom, 3)
  assert.equal(
    other.delivered,
    false,
    'a parcel cannot deliver across the road',
  )
  assert.equal(game.requestsMet, 1)
  assert.equal(game.score, 475, 'mailbox, request and full-bloom tip')
  assert.equal(game.packets.length, 0)
}

{
  const game = make(31)
  game.hazards = []
  game.speed = 0.7
  game.update(press('a'))
  const slow = Math.abs(game.packets[0]!.vx)
  game.speed = 2.2
  game.update(press('b'))
  const fast = Math.abs(game.packets[1]!.vx)
  assert.ok(fast > slow, 'faster riding increases horizontal toss distance')
}

{
  const game = make(32)
  game.hazards = []
  const house = game.houses.find((h) => h.side === 'left')!
  house.subscriber = true
  house.delivered = false
  house.request = 'porch'
  house.bloom = 1
  game.bx = 121
  game.speed = 0.7
  game.by = house.y + 4 + 0.7 * 41
  const slow = press('down')
  game.update({
    held: { ...slow.held, a: true },
    pressed: { ...slow.pressed, a: true },
  })
  for (let i = 0; i < 40; i++) game.update(slow)
  assert.equal(house.delivered, true, 'a slow toss reaches the left porch')
  assert.equal(game.requestsMet, 1)
  assert.equal(game.score, 325)
}

{
  const game = make(33)
  for (const house of game.houses) {
    house.subscriber = true
    house.delivered = true
    house.bloom = 3
  }
  game.houses[0]!.delivered = false
  game.endDay()
  assert.equal(game.houses[0]!.bloom, 2)
  assert.equal(game.gazette?.cancellations, 0)
  assert.equal(game.score, 0, 'no cancellations is not a perfect round')
}

console.log(
  'Petal Post Primrose Lane authored week, Gazette and two-sided deliveries passed',
)
