/**
 * Crystal Street's sound effects (conductor crystal-street t-016), synthesised
 * with WebAudio so there are no audio files to render, ship or license: a dice
 * rattle, a synth sting for a win or a loss, a card swish, a dusk drone, a
 * dawn chime, and short cues for a new friend, a lead, the reveal and each
 * ending. Which cues play is decided by `cuesFor`, a pure diff of two run
 * states; `StreetSound` only plays them. Nothing sounds until the browser
 * allows audio, which is after the player's first tap.
 */
import type { RunState } from './rules'
import type { EndingTier } from './types'

export type Cue =
  | 'roll'
  | 'success'
  | 'failure'
  | 'card'
  | 'draw'
  | 'dusk'
  | 'dawn'
  | 'recruit'
  | 'clue'
  | 'reveal'
  | 'finale'
  | `ending-${EndingTier}`

/** The cues a move from `prev` to `next` earns, in the order they play. */
export function cuesFor(prev: RunState | null, next: RunState | null): Cue[] {
  if (!prev || !next || prev.seed !== next.seed) return []
  const cues: Cue[] = []
  if (next.ending && !prev.ending) return [`ending-${next.ending.tier}`]
  const rolled =
    next.pending &&
    (!prev.pending || (next.pending.rerolled && !prev.pending.rerolled))
  if (rolled) {
    cues.push('roll', next.pending!.roll.success ? 'success' : 'failure')
    return cues
  }
  if (next.phase === 'night' && prev.phase === 'day') cues.push('dusk')
  if (next.phase === 'day' && prev.phase === 'night') cues.push('dawn')
  if (next.revealed && !prev.revealed) cues.push('reveal')
  if (next.crew.length > prev.crew.length) cues.push('recruit')
  if (next.clues.length > prev.clues.length) cues.push('clue')
  if (next.current && next.current.id !== prev.current?.id) {
    if (next.current.kind === 'finale') cues.push('finale')
    else if (prev.draws && (next.draws ?? 0) < prev.draws) cues.push('draw')
    else cues.push('card')
  }
  return cues
}

// Note frequencies for the stings (equal temperament, A4 = 440).
const NOTE = {
  A2: 110,
  C3: 130.81,
  E3: 164.81,
  F3: 174.61,
  A3: 220,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  B4: 493.88,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  C6: 1046.5,
}

export class StreetSound {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  volume = 0.6

  /** Play cues one after another; a roll leaves room for its rattle. */
  play(cues: readonly Cue[]): void {
    const context = this.ready()
    if (!context) return
    let at = context.currentTime + 0.02
    for (const cue of cues) {
      this.cue(cue, at)
      at += cue === 'roll' ? 0.5 : 0.35
    }
  }

  dispose(): void {
    void this.context?.close()
    this.context = null
    this.master = null
    this.noise = null
  }

