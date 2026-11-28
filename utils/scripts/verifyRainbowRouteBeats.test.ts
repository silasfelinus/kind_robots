import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  finaleCredits,
  finaleDialogue,
} from '../arcade/games/rainbowEclipseFinale'
import { palaceDialogue } from '../arcade/games/rainbowEclipsePalace'
import { glassDialogue } from '../arcade/games/rainbowGlassCurrent'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import {
  RAINBOW_ORCHESTRA_LOOPS,
  RAINBOW_RECORDED_TRACKS,
} from '../arcade/games/rainbowRecordedScore'
import { ROSEFIN, rosefinDialogue } from '../arcade/games/rainbowRosefin'
import {
  NO_ROUTE,
  RAINBOW_ROUTE_BEATS,
  rainbowRouteCredits,
  rainbowRouteStinger,
  withRainbowRouteBeat,
  type RainbowRouteFlags,
} from '../arcade/games/rainbowRouteBeats'
import { RAINBOW_SCORE, rainbowMusicFor } from '../arcade/games/rainbowScore'
import { wreckDialogue } from '../arcade/games/rainbowWreckyard'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-027/t-012 (ROUTE-MAP.md sections 5-6): detours change the scenes that follow them and earn
// route stingers; each detour flies its own theme; supers, shields, hits, boss phases, forks and stingers have
// their own cues.

const ALL: RainbowRouteFlags = {
  viaX1: true,
  viaX2: true,
  viaX3: true,
  viaX4: true,
  freedChoir: true,
  cadetsHome: true,
  liltMemoryRecovered: true,
  crownEcho: true,
}

// The helper swaps exactly one line, never grows a scene, and leaves the scene's own list untouched.
{
  const lines = [
    { speaker: 'A', text: 'one' },
    { speaker: 'B', text: 'two' },
    { speaker: 'C', text: 'three' },
  ]
  assert.equal(
    withRainbowRouteBeat(lines, 'A04.OPEN', NO_ROUTE, ['Maribel']),
    lines,
  )
  assert.equal(
    withRainbowRouteBeat(lines, 'A04.OPEN', undefined, ['Maribel']),
    lines,
  )
  assert.equal(withRainbowRouteBeat(lines, 'A01.OPEN', ALL, ['Maribel']), lines)
  const swapped = withRainbowRouteBeat(lines, 'A04.OPEN', ALL, ['Maribel'])
  assert.equal(swapped.length, 3)
  assert.equal(swapped[0], lines[0])
  assert.equal(swapped[2], lines[2])
  assert.notEqual(swapped[1]!.text, 'two')
  assert.equal(lines[1]!.text, 'two', 'the scene list is not mutated')
  const short = [{ speaker: 'A', text: 'one' }]
  assert.equal(withRainbowRouteBeat(short, 'A08.TURN', ALL, ['Maribel']), short)
}

