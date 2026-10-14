// /utils/scripts/verifyArcadeSoundtrackMixer.test.ts
//
// The Arcade soundtrack mixer (kind_robots#3606) against a fake AudioContext:
// no playback before a gesture, recorded tracks only once their file loads,
// oscillator fallback for missing or broken files, crossfades, ducking math,
// volume/mute, and every loop cut when the player leaves a cabinet.
import assert from 'node:assert/strict'
import {
  createArcadeSound,
  presetSeconds,
  type ArcadeSound,
  type ArcadeSoundName,
  type MusicLoop,
} from '../arcade/sound'
import {
  CUE_FALLBACK,
  DUCKING_SOUNDS,
  arcadeMusicGain,
  createArcadeSoundtrack,
  type SoundtrackLoader,
} from '../arcade/soundtrackMixer'
import {
  DEFAULT_ARCADE_AUDIO_THEME,
  arcadeAudioTheme,
  type ArcadeAudioAsset,
} from '../arcade/soundtrackBriefs'

type ParamEvent = [string, number, number?]

class FakeParam {
  value: number
  events: ParamEvent[] = []
  constructor(value: number) {
    this.value = value
  }
  setValueAtTime(value: number, time: number) {
    this.events.push(['set', value, time])
    this.value = value
    return this
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.events.push(['linear', value, time])
    return this
  }
  exponentialRampToValueAtTime(value: number, time: number) {
    this.events.push(['exp', value, time])
    return this
  }
  setTargetAtTime(value: number, time: number) {
    this.events.push(['target', value, time])
    return this
  }
  cancelScheduledValues(time: number) {
    this.events.push(['cancel', 0, time])
    return this
  }
}

class FakeNode {
  outputs = new Set<unknown>()
  connect(node: unknown) {
    this.outputs.add(node)
    return node
  }
  disconnect() {
    this.outputs.clear()
  }
}

class FakeGain extends FakeNode {
  gain = new FakeParam(1)
}

class FakeSource extends FakeNode {
  buffer: unknown = null
  loop = false
  startedAt: number | null = null
  stopAt: number | null = null
  onended: (() => void) | null = null
  constructor(private ctx: FakeContext) {
    super()
  }
  start(time = this.ctx.currentTime) {
    this.startedAt = time
  }
  stop(time = this.ctx.currentTime) {
    this.stopAt = time
  }
  /** Audible at the context's current time. */
  get playing() {
    return (
      this.startedAt !== null &&
      (this.stopAt === null || this.stopAt > this.ctx.currentTime)
    )
  }
}

class FakeContext {
  currentTime = 0
  state = 'running'
  destination = new FakeNode()
  gains: FakeGain[] = []
  sources: FakeSource[] = []
  createGain() {
    const gain = new FakeGain()
    this.gains.push(gain)
    return gain
  }
  createBufferSource() {
    const source = new FakeSource(this)
    this.sources.push(source)
    return source
  }
  async decodeAudioData(bytes: ArrayBuffer) {
    if (bytes.byteLength === 0) throw new Error('undecodable')
    return { duration: bytes.byteLength / 10 }
  }
}

type FakeBase = ArcadeSound & {
  ctx: FakeContext | null
  played: ArcadeSoundName[]
  oscillatorLoop: MusicLoop | null
  startCalls: number
  volumes: number[]
  routed: unknown
  disposed: boolean
}

function fakeBase(): FakeBase {
  let muted = false
  const base: FakeBase = {
    ctx: null,
    played: [],
    oscillatorLoop: null,
    startCalls: 0,
    volumes: [],
    routed: null,
    disposed: false,
    play(name) {
      if (!muted && base.ctx) base.played.push(name)
    },
    playNotes() {},
    startMusic(loop) {
      base.startCalls += 1
      base.oscillatorLoop = loop
    },
    stopMusic() {
      base.oscillatorLoop = null
    },
    unlock() {
      base.ctx ??= new FakeContext()
    },
    get muted() {
      return muted
    },
    setMuted(next) {
      muted = next
    },
    setVolume(volume) {
      base.volumes.push(volume)
    },
    context: () => base.ctx as unknown as AudioContext | null,
    routeMusic(node) {
      base.routed = node
    },
    dispose() {
      base.disposed = true
    },
  }
  return base
}

