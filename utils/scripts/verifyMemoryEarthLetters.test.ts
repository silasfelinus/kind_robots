import assert from 'node:assert/strict'
import {
  LETTER_CHOICES,
  chooseLetter,
  letterArchiveEcho,
  newLetterProgress,
  restoreLetterProgress,
} from '../memoryDungeon/earthLetters'

const scenes = Object.keys(LETTER_CHOICES) as (keyof typeof LETTER_CHOICES)[]
assert.equal(new Set(scenes.flatMap((scene) => LETTER_CHOICES[scene])).size, 12)
for (const scene of scenes) {
  for (const choice of LETTER_CHOICES[scene]) {
    const original = newLetterProgress()
    const chosen = chooseLetter(original, scene, choice)
    assert.equal(chosen.decisions[scene], choice)
    assert.deepEqual(original, newLetterProgress())
    assert.equal(chooseLetter(chosen, scene, choice), chosen, 'replay is inert')
    for (const conflicting of LETTER_CHOICES[scene])
      assert.equal(chooseLetter(chosen, scene, conflicting), chosen)
    assert.deepEqual(
      restoreLetterProgress(JSON.parse(JSON.stringify(chosen))),
      chosen,
    )
    assert.equal(chooseLetter(original, scene, 'forged'), original)
  }
}
assert.deepEqual(restoreLetterProgress(undefined), newLetterProgress())
for (const invalid of [
  { version: 2, decisions: {} },
  { version: 1, decisions: { e04Archive: 'forged' } },
  { version: 1, decisions: { unknown: 'earth-letter-copy' } },
  { version: 1, decisions: { e04Return: null } },
  { version: 1, decisions: ['earth-return-offer'] },
])
  assert.equal(restoreLetterProgress(invalid), null)

const echoes = [
  'A drawer opens for a person who might come back.',
  'A date stamped on paper repeats every three days.',
  'Your phone shows an envelope you never opened.',
  'The cabinet offers no explanation of what you missed.',
]
for (let i = 0; i < 4; i++) {
  const state =
    i === 3
      ? newLetterProgress()
      : chooseLetter(
          newLetterProgress(),
          'e03Letter',
          LETTER_CHOICES.e03Letter[i]!,
        )
  assert.equal(letterArchiveEcho(state), echoes[i])
}
let combinations = 0
for (const letter of LETTER_CHOICES.e03Letter)
  for (const witness of [...LETTER_CHOICES.e03Witness, undefined])
    for (const archive of LETTER_CHOICES.e04Archive)
      for (const returned of LETTER_CHOICES.e04Return) {
        let state = chooseLetter(newLetterProgress(), 'e03Letter', letter)
        if (witness) state = chooseLetter(state, 'e03Witness', witness)
        state = chooseLetter(state, 'e04Archive', archive)
        state = chooseLetter(state, 'e04Return', returned)
        assert.deepEqual(restoreLetterProgress(state), state)
        assert.equal(Object.keys(state.decisions).length, witness ? 4 : 3)
        combinations++
      }
assert.equal(combinations, 108)
