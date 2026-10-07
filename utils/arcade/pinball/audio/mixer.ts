// /utils/arcade/pinball/audio/mixer.ts
//
// The pinball audio boundary (conductor kind-pinball/t-004). Rules and the
// runtime speak in pinball sound names; this maps them to sound output. For
// now it routes to the arcade's chiptune kit so the cabinet's mute keeps
// working; t-008 replaces the inside with a WebAudio mixer (mechanical,
// ball, callout, music and ambience buses) without changing this surface.

import type { ArcadeSoundLike } from '../../types'

export type PinballSoundName =
  'flipper' | 'pop' | 'sling' | 'launch' | 'drain' | 'nudge'

const ARCADE_FALLBACK: Record<
  PinballSoundName,
  Parameters<ArcadeSoundLike['play']>[0]
> = {
  flipper: 'blip',
  pop: 'pop',
  sling: 'pop',
  launch: 'start',
  drain: 'die',
  nudge: 'blip',
}

export class PinballMixer {
  private sound: ArcadeSoundLike | null

  constructor(sound: ArcadeSoundLike) {
    this.sound = sound
  }

  play(name: string) {
    const mapped = ARCADE_FALLBACK[name as PinballSoundName]
    if (mapped) this.sound?.play(mapped)
  }

  dispose() {
    this.sound = null
  }
}
