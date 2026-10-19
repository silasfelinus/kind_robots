// /utils/arcade/soundtrackMixer.ts
//
// The Arcade soundtrack mixer (kind_robots#3606). It wraps the oscillator
// sound object (utils/arcade/sound.ts) and adds recorded music from the
// soundtrack manifest (utils/arcade/soundtrackBriefs.ts):
//
// - Gesture-safe: nothing is fetched, decoded or started until unlock() runs
//   from a player gesture and the base object has created its AudioContext.
// - Recorded tracks play only once their file has actually loaded and
//   decoded. A missing or broken file falls back to the cabinet's oscillator
//   loop, and is not fetched again this visit.
// - Music changes crossfade; important stingers duck the music under them.
// - stopCabinetMusic() and dispose() cut every loop at once and invalidate
//   any load still in flight, so no loop survives leaving a cabinet.
//
// Dependency-free and DOM-free apart from the injected loader, so the unit
// tests drive it with a fake AudioContext.

import {
  clampVolume,
  presetSeconds,
  type ArcadeSound,
  type ArcadeSoundName,
  type MusicLoop,
  type RecordedLoop,
} from './sound'
import {
  arcadeAudioCandidatePath,
  arcadeAudioTheme,
  VERIFIED_ARCADE_AUDIO_ASSETS,
  type ArcadeAudioAsset,
  type ArcadeCabinetAudioTheme,
  type ArcadeEventCue,
  type ArcadeMusicScene,
} from './soundtrackBriefs'

export type SoundtrackLoader = (url: string) => Promise<ArrayBuffer | null>

export type MusicSource = 'silent' | 'loading' | 'recorded' | 'oscillator'

export type ArcadeSoundtrack = ArcadeSound & {
  /** Play `scene` for the current cabinet; `fallback` is its oscillator loop. */
  startCabinetMusic: (
    scene: ArcadeMusicScene,
    fallback: MusicLoop | null,
  ) => void
  /** Cut all music now and drop any track still loading. */
  stopCabinetMusic: () => void
  /** A recorded event cue when one is loaded, else its oscillator preset. */
  playCue: (cue: ArcadeEventCue) => void
  setGame: (game: string) => void
  readonly game: string
  readonly theme: ArcadeCabinetAudioTheme
  readonly musicSource: MusicSource
  readonly unlocked: boolean
  readonly volume: number
}

export type SoundtrackOptions = {
  game: string
  volume?: number
  assets?: readonly ArcadeAudioAsset[]
  load?: SoundtrackLoader
}

/** Seconds the music takes to drop under a stinger, and to come back. */
export const DUCK_ATTACK = 0.03
export const DUCK_RELEASE = 0.35

/** Presets loud or important enough to duck the music (not every shot). */
export const DUCKING_SOUNDS: ReadonlySet<ArcadeSoundName> = new Set([
  'boom',
  'die',
  'start',
  'level',
  'extra',
  'warn',
  'zuzuSuccess',
  'zuzuDeath',
])

/** The oscillator preset an event cue falls back to. */
export const CUE_FALLBACK: Record<ArcadeEventCue, ArcadeSoundName> = {
  pickup: 'pickup',
  danger: 'warn',
  impact: 'boom',
  victory: 'level',
}

/** Music level: the player's volume, the track's level, ducking and mute. */
export function arcadeMusicGain(input: {
  volume: number
  level: number
  duckDepth: number
  ducked: boolean
  muted: boolean
}): number {
  if (input.muted) return 0
  const duck = input.ducked ? clampVolume(input.duckDepth, 1) : 1
  return clampVolume(input.volume, 0) * clampVolume(input.level, 0) * duck
}

export async function fetchArcadeAudio(
  url: string,
): Promise<ArrayBuffer | null> {
  if (typeof fetch === 'undefined') return null
  try {
    const response = await fetch(url, { credentials: 'same-origin' })
    if (!response.ok) return null
    return await response.arrayBuffer()
  } catch {
    return null
  }
}

type Playing = { source: AudioBufferSourceNode; gain: GainNode; path: string }