  private ready(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.context) {
      const Context =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Context) return null
      this.context = new Context()
      this.master = this.context.createGain()
      this.master.connect(this.context.destination)
    }
    if (this.context.state === 'suspended') void this.context.resume()
    this.master!.gain.value = 0.5 * this.volume
    return this.context
  }

  private cue(cue: Cue, at: number): void {
    switch (cue) {
      case 'roll':
        // Two dice: a handful of clicks that slow down as they settle.
        for (let i = 0; i < 9; i++) {
          const t = at + 0.04 * i + 0.006 * i * i
          this.burst(t, 0.025, 2400 + 900 * ((i * 7) % 3), 0.5 - 0.04 * i)
        }
        break
      case 'success':
        this.arpeggio(at, [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6], 'square', 0.07)
        break
      case 'failure':
        this.glide(at, NOTE.E4, NOTE.A2, 0.55, 'sawtooth', 0.12)
        break
      case 'card':
        this.swish(at, 0.18, 1800)
        break
      case 'draw':
        this.swish(at, 0.28, 900)
        this.tone(at + 0.12, NOTE.A3, 0.4, 'triangle', 0.08)
        break
      case 'dusk':
        // A theremin wobble sliding down into the night.
        this.glide(at, NOTE.A4, NOTE.D4, 1.4, 'sine', 0.12, 6)
        this.tone(at, NOTE.A2, 1.6, 'triangle', 0.08)
        break
      case 'dawn':
        this.arpeggio(at, [NOTE.G4, NOTE.B4, NOTE.D4 * 2], 'triangle', 0.1)
        break
      case 'recruit':
        this.arpeggio(at, [NOTE.E4, NOTE.A4, NOTE.C5, NOTE.E5], 'triangle', 0.1)
        break
      case 'clue':
        this.tone(at, NOTE.E5, 0.5, 'sine', 0.12)
        this.tone(at + 0.09, NOTE.B4, 0.6, 'sine', 0.08)
        break
      case 'reveal':
        // The organ stab every monster movie owes its title card.
        for (const f of [NOTE.C3, NOTE.F3 * 1.0595, NOTE.C4, NOTE.F4 * 1.0595])
          this.tone(at, f, 1.2, 'sawtooth', 0.06)
        break
      case 'finale':
        this.tone(at, NOTE.A2, 1.4, 'sawtooth', 0.08)
        this.glide(at + 0.2, NOTE.E3, NOTE.F3, 1.2, 'square', 0.05, 4)
        break
      case 'ending-best':
      case 'ending-good':
        this.arpeggio(
          at,
          [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5, NOTE.E5, NOTE.G5],
          'square',
          0.06,
          0.11,
        )
        break
      case 'ending-bittersweet':
        this.arpeggio(
          at,
          [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.G4],
          'triangle',
          0.09,
          0.2,
        )
        break
      case 'ending-bad':
        this.glide(at, NOTE.C4, NOTE.A2 / 2, 1.6, 'sawtooth', 0.12, 3)
        break
    }
  }

  private envelope(at: number, length: number, peak: number): GainNode {
    const gain = this.context!.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
    gain.connect(this.master!)
    return gain
  }

  private tone(
    at: number,
    frequency: number,
    length: number,
    type: OscillatorType,
    peak: number,
  ): void {
    const osc = this.context!.createOscillator()
    osc.type = type
    osc.frequency.value = frequency
    osc.connect(this.envelope(at, length, peak))
    osc.start(at)
    osc.stop(at + length + 0.05)
  }

  private arpeggio(
    at: number,
    notes: number[],
    type: OscillatorType,
    peak: number,
    step = 0.08,
  ): void {
    notes.forEach((f, i) =>
      this.tone(at + i * step, f, 0.35 + 0.05 * i, type, peak),
    )
  }

  private glide(
    at: number,
    from: number,
    to: number,
    length: number,
    type: OscillatorType,
    peak: number,
    vibrato = 0,
  ): void {
    const context = this.context!
    const osc = context.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(from, at)
    osc.frequency.exponentialRampToValueAtTime(to, at + length)
    if (vibrato) {
      const lfo = context.createOscillator()
      const depth = context.createGain()
      lfo.frequency.value = vibrato
      depth.gain.value = from * 0.02
      lfo.connect(depth).connect(osc.frequency)
      lfo.start(at)
      lfo.stop(at + length + 0.05)
    }
    osc.connect(this.envelope(at, length, peak))
    osc.start(at)
    osc.stop(at + length + 0.05)
  }

  private noiseBuffer(): AudioBuffer {
    if (this.noise) return this.noise
    const context = this.context!
    const buffer = context.createBuffer(
      1,
      context.sampleRate,
      context.sampleRate,
    )
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    this.noise = buffer
    return buffer
  }

  private burst(at: number, length: number, frequency: number, peak: number) {
    const context = this.context!
    const source = context.createBufferSource()
    source.buffer = this.noiseBuffer()
    const filter = context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = frequency
    filter.Q.value = 4
    source
      .connect(filter)
      .connect(this.envelope(at, length, Math.max(peak, 0.05)))
    source.start(at)
    source.stop(at + length + 0.02)
  }

  private swish(at: number, length: number, frequency: number): void {
    const context = this.context!
    const source = context.createBufferSource()
    source.buffer = this.noiseBuffer()
    const filter = context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 1.5
    filter.frequency.setValueAtTime(frequency * 0.5, at)
    filter.frequency.exponentialRampToValueAtTime(frequency * 2, at + length)
    source.connect(filter).connect(this.envelope(at, length, 0.25))
    source.start(at)
    source.stop(at + length + 0.02)
  }
}
