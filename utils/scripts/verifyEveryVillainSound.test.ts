import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { trainingState } from '../everyVillainTactics/training'
import {
  DEFAULT_TACTICS_MIX,
  TACTICS_CUE_NOTES,
  TACTICS_MIX_KEY,
  TACTICS_THEMES,
  TacticsSound,
  parseTacticsMix,
  tacticsAudioFrame,
  tacticsCuesFor,
  tacticsMoodFor,
  tacticsNoteHz,
  type TacticsAudioFrame,
  type TacticsMood,
} from '../everyVillainTactics/sound'

const moods: TacticsMood[] = [
  'title',
  'planning',
  'battle',
  'danger',
  'cinematic',
  'victory',
  'defeat',
]
assert.deepEqual(Object.keys(TACTICS_THEMES).sort(), [...moods].sort())
assert.equal(
  new Set(moods.map((mood) => JSON.stringify(TACTICS_THEMES[mood].lead))).size,
  moods.length,
  'each moment needs its own original melody',
)
for (const mood of moods) {
  const theme = TACTICS_THEMES[mood]
  assert.equal(theme.chords.length, 4)
  assert.equal(theme.lead.length, 16)
  assert.ok(theme.bpm >= 60 && theme.bpm <= 160)
  assert.ok(theme.energy > 0 && theme.energy <= 1)
  assert.ok(theme.lead.some((note) => note >= 0))
  for (const pitch of [...theme.chords.flat(), ...theme.lead]) {
    assert.ok(pitch === -1 || (pitch >= 24 && pitch <= 96))
  }
}
assert.equal(Math.round(tacticsNoteHz(69)), 440)
assert.equal(Object.keys(TACTICS_CUE_NOTES).length, 13)
assert.ok(Object.values(TACTICS_CUE_NOTES).every((notes) => notes.length > 0))

assert.deepEqual(parseTacticsMix(null), DEFAULT_TACTICS_MIX)
assert.deepEqual(parseTacticsMix('{invalid'), DEFAULT_TACTICS_MIX)
assert.deepEqual(
  parseTacticsMix('{ "master": 2, "music": -3, "muted": true }'),
  {
    master: 1,
    music: 0,
    effects: DEFAULT_TACTICS_MIX.effects,
    muted: true,
  },
)
assert.deepEqual(parseTacticsMix({ effects: Number.NaN, muted: 'yes' }), {
  ...DEFAULT_TACTICS_MIX,
})
assert.equal(TACTICS_MIX_KEY, 'kr-every-villain-tactics:audio-v1')

const initial = tacticsAudioFrame(trainingState(41), null, null)
assert.equal(tacticsMoodFor(initial), 'planning')
const frame = (patch: Partial<TacticsAudioFrame> = {}) => ({
  ...initial,
  ...patch,
})
assert.equal(tacticsMoodFor(frame({ turn: 2 })), 'battle')
assert.equal(tacticsMoodFor(frame({ scene: 'intro' })), 'cinematic')
assert.equal(tacticsMoodFor(frame({ squadHp: 0 })), 'danger')
assert.equal(tacticsMoodFor(frame({ phase: 'victory' })), 'victory')
assert.equal(tacticsMoodFor(frame({ phase: 'defeat' })), 'defeat')
assert.equal(tacticsMoodFor(frame({ screen: 'settings' })), 'title')

assert.deepEqual(tacticsCuesFor(initial, frame({ turn: 2 })), ['turn'])
assert.deepEqual(tacticsCuesFor(initial, frame({ selected: 'other' })), [
  'select',
])
assert.deepEqual(tacticsCuesFor(initial, frame({ positions: 'different' })), [
  'move',
])
assert.deepEqual(
  tacticsCuesFor(initial, frame({ impactSerial: 1, impactHit: true })),
  ['shot-hit'],
)
assert.deepEqual(
  tacticsCuesFor(initial, frame({ impactSerial: 1, impactHit: false })),
  ['shot-miss'],
)
assert.deepEqual(
  tacticsCuesFor(initial, frame({ squadHp: initial.squadHp - 1 })),
  ['damage'],
)
assert.deepEqual(tacticsCuesFor(initial, frame({ rescued: 1 })), ['rescue'])
assert.deepEqual(tacticsCuesFor(initial, frame({ flags: 1 })), ['objective'])
assert.deepEqual(
  tacticsCuesFor(initial, frame({ log: 'Backdraft uses Heat Shield.' })),
  ['power'],
)
assert.deepEqual(tacticsCuesFor(initial, frame({ scene: 'reveal' })), ['scene'])
assert.deepEqual(
  tacticsCuesFor(initial, frame({ phase: 'victory', turn: 2 })),
  ['victory'],
)
assert.deepEqual(tacticsCuesFor(initial, frame({ stage: 'science-wing' })), [
  'stage',
])
assert.deepEqual(
  tacticsCuesFor(initial, frame({ screen: 'settings', turn: 2 })),
  [],
  'opening settings cannot accidentally produce gameplay sounds',
)

const sound = new TacticsSound()
assert.equal(sound.unlocked, false)
sound.setMood('battle')
sound.setEnabled(false)
sound.play(['shot-hit'])
sound.setEnabled(true)
sound.setMix({ master: 0.5, music: 0.2, effects: 0.8, muted: true })
sound.play(['shot-hit', 'power', 'turn'])
assert.equal(sound.unlock(), false, 'Node and SSR remain silent')
sound.setHidden(true)
sound.setHidden(false)
sound.dispose()
assert.equal(sound.unlocked, false)

const page = readFileSync('pages/admin/every-villain-tactics.vue', 'utf8')
assert.match(page, /@pointerdown\.capture="onAudioGesture"/)
assert.match(page, /@keydown\.capture="onAudioGesture"/)
assert.match(page, /tacticsAudioFrame\(store\.state/)
assert.match(page, /tacticsCuesFor\(previous, next\)/)
assert.match(page, /tacticsMoodFor\(next\)/)
assert.match(page, /visibilitychange/)
assert.match(page, /sound\.stop\(\)/)
assert.match(page, /sound\.loadMix\(\)/)
assert.match(page, /kit\.settings\.sound/)
assert.match(page, /sound\.setEnabled\(choice !== 'off'\)/)

const menu = readFileSync(
  'components/every-villain-tactics/every-villain-front-menu.vue',
  'utf8',
)
assert.match(menu, /<EveryVillainSoundMixer \/>/)
assert.match(menu, /sound\.resetMix\(\)/)
const mixer = readFileSync(
  'components/every-villain-tactics/every-villain-sound-mixer.vue',
  'utf8',
)
assert.match(mixer, /tactics-audio-mute/)
assert.match(mixer, /type="range"/)
assert.match(mixer, /aria-label/)
const store = readFileSync('stores/everyVillainSoundStore.ts', 'utf8')
assert.match(store, /localStorage\.setItem\(TACTICS_MIX_KEY/)
assert.match(store, /window\.localStorage\.getItem\(TACTICS_MIX_KEY/)
assert.match(store, /player\?\.dispose\(\)/)
assert.match(store, /player\?\.setEnabled\(on\)/)

console.log('Every Villain Tactics original score, SFX and settings passed')
