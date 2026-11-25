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
assert.deepEqual(promCuesFor(base, frame({ revelations: 1 })), ['villain'])
assert.deepEqual(promCuesFor(base, frame({ reports: 1 })), ['success'])
assert.deepEqual(promCuesFor(base, frame({ reports: 1, failedReports: 1 })), [
  'setback',
])
assert.deepEqual(
  promCuesFor(base, frame({ reports: 1, danger: 3 })),
  ['success'],
  'the report grade, not unrelated threat level, determines the audio verdict',
)
assert.deepEqual(promCuesFor(base, frame({ phase: 'dispatch' })), ['dispatch'])
assert.deepEqual(promCuesFor(base, frame({ phase: 'finale', reports: 2 })), [
  'finale',
])
assert.deepEqual(promCuesFor(base, frame({ phase: 'ending' })), ['ending'])
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

// Exercise real scheduler decisions with a deterministic WebAudio stand-in.
class FakeGain {
  gain = {
    setTargetAtTime() {},
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
  }
  connect() {}
  disconnect() {}
}

class FakeTone {
  type = 'sine'
  frequency = { setValueAtTime() {} }
  onended: (() => void) | null = null
  cancelled = false
  connect() {}
  disconnect() {}
  start() {}
  stop(at?: number) {
    if (at === undefined) this.cancelled = true
  }
}

class FakeContext {
  static latest: FakeContext
  state = 'suspended'
  currentTime = 1
  destination = new FakeGain()
  tones: FakeTone[] = []

  constructor() {
    FakeContext.latest = this
  }

  createGain() {
    return new FakeGain()
  }

  createOscillator() {
    const tone = new FakeTone()
    this.tones.push(tone)
    return tone
  }

  resume() {
    this.state = 'running'
    return Promise.resolve()
  }

  suspend() {
    this.state = 'suspended'
    return Promise.resolve()
  }

  close() {
    this.state = 'closed'
    return Promise.resolve()
  }
}

const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { AudioContext: FakeContext },
})
const activePlayer = new PromSound()
const pump = () => (activePlayer as unknown as { pump(): void }).pump()
try {
  assert.equal(activePlayer.unlock(), true)
  const ctx = FakeContext.latest
  pump()
  assert.ok(ctx.tones.length > 0, 'unlocked score schedules notes')
  const firstScore = [...ctx.tones]
  activePlayer.setMood('patrol')
  assert.ok(firstScore.every((tone) => tone.cancelled))
  pump()
  assert.ok(ctx.tones.length > firstScore.length)
  activePlayer.play(['investigate'])
  activePlayer.setMix({ ...DEFAULT_PROM_MIX, muted: true })
  assert.ok(ctx.tones.every((tone) => tone.cancelled))
  const mutedCount = ctx.tones.length
  ctx.currentTime += 10
  pump()
  activePlayer.play(['ending'])
  assert.equal(ctx.tones.length, mutedCount, 'mute schedules no voices')
  activePlayer.setMix({ ...DEFAULT_PROM_MIX, music: 0 })
  pump()
  assert.equal(ctx.tones.length, mutedCount)
  activePlayer.play(['choice'])
  assert.ok(ctx.tones.length > mutedCount, 'SFX remain independently enabled')
  const effectsCount = ctx.tones.length
  activePlayer.setMix({ ...DEFAULT_PROM_MIX, effects: 0 })
  assert.ok(ctx.tones.slice(mutedCount).every((tone) => tone.cancelled))
  activePlayer.play(['choice'])
  assert.equal(ctx.tones.length, effectsCount)
  pump()
  assert.ok(ctx.tones.length > effectsCount, 'music resumes independently')
  activePlayer.setHidden(true)
  assert.equal(ctx.state, 'suspended')
  assert.ok(ctx.tones.every((tone) => tone.cancelled))
  const hiddenCount = ctx.tones.length
  activePlayer.play(['injury'])
  pump()
  assert.equal(ctx.tones.length, hiddenCount)
  activePlayer.setHidden(false)
  assert.equal(ctx.state, 'running')
  pump()
  assert.ok(ctx.tones.length > hiddenCount)
  ctx.state = 'suspended'
  const suspendedCount = ctx.tones.length
  activePlayer.play(['success'])
  pump()
  assert.equal(ctx.tones.length, suspendedCount)
  assert.ok(ctx.tones.every((tone) => tone.cancelled))
  activePlayer.unlock()
  pump()
  assert.ok(ctx.tones.length > suspendedCount)
  activePlayer.dispose()
  assert.equal(ctx.state, 'closed')
  assert.ok(ctx.tones.every((tone) => tone.cancelled))
  assert.equal(activePlayer.unlocked, false)
} finally {
  activePlayer.dispose()
  if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow)
  else Reflect.deleteProperty(globalThis, 'window')
}

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
