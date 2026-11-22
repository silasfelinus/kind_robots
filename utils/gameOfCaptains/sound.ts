/**
 * Space Couch sound and music (conductor game-of-captains t-046).
 *
 * Everything is synthesised with WebAudio, so there are no audio files to
 * render, ship or license. The score is original space-age lounge music: the
 * ship is a sofa, so the voyage gets the soundtrack of a very optimistic
 * cocktail party drifting through a nebula. Each voyage phase picks a mood
 * (title, bridge, away, tension, finale, ending) and the engine cross-fades
 * between their loops.
 *
 * The pure half (`couchMoodFor`, `couchCuesFor`, `scoreEvents`) decides what
 * should sound and is covered by verifySpaceCouchSound.test.ts. `CouchSound`
 * only plays it, and creates no AudioContext until `unlock()` runs inside a
 * user gesture, so nothing ever autoplays.
 */
import type { Result, VoyageRun } from './rules'

export type CouchMood =
  'title' | 'bridge' | 'away' | 'tension' | 'finale' | 'ending'

export type CouchCue =
  | 'tap'
  | 'launch'
  | 'warp'
  | 'arrive'
  | `result-${Result}`
  | 'redshirt-lost'
  | 'redshirt-hired'
  | 'crew-joined'
  | 'chapter'
  | 'ending'

export const COUCH_MOODS: readonly CouchMood[] = [
  'title',
  'bridge',
  'away',
  'tension',
  'finale',
  'ending',
]

/** The music a voyage state should play. No voyage is the title screen. */
export function couchMoodFor(run: VoyageRun | null | undefined): CouchMood {
  if (!run) return 'title'
  if (run.ending || run.phase === 'ending') return 'ending'
  switch (run.phase) {
    case 'travel':
    case 'transit':
    case 'expedition':
      return 'away'
    case 'decision':
      return 'tension'
    case 'finale':
      return 'finale'
    default:
      return 'bridge'
  }
}

/** The cues a move from `prev` to `next` earns, in the order they play. */
export function couchCuesFor(
  prev: VoyageRun | null | undefined,
  next: VoyageRun | null | undefined,
): CouchCue[] {
  if (!next) return []
  if (!prev) return next.phase === 'briefing' ? ['launch'] : []
  if (prev.seed !== next.seed) return ['launch']
  if (next.ending && !prev.ending) return ['ending']

  const cues: CouchCue[] = []
  const fallen = next.redshirtFallen?.length ?? 0
  if (fallen > (prev.redshirtFallen?.length ?? 0)) cues.push('redshirt-lost')

  const report = next.report
  if (report && report !== prev.report) cues.push(`result-${report.result}`)

  if (next.chapter > prev.chapter) cues.push('chapter')
  else if (next.phase !== prev.phase) {
    if (next.phase === 'travel' || next.phase === 'transit') cues.push('warp')
    else if (next.phase === 'expedition') cues.push('arrive')
  }

  if (next.crew.length > prev.crew.length) cues.push('crew-joined')
  const roster = next.redshirtRoster?.length ?? 0
  if (roster > (prev.redshirtRoster?.length ?? 0)) cues.push('redshirt-hired')
  return cues
}

// ---------------------------------------------------------------------------
// The score. Steps are sixteenth notes; notes are MIDI numbers (60 = middle C).
// Each mood is a short original loop: a chord progression voiced as a soft
// pad, a bass line, a vibraphone-like lead and brushed percussion.

export type Voice = 'pad' | 'bass' | 'lead' | 'brush' | 'thump'

export type ScoreEvent = {
  /** Step index within the whole performance, not the loop. */
  step: number
  voice: Voice
  /** MIDI notes; a pad plays several, percussion plays none. */
  notes: number[]
  /** Length in steps. */
  length: number
  velocity: number
}

type Phrase = (number | null)[]

export type Score = {
  bpm: number
  /** 0 is straight, 0.33 is a lazy lounge swing on the off sixteenths. */
  swing: number
  /** Each chord lasts one bar (16 steps). */
  chords: number[][]
  bass: Phrase
  lead: Phrase
  /** 'x' brush, 'o' soft thump, '.' rest; one bar, repeated. */
  drums: string
  /** Overall music level for the mood, 0..1. */
  level: number
}

const n = null

