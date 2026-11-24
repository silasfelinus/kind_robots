import assert from 'node:assert/strict'
import {
  FINALE,
  finaleCredits,
  finaleDialogue,
} from '../arcade/games/rainbowEclipseFinale'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { ROSEFIN } from '../arcade/games/rainbowRosefin'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-012, from the blind story critic's report (2026-11-23 PT, kind_robots branch
// claude/rainbow-review-story): S1, only the crew speaks on comms, detours included; S2, the rebel and loyal road
// epilogues play and a loyal ending never hears a rebel crew's party line; S7, the four-pilot finale line keeps
// each pilot's own role; plus the plural, solo and credits fixes.

const AFTER = FINALE.endingLineFrames
const after = (
  players: number,
  allegiance: 'rebel' | 'loyal' | null,
  mask: number | null,
) =>
  Array.from({ length: 5 }, (_, line) =>
    finaleDialogue(
      'A09.AFTER',
      line * AFTER + 1,
      players,
      undefined,
      'restore',
      allegiance,
      mask,
    )!,
  )

// S2: every road epilogue is reachable with the party mask the engine always passes.
const LOYAL = [
  /Command will call this a victory/,
  /The official map will say pacified/,
  /Orders kept, squadron whole/,
  /They will hand out medals/,
]
const REBEL = [
  /I flew in to pacify an ocean/,
  /Our charts use the Ocean's own names now/,
  /C\.A\.T\.S\. answers to the Ocean now/,
  /No ranks on this broadcast/,
]
const MASKS = [1, 3, 7, 15]
for (let crew = 1; crew <= 4; crew++) {
  const loyal = after(crew, 'loyal', MASKS[crew - 1]!)
  assert.match(loyal[3]!.text, LOYAL[crew - 1]!, `loyal ${crew}: road epilogue`)
  assert.ok(
    !loyal.some((line) => 'partyAuthored' in line && line.partyAuthored),
    `loyal ${crew}: no rebel-toned party line`,
  )
  assert.match(loyal[4]!.text, /Motherland expects us home/)
  const rebel = after(crew, 'rebel', MASKS[crew - 1]!)
  assert.ok(
    'partyAuthored' in rebel[3]! && rebel[3]!.partyAuthored,
    `rebel ${crew}: the crew's own party line`,
  )
  assert.match(rebel[4]!.text, REBEL[crew - 1]!, `rebel ${crew}: road epilogue`)
}
// The unsworn road (older saves) keeps its party epilogue and send-off.
assert.match(after(2, null, 3)[4]!.text, /the sky is open/)

// Verdicts read right at one, and a loyal crew does not celebrate what Command files away.
const one = finaleDialogue(
  'A09.AFTER',
  AFTER + 1,
  1,
  {
    rescuedNemi: true,
    securedSalvage: true,
    rescuedCourier: true,
    freedDepot: false,
    stoppedRelay: false,
    rescuedNavigator: false,
    captivesFreed: 1,
  },
  'restore',
  'rebel',
)!
assert.match(one.text, /with 1 palace captive beside them/)
assert.ok(
  finaleCredits(
    {
      rescuedNemi: false,
      securedSalvage: false,
      rescuedCourier: false,
      freedDepot: false,
      stoppedRelay: false,
      rescuedNavigator: false,
      captivesFreed: 1,
    },
    1,
    'restore',
  ).includes('1 captive of the Eclipse Palace'),
)
const credits = (allegiance: 'rebel' | 'loyal') =>
  finaleCredits(
    {
      rescuedNemi: false,
      securedSalvage: false,
      rescuedCourier: false,
      freedDepot: false,
      stoppedRelay: false,
      rescuedNavigator: false,
      captivesFreed: 0,
    },
    1,
    'restore',
    allegiance,
  )
assert.ok(
  credits('rebel').includes('B09 Motherland Flagship'),
  'rebel fought the flagship',
)
assert.ok(
  credits('loyal').includes('B09 Eclipse Crown · under the Motherland flag'),
)

// S7 and solo address: the four-pilot finale line is never renamed; a lone pilot speaks for herself.
const quad = finaleDialogue('A09.TURN', 2 * FINALE.lineFrames + 1, 4)!
assert.equal(quad.speaker, 'Vivi')
assert.ok('partyAuthored' in quad && quad.partyAuthored)
assert.match(
  finaleDialogue('A09.TURN', 2 * FINALE.lineFrames + 1, 1)!.text,
  /Whatever I choose/,
)
assert.match(
  finaleDialogue('A09.ESCAPE', FINALE.lineFrames + 1, 1)!.text,
  /Stay on my light/,
)

// S1, flown: a solo Vivi crew takes the X1 detour, and every comms header names Vivi or Lilt-7.
function seeded(seed = 7) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const scout = createRainbowPrincessPreview({
  players: 1,
  demo: true,
  rng: seeded(),
  sound: { play() {} },
  hiScore: 0,
})
for (let frame = 0; frame < 200000 && scout.snapshot.act !== 'S04'; frame++)
  scout.update(emptyInput())
for (
  let i = 0;
  i < 900 &&
  (scout.save as { checkpoint?: { act?: number } } | undefined)?.checkpoint
    ?.act !== 4;
  i++
)
  scout.update(emptyInput())
const save = JSON.parse(JSON.stringify(scout.save)) as {
  checkpoint: { act: number }
  pilot?: number
  pilots?: number[]
}
assert.equal(save.checkpoint.act, 4)
save.pilot = 3
save.pilots = [3]
const game = createRainbowPrincessPreview({
  players: 1,
  demo: true,
  rng: seeded(11),
  sound: { play() {} },
  hiScore: 0,
  resume: save,
  rainbowDemoResume: true,
})
for (let i = 0; i < 25; i++) game.update(emptyInput())
const press = emptyInput()
press.pressed.a = true
game.update(press)
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
const speakers = new Set<string>()
const detours = new Set<string>()
for (let frame = 0; frame < 400000 && game.snapshot.act !== 'S09'; frame++) {
  const input = emptyInput()
  input.pressed.a = game.snapshot.docked === ROSEFIN.dockMinFrames - 1
  game.update(input)
  const act: string = game.snapshot.act
  if (!act.startsWith('X')) continue
  detours.add(act)
  if (frame % 12) continue
  texts.length = 0
  game.render(g)
  for (const text of texts) {
    const header = /^X\d\.\w+ \/ ([^·]+?)(?: ·.*)?$/.exec(text)
    if (header) speakers.add(header[1]!.trim().toUpperCase())
  }
}
assert.ok(detours.size > 0, 'the solo crew flew a detour')
assert.ok(speakers.size > 1, 'detour comms were shown')
for (const speaker of speakers)
  assert.ok(
    speaker === 'VIVI' || speaker === 'LILT-7',
    `only the crew and Lilt speak on a detour (heard ${speaker})`,
  )

console.log(
  `rainbow crew voices: ok (solo Vivi flew ${[...detours].join(', ')}; detour speakers ${[...speakers].join(', ')})`,
)