export function createArcadeSoundtrack(
  base: ArcadeSound,
  options: SoundtrackOptions,
): ArcadeSoundtrack {
  const assets = options.assets ?? VERIFIED_ARCADE_AUDIO_ASSETS
  const load = options.load ?? fetchArcadeAudio
  let game = options.game
  let theme = arcadeAudioTheme(game)
  let volume = clampVolume(options.volume, 1)
  let unlocked = false
  let disposed = false
  let source: MusicSource = 'silent'
  let generation = 0
  let desired: { scene: ArcadeMusicScene; fallback: MusicLoop | null } | null =
    null
  let ctx: AudioContext | null = null
  let recordedBus: GainNode | null = null
  let oscillatorBus: GainNode | null = null
  let current: Playing | null = null
  let duckUntil = 0
  const tails = new Set<Playing>()
  const pendingBuffers = new Map<string, Promise<AudioBuffer | null>>()
  const loaded = new Map<string, AudioBuffer>()
  const failed = new Set<string>()

  const levelFor = (recorded: boolean, ducked: boolean) =>
    arcadeMusicGain({
      volume,
      level: recorded ? theme.music : 1,
      duckDepth: theme.duckDepth,
      ducked,
      muted: base.muted,
    })

  const buses = () =>
    [
      [recordedBus, true],
      [oscillatorBus, false],
    ] as const

  /** Set both music buses, ducked now if a stinger is still sounding. */
  const syncLevels = () => {
    base.setVolume(volume * theme.sfx)
    if (!ctx) return
    const now = ctx.currentTime
    const ducked = now < duckUntil
    for (const [bus, recorded] of buses()) {
      if (!bus) continue
      bus.gain.cancelScheduledValues(now)
      bus.gain.setValueAtTime(levelFor(recorded, ducked), now)
      if (ducked)
        bus.gain.setTargetAtTime(
          levelFor(recorded, false),
          duckUntil,
          DUCK_RELEASE / 3,
        )
    }
  }

  const duck = (seconds: number) => {
    if (!ctx || seconds <= 0 || base.muted) return
    const now = ctx.currentTime
    duckUntil = Math.max(duckUntil, now + seconds)
    for (const [bus, recorded] of buses()) {
      if (!bus) continue
      bus.gain.cancelScheduledValues(now)
      bus.gain.setTargetAtTime(levelFor(recorded, true), now, DUCK_ATTACK / 3)
      bus.gain.setTargetAtTime(
        levelFor(recorded, false),
        duckUntil,
        DUCK_RELEASE / 3,
      )
    }
  }

  /** Adopt the base object's context, which exists only after a gesture. */
  const ensureBuses = (): boolean => {
    if (disposed) return false
    if (ctx && recordedBus && oscillatorBus) return true
    const audio = base.context()
    if (!audio) return false
    ctx = audio
    recordedBus = audio.createGain()
    recordedBus.connect(audio.destination)
    oscillatorBus = audio.createGain()
    oscillatorBus.connect(audio.destination)
    base.routeMusic(oscillatorBus)
    syncLevels()
    return true
  }

  const release = (playing: Playing) => {
    tails.delete(playing)
    try {
      playing.source.disconnect()
      playing.gain.disconnect()
    } catch {
      // Already disconnected.
    }
  }

  const fadeOut = (playing: Playing, seconds: number) => {
    if (seconds <= 0 || !ctx) {
      try {
        playing.source.stop()
      } catch {
        // Already stopped.
      }
      release(playing)
      return
    }
    const now = ctx.currentTime
    tails.add(playing)
    playing.gain.gain.cancelScheduledValues(now)
    playing.gain.gain.setValueAtTime(playing.gain.gain.value, now)
    playing.gain.gain.linearRampToValueAtTime(0, now + seconds)
    playing.source.onended = () => release(playing)
    playing.source.stop(now + seconds + 0.05)
  }

  /** Fade the recorded loop out; with 0 seconds, also cut every fading tail. */
  const stopRecorded = (seconds: number) => {
    if (current) fadeOut(current, seconds)
    current = null
    if (seconds <= 0) for (const tail of [...tails]) fadeOut(tail, 0)
  }

  const playOscillator = (fallback: MusicLoop | null) => {
    stopRecorded(theme.fadeSeconds)
    if (fallback) {
      base.startMusic(fallback)
      source = 'oscillator'
    } else {
      base.stopMusic()
      source = 'silent'
    }
  }

  const playRecorded = (
    buffer: AudioBuffer,
    path: string,
    loop?: RecordedLoop,
  ) => {
    if (!ctx || !recordedBus) return
    base.stopMusic()
    stopRecorded(theme.fadeSeconds)
    const now = ctx.currentTime
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(1, now + theme.fadeSeconds)
    gain.connect(recordedBus)
    const node = ctx.createBufferSource()
    node.buffer = buffer
    node.loop = true
    // A game's own recording may loop between two points (past its decoder padding, say).
    if (
      loop?.loopEnd !== undefined &&
      loop.loopEnd > (loop.loopStart ?? 0) &&
      loop.loopEnd <= buffer.duration
    ) {
      node.loopStart = loop.loopStart ?? 0
      node.loopEnd = loop.loopEnd
    }
    node.connect(gain)
    node.start(now)
    current = { source: node, gain, path }
    source = 'recorded'
  }

  /** Load and decode a file once; null (and never retried) when it fails. */
  const bufferFor = (path: string): Promise<AudioBuffer | null> => {
    const ready = loaded.get(path)
    if (ready) return Promise.resolve(ready)
    const known = pendingBuffers.get(path)
    if (known) return known
    const audio = ctx
    const pending = (async () => {
      if (!audio) return null
      const bytes = await load(path)
      if (!bytes) return null
      try {
        return await audio.decodeAudioData(bytes)
      } catch {
        return null
      }
    })().then((buffer) => {
      pendingBuffers.delete(path)
      if (buffer) loaded.set(path, buffer)
      else failed.add(path)
      return buffer
    })
    pendingBuffers.set(path, pending)
    return pending
  }

  const candidateFor = (scene: ArcadeMusicScene): string | null => {
    const scenes: ArcadeMusicScene[] =
      scene === 'level-2' ? ['level-2', 'level'] : [scene]
    for (const each of scenes) {
      const path = arcadeAudioCandidatePath(game, each, assets)
      if (path && !failed.has(path)) return path
    }
    return null
  }

  /** A game's own recording of its loop, unless it already failed to load. */
  const recordedOf = (fallback: MusicLoop | null): RecordedLoop | null =>
    fallback?.recorded && !failed.has(fallback.recorded.src)
      ? fallback.recorded
      : null

  const resolve = () => {
    if (disposed || !desired) return
    const { scene, fallback } = desired
    const own = recordedOf(fallback)
    const path = own?.src ?? candidateFor(scene)
    if (!path) {
      generation += 1
      playOscillator(fallback)
      return
    }
    if (current?.path === path) {
      generation += 1
      source = 'recorded'
      return
    }
    if (!unlocked || !ensureBuses()) {
      source = 'loading'
      return
    }
    const token = ++generation
    if (!current && source !== 'oscillator') source = 'loading'
    void bufferFor(path).then((buffer) => {
      if (disposed || token !== generation) return
      if (buffer) playRecorded(buffer, path, own ?? undefined)
      else resolve()
    })
  }

  const stopCabinetMusic = () => {
    generation += 1
    desired = null
    stopRecorded(0)
    base.stopMusic()
    source = 'silent'
  }

  const playCueBuffer = (buffer: AudioBuffer) => {
    if (!ctx) return
    const node = ctx.createBufferSource()
    const gain = ctx.createGain()
    gain.gain.value = clampVolume(volume * theme.sfx, 0)
    node.buffer = buffer
    node.connect(gain)
    gain.connect(ctx.destination)
    node.onended = () => {
      node.disconnect()
      gain.disconnect()
    }
    node.start()
    duck(buffer.duration)
  }

  const play = (name: ArcadeSoundName) => {
    base.play(name)
    if (DUCKING_SOUNDS.has(name)) duck(presetSeconds(name))
  }

  const startCabinetMusic = (
    scene: ArcadeMusicScene,
    fallback: MusicLoop | null,
  ) => {
    if (disposed) return
    desired = { scene, fallback }
    resolve()
  }

  base.setVolume(volume * theme.sfx)

  return {
    play,
    playNotes: (notes) => base.playNotes(notes),
    startMusic: (loop) => startCabinetMusic('level', loop),
    stopMusic: stopCabinetMusic,
    startCabinetMusic,
    stopCabinetMusic,
    playCue(cue) {
      if (disposed || base.muted) return
      const path = arcadeAudioCandidatePath(game, cue, assets)
      const ready = path ? loaded.get(path) : undefined
      if (ready && unlocked && ensureBuses()) {
        playCueBuffer(ready)
        return
      }
      if (path && !failed.has(path) && unlocked && ensureBuses())
        void bufferFor(path)
      play(CUE_FALLBACK[cue])
    },
    unlock() {
      if (disposed) return
      base.unlock()
      if (!base.context()) return
      unlocked = true
      if (ensureBuses()) resolve()
    },
    get muted() {
      return base.muted
    },
    setMuted(next) {
      base.setMuted(next)
      syncLevels()
    },
    setVolume(next) {
      volume = clampVolume(next, volume)
      syncLevels()
    },
    context: () => base.context(),
    routeMusic: (node) => base.routeMusic(node),
    setGame(next) {
      if (next === game) return
      stopCabinetMusic()
      game = next
      theme = arcadeAudioTheme(game)
      syncLevels()
    },
    get game() {
      return game
    },
    get theme() {
      return theme
    },
    get musicSource() {
      return source
    },
    get unlocked() {
      return unlocked
    },
    get volume() {
      return volume
    },
    dispose() {
      if (disposed) return
      stopCabinetMusic()
      disposed = true
      recordedBus?.disconnect()
      oscillatorBus?.disconnect()
      recordedBus = null
      oscillatorBus = null
      ctx = null
      pendingBuffers.clear()
      loaded.clear()
      base.dispose()
    },
  }
}
