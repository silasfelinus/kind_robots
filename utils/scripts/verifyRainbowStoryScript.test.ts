import assert from 'node:assert/strict'
import {
  ACT_CALLOUTS,
  CALLOUT_LINE_FRAMES,
} from '../arcade/games/rainbowActBeats'
import {
  RAINBOW_ALLEGIANCE_BRIDGES,
  RAINBOW_TURN,
  allegianceFor,
  rainbowTurnLines,
  type RainbowAllegiance,
} from '../arcade/games/rainbowAllegiance'
import {
  CROWN_REEF,
  reefDialogue,
  reefScene,
} from '../arcade/games/rainbowCrownReef'
import {
  FINALE,
  FINALE_ENDINGS,
  FINALE_ENDING_FRAMES,
  FINALE_LANES,
  FINALE_SKIP_GRACE,
  finaleChoiceFor,
  finaleCredits,
  finaleDialogue,
  finaleEndingSkip,
  finaleEndingTitle,
  finaleScene,
  type FinaleChoice,
  type FinaleFlags,
  type FinaleSceneId,
} from '../arcade/games/rainbowEclipseFinale'
import {
  PALACE,
  palaceDialogue,
  palaceScene,
  type PalaceFlags,
  type PalaceSceneId,
} from '../arcade/games/rainbowEclipsePalace'
import {
  GLASS,
  glassDialogue,
  glassScene,
  type GlassSceneId,
} from '../arcade/games/rainbowGlassCurrent'
import {
  MOONJELLY,
  moonjellyDialogue,
  moonjellyScene,
} from '../arcade/games/rainbowMoonjelly'
import {
  PINKWAKE,
  pinkwakeDialogue,
  pinkwakeScene,
  type PinkwakeSceneId,
} from '../arcade/games/rainbowPinkwake'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import {
  ROSEFIN,
  rosefinDialogue,
  rosefinScene,
} from '../arcade/games/rainbowRosefin'
import {
  TRENCH,
  trenchDialogue,
  trenchScene,
  type TrenchSceneId,
} from '../arcade/games/rainbowTrench'
import {
  WRECK,
  wreckDialogue,
  wreckScene,
  type WreckSceneId,
} from '../arcade/games/rainbowWreckyard'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-012, the writing half: the opening, every Act's scenes from intro to outro, and the
// composed endings. Pinned here: every Act opens and closes on dialogue; every line fits the comms box at
// arcade pace and no absent pilot ever speaks; each road and final choice is its own named ending, reachable
// by flying it; how many rescues came home changes the crew's verdict; and A moves the ending on.

const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi']
type Line = { speaker: string; text: string } | null

/** The engine's comms wrap (rainbowPrincessPreview): words onto rows of `cols` characters. */
function rows(text: string, cols: number): string[] {
  const out = ['']
  for (const word of text.split(' ')) {
    const i = out.length - 1
    if (out[i]!.length + word.length + 1 > cols) out.push(word)
    else out[i] = (out[i] ? out[i] + ' ' : '') + word
  }
  return out
}
// The comms box shows two rows, 57 characters wide beside a portrait (65 without one, when art is missing).
const COMMS_COLS = 57
const COMMS_ROWS = 2

let checked = 0
/** Read a whole scene line by line; every line is spoken by someone present and fits the box at its pace. */
function scene(
  label: string,
  players: number,
  frames: number,
  speak: (elapsed: number) => Line,
): Array<{ speaker: string; text: string }> {
  const lines: Array<{ speaker: string; text: string }> = []
  for (let index = 0; index < 20; index++) {
    const line = speak(index * frames)
    if (!line) break
    lines.push(line)
  }
  assert.ok(lines.length >= 2, `${label} (${players}p) is a conversation`)
  for (const { speaker, text } of lines) {
    assert.ok(speaker && text, `${label}: a speaker and a line`)
    assert.ok(
      !PILOTS.slice(players).includes(speaker),
      `${label} (${players}p): ${speaker} is not flying`,
    )
    const wrapped = rows(text, COMMS_COLS)
    assert.ok(
      wrapped.length <= COMMS_ROWS,
      `${label}: "${text}" fits the comms box (${wrapped.length} rows)`,
    )
    // Arcade pace: a line never asks for more than a character a frame (60 a second) to read in time.
    assert.ok(
      text.length <= frames,
      `${label}: "${text}" reads in ${frames} frames (${text.length} characters)`,
    )
    checked++
  }
  return lines
}