// prettier-ignore
export const COUCH_SCORES: Record<CouchMood, Score> = {
  // A bossa in F: Fmaj7 / Bb9 / Am7 / D7b9 / Gm7 / C9 / Fmaj7 / C7sus.
  title: {
    bpm: 112,
    swing: 0.28,
    chords: [
      [53, 57, 60, 64],
      [58, 62, 65, 68],
      [57, 60, 64, 67],
      [50, 54, 60, 63],
      [55, 58, 62, 65],
      [48, 52, 58, 62],
      [53, 57, 60, 64],
      [48, 53, 55, 58],
    ],
    bass: [
      41, n, n, 48, n, n, 41, n, 45, n, n, 48, n, n, 41, n,
      46, n, n, 53, n, n, 46, n, 50, n, n, 53, n, n, 46, n,
      45, n, n, 52, n, n, 45, n, 48, n, n, 52, n, n, 45, n,
      38, n, n, 45, n, n, 38, n, 42, n, n, 45, n, n, 38, n,
      43, n, n, 50, n, n, 43, n, 46, n, n, 50, n, n, 43, n,
      36, n, n, 43, n, n, 36, n, 40, n, n, 43, n, n, 36, n,
      41, n, n, 48, n, n, 41, n, 45, n, n, 48, n, n, 41, n,
      36, n, n, 43, n, n, 36, n, 38, n, 40, n, 43, n, 36, n,
    ],
    lead: [
      72, n, n, n, 76, n, 74, n, 72, n, n, n, 69, n, n, n,
      74, n, n, n, 77, n, 76, n, 74, n, n, n, n, n, n, n,
      76, n, n, n, 79, n, 77, n, 76, n, 72, n, n, n, n, n,
      75, n, n, n, 74, n, 72, n, 70, n, n, n, 69, n, n, n,
      70, n, n, n, 74, n, 72, n, 70, n, n, n, 67, n, n, n,
      72, n, n, n, 70, n, 69, n, 67, n, n, n, n, n, n, n,
      69, n, 72, n, 76, n, 79, n, 81, n, n, n, 79, n, 76, n,
      77, n, n, n, 74, n, n, n, 72, n, n, n, n, n, n, n,
    ],
    drums: 'o.x.x.o.o.x.x.x.',
    level: 0.85,
  },
  // Bridge: an unhurried vamp, Dm9 / G13 / Cmaj9 / A7alt, while the crew
  // pretends the couch has a duty roster.
  bridge: {
    bpm: 96,
    swing: 0.3,
    chords: [
      [50, 53, 57, 60, 64],
      [55, 59, 64, 65],
      [48, 52, 55, 59, 62],
      [45, 49, 55, 58, 61],
    ],
    bass: [
      38, n, n, n, 45, n, n, n, 38, n, n, 41, n, n, 45, n,
      43, n, n, n, 50, n, n, n, 43, n, n, 47, n, n, 50, n,
      36, n, n, n, 43, n, n, n, 36, n, n, 40, n, n, 43, n,
      33, n, n, n, 40, n, n, n, 33, n, n, 37, n, 40, n, n,
    ],
    lead: [
      n, n, 69, n, 72, n, n, n, 74, n, n, n, n, n, n, n,
      n, n, 71, n, 69, n, 67, n, 65, n, n, n, n, n, n, n,
      n, n, 67, n, 71, n, n, n, 74, n, 76, n, n, n, n, n,
      n, n, 73, n, 70, n, n, n, 69, n, n, n, n, n, n, n,
    ],
    drums: 'o...x...o.o.x...',
    level: 0.7,
  },
  // Away: brighter and quicker, a Lydian shimmer over a pedal, for warps,
  // landings and unwise hikes.
  away: {
    bpm: 124,
    swing: 0.12,
    chords: [
      [50, 57, 62, 66, 68],
      [52, 59, 64, 68, 71],
      [50, 57, 62, 66, 69],
      [48, 55, 60, 64, 66],
    ],
    bass: [
      38, n, 38, n, 45, n, 38, n, 38, n, 45, n, 50, n, 45, n,
      40, n, 40, n, 47, n, 40, n, 40, n, 47, n, 52, n, 47, n,
      38, n, 38, n, 45, n, 38, n, 38, n, 45, n, 50, n, 45, n,
      36, n, 36, n, 43, n, 36, n, 36, n, 43, n, 48, n, 43, n,
    ],
    lead: [
      74, n, 78, n, 81, n, 80, n, 78, n, n, n, 74, n, n, n,
      76, n, 80, n, 83, n, n, n, 81, n, 80, n, n, n, n, n,
      78, n, 81, n, 86, n, 85, n, 81, n, n, n, 78, n, n, n,
      76, n, 79, n, 78, n, 74, n, 72, n, n, n, n, n, n, n,
    ],
    drums: 'o.x.x.x.o.x.xox.',
    level: 0.75,
  },
  // Tension: the ethics call. Low, sparse, a held minor-major chord and a
  // two-note question that does not resolve.
  tension: {
    bpm: 84,
    swing: 0,
    chords: [
      [45, 48, 52, 56],
      [44, 48, 51, 55],
      [45, 48, 52, 56],
      [41, 45, 48, 52],
    ],
    bass: [
      33, n, n, n, n, n, n, n, 33, n, n, n, 32, n, n, n,
      32, n, n, n, n, n, n, n, 32, n, n, n, 33, n, n, n,
      33, n, n, n, n, n, n, n, 33, n, n, n, 35, n, n, n,
      29, n, n, n, n, n, n, n, 29, n, n, n, 32, n, n, n,
    ],
    lead: [
      n, n, n, n, 68, n, n, n, 69, n, n, n, n, n, n, n,
      n, n, n, n, 67, n, n, n, 68, n, n, n, n, n, n, n,
      n, n, n, n, 71, n, n, n, 72, n, n, n, n, n, n, n,
      n, n, n, n, 69, n, n, n, 68, n, n, n, n, n, n, n,
    ],
    drums: 'o.......o.......',
    level: 0.6,
  },
  // Finale: the whole lounge band stands up. Bb / C / Am7 / D7 / Gm7 / C7 /
  // F / F, four on the floor with the brush doubling.
  finale: {
    bpm: 132,
    swing: 0.08,
    chords: [
      [46, 50, 53, 58],
      [48, 52, 55, 60],
      [45, 48, 52, 55],
      [50, 54, 57, 60],
      [43, 46, 50, 53],
      [48, 52, 55, 58],
      [41, 45, 48, 53],
      [41, 45, 48, 53, 57],
    ],
    bass: [
      34, n, 41, n, 34, n, 41, n, 34, n, 41, n, 46, n, 41, n,
      36, n, 43, n, 36, n, 43, n, 36, n, 43, n, 48, n, 43, n,
      33, n, 40, n, 33, n, 40, n, 33, n, 40, n, 45, n, 40, n,
      38, n, 45, n, 38, n, 45, n, 38, n, 45, n, 42, n, 45, n,
      31, n, 38, n, 31, n, 38, n, 31, n, 38, n, 43, n, 38, n,
      36, n, 43, n, 36, n, 43, n, 36, n, 43, n, 46, n, 43, n,
      29, n, 36, n, 29, n, 36, n, 29, n, 36, n, 41, n, 36, n,
      29, n, 36, n, 29, n, 36, n, 41, n, 40, n, 38, n, 36, n,
    ],
    lead: [
      74, n, n, 77, n, n, 74, n, 72, n, 70, n, 69, n, n, n,
      72, n, n, 76, n, n, 72, n, 70, n, 69, n, 67, n, n, n,
      69, n, 72, n, 76, n, 79, n, 76, n, 72, n, 69, n, n, n,
      78, n, n, n, 76, n, 74, n, 72, n, 69, n, 66, n, n, n,
      70, n, n, 74, n, n, 77, n, 79, n, 77, n, 74, n, n, n,
      76, n, n, 79, n, n, 82, n, 81, n, 79, n, 76, n, n, n,
      77, n, n, n, 81, n, n, n, 84, n, n, n, 81, n, n, n,
      77, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n,
    ],
    drums: 'o.x.oox.o.x.oox.',
    level: 0.85,
  },
  // Ending: the couch settles. A slow plagal lullaby, Fmaj9 / Bbmaj7 / F.
  ending: {
    bpm: 72,
    swing: 0.2,
    chords: [
      [41, 48, 52, 55, 57],
      [46, 50, 53, 57],
      [43, 50, 53, 58],
      [41, 48, 53, 57, 60],
    ],
    bass: [
      29, n, n, n, n, n, n, n, 36, n, n, n, n, n, n, n,
      34, n, n, n, n, n, n, n, 41, n, n, n, n, n, n, n,
      31, n, n, n, n, n, n, n, 38, n, n, n, n, n, n, n,
      29, n, n, n, n, n, n, n, 36, n, n, n, n, n, n, n,
    ],
    lead: [
      72, n, n, n, n, n, 69, n, 67, n, n, n, 65, n, n, n,
      69, n, n, n, n, n, 70, n, 72, n, n, n, n, n, n, n,
      74, n, n, n, 72, n, n, n, 70, n, n, n, 69, n, n, n,
      67, n, n, n, n, n, n, n, 65, n, n, n, n, n, n, n,
    ],
    drums: '........x.......',
    level: 0.6,
  },
}

