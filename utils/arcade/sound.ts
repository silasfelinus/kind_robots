// /utils/arcade/sound.ts
//
// Chiptune bleeps from WebAudio oscillators: no audio files to download. The
// AudioContext is only created after the first user gesture (browsers refuse
// to start one earlier). The arcade store persists the mute choice.
//
// Besides the shared presets a game can play its own notes (playNotes) and
// run one music loop (startMusic): a step sequencer written as note tokens,
// scheduled a little ahead of the clock and routed through a music gain so
// muting silences it at once.

export type ArcadeSoundName =
  | 'shoot'
  | 'pop'
  | 'boom'
  | 'pickup'
  | 'die'
  | 'start'
  | 'level'
  | 'extra'
  | 'blip'
  | 'warn'

export type Note = {
  freq: number
  to?: number
  dur: number
  type?: OscillatorType
  vol?: number
  at?: number
  noise?: boolean
}

const PRESETS: Record<ArcadeSoundName, Note[]> = {
  shoot: [{ freq: 1200, to: 600, dur: 0.07, type: 'square', vol: 0.05 }],
  pop: [{ freq: 500, to: 120, dur: 0.12, type: 'triangle', vol: 0.12 }],
  boom: [{ freq: 200, dur: 0.35, noise: true, vol: 0.18 }],
  pickup: [
    { freq: 660, dur: 0.06, type: 'square', vol: 0.06 },
    { freq: 990, dur: 0.09, type: 'square', vol: 0.06, at: 0.06 },
  ],
  die: [{ freq: 600, to: 60, dur: 0.7, type: 'sawtooth', vol: 0.08 }],
  start: [
    { freq: 523, dur: 0.1, type: 'square', vol: 0.06 },
    { freq: 659, dur: 0.1, type: 'square', vol: 0.06, at: 0.1 },
    { freq: 784, dur: 0.1, type: 'square', vol: 0.06, at: 0.2 },
    { freq: 1047, dur: 0.2, type: 'square', vol: 0.06, at: 0.3 },
  ],
  level: [
    { freq: 784, dur: 0.08, type: 'triangle', vol: 0.1 },
    { freq: 988, dur: 0.08, type: 'triangle', vol: 0.1, at: 0.09 },
    { freq: 1319, dur: 0.18, type: 'triangle', vol: 0.1, at: 0.18 },
  ],
  extra: [
    { freq: 1047, dur: 0.08, type: 'square', vol: 0.06 },
    { freq: 1319, dur: 0.08, type: 'square', vol: 0.06, at: 0.08 },
    { freq: 1568, dur: 0.08, type: 'square', vol: 0.06, at: 0.16 },
    { freq: 2093, dur: 0.16, type: 'square', vol: 0.06, at: 0.24 },
  ],
  blip: [{ freq: 880, dur: 0.04, type: 'square', vol: 0.04 }],
  warn: [{ freq: 220, to: 330, dur: 0.15, type: 'square', vol: 0.05 }],
}

// ---------------------------------------------------------------- music

/**
 * One voice of a loop: whitespace-separated step tokens, one per step. A note
 * (`A4`, `C#5`, `Bb2`) starts on its step, `-` holds the previous note one
 * more step, `.` rests; on a `noise` track `x` is a hit.
 */
export type LoopTrack = {
  steps: string
  type?: OscillatorType
  vol?: number
  noise?: boolean
}

export type MusicLoop = {
  bpm: number
  /** Steps per beat (2 = eighth notes). */
  stepsPerBeat?: number
  tracks: LoopTrack[]
}

export type LoopNote = {
  /** Step the note starts on. */
  step: number
  /** Steps it lasts (the note and its holds). */
  steps: number
  freq: number
  type: OscillatorType
  vol: number
  noise: boolean
}

export type ParsedLoop = {
  /** Seconds per step. */
  stepDur: number
  /** Steps in the loop (the longest track). */
  length: number
  notes: LoopNote[]
}

const SEMITONES: Record<string, number> = {
  C: -9,
  D: -7,
  E: -5,
  F: -4,
  G: -2,
  A: 0,
  B: 2,
}