// In the real scenes (every Act shows a line each 96 frames): each beat changes only its named line, keeps the length, and keeps every other line.
// The final choice's beat is a fourth line after the crew's, never in its place (story critic round 2, R2-9).
type Say = (
  id: string,
  at: number,
  route?: RainbowRouteFlags,
) => { text: string } | null
const SCENES: [string, number, Say][] = [
  [
    'A04.OPEN',
    96,
    (id, at, r) => rosefinDialogue(id as never, at, 4, false, r),
  ],
  [
    'A05.OPEN',
    96,
    (id, at, r) => wreckDialogue(id as never, at, 4, null, false, r),
  ],
  [
    'A05.TURN',
    96,
    (id, at, r) => wreckDialogue(id as never, at, 4, 'armory', false, r),
  ],
  [
    'A07.OPEN',
    96,
    (id, at, r) => glassDialogue(id as never, at, 4, false, null, r),
  ],
  [
    'A07.TURN',
    96,
    (id, at, r) => glassDialogue(id as never, at, 4, true, null, r),
  ],
  [
    'A08.OPEN',
    96,
    (id, at, r) => palaceDialogue(id as never, at, 4, undefined, null, r),
  ],
  [
    'A08.TURN',
    96,
    (id, at, r) => palaceDialogue(id as never, at, 4, undefined, null, r),
  ],
  [
    'A08.AFTER',
    96,
    (id, at, r) => palaceDialogue(id as never, at, 4, undefined, null, r),
  ],
  [
    'A09.TURN',
    96,
    (id, at, r) =>
      finaleDialogue(id as never, at, 4, undefined, null, null, null, r),
  ],
]
for (const [id, frames, say] of SCENES) {
  const beat = RAINBOW_ROUTE_BEATS[id]!
  const plain: string[] = []
  const routed: string[] = []
  for (let line = 0; line < 12; line++) {
    const a = say(id, line * frames + 1)
    const b = say(id, line * frames + 1, ALL)
    if (!a && !b) break
    plain.push(a?.text ?? '')
    routed.push(b?.text ?? '')
  }
  if (beat.inserts) {
    assert.equal(plain.length, beat.line + 1, `${id} grows by one line`)
    assert.equal(plain[beat.line], '', `${id} line ${beat.line} is the beat's`)
    assert.deepEqual(
      routed.slice(0, beat.line),
      plain.slice(0, beat.line),
      `${id} keeps every line of its own`,
    )
    assert.ok(routed[beat.line], `${id} plays the beat last`)
    continue
  }
  assert.ok(plain.length > beat.line, `${id} has its line ${beat.line}`)
  assert.equal(routed.length, plain.length, `${id} keeps its length`)
  for (let line = 0; line < plain.length; line++)
    if (line === beat.line)
      assert.notEqual(routed[line], plain[line], `${id} line ${line} changes`)
    else
      assert.equal(routed[line], plain[line], `${id} line ${line} is untouched`)
  assert.equal(
    say(id, beat.line * frames + 1, NO_ROUTE)?.text,
    plain[beat.line],
    `${id} without the route plays as written`,
  )
}
// The finale's instruction line survives every route.
assert.match(
  finaleDialogue('A09.TURN', 96 + 1, 4, undefined, null, null, null, ALL)!.text,
  /Fly high to restore/,
)

// Stingers (ROUTE-MAP section 6).
const rescues = { all: false, stoppedRelay: true }
assert.equal(rainbowRouteStinger('restore', NO_ROUTE, rescues), null)
assert.equal(
  rainbowRouteStinger(
    'restore',
    { ...NO_ROUTE, liltMemoryRecovered: true, crownEcho: true },
    rescues,
  )?.id,
  'first-rule',
)
assert.equal(
  rainbowRouteStinger(
    'evacuate',
    { ...NO_ROUTE, freedChoir: true, cadetsHome: true },
    rescues,
  )?.id,
  'whole-fleet',
)
assert.equal(
  rainbowRouteStinger(
    'sever',
    { ...NO_ROUTE, liltMemoryRecovered: true },
    rescues,
  )?.id,
  'kept-memory',
)
assert.equal(
  rainbowRouteStinger(
    'sever',
    { ...NO_ROUTE, liltMemoryRecovered: true },
    { all: false, stoppedRelay: false },
  ),
  null,
)
for (const choice of ['restore', 'evacuate', 'sever'] as const) {
  assert.equal(
    rainbowRouteStinger(choice, ALL, { all: true, stoppedRelay: true })?.id,
    'open-sea',
  )
  assert.notEqual(rainbowRouteStinger(choice, ALL, rescues)?.id, 'open-sea')
}
assert.deepEqual(rainbowRouteCredits(NO_ROUTE, null), [])
const flags = {
  rescuedNemi: false,
  securedSalvage: false,
  rescuedCourier: false,
  freedDepot: false,
  stoppedRelay: false,
  rescuedNavigator: false,
  captivesFreed: 0,
}
const credits = finaleCredits(flags, 1, 'evacuate', null, {
  route: { ...NO_ROUTE, freedChoir: true, cadetsHome: true },
})
const route = credits.indexOf('THE ROUTE')
assert.ok(
  route > credits.indexOf('THE CHOICE: EVACUATE'),
  'the route follows the ending',
)
assert.ok(credits.some((line) => line.startsWith('Whole Fleet:')))
assert.ok(!finaleCredits(flags, 1, 'evacuate').includes('THE ROUTE'))

