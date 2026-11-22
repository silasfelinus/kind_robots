import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

const source = readFileSync(
  fileURLToPath(
    new URL('../../public/chessweeper/soundscape.js', import.meta.url),
  ),
  'utf8',
)
const windowEvents = new Map<
  string,
  (event: { detail?: Record<string, unknown> }) => void
>()
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
  fileURLToPath(
    new URL('../../public/chessweeper/index.html', import.meta.url),
  ),
  'utf8',
)
const progression = readFileSync(
  fileURLToPath(
    new URL('../../public/chessweeper/progression.js', import.meta.url),
  ),
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

const rendererSource = readFileSync(
  fileURLToPath(
    new URL('../chessweeper/renderOriginalScores.mjs', import.meta.url),
  ),
  'utf8',
)
const renderScore = runInNewContext(
  rendererSource.replaceAll('export ', '') + '\nrenderChessweeperScore',
) as (world: string, variant: string) => Uint8Array
for (const world of ['sugar', 'ashen', 'jackpot']) {
  for (const variant of ['stage', 'finale']) {
    const asset = readFileSync(
      fileURLToPath(
        new URL(
          `../../public/chessweeper/music/${world}-${variant}.wav`,
          import.meta.url,
        ),
      ),
    )
    assert.equal(asset.toString('ascii', 0, 4), 'RIFF')
    assert.equal(asset.toString('ascii', 8, 12), 'WAVE')
    assert.equal(asset.readUInt16LE(22), 1, 'mono loop')
    assert.equal(asset.readUInt32LE(24), 22050, '44.1k-derived sample rate')
    assert.equal(asset.readUInt16LE(34), 16, '16-bit PCM')
    assert.deepEqual(
      asset,
      Buffer.from(renderScore(world, variant)),
      `${world} ${variant} must be reproducible from its original score`,
    )
  }
}

let chapter = 0
let sampleStarts = 0
let sampleStops = 0
const played: Array<{ loop: boolean }> = []
const fetched: string[] = []
const sampleEvents = new Map<string, (event?: unknown) => void>()
const sampleDocumentEvents = new Map<string, () => void>()
class MockSampleSource {
  loop = false
  buffer = null
  connect() {
    return this
  }
  start() {
    sampleStarts++
    played.push({ loop: this.loop })
  }
  stop() {
    sampleStops++
  }
}
class MockSampleContext extends MockAudioContext {
  decodeAudioData() {
    return Promise.resolve({ duration: 8 })
  }
  createBufferSource() {
    return new MockSampleSource()
  }
}
const sampleDoc = {
  hidden: false,
  documentElement: { dataset: { realm: 'sugar' } },
  addEventListener: (name: string, callback: () => void) => {
    sampleDocumentEvents.set(name, callback)
  },
}
runInNewContext(source, {
  document: sampleDoc,
  window: {
    AudioContext: MockSampleContext,
    __fusionTest: { get: () => ({ over: false }) },
    __chessweeperCampaign: { current: () => ({ chapter }) },
    fetch: (url: string) => {
      fetched.push(url)
      return Promise.resolve({
        ok: !url.includes('jackpot'),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      })
    },
    addEventListener: (name: string, callback: () => void) => {
      sampleEvents.set(name, callback)
    },
  },
  setInterval: () => 1,
  clearInterval: () => {},
})
assert.equal(fetched.length, 0, 'recorded music never fetches before gesture')
sampleDocumentEvents.get('pointerdown')?.()
const settle = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve()
}
await settle()
assert.equal(fetched[0], '/chessweeper/music/sugar-stage.wav')
assert.equal(sampleStarts, 1, 'loaded score begins after gesture')
assert.ok(
  played.every((entry) => entry.loop),
  'recorded scores loop',
)

chapter = 3
sampleEvents.get('chessweeper:state')?.()
await settle()
assert.equal(fetched[1], '/chessweeper/music/sugar-finale.wav')
assert.equal(sampleStarts, 2, 'final chapter receives a separate score')
assert.ok(sampleStops >= 1, 'previous score stops during crossfade')

sampleDoc.documentElement.dataset.realm = 'ashen'
chapter = 0
sampleEvents.get('chessweeper:state')?.()
await settle()
assert.equal(fetched[2], '/chessweeper/music/ashen-stage.wav')
assert.equal(sampleStarts, 3, 'world switching loads a distinct score')

sampleDoc.documentElement.dataset.realm = 'jackpot'
sampleEvents.get('chessweeper:state')?.()
await settle()
assert.equal(fetched[3], '/chessweeper/music/jackpot-stage.wav')
assert.equal(sampleStarts, 3, 'missing music keeps the synthesized fallback')
sampleEvents.get('pagehide')?.()
assert.ok(sampleStops >= 3, 'route exit stops playing buffers')

console.log('chessweeper six original loops, crossfades and fallback: ok')
