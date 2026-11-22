/**
 * Original Comet City tactical score and event-led sound design.
 *
 * Seven distinct four-bar synthesised themes with percussion and a melodic
 * counterline, plus short game-state cues. No files, external music, autoplay
 * or renderer-dependent rules. The engine creates WebAudio only when unlocked
 * in a genuine player gesture. The pure cue rules run in Node tests.
 */
import type { TrainingState } from './training'

export type TacticsMood =
  | 'title'
  | 'planning'
  | 'battle'
  | 'danger'
  | 'cinematic'
  | 'victory'
  | 'defeat'

export type TacticsCue =
  | 'stage'
  | 'select'
  | 'move'
  | 'shot-hit'
  | 'shot-miss'
  | 'damage'
  | 'power'
  | 'rescue'
  | 'objective'
  | 'turn'
  | 'scene'
  | 'victory'
  | 'defeat'

export type TacticsMix = {
  master: number
  music: number
  effects: number
  muted: boolean
}

export const TACTICS_MIX_KEY = 'kr-every-villain-tactics:audio-v1'
export const DEFAULT_TACTICS_MIX: Readonly<TacticsMix> = {
  master: 0.7,
  music: 0.5,
  effects: 0.75,
  muted: false,
}

const clamp = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback

export function parseTacticsMix(raw: unknown): TacticsMix {
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
    master: clamp(record.master, DEFAULT_TACTICS_MIX.master),
    music: clamp(record.music, DEFAULT_TACTICS_MIX.music),
    effects: clamp(record.effects, DEFAULT_TACTICS_MIX.effects),
    muted:
      typeof record.muted === 'boolean'
        ? record.muted
        : DEFAULT_TACTICS_MIX.muted,
  }
}

export type TacticsAudioFrame = {
  screen: string | null
  scene: string | null
  stage: string | null
  phase: TrainingState['phase']
  turn: number
  impactSerial: number
  impactHit: boolean
  selected: string
  positions: string
  squadHp: number
  squadMaxHp: number
  rescued: number
  flags: number
  log: string
}

export function tacticsAudioFrame(
  state: TrainingState,
  screen: string | null,
  scene: string | null,
): TacticsAudioFrame {
  const squad = state.units.filter((unit) => unit.team === 'squad')
  return {
    screen,
    scene,
    stage: state.stageId,
    phase: state.phase,
    turn: state.turn,
    impactSerial: state.impact?.serial ?? -1,
    impactHit: state.impact?.hit ?? false,
    selected: state.selected,
    positions: state.units
      .map((unit) => [unit.id, unit.x, unit.y].join(':'))
      .join('|'),
    squadHp: squad.reduce((hp, unit) => hp + Math.max(0, unit.hp), 0),
    squadMaxHp: squad.reduce((hp, unit) => hp + unit.maxHp, 0),
    rescued:
      state.civilians?.filter((civilian) => civilian.status === 'rescued')
        .length ?? 0,
    flags: state.flags?.length ?? 0,
    log: state.log,
  }
}

export function tacticsMoodFor(frame: TacticsAudioFrame): TacticsMood {
  if (frame.screen) return 'title'
  if (frame.phase === 'victory') return 'victory'
  if (frame.phase === 'defeat') return 'defeat'
  if (frame.scene) return 'cinematic'
  if (frame.squadHp <= frame.squadMaxHp * 0.35) return 'danger'
  return frame.turn <= 1 ? 'planning' : 'battle'
}

export function tacticsCuesFor(
  previous: TacticsAudioFrame,
  next: TacticsAudioFrame,
): TacticsCue[] {
  if (previous.stage !== next.stage) return ['stage']
  if (previous.phase !== next.phase) {
    if (next.phase === 'victory') return ['victory']
    if (next.phase === 'defeat') return ['defeat']
  }
  if (next.screen !== previous.screen && next.screen) return []
  const cues: TacticsCue[] = []
  if (next.impactSerial > previous.impactSerial)
    cues.push(next.impactHit ? 'shot-hit' : 'shot-miss')
  if (next.squadHp < previous.squadHp) cues.push('damage')
  if (next.rescued > previous.rescued) cues.push('rescue')
  if (next.flags > previous.flags) cues.push('objective')
  if (
    next.log !== previous.log &&
    / uses | channels | unleashes /i.test(next.log)
  )
    cues.push('power')
  if (next.scene && next.scene !== previous.scene) cues.push('scene')
  if (next.turn > previous.turn) cues.push('turn')
  if (next.positions !== previous.positions && !cues.length) cues.push('move')
  if (next.selected !== previous.selected && !cues.length) cues.push('select')
  return cues.slice(0, 3)
}

