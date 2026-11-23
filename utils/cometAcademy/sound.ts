/**
 * Prom of Doom's original school, patrol and finale score.
 *
 * Pure campaign-state cues stay separate from browser-only WebAudio playback.
 * Every instrument is synthesized locally, with no licensed audio or network.
 */
import type { AcademyRun } from './rules'

export type PromMood =
  'title' | 'campus' | 'discovery' | 'patrol' | 'crisis' | 'finale' | 'ending'

export type PromCue =
  | 'choice'
  | 'new-term'
  | 'school-bell'
  | 'dispatch'
  | 'investigate'
  | 'recruit'
  | 'injury'
  | 'success'
  | 'setback'
  | 'villain'
  | 'finale'
  | 'ending'

export type PromMix = {
  master: number
  music: number
  effects: number
  muted: boolean
}

export const PROM_MIX_KEY = 'kr-prom-of-doom:audio-v1'
export const DEFAULT_PROM_MIX: Readonly<PromMix> = {
  master: 0.7,
  music: 0.5,
  effects: 0.7,
  muted: false,
}

function volume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback
}

export function parsePromMix(raw: unknown): PromMix {
  let parsed = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = null
    }
  }
  const data =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  return {
    master: volume(data.master, DEFAULT_PROM_MIX.master),
    music: volume(data.music, DEFAULT_PROM_MIX.music),
    effects: volume(data.effects, DEFAULT_PROM_MIX.effects),
    muted:
      typeof data.muted === 'boolean' ? data.muted : DEFAULT_PROM_MIX.muted,
  }
}

export type PromAudioFrame = {
  seed: number | null
  phase: AcademyRun['phase'] | 'title'
  day: number
  danger: number
  influence: number
  contacts: number
  injuries: number
  reports: number
  failedReports: number
  clues: number
  revelations: number
  villain: string | null
  ending: string | null
  scene: string
  lastLog: string
}

export function promAudioFrame(run: AcademyRun | null): PromAudioFrame {
  return {
    seed: run?.seed ?? null,
    phase: run?.phase ?? 'title',
    day: run?.day ?? 0,
    danger: run?.danger ?? 0,
    influence: run?.influence ?? 0,
    contacts: run?.contacts?.length ?? 0,
    injuries: Object.values(run?.injuries ?? {}).filter((n) => (n ?? 0) > 0)
      .length,
    reports: run?.reports.length ?? 0,
    failedReports:
      run?.reports.filter((report) => report.grade === 'failed').length ?? 0,
    clues:
      (run?.missionClues?.length ?? 0) + (run?.districtSecrets?.length ?? 0),
    revelations: run?.plotEvidence?.length ?? 0,
    villain: run?.mastermind ?? null,
    ending: run?.ending ?? null,
    scene: run?.scene ?? '',
    lastLog: run?.log.at(-1) ?? '',
  }
}

export function promMoodFor(frame: PromAudioFrame): PromMood {
  if (frame.phase === 'title') return 'title'
  if (frame.phase === 'ending') return 'ending'
  if (frame.phase === 'finale') return 'finale'
  if (frame.danger >= 12) return 'crisis'
  if (frame.phase === 'dispatch') return 'patrol'
  if (frame.phase === 'debrief') return 'discovery'
  return 'campus'
}

export function promCuesFor(
  previous: PromAudioFrame,
  current: PromAudioFrame,
): PromCue[] {
  if (current.seed !== previous.seed)
    return current.seed === null ? [] : ['new-term']
  if (current.phase === 'ending' && previous.phase !== 'ending')
    return ['ending']
  if (current.phase === 'finale' && previous.phase !== 'finale')
    return ['finale']
  const cues: PromCue[] = []
  if (current.villain && current.villain !== previous.villain)
    cues.push('villain')
  if (current.day > previous.day) cues.push('school-bell')
  if (current.contacts > previous.contacts) cues.push('recruit')
  if (current.injuries > previous.injuries) cues.push('injury')
  if (current.clues > previous.clues) cues.push('investigate')
  if (current.revelations > previous.revelations) cues.push('villain')
  if (current.reports > previous.reports) {
    cues.push(
      current.failedReports > previous.failedReports ? 'setback' : 'success',
    )
  } else if (current.phase === 'dispatch' && previous.phase !== 'dispatch') {
    cues.push('dispatch')
  }
  if (
    !cues.length &&
    (current.lastLog !== previous.lastLog || current.scene !== previous.scene)
  )
    cues.push('choice')
  return cues.slice(0, 3)
}

