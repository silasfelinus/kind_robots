// /utils/arcade/sound.ts
//
// Chiptune bleeps from WebAudio oscillators: no audio files to download. The
// AudioContext is only created after the first user gesture (browsers refuse
// to start one earlier), and the mute choice persists per browser.

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

type Note = {
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

const MUTE_KEY = 'kr-arcade-muted'

export type ArcadeSound = {
  play: (name: ArcadeSoundName) => void
  unlock: () => void
  readonly muted: boolean
  setMuted: (muted: boolean) => void
  dispose: () => void
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function createArcadeSound(): ArcadeSound {
  let ctx: AudioContext | null = null
  let muted = typeof window === 'undefined' ? true : readMuted()

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

  const voice = (audio: AudioContext, note: Note) => {
    const start = audio.currentTime + (note.at ?? 0)
    const gain = audio.createGain()
    const vol = note.vol ?? 0.08
    gain.gain.setValueAtTime(vol, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur)
    gain.connect(audio.destination)
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

  return {
    play(name) {
      if (muted || !ctx || ctx.state !== 'running') return
      for (const note of PRESETS[name]) voice(ctx, note)
    },
    unlock,
    get muted() {
      return muted
    },
    setMuted(next) {
      muted = next
      try {
        localStorage.setItem(MUTE_KEY, next ? '1' : '0')
      } catch {
        // Private mode: the choice just won't persist.
      }
    },
    dispose() {
      void ctx?.close()
      ctx = null
    },
  }
}
