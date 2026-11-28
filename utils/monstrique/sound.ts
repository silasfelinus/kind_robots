/**
 * MONSTRIQUE's original score and sound design: surf-noir and motel-lounge
 * themes written for this game (no samples, files or licensed music), a soft
 * rain bed, and short comic cues for evidence, items, doors, ghosts and Norb's
 * rebuffs. WebAudio starts only after a real player gesture. The cue and mood
 * rules are pure, so Node tests cover them without a browser.
 */
import type { CaseState } from '../monstressConvention/prologue'

export type MonstriqueMood =
  | 'title'
  | 'motel'
  | 'crime'
  | 'city'
  | 'convention'
  | 'ending-lead'
  | 'ending-reckless'

export type MonstriqueCue =
  | 'evidence'
  | 'item'
  | 'topic'
  | 'room'
  | 'ghost'
  | 'rebuff'
  | 'clank'
  | 'denied'
  | 'ending'

export type MonstriqueMix = {
  master: number
  music: number
  effects: number
  muted: boolean
}

export const MONSTRIQUE_MIX_KEY = 'kr-monstrique:audio-v1'
export const DEFAULT_MONSTRIQUE_MIX: Readonly<MonstriqueMix> = {
  master: 0.7,
  music: 0.45,
  effects: 0.75,
  muted: false,
}

const clamp = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback

export function parseMonstriqueMix(raw: unknown): MonstriqueMix {
  let value = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    } catch {
      value = null
    }
  }
  const record =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  return {
    master: clamp(record.master, DEFAULT_MONSTRIQUE_MIX.master),
    music: clamp(record.music, DEFAULT_MONSTRIQUE_MIX.music),
    effects: clamp(record.effects, DEFAULT_MONSTRIQUE_MIX.effects),
    muted:
      typeof record.muted === 'boolean'
        ? record.muted
        : DEFAULT_MONSTRIQUE_MIX.muted,
  }
}

export function monstriqueMoodFor(
  state: Pick<CaseState, 'room' | 'ending'> | null,
  onStage: boolean,
): MonstriqueMood {
  if (!state || !onStage) return 'title'
  if (state.ending === 'lead-earned' || state.ending === 'fifth-hexblade')
    return 'ending-lead'
  if (state.ending === 'reckless') return 'ending-reckless'
  if (state.room === 'odette-room') return 'crime'
  if (state.room === 'city-map') return 'city'
  if (state.room === 'convention-center') return 'convention'
  return 'motel'
}

const GHOST_FLAGS = ['odette-met', 'violet-met']

/** At most three cues per action, most important first. */
export function monstriqueCuesFor(
  previous: CaseState,
  next: CaseState,
): MonstriqueCue[] {
  if (!previous.ending && next.ending) return ['ending']
  const cues: MonstriqueCue[] = []
  if (previous.room !== next.room) cues.push('room')
  if (
    GHOST_FLAGS.some(
      (flag) => next.flags.includes(flag) && !previous.flags.includes(flag),
    )
  )
    cues.push('ghost')
  if (
    next.evidence.includes('ice-timing') &&
    !previous.evidence.includes('ice-timing')
  )
    cues.push('clank')
  if (next.evidence.length > previous.evidence.length) cues.push('evidence')
  if (next.inventory.some((item) => !previous.inventory.includes(item)))
    cues.push('item')
  if (next.rebuffs > previous.rebuffs) cues.push('rebuff')
  if (next.topics.length > previous.topics.length && cues.length === 0)
    cues.push('topic')
  return cues.slice(0, 3)
}

export type MonstriqueTheme = {
  bpm: number
  /** Four bars of chords (MIDI), one per bar. */
  chords: readonly (readonly number[])[]
  /** Sixteen sixteenth-note steps; -1 rests. Repeats each bar. */
  lead: readonly number[]
  /** Walking bass, four quarter notes per bar for each of the four bars. */
  bass: readonly number[]
  leadWave: OscillatorType
  padWave: OscillatorType
  energy: number
  /** Rain bed level, 0 to 1. */
  rain: number
  brushes: boolean
}

const R = -1

