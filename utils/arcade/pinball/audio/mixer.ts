// /utils/arcade/pinball/audio/mixer.ts
//
// Pinball-specific WebAudio mixer. The context is created only after unlock(),
// which the runtime calls from a player gesture. Five buses sit under one
// master, and the arcade sound object's live mute state remains authoritative.

import type { ArcadeSoundLike } from '../../types'
import {
  MUSIC_BEDS,
  PINBALL_CUES,
  type PinballBus,
  type PinballMusicBed,
  type PinballSoundName,
  type SynthCue,
} from './catalog'

type AudioCtor = new () => AudioContext
type Position = { x: number; panRange?: number }

const BUS_GAIN: Record<PinballBus, number> = {
  mechanical: 0.75,
  ball: 0.62,
  callout: 0.58,
  music: 0.24,
  ambience: 0.16,
}

export class PinballMixer {
  private sound: ArcadeSoundLike | null
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private buses = new Map<PinballBus, GainNode>()
  private music: OscillatorNode[] = []
  private unlocked = false

  constructor(sound: ArcadeSoundLike) {
    this.sound = sound
  }

  get isUnlocked() {
    return this.unlocked
  }

  unlock() {
    if (this.unlocked || typeof window === 'undefined') return
    const audioWindow = window as typeof window & {
      webkitAudioContext?: AudioCtor
    }
    const Ctor = window.AudioContext ?? audioWindow.webkitAudioContext
    if (!Ctor) return
    const context = new Ctor()
    const master = context.createGain()
    master.gain.value = 0.72
    master.connect(context.destination)
    for (const name of Object.keys(BUS_GAIN) as PinballBus[]) {
      const node = context.createGain()
      node.gain.value = BUS_GAIN[name]
      node.connect(master)
      this.buses.set(name, node)
    }
    this.context = context
    this.master = master
    this.unlocked = true
    if (context.state === 'suspended') void context.resume()
  }

  play(name: string, position?: Position) {
    if (this.isMuted()) return
    const cue = PINBALL_CUES[name as PinballSoundName]
    if (!cue || !this.context || this.context.state !== 'running') return
    this.voice(cue, position)
  }

  setBusGain(bus: PinballBus, gain: number) {
    const node = this.buses.get(bus)
    if (node) node.gain.value = Math.max(0, Math.min(1, gain))
  }

  private isMuted() {
    const sound = this.sound as (ArcadeSoundLike & { muted?: boolean }) | null
    return sound?.muted === true
  }

  /** Start a music bed; false when audio is muted or not unlocked yet. */
  startMusic(bed: PinballMusicBed): boolean {
    this.stopMusic()
    if (this.isMuted()) return false
    if (!this.context || this.context.state !== 'running') return false
    const bus = this.buses.get('music')
    if (!bus) return false
    for (const frequency of MUSIC_BEDS[bed]) {
      const oscillator = this.context.createOscillator()
      const gain = this.context.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.value = frequency
      gain.gain.value = 0.035
      oscillator.connect(gain)
      gain.connect(bus)
      oscillator.start()
      this.music.push(oscillator)
    }
    return true
  }

  stopMusic() {
    for (const oscillator of this.music) {
      oscillator.stop()
      oscillator.disconnect()
    }
    this.music = []
  }

  private voice(cue: SynthCue, position?: Position) {
    const context = this.context
    const bus = this.buses.get(cue.bus)
    if (!context || !bus) return
    const start = context.currentTime
    const envelope = context.createGain()
    envelope.gain.setValueAtTime(Math.max(0.0001, cue.gain), start)
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + cue.duration)

    let destination: AudioNode = bus
    if (position && 'createStereoPanner' in context) {
      const panner = context.createStereoPanner()
      const range = Math.max(0.01, position.panRange ?? 0.3)
      panner.pan.value = Math.max(-1, Math.min(1, position.x / range))
      panner.connect(bus)
      destination = panner
    }
    envelope.connect(destination)

    if (cue.noise) {
      const frames = Math.max(1, Math.floor(context.sampleRate * cue.duration))
      const buffer = context.createBuffer(1, frames, context.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < frames; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
      }
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(envelope)
      source.start(start)
      return
    }

    const oscillator = context.createOscillator()
    oscillator.type = cue.wave ?? 'triangle'
    oscillator.frequency.setValueAtTime(cue.frequency, start)
    if (cue.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(
        cue.endFrequency,
        start + cue.duration,
      )
    }
    oscillator.connect(envelope)
    oscillator.start(start)
    oscillator.stop(start + cue.duration + 0.01)
  }

  dispose() {
    this.stopMusic()
    this.buses.clear()
    this.master?.disconnect()
    this.master = null
    void this.context?.close()
    this.context = null
    this.sound = null
    this.unlocked = false
  }
}