/** A note name as hertz (A4 = 440), or null if it isn't one. */
export function noteFreq(name: string): number | null {
  const m = /^([A-G])(#|b)?(\d)$/.exec(name)
  if (!m) return null
  const semis =
    SEMITONES[m[1]!]! +
    (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) +
    (Number(m[3]) - 4) * 12
  return 440 * Math.pow(2, semis / 12)
}

/** A loop's tokens as timed notes; throws on a token that is not a note, `-`, `.` or `x`. */
export function parseLoop(loop: MusicLoop): ParsedLoop {
  const stepDur = 60 / loop.bpm / (loop.stepsPerBeat ?? 2)
  const notes: LoopNote[] = []
  let length = 0
  for (const track of loop.tracks) {
    const tokens = track.steps.trim().split(/\s+/)
    length = Math.max(length, tokens.length)
    let current: LoopNote | null = null
    tokens.forEach((token, step) => {
      if (token === '-') {
        if (current) current.steps += 1
        return
      }
      current = null
      if (token === '.') return
      const freq = track.noise ? (token === 'x' ? 1 : null) : noteFreq(token)
      if (freq === null) throw new Error(`music: bad step token ${token}`)
      current = {
        step,
        steps: 1,
        freq,
        type: track.type ?? 'square',
        vol: track.vol ?? 0.04,
        noise: track.noise === true,
      }
      notes.push(current)
    })
  }
  return { stepDur, length, notes }
}

/**
 * The notes of a looping `parsed` that start in [from, to) seconds after the
 * loop began, with their start times: what to schedule for that window.
 */
export function loopNotesBetween(
  parsed: ParsedLoop,
  from: number,
  to: number,
): Array<{ note: LoopNote; time: number }> {
  const out: Array<{ note: LoopNote; time: number }> = []
  const period = parsed.length * parsed.stepDur
  if (period <= 0 || to <= from) return out
  const first = Math.floor(from / period)
  const last = Math.floor((to - 1e-9) / period)
  for (let lap = first; lap <= last; lap += 1) {
    for (const note of parsed.notes) {
      const time = lap * period + note.step * parsed.stepDur
      if (time >= from && time < to) out.push({ note, time })
    }
  }
  return out.sort((a, b) => a.time - b.time)
}

/** How far ahead the music is scheduled, and how often the scheduler wakes. */
const MUSIC_AHEAD = 0.3
const MUSIC_TICK_MS = 100

export type ArcadeSound = {
  play: (name: ArcadeSoundName) => void
  /** Play a game's own sound. */
  playNotes: (notes: Note[]) => void
  /** Start looping `loop` (replacing any loop playing); it waits for unlock. */
  startMusic: (loop: MusicLoop) => void
  stopMusic: () => void
  unlock: () => void
  readonly muted: boolean
  setMuted: (muted: boolean) => void
  dispose: () => void
}

export function createArcadeSound(startMuted = false): ArcadeSound {
  let ctx: AudioContext | null = null
  let muted = startMuted
  let musicGain: GainNode | null = null
  let music: {
    parsed: ParsedLoop
    started: number | null
    until: number
  } | null = null
  let timer: ReturnType<typeof setInterval> | null = null

  const schedule = () => {
    if (!ctx || !music || ctx.state !== 'running') return
    if (!musicGain) {
      musicGain = ctx.createGain()
      musicGain.gain.value = muted ? 0 : 1
      musicGain.connect(ctx.destination)
    }
    const now = ctx.currentTime
    if (music.started === null) {
      music.started = now + 0.05
      music.until = 0
    }
    const from = Math.max(music.until, now - music.started)
    const to = now - music.started + MUSIC_AHEAD
    for (const { note, time } of loopNotesBetween(music.parsed, from, to)) {
      voice(
        ctx,
        {
          freq: note.freq,
          dur: note.steps * music.parsed.stepDur * 0.95,
          type: note.type,
          vol: note.vol,
          noise: note.noise,
          at: music.started + time - now,
        },
        musicGain,
      )
    }
    music.until = Math.max(music.until, to)
  }

  const unlock = () => {
    if (ctx || typeof window === 'undefined') {
      if (ctx?.state === 'suspended') void ctx.resume()
      return
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return
    ctx = new Ctor()
  }

  function voice(
    audio: AudioContext,
    note: Note,
    out: AudioNode = audio.destination,
  ) {
    const start = audio.currentTime + Math.max(0, note.at ?? 0)
    const gain = audio.createGain()
    const vol = note.vol ?? 0.08
    gain.gain.setValueAtTime(vol, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur)
    gain.connect(out)
    if (note.noise) {
      const length = Math.max(1, Math.floor(audio.sampleRate * note.dur))
      const buffer = audio.createBuffer(1, length, audio.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length)
      }
      const source = audio.createBufferSource()
      source.buffer = buffer
      source.connect(gain)
      source.start(start)
      return
    }
    const osc = audio.createOscillator()
    osc.type = note.type ?? 'square'
    osc.frequency.setValueAtTime(note.freq, start)
    if (note.to) {
      osc.frequency.exponentialRampToValueAtTime(note.to, start + note.dur)
    }
    osc.connect(gain)
    osc.start(start)
    osc.stop(start + note.dur + 0.02)
  }

  const stopMusic = () => {
    if (timer) clearInterval(timer)
    timer = null
    music = null
    // Notes already scheduled are cut by dropping the gain they play through.
    musicGain?.disconnect()
    musicGain = null
  }

  return {
    play(name) {
      if (muted || !ctx || ctx.state !== 'running') return
      for (const note of PRESETS[name]) voice(ctx, note)
    },
    playNotes(notes) {
      if (muted || !ctx || ctx.state !== 'running') return
      for (const note of notes) voice(ctx, note)
    },
    startMusic(loop) {
      stopMusic()
      music = { parsed: parseLoop(loop), started: null, until: 0 }
      if (typeof setInterval === 'undefined') return
      timer = setInterval(schedule, MUSIC_TICK_MS)
      schedule()
    },
    stopMusic,
    unlock,
    get muted() {
      return muted
    },
    setMuted(next) {
      muted = next
      if (musicGain) musicGain.gain.value = muted ? 0 : 1
    },
    dispose() {
      stopMusic()
      void ctx?.close()
      ctx = null
    },
  }
}