const LOOP: MusicLoop = { bpm: 120, tracks: [{ steps: 'C4 E4 G4 -' }] }
const BOSS_LOOP: MusicLoop = { bpm: 150, tracks: [{ steps: 'A3 . A3 .' }] }

function asset(
  game: ArcadeAudioAsset['game'],
  cue: ArcadeAudioAsset['cue'],
): ArcadeAudioAsset {
  return {
    game,
    cue,
    path: `/images/arcade/audio/${game}/${cue}.ogg`,
    approvedAt: '2026-10-14T00:00:00Z',
    verifiedAt: '2026-10-14T00:10:00Z',
    contentSha256: 'b'.repeat(64),
  }
}

const ASSETS = [
  asset('gloom-invaders', 'level'),
  asset('gloom-invaders', 'boss'),
  asset('shared', 'danger'),
]

function loader(missing: string[] = [], broken: string[] = []) {
  const calls: string[] = []
  const load: SoundtrackLoader = async (url) => {
    calls.push(url)
    if (missing.includes(url)) return null
    return new ArrayBuffer(broken.includes(url) ? 0 : 480)
  }
  return { calls, load }
}

const eventsOf = (gain: FakeGain, kind: string): ParamEvent[] =>
  gain.gain.events.filter(([each]) => each === kind)

const flush = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
}

// --- pure math ----------------------------------------------------------------
{
  const input = { volume: 0.8, level: 0.5, duckDepth: 0.4 }
  assert.equal(arcadeMusicGain({ ...input, ducked: false, muted: false }), 0.4)
  assert.ok(
    Math.abs(arcadeMusicGain({ ...input, ducked: true, muted: false }) - 0.16) <
      1e-9,
  )
  assert.equal(arcadeMusicGain({ ...input, ducked: true, muted: true }), 0)
  assert.equal(
    arcadeMusicGain({ ...input, volume: 4, ducked: false, muted: false }),
    0.5,
    'volume is clamped to 1',
  )
  assert.equal(
    arcadeMusicGain({
      ...input,
      volume: Number.NaN,
      ducked: false,
      muted: false,
    }),
    0,
  )
  assert.ok(presetSeconds('boom') > 0.3 && presetSeconds('boom') < 0.4)
  assert.ok(DUCKING_SOUNDS.has('die') && !DUCKING_SOUNDS.has('shoot'))
  assert.equal(CUE_FALLBACK.danger, 'warn')
  assert.deepEqual(
    arcadeAudioTheme('not-a-cabinet'),
    DEFAULT_ARCADE_AUDIO_THEME,
  )
  assert.ok(arcadeAudioTheme('prize-show-panic').duckDepth < 0.5)
}

// --- the real oscillator object never makes a context without a gesture -------
{
  const sound = createArcadeSound()
  sound.startMusic(LOOP)
  sound.play('blip')
  sound.setVolume(0.3)
  assert.equal(sound.context(), null, 'no AudioContext before unlock')
  sound.dispose()
}

// --- no playback or fetching before unlock -------------------------------------
{
  const base = fakeBase()
  const { calls, load } = loader()
  const mixer = createArcadeSoundtrack(base, {
    game: 'gloom-invaders',
    assets: ASSETS,
    load,
  })
  mixer.startCabinetMusic('level', LOOP)
  mixer.play('boom')
  mixer.playCue('danger')
  await flush()
  assert.equal(base.ctx, null)
  assert.equal(calls.length, 0, 'nothing is fetched before a gesture')
  assert.equal(base.startCalls, 0, 'a recorded track waits for unlock')
  assert.equal(mixer.musicSource, 'loading')
  assert.equal(mixer.unlocked, false)

  mixer.unlock()
  assert.equal(mixer.unlocked, true)
  assert.equal(
    base.routed,
    base.ctx!.gains[1],
    'oscillators route via the mixer',
  )
  await flush()
  assert.deepEqual(calls, ['/images/arcade/audio/gloom-invaders/level.ogg'])
  const [track] = base.ctx!.sources
  assert.ok(
    track?.playing && track.loop,
    'the recorded loop plays after unlock',
  )
  assert.equal(mixer.musicSource, 'recorded')
  assert.equal(base.oscillatorLoop, null)
  mixer.dispose()
}

