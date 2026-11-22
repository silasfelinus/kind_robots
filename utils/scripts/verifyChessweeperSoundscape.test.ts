import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

const source = readFileSync(
  fileURLToPath(new URL('../../public/chessweeper/soundscape.js', import.meta.url)),
  'utf8',
)
const windowEvents = new Map<string, (event: { detail?: Record<string, unknown> }) => void>()
const documentEvents = new Map<string, () => void>()
let contexts = 0
let oscillators = 0
let scheduled = 0
let closed = 0
let suspended = 0
const clocks: Array<() => void> = []
class MockGain {
  gain = {
    value: 0,
    setTargetAtTime: (_value: number) => {},
    setValueAtTime: (_value: number) => {},
    exponentialRampToValueAtTime: (_value: number) => {},
  }
  connect() {
    return this
  }
}
class MockOscillator {
  type = ''
  frequency = { value: 0 }
  connect() {
    return this
  }
  start() {
    scheduled++
  }
  stop() {}
}
class MockAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  constructor() {
    contexts++
  }
  createGain() {
    return new MockGain()
  }
  createOscillator() {
    oscillators++
    return new MockOscillator()
  }
  resume() {
    this.state = 'running'
    return Promise.resolve()
  }
  suspend() {
    suspended++
    this.state = 'suspended'
    return Promise.resolve()
  }
  close() {
    closed++
    return Promise.resolve()
  }
}
const doc = {
  hidden: false,
  documentElement: { dataset: { realm: 'sugar' } },
  addEventListener: (name: string, callback: () => void) => {
    documentEvents.set(name, callback)
  },
}
runInNewContext(source, {
  document: doc,
  window: {
    AudioContext: MockAudioContext,
    addEventListener: (
      name: string,
      callback: (event: { detail?: Record<string, unknown> }) => void,
    ) => windowEvents.set(name, callback),
    __fusionTest: { get: () => ({ over: false }) },
  },
  setInterval: (fn: () => void) => {
    clocks.push(fn)
    return 1
  },
  clearInterval: () => {},
})
assert.equal(contexts, 0, 'audio must not autoplay before a human gesture')
windowEvents.get('chessweeper:fx')?.({ detail: { kind: 'capture' } })
assert.equal(oscillators, 0, 'no audio context from an event alone')
documentEvents.get('pointerdown')?.()
assert.equal(contexts, 1, 'first pointer gesture unlocks audio')
assert.ok(scheduled > 0, 'real music notes are scheduled')
const afterStart = scheduled
windowEvents.get('chessweeper:fx')?.({ detail: { kind: 'capture' } })
assert.ok(scheduled > afterStart, 'combat effects make actual sound')
documentEvents.get('keydown')?.()
assert.equal(contexts, 1, 'repeated gestures reuse the mixer')
windowEvents.get('chessweeper:settings')?.({
  detail: { sound: false, music: false, musicVolume: 0, effectsVolume: 0 },
})
const mutedAt = scheduled
clocks[0]?.()
windowEvents.get('chessweeper:fx')?.({ detail: { kind: 'mine' } })
assert.equal(scheduled, mutedAt, 'music and SFX mute independently')
windowEvents.get('chessweeper:settings')?.({
  detail: { sound: true, music: true, musicVolume: 0.4, effectsVolume: 0.7 },
})
doc.documentElement.dataset.realm = 'ashen'
clocks[0]?.()
assert.ok(scheduled > mutedAt, 'new world schedules a new musical identity')
doc.hidden = true
documentEvents.get('visibilitychange')?.()
assert.equal(suspended, 1, 'hidden tabs suspend audio')
windowEvents.get('pagehide')?.({})
assert.equal(closed, 1, 'leaving the route closes audio resources')

const page = readFileSync(
  fileURLToPath(new URL('../../public/chessweeper/index.html', import.meta.url)),
  'utf8',
)
const progression = readFileSync(
  fileURLToPath(new URL('../../public/chessweeper/progression.js', import.meta.url)),
  'utf8',
)
assert.ok(page.includes('src="/chessweeper/soundscape.js"'))
for (const token of [
  'musicVolume',
  'effectsVolume',
  'chessweeper:settings',
  'chessweeper:sound',
]) {
  assert.ok(progression.includes(token))
}
console.log('chessweeper gesture-safe soundscape and three scores: ok')