// Detour music: each detour flies its own recorded theme; guardians and bosses keep the shared cues.
for (const x of ['x1', 'x2', 'x3', 'x4'] as const) {
  const flying = rainbowMusicFor({
    act: 3,
    detour: x,
    boss: false,
    guardian: false,
    ending: false,
    failure: false,
  })
  assert.equal(flying, RAINBOW_SCORE.detours[x])
  assert.equal(flying.recorded?.src, `/rainbow-princess-audio/${x}-flight.mp3`)
  assert.ok(
    existsSync(
      new URL(
        `../../public/rainbow-princess-audio/${x}-flight.mp3`,
        import.meta.url,
      ),
    ),
    `${x} recording ships`,
  )
  assert.ok(RAINBOW_ORCHESTRA_LOOPS[`${x}-flight`].loopEnd > 30)
  assert.equal(
    rainbowMusicFor({
      act: 3,
      detour: x,
      boss: false,
      guardian: true,
      ending: false,
      failure: false,
    }),
    RAINBOW_SCORE.acts[2]!.guardian,
  )
}
for (const track of RAINBOW_RECORDED_TRACKS)
  assert.ok(
    existsSync(new URL(`../../public${track.path}`, import.meta.url)),
    `${track.id} recording ships`,
  )

// Flown: a four-pilot crew takes the X1 detour, and Act IV opens with the via-X1 line; forks, boss phases and
// supers sound their own cues on the way.
function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const played = new Map<string, number>()
const game = createRainbowPrincessPreview({
  players: 4,
  demo: true,
  rng: seeded(),
  sound: {
    play: (name: string) => played.set(name, (played.get(name) ?? 0) + 1),
  },
  hiScore: 0,
})
const texts: string[] = []
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
    if (key === 'fillText') return (text: string) => texts.push(text)
    return () => {}
  },
  set(target, key, value) {
    target[key] = value
    return true
  },
}) as unknown as CanvasRenderingContext2D
let sawX1 = false
let viaLine = false
for (let frame = 0; frame < 120000 && !viaLine; frame++) {
  // Launch from the salvage dock while most of the crew flies low (the X1 rule), as soon as the dock allows.
  const input = emptyInput()
  const docked = game.snapshot.docked
  input.pressed.a =
    docked !== null &&
    docked >= ROSEFIN.dockMinFrames - 1 &&
    game.snapshot.ships.filter((ship) => ship.y >= 135).length > 2
  game.update(input)
  const act: string = game.snapshot.act
  if (act === 'X1') sawX1 = true
  if (act === 'S04' && game.snapshot.actFourFrame < 900 && frame % 15 === 0) {
    texts.length = 0
    game.render(g)
    viaLine = texts.some((text) => /kelp/.test(text))
  }
}
assert.ok(sawX1, 'the four-pilot crew flew X1')
assert.ok(viaLine, 'Act IV opened with the via-X1 line')
assert.ok(
  (played.get('rainbowFork') ?? 0) >= 1,
  'the Trench fork sounded its cue',
)
assert.ok(
  (played.get('rainbowPhase') ?? 0) >= 1,
  'a boss phase change sounded its cue',
)
// Cues the attract demo never triggers (it takes no hits and saves its supers) are pinned to their moments.
const engine = readFileSync(
  new URL('../arcade/games/rainbowPrincessPreview.ts', import.meta.url),
  'utf8',
)
assert.match(engine, /supers\+\+\s+options\.sound\.play\('rainbowNova'\)/)
assert.match(
  engine,
  /if \(ship\.shield > 0\) options\.sound\.play\('rainbowShield'\)/,
)
assert.match(
  engine,
  /if \(ship\.lives > 0\) options\.sound\.play\('rainbowHurt'\)/,
)
assert.match(engine, /options\.sound\.play\('rainbowStinger'\)/)
console.log(
  `rainbow route beats: ok (cues ${JSON.stringify(Object.fromEntries([...played].filter(([n]) => n.startsWith('rainbow'))))})`,
)