export type PromTheme = {
  bpm: number
  chords: readonly (readonly number[])[]
  melody: readonly number[]
  pulse: number
}

const REST = -1

// Four bars per theme; distinct original lead motifs for the lived-in academy,
// uneasy secrets, street patrols and the increasingly dire prom-night score.
export const PROM_THEMES: Record<PromMood, PromTheme> = {
  title: {
    bpm: 98,
    chords: [
      [60, 64, 67],
      [57, 60, 64],
      [53, 57, 60],
      [55, 59, 62],
    ],
    melody: [
      79,
      REST,
      76,
      72,
      REST,
      74,
      76,
      REST,
      81,
      REST,
      79,
      76,
      74,
      REST,
      72,
      REST,
    ],
    pulse: 0.66,
  },
  campus: {
    bpm: 110,
    chords: [
      [65, 69, 72],
      [60, 64, 67],
      [62, 65, 69],
      [67, 71, 74],
    ],
    melody: [
      77,
      REST,
      81,
      REST,
      79,
      77,
      REST,
      74,
      76,
      REST,
      72,
      74,
      REST,
      76,
      79,
      REST,
    ],
    pulse: 0.56,
  },
  discovery: {
    bpm: 84,
    chords: [
      [57, 60, 64],
      [53, 56, 60],
      [50, 53, 57],
      [52, 55, 59],
    ],
    melody: [
      72,
      REST,
      REST,
      76,
      REST,
      75,
      REST,
      72,
      69,
      REST,
      72,
      REST,
      74,
      REST,
      68,
      REST,
    ],
    pulse: 0.43,
  },
  patrol: {
    bpm: 134,
    chords: [
      [50, 53, 57],
      [55, 58, 62],
      [53, 57, 60],
      [48, 52, 55],
    ],
    melody: [
      74,
      REST,
      77,
      81,
      REST,
      77,
      74,
      REST,
      72,
      74,
      77,
      REST,
      79,
      77,
      REST,
      74,
    ],
    pulse: 0.86,
  },
  crisis: {
    bpm: 150,
    chords: [
      [48, 51, 55],
      [47, 50, 54],
      [45, 48, 52],
      [43, 47, 50],
    ],
    melody: [
      84,
      83,
      REST,
      79,
      78,
      REST,
      75,
      72,
      REST,
      73,
      75,
      78,
      79,
      REST,
      83,
      REST,
    ],
    pulse: 0.98,
  },
  finale: {
    bpm: 120,
    chords: [
      [53, 57, 60],
      [58, 62, 65],
      [55, 59, 62],
      [60, 64, 67],
    ],
    melody: [
      77,
      REST,
      81,
      REST,
      84,
      81,
      79,
      REST,
      86,
      REST,
      84,
      81,
      79,
      77,
      74,
      REST,
    ],
    pulse: 0.91,
  },
  ending: {
    bpm: 70,
    chords: [
      [60, 64, 67],
      [56, 60, 63],
      [53, 57, 60],
      [60, 65, 69],
    ],
    melody: [
      72,
      REST,
      REST,
      76,
      REST,
      79,
      REST,
      REST,
      77,
      REST,
      76,
      REST,
      72,
      REST,
      69,
      REST,
    ],
    pulse: 0.33,
  },
}

export const PROM_CUE_NOTES: Record<PromCue, readonly number[]> = {
  choice: [72, 76],
  'new-term': [60, 67, 72, 79],
  'school-bell': [74, 81, 74],
  dispatch: [50, 57, 62],
  investigate: [69, 73, 76, 81],
  recruit: [72, 76, 79],
  injury: [62, 57, 53],
  success: [67, 74, 79, 83],
  setback: [69, 65, 60, 55],
  villain: [60, 59, 55, 51],
  finale: [65, 72, 77, 84],
  ending: [72, 76, 79, 84],
}

export const promNoteHz = (pitch: number) => 440 * 2 ** ((pitch - 69) / 12)

export class PromSound {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private scoreBus: GainNode | null = null
  private effectsBus: GainNode | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private mix: PromMix = { ...DEFAULT_PROM_MIX }
  private mood: PromMood = 'title'
  private hidden = false
  private step = 0
  private nextAt = 0

  get unlocked(): boolean {
    return this.context !== null
  }

