import assert from 'node:assert/strict'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import {
  PLUMBER_ACTION_CUES,
  playPlumberCue,
} from '../arcade/games/savePlumberMusic'
import { emptyInput } from '../arcade/types'

const cues = Object.values(PLUMBER_ACTION_CUES)
assert.equal(
  new Set(cues.map((cue) => JSON.stringify(cue.notes))).size,
  cues.length,
  'each gameplay event has its own audible identity',
)
for (const { notes } of cues) {
  for (const note of notes) {
    assert.ok(note.freq > 0 && note.freq < 2400)
    assert.ok(note.dur > 0 && note.dur <= 0.5)
    assert.ok((note.vol ?? 0) > 0 && (note.vol ?? 0) <= 0.1)
  }
}

const fallback: string[] = []
for (const cue of Object.keys(
  PLUMBER_ACTION_CUES,
) as (keyof typeof PLUMBER_ACTION_CUES)[]) {
  playPlumberCue({ play: (name) => fallback.push(name) }, cue)
}
assert.deepEqual(
  fallback,
  cues.map((cue) => cue.fallback),
  'each cue supports the cabinet stub without custom synthesis',
)

const sounds: unknown[] = []
const cols = 44
const row = '..@..o..0...[...K...+...1...*..........G'.padEnd(cols, '.')
const run = createSavePlumberPreview(
  {
    rng: () => 0.5,
    sound: {
      play() {},
      playNotes(notes) {
        sounds.push(notes)
      },
    },
    demo: false,
    hiScore: 0,
  },
  {
    customLevel: {
      code: '1-1',
      name: 'Audio Lab',
      rows: [
        ...Array.from({ length: 20 }, () => '.'.repeat(cols)),
        row,
        ...Array.from({ length: 3 }, () => '#'.repeat(cols)),
      ],
    },
  },
)
const count = (cue: keyof typeof PLUMBER_ACTION_CUES) =>
  sounds.filter((notes) => notes === PLUMBER_ACTION_CUES[cue].notes).length
for (let i = 0; i < 360 && !count('gear'); i++) {
  const input = emptyInput()
  input.held.right = true
  run.update(input)
}
for (const cue of [
  'token',
  'key',
  'bolt',
  'checkpoint',
  'heart',
  'power',
  'gear',
] as const) {
  assert.equal(count(cue), 1, cue + ' fires once on its real interaction')
}
assert.equal(run.boltsOpened, 1)
assert.equal(run.mode, 'play')
const damage = run as unknown as { hurt(dir: number): void }
run.immune = 0
damage.hurt(-1)
damage.hurt(-1)
assert.equal(count('hurt'), 1, 'invulnerability prevents repeat damage cues')
run.immune = 0
run.power = null
run.hearts = 1
damage.hurt(-1)
assert.equal(count('hurt'), 1, 'fatal damage does not stack a hurt cue')
assert.equal(count('death'), 1, 'fatal damage plays only the death cue')

console.log(
  'Save the Plumber: distinct original cues, real triggers and fallback verified',
)
