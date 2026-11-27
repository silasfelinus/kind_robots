import assert from 'node:assert/strict'
import { RoyalSound } from './audio.ts'

const contexts = []
const timers = new Map()
let timerId = 0

class FakeGain {
  gain = {
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
  }
  connect() {}
  disconnect() {}
}

class FakeContext {
  state = 'suspended'
  currentTime = 0
  destination = {}
  gains = []
  notes = 0
  resumes = 0
  rejectResume = false

  constructor() {
    contexts.push(this)
  }

  createGain() {
    const gain = new FakeGain()
    this.gains.push(gain)
    return gain
  }

  createOscillator() {
    return {
      frequency: { value: 0 },
      connect() {},
      disconnect() {},
      start: () => {
        this.notes++
      },
      stop() {},
    }
  }

  async resume() {
    this.resumes++
    if (this.rejectResume) throw new Error('interruption persists')
    this.state = 'running'
  }

  async close() {
    this.state = 'closed'
  }
}

const previous = {
  AudioContext: globalThis.AudioContext,
  setInterval: globalThis.setInterval,
  clearInterval: globalThis.clearInterval,
}
globalThis.AudioContext = FakeContext
globalThis.setInterval = (callback) => {
  const id = ++timerId
  timers.set(id, callback)
  return id
}
globalThis.clearInterval = (id) => timers.delete(id)

const sound = new RoyalSound()
try {
  assert.equal(await sound.unlock(), true)
  const first = contexts[0]
  assert.equal(first.resumes, 1)
  assert.equal(timers.size, 1)
  assert.equal(await sound.unlock(), true)
  assert.equal(first.resumes, 1, 'ordinary gestures do not restart audio')
  assert.equal(timers.size, 1)

  for (const tick of timers.values()) tick()
  assert.ok(first.notes > 0, 'music schedules real oscillator voices')
  const before = first.notes
  sound.play('cast')
  assert.equal(first.notes, before + 2)

  sound.setPrefs({ music: 0.4, effects: 0.7, muted: false })
  sound.setScene('court', true)
  assert.equal(first.gains[0].gain.value, 0)
  assert.equal(first.gains[1].gain.value, 0.7)
  sound.setHidden(true)
  assert.equal(first.gains[1].gain.value, 0)
  sound.setHidden(false)
  sound.setScene('lake', false)
  assert.equal(first.gains[0].gain.value, 0.4)

  first.state = 'interrupted'
  first.rejectResume = true
  assert.equal(await sound.unlock(), false)
  first.rejectResume = false
  assert.equal(await sound.unlock(), true, 'next gesture retries interruption')
  assert.equal(first.resumes, 3)
  assert.equal(timers.size, 1)

  first.state = 'suspended'
  assert.equal(await sound.unlock(), true)
  assert.equal(first.resumes, 4)
  assert.equal(timers.size, 1)

  first.state = 'closed'
  assert.equal(await sound.unlock(), true, 'closed context is recreated')
  assert.equal(contexts.length, 2)
  assert.equal(timers.size, 1)
  assert.equal(contexts[1].gains[0].gain.value, 0.4)
  assert.equal(contexts[1].gains[1].gain.value, 0.7)
  sound.setPrefs({ music: 0.4, effects: 0.7, muted: true })
  sound.play('catch')
  assert.equal(contexts[1].notes, 0, 'muted cues create no voices')

  sound.dispose()
  assert.equal(timers.size, 0)
  assert.equal(contexts[1].state, 'closed')
} finally {
  sound.dispose()
  Object.assign(globalThis, previous)
}

console.log('Ruler Hooked audio interruption and lifecycle self-test passed.')