/** Steps in one loop of a score (16 per chord). */
export function scoreLength(score: Score): number {
  return score.chords.length * 16
}

/** Seconds a step lasts, before swing. */
export function stepSeconds(score: Score): number {
  return 60 / score.bpm / 4
}

/** Offset, in seconds, that swing adds to a step's start. */
export function swingOffset(score: Score, step: number): number {
  return step % 2 === 1 ? score.swing * stepSeconds(score) * 0.5 : 0
}

/**
 * Every note that starts on a step in [from, to). Pure and deterministic, so
 * the score can be checked note for note without a browser.
 */
export function scoreEvents(
  score: Score,
  from: number,
  to: number,
): ScoreEvent[] {
  const events: ScoreEvent[] = []
  const loop = scoreLength(score)
  for (let step = Math.max(0, from); step < to; step++) {
    const at = step % loop
    const beat = at % 16
    if (beat === 0) {
      events.push({
        step,
        voice: 'pad',
        notes: score.chords[at / 16]!,
        length: 16,
        velocity: 0.5,
      })
    }
    const bass = score.bass[at % score.bass.length]
    if (bass != null) {
      events.push({
        step,
        voice: 'bass',
        notes: [bass],
        length: 3,
        velocity: beat === 0 ? 0.9 : 0.7,
      })
    }
    const lead = score.lead[at % score.lead.length]
    if (lead != null) {
      events.push({
        step,
        voice: 'lead',
        notes: [lead],
        length: 4,
        velocity: beat % 4 === 0 ? 0.8 : 0.6,
      })
    }
    const hit = score.drums[beat]
    if (hit === 'x' || hit === 'o') {
      events.push({
        step,
        voice: hit === 'x' ? 'brush' : 'thump',
        notes: [],
        length: 1,
        velocity: beat % 4 === 0 ? 0.8 : 0.5,
      })
    }
  }
  return events
}

