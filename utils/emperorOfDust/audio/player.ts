// utils/emperorOfDust/audio/player.ts
//
// Emperor of Dust's sound (conductor emperor-of-dust t-073), synthesised with
// WebAudio so there are no audio files to render, ship or license -- after
// TankSound (utils/cthulhuquariumSound.ts). It plays the effects in ./sfx.ts,
// the score composed by ./music.ts, and a bed of wasteland wind. Nothing
// sounds until start() is called from a user gesture (browsers block audio
// otherwise), stop() fades it all out, dispose() tears it down. On the server,
// or in a browser without AudioContext, every method is a safe no-op.
//
// Mix: master -> music (a layer per theme, crossfaded) / effects / wind.

import { EMPEROR_SFX, type EmperorSfxName, type EmperorSfxVoice } from './sfx'
import {
  composeEmperorPhrase,
  emperorCueBpm,
  emperorCueKey,
  emperorMidiToHz,
  EMPEROR_MOODS,
  EMPEROR_PHRASE_BEATS,
  type EmperorMusicCue,
  type EmperorMusicNote,
} from './music'

export type EmperorSoundLevels = { master: number; music: number; sfx: number }

const MASTER_SCALE = 0.55
const MUSIC_LEVEL = 0.55
const WIND_LEVEL = 0.16
const WIND_NIGHT = 0.45
const SCHEDULE_AHEAD_SECONDS = 1.2
const CROSSFADE_SECONDS = 2.4

const unit = (value: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0

/** The browser's AudioContext constructor, or undefined (SSR, old browsers). */
function audioContextClass(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  )
}

export class EmperorSound {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private musicBus: GainNode | null = null
  private sfxBus: GainNode | null = null
  private windBus: GainNode | null = null
  private windFilter: BiquadFilterNode | null = null
  private wind: AudioBufferSourceNode | null = null
  private windLfos: OscillatorNode[] = []
  private echoSend: GainNode | null = null
  private echoFeedback: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private layer: GainNode | null = null
  private cue: EmperorMusicCue | null = null
  private musicTimer: ReturnType<typeof setInterval> | null = null
  private suspendTimer: ReturnType<typeof setTimeout> | null = null
  private nextPhraseAt = 0
  private phraseIndex = 0
  private levels: EmperorSoundLevels = { master: 0.7, music: 0.6, sfx: 0.8 }
  private night = false
  private hideout = false

  /** True where WebAudio exists at all. */
  static get available(): boolean {
    return !!audioContextClass()
  }

  get running(): boolean {
    return this.context?.state === 'running'
  }

  /** Starts (or resumes) the sound. Call from a user gesture. */
  start(levels: EmperorSoundLevels): boolean {
    this.levels = { ...levels }
    this.cancelSuspend()
    if (!this.context) {
      const Context = audioContextClass()
      if (!Context) return false
      try {
        this.context = new Context()
      } catch {
        return false
      }
      const context = this.context
      this.master = context.createGain()
      this.master.gain.value = 0
      this.master.connect(context.destination)
      this.musicBus = context.createGain()
      this.musicBus.connect(this.master)
      this.sfxBus = context.createGain()
      this.sfxBus.connect(this.master)
      this.windBus = context.createGain()
      this.windBus.gain.value = 0
      this.windBus.connect(this.master)
      this.buildEcho()
      this.startWind()
    }
    void this.context.resume()
    this.applyLevels(1.2)
    return true
  }

  /** The settings panel's volumes, applied live. */
  setLevels(levels: EmperorSoundLevels): void {
    this.levels = { ...levels }
    this.applyLevels(0.2)
  }

  /** Fades everything out and suspends the context (mute). */
  stop(): void {
    this.stopMusic()
    if (!this.context || !this.master) return
    const now = this.context.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(this.master.gain.value, now)
    this.master.gain.linearRampToValueAtTime(0, now + 0.4)
    const context = this.context
    this.cancelSuspend()
    this.suspendTimer = setTimeout(() => {
      this.suspendTimer = null
      if (this.context === context && context.state !== 'closed')
        void context.suspend()
    }, 500)
  }

  private cancelSuspend(): void {
    if (this.suspendTimer) clearTimeout(this.suspendTimer)
    this.suspendTimer = null
  }