const roads: Array<RainbowAllegiance | null> = [null, 'rebel', 'loyal']
const noFinale: FinaleFlags = {
  rescuedNemi: false,
  securedSalvage: false,
  rescuedCourier: false,
  freedDepot: false,
  stoppedRelay: false,
  rescuedNavigator: false,
  captivesFreed: 0,
}
const everyFinale: FinaleFlags = {
  rescuedNemi: true,
  securedSalvage: true,
  rescuedCourier: true,
  freedDepot: true,
  stoppedRelay: true,
  rescuedNavigator: true,
  captivesFreed: 18,
}
const palaceVariants: PalaceFlags[] = [
  {
    rescuedNemi: false,
    rescuedCourier: false,
    freedDepot: false,
    stoppedRelay: false,
    rescuedNavigator: false,
    captivesFreed: 0,
  },
  ...(
    [
      'rescuedNemi',
      'rescuedCourier',
      'freedDepot',
      'stoppedRelay',
      'rescuedNavigator',
    ] as const
  ).map((flag) => ({
    rescuedNemi: false,
    rescuedCourier: false,
    freedDepot: false,
    stoppedRelay: false,
    rescuedNavigator: false,
    captivesFreed: 9,
    [flag]: true,
  })),
]

// Every Act opens on its OPEN scene, reaches its TURN, and closes on its AFTER once its boss is freed.
const directors: Array<
  [
    act: number,
    (frame: number, defeated: number | null) => { id: string } | null,
  ]
> = [
  [1, pinkwakeScene],
  [2, moonjellyScene],
  [3, trenchScene],
  [4, rosefinScene],
  [5, wreckScene],
  [6, reefScene],
  [7, glassScene],
  [8, palaceScene],
]
for (const [act, director] of directors) {
  const id = (slot: string) => `A0${act}.${slot}`
  assert.equal(
    director(0, null)?.id,
    id('OPEN'),
    `Act ${act} opens on dialogue`,
  )
  let turn = false
  for (let frame = 0; frame < 60000 && !turn; frame += 4)
    turn = director(frame, null)?.id === id('TURN')
  assert.ok(turn, `Act ${act} reaches its TURN`)
  assert.equal(
    director(40000, 40000)?.id,
    id('AFTER'),
    `Act ${act} closes on dialogue`,
  )
}
assert.equal(finaleScene(0, null, null, null)?.id, 'A09.OPEN')
assert.equal(finaleScene(9000, 0, null, null)?.id, 'A09.TURN')
assert.equal(finaleScene(9000, null, null, 0)?.id, 'A09.AFTER')

