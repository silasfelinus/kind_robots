import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { finaleCredits } from '../arcade/games/rainbowEclipseFinale'
import {
  emptyRainbowHangar,
  rainbowHangarLivery,
  readRainbowHangar,
  withRainbowCallSign,
  withRainbowPaint,
} from '../arcade/games/rainbowHangar'
import {
  normalizeRainbowCallSign,
  RAINBOW_PAINTS,
  rainbowPaintUnlocked,
  rainbowShipFilter,
} from '../arcade/games/rainbowLivery'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-044 (main-game standard: customizable characters): a call sign on comms and in the credits,
// and three paint schemes per ship, the later two unlocked by medals. Kept in the slot's Hangar; drawing only.

// Call signs: capitals, digits, single spaces and hyphens, 2-10 characters; refused words give none.
assert.equal(normalizeRainbowCallSign('starlight'), 'STARLIGHT')
assert.equal(normalizeRainbowCallSign('  ace   one '), 'ACE ONE')
assert.equal(normalizeRainbowCallSign('nova--7!!'), 'NOVA-7')
assert.equal(normalizeRainbowCallSign('<script>'), 'SCRIPT')
assert.equal(normalizeRainbowCallSign('ABCDEFGHIJKLMN'), 'ABCDEFGHIJ')
assert.equal(normalizeRainbowCallSign('x'), '')
assert.equal(normalizeRainbowCallSign('- -'), '')
assert.equal(normalizeRainbowCallSign('wtf leader'), '')
assert.equal(normalizeRainbowCallSign(null), '')

// Paint: Factory always; Tide at three silver-or-better medals; Nova at three golds.
assert.deepEqual(
  RAINBOW_PAINTS.map((paint) => paint.id),
  ['factory', 'tide', 'nova'],
)
assert.equal(rainbowPaintUnlocked({}, 0), true)
assert.equal(rainbowPaintUnlocked({ 1: 'silver', 2: 'gold' }, 1), false)
assert.equal(
  rainbowPaintUnlocked({ 1: 'silver', 2: 'gold', 3: 'silver' }, 1),
  true,
)
assert.equal(
  rainbowPaintUnlocked({ 1: 'silver', 2: 'gold', 3: 'silver' }, 2),
  false,
)
assert.equal(rainbowPaintUnlocked({ 1: 'gold', 2: 'gold', 3: 'gold' }, 2), true)
assert.equal(
  rainbowPaintUnlocked({ 1: 'gold', 2: 'gold', 3: 'gold' }, 7),
  false,
)

// The Hangar keeps both per slot, refuses locked paint, and drops paint whose medals are gone.
const fresh = emptyRainbowHangar()
assert.deepEqual(rainbowHangarLivery(fresh), {
  callSign: '',
  paints: [0, 0, 0, 0],
})
assert.equal(withRainbowPaint(fresh, 0, 1), fresh, 'locked paint is refused')
const golden = {
  ...fresh,
  medals: { 1: 'gold', 2: 'gold', 3: 'gold' } as const,
}
let hangar = withRainbowPaint(golden, 2, 2)
hangar = withRainbowPaint(hangar, 0, 1)
hangar = withRainbowCallSign(hangar, 'starlight')
assert.deepEqual(rainbowHangarLivery(hangar), {
  callSign: 'STARLIGHT',
  paints: [1, 0, 2, 0],
})
assert.equal(withRainbowPaint(hangar, 4, 1), hangar, 'no fifth pilot')
assert.deepEqual(
  readRainbowHangar(JSON.parse(JSON.stringify(hangar))),
  hangar,
  'the livery survives the trip through saved preferences',
)
assert.equal(
  withRainbowCallSign(hangar, '').callSign,
  undefined,
  'an empty call sign clears it',
)
assert.deepEqual(
  readRainbowHangar({ ...hangar, medals: { 1: 'silver' } }).paints,
  undefined,
  'paint without its medals falls back to factory',
)
assert.equal(
  readRainbowHangar({ ...hangar, callSign: 'wtf' }).callSign,
  undefined,
)
assert.equal(
  rainbowShipFilter(rainbowHangarLivery(hangar), 2),
  RAINBOW_PAINTS[2]!.filter,
)
assert.equal(rainbowShipFilter(undefined, 2), 'none')