  /** A hidden tab: suspend without forgetting where the music was. */
  pause(): void {
    if (this.context?.state === 'running') void this.context.suspend()
  }

  resume(): void {
    this.cancelSuspend()
    if (this.context?.state === 'suspended') void this.context.resume()
  }

  dispose(): void {
    this.cancelSuspend()
    if (this.musicTimer) clearInterval(this.musicTimer)
    this.musicTimer = null
    try {
      this.wind?.stop()
      for (const lfo of this.windLfos) lfo.stop()
    } catch {
      // already stopped
    }
    void this.context?.close().catch(() => undefined)
    this.context = null
    this.master = null
    this.musicBus = null
    this.sfxBus = null
    this.windBus = null
    this.windFilter = null
    this.wind = null
    this.windLfos = []
    this.layer = null
    this.cue = null
    this.echoSend = null
    this.echoFeedback = null
    this.noiseBuffer = null
  }

  private applyLevels(seconds: number): void {
    const context = this.context
    if (!context || !this.master || !this.musicBus || !this.sfxBus) return
    const now = context.currentTime
    const ramp = (param: AudioParam, value: number) => {
      param.cancelScheduledValues(now)
      param.setValueAtTime(param.value, now)
      param.linearRampToValueAtTime(value, now + seconds)
    }
    ramp(this.master.gain, MASTER_SCALE * unit(this.levels.master))
    ramp(this.musicBus.gain, MUSIC_LEVEL * unit(this.levels.music))
    ramp(this.sfxBus.gain, unit(this.levels.sfx))
    this.applyWind(seconds)
  }

  // --- effects ---------------------------------------------------------------

  /** A game event's effect (./sfx.ts), `delay` seconds from now. */
  play(name: EmperorSfxName, delay = 0): void {
    const context = this.context
    if (!context || !this.sfxBus || context.state !== 'running') return
    const start = context.currentTime + 0.01 + Math.max(0, delay)
    for (const voice of EMPEROR_SFX[name] ?? []) {
      this.voice(voice, start + voice.at, this.sfxBus)
    }
  }

