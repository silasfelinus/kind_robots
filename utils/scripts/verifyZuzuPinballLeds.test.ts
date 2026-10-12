// The Last Bell's LED rail (conductor zuzu-pinball/t-012): a strip of 96
// LEDs round the inside of the cabinet, coloured every frame from the rules
// state. The shows are pure functions, so this proves them without WebGL:
// each mode holds the strip in its colour, the LEDs beside the River Croc
// tell his cycle, a tilt or game over darkens it, nothing flashes faster
// than three times a second, and reduced motion holds every colour still.
// Then the runtime shows exactly the rules' frame on the scene's rail.
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { mulberry32 } from '../arcade/curve'
import { PHYSICS_HZ } from '../arcade/pinball/clock'
import { emptyInput } from '../arcade/types'
import type { RulesEvent } from '../arcade/pinball/rules/engine'
import {
  attractLeds,
  brightness,
  flash,
  MAX_FLASH_HZ,
  type LedFrame,
} from '../arcade/pinball/rules/leds'
import type { PinballScene, RendererLike } from '../arcade/pinball/render/scene'
import { PinballRuntime } from '../arcade/pinball/runtime'
import { CHAPTERS } from '../arcade/pinball/tables/zuzuLastBell/chapters'
import {
  CHAPTER_LED,
  CROC_LED_AT,
  CROC_LED_SPAN,
  LED_COLORS,
  ledShow,
  zuzuLeds,
} from '../arcade/pinball/tables/zuzuLastBell/leds'
import {
  ZUZU_RULESET as rules,
  type ZuzuRulesState,
} from '../arcade/pinball/tables/zuzuLastBell/rules'
import {
  CROC_XZ,
  ZUZU_LED_RAIL,
  ZUZU_LAST_BELL_GREYBOX as table,
} from '../arcade/pinball/tables/zuzuLastBell/table'
import type { CrocPhase } from '../arcade/pinball/tables/zuzuLastBell/croc'
import type { MultiballKind } from '../arcade/pinball/tables/zuzuLastBell/multiball'

await RAPIER.init()

const N = ZUZU_LED_RAIL.count
assert.equal(table.ledRail, ZUZU_LED_RAIL, 'the table carries its LED rail')
assert.equal(rules.leds, zuzuLeds, 'and its ruleset colours it')
assert.ok(N >= 48, 'enough LEDs to chase')
// The rail stays inside the cabinet, round the playfield's edge.
for (const [x, z] of ZUZU_LED_RAIL.points) {
  assert.ok(x > -0.26 && x < 0.3, `rail x ${x} inside the walls`)
  assert.ok(z < 0 && z > -1, `rail z ${z} on the playfield`)
}
// The Croc's LEDs are on the left wall beside him.
assert.ok(CROC_LED_AT > 0 && CROC_LED_AT < 0.5, 'the Croc is on the left run')
assert.ok(CROC_XZ[0] < 0)

const started = (): ZuzuRulesState =>
  rules.step(rules.initial(3, 5), { type: 'start' } as RulesEvent, {
    shots: table.shots,
  }).state
