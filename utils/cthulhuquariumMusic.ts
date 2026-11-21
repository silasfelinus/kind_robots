// utils/cthulhuquariumMusic.ts
//
// Cthulhuquarium's theme (conductor cthulhuquarium/t-110), composed in code and
// played by TankSound with WebAudio -- Silas, 2026-11-21: "synthesized theme is
// fine". A slow music-box tune over a soft pad, one variation per floor of the
// building, each a little lower, slower, sparser and darker than the one above:
//
//   I    The Shop Floor        D dorian, warm and curious
//   II   Below Stairs          B minor, lower, the lamp swinging
//   III  The Flooded Wing      A phrygian, drips and long echoes
//   IV   The Conservatory      F# whole-tone, the glass ringing oddly
//   V    The Bottom of Things  C# drone, a few bells far apart
//
// Pure: composeCthulhuquariumPhrase is deterministic (seeded by floor and
// phrase), so a test can hear it without speakers. A phrase is four chords of
// four beats; the player schedules them back to back.

export type CthulhuquariumFloorNumber = 1 | 2 | 3 | 4 | 5

export interface CthulhuquariumFloorTheme {
  floor: CthulhuquariumFloorNumber
  name: string
  bpm: number
  /** MIDI note of the tonic. */
  rootMidi: number
  /** Scale intervals in semitones from the tonic, ascending within an octave. */
  scale: readonly number[]
  /** Chords as scale degrees (0-based); four per phrase. */
  progression: readonly number[]
  /** Chance a bell sounds on each half beat (0-1). */
  bellDensity: number
  /** Pad low-pass cutoff in Hz: darker further down. */
  padCutoff: number
  /** Echo feedback on the bells (0-1). */
  echo: number
  /** Hold the tonic under the whole phrase instead of following the chords. */
  drone: boolean
}

export const CTHULHUQUARIUM_FLOOR_THEMES: Readonly<
  Record<CthulhuquariumFloorNumber, CthulhuquariumFloorTheme>
> = {
  1: {
    floor: 1,
    name: 'The Shop Floor',
    bpm: 66,
    rootMidi: 62,
    scale: [0, 2, 3, 5, 7, 9, 10],
    progression: [0, 3, 0, 6],
    bellDensity: 0.42,
    padCutoff: 1900,
    echo: 0.25,
    drone: false,
  },
  2: {
    floor: 2,
    name: 'Below Stairs',
    bpm: 60,
    rootMidi: 59,
    scale: [0, 2, 3, 5, 7, 8, 10],
    progression: [0, 5, 3, 4],
    bellDensity: 0.36,
    padCutoff: 1500,
    echo: 0.3,
    drone: false,
  },
  3: {
    floor: 3,
    name: 'The Flooded Wing',
    bpm: 56,
    rootMidi: 57,
    scale: [0, 1, 3, 5, 7, 8, 10],
    progression: [0, 1, 0, 5],
    bellDensity: 0.3,
    padCutoff: 1150,
    echo: 0.45,
    drone: false,
  },
  4: {
    floor: 4,
    name: 'The Conservatory',
    bpm: 50,
    rootMidi: 54,
    scale: [0, 2, 4, 6, 8, 10],
    progression: [0, 2, 1, 3],
    bellDensity: 0.24,
    padCutoff: 900,
    echo: 0.5,
    drone: false,
  },
  5: {
    floor: 5,
    name: 'The Bottom of Things',
    bpm: 44,
    rootMidi: 49,
    scale: [0, 1, 4, 5, 7, 8, 10],
    progression: [0, 0, 1, 0],
    bellDensity: 0.14,
    padCutoff: 650,
    echo: 0.55,
    drone: true,
  },
}

export type CthulhuquariumMusicVoice = 'pad' | 'bell' | 'bass'

export interface CthulhuquariumMusicNote {
  /** Beat offset from the start of the phrase. */
  beat: number
  /** Length in beats. */
  beats: number
  midi: number
  voice: CthulhuquariumMusicVoice
  /** 0-1. */
  velocity: number
}

export const CTHULHUQUARIUM_PHRASE_BEATS = 16

/** A small seeded generator (mulberry32), so a phrase is the same every time. */
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The MIDI note of a scale degree (any integer, wrapping into octaves). */
export function cthulhuquariumScaleNote(
  theme: CthulhuquariumFloorTheme,
  degree: number,
): number {
  const size = theme.scale.length
  const octave = Math.floor(degree / size)
  const step = ((degree % size) + size) % size
  return theme.rootMidi + octave * 12 + theme.scale[step]!
}

export function cthulhuquariumMidiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

export function cthulhuquariumThemeFor(
  floor: number,
): CthulhuquariumFloorTheme {
  const clamped = Math.min(5, Math.max(1, Math.round(floor || 1)))
  return CTHULHUQUARIUM_FLOOR_THEMES[clamped as CthulhuquariumFloorNumber]
}

/**
 * One phrase of a floor's theme: four chords held by the pad, a bass note (or
 * the tonic droned under everything on the deepest floor), and a sparse bell
 * melody on the half beats, stepping mostly by scale steps around the chord.
 */
export function composeCthulhuquariumPhrase(
  floor: number,
  phraseIndex: number,
): CthulhuquariumMusicNote[] {
  const theme = cthulhuquariumThemeFor(floor)
  const random = seeded(theme.floor * 7919 + phraseIndex * 104729 + 17)
  const notes: CthulhuquariumMusicNote[] = []
  const size = theme.scale.length

  if (theme.drone) {
    notes.push({
      beat: 0,
      beats: CTHULHUQUARIUM_PHRASE_BEATS,
      midi: theme.rootMidi - 24,
      voice: 'bass',
      velocity: 0.7,
    })
  }

  // Melody wanders around the upper octave, one scale step at a time mostly.
  let melodyDegree = size + Math.floor(random() * 3)
  theme.progression.forEach((chordDegree, chordIndex) => {
    const start = chordIndex * 4
    for (const offset of [0, 2, 4]) {
      notes.push({
        beat: start,
        beats: 4,
        midi: cthulhuquariumScaleNote(theme, chordDegree + offset),
        voice: 'pad',
        velocity: 0.5,
      })
    }
    if (!theme.drone) {
      notes.push({
        beat: start,
        beats: 4,
        midi: cthulhuquariumScaleNote(theme, chordDegree) - 12,
        voice: 'bass',
        velocity: 0.6,
      })
    }
    let bells = 0
    for (let half = 0; half < 8; half += 1) {
      const lastChance = half === 7 && bells === 0
      if (!lastChance && random() >= theme.bellDensity) continue
      const step =
        random() < 0.7 ? (random() < 0.5 ? -1 : 1) : random() < 0.5 ? -2 : 2
      melodyDegree = Math.min(
        size * 2 + 2,
        Math.max(size - 2, melodyDegree + step),
      )
      // Land on a chord tone at the start of each chord.
      const degree =
        half === 0
          ? chordDegree + size + [0, 2, 4][Math.floor(random() * 3)]!
          : melodyDegree
      notes.push({
        beat: start + half / 2,
        beats: 1.5,
        midi: cthulhuquariumScaleNote(theme, degree),
        voice: 'bell',
        velocity: 0.45 + random() * 0.35,
      })
      bells += 1
    }
  })
  return notes.sort((a, b) => a.beat - b.beat)
}
