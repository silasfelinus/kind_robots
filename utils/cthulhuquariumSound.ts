// /utils/cthulhuquariumSound.ts
//
// The tank's sound, synthesised with WebAudio so there are no audio files to
// render, ship or license: a low filtered hum of moving water, bubble plinks,
// a knock when the glass is tapped, a plop when food lands, and a small bright
// chime when a scale is collected. Since t-110 it also plays every game event's
// effect (utils/cthulhuquariumSfx.ts) and the floor's theme
// (utils/cthulhuquariumMusic.ts). Nothing plays until start() is called from a
// user gesture (browsers block audio otherwise), and stop() tears it down.
//
// Mix: master (the settings volume) -> hum / effects / music busses.

import {
  CTHULHUQUARIUM_SFX,
  type CthulhuquariumSfxName,
  type CthulhuquariumSfxVoice,
} from './cthulhuquariumSfx'
import {
  composeCthulhuquariumPhrase,
  cthulhuquariumMidiToHz,
  cthulhuquariumThemeFor,
  CTHULHUQUARIUM_PHRASE_BEATS,
  type CthulhuquariumMusicNote,
} from './cthulhuquariumMusic'

const MUSIC_LEVEL = 0.32
const SCHEDULE_AHEAD_SECONDS = 1.2

export class TankSound {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private sfxBus: GainNode | null = null
  private musicBus: GainNode | null = null
  private echoSend: GainNode | null = null
  private echoFeedback: GainNode | null = null
  private echoDelay: DelayNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private hum: AudioBufferSourceNode | null = null
  private lastPlink = 0
  private musicTimer: ReturnType<typeof setInterval> | null = null
  private musicFloor = 1
  private nextPhraseAt = 0
  private phraseIndex = 0

  get running(): boolean {
    return this.context?.state === 'running'
  }

