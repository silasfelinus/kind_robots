import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CROWN_PLEA } from '../arcade/games/rainbowEclipseCrown'
import {
  RAINBOW_CONTINUE_LINES,
  failureLines,
  rainbowContinueLine,
} from '../arcade/games/rainbowFailure'
import {
  FINALE,
  finaleCredits,
  finaleDialogue,
  finaleScene,
} from '../arcade/games/rainbowEclipseFinale'
import { rainbowPartyTrack } from '../arcade/games/rainbowPartyComms'
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
) => {
  const lines: NonNullable<ReturnType<typeof finaleDialogue>>[] = []
  for (let line = 0; ; line++) {
    const said = finaleDialogue(
      'A09.AFTER',
      line * AFTER + 1,
      players,
      undefined,
      'restore',
      allegiance,
      mask,
    )
    if (!said) return lines
    lines.push(said)
  }
}

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
// Story critic round 2 (R2-2): the road epilogue goes to the pilot after the party epilogue's speaker, so these
// crews hear Maribel, Maribel, Solenne and Azure; a lone pilot's rebel ending skips it, and the send-off closes.
const MASKS = [1, 3, 7, 15]
const ROAD_VOICE = [0, 0, 2, 1]
for (let crew = 1; crew <= 4; crew++) {
  const loyal = after(crew, 'loyal', MASKS[crew - 1]!)
  assert.equal(loyal.length, 5)
  assert.match(
    loyal[3]!.text,
    LOYAL[ROAD_VOICE[crew - 1]!]!,
    `loyal ${crew}: road epilogue`,
  )
  assert.ok(
    !loyal.some(
      (line) => line.text === rainbowPartyTrack(MASKS[crew - 1]!).epilogue.text,
    ),
    `loyal ${crew}: no rebel-toned party line`,
  )
  assert.match(loyal[4]!.text, /Motherland expects us/)
  const rebel = after(crew, 'rebel', MASKS[crew - 1]!)
  assert.equal(rebel.length, crew === 1 ? 5 : 6)
  assert.ok(
    'partyAuthored' in rebel[3]! && rebel[3]!.partyAuthored,
    `rebel ${crew}: the crew's own party line`,
  )
  if (crew > 1)
    assert.match(
      rebel[4]!.text,
      REBEL[ROAD_VOICE[crew - 1]!]!,
      `rebel ${crew}: road epilogue`,
    )
  assert.match(rebel.at(-1)!.text, /Let us fly/, `rebel ${crew}: send-off`)
}
// S7: the crew's epilogue belongs to a pilot, not a seat. A Solenne-and-Vivi crew (mask 12) hears Vivi's own
// line, never another pilot's role read in her voice, and no epilogue names another pilot.
{
  const solenneVivi = after(2, 'loyal', 12)
  assert.equal(solenneVivi[3]!.speaker, 'Vivi')
  assert.match(solenneVivi[3]!.text, /They will hand out medals/)
  for (const road of ['rebel', 'loyal', null] as const)
    for (let mask = 1; mask <= 15; mask++)
      for (const line of after(
        Math.max(1, mask.toString(2).replace(/0/g, '').length),
        road,
        mask,
      ).slice(3))
        if (line.speaker !== 'Lilt-7' && !line.text.includes('Lilt'))
          assert.doesNotMatch(
            line.text.replace(/^C\.A\.T\.S\./, ''),
            /\b(Maribel|Azure|Solenne|Vivi)\b/,
            `mask ${mask} ${road}: ${line.text}`,
          )
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

// S4: the Crown's plea is a spoken scene over its whole window, and a crew that stands down hears it named.
assert.deepEqual(finaleScene(5000, null, null, null, 10), {
  id: 'A09.PLEA',
  elapsed: 10,
})
const plea = [0, 1, 2].map((line) =>
  finaleDialogue(
    'A09.PLEA',
    Math.floor((line * CROWN_PLEA.frames) / 3) + 1,
    2,
    undefined,
    null,
    'loyal',
  )!,
)
assert.deepEqual(
  plea.map((line) => line.speaker),
  ['Crown Voice', 'Lilt-7', 'Maribel'],
  'the Crown asks, Lilt names the turn, the lead answers',
)
assert.equal(
  finaleDialogue('A09.PLEA', CROWN_PLEA.frames - 1, 2, undefined, null, 'loyal')
    ?.speaker,
  'Maribel',
  'the plea is spoken for its whole window',
)
for (const line of plea)
  assert.ok(line.text.length <= 114, `fits the comms box: ${line.text}`)
assert.match(
  finaleDialogue(
    'A09.TURN',
    1,
    4,
    undefined,
    null,
    'rebel',
    15,
    undefined,
    true,
  )!.text,
  /turned at the last breath/,
)
assert.match(
  finaleDialogue(
    'A09.AFTER',
    2 * FINALE.endingLineFrames + 1,
    4,
    undefined,
    'restore',
    'rebel',
    15,
    undefined,
    true,
  )!.text,
  /chose to ask/,
)
assert.ok(
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
    4,
    'restore',
    'rebel',
    { stoodDown: true },
  ).includes('THE ROAD: TURNED AT THE CROWN'),
)

