export const ORIGINAL_SCORES = {
  sugar: {
    bpm: 126,
    melody: [72, 76, 79, 84, 79, 76, 74, 76, 72, 79, 81, 84, 79, 76, 74, 72],
    chords: [
      [60, 64, 67, 72],
      [65, 69, 72, 77],
      [57, 60, 64, 69],
      [67, 71, 74, 79],
    ],
    bass: [48, 53, 45, 43],
    seed: 73,
  },
  ashen: {
    bpm: 76,
    melody: [
      50,
      null,
      null,
      57,
      null,
      55,
      null,
      53,
      48,
      null,
      50,
      null,
      55,
      null,
      53,
      null,
    ],
    chords: [
      [38, 50, 53, 57],
      [41, 53, 57, 60],
      [36, 48, 53, 55],
      [38, 50, 53, 57],
    ],
    bass: [26, 29, 24, 26],
    seed: 101,
  },
  jackpot: {
    bpm: 134,
    melody: [
      64,
      null,
      67,
      70,
      74,
      null,
      70,
      67,
      64,
      67,
      71,
      null,
      76,
      71,
      67,
      null,
    ],
    chords: [
      [52, 55, 58, 62],
      [55, 58, 62, 67],
      [57, 60, 64, 69],
      [59, 62, 66, 71],
    ],
    bass: [40, 43, 45, 47],
    seed: 211,
  },
}
const RATE = 22050
const TAU = Math.PI * 2
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12)

export function renderChessweeperScore(world, variant = 'stage') {
  const score = ORIGINAL_SCORES[world]
  if (!score || !['stage', 'finale'].includes(variant)) {
    throw new Error('Unknown Chessweeper score')
  }
  const finale = variant === 'finale'
  const eighth = 30 / score.bpm
  const frames = Math.round(32 * eighth * RATE)
  const mix = new Float64Array(frames)
  let random = score.seed + (finale ? 1009 : 0)
  const noise = () => {
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0
    return random / 2147483648 - 1
  }
  function note(start, duration, midi, instrument, volume) {
    const first = Math.round(start * RATE)
    const count = Math.min(frames, Math.round(duration * RATE))
    const frequency = hz(midi)
    const attack = instrument === 'pad' ? 0.15 : 0.008
    const release = instrument === 'pad' ? 0.26 : 0.085
    for (let i = 0; i < count; i++) {
      const t = i / RATE
      const envelope =
        Math.min(1, t / attack) *
        Math.min(1, (duration - t) / release) *
        (instrument === 'bell' ? Math.exp(-t * 1.6) : 1)
      const phase = TAU * frequency * t
      let wave = Math.sin(phase)
      if (instrument === 'bell') {
        wave += 0.35 * Math.sin(phase * 2.01) + 0.17 * Math.sin(phase * 3.97)
      } else if (instrument === 'pluck') {
        wave += 0.28 * Math.sin(phase * 2) + 0.1 * Math.sin(phase * 3)
      } else if (instrument === 'pad') {
        wave += 0.12 * Math.sin(phase * 1.005) + 0.1 * Math.sin(phase * 2)
      } else if (instrument === 'bass') {
        wave += 0.22 * Math.sin(phase * 2)
      }
      mix[(first + i) % frames] += wave * envelope * volume
    }
  }
  function drum(start, kind, volume) {
    const duration = kind === 'kick' ? 0.25 : 0.11
    const first = Math.round(start * RATE)
    const count = Math.round(duration * RATE)
    let lastNoise = 0
    for (let i = 0; i < count; i++) {
      const t = i / RATE
      const n = noise()
      const white = n - lastNoise * 0.84
      lastNoise = n
      const envelope = Math.exp(-t * (kind === 'kick' ? 24 : 38))
      const pitch = 52 + 82 * Math.exp(-t * 28)
      const tone = Math.sin(TAU * pitch * t)
      const signal =
        kind === 'kick'
          ? tone * 0.82 + n * 0.06
          : kind === 'snare'
            ? white * 0.7 + tone * 0.14
            : white * 0.42
      mix[(first + i) % frames] += signal * envelope * volume
    }
  }
  for (let step = 0; step < 32; step++) {
    const position = step * eighth
    const melodic = score.melody[step % 16]
    if (melodic !== null) {
      const ornament = finale && step >= 16 && step % 8 === 7 ? 12 : 0
      note(
        position,
        eighth * (world === 'ashen' ? 1.7 : 0.9),
        melodic + ornament,
        world === 'ashen' ? 'bell' : 'pluck',
        world === 'ashen' ? 0.13 : 0.15,
      )
    }
    if (step % 8 === 0) {
      const chord = score.chords[Math.floor(step / 8)]
      for (const midi of chord) {
        note(
          position,
          eighth * 7.8,
          midi + (finale ? 12 : 0),
          'pad',
          world === 'ashen' ? 0.052 : 0.04,
        )
      }
    }
    if (step % 4 === 0) {
      note(
        position,
        eighth * 3.7,
        score.bass[Math.floor(step / 8)],
        'bass',
        0.2,
      )
    }
    if (world === 'sugar') {
      if (step % 4 === 0) drum(position, 'kick', 0.23)
      if (step % 8 === 4) drum(position, 'snare', 0.12)
      if (step % 2 === 0 || finale) drum(position, 'hat', 0.055)
    } else if (world === 'ashen') {
      if (step % 8 === 0 || (finale && step % 4 === 0)) {
        drum(position, 'kick', 0.3)
      }
      if (step % 8 === 6 && finale) drum(position, 'snare', 0.09)
    } else {
      if (step % 4 === 0) drum(position, 'kick', 0.28)
      if (step % 8 === 4) drum(position, 'snare', 0.22)
      if (step % 2 === 0 || finale) drum(position, 'hat', 0.1)
    }
    if (finale && step % 8 === 7) {
      note(position, eighth * 1.5, score.melody[0] + 12, 'bell', 0.105)
    }
  }
  let peak = 0
  for (const sample of mix) peak = Math.max(peak, Math.abs(sample))
  const gain = peak > 0 ? 0.79 / peak : 0
  const bytes = new Uint8Array(44 + frames * 2)
  const view = new DataView(bytes.buffer)
  const ascii = (offset, value) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i))
    }
  }
  ascii(0, 'RIFF')
  view.setUint32(4, bytes.length - 8, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, RATE, true)
  view.setUint32(28, RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  ascii(36, 'data')
  view.setUint32(40, frames * 2, true)
  const mastered = new Float64Array(frames)
  for (let i = 0; i < frames; i++) {
    mastered[i] = Math.tanh(mix[i] * gain * 1.35) * 0.92
  }
  const seam = (mastered[0] + mastered[frames - 1]) / 2
  const fadeFrames = Math.round(RATE * 0.012)
  for (let i = 0; i < fadeFrames; i++) {
    const blend = (fadeFrames - i) / fadeFrames
    mastered[i] = mastered[i] * (1 - blend) + seam * blend
    const tail = frames - i - 1
    mastered[tail] = mastered[tail] * (1 - blend) + seam * blend
  }
  for (let i = 0; i < frames; i++) {
    view.setInt16(44 + i * 2, Math.round(mastered[i] * 32767), true)
  }
  return bytes
}