  start(volume = 0.5): void {
    if (typeof window === 'undefined') return
    if (!this.context) {
      const Context =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Context) return
      this.context = new Context()
      this.master = this.context.createGain()
      this.master.gain.value = 0
      this.master.connect(this.context.destination)
      this.sfxBus = this.context.createGain()
      this.sfxBus.connect(this.master)
      this.musicBus = this.context.createGain()
      this.musicBus.gain.value = 0
      this.musicBus.connect(this.master)
      this.buildEcho()
      this.startHum()
    }
    void this.context.resume()
    const now = this.context.currentTime
    this.master?.gain.cancelScheduledValues(now)
    this.master?.gain.linearRampToValueAtTime(0.35 * volume, now + 1.5)
  }

  /** cthulhuquarium/t-100: the settings panel's volume (0-1), applied live. */
  setVolume(volume: number): void {
    if (!this.context || !this.master) return
    const now = this.context.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.linearRampToValueAtTime(
      0.35 * Math.min(1, Math.max(0, volume)),
      now + 0.2,
    )
  }

  stop(): void {
    this.stopMusic()
    if (!this.context || !this.master) return
    const now = this.context.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.linearRampToValueAtTime(0, now + 0.4)
    const context = this.context
    setTimeout(() => void context.suspend(), 500)
  }

  dispose(): void {
    this.stopMusic()
    this.hum?.stop()
    void this.context?.close()
    this.context = null
    this.master = null
    this.sfxBus = null
    this.musicBus = null
    this.hum = null
  }

  // --- effects ---------------------------------------------------------------

  /** A game event's effect (utils/cthulhuquariumSfx.ts). */
  play(name: CthulhuquariumSfxName): void {
    const context = this.context
    if (!context || !this.sfxBus || context.state !== 'running') return
    const start = context.currentTime + 0.01
    for (const voice of CTHULHUQUARIUM_SFX[name] ?? []) {
      this.voice(voice, start + voice.at, this.sfxBus)
    }
  }

  private voice(
    voice: CthulhuquariumSfxVoice,
    at: number,
    bus: AudioNode,
  ): void {
    const context = this.context
    if (!context) return
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(voice.peak, at + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + voice.seconds)
    gain.connect(bus)
    if (voice.wave === 'noise') {
      const source = context.createBufferSource()
      source.buffer = this.noise()
      const band = context.createBiquadFilter()
      band.type = 'bandpass'
      band.Q.value = 1.4
      band.frequency.setValueAtTime(voice.from, at)
      band.frequency.exponentialRampToValueAtTime(voice.to, at + voice.seconds)
      source.connect(band).connect(gain)
      source.start(at)
      source.stop(at + voice.seconds + 0.05)
      return
    }
    const oscillator = context.createOscillator()
    oscillator.type = voice.wave
    oscillator.frequency.setValueAtTime(voice.from, at)
    if (voice.to !== voice.from) {
      oscillator.frequency.exponentialRampToValueAtTime(
        voice.to,
        at + voice.seconds,
      )
    }
    if (voice.wave === 'square' || voice.wave === 'sawtooth') {
      const soften = context.createBiquadFilter()
      soften.type = 'lowpass'
      soften.frequency.value = 2400
      oscillator.connect(soften).connect(gain)
    } else {
      oscillator.connect(gain)
    }
    oscillator.start(at)
    oscillator.stop(at + voice.seconds + 0.05)
  }

  private noise(): AudioBuffer {
    const context = this.context!
    if (this.noiseBuffer) return this.noiseBuffer
    const buffer = context.createBuffer(
      1,
      context.sampleRate,
      context.sampleRate,
    )
    const data = buffer.getChannelData(0)
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1
    }
    this.noiseBuffer = buffer
    return buffer
  }

  // --- music -----------------------------------------------------------------

  /**
   * Play (or keep playing) the theme of `floor`. A change of floor takes effect
   * at the next phrase, so the music never jumps mid-bar.
   */
  playMusic(floor: number): void {
    const context = this.context
    if (!context || !this.musicBus) return
    this.musicFloor = floor
    const theme = cthulhuquariumThemeFor(floor)
    if (this.echoFeedback) this.echoFeedback.gain.value = theme.echo
    if (this.musicTimer) return
    const now = context.currentTime
    this.musicBus.gain.cancelScheduledValues(now)
    this.musicBus.gain.linearRampToValueAtTime(MUSIC_LEVEL, now + 3)
    this.nextPhraseAt = now + 0.2
    this.scheduleMusic()
    this.musicTimer = setInterval(() => this.scheduleMusic(), 300)
  }

  stopMusic(): void {
    if (this.musicTimer) clearInterval(this.musicTimer)
    this.musicTimer = null
    if (!this.context || !this.musicBus) return
    const now = this.context.currentTime
    this.musicBus.gain.cancelScheduledValues(now)
    this.musicBus.gain.linearRampToValueAtTime(0, now + 1.2)
  }

  private scheduleMusic(): void {
    const context = this.context
    if (!context || !this.musicBus || context.state !== 'running') return
    // Phrases missed while the context was suspended (a background tab, the
    // first resume) are skipped, never played back all at once.
    if (this.nextPhraseAt < context.currentTime) {
      this.nextPhraseAt = context.currentTime + 0.1
    }
    while (this.nextPhraseAt < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
      const theme = cthulhuquariumThemeFor(this.musicFloor)
      const beat = 60 / theme.bpm
      for (const note of composeCthulhuquariumPhrase(
        this.musicFloor,
        this.phraseIndex,
      )) {
        this.musicNote(
          note,
          this.nextPhraseAt + note.beat * beat,
          beat,
          theme.padCutoff,
        )
      }
      this.nextPhraseAt += CTHULHUQUARIUM_PHRASE_BEATS * beat
      this.phraseIndex += 1
    }
  }

  private musicNote(
    note: CthulhuquariumMusicNote,
    at: number,
    beat: number,
    padCutoff: number,
  ): void {
    const context = this.context
    if (!context || !this.musicBus) return
    const hz = cthulhuquariumMidiToHz(note.midi)
    const length = note.beats * beat
    const gain = context.createGain()
    gain.connect(this.musicBus)
    if (note.voice === 'pad') {
      // Two slightly detuned triangles through a low-pass: a soft organ of glass.
      const filter = context.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = padCutoff
      filter.connect(gain)
      const peak = 0.05 * note.velocity
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.linearRampToValueAtTime(peak, at + Math.min(1.4, length * 0.4))
      gain.gain.setValueAtTime(peak, at + length * 0.75)
      gain.gain.linearRampToValueAtTime(0.0001, at + length + 1.2)
      for (const detune of [-6, 6]) {
        const oscillator = context.createOscillator()
        oscillator.type = 'triangle'
        oscillator.frequency.value = hz
        oscillator.detune.value = detune
        oscillator.connect(filter)
        oscillator.start(at)
        oscillator.stop(at + length + 1.3)
      }
      return
    }
    if (note.voice === 'bass') {
      const peak = 0.09 * note.velocity
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.linearRampToValueAtTime(peak, at + 0.6)
      gain.gain.setValueAtTime(peak, at + length * 0.8)
      gain.gain.linearRampToValueAtTime(0.0001, at + length + 0.8)
      const oscillator = context.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = hz
      oscillator.connect(gain)
      oscillator.start(at)
      oscillator.stop(at + length + 0.9)
      return
    }
    // Bell: a music-box tine, its slightly inharmonic overtone, and an echo.
    const peak = 0.07 * note.velocity
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.9)
    if (this.echoSend) gain.connect(this.echoSend)
    for (const [ratio, level] of [
      [1, 1],
      [2.76, 0.18],
    ] as const) {
      const partial = context.createGain()
      partial.gain.value = level
      partial.connect(gain)
      const oscillator = context.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = hz * ratio
      oscillator.connect(partial)
      oscillator.start(at)
      oscillator.stop(at + 2)
    }
  }

  private buildEcho(): void {
    const context = this.context
    if (!context || !this.musicBus) return
    this.echoSend = context.createGain()
    this.echoSend.gain.value = 0.35
    this.echoDelay = context.createDelay(2)
    this.echoDelay.delayTime.value = 0.42
    this.echoFeedback = context.createGain()
    this.echoFeedback.gain.value = 0.25
    const tone = context.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 2200
    this.echoSend.connect(this.echoDelay)
    this.echoDelay.connect(tone)
    tone.connect(this.echoFeedback).connect(this.echoDelay)
    tone.connect(this.musicBus)
  }

  // --- the room tone ------------------------------------------------------------

  private startHum(): void {
    const context = this.context
    if (!context || !this.master) return
    const seconds = 4
    const buffer = context.createBuffer(
      1,
      context.sampleRate * seconds,
      context.sampleRate,
    )
    const data = buffer.getChannelData(0)
    let brown = 0
    for (let index = 0; index < data.length; index += 1) {
      brown = (brown + 0.02 * (Math.random() * 2 - 1)) / 1.02
      data[index] = brown * 3.2
    }
    const source = context.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 420
    const gain = context.createGain()
    gain.gain.value = 0.55
    const wobble = context.createOscillator()
    wobble.frequency.value = 0.08
    const wobbleDepth = context.createGain()
    wobbleDepth.gain.value = 140
    wobble.connect(wobbleDepth).connect(filter.frequency)
    wobble.start()
    source.connect(filter).connect(gain).connect(this.master)
    source.start()
    this.hum = source
  }

  private blip(
    frequency: number,
    endFrequency: number,
    seconds: number,
    peak: number,
    type: OscillatorType = 'sine',
  ): void {
    const context = this.context
    if (!context || !this.sfxBus || context.state !== 'running') return
    this.voice(
      { at: 0, wave: type, from: frequency, to: endFrequency, seconds, peak },
      context.currentTime,
      this.sfxBus,
    )
  }

  /** A bubble reaching the surface. Rate-limited so a stream is a texture. */
  plink(): void {
    const now = performance.now()
    if (now - this.lastPlink < 180) return
    this.lastPlink = now
    const base = 900 + Math.random() * 1400
    this.blip(base, base * 1.9, 0.07, 0.05)
  }

  /** Knuckle on the glass. */
  knock(): void {
    this.blip(190, 80, 0.12, 0.35, 'triangle')
    setTimeout(() => this.blip(170, 75, 0.1, 0.2, 'triangle'), 90)
  }

  /** Food hits the water. */
  plop(): void {
    this.blip(520, 140, 0.18, 0.22)
  }

  /** A scale collected. */
  chime(): void {
    this.blip(1320, 1760, 0.18, 0.12)
    setTimeout(() => this.blip(1980, 2400, 0.22, 0.08), 70)
  }
}