export function midiToHz(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12)
}

// ---------------------------------------------------------------------------
// Cue sketches: each is a short list of tones, so they read (and test) as data.

export type Tone = {
  /** Start, seconds after the cue begins. */
  at: number
  note: number
  /** Duration in seconds. */
  dur: number
  type: OscillatorType
  gain: number
  /** Optional pitch glide target (MIDI) across the tone. */
  glide?: number
}

export const COUCH_CUE_TONES: Record<CouchCue, Tone[]> = {
  tap: [{ at: 0, note: 84, dur: 0.06, type: 'sine', gain: 0.18 }],
  launch: [
    { at: 0, note: 53, dur: 0.5, type: 'triangle', gain: 0.3, glide: 65 },
    { at: 0.18, note: 72, dur: 0.18, type: 'sine', gain: 0.25 },
    { at: 0.3, note: 76, dur: 0.18, type: 'sine', gain: 0.25 },
    { at: 0.42, note: 79, dur: 0.4, type: 'sine', gain: 0.25 },
  ],
  warp: [
    { at: 0, note: 48, dur: 0.7, type: 'sawtooth', gain: 0.12, glide: 84 },
    { at: 0.05, note: 60, dur: 0.6, type: 'sine', gain: 0.18, glide: 96 },
  ],
  arrive: [
    { at: 0, note: 79, dur: 0.25, type: 'sine', gain: 0.2 },
    { at: 0.12, note: 74, dur: 0.35, type: 'sine', gain: 0.2 },
  ],
  'result-flawless': [
    { at: 0, note: 72, dur: 0.14, type: 'triangle', gain: 0.28 },
    { at: 0.1, note: 76, dur: 0.14, type: 'triangle', gain: 0.28 },
    { at: 0.2, note: 79, dur: 0.14, type: 'triangle', gain: 0.28 },
    { at: 0.3, note: 84, dur: 0.6, type: 'triangle', gain: 0.3 },
    { at: 0.3, note: 88, dur: 0.6, type: 'sine', gain: 0.15 },
  ],
  'result-success': [
    { at: 0, note: 72, dur: 0.16, type: 'triangle', gain: 0.28 },
    { at: 0.13, note: 76, dur: 0.16, type: 'triangle', gain: 0.28 },
    { at: 0.26, note: 79, dur: 0.5, type: 'triangle', gain: 0.28 },
  ],
  'result-costly': [
    { at: 0, note: 72, dur: 0.18, type: 'triangle', gain: 0.26 },
    { at: 0.16, note: 71, dur: 0.18, type: 'triangle', gain: 0.26 },
    { at: 0.32, note: 74, dur: 0.5, type: 'triangle', gain: 0.24 },
  ],
  'result-disaster': [
    { at: 0, note: 67, dur: 0.3, type: 'sawtooth', gain: 0.14, glide: 66 },
    { at: 0.28, note: 63, dur: 0.3, type: 'sawtooth', gain: 0.14, glide: 62 },
    { at: 0.56, note: 55, dur: 0.8, type: 'sawtooth', gain: 0.16, glide: 50 },
  ],
  'redshirt-lost': [
    { at: 0, note: 60, dur: 0.5, type: 'sine', gain: 0.25 },
    { at: 0.45, note: 55, dur: 0.5, type: 'sine', gain: 0.25 },
    { at: 0.9, note: 48, dur: 1.2, type: 'sine', gain: 0.22 },
  ],
  'redshirt-hired': [
    { at: 0, note: 76, dur: 0.1, type: 'square', gain: 0.08 },
    { at: 0.09, note: 81, dur: 0.16, type: 'square', gain: 0.08 },
  ],
  'crew-joined': [
    { at: 0, note: 69, dur: 0.2, type: 'triangle', gain: 0.22 },
    { at: 0.15, note: 74, dur: 0.2, type: 'triangle', gain: 0.22 },
    { at: 0.3, note: 78, dur: 0.45, type: 'triangle', gain: 0.22 },
  ],
  chapter: [
    { at: 0, note: 41, dur: 1.2, type: 'sine', gain: 0.25, glide: 53 },
    { at: 0.3, note: 77, dur: 0.3, type: 'sine', gain: 0.2 },
    { at: 0.5, note: 81, dur: 0.3, type: 'sine', gain: 0.2 },
    { at: 0.7, note: 84, dur: 0.7, type: 'sine', gain: 0.2 },
  ],
  ending: [
    { at: 0, note: 65, dur: 1.6, type: 'triangle', gain: 0.2 },
    { at: 0, note: 69, dur: 1.6, type: 'triangle', gain: 0.18 },
    { at: 0, note: 72, dur: 1.6, type: 'triangle', gain: 0.18 },
    { at: 0.4, note: 77, dur: 1.4, type: 'sine', gain: 0.2 },
    { at: 0.8, note: 81, dur: 1.4, type: 'sine', gain: 0.16 },
  ],
}

