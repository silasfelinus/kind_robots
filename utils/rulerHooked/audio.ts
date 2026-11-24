export type RoyalTheme = 'title' | 'lake' | 'night' | 'court' | 'ending'
export type RoyalCue =
  'cast' | 'catch' | 'escape' | 'petition' | 'decree' | 'finale'

export interface RoyalAudioPrefs {
  music: number
  effects: number
  muted: boolean
}

export const ROYAL_AUDIO_DEFAULTS: RoyalAudioPrefs = {
  music: 0.28,
  effects: 0.55,
  muted: false,
}

export function cleanRoyalAudioPrefs(value: unknown): RoyalAudioPrefs {
  const input =
    value && typeof value === 'object'
      ? (value as Partial<RoyalAudioPrefs>)
      : {}
  const level = (n: unknown, fallback: number) =>
    typeof n === 'number' && Number.isFinite(n)
      ? Math.min(1, Math.max(0, n))
      : fallback
  return {
    music: level(input.music, ROYAL_AUDIO_DEFAULTS.music),
    effects: level(input.effects, ROYAL_AUDIO_DEFAULTS.effects),
    muted: input.muted === true,
  }
}

type Note = readonly [midi: number, beats: number]
interface Theme {
  beat: number
  melody: readonly Note[]
  bass: readonly number[]
}

export const ROYAL_THEMES: Record<RoyalTheme, Theme> = {
  title: {
    beat: 0.43,
    melody: [
      [72, 1],
      [76, 1],
      [79, 2],
      [74, 1],
      [77, 1],
      [81, 2],
      [76, 1],
      [79, 1],
      [84, 2],
      [81, 1],
      [77, 1],
      [72, 2],
    ],
    bass: [48, 53, 45, 55],
  },
  lake: {
    beat: 0.57,
    melody: [
      [67, 2],
      [72, 1],
      [74, 1],
      [76, 2],
      [72, 2],
      [69, 2],
      [74, 1],
      [76, 1],
      [67, 2],
      [64, 2],
    ],
    bass: [48, 50, 45, 43],
  },
  night: {
    beat: 0.72,
    melody: [
      [69, 2],
      [72, 2],
      [76, 2],
      [71, 2],
      [67, 2],
      [71, 2],
      [74, 2],
      [64, 2],
    ],
    bass: [45, 52, 43, 40],
  },
  court: {
    beat: 0.39,
    melody: [
      [62, 1],
      [65, 1],
      [69, 1],
      [70, 1],
      [67, 1],
      [65, 1],
      [62, 2],
      [63, 1],
      [67, 1],
      [72, 1],
      [70, 1],
      [69, 1],
      [65, 1],
      [62, 2],
    ],
    bass: [50, 43, 48, 45],
  },
  ending: {
    beat: 0.62,
    melody: [
      [72, 2],
      [76, 2],
      [79, 2],
      [81, 2],
      [79, 2],
      [74, 2],
      [77, 2],
      [72, 2],
    ],
    bass: [48, 45, 53, 48],
  },
}

type Chime = readonly [midi: number, at: number, seconds: number]

export const ROYAL_CHIMES: Record<RoyalCue, readonly Chime[]> = {
  cast: [
    [72, 0, 0.08],
    [60, 0.08, 0.16],
  ],
  catch: [
    [72, 0, 0.14],
    [76, 0.1, 0.14],
    [84, 0.2, 0.34],
  ],
  escape: [
    [65, 0, 0.12],
    [58, 0.12, 0.24],
  ],
  petition: [
    [62, 0, 0.22],
    [69, 0.12, 0.26],
  ],
  decree: [
    [64, 0, 0.16],
    [67, 0.12, 0.2],
  ],
  finale: [
    [60, 0, 0.32],
    [67, 0.15, 0.4],
    [76, 0.3, 0.65],
  ],
}

export const royalFrequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

export function royalThemeFor(
  hasSave: boolean,
  screen: string,
  night: boolean,
  complete: boolean,
): RoyalTheme {
  if (!hasSave || screen === 'opening' || screen === 'saves') return 'title'
  if (complete) return 'ending'
  if (screen === 'court') return 'court'
  return night ? 'night' : 'lake'
}