  private voice(voice: EmperorSfxVoice, at: number, bus: AudioNode): void {
    const context = this.context
    if (!context) return
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(voice.peak, at + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + voice.seconds)
    gain.connect(bus)
    if (voice.wave === 'noise') {
      const source = context.createBufferSource()
      source.buffer = this.noise()
      const band = context.createBiquadFilter()
      band.type = 'bandpass'
      band.Q.value = voice.q ?? 1.4
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
    if (voice.to !== voice.from)
      oscillator.frequency.exponentialRampToValueAtTime(
        voice.to,
        at + voice.seconds,
      )
    if (voice.mod) this.fm(oscillator, voice.from, voice.mod, at, voice.seconds)
    if (voice.wave === 'square' || voice.wave === 'sawtooth') {
      const soften = context.createBiquadFilter()
      soften.type = 'lowpass'
      soften.frequency.value = 1800
      oscillator.connect(soften).connect(gain)
    } else {
      oscillator.connect(gain)
    }
    oscillator.start(at)
    oscillator.stop(at + voice.seconds + 0.05)
  }

  /** Frequency modulation whose depth dies away: the bite of a pluck. */
  private fm(
    carrier: OscillatorNode,
    hz: number,
    mod: { ratio: number; index: number },
    at: number,
    seconds: number,
  ): void {
    const context = this.context
    if (!context) return
    const modulator = context.createOscillator()
    modulator.frequency.value = hz * mod.ratio
    const depth = context.createGain()
    depth.gain.setValueAtTime(hz * mod.index, at)
    depth.gain.exponentialRampToValueAtTime(
      Math.max(0.01, hz * mod.index * 0.02),
      at + Math.min(seconds, 0.3),
    )
    modulator.connect(depth).connect(carrier.frequency)
    modulator.start(at)
    modulator.stop(at + seconds + 0.05)
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
   * Play (or keep playing) a theme. A new theme starts on a fresh layer that
   * fades in while the old one fades out, so a change of room is a crossfade.
   */
  playMusic(cue: EmperorMusicCue): void {
    const context = this.context
    if (!context || !this.musicBus) return
    const same = this.cue && emperorCueKey(this.cue) === emperorCueKey(cue)
    this.cue = cue
    if (this.echoFeedback)
      this.echoFeedback.gain.value = EMPEROR_MOODS[cue.mood].echo
    if (same && this.musicTimer && this.layer) return
    const now = context.currentTime
    const old = this.layer
    if (old) {
      old.gain.cancelScheduledValues(now)
      old.gain.setValueAtTime(old.gain.value, now)
      old.gain.linearRampToValueAtTime(0, now + CROSSFADE_SECONDS)
      setTimeout(
        () => old.disconnect(),
        (CROSSFADE_SECONDS + SCHEDULE_AHEAD_SECONDS + 1) * 1000,
      )
    }
    const layer = context.createGain()
    layer.gain.setValueAtTime(0, now)
    layer.gain.linearRampToValueAtTime(1, now + (old ? CROSSFADE_SECONDS : 3))
    layer.connect(this.musicBus)
    this.layer = layer
    this.phraseIndex = 0
    this.nextPhraseAt = now + 0.15
    this.scheduleMusic()
    if (!this.musicTimer)
      this.musicTimer = setInterval(() => this.scheduleMusic(), 300)
  }

  stopMusic(): void {
    if (this.musicTimer) clearInterval(this.musicTimer)
    this.musicTimer = null
    const context = this.context
    const layer = this.layer
    this.layer = null
    if (!context || !layer) return
    const now = context.currentTime
    layer.gain.cancelScheduledValues(now)
    layer.gain.setValueAtTime(layer.gain.value, now)
    layer.gain.linearRampToValueAtTime(0, now + 1.2)
    setTimeout(() => layer.disconnect(), 3000)
  }

  private scheduleMusic(): void {
    const context = this.context
    const cue = this.cue
    const layer = this.layer
    if (!context || !cue || !layer || context.state !== 'running') return
    // Phrases missed while the context was suspended (a background tab) are
    // skipped, never played back all at once.
    if (this.nextPhraseAt < context.currentTime)
      this.nextPhraseAt = context.currentTime + 0.1
    const beat = 60 / emperorCueBpm(cue)
    const cutoff = EMPEROR_MOODS[cue.mood].cutoff
    while (this.nextPhraseAt < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
      for (const note of composeEmperorPhrase(cue, this.phraseIndex))
        this.musicNote(
          note,
          this.nextPhraseAt + note.beat * beat,
          beat,
          cutoff,
          layer,
        )
      this.nextPhraseAt += EMPEROR_PHRASE_BEATS * beat
      this.phraseIndex += 1
    }
  }

  private musicNote(
    note: EmperorMusicNote,
    at: number,
    beat: number,
    cutoff: number,
    layer: GainNode,
  ): void {
    const context = this.context
    if (!context) return
    const hz = emperorMidiToHz(note.midi)
    const length = note.beats * beat
    const gain = context.createGain()
    gain.connect(layer)
    const osc = (type: OscillatorType, frequency: number, end: number) => {
      const oscillator = context.createOscillator()
      oscillator.type = type
      oscillator.frequency.value = frequency
      oscillator.start(at)
      oscillator.stop(end)
      return oscillator
    }

    switch (note.voice) {
      case 'drone': {
        // Two detuned saws through a dark low-pass, swelling in and out.
        const filter = context.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(cutoff * 0.6, at)
        filter.frequency.linearRampToValueAtTime(cutoff, at + length * 0.5)
        filter.frequency.linearRampToValueAtTime(cutoff * 0.6, at + length)
        filter.connect(gain)
        const peak = 0.04 * note.velocity
        gain.gain.setValueAtTime(0.0001, at)
        gain.gain.linearRampToValueAtTime(peak, at + Math.min(3, length * 0.3))
        gain.gain.setValueAtTime(peak, at + length * 0.8)
        gain.gain.linearRampToValueAtTime(0.0001, at + length + 2)
        for (const detune of [-7, 7]) {
          const saw = osc('sawtooth', hz, at + length + 2.1)
          saw.detune.value = detune
          saw.connect(filter)
        }
        break
      }
      case 'pluck': {
        // FM: a sine carrier bitten by a modulator at three times the pitch.
        const peak = 0.075 * note.velocity
        const ring = Math.min(1.8, length + 0.9)
        gain.gain.setValueAtTime(0.0001, at)
        gain.gain.exponentialRampToValueAtTime(peak, at + 0.004)
        gain.gain.exponentialRampToValueAtTime(0.0001, at + ring)
        const carrier = osc('sine', hz, at + ring + 0.05)
        this.fm(carrier, hz, { ratio: 3, index: 1.8 }, at, ring)
        carrier.connect(gain)
        if (this.echoSend) gain.connect(this.echoSend)
        break
      }
      case 'bass': {
        const filter = context.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 520
        filter.connect(gain)
        const peak = 0.085 * note.velocity
        gain.gain.setValueAtTime(0.0001, at)
        gain.gain.exponentialRampToValueAtTime(peak, at + 0.015)
        gain.gain.exponentialRampToValueAtTime(peak * 0.45, at + 0.4)
        gain.gain.setValueAtTime(peak * 0.45, at + length * 0.85)
        gain.gain.exponentialRampToValueAtTime(0.0001, at + length + 0.4)
        osc('triangle', hz, at + length + 0.5).connect(filter)
        break
      }
      case 'flute': {
        // An end-blown flute: a sine with a late vibrato and a breath of noise.
        const peak = 0.045 * note.velocity
        gain.gain.setValueAtTime(0.0001, at)
        gain.gain.linearRampToValueAtTime(peak, at + 0.28)
        gain.gain.setValueAtTime(peak, at + length * 0.7)
        gain.gain.linearRampToValueAtTime(0.0001, at + length + 0.6)
        const tone = osc('sine', hz, at + length + 0.7)
        const vibrato = osc('sine', 5.2, at + length + 0.7)
        const depth = context.createGain()
        depth.gain.setValueAtTime(0, at)
        depth.gain.linearRampToValueAtTime(hz * 0.006, at + 0.8)
        vibrato.connect(depth).connect(tone.frequency)
        tone.connect(gain)
        const breath = context.createBufferSource()
        breath.buffer = this.noise()
        breath.loop = true
        const band = context.createBiquadFilter()
        band.type = 'bandpass'
        band.frequency.value = Math.min(8000, hz * 2)
        band.Q.value = 6
        const air = context.createGain()
        air.gain.value = 0.35
        breath.connect(band).connect(air).connect(gain)
        breath.start(at)
        breath.stop(at + length + 0.7)
        if (this.echoSend) gain.connect(this.echoSend)
        break
      }
      case 'bell': {
        const peak = 0.05 * note.velocity
        gain.gain.setValueAtTime(0.0001, at)
        gain.gain.exponentialRampToValueAtTime(peak, at + 0.005)
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 3.4)
        for (const [ratio, level] of [
          [1, 1],
          [2, 0.5],
          [2.4, 0.3],
          [3, 0.18],
          [4.2, 0.1],
        ] as const) {
          const partial = context.createGain()
          partial.gain.value = level
          partial.connect(gain)
          osc('sine', hz * ratio, at + 3.5).connect(partial)
        }
        if (this.echoSend) gain.connect(this.echoSend)
        break
      }
      case 'drum': {
        // A frame drum: a falling thump with a little skin.
        const base = Math.max(52, hz * 1.6)
        const peak = 0.2 * note.velocity
        gain.gain.setValueAtTime(0.0001, at)
        gain.gain.exponentialRampToValueAtTime(peak, at + 0.005)
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.55)
        const thump = context.createOscillator()
        thump.type = 'sine'
        thump.frequency.setValueAtTime(base * 1.9, at)
        thump.frequency.exponentialRampToValueAtTime(base, at + 0.12)
        thump.connect(gain)
        thump.start(at)
        thump.stop(at + 0.6)
        const skin = context.createBufferSource()
        skin.buffer = this.noise()
        const low = context.createBiquadFilter()
        low.type = 'lowpass'
        low.frequency.value = 380
        const skinGain = context.createGain()
        skinGain.gain.value = 0.5
        skin.connect(low).connect(skinGain).connect(gain)
        skin.start(at)
        skin.stop(at + 0.1)
        break
      }
      case 'tick': {
        // Dry hand percussion: a knock of noise at the note's pitch.
        const peak = 0.05 * note.velocity
        gain.gain.setValueAtTime(0.0001, at)
        gain.gain.exponentialRampToValueAtTime(peak, at + 0.002)
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.06)
        const source = context.createBufferSource()
        source.buffer = this.noise()
        const band = context.createBiquadFilter()
        band.type = 'bandpass'
        band.frequency.value = hz
        band.Q.value = 5
        source.connect(band).connect(gain)
        source.start(at)
        source.stop(at + 0.08)
        break
      }
    }
  }

  private buildEcho(): void {
    const context = this.context
    if (!context || !this.musicBus) return
    this.echoSend = context.createGain()
    this.echoSend.gain.value = 0.3
    const delay = context.createDelay(2)
    delay.delayTime.value = 0.46
    this.echoFeedback = context.createGain()
    this.echoFeedback.gain.value = 0.25
    const tone = context.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 1900
    this.echoSend.connect(delay)
    delay.connect(tone)
    tone.connect(this.echoFeedback).connect(delay)
    tone.connect(this.musicBus)
  }

  // --- wind ------------------------------------------------------------------

  /** Day or night, out on the walls or down in the hideout. */
  setAmbience(options: { night: boolean; hideout: boolean }): void {
    this.night = options.night
    this.hideout = options.hideout
    this.applyWind(2.5)
  }

  private applyWind(seconds: number): void {
    const context = this.context
    if (!context || !this.windBus) return
    const now = context.currentTime
    const level =
      WIND_LEVEL *
      unit(this.levels.sfx) *
      (this.night ? WIND_NIGHT : 1) *
      (this.hideout ? 0.7 : 1)
    this.windBus.gain.cancelScheduledValues(now)
    this.windBus.gain.setValueAtTime(this.windBus.gain.value, now)
    this.windBus.gain.linearRampToValueAtTime(level, now + seconds)
    if (this.windFilter) {
      const centre = this.hideout ? 260 : this.night ? 380 : 520
      this.windFilter.frequency.cancelScheduledValues(now)
      this.windFilter.frequency.setValueAtTime(
        this.windFilter.frequency.value,
        now,
      )
      this.windFilter.frequency.linearRampToValueAtTime(centre, now + seconds)
    }
  }

  private startWind(): void {
    const context = this.context
    if (!context || !this.windBus) return
    // Six seconds of pinkish noise, looped, through a wandering band-pass,
    // with slow gusts riding on its level.
    const seconds = 6
    const buffer = context.createBuffer(
      1,
      context.sampleRate * seconds,
      context.sampleRate,
    )
    const data = buffer.getChannelData(0)
    let b0 = 0
    let b1 = 0
    let b2 = 0
    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1
      b0 = 0.99765 * b0 + white * 0.099046
      b1 = 0.963 * b1 + white * 0.2965164
      b2 = 0.57 * b2 + white * 1.0526913
      data[index] = (b0 + b1 + b2 + white * 0.1848) * 0.2
    }
    // Fade the loop's seam.
    const fade = Math.floor(context.sampleRate * 0.05)
    for (let index = 0; index < fade; index += 1) {
      const t = index / fade
      const end = data.length - 1 - index
      data[index] = data[index]! * t
      data[end] = data[end]! * t
    }
    const source = context.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const filter = context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 520
    filter.Q.value = 0.8
    const wander = context.createOscillator()
    wander.frequency.value = 0.045
    const wanderDepth = context.createGain()
    wanderDepth.gain.value = 220
    wander.connect(wanderDepth).connect(filter.frequency)
    const gust = context.createGain()
    gust.gain.value = 0.7
    const gustLfo = context.createOscillator()
    gustLfo.frequency.value = 0.11
    const gustDepth = context.createGain()
    gustDepth.gain.value = 0.3
    gustLfo.connect(gustDepth).connect(gust.gain)
    source.connect(filter).connect(gust).connect(this.windBus)
    source.start()
    wander.start()
    gustLfo.start()
    this.wind = source
    this.windFilter = filter
    this.windLfos = [wander, gustLfo]
  }
}