// Original themes. Title and city are reverb-drenched surf-noir in E minor;
// the motel is a slinky lounge walk; Room 205 is a low drone with a tritone
// sting; the convention is a campy organ shuffle; endings resolve or deflate.
export const MONSTRIQUE_THEMES: Record<MonstriqueMood, MonstriqueTheme> = {
  title: {
    bpm: 132,
    chords: [
      [52, 55, 59],
      [48, 52, 55],
      [50, 54, 57],
      [47, 51, 54],
    ],
    lead: [76, 76, 79, 76, 74, R, 71, R, 72, 72, 74, 72, 71, R, 67, R],
    bass: [40, 43, 47, 43, 36, 40, 43, 40, 38, 42, 45, 42, 35, 39, 42, 39],
    leadWave: 'square',
    padWave: 'sawtooth',
    energy: 0.7,
    rain: 0.5,
    brushes: false,
  },
  motel: {
    bpm: 92,
    chords: [
      [50, 53, 57, 60],
      [55, 59, 62, 65],
      [48, 52, 55, 59],
      [45, 49, 52, 55],
    ],
    lead: [R, R, 69, R, 72, R, R, 71, R, 69, R, R, 67, R, R, R],
    bass: [38, 41, 45, 44, 43, 47, 50, 49, 36, 40, 43, 42, 33, 37, 40, 39],
    leadWave: 'triangle',
    padWave: 'sine',
    energy: 0.55,
    rain: 0.35,
    brushes: true,
  },
  crime: {
    bpm: 70,
    chords: [
      [40, 47, 52],
      [40, 46, 52],
      [41, 47, 53],
      [40, 46, 52],
    ],
    lead: [R, R, R, R, 64, R, R, R, R, R, 70, R, R, R, R, R],
    bass: [28, R, R, R, 28, R, R, R, 29, R, R, R, 28, R, 34, R],
    leadWave: 'sine',
    padWave: 'triangle',
    energy: 0.5,
    rain: 0.25,
    brushes: false,
  },
  city: {
    bpm: 140,
    chords: [
      [52, 55, 59],
      [55, 59, 62],
      [57, 60, 64],
      [59, 63, 66],
    ],
    lead: [71, R, 74, 76, R, 74, 71, R, 69, R, 71, 74, R, 71, 67, R],
    bass: [40, 40, 47, 40, 43, 43, 50, 43, 45, 45, 52, 45, 47, 47, 54, 47],
    leadWave: 'square',
    padWave: 'sawtooth',
    energy: 0.75,
    rain: 0,
    brushes: false,
  },
  convention: {
    bpm: 116,
    chords: [
      [53, 57, 60, 63],
      [58, 62, 65, 68],
      [53, 57, 60, 63],
      [48, 52, 55, 58],
    ],
    lead: [72, R, 75, R, 77, 75, 72, R, 70, R, 72, R, 69, R, R, R],
    bass: [41, 45, 48, 45, 46, 50, 53, 50, 41, 45, 48, 45, 36, 40, 43, 40],
    leadWave: 'square',
    padWave: 'square',
    energy: 0.6,
    rain: 0,
    brushes: true,
  },
  'ending-lead': {
    bpm: 100,
    chords: [
      [52, 56, 59, 63],
      [57, 61, 64, 68],
      [54, 57, 61, 64],
      [59, 63, 66, 69],
    ],
    lead: [76, R, 80, R, 83, R, 80, 81, R, R, 78, R, 76, R, R, R],
    bass: [40, 44, 47, 44, 45, 49, 52, 49, 42, 45, 49, 45, 47, 51, 54, 51],
    leadWave: 'triangle',
    padWave: 'sine',
    energy: 0.6,
    rain: 0,
    brushes: true,
  },
  'ending-reckless': {
    bpm: 84,
    chords: [
      [52, 55, 58],
      [51, 54, 57],
      [50, 53, 56],
      [49, 52, 55],
    ],
    lead: [67, R, 66, R, 65, R, 64, R, R, R, R, R, R, R, R, R],
    bass: [40, R, 39, R, 38, R, 37, R, 36, R, R, R, 36, R, R, R],
    leadWave: 'sawtooth',
    padWave: 'triangle',
    energy: 0.5,
    rain: 0.3,
    brushes: false,
  },
}

export const MONSTRIQUE_CUE_NOTES: Record<MonstriqueCue, readonly number[]> = {
  evidence: [84, 91],
  item: [72, 76, 79],
  topic: [79, 83],
  room: [55, 50],
  ghost: [67, 71, 74, 79],
  rebuff: [58, 57, 56, 55],
  clank: [43, 43],
  denied: [52, 49],
  ending: [64, 67, 71, 76],
}

export const monstriqueNoteHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

type Voice = { gain: GainNode; bus: GainNode }