/** Long after the start: no ball save, the Croc's jaws open. */
const AT = PHYSICS_HZ * 120
const base = (): ZuzuRulesState => {
  const s = started()
  return {
    ...s,
    ballSave: { armed: false, until: Number.NEGATIVE_INFINITY },
  }
}
const withCroc = (s: ZuzuRulesState, phase: CrocPhase): ZuzuRulesState => ({
  ...s,
  croc: { ...s.croc, cycle: { phase, since: AT } },
})
const crocLeds = (() => {
  const out: number[] = []
  for (let i = 0; i < N; i++)
    if (Math.abs(i + 0.5 - CROC_LED_AT * N) <= CROC_LED_SPAN * N) out.push(i)
  return out
})()
assert.ok(crocLeds.length >= 6, 'the Croc has a handful of LEDs')
const away = (i: number) => !crocLeds.includes(i) && i > N * 0.1 && i < N * 0.9
const channels = (c: number) => [(c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff]
/** Whether `c` is a dimmed `of`: the same hue at some brightness. */
const tintOf = (c: number, of: number) => {
  if (c === 0) return false
  const k = brightness(c) / brightness(of)
  return channels(of).every((v, j) => Math.abs(v * k - channels(c)[j]!) <= 3)
}
const valid = (frame: LedFrame) => {
  assert.equal(frame.length, N)
  for (const c of frame)
    assert.ok(Number.isInteger(c) && c >= 0 && c <= 0xffffff, `colour ${c}`)
}

// Idle: a dim amber glow, never dark, never bright.
{
  const s = withCroc(base(), 'submerged')
  assert.equal(ledShow(s).id, 'idle')
  for (const still of [false, true]) {
    const frame = zuzuLeds(s, AT, N, still)
    valid(frame)
    for (const c of frame) {
      assert.ok(tintOf(c, LED_COLORS.amber), 'idle is amber')
      assert.ok(brightness(c) > 0 && brightness(c) <= 0.25, 'and quiet')
    }
  }
}

// Each show holds the strip (away from the Croc and the save ends) in its
// colour; the brightest LED says which.
const shows: Array<[string, (s: ZuzuRulesState) => ZuzuRulesState, number]> = [
  ...(['harvest', 'storm', 'last-bell'] as MultiballKind[]).map(
    (kind): [string, (s: ZuzuRulesState) => ZuzuRulesState, number] => [
      kind,
      (s) => ({
        ...s,
        ballsInPlay: 3,
        multiball: { ...s.multiball, kind, saveUntil: 0 },
      }),
      kind === 'harvest'
        ? LED_COLORS.amber
        : kind === 'storm'
          ? LED_COLORS.cyan
          : LED_COLORS.gold,
    ],
  ),
  [
    'crypt',
    (s) => ({ ...s, crypt: { ...s.crypt, inside: true } }),
    LED_COLORS.violet,
  ],
  [
    'watering-hole',
    (s) => ({
      ...s,
      wateringHole: { ...s.wateringHole, until: AT * 2 },
    }),
    LED_COLORS.teal,
  ],
  ...CHAPTERS.map(
    (ch, chapter): [string, (s: ZuzuRulesState) => ZuzuRulesState, number] => [
      `chapter:${ch.id}`,
      (s) => ({
        ...s,
        story: {
          ...s.story,
          chapter,
          run: { ...(s.story.run ?? {}), chapter } as never,
        },
      }),
      CHAPTER_LED[ch.id]!,
    ],
  ),
]
for (const [id, make, color] of shows) {
  const s = make(withCroc(base(), 'submerged'))
  assert.equal(ledShow(s).id, id, `${id} holds the strip`)
  assert.equal(ledShow(s).color, color)
  // Still: every LED steady in the show's colour.
  const still = zuzuLeds(s, AT, N, true)
  valid(still)
  for (let i = 0; i < N; i++)
    assert.ok(tintOf(still[i]!, color), `${id} LED ${i} is its colour (still)`)
  // Moving: the brightest LEDs are the show's colour (the Last Bell's red
  // comet and the Storm's white lightning ride over, never replace it).
  let lit = 0
  for (let step = AT; step < AT + PHYSICS_HZ * 2; step += 7) {
    const frame = zuzuLeds(s, step, N, false)
    valid(frame)
    for (let i = 0; i < N; i++)
      if (away(i) && tintOf(frame[i]!, color) && brightness(frame[i]!) > 0.5)
        lit++
  }
  assert.ok(lit > 0, `${id} shows its colour while it moves`)
}

// Chapter colours follow the brief's grammar.
assert.equal(CHAPTER_LED.homestead, LED_COLORS.amber)
assert.equal(CHAPTER_LED['storm-crow'], LED_COLORS.cyan)
assert.equal(CHAPTER_LED.abbey, LED_COLORS.red)
for (const ch of CHAPTERS)
  assert.ok(CHAPTER_LED[ch.id], `${ch.id} has a colour`)

// A multiball outranks everything else that could be running.
{
  let s = withCroc(base(), 'open')
  s = {
    ...s,
    crypt: { ...s.crypt, inside: true },
    wateringHole: { ...s.wateringHole, until: AT * 2 },
    multiball: { ...s.multiball, kind: 'storm' },
  }
  assert.equal(ledShow(s).id, 'storm')
}

// The Croc: his LEDs tell his cycle, and each phase looks different.
{
  const looks = new Map<string, string>()
  for (const phase of [
    'open',
    'captured',
    'death-roll',
    'spit',
    'rising',
    'submerged',
  ] as CrocPhase[]) {
    const frame = zuzuLeds(withCroc(base(), phase), AT, N, true)
    valid(frame)
    looks.set(phase, crocLeds.map((i) => frame[i]).join(','))
  }
  assert.equal(new Set(looks.values()).size, looks.size, 'every phase differs')
  const steady = (phase: CrocPhase) =>
    zuzuLeds(withCroc(base(), phase), AT, N, true)[crocLeds[2]!]!
  assert.ok(brightness(steady('captured')) > brightness(steady('open')))
  assert.ok(brightness(steady('open')) > brightness(steady('rising')))
  assert.equal(steady('death-roll'), LED_COLORS.red, 'the roll is red')
  assert.equal(steady('spit'), LED_COLORS.white, 'the spit is white')
  // Moving, the death roll turns: alternate LEDs swap over time.
  const roll = withCroc(base(), 'death-roll')
  const seen = new Set<string>()
  for (let step = AT; step < AT + PHYSICS_HZ; step += 5)
    seen.add(
      crocLeds
        .map((i) =>
          zuzuLeds(roll, step, N, false)[i] === LED_COLORS.red ? 1 : 0,
        )
        .join(''),
    )
  assert.ok(seen.size >= 2, 'the death roll turns round him')
  // Away from him nothing changes with his phase.
  const a = zuzuLeds(withCroc(base(), 'spit'), AT, N, true)
  const b = zuzuLeds(withCroc(base(), 'submerged'), AT, N, true)
  for (let i = 0; i < N; i++)
    if (!crocLeds.includes(i)) assert.equal(a[i], b[i], `LED ${i} is not his`)
}

// Ball save: white at both ends of the strip, only while it lasts.
{
  const s = withCroc(base(), 'submerged')
  const saving = { ...s, ballSave: { armed: false, until: AT + PHYSICS_HZ } }
  const on = zuzuLeds(saving, AT, N, true)
  const off = zuzuLeds(saving, AT + PHYSICS_HZ, N, true)
  for (const i of [0, 1, N - 2, N - 1]) {
    assert.ok(brightness(on[i]!) > 0.7, `save end ${i} lit`)
    assert.equal(channels(on[i]!)[2]! > 150, true, `and white`)
    assert.ok(brightness(off[i]!) < 0.3, `dark once the save ends`)
  }
  // A multiball's own save window lights it too.
  const mb = {
    ...s,
    multiball: { ...s.multiball, kind: 'harvest' as const, saveUntil: AT + 10 },
  }
  assert.ok(brightness(zuzuLeds(mb, AT, N, true)[0]!) > 0.7)
}

// Tilt and game over: the strip goes dark.
for (const s of [
  { ...withCroc(base(), 'death-roll'), tilted: true },
  { ...withCroc(base(), 'open'), over: true },
  {
    ...base(),
    tilted: true,
    multiball: { ...base().multiball, kind: 'storm' as const },
  },
]) {
  const frame = zuzuLeds(s, AT, N, false)
  valid(frame)
  assert.ok(
    frame.every((c) => c === 0),
    'tilt or game over: all dark',
  )
}

// Restraint: no LED flashes faster than MAX_FLASH_HZ, in any show, and
// with reduced motion a held state never changes the strip at all.
{
  assert.equal(MAX_FLASH_HZ, 3)
  // flash() itself never beats faster than the cap.
  let edges = 0
  let last = false
  for (let step = 0; step < PHYSICS_HZ * 4; step++) {
    const now = flash(step, 50)
    if (now && !last) edges++
    last = now
  }
  assert.ok(edges <= MAX_FLASH_HZ * 4 + 1, `flash capped: ${edges} in 4 s`)

  const states: ZuzuRulesState[] = [
    ...shows.map(([, make]) => make(withCroc(base(), 'death-roll'))),
    withCroc(
      { ...base(), wateringHole: { ...base().wateringHole, lit: true } },
      'open',
    ),
    withCroc({ ...base(), ballSave: { armed: false, until: AT * 2 } }, 'open'),
  ]
  for (const s of states) {
    // A hard flash is an LED dropping to under half its brightness and
    // back; count them per LED over four seconds.
    const frames = Array.from({ length: PHYSICS_HZ * 4 }, (_, k) =>
      zuzuLeds(s, AT + k, N, false),
    )
    for (let i = 0; i < N; i++) {
      let peak = 0
      for (const f of frames) peak = Math.max(peak, brightness(f[i]!))
      let blinks = 0
      let bright = true
      for (const f of frames) {
        const b = brightness(f[i]!)
        if (bright && b < peak * 0.4) bright = false
        else if (!bright && b > peak * 0.8) {
          bright = true
          blinks++
        }
      }
      assert.ok(
        blinks <= MAX_FLASH_HZ * 4 + 1,
        `${ledShow(s).id} LED ${i}: ${blinks} flashes in 4 s`,
      )
    }
    const held = zuzuLeds(s, AT, N, true)
    for (let k = 1; k < PHYSICS_HZ * 4; k += 13)
      assert.deepEqual(
        zuzuLeds(s, AT + k, N, true),
        held,
        `${ledShow(s).id}: reduced motion holds still`,
      )
  }
}

// The attract show drifts a rainbow, and holds it with reduced motion.
{
  const a = attractLeds(N, 0, false)
  valid(a)
  assert.ok(new Set(a).size > N / 4, 'a rainbow')
  assert.notDeepEqual(attractLeds(N, PHYSICS_HZ * 2, false), a, 'drifting')
  assert.deepEqual(attractLeds(N, PHYSICS_HZ * 2, true), a, 'still')
}

// The runtime shows the rules' frame on the scene's rail.
{
  const headless = () =>
    ({
      render() {},
      setSize() {},
      setPixelRatio() {},
      dispose() {},
    }) as unknown as RendererLike
  const runtime = new PinballRuntime(
    { rng: mulberry32(5), sound: { play: () => {} }, demo: false, hiScore: 0 },
    RAPIER,
    table,
    headless,
    rules,
  )
  runtime.mount({} as HTMLCanvasElement)
  for (let t = 0; t < 30; t++) runtime.update(emptyInput())
  const inner = runtime as unknown as {
    scene: PinballScene
    rules: ZuzuRulesState
    steps: number
  }
  const shown = inner.scene.ledColors()
  assert.equal(shown.length, N, 'the scene builds every LED')
  assert.deepEqual(
    shown,
    zuzuLeds(inner.rules, inner.steps, N, false),
    'the scene shows the rules frame',
  )
  inner.scene.setLeds(new Array(N).fill(LED_COLORS.violet))
  assert.ok(inner.scene.ledColors().every((c) => c === LED_COLORS.violet))
  runtime.dispose()
}

console.log(
  `Zuzu LEDs: ${N}-LED rail, idle, three multiballs, crypt, Watering Hole and five chapters in colour, Croc cycle cues, ball save ends, tilt dark, ≤${MAX_FLASH_HZ} Hz flashes, reduced motion still, attract rainbow and runtime round-trip verified`,
)
