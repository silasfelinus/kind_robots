import assert from 'node:assert/strict'
import {
  FINALE,
  FINALE_ENDING_FRAMES,
} from '../arcade/games/rainbowEclipseFinale'
import {
  RAINBOW_FAILURE,
  RAINBOW_REGIONS,
  failureLines,
} from '../arcade/games/rainbowFailure'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import {
  RAINBOW_ACT_KEYS,
  RAINBOW_SCORE,
  noteName,
  rainbowMusicFor,
} from '../arcade/games/rainbowScore'
import { parseLoop } from '../arcade/sound'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-012: the layered original score (each Act's key and figure, flying / guardian / boss
// layers at one tempo, the ending and the failure loops), the failure ending Lilt plays when the CONTINUE?
// countdown runs out (skippable after a beat, closing by itself), and credits that A skips to THE END.

assert.equal(noteName(60), 'C4')
assert.equal(noteName(69), 'A4')
assert.equal(noteName(49), 'C#3')

// Every loop parses, every track runs the same eight bars, and the layers stack within an Act.
assert.equal(RAINBOW_SCORE.acts.length, 9)
assert.equal(RAINBOW_ACT_KEYS.length, 9)
const loops = [
  ...RAINBOW_SCORE.acts.flatMap((act) => [act.flying, act.guardian, act.boss]),
  RAINBOW_SCORE.ending,
  RAINBOW_SCORE.failure,
]
for (const loop of loops) {
  const parsed = parseLoop(loop)
  assert.equal(parsed.length, 64, 'eight bars of eight steps')
  for (const track of loop.tracks)
    assert.equal(track.steps.trim().split(/\s+/).length, 64)
  assert.ok(parsed.notes.length > 0)
}
RAINBOW_SCORE.acts.forEach((act, i) => {
  assert.equal(act.flying.bpm, act.boss.bpm, `act ${i + 1} keeps one tempo`)
  assert.equal(act.guardian.bpm, act.flying.bpm)
  assert.ok(act.flying.tracks.length < act.guardian.tracks.length)
  assert.ok(act.guardian.tracks.length < act.boss.tracks.length)
  // The flying layers are still there under a guardian.
  assert.deepEqual(
    act.guardian.tracks.slice(0, act.flying.tracks.length),
    act.flying.tracks,
  )
})
const leads = new Set(
  RAINBOW_SCORE.acts.map((act) => act.flying.tracks[2]!.steps),
)
assert.equal(leads.size, 9, 'every Act has its own lead line')

// The moment picks the loop.
const moment = {
  act: 3,
  boss: false,
  guardian: false,
  ending: false,
  failure: false,
}
assert.equal(rainbowMusicFor(moment), RAINBOW_SCORE.acts[2]!.flying)
assert.equal(
  rainbowMusicFor({ ...moment, guardian: true }),
  RAINBOW_SCORE.acts[2]!.guardian,
)
assert.equal(
  rainbowMusicFor({ ...moment, boss: true, guardian: true }),
  RAINBOW_SCORE.acts[2]!.boss,
)
assert.equal(rainbowMusicFor({ ...moment, ending: true }), RAINBOW_SCORE.ending)
assert.equal(
  rainbowMusicFor({ ...moment, failure: true, ending: true }),
  RAINBOW_SCORE.failure,
)

// Lilt's failure lines.
const lines = failureLines(4, 1, 3)
assert.equal(lines.length, 3)
assert.ok(lines[0]!.includes(RAINBOW_REGIONS[3]))
assert.ok(lines[1]!.includes('1 rescue made'))
assert.ok(lines[2]!.includes('Act III'))
assert.ok(failureLines(9, 0, 9)[2]!.includes('the finale'))
assert.ok(failureLines(1, 0, null)[2]!.includes('Pinkwake waits'))

function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const create = (demo: boolean) =>
  createRainbowPrincessPreview({
    players: 1,
    demo,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
  })
const pressA = () => {
  const frame = emptyInput()
  frame.pressed.a = true
  frame.held.a = true
  return frame
}
const texts: string[] = []
const g = new Proxy({} as Record<string | symbol, unknown>, {
  get(target, key) {
    if (key in target) return target[key]
    if (key === 'fillText') return (text: string) => texts.push(String(text))
    return () => ({ addColorStop() {} })
  },
  set(target, key, value) {
    target[key] = value
    return true
  },
}) as unknown as CanvasRenderingContext2D

// The demo plays silent; a seated game plays Act I's flying layer, the same loop frame after frame.
assert.equal(create(true).music, null)
{
  const game = create(false)
  game.update(emptyInput())
  const first = game.music
  assert.equal(first, RAINBOW_SCORE.acts[0]!.flying)
  game.update(emptyInput())
  assert.equal(game.music, first, 'the same reference while it should go on')
}

// The failure ending: an idle crew falls, the countdown runs out, Lilt speaks, A ends it after a beat.
{
  const game = create(false)
  for (let i = 0; i < 40000 && !game.snapshot.continueLeft; i++)
    game.update(emptyInput())
  assert.ok(game.snapshot.continueLeft > 0, 'the idle crew falls')
  assert.equal(game.music, null, 'the countdown is silent')
  while (game.snapshot.continueLeft > 0) game.update(emptyInput())
  assert.equal(game.snapshot.failFrame, 0)
  assert.equal(game.over, false)
  assert.equal(game.music, RAINBOW_SCORE.failure)
  game.update(pressA())
  assert.equal(game.over, false, 'A waits for the beat')
  for (let i = 0; i < RAINBOW_FAILURE.lineFrames * 2; i++)
    game.update(emptyInput())
  texts.length = 0
  game.render(g)
  assert.ok(texts.includes('THE ECLIPSE HOLDS'))
  assert.ok(texts.some((text) => text.includes('Pinkwake Estuary')))
  assert.ok(texts.some((text) => text.startsWith('FINAL SCORE')))
  assert.ok(texts.includes('PRESS A'))
  game.update(pressA())
  assert.equal(game.over, true, 'A closes the run')
  assert.equal(game.music, null)
}

// Left alone, it closes by itself.
{
  const game = create(false)
  for (let i = 0; i < 40000 && !game.snapshot.continueLeft; i++)
    game.update(emptyInput())
  while (game.snapshot.continueLeft > 0) game.update(emptyInput())
  for (let i = 0; i < RAINBOW_FAILURE.holdFrames - 1; i++)
    game.update(emptyInput())
  assert.equal(game.over, false)
  game.update(emptyInput())
  assert.equal(game.over, true)
}

// The credits: A skips the rest to THE END (after a beat), and THE END still waits for its own A.
{
  const game = create(true)
  let skippedAt = -1
  for (let frame = 0; frame < 400000 && !game.over; frame++) {
    const stage = game.snapshot.stage
    if (stage === 'credits' && skippedAt < 0) {
      // Into the credits by more than the grace: skip.
      for (let i = 0; i < 90; i++) game.update(emptyInput())
      game.update(pressA())
      skippedAt = frame
      assert.equal(game.snapshot.stage, 'end', 'A skips to THE END')
      game.update(pressA())
      assert.equal(game.over, false, 'THE END waits its minimum')
      for (let i = 0; i < FINALE.endMinFrames; i++) game.update(emptyInput())
      game.update(pressA())
      assert.equal(game.over, true)
      break
    }
    game.update(emptyInput())
  }
  assert.ok(skippedAt >= 0, 'the demo reached the credits')
  assert.ok(FINALE_ENDING_FRAMES > 0)
}

console.log(
  `rainbow score: ok (9 Act keys x 3 layers + ending + failure, ${loops.length} loops parse; failure ending; credits skip)`,
)
