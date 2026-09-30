// /utils/cthulhuquariumSound.ts
//
// The tank's sound, synthesised with WebAudio so there are no audio files to
// render, ship or license: a low filtered hum of moving water, bubble plinks,
// a knock when the glass is tapped, a plop when food lands, and a small bright
// chime when a scale is collected. Quiet by design -- it is a room tone, not a
// soundtrack. Nothing plays until start() is called from a user gesture
// (browsers block audio otherwise), and stop() tears the graph down.

export class TankSound {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private hum: AudioBufferSourceNode | null = null
  private lastPlink = 0

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
      this.startHum()
    }
    void this.context.resume()
    const now = this.context.currentTime
    this.master?.gain.cancelScheduledValues(now)
    this.master?.gain.linearRampToValueAtTime(0.35 * volume, now + 1.5)
  }

  stop(): void {
    if (!this.context || !this.master) return
    const now = this.context.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.linearRampToValueAtTime(0, now + 0.4)
    const context = this.context
    setTimeout(() => void context.suspend(), 500)
  }

  dispose(): void {
    this.hum?.stop()
    void this.context?.close()
    this.context = null
    this.master = null
    this.hum = null
  }

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
    if (!context || !this.master || context.state !== 'running') return
    const now = context.currentTime
    const oscillator = context.createOscillator()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)
    oscillator.frequency.exponentialRampToValueAtTime(
      endFrequency,
      now + seconds,
    )
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds)
    oscillator.connect(gain).connect(this.master)
    oscillator.start(now)
    oscillator.stop(now + seconds + 0.02)
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