// Every scene line, for every crew size, route and flag the scene reads.
for (const players of [1, 2, 3, 4]) {
  for (const rescued of [false, true]) {
    for (const id of [
      'A01.OPEN',
      'A01.TURN',
      'A01.AFTER',
      'A01.EDDIES',
      'A01.MINES',
      'A01.ESCORT',
      'A01.GUARD',
      'A01.DIVE',
      'A01.CORAL',
      'A01.STORM',
      'A01.WAKE',
    ] as PinkwakeSceneId[])
      scene(id, players, PINKWAKE.sceneLineFrames, (e) =>
        pinkwakeDialogue(id, e, players, rescued),
      )
    for (const id of ['A02.OPEN', 'A02.TURN', 'A02.AFTER'] as const)
      scene(id, players, MOONJELLY.lineFrames, (e) =>
        moonjellyDialogue(id, e, players, rescued),
      )
    for (const id of [
      'A04.OPEN',
      'A04.ESCORT',
      'A04.TURN',
      'A04.AFTER',
    ] as const)
      scene(id, players, ROSEFIN.lineFrames, (e) =>
        rosefinDialogue(id, e, players, rescued),
      )
    for (const id of [
      'A07.OPEN',
      'A07.ECHO',
      'A07.SIGNAL',
      'A07.TURN',
      'A07.AFTER',
    ] as GlassSceneId[])
      for (const road of roads)
        scene(id, players, GLASS.lineFrames, (e) =>
          glassDialogue(id, e, players, rescued, road),
        )
  }
  for (const id of [
    'A03.OPEN',
    'A03.FORK',
    'A03.TURN',
    'A03.AFTER',
  ] as TrenchSceneId[])
    for (const route of [null, 'vault', 'safe'] as const)
      scene(id, players, TRENCH.lineFrames, (e) =>
        trenchDialogue(id, e, players, route),
      )
  for (const id of [
    'A05.OPEN',
    'A05.FORK',
    'A05.TURN',
    'A05.AFTER',
  ] as WreckSceneId[])
    for (const route of [null, 'depot', 'armory'] as const)
      for (const freed of [false, true])
        scene(id, players, WRECK.lineFrames, (e) =>
          wreckDialogue(id, e, players, route, freed),
        )
  for (const id of [
    'A06.OPEN',
    'A06.REVEAL',
    'A06.FORK',
    'A06.TURN',
    'A06.AFTER',
  ] as const)
    for (const route of [null, 'relay', 'cache'] as const)
      for (const stopped of [false, true])
        for (const road of roads)
          scene(id, players, CROWN_REEF.lineFrames, (e) =>
            reefDialogue(id, e, players, route, stopped, road),
          )
  for (const id of [
    'A08.OPEN',
    'A08.TURN',
    'A08.CORE',
    'A08.AFTER',
  ] as PalaceSceneId[])
    for (const flags of palaceVariants)
      for (const road of roads)
        scene(id, players, PALACE.lineFrames, (e) =>
          palaceDialogue(id, e, players, flags, road),
        )
  for (const id of [
    'A09.OPEN',
    'A09.TURN',
    'A09.ESCAPE',
    'A09.AFTER',
  ] as FinaleSceneId[])
    for (const flags of [noFinale, everyFinale])
      for (const choice of ['restore', 'evacuate', 'sever'] as FinaleChoice[])
        for (const road of roads)
          scene(
            id,
            players,
            id === 'A09.AFTER' ? FINALE.endingLineFrames : FINALE.lineFrames,
            (e) => finaleDialogue(id, e, players, flags, choice, road),
          )
  // The memorial reveal is read while the crew rests; Lilt's section callouts while it flies.
  for (const line of rainbowTurnLines(players))
    assert.ok(line.text.length <= RAINBOW_TURN.lineFrames)
}
for (const callouts of Object.values(ACT_CALLOUTS))
  for (const [section, callout] of Object.entries(callouts))
    for (const text of callout) {
      assert.ok(rows(text, COMMS_COLS).length <= COMMS_ROWS, section)
      assert.ok(text.length <= CALLOUT_LINE_FRAMES, section)
      checked++
    }

// The opening: Lilt hails the squadron, the lead states the order and the stakes, and a solo pilot still gets
// Lilt's voice in the last line, while a crew gets a partner's doubt.
const opening = (players: number) =>
  scene('A01.OPEN', players, PINKWAKE.sceneLineFrames, (e) =>
    pinkwakeDialogue('A01.OPEN', e, players, false),
  )
assert.equal(opening(1).length, 3)
assert.equal(opening(1)[0]!.speaker, 'Lilt-7')
assert.match(opening(1)[0]!.text, /C\.A\.T\.S\./)
assert.equal(opening(1)[1]!.speaker, 'Maribel')
assert.match(opening(1)[1]!.text, /Motherland says pacify/)
assert.equal(opening(1)[2]!.speaker, 'Lilt-7')
assert.equal(opening(4)[2]!.speaker, 'Vivi')
assert.match(opening(4)[2]!.text, /Pacify/)
assert.ok(
  opening(1).every((line) => line.text.length <= 80),
  'the opening is short and punchy',
)

// Acts VII and VIII close on each road's own bridge toward the finale.
for (const road of ['rebel', 'loyal'] as const) {
  const glass = scene('A07.AFTER', 2, GLASS.lineFrames, (e) =>
    glassDialogue('A07.AFTER', e, 2, false, road),
  )
  assert.equal(glass.at(-1)!.text, RAINBOW_ALLEGIANCE_BRIDGES[7][road])
  const palace = scene('A08.AFTER', 1, PALACE.lineFrames, (e) =>
    palaceDialogue('A08.AFTER', e, 1, palaceVariants[0], road),
  )
  assert.equal(palace.at(-1)!.text, RAINBOW_ALLEGIANCE_BRIDGES[8][road])
  assert.equal(palace.at(-1)!.speaker, 'Lilt-7', 'solo, Lilt takes the bridge')
}

// The finale answers the road: the lead's opening line, and a loyal crew hears Command's order at the choice.
const finaleLine = (
  id: FinaleSceneId,
  index: number,
  road: RainbowAllegiance | null,
  choice: FinaleChoice = 'restore',
  players = 2,
  flags = everyFinale,
) =>
  finaleDialogue(
    id,
    index * (id === 'A09.AFTER' ? FINALE.endingLineFrames : FINALE.lineFrames),
    players,
    flags,
    choice,
    road,
  )!