// ---------------------------------------------------------------------------
// Mixer settings, stored per device beside the Playbook Kit's on/off switch.

export type CouchMix = { music: number; effects: number }
export const COUCH_MIX_KEY = 'space-couch-mix-v1'
export const DEFAULT_COUCH_MIX: CouchMix = { music: 0.55, effects: 0.75 }

function level(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback
}

/** A stored mix, clamped, with defaults for anything missing or unreadable. */
export function parseCouchMix(raw: string | null | undefined): CouchMix {
  if (!raw) return { ...DEFAULT_COUCH_MIX }
  try {
    const data = JSON.parse(raw) as Partial<CouchMix> | null
    return {
      music: level(data?.music, DEFAULT_COUCH_MIX.music),
      effects: level(data?.effects, DEFAULT_COUCH_MIX.effects),
    }
  } catch {
    return { ...DEFAULT_COUCH_MIX }
  }
}

// ---------------------------------------------------------------------------
// The player.

type Ctor = typeof AudioContext

function audioContextCtor(): Ctor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { webkitAudioContext?: Ctor }
  return window.AudioContext ?? w.webkitAudioContext ?? null
}

const LOOKAHEAD = 0.25
const TICK_MS = 90
const FADE = 1.2

type Band = {
  mood: CouchMood
  bus: GainNode
  step: number
  nextTime: number
}