// S3: within a road, the final choice changes the escape, Lilt's resolution and the rebel send-off, not only the
// title. S10: Lilt acts (closes Command's channel, spends a memory on the clamps) and no longer abstains by rote.
for (const road of ['rebel', 'loyal', null] as const) {
  const choices = ['restore', 'evacuate', 'sever'] as const
  const escapes = choices.map(
    (choice) =>
      finaleDialogue('A09.ESCAPE', 1, 2, undefined, choice, road)!.text,
  )
  assert.equal(new Set(escapes).size, 3, `${road}: each choice escapes its way`)
  const resolutions = choices.map(
    (choice) =>
      finaleDialogue(
        'A09.AFTER',
        2 * FINALE.endingLineFrames + 1,
        2,
        undefined,
        choice,
        road,
      )!.text,
  )
  assert.equal(new Set(resolutions).size, 3, `${road}: Lilt answers the choice`)
}
assert.equal(
  new Set(
    (['restore', 'evacuate', 'sever'] as const).map(
      (choice) =>
        finaleDialogue(
          'A09.AFTER',
          4 * FINALE.endingLineFrames + 1,
          2,
          undefined,
          choice,
          'rebel',
        )!.text,
    ),
  ).size,
  3,
  'the rebel send-off names the choice',
)
assert.match(
  finaleDialogue('A09.TURN', 1, 2, undefined, null, 'loyal')!.text,
  /closed their channel/,
)
assert.match(
  finaleDialogue('A09.TURN', 1, 2, undefined, null, 'rebel')!.text,
  /memory to open the clamps/,
)
{
  const sources = [
    'rainbowAllegiance',
    'rainbowCrownReef',
    'rainbowEclipseFinale',
    'rainbowGlassCurrent',
  ].map((name) =>
    readFileSync(
      new URL(`../arcade/games/${name}.ts`, import.meta.url),
      'utf8',
    ),
  )
  for (const source of sources)
    assert.doesNotMatch(
      source,
      /not (make that |make this )?choose for you|choice for you again|your choice, not an order/,
      'Lilt no longer abstains by rote',
    )
}

// S16: Lilt speaks the continue beat in every Act, in one caption line, and the crew comes back with a cue.
// S15: an early failure line stays local instead of naming the Eclipse before the story has.
assert.equal(RAINBOW_CONTINUE_LINES.length, 9)
for (let act = 1; act <= 9; act++)
  assert.ok(
    rainbowContinueLine(act).length <= 80,
    `Act ${act} continue line fits`,
  )
assert.equal(
  new Set(RAINBOW_CONTINUE_LINES).size,
  9,
  'each Act has its own line',
)
assert.doesNotMatch(failureLines(1, 0, null)[1]!, /Eclipse/)
assert.match(failureLines(1, 0, null)[1]!, /Pinkwake/)
assert.match(failureLines(6, 0, null)[1]!, /Eclipse/)
// S15: the failure screen counts the finale's six rescues and names palace captives apart.
assert.match(
  failureLines(8, 3, 8, 2)[1]!,
  /3 of our six rescues and 2 palace captives/,
)
assert.match(failureLines(8, 0, 8, 1)[1]!, /1 palace captive made it home/)
assert.match(failureLines(3, 1, 3)[1]!, /1 of our six rescues made it home/)
{
  const engine = readFileSync(
    new URL('../arcade/games/rainbowPrincessPreview.ts', import.meta.url),
    'utf8',
  )
  assert.match(engine, /rainbowContinueLine\(checkpoint\.act, activePlayers\)/)
  assert.match(engine, /BACK IN THE FIGHT/)
}

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
  const shown = game.snapshot.comms
  if (shown?.id.startsWith('X')) {
    speakers.add(shown.speaker.toUpperCase())
    // Story critic S17: the header is the speaker alone, never the scene id.
    assert.ok(texts.includes(shown.speaker.toUpperCase()))
    assert.ok(!texts.some((text) => text.includes(`${shown.id} /`)))
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