assert.equal(
  new Set(roads.map((road) => finaleLine('A09.OPEN', 2, road).text)).size,
  3,
)
assert.match(finaleLine('A09.TURN', 0, 'loyal').text, /Command orders/)
assert.doesNotMatch(finaleLine('A09.TURN', 0, 'rebel').text, /Command/)

// Nine named endings: three choices on each road, and the three shipped ones for a flight saved before the
// memorial. Each is reached by flying it: the memorial lane sets the road, the finale lane the choice.
const titles = new Set<string>()
const worlds = new Set<string>()
for (const [y, road] of [
  [60, 'rebel'],
  [200, 'loyal'],
] as const) {
  assert.equal(allegianceFor([y]), road)
  for (const choice of ['restore', 'evacuate', 'sever'] as const) {
    const flown = finaleChoiceFor([FINALE_LANES[choice]])
    assert.equal(flown, choice)
    const ending = FINALE_ENDINGS[allegianceFor([y])][flown]
    assert.equal(finaleLine('A09.AFTER', 0, road, flown).text, ending.world)
    assert.equal(finaleEndingTitle(flown, road), ending.title)
    const credits = finaleCredits(everyFinale, 2, flown, road)
    assert.ok(credits.includes(`ENDING: ${ending.title}`))
    assert.ok(
      credits.includes(
        `THE ROAD: ${road === 'rebel' ? 'TURN ON THE EMPIRE' : 'STAY THE COURSE'}`,
      ),
    )
    titles.add(ending.title)
    worlds.add(ending.world)
    // Each road's ending is its own: only the rescue verdict is shared between the two.
    const other = road === 'rebel' ? 'loyal' : 'rebel'
    for (const players of [1, 2, 3, 4])
      for (const index of [0, 2, 3, 4])
        assert.notEqual(
          finaleLine('A09.AFTER', index, road, choice, players).text,
          finaleLine('A09.AFTER', index, other, choice, players).text,
          `${road} ${choice} ${players}p line ${index + 1}`,
        )
  }
}
for (const choice of ['restore', 'evacuate', 'sever'] as const) {
  titles.add(finaleEndingTitle(choice))
  worlds.add(finaleLine('A09.AFTER', 0, null, choice).text)
  assert.ok(
    !finaleCredits(noFinale, 1, choice).some((l) => l.startsWith('THE ROAD')),
  )
}
assert.equal(titles.size, 9, 'nine named endings')
assert.equal(worlds.size, 9, 'nine world consequences')
// A flight saved before the memorial keeps the shipped ending word for word.
assert.equal(
  finaleLine('A09.AFTER', 0, null, 'restore').text,
  'The Crown remembers its first rule: protect, and ask first. The wildlife fleet swims free under its watch.',
)
// The loyal road can still refuse at the last: severing breaks orders, and the send-off says so.
assert.match(finaleLine('A09.AFTER', 4, 'loyal', 'sever').text, /said no/)
assert.match(finaleLine('A09.AFTER', 4, 'loyal', 'restore').text, /Motherland/)

// Performance: the crew's verdict follows how many of the six rescues came home.
const withRescues = (count: number, captives: number): FinaleFlags => {
  const keys = [
    'rescuedNemi',
    'securedSalvage',
    'rescuedCourier',
    'freedDepot',
    'stoppedRelay',
    'rescuedNavigator',
  ] as const
  const flags: FinaleFlags = { ...noFinale, captivesFreed: captives }
  for (const key of keys.slice(0, count)) flags[key] = true
  return flags
}
const verdicts = [0, 1, 2, 3, 5, 6].map(
  (count) =>
    finaleLine('A09.AFTER', 1, 'rebel', 'evacuate', 1, withRescues(count, 4))
      .text,
)
assert.equal(
  new Set([verdicts[0], verdicts[1], verdicts[3], verdicts[5]]).size,
  4,
)
assert.match(verdicts[1]!, /^1 rescue home, and 4 palace captives\. Not enough/)
assert.match(verdicts[2]!, /^2 rescues home/)
assert.match(verdicts[4]!, /^5 of our six rescues/)
assert.match(verdicts[5]!, /Every single one/)
assert.doesNotMatch(
  finaleLine('A09.AFTER', 1, 'rebel', 'evacuate', 1, withRescues(3, 0)).text,
  /0 palace captives/,
  'no empty count is read out',
)
// Each crew size has its own epilogue on each road, spoken by a pilot who is flying.
for (const road of ['rebel', 'loyal'] as const)
  assert.equal(
    new Set(
      [1, 2, 3, 4].map(
        (players) => finaleLine('A09.AFTER', 3, road, 'restore', players).text,
      ),
    ).size,
    4,
  )