// Credits: the call sign and the pilots actually flown.
const flags = {
  rescuedNemi: false,
  securedSalvage: false,
  rescuedCourier: false,
  freedDepot: false,
  stoppedRelay: false,
  rescuedNavigator: false,
  captivesFreed: 0,
}
const credits = finaleCredits(flags, 2, 'restore', null, {
  pilots: [3, 1],
  callSign: 'STARLIGHT',
})
const crew = credits.slice(credits.indexOf('THE CREW') + 1)
assert.deepEqual(crew.slice(0, 3), ['Call sign STARLIGHT', 'VIVI', 'AZURE'])
assert.ok(
  !finaleCredits(flags, 1, 'sever').some((l) => l.startsWith('Call sign')),
)

function seeded(seed = 5) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const livery = { callSign: 'STARLIGHT', paints: [2, 0, 0, 0] }
const options = (extra: object = {}) => ({
  players: 1,
  demo: true,
  rng: seeded(),
  sound: { play() {} },
  hiScore: 0,
  ...extra,
})

// Drawing only: the same seed flies identically with and without a livery.
{
  const plain = createRainbowPrincessPreview(options())
  const painted = createRainbowPrincessPreview(
    options({ rainbowLivery: livery }),
  )
  for (let frame = 0; frame < 4000; frame++) {
    plain.update(emptyInput())
    painted.update(emptyInput())
    if (frame % 500 === 0)
      assert.deepEqual(painted.snapshot, plain.snapshot, `desync at ${frame}`)
  }
}

// Drawn: the ship's paint filter wraps its painting, and the lead pilot's comms carry the call sign.
type Call = { op: string; args: unknown[] }
function recorder() {
  const calls: Call[] = []
  const filters: unknown[] = []
  const state: Record<string | symbol, unknown> = {
    canvas: { width: 480, height: 270 },
  }
  const g = new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key]
      if (key === 'measureText')
        return (text: string) => ({ width: text.length * 6 })
      if (key === 'createLinearGradient' || key === 'createRadialGradient')
        return () => ({ addColorStop() {} })
      if (key === 'getLineDash') return () => []
      return (...args: unknown[]) => {
        calls.push({ op: String(key), args })
      }
    },
    set(target, key, value) {
      if (key === 'filter') filters.push(value)
      target[key] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { g, calls, filters }
}
const game = createRainbowPrincessPreview(options({ rainbowLivery: livery }))
let paintedFrames = 0
let callSignFrames = 0
for (
  let frame = 0;
  frame < 30000 && (paintedFrames === 0 || callSignFrames === 0);
  frame++
) {
  game.update(emptyInput())
  if (frame % 10) continue
  const { g, calls, filters } = recorder()
  game.render(g)
  if (filters.includes(RAINBOW_PAINTS[2]!.filter)) {
    paintedFrames++
    assert.equal(filters.at(-1), 'none', 'the filter is cleared after the ship')
  }
  const headers = calls
    .filter((c) => c.op === 'fillText' && typeof c.args[0] === 'string')
    .map((c) => c.args[0] as string)
    .filter((text) => text.includes(' · STARLIGHT'))
  for (const header of headers) {
    callSignFrames++
    assert.match(header, /^MARIBEL\b/, 'only the lead pilot answers to it')
    assert.doesNotMatch(header, /\//, 'the header names no scene id (S17)')
  }
}
assert.ok(paintedFrames > 0, 'the lead ship flew in Nova paint')
assert.ok(
  callSignFrames > 0,
  'the lead pilot answered to the call sign on comms',
)

// Wired: the cabinet hands the slot's livery to a flight (not to a replay), and the Hangar edits it.
const root = new URL('../../', import.meta.url)
const cabinet = readFileSync(
  new URL('components/arcade/arcade-cabinet.vue', root),
  'utf8',
)
const page = readFileSync(
  new URL('pages/play/rainbow-bullet-hell-space-princess.vue', root),
  'utf8',
)
assert.match(cabinet, /!isRainbowReplay\.value\s+\? store\.rainbowLivery\(\)/)
assert.match(page, /aria-label="Ship paint"/)
assert.match(page, /arcadeStore\.setRainbowCallSign\(typed\)/)
assert.match(page, /arcadeStore\.paintRainbowShip\(pilot, scheme\)/)
console.log(
  `rainbow livery: ok (painted frames ${paintedFrames}, call-sign comms frames ${callSignFrames})`,
)