export type TacticsTheme = {
  bpm: number
  chords: readonly (readonly number[])[]
  lead: readonly number[]
  energy: number
}

const REST = -1

// Original heroic brass-synth themes: each changes harmony and hook, not
// merely the tempo of a single recycled loop. Notes are MIDI pitches.
export const TACTICS_THEMES: Record<TacticsMood, TacticsTheme> = {
  title: {
    bpm: 104,
    chords: [
      [55, 58, 62],
      [51, 55, 58],
      [48, 51, 55],
      [53, 57, 60],
    ],
    lead: [
      74,
      REST,
      77,
      REST,
      79,
      77,
      REST,
      74,
      70,
      REST,
      72,
      REST,
      74,
      REST,
      67,
      REST,
    ],
    energy: 0.65,
  },
  planning: {
    bpm: 88,
    chords: [
      [57, 60, 64],
      [53, 57, 60],
      [55, 59, 62],
      [52, 55, 59],
    ],
    lead: [
      69,
      REST,
      REST,
      72,
      REST,
      76,
      REST,
      72,
      71,
      REST,
      69,
      REST,
      67,
      REST,
      64,
      REST,
    ],
    energy: 0.42,
  },
  battle: {
    bpm: 132,
    chords: [
      [52, 55, 59],
      [48, 52, 55],
      [50, 53, 57],
      [55, 59, 62],
    ],
    lead: [
      76,
      REST,
      79,
      76,
      71,
      REST,
      74,
      REST,
      83,
      REST,
      79,
      76,
      74,
      71,
      REST,
      74,
    ],
    energy: 0.84,
  },
  danger: {
    bpm: 146,
    chords: [
      [48, 51, 55],
      [47, 50, 54],
      [46, 49, 53],
      [43, 47, 50],
    ],
    lead: [
      72,
      REST,
      71,
      REST,
      75,
      74,
      REST,
      71,
      70,
      REST,
      68,
      REST,
      67,
      63,
      REST,
      62,
    ],
    energy: 0.91,
  },
  cinematic: {
    bpm: 72,
    chords: [
      [50, 53, 57],
      [46, 50, 53],
      [43, 46, 50],
      [48, 52, 55],
    ],
    lead: [
      74,
      REST,
      REST,
      REST,
      77,
      REST,
      79,
      REST,
      81,
      REST,
      REST,
      77,
      74,
      REST,
      69,
      REST,
    ],
    energy: 0.37,
  },
  victory: {
    bpm: 116,
    chords: [
      [62, 66, 69],
      [57, 61, 64],
      [59, 62, 66],
      [62, 66, 69],
    ],
    lead: [
      74,
      REST,
      78,
      81,
      86,
      REST,
      81,
      78,
      79,
      81,
      86,
      REST,
      88,
      REST,
      86,
      REST,
    ],
    energy: 0.72,
  },
  defeat: {
    bpm: 66,
    chords: [
      [47, 50, 54],
      [43, 47, 50],
      [45, 48, 52],
      [42, 47, 50],
    ],
    lead: [
      71,
      REST,
      REST,
      69,
      REST,
      REST,
      66,
      REST,
      64,
      REST,
      62,
      REST,
      59,
      REST,
      REST,
      REST,
    ],
    energy: 0.28,
  },
}

export const TACTICS_CUE_NOTES: Record<TacticsCue, readonly number[]> = {
  stage: [62, 74, 79],
  select: [72, 79],
  move: [58, 65],
  'shot-hit': [72, 60, 48],
  'shot-miss': [72, 69, 65],
  damage: [57, 51, 45],
  power: [64, 71, 76, 83],
  rescue: [67, 72, 79, 84],
  objective: [62, 69, 74, 81],
  turn: [55, 62, 67],
  scene: [69, 74, 77],
  victory: [74, 78, 81, 86],
  defeat: [62, 59, 54, 47],
}

export const tacticsNoteHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