// A moves the ending on a line at a time, after a beat, and never past the last line into the credits' own skip.
const L = FINALE.endingLineFrames
assert.equal(finaleEndingSkip(0), null)
assert.equal(finaleEndingSkip(FINALE_SKIP_GRACE - 1), null, 'a beat first')
assert.equal(finaleEndingSkip(FINALE_SKIP_GRACE), L)
assert.equal(finaleEndingSkip(L + 100), 2 * L)
assert.equal(finaleEndingSkip(FINALE_ENDING_FRAMES - 1), FINALE_ENDING_FRAMES)
assert.equal(
  finaleEndingSkip(FINALE_ENDING_FRAMES),
  null,
  'the credits skip on their own',
)
assert.ok(L >= 150, 'ending lines hold long enough to read without skipping')

// Through the engine: the attract demo flies the whole campaign (one pilot turns on the empire and restores,
// two stay the course and evacuate); A skips the ending's lines; the comms box, credits and THE END name the
// ending, and every comms line draws with no art loaded (the text-only fallback).
function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
function recordingCanvas() {
  const state: Record<string | symbol, unknown> = {}
  const texts: string[] = []
  const g = new Proxy(state, {
    get(target, key) {
      if (key === 'fillText') return (text: string) => texts.push(String(text))
      if (key === 'measureText')
        return (text: string) => ({ width: String(text).length * 5 })
      if (key in target) return target[key]
      return () => ({ addColorStop() {} })
    },
    set(target, key, value) {
      target[key] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { g, texts }
}
for (const [players, road, choice] of [
  [1, 'rebel', 'restore'],
  [2, 'loyal', 'evacuate'],
] as const) {
  const game = createRainbowPrincessPreview({
    players,
    demo: true,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
  })
  const title = FINALE_ENDINGS[road][choice].title
  const drawn = new Set<string>()
  let skipped = 0
  let pressedAt: number | null = null
  for (let frame = 0; frame < 420000 && !game.over; frame++) {
    const before = game.snapshot.endingFrame
    const input = emptyInput()
    // Press A twice in the ending: once inside a line's first beat (nothing happens), once after it.
    if (before !== null && before < FINALE_ENDING_FRAMES) {
      const into = (before + 1) % L
      if (before + 1 === 10 || before + 1 === L + FINALE_SKIP_GRACE + 5) {
        input.pressed.a = true
        pressedAt = before + 1
      }
      if (frame % 20 === 0 || into === 1) {
        const { g, texts } = recordingCanvas()
        game.render(g)
        for (const text of texts) drawn.add(text)
      }
    } else if (before !== null && frame % 200 === 0) {
      const { g, texts } = recordingCanvas()
      game.render(g)
      for (const text of texts) drawn.add(text)
    }
    game.update(input)
    const after = game.snapshot.endingFrame
    if (pressedAt === 10) {
      assert.equal(after, 10, 'A inside the first beat does nothing')
      pressedAt = null
    } else if (pressedAt !== null) {
      assert.equal(after, 2 * L, 'A moves on to the next line')
      skipped++
      pressedAt = null
    }
  }
  assert.ok(game.over, `${players}p reaches THE END`)
  assert.equal(game.snapshot.allegiance, road)
  assert.equal(game.snapshot.finalChoice, choice)
  assert.equal(skipped, 1)
  assert.ok(
    drawn.has('A09.AFTER / LILT-7'),
    'the ending plays in the comms box',
  )
  assert.ok(drawn.has('A ▸'), 'the ending shows that A moves it on')
  assert.ok(drawn.has(`ENDING: ${title}`), 'the credits name the ending')
  assert.ok(
    [...drawn].some(
      (text) => text.startsWith('FINAL SCORE') && text.endsWith(`· ${title}`),
    ),
    'THE END names the ending',
  )
  assert.ok(
    drawn.has(rows(FINALE_ENDINGS[road][choice].world, COMMS_COLS)[0]!) ||
      drawn.has(rows(FINALE_ENDINGS[road][choice].world, 65)[0]!),
    'the road and choice set the world line',
  )
}

console.log(
  `rainbow story script: ok (${checked} lines fit the comms box at arcade pace; every Act opens and closes on dialogue; nine named endings, each flown; rescue verdicts; A skips the ending)`,
)
