// MONSTRIQUE sound and music (conductor monstress-convention/t-015).
// Main-game standard item 11: original soundtrack, gameplay and UI cues,
// working volume/mute controls, gesture unlock and persistent settings.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { newCase, type CaseState } from '../monstressConvention/prologue'
import {
  DEFAULT_MONSTRIQUE_MIX,
  MONSTRIQUE_CUE_NOTES,
  MONSTRIQUE_THEMES,
  MonstriqueSound,
  monstriqueCuesFor,
  monstriqueMoodFor,
  parseMonstriqueMix,
  type MonstriqueMood,
} from '../monstrique/sound'

const read = (path: string) =>
  readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

assert.deepEqual(parseMonstriqueMix(null), DEFAULT_MONSTRIQUE_MIX)
assert.deepEqual(parseMonstriqueMix('not json'), DEFAULT_MONSTRIQUE_MIX)
assert.deepEqual(
  parseMonstriqueMix('{"master":2,"music":-1,"effects":0.3,"muted":true}'),
  { master: 1, music: 0, effects: 0.3, muted: true },
)
assert.equal(parseMonstriqueMix({ muted: 'yes' }).muted, false)

const base = newCase(3)
const at = (patch: Partial<CaseState>): CaseState => ({ ...base, ...patch })
assert.equal(monstriqueMoodFor(base, false), 'title')
assert.equal(monstriqueMoodFor(null, true), 'title')
assert.equal(monstriqueMoodFor(base, true), 'motel')
assert.equal(monstriqueMoodFor(at({ room: 'odette-room' }), true), 'crime')
assert.equal(monstriqueMoodFor(at({ room: 'city-map' }), true), 'city')
assert.equal(
  monstriqueMoodFor(at({ room: 'convention-center' }), true),
  'convention',
)
assert.equal(
  monstriqueMoodFor(at({ ending: 'lead-earned' }), true),
  'ending-lead',
)
assert.equal(
  monstriqueMoodFor(at({ ending: 'reckless' }), true),
  'ending-reckless',
)

assert.deepEqual(monstriqueCuesFor(base, at({ ending: 'reckless' })), [
  'ending',
])
assert.deepEqual(monstriqueCuesFor(base, at({ room: 'front-office' })), [
  'room',
])
assert.deepEqual(
  monstriqueCuesFor(
    at({ room: 'balcony' }),
    at({ room: 'odette-room', flags: ['odette-met'] }),
  ),
  ['room', 'ghost'],
)
assert.deepEqual(monstriqueCuesFor(base, at({ evidence: ['ice-timing'] })), [
  'clank',
  'evidence',
])
assert.deepEqual(
  monstriqueCuesFor(base, at({ inventory: ['camera', 'motel-key'] })),
  ['item'],
)
assert.deepEqual(monstriqueCuesFor(base, at({ rebuffs: 1 })), ['rebuff'])
assert.deepEqual(monstriqueCuesFor(base, at({ topics: ['shrine'] })), ['topic'])
assert.deepEqual(
  monstriqueCuesFor(
    base,
    at({ topics: ['shrine'], evidence: ['motel-photo'] }),
  ),
  ['evidence'],
  'a topic chime never stacks on a bigger cue',
)
assert.ok(
  monstriqueCuesFor(
    base,
    at({
      room: 'odette-room',
      flags: ['violet-met'],
      evidence: ['ice-timing'],
      inventory: ['camera', 'odette-purse'],
      rebuffs: 1,
    }),
  ).length <= 3,
)
assert.deepEqual(monstriqueCuesFor(base, base), [])

const moods = Object.keys(MONSTRIQUE_THEMES) as MonstriqueMood[]
assert.equal(moods.length, 9)
const leads = new Set<string>()
for (const mood of moods) {
  const theme = MONSTRIQUE_THEMES[mood]
  assert.equal(theme.chords.length, 4, mood)
  assert.equal(theme.lead.length, 16, mood)
  assert.equal(theme.bass.length, 16, mood)
  assert.ok(theme.bpm >= 60 && theme.bpm <= 160, mood)
  for (const note of [...theme.chords.flat(), ...theme.lead, ...theme.bass])
    assert.ok(note === -1 || (note >= 24 && note <= 96), mood + ' range')
  leads.add(theme.lead.join(','))
}
assert.equal(leads.size, moods.length, 'every mood has its own hook')
for (const notes of Object.values(MONSTRIQUE_CUE_NOTES))
  assert.ok(notes.length >= 2)