export class RoyalSound {
  private context: AudioContext | null = null
  private music: GainNode | null = null
  private effects: GainNode | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private theme: RoyalTheme = 'title'
  private prefs = ROYAL_AUDIO_DEFAULTS
  private quiet = false
  private hidden = false
  private step = 0
  private beats = 0
  private nextAt = 0

  async unlock(): Promise<boolean> {
    try {
      if (!this.context) {
        if (typeof AudioContext === 'undefined') return false
        const ctx = new AudioContext()
        this.context = ctx
        this.music = ctx.createGain()
        this.effects = ctx.createGain()
        this.music.connect(ctx.destination)
        this.effects.connect(ctx.destination)
        this.applyLevels()
      }
      const ctx = this.context
      if (ctx.state === 'suspended') await ctx.resume()
      if (ctx !== this.context || ctx.state !== 'running') return false
      if (this.timer === null) {
        this.nextAt = ctx.currentTime
        this.timer = setInterval(() => this.tick(), 80)
      }
      return true
    } catch {
      return false
    }
  }

  setPrefs(prefs: RoyalAudioPrefs) {
    this.prefs = cleanRoyalAudioPrefs(prefs)
    this.applyLevels()
  }

  setScene(theme: RoyalTheme, quiet: boolean) {
    if (theme !== this.theme) {
      this.theme = theme
      this.step = 0
      this.beats = 0
    }
    this.quiet = quiet
    this.applyLevels()
  }

  setHidden(hidden: boolean) {
    this.hidden = hidden
    this.applyLevels()
  }

  private applyLevels() {
    if (!this.context || !this.music || !this.effects) return
    const silent = this.hidden || this.prefs.muted
    this.music.gain.value = silent || this.quiet ? 0 : this.prefs.music
    this.effects.gain.value = silent ? 0 : this.prefs.effects
  }

  private note(
    destination: GainNode,
    midi: number,
    at: number,
    duration: number,
    peak: number,
    wave: OscillatorType,
  ) {
    const ctx = this.context
    if (!ctx) return
    const voice = ctx.createOscillator()
    const envelope = ctx.createGain()
    voice.type = wave
    voice.frequency.value = royalFrequency(midi)
    envelope.gain.setValueAtTime(0, at)
    envelope.gain.linearRampToValueAtTime(peak, at + 0.02)
    envelope.gain.linearRampToValueAtTime(0, at + duration)
    voice.connect(envelope)
    envelope.connect(destination)
    voice.onended = () => {
      voice.disconnect()
      envelope.disconnect()
    }
    voice.start(at)
    voice.stop(at + duration + 0.01)
  }

  private tick() {
    const ctx = this.context
    if (!ctx || !this.music || ctx.state !== 'running') return
    if (this.hidden || this.quiet || this.prefs.muted || !this.prefs.music) {
      this.nextAt = ctx.currentTime
      return
    }
    this.nextAt = Math.max(this.nextAt, ctx.currentTime)
    if (this.nextAt > ctx.currentTime + 0.12) return
    const theme = ROYAL_THEMES[this.theme]
    const note = theme.melody[this.step]
    if (!note) return
    const [midi, beats] = note
    const duration = beats * theme.beat
    this.note(this.music, midi, this.nextAt, duration * 0.9, 0.11, 'triangle')
    if (this.beats % 4 === 0) {
      const bass = theme.bass[Math.floor(this.beats / 4) % theme.bass.length]
      if (bass !== undefined)
        this.note(this.music, bass, this.nextAt, theme.beat * 3.6, 0.08, 'sine')
    }
    this.beats = (this.beats + beats) % 16
    this.step = (this.step + 1) % theme.melody.length
    this.nextAt += duration
  }

  play(cue: RoyalCue) {
    const ctx = this.context
    if (
      !ctx ||
      !this.effects ||
      ctx.state !== 'running' ||
      this.hidden ||
      this.prefs.muted ||
      !this.prefs.effects
    )
      return
    for (const [midi, at, seconds] of ROYAL_CHIMES[cue]) {
      this.note(this.effects, midi, ctx.currentTime + at, seconds, 0.15, 'sine')
    }
  }

  dispose() {
    if (this.timer !== null) clearInterval(this.timer)
    this.timer = null
    const ctx = this.context
    this.context = null
    this.music = null
    this.effects = null
    this.step = 0
    this.beats = 0
    if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {})
  }
}