export class CouchSound {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private musicBus: GainNode | null = null
  private effectsBus: GainNode | null = null
  private noise: AudioBuffer | null = null
  private band: Band | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private mood: CouchMood = 'title'
  private enabled = true
  private mix: CouchMix = { ...DEFAULT_COUCH_MIX }

  /** True once a gesture has created the AudioContext. */
  get unlocked(): boolean {
    return !!this.context
  }

  /** Call from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (!this.enabled) return
    if (!this.context) {
      const Ctx = audioContextCtor()
      if (!Ctx) return
      try {
        this.context = new Ctx()
      } catch {
        return
      }
      const ctx = this.context
      this.master = ctx.createGain()
      this.master.gain.value = 0.8
      const comp = ctx.createDynamicsCompressor()
      this.master.connect(comp).connect(ctx.destination)
      this.musicBus = ctx.createGain()
      this.effectsBus = ctx.createGain()
      this.musicBus.connect(this.master)
      this.effectsBus.connect(this.master)
      this.applyMix()
      this.startMood(this.mood)
      this.timer = setInterval(() => this.schedule(), TICK_MS)
    }
    if (this.context.state === 'suspended') void this.context.resume()
  }

  setEnabled(on: boolean): void {
    this.enabled = on
    if (!this.context) return
    if (on) void this.context.resume()
    else void this.context.suspend()
  }

  setMix(mix: CouchMix): void {
    this.mix = { ...mix }
    this.applyMix()
  }

  /** Pause while the tab is hidden; resume when the player returns. */
  setHidden(hidden: boolean): void {
    if (!this.context || !this.enabled) return
    if (hidden) void this.context.suspend()
    else void this.context.resume()
  }

  setMood(mood: CouchMood): void {
    if (mood === this.mood && this.band) return
    this.mood = mood
    if (this.context) this.startMood(mood)
  }

  play(cues: readonly CouchCue[]): void {
    const ctx = this.context
    if (!ctx || !this.enabled || !this.effectsBus || this.mix.effects <= 0)
      return
    let offset = 0
    for (const cue of cues) {
      const tones = COUCH_CUE_TONES[cue]
      for (const tone of tones) this.tone(ctx.currentTime + offset, tone)
      offset += Math.min(0.5, Math.max(...tones.map((t) => t.at + t.dur * 0.6)))
    }
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.band = null
    const ctx = this.context
    this.context = null
    if (ctx) void ctx.close().catch(() => undefined)
  }

  private applyMix(): void {
    const ctx = this.context
    if (!ctx || !this.musicBus || !this.effectsBus) return
    const now = ctx.currentTime
    // Square the slider so its lower half stays usable as background music.
    this.musicBus.gain.setTargetAtTime(this.mix.music ** 2 * 0.6, now, 0.08)
    this.effectsBus.gain.setTargetAtTime(this.mix.effects ** 2, now, 0.05)
  }

  private startMood(mood: CouchMood): void {
    const ctx = this.context
    if (!ctx || !this.musicBus) return
    const now = ctx.currentTime
    const old = this.band
    if (old) {
      old.bus.gain.cancelScheduledValues(now)
      old.bus.gain.setValueAtTime(old.bus.gain.value, now)
      old.bus.gain.linearRampToValueAtTime(0, now + FADE)
      setTimeout(() => old.bus.disconnect(), (FADE + 3) * 1000)
    }
    const bus = ctx.createGain()
    const target = COUCH_SCORES[mood].level
    bus.gain.setValueAtTime(old ? 0 : target, now)
    if (old) bus.gain.linearRampToValueAtTime(target, now + FADE)
    bus.connect(this.musicBus)
    this.band = { mood, bus, step: 0, nextTime: now + 0.08 }
  }