assert.equal(new MonstriqueSound().unlock(), false, 'no audio without a window')

class FakeParam {
  value = 0
  setTargetAtTime(value: number) {
    this.value = value
  }
  setValueAtTime() {}
  linearRampToValueAtTime() {}
  exponentialRampToValueAtTime() {}
}
class FakeNode {
  gain = new FakeParam()
  frequency = new FakeParam()
  Q = new FakeParam()
  type = ''
  connect() {}
  disconnect() {}
}
class FakeSource extends FakeNode {
  buffer: unknown = null
  loop = false
  onended: (() => void) | null = null
  start() {}
  stop() {}
}
class FakeContext {
  static latest: FakeContext
  state = 'suspended'
  currentTime = 1
  sampleRate = 8000
  destination = new FakeNode()
  oscillators = 0
  sources = 0
  constructor() {
    FakeContext.latest = this
  }
  createGain() {
    return new FakeNode()
  }
  createBiquadFilter() {
    return new FakeNode()
  }
  createOscillator() {
    this.oscillators++
    return new FakeSource()
  }
  createBufferSource() {
    this.sources++
    return new FakeSource()
  }
  createBuffer(_channels: number, length: number) {
    const data = new Float32Array(length)
    return { getChannelData: () => data }
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

const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { AudioContext: FakeContext },
})
const player = new MonstriqueSound()
const pump = () => (player as unknown as { pump(): void }).pump()
try {
  assert.equal(player.unlock(), true)
  const context = FakeContext.latest
  await Promise.resolve()
  assert.equal(context.state, 'running')
  assert.ok(context.sources >= 1, 'the rain bed starts')
  pump()
  const scored = context.oscillators
  assert.ok(scored > 0, 'the title theme schedules notes')
  player.play(['evidence', 'item'])
  assert.ok(context.oscillators > scored, 'cues play on the effects bus')
  player.setMix({ ...DEFAULT_MONSTRIQUE_MIX, muted: true })
  const muted = context.oscillators
  player.play(['ghost'])
  context.currentTime += 1
  pump()
  assert.equal(context.oscillators, muted, 'mute silences music and cues')
  player.setMix({ ...DEFAULT_MONSTRIQUE_MIX })
  player.setEnabled(false)
  player.play(['ghost'])
  pump()
  assert.equal(context.oscillators, muted, 'Sound off silences everything')
  player.setEnabled(true)
  player.setMood('crime')
  context.currentTime += 1
  pump()
  assert.ok(context.oscillators > muted, 'music resumes in the new mood')
  player.dispose()
  assert.equal(context.state, 'closed')
} finally {
  if (previousWindow)
    Object.defineProperty(globalThis, 'window', previousWindow)
  else delete (globalThis as { window?: unknown }).window
}

const scene = read(
  'components/monstress-convention/monstress-convention-scene.vue',
)
assert.match(scene, /@pointerdown\.capture="sound\.unlock\(\)"/)
assert.match(scene, /sound\.play\(monstriqueCuesFor\(previous, next\)\)/)
assert.match(scene, /sound\.setMood\(mood\)/)
assert.match(scene, /kit\.settings\.sound/)
const front = read('components/monstrexx/monstrexx-front.vue')
assert.match(front, /data-testid="monstrique-volume"/)
assert.match(front, /@pointerdown\.capture="sound\.unlock\(\)"/)
assert.match(front, /sound\.setMood\('title'\)/)
for (const page of ['pages/play/monstrique.vue', 'pages/admin/monstrique.vue'])
  assert.match(read(page), /onBeforeUnmount\(\(\) => sound\.stop\(\)\)/, page)
assert.match(
  read('stores/monstriqueSoundStore.ts'),
  /localStorage\.setItem\(MONSTRIQUE_MIX_KEY/,
)

console.log('Monstrique sound: mix, moods, cues, themes, engine and wiring: OK')