/** WebAudio is optional: the game, SSR and every test work silently without it. */
export class TacticsSound {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private music: GainNode | null = null
  private effects: GainNode | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private mood: TacticsMood = 'title'
  private mix: TacticsMix = { ...DEFAULT_TACTICS_MIX }
  private step = 0
  private nextStep = 0
  private hidden = false

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
      this.master = this.context.createGain()
      this.music = this.context.createGain()
      this.effects = this.context.createGain()
      this.music.connect(this.master)
      this.effects.connect(this.master)
      this.master.connect(this.context.destination)
      this.applyMix()
      this.nextStep = this.context.currentTime + 0.03
      this.timer = setInterval(() => this.pump(), 60)
    }
    if (!this.hidden) void this.context.resume().catch(() => {})
    return true
  }

  setMix(mix: TacticsMix): void {
    this.mix = parseTacticsMix(mix)
    this.applyMix()
  }

  setMood(mood: TacticsMood): void {
    if (this.mood === mood) return
    this.mood = mood
    this.step = 0
    if (this.context) this.nextStep = this.context.currentTime + 0.05
  }

  play(cues: readonly TacticsCue[]): void {
    if (!this.context || !this.effects || this.hidden || this.mix.muted) return
    for (const [index, cue] of cues.slice(0, 3).entries()) {
      const notes = TACTICS_CUE_NOTES[cue]
      if (!notes) continue
      notes.forEach((note, part) => {
        this.note(
          note,
          this.context!.currentTime + 0.02 + index * 0.18 + part * 0.055,
          0.09,
          0.075,
          this.effects!,
          'square',
        )
      })
    }
  }

  setHidden(hidden: boolean): void {
    this.hidden = hidden
    if (!this.context) return
    if (hidden) void this.context.suspend().catch(() => {})
    else {
      this.nextStep = this.context.currentTime + 0.04
      void this.context.resume().catch(() => {})
    }
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    if (this.context) void this.context.close().catch(() => {})
    this.context = null
    this.master = null
    this.music = null
    this.effects = null
    this.step = 0
    this.nextStep = 0
  }

  private applyMix(): void {
    if (!this.context || !this.master || !this.music || !this.effects) return
    const at = this.context.currentTime
    this.master.gain.setTargetAtTime(
      this.mix.muted ? 0 : this.mix.master,
      at,
      0.03,
    )
    this.music.gain.setTargetAtTime(this.mix.music, at, 0.03)
    this.effects.gain.setTargetAtTime(this.mix.effects, at, 0.03)
  }

  private note(
    midi: number,
    at: number,
    length: number,
    level: number,
    bus: GainNode,
    type: OscillatorType,
  ): void {
    const context = this.context
    if (!context) return
    const tone = context.createOscillator()
    const gain = context.createGain()
    tone.type = type
    tone.frequency.setValueAtTime(tacticsNoteHz(midi), at)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(Math.max(level, 0.001), at + 0.018)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
    tone.connect(gain)
    gain.connect(bus)
    tone.start(at)
    tone.stop(at + length + 0.025)
  }

  private pump(): void {
    const context = this.context
    if (!context || !this.music || this.hidden || context.state !== 'running')
      return
    const score = TACTICS_THEMES[this.mood]
    const stepSeconds = 60 / score.bpm / 4
    if (this.nextStep < context.currentTime - 0.3)
      this.nextStep = context.currentTime + 0.03
    while (this.nextStep < context.currentTime + 0.25) {
      const beat = this.step % 16
      const bar = Math.floor((this.step % 64) / 16)
      const chord = score.chords[bar]!
      if (beat === 0) {
        chord.forEach((pitch) =>
          this.note(
            pitch,
            this.nextStep,
            stepSeconds * 14,
            0.018 * score.energy,
            this.music!,
            'sawtooth',
          ),
        )
      }
      if (beat % 4 === 0)
        this.note(
          chord[0]! - 12,
          this.nextStep,
          stepSeconds * 2.4,
          0.09 * score.energy,
          this.music,
          'triangle',
        )
      const melody = score.lead[beat]
      if (melody !== undefined && melody !== REST)
        this.note(
          melody,
          this.nextStep,
          stepSeconds * 1.5,
          0.045 * score.energy,
          this.music,
          'square',
        )
      if (beat === 0 || beat === 8)
        this.note(
          beat === 0 ? 35 : 43,
          this.nextStep,
          0.08,
          0.06 * score.energy,
          this.music,
          'sine',
        )
      this.step++
      this.nextStep += stepSeconds
    }
  }
}