/** One gesture-unlocked WebAudio player for the title console and the stage. */
export class MonstriqueSound {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private music: GainNode | null = null
  private effects: GainNode | null = null
  private rain: GainNode | null = null
  private rainSource: AudioBufferSourceNode | null = null
  private noise: AudioBuffer | null = null
  private mix: MonstriqueMix = { ...DEFAULT_MONSTRIQUE_MIX }
  private mood: MonstriqueMood = 'title'
  private step = 0
  private nextStep = 0
  private timer: ReturnType<typeof setInterval> | null = null
  private hidden = false
  private enabled = true
  private voices = new Map<AudioScheduledSourceNode, Voice>()

  get unlocked(): boolean {
    return this.context !== null
  }

  unlock(): boolean {
    if (typeof window === 'undefined') return false
    if (!this.context) {
      const Context =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Context) return false
      try {
        this.context = new Context()
      } catch {
        return false
      }
      const context = this.context
      this.master = context.createGain()
      this.music = context.createGain()
      this.effects = context.createGain()
      this.rain = context.createGain()
      this.music.connect(this.master)
      this.effects.connect(this.master)
      this.rain.connect(this.music)
      this.master.connect(context.destination)
      this.noise = context.createBuffer(
        1,
        context.sampleRate * 2,
        context.sampleRate,
      )
      const data = this.noise.getChannelData(0)
      for (let index = 0; index < data.length; index++)
        data[index] = Math.random() * 2 - 1
      this.startRain()
      this.applyMix()
      this.nextStep = context.currentTime + 0.05
      this.timer = setInterval(() => this.pump(), 60)
    }
    if (!this.hidden && this.context.state !== 'running') {
      this.cancelVoices()
      this.resetClock()
      void this.context.resume().catch(() => {})
    }
    return true
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return
    this.enabled = enabled
    this.cancelVoices()
    this.resetClock()
    this.applyMix()
  }

  setMix(mix: MonstriqueMix): void {
    this.mix = parseMonstriqueMix(mix)
    if (this.mix.muted || this.mix.master === 0) this.cancelVoices()
    this.applyMix()
  }

  setMood(mood: MonstriqueMood): void {
    if (this.mood === mood) return
    this.mood = mood
    this.step = 0
    this.cancelVoices(this.music ?? undefined)
    this.resetClock()
    this.applyMix()
  }

  play(cues: readonly MonstriqueCue[]): void {
    const context = this.context
    if (
      !context ||
      !this.effects ||
      this.hidden ||
      !this.enabled ||
      this.mix.muted ||
      this.mix.master === 0 ||
      this.mix.effects === 0 ||
      context.state !== 'running'
    )
      return
    for (const [index, cue] of cues.slice(0, 3).entries()) {
      const notes = MONSTRIQUE_CUE_NOTES[cue]
      const start = context.currentTime + 0.02 + index * 0.2
      if (cue === 'clank' || cue === 'room') {
        this.hit(
          start,
          cue === 'clank' ? 0.09 : 0.05,
          cue === 'clank' ? 900 : 300,
        )
      }
      const spacing = cue === 'rebuff' ? 0.16 : cue === 'ghost' ? 0.09 : 0.06
      const wave: OscillatorType =
        cue === 'ghost' ? 'sine' : cue === 'rebuff' ? 'sawtooth' : 'triangle'
      notes.forEach((note, part) =>
        this.note(
          note,
          start + part * spacing,
          cue === 'rebuff' ? 0.2 : 0.12,
          0.08,
          this.effects!,
          wave,
          cue === 'ghost' ? 6 : 0,
        ),
      )
    }
  }

  setHidden(hidden: boolean): void {
    this.hidden = hidden
    if (!this.context) return
    this.cancelVoices()
    this.resetClock()
    if (hidden) void this.context.suspend().catch(() => {})
    else void this.context.resume().catch(() => {})
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.cancelVoices()
    this.rainSource?.stop()
    this.rainSource?.disconnect()
    this.rainSource = null
    if (this.context) void this.context.close().catch(() => {})
    this.context = null
    this.master = null
    this.music = null
    this.effects = null
    this.rain = null
    this.noise = null
    this.step = 0
    this.nextStep = 0
  }

  private startRain(): void {
    const context = this.context
    if (!context || !this.noise || !this.rain) return
    const source = context.createBufferSource()
    source.buffer = this.noise
    source.loop = true
    const filter = context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 2400
    filter.Q.value = 0.6
    source.connect(filter)
    filter.connect(this.rain)
    source.start()
    this.rainSource = source
  }

  private canPlayMusic(): boolean {
    return (
      this.enabled &&
      !this.mix.muted &&
      this.mix.master > 0 &&
      this.mix.music > 0
    )
  }

  private resetClock(): void {
    if (this.context) this.nextStep = this.context.currentTime + 0.05
  }

  private cancelVoices(bus?: GainNode): void {
    for (const [source, voice] of this.voices) {
      if (bus && voice.bus !== bus) continue
      this.voices.delete(source)
      source.onended = null
      try {
        source.stop()
      } catch {
        // already stopped
      }
      source.disconnect()
      voice.gain.disconnect()
    }
  }

  private applyMix(): void {
    if (
      !this.context ||
      !this.master ||
      !this.music ||
      !this.effects ||
      !this.rain
    )
      return
    const at = this.context.currentTime
    this.master.gain.setTargetAtTime(
      this.mix.muted || !this.enabled ? 0 : this.mix.master,
      at,
      0.04,
    )
    this.music.gain.setTargetAtTime(this.mix.music, at, 0.04)
    this.effects.gain.setTargetAtTime(this.mix.effects, at, 0.04)
    this.rain.gain.setTargetAtTime(
      0.06 * MONSTRIQUE_THEMES[this.mood].rain,
      at,
      0.4,
    )
  }

  private track(
    source: AudioScheduledSourceNode,
    gain: GainNode,
    bus: GainNode,
  ) {
    this.voices.set(source, { gain, bus })
    source.onended = () => {
      if (!this.voices.delete(source)) return
      source.disconnect()
      gain.disconnect()
    }
  }

  private note(
    midi: number,
    at: number,
    length: number,
    level: number,
    bus: GainNode,
    type: OscillatorType,
    vibrato = 0,
  ): void {
    const context = this.context
    if (!context) return
    const tone = context.createOscillator()
    const gain = context.createGain()
    tone.type = type
    tone.frequency.setValueAtTime(monstriqueNoteHz(midi), at)
    if (vibrato)
      tone.frequency.linearRampToValueAtTime(
        monstriqueNoteHz(midi) * (1 + vibrato / 1000),
        at + length,
      )
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(Math.max(level, 0.001), at + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
    tone.connect(gain)
    gain.connect(bus)
    this.track(tone, gain, bus)
    tone.start(at)
    tone.stop(at + length + 0.03)
  }

  private hit(at: number, level: number, cutoff: number, bus?: GainNode): void {
    const context = this.context
    const target = bus ?? this.effects
    if (!context || !this.noise || !target) return
    const source = context.createBufferSource()
    source.buffer = this.noise
    const filter = context.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = cutoff
    const gain = context.createGain()
    gain.gain.setValueAtTime(level, at)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.07)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(target)
    this.track(source, gain, target)
    source.start(at, Math.random())
    source.stop(at + 0.09)
  }

  private pump(): void {
    const context = this.context
    if (
      !context ||
      !this.music ||
      this.hidden ||
      !this.canPlayMusic() ||
      context.state !== 'running'
    ) {
      if (context && context.state !== 'running') {
        this.cancelVoices()
        this.resetClock()
      }
      return
    }
    const theme = MONSTRIQUE_THEMES[this.mood]
    const stepSeconds = 60 / theme.bpm / 4
    if (this.nextStep < context.currentTime - 0.3)
      this.nextStep = context.currentTime + 0.05
    while (this.nextStep < context.currentTime + 0.25) {
      const beat = this.step % 16
      const bar = Math.floor((this.step % 64) / 16)
      const chord = theme.chords[bar]!
      if (beat === 0)
        chord.forEach((pitch) =>
          this.note(
            pitch,
            this.nextStep,
            stepSeconds * 15,
            0.014 * theme.energy,
            this.music!,
            theme.padWave,
          ),
        )
      if (beat % 4 === 0) {
        const walk = theme.bass[bar * 4 + beat / 4]
        if (walk !== undefined && walk !== R)
          this.note(
            walk,
            this.nextStep,
            stepSeconds * 3.2,
            0.08 * theme.energy,
            this.music,
            'triangle',
          )
      }
      const melody = theme.lead[beat]
      if (melody !== undefined && melody !== R)
        this.note(
          melody,
          this.nextStep,
          stepSeconds * 1.6,
          0.035 * theme.energy,
          this.music,
          theme.leadWave,
          theme.leadWave === 'square' ? 4 : 0,
        )
      if (theme.brushes && beat % 2 === 0)
        this.hit(
          this.nextStep,
          (beat % 4 === 2 ? 0.035 : 0.015) * theme.energy,
          6000,
          this.music,
        )
      this.step++
      this.nextStep += stepSeconds
    }
  }
}