  private schedule(): void {
    const ctx = this.context
    const band = this.band
    if (!ctx || !band || ctx.state !== 'running') return
    const score = COUCH_SCORES[band.mood]
    const step = stepSeconds(score)
    // A long stall (a backgrounded tab) skips ahead instead of bursting.
    if (band.nextTime < ctx.currentTime - 0.5) band.nextTime = ctx.currentTime
    while (band.nextTime < ctx.currentTime + LOOKAHEAD) {
      for (const event of scoreEvents(score, band.step, band.step + 1)) {
        this.voice(
          band.bus,
          band.nextTime + swingOffset(score, band.step),
          event,
          step,
        )
      }
      band.step++
      band.nextTime += step
    }
  }

  private voice(
    bus: GainNode,
    at: number,
    event: ScoreEvent,
    step: number,
  ): void {
    const ctx = this.context!
    const dur = event.length * step
    if (event.voice === 'brush' || event.voice === 'thump') {
      this.drum(bus, at, event.voice, event.velocity)
      return
    }
    for (const note of event.notes) {
      const gain = ctx.createGain()
      const osc = ctx.createOscillator()
      osc.frequency.value = midiToHz(note)
      let peak = event.velocity
      let attack = 0.01
      let release = dur
      if (event.voice === 'pad') {
        osc.type = 'triangle'
        peak *= 0.045
        attack = 0.35
        release = dur * 1.05
      } else if (event.voice === 'bass') {
        osc.type = 'sine'
        peak *= 0.32
        release = dur * 0.9
      } else {
        // A vibraphone-ish lead: a sine with a soft overtone and tremolo.
        osc.type = 'sine'
        peak *= 0.14
        release = dur * 1.6
        const over = ctx.createOscillator()
        const overGain = ctx.createGain()
        over.frequency.value = midiToHz(note) * 4
        overGain.gain.setValueAtTime(peak * 0.25, at)
        overGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.25)
        over.connect(overGain).connect(bus)
        over.start(at)
        over.stop(at + 0.3)
        const trem = ctx.createOscillator()
        const tremDepth = ctx.createGain()
        trem.frequency.value = 5.5
        tremDepth.gain.value = peak * 0.25
        trem.connect(tremDepth).connect(gain.gain)
        trem.start(at)
        trem.stop(at + release + 0.1)
      }
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.linearRampToValueAtTime(peak, at + attack)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + release)
      osc.connect(gain).connect(bus)
      osc.start(at)
      osc.stop(at + attack + release + 0.05)
    }
  }

  private drum(
    bus: GainNode,
    at: number,
    kind: 'brush' | 'thump',
    velocity: number,
  ): void {
    const ctx = this.context!
    if (kind === 'thump') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(110, at)
      osc.frequency.exponentialRampToValueAtTime(45, at + 0.18)
      gain.gain.setValueAtTime(0.35 * velocity, at)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.22)
      osc.connect(gain).connect(bus)
      osc.start(at)
      osc.stop(at + 0.25)
      return
    }
    const source = ctx.createBufferSource()
    source.buffer = this.noiseBuffer()
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 6500
    filter.Q.value = 0.8
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.linearRampToValueAtTime(0.06 * velocity, at + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.12)
    source.connect(filter).connect(gain).connect(bus)
    source.start(at)
    source.stop(at + 0.15)
  }

  private tone(start: number, tone: Tone): void {
    const ctx = this.context!
    const at = start + tone.at
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = tone.type
    osc.frequency.setValueAtTime(midiToHz(tone.note), at)
    if (tone.glide != null) {
      osc.frequency.exponentialRampToValueAtTime(
        midiToHz(tone.glide),
        at + tone.dur,
      )
    }
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.linearRampToValueAtTime(tone.gain, at + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + tone.dur)
    osc.connect(gain).connect(this.effectsBus!)
    osc.start(at)
    osc.stop(at + tone.dur + 0.05)
  }

  private noiseBuffer(): AudioBuffer {
    if (this.noise) return this.noise
    const ctx = this.context!
    const length = Math.floor(ctx.sampleRate * 0.2)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    // A fixed LCG keeps the brush identical every session.
    let seed = 0x2f6b1d
    for (let i = 0; i < length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      data[i] = (seed / 0xffffffff) * 2 - 1
    }
    this.noise = buffer
    return buffer
  }
}