// --- a cabinet with no recorded track keeps its oscillator music ---------------
{
  const base = fakeBase()
  const { calls, load } = loader()
  const mixer = createArcadeSoundtrack(base, {
    game: 'brick-bloom',
    assets: ASSETS,
    load,
  })
  mixer.startCabinetMusic('level', LOOP)
  assert.equal(base.oscillatorLoop, LOOP)
  assert.equal(mixer.musicSource, 'oscillator')
  mixer.unlock()
  await flush()
  assert.equal(calls.length, 0)
  assert.equal(base.ctx!.sources.length, 0)
  mixer.dispose()
}

// --- missing and undecodable files fall back, and are not fetched again --------
for (const broken of [false, true]) {
  const base = fakeBase()
  const path = '/images/arcade/audio/gloom-invaders/level.ogg'
  const { calls, load } = broken ? loader([], [path]) : loader([path])
  const mixer = createArcadeSoundtrack(base, {
    game: 'gloom-invaders',
    assets: ASSETS,
    load,
  })
  mixer.unlock()
  mixer.startCabinetMusic('level', LOOP)
  await flush()
  assert.equal(base.oscillatorLoop, LOOP, 'fallback to oscillator music')
  assert.equal(mixer.musicSource, 'oscillator')
  assert.equal(base.ctx!.sources.length, 0)
  mixer.stopCabinetMusic()
  mixer.startCabinetMusic('level', LOOP)
  await flush()
  assert.equal(calls.length, 1, 'a failed file is not fetched again')
  assert.equal(base.oscillatorLoop, LOOP)
  mixer.dispose()
}

// --- level-2 uses the level recording when it has none of its own ---------------
{
  const base = fakeBase()
  const { calls, load } = loader()
  const mixer = createArcadeSoundtrack(base, {
    game: 'gloom-invaders',
    assets: ASSETS,
    load,
  })
  mixer.unlock()
  mixer.startCabinetMusic('level-2', LOOP)
  await flush()
  assert.deepEqual(calls, ['/images/arcade/audio/gloom-invaders/level.ogg'])
  mixer.dispose()
}

// --- scene changes crossfade; the same track is not restarted -------------------
{
  const base = fakeBase()
  const { load } = loader()
  const mixer = createArcadeSoundtrack(base, {
    game: 'gloom-invaders',
    assets: ASSETS,
    load,
  })
  const fade = mixer.theme.fadeSeconds
  mixer.unlock()
  mixer.startCabinetMusic('level', LOOP)
  await flush()
  const ctx = base.ctx!
  const level = ctx.sources[0]!
  mixer.startCabinetMusic('level', LOOP)
  await flush()
  assert.equal(ctx.sources.length, 1, 'same scene keeps the same loop')

  ctx.currentTime = 10
  mixer.startCabinetMusic('boss', BOSS_LOOP)
  await flush()
  const boss = ctx.sources[1]!
  assert.ok(boss.playing && level.playing, 'both sound during the crossfade')
  assert.ok(Math.abs(level.stopAt! - (10 + fade + 0.05)) < 1e-9)
  const bossGain = [...boss.outputs][0] as FakeGain
  assert.deepEqual(bossGain.gain.events.slice(0, 2), [
    ['set', 0, 10],
    ['linear', 1, 10 + fade],
  ])
  ctx.currentTime = 10 + fade + 0.1
  assert.ok(!level.playing && boss.playing, 'one loop once the fade is done')
  mixer.dispose()
}

// --- leaving a cabinet cuts every loop, even mid-crossfade ----------------------
{
  const base = fakeBase()
  const { load } = loader()
  const mixer = createArcadeSoundtrack(base, {
    game: 'gloom-invaders',
    assets: ASSETS,
    load,
  })
  mixer.unlock()
  mixer.startCabinetMusic('level', LOOP)
  await flush()
  mixer.startCabinetMusic('boss', BOSS_LOOP)
  await flush()
  const ctx = base.ctx!
  assert.equal(ctx.sources.filter((source) => source.playing).length, 2)
  mixer.stopCabinetMusic()
  assert.equal(
    ctx.sources.filter((source) => source.playing).length,
    0,
    'no loop survives leaving',
  )
  assert.equal(base.oscillatorLoop, null)
  assert.equal(mixer.musicSource, 'silent')
  mixer.dispose()
  assert.equal(base.disposed, true)
  mixer.startCabinetMusic('level', LOOP)
  mixer.unlock()
  await flush()
  assert.equal(ctx.sources.length, 2, 'a disposed mixer starts nothing')
}

