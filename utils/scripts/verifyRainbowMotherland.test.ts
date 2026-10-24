import assert from 'node:assert/strict'
import {
  RAINBOW_ALLEGIANCE_OPENINGS,
  RAINBOW_TURN_REVEAL_FRAMES,
  allegianceFor,
  rainbowTurnLines,
} from '../arcade/games/rainbowAllegiance'
import { CROWN_REEF, reefDialogue } from '../arcade/games/rainbowCrownReef'
import { glassDialogue } from '../arcade/games/rainbowGlassCurrent'
import { palaceDialogue } from '../arcade/games/rainbowEclipsePalace'
import { readRainbowSave } from '../arcade/games/rainbowLoadouts'
import {
  createRainbowPrincessPreview,
  isRainbowCheckpoint,
} from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-040 (PLOT-MOTHERLAND.md), Silas 2026-10-23 PT: "having a turn when the princesses realize they
// are supporting the colonizers, and they can choose to attack the empire or stay the course for the Motherland".
// The turn is Act V's memorial: the reveal plays, then the crew's flown lane decides; the choice rides every later
// checkpoint and save, and each later Act's opening answers it.

// The rule: most living pilots high turns on the empire; a tie stays the course.
assert.equal(allegianceFor([90]), 'rebel')
assert.equal(allegianceFor([200]), 'loyal')
assert.equal(allegianceFor([90, 200]), 'loyal', 'a tie stays the course')
assert.equal(allegianceFor([90, 90, 200]), 'rebel')
assert.equal(allegianceFor([]), 'loyal')
// The memorial waits for the whole reveal before A can launch.
assert.equal(rainbowTurnLines(1).length, 3)
assert.ok(CROWN_REEF.restMinFrames > RAINBOW_TURN_REVEAL_FRAMES)
assert.ok(rainbowTurnLines(1)[0]!.text.includes('Motherland'))

// Each later Act's opening carries the choice in the lead's line, and falls back to the old line before it.
const opening = (
  speak: (elapsed: number) => { text: string } | null,
): string[] => {
  const texts: string[] = []
  for (let elapsed = 0; elapsed < 600; elapsed += 4) {
    const line = speak(elapsed)
    if (line && !texts.includes(line.text)) texts.push(line.text)
  }
  return texts
}
for (const choice of ['rebel', 'loyal'] as const) {
  assert.ok(
    opening((e) =>
      reefDialogue('A06.OPEN', e, 2, null, false, choice),
    ).includes(RAINBOW_ALLEGIANCE_OPENINGS[6][choice]),
  )
  assert.ok(
    opening((e) => glassDialogue('A07.OPEN', e, 2, false, choice)).includes(
      RAINBOW_ALLEGIANCE_OPENINGS[7][choice],
    ),
  )
  assert.ok(
    opening((e) =>
      palaceDialogue('A08.OPEN', e, 2, undefined, choice),
    ).includes(RAINBOW_ALLEGIANCE_OPENINGS[8][choice]),
  )
}
assert.ok(
  !opening((e) => reefDialogue('A06.OPEN', e, 2)).some((text) =>
    Object.values(RAINBOW_ALLEGIANCE_OPENINGS[6]).includes(text),
  ),
  'no allegiance line before the choice',
)

function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

// The attract demo flies both roads: an odd crew turns on the empire, an even crew stays the course.
const kept: Record<number, unknown> = {}
for (const [players, choice] of [
  [1, 'rebel'],
  [2, 'loyal'],
] as const) {
  const game = createRainbowPrincessPreview({
    players,
    demo: true,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
  })
  let sawReveal = false
  for (let frame = 0; frame < 200000 && game.snapshot.act !== 'S06'; frame++) {
    game.update(emptyInput())
    if (game.snapshot.resting !== null) {
      sawReveal = true
      assert.equal(game.snapshot.allegiance, null, 'no choice while resting')
    }
  }
  assert.ok(sawReveal, 'the crew rests at the memorial')
  assert.equal(game.snapshot.act, 'S06')
  assert.equal(
    game.snapshot.allegiance,
    choice,
    `${players}p chooses ${choice}`,
  )
  for (let i = 0; i < 400 && game.save === undefined; i++)
    game.update(emptyInput())
  game.update(emptyInput())
  const save = readRainbowSave(
    JSON.parse(JSON.stringify(game.save)),
    isRainbowCheckpoint,
  )
  assert.ok(save, 'Act VI keeps a save')
  assert.equal(save.checkpoint.act, 6)
  assert.equal(save.checkpoint.allegiance, choice, 'the save keeps the choice')
  kept[players] = save
}

// Continuing a saved flight restores the choice; an old save without one reads as no choice yet.
for (const players of [1, 2]) {
  const save = kept[players] as { checkpoint: { allegiance: string } }
  const game = createRainbowPrincessPreview({
    players: 1,
    demo: false,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
    resume: save,
  })
  for (let i = 0; i < 25; i++) game.update(emptyInput())
  const press = emptyInput()
  press.pressed.a = true
  game.update(press)
  assert.equal(game.snapshot.allegiance, save.checkpoint.allegiance)
}
{
  const old = JSON.parse(JSON.stringify(kept[1])) as {
    checkpoint: Record<string, unknown>
  }
  delete old.checkpoint.allegiance
  assert.equal(
    readRainbowSave(old, isRainbowCheckpoint)?.checkpoint.allegiance,
    null,
  )
  assert.equal(
    readRainbowSave(
      { ...old, checkpoint: { ...old.checkpoint, allegiance: 'traitor' } },
      isRainbowCheckpoint,
    ),
    null,
    'an unknown allegiance is not a save',
  )
}

console.log(
  'rainbow motherland: ok (reveal, flown choice, tie stays the course, both roads in the demo, saves and continues, Act VI-VIII openings)',
)
