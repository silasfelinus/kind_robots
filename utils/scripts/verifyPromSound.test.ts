import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { startFullAcademy } from '../cometAcademy/rules'
import {
  DEFAULT_PROM_MIX,
  PROM_CUE_NOTES,
  PROM_MIX_KEY,
  PROM_THEMES,
  PromSound,
  parsePromMix,
  promAudioFrame,
  promCuesFor,
  promMoodFor,
  promNoteHz,
  type PromAudioFrame,
  type PromMood,
} from '../cometAcademy/sound'

const moods: PromMood[] = [
  'title',
  'campus',
  'discovery',
  'patrol',
  'crisis',
  'finale',
  'ending',
]
assert.deepEqual(Object.keys(PROM_THEMES).sort(), [...moods].sort())
assert.equal(
  new Set(moods.map((mood) => JSON.stringify(PROM_THEMES[mood].melody))).size,
  moods.length,
  'every location and chapter needs a distinctive original melody',
)
for (const mood of moods) {
  const theme = PROM_THEMES[mood]
  assert.equal(theme.chords.length, 4)
  assert.equal(theme.melody.length, 16)
  assert.ok(theme.bpm >= 60 && theme.bpm <= 160)
  assert.ok(theme.pulse > 0 && theme.pulse <= 1)
  for (const pitch of [...theme.chords.flat(), ...theme.melody]) {
    assert.ok(pitch === -1 || (pitch >= 24 && pitch <= 96))
  }
}
assert.equal(Math.round(promNoteHz(69)), 440)
assert.equal(Object.keys(PROM_CUE_NOTES).length, 12)
assert.ok(Object.values(PROM_CUE_NOTES).every((notes) => notes.length > 0))

assert.deepEqual(parsePromMix(null), DEFAULT_PROM_MIX)
assert.deepEqual(parsePromMix('not json'), DEFAULT_PROM_MIX)
assert.deepEqual(parsePromMix({ master: 2, music: -1, muted: true }), {
  master: 1,
  music: 0,
  effects: DEFAULT_PROM_MIX.effects,
  muted: true,
})
assert.deepEqual(parsePromMix({ muted: 'yes', effects: Number.NaN }), {
  ...DEFAULT_PROM_MIX,
})
assert.equal(PROM_MIX_KEY, 'kr-prom-of-doom:audio-v1')

const blank = promAudioFrame(null)
assert.equal(promMoodFor(blank), 'title')
const frame = (patch: Partial<PromAudioFrame> = {}) => ({
  ...blank,
  seed: 17,
  phase: 'campus' as const,
  day: 1,
  ...patch,
})
const base = frame()
assert.equal(promMoodFor(base), 'campus')
assert.equal(promMoodFor(frame({ phase: 'debrief' })), 'discovery')
assert.equal(promMoodFor(frame({ phase: 'dispatch' })), 'patrol')
assert.equal(promMoodFor(frame({ danger: 12 })), 'crisis')
assert.equal(promMoodFor(frame({ phase: 'finale' })), 'finale')
assert.equal(promMoodFor(frame({ phase: 'ending' })), 'ending')

assert.deepEqual(promCuesFor(blank, base), ['new-term'])
assert.deepEqual(promCuesFor(base, frame({ day: 2 })), ['school-bell'])
assert.deepEqual(promCuesFor(base, frame({ contacts: 1 })), ['recruit'])
assert.deepEqual(promCuesFor(base, frame({ injuries: 1 })), ['injury'])
assert.deepEqual(promCuesFor(base, frame({ clues: 1 })), ['investigate'])
assert.deepEqual(promCuesFor(base, frame({ villain: 'mastermind' })), [
  'villain',
])
assert.deepEqual(promCuesFor(base, frame({ revelations: 1 })), [
  'villain',
])
assert.deepEqual(promCuesFor(base, frame({ reports: 1 })), ['success'])
assert.deepEqual(
  promCuesFor(base, frame({ reports: 1, failedReports: 1 })),
  ['setback'],
)
assert.deepEqual(
  promCuesFor(base, frame({ reports: 1, danger: 3 })),
  ['success'],
  'the report grade, not unrelated threat level, determines the audio verdict',
)
assert.deepEqual(promCuesFor(base, frame({ phase: 'dispatch' })), [
  'dispatch',
])
assert.deepEqual(
  promCuesFor(base, frame({ phase: 'finale', reports: 2 })),
  ['finale'],
)
assert.deepEqual(promCuesFor(base, frame({ phase: 'ending' })), [
  'ending',
])
assert.deepEqual(
  promCuesFor(base, frame({ scene: 'new', lastLog: 'A choice matters' })),
  ['choice'],
)
assert.deepEqual(
  promCuesFor(base, frame({ lastLog: 'One choice saved a life.' })),
  ['choice'],
)
assert.deepEqual(promCuesFor(base, base), [])

const run = startFullAcademy('kinetic', 9)
const snapshot = promAudioFrame(run)
assert.equal(snapshot.seed, 9)
assert.equal(snapshot.day, 1)

const player = new PromSound()
assert.equal(player.unlocked, false)
player.setMood('patrol')
player.setMix({ master: 0, music: 1, effects: 1, muted: true })
player.play(['school-bell', 'success'])
assert.equal(player.unlock(), false, 'SSR and Node must stay silent')
player.setHidden(true)
player.setHidden(false)
player.dispose()
assert.equal(player.unlocked, false)

const page = readFileSync('pages/play/comet-city-academy.vue', 'utf8')
assert.match(page, /@pointerdown\.capture="onPromSoundGesture"/)
assert.match(page, /@keydown\.capture="onPromSoundGesture"/)
assert.match(page, /promAudioFrame\(store\.run\)/)
assert.match(page, /promCuesFor\(previous, next\)/)
assert.match(page, /promMoodFor\(next\)/)
assert.match(page, /visibilitychange/)
assert.match(page, /sound\.stop\(\)/)
assert.match(page, /sound\.loadMix\(\)/)
const consolePage = readFileSync(
  'components/play/cometAcademy/AcademyConsoleScreens.vue',
  'utf8',
)
assert.match(consolePage, /<AcademySoundMixer \/>/)
const opening = readFileSync(
  'components/play/cometAcademy/AcademyOpening.vue',
  'utf8',
)
assert.match(opening, /academy-opening-settings/)
assert.match(opening, /<AcademySoundMixer \/>/)
const mixer = readFileSync(
  'components/play/cometAcademy/AcademySoundMixer.vue',
  'utf8',
)
assert.match(mixer, /prom-audio-mute/)
assert.match(mixer, /type="range"/)
assert.match(mixer, /aria-label/)
const store = readFileSync('stores/promSoundStore.ts', 'utf8')
assert.match(store, /window\.localStorage\.getItem\(PROM_MIX_KEY\)/)
assert.match(store, /window\.localStorage\.setItem\(PROM_MIX_KEY/)
assert.match(store, /player\?\.dispose\(\)/)

console.log('Prom of Doom original sound, event cues and mixer checks passed')