// --- a load that finishes after leaving never starts a loop ---------------------
{
  const base = fakeBase()
  let finish: (bytes: ArrayBuffer | null) => void = () => {}
  const mixer = createArcadeSoundtrack(base, {
    game: 'gloom-invaders',
    assets: ASSETS,
    load: () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  })
  mixer.unlock()
  mixer.startCabinetMusic('level', LOOP)
  await flush()
  mixer.stopCabinetMusic()
  finish(new ArrayBuffer(480))
  await flush()
  assert.equal(base.ctx!.sources.length, 0)
  assert.equal(base.oscillatorLoop, null)
  mixer.dispose()
}

// --- ducking, volume and mute ---------------------------------------------------
{
  const base = fakeBase()
  const { load } = loader()
  const mixer = createArcadeSoundtrack(base, {
    game: 'gloom-invaders',
    assets: ASSETS,
    load,
    volume: 0.8,
  })
  const theme = mixer.theme
  assert.equal(base.volumes.at(-1), 0.8 * theme.sfx)
  mixer.unlock()
  const [recordedBus, oscillatorBus] = base.ctx!.gains as [FakeGain, FakeGain]
  assert.equal(recordedBus.gain.value, 0.8 * theme.music)
  assert.equal(oscillatorBus.gain.value, 0.8)

  recordedBus.gain.events = []
  mixer.play('shoot')
  assert.deepEqual(recordedBus.gain.events, [], 'ordinary shots do not duck')
  mixer.play('boom')
  const targets = eventsOf(recordedBus, 'target')
  assert.ok(
    Math.abs(targets[0]![1] - 0.8 * theme.music * theme.duckDepth) < 1e-9,
  )
  assert.equal(targets[1]![1], 0.8 * theme.music)
  assert.ok(Math.abs(targets[1]![2]! - presetSeconds('boom')) < 1e-9)
  assert.deepEqual(base.played, ['shoot', 'boom'])

  mixer.setVolume(0.5)
  assert.equal(base.volumes.at(-1), 0.5 * theme.sfx)
  assert.equal(mixer.volume, 0.5)
  mixer.setMuted(true)
  assert.equal(mixer.muted, true)
  const sets = eventsOf(recordedBus, 'set')
  assert.equal(sets.at(-1)![1], 0, 'muted music is silent')
  recordedBus.gain.events = []
  mixer.play('boom')
  assert.deepEqual(recordedBus.gain.events, [], 'no ducking while muted')
  mixer.dispose()
}

// --- event cues: oscillator preset until the recording has loaded ---------------
{
  const base = fakeBase()
  const { calls, load } = loader()
  const mixer = createArcadeSoundtrack(base, {
    game: 'zuzu-ghost-trail',
    assets: ASSETS,
    load,
  })
  mixer.unlock()
  mixer.playCue('danger')
  assert.deepEqual(base.played, ['warn'])
  await flush()
  assert.deepEqual(calls, ['/images/arcade/audio/shared/danger.ogg'])
  mixer.playCue('danger')
  const cue = base.ctx!.sources.at(-1)!
  assert.ok(cue.startedAt !== null && !cue.loop, 'the recorded cue plays once')
  assert.deepEqual(base.played, ['warn'])
  mixer.playCue('pickup')
  assert.deepEqual(base.played, ['warn', 'pickup'])
  mixer.dispose()
}

// --- switching cabinets stops the old cabinet's music and theme -----------------
{
  const base = fakeBase()
  const { load } = loader()
  const mixer = createArcadeSoundtrack(base, {
    game: 'gloom-invaders',
    assets: ASSETS,
    load,
  })
  mixer.unlock()
  mixer.startCabinetMusic('level', LOOP)
  await flush()
  mixer.setGame('prize-show-panic')
  assert.equal(base.ctx!.sources.filter((source) => source.playing).length, 0)
  assert.equal(
    mixer.theme.duckDepth,
    arcadeAudioTheme('prize-show-panic').duckDepth,
  )
  mixer.dispose()
}

console.log('verifyArcadeSoundtrackMixer: ok')