  unlock(): boolean {
    if (typeof window === 'undefined') return false
    if (!this.context) {
      const Audio =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Audio) return false
      try {
        this.context = new Audio()
      } catch {
        return false
      }
      this.master = this.context.createGain()
      this.scoreBus = this.context.createGain()
      this.effectsBus = this.context.createGain()
      this.scoreBus.connect(this.master)
      this.effectsBus.connect(this.master)
      this.master.connect(this.context.destination)
      this.applyMix()
      this.nextAt = this.context.currentTime + 0.04
      this.timer = setInterval(() => this.pump(), 60)
    }
    if (!this.hidden) void this.context.resume().catch(() => {})
    return true
  }

  setMix(next: PromMix): void {
    this.mix = parsePromMix(next)
    this.applyMix()
  }

  setMood(next: PromMood): void {
    if (next === this.mood) return
    this.mood = next
    this.step = 0
    if (this.context) this.nextAt = this.context.currentTime + 0.05
  }

  play(cues: readonly PromCue[]): void {
    const ctx = this.context
    if (!ctx || !this.effectsBus || this.mix.muted || this.hidden) return
    for (const [n, cue] of cues.slice(0, 3).entries()) {
      PROM_CUE_NOTES[cue].forEach((pitch, i) =>
        this.note(
          pitch,
          ctx.currentTime + 0.02 + n * 0.2 + i * 0.065,
          0.14,
          0.06,
          this.effectsBus!,
          'triangle',
        ),
      )
    }
  }

  setHidden(hidden: boolean): void {
    this.hidden = hidden
    if (!this.context) return
    if (hidden) void this.context.suspend().catch(() => {})
    else {
      this.nextAt = this.context.currentTime + 0.04
      void this.context.resume().catch(() => {})
    }
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    if (this.context) void this.context.close().catch(() => {})
    this.context = null
    this.master = null
    this.scoreBus = null
    this.effectsBus = null
    this.step = 0
    this.nextAt = 0
  }

  private applyMix(): void {
    if (!this.context || !this.master || !this.scoreBus || !this.effectsBus)
      return
    const at = this.context.currentTime
    this.master.gain.setTargetAtTime(
      this.mix.muted ? 0 : this.mix.master,
      at,
      0.04,
    )
    this.scoreBus.gain.setTargetAtTime(this.mix.music, at, 0.04)
    this.effectsBus.gain.setTargetAtTime(this.mix.effects, at, 0.04)
  }

  private note(
    midi: number,
    start: number,
    length: number,
    loudness: number,
    destination: GainNode,
    wave: OscillatorType,
  ): void {
    const ctx = this.context
    if (!ctx) return
    const oscillator = ctx.createOscillator()
    const envelope = ctx.createGain()
    oscillator.type = wave
    oscillator.frequency.setValueAtTime(promNoteHz(midi), start)
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(loudness, 0.001),
      start + 0.02,
    )
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + length)
    oscillator.connect(envelope)
    envelope.connect(destination)
    oscillator.start(start)
    oscillator.stop(start + length + 0.03)
  }

  private pump(): void {
    const ctx = this.context
    if (!ctx || !this.scoreBus || this.hidden || ctx.state !== 'running') return
    const theme = PROM_THEMES[this.mood]
    const unit = 60 / theme.bpm / 4
    if (this.nextAt < ctx.currentTime - 0.3)
      this.nextAt = ctx.currentTime + 0.03
    while (this.nextAt < ctx.currentTime + 0.25) {
      const bar = Math.floor((this.step % 64) / 16)
      const beat = this.step % 16
      const chord = theme.chords[bar]!
      if (beat === 0)
        chord.forEach((pitch) =>
          this.note(
            pitch,
            this.nextAt,
            unit * 14,
            theme.pulse * 0.014,
            this.scoreBus!,
            'sine',
          ),
        )
      if (beat % 4 === 0)
        this.note(
          chord[0]! - 12,
          this.nextAt,
          unit * 2.5,
          theme.pulse * 0.075,
          this.scoreBus,
          'triangle',
        )
      const melody = theme.melody[beat]
      if (melody !== undefined && melody !== REST)
        this.note(
          melody,
          this.nextAt,
          unit * 1.5,
          theme.pulse * 0.045,
          this.scoreBus,
          'sine',
        )
      if (beat === 0 || beat === 8)
        this.note(
          beat === 0 ? 40 : 47,
          this.nextAt,
          0.08,
          theme.pulse * 0.025,
          this.scoreBus,
          'square',
        )
      this.step++
      this.nextAt += unit
    }
  }
}
