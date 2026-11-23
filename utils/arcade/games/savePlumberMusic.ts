import type { MusicLoop, Note } from '../sound'

type WorldScore = {
  bpm: number
  melody: string
  bass: string
  harmony: string
  lead?: OscillatorType
}

/** Eight original motifs, in campaign order, scored for the shared WebAudio synth. */
const SCORES: WorldScore[] = [
  {
    bpm: 132,
    melody: 'E5 G5 A5 G5 E5 D5 C5 D5 G5 A5 C6 A5 G5 E5 D5 C5',
    bass: 'C3 G2 A2 F2',
    harmony: 'C4 E4 F4 G4',
  },
  {
    bpm: 118,
    melody: 'D5 F5 A5 G5 F5 D5 C5 D5 A5 C6 A5 G5 F5 E5 D5 C5',
    bass: 'D3 A2 C3 G2',
    harmony: 'D4 F4 G4 C4',
  },
  {
    bpm: 128,
    melody: 'B4 D5 G5 A5 B5 A5 G5 E5 D5 E5 G5 B5 A5 G5 E5 D5',
    bass: 'G2 D3 E3 C3',
    harmony: 'G3 B3 C4 A3',
  },
  {
    bpm: 148,
    melody: 'E5 G5 A5 B5 G5 F#5 E5 B4 G5 B5 D6 B5 A5 G5 F#5 E5',
    bass: 'E3 B2 C3 D3',
    harmony: 'E4 G4 D4 F#4',
    lead: 'square',
  },
  {
    bpm: 140,
    melody: 'A4 C#5 E5 F#5 E5 A5 G#5 E5 F#5 E5 C#5 B4 A4 C#5 E5 A4',
    bass: 'A2 E3 F#3 D3',
    harmony: 'A3 C#4 D4 E4',
  },
  {
    bpm: 124,
    melody: 'F#5 A5 C#6 B5 A5 G#5 F#5 E5 E5 F#5 A5 C#6 B5 G#5 F#5 E5',
    bass: 'F#2 C#3 D3 E3',
    harmony: 'F#3 A3 D4 E4',
    lead: 'sawtooth',
  },
  {
    bpm: 156,
    melody: 'G5 Bb5 C6 Bb5 G5 F5 Eb5 D5 C5 Eb5 G5 F5 Bb5 G5 Eb5 C5',
    bass: 'C3 G2 Ab2 Bb2',
    harmony: 'C4 Eb4 Ab3 F4',
    lead: 'square',
  },
  {
    bpm: 152,
    melody: 'D5 F5 A5 Bb5 A5 G5 F5 E5 D5 A5 C6 D6 C6 A5 F5 D5',
    bass: 'D3 A2 Bb2 C3',
    harmony: 'D4 F4 Bb3 G4',
    lead: 'sawtooth',
  },
]

const beat = 'x . . . x . x . x . . . x . x .'

function score(spec: WorldScore, boss = false): MusicLoop {
  const melody = spec.melody.split(' ')
  const bass = spec.bass.split(' ')
  const harmony = spec.harmony.split(' ')
  const tune = melody
    .flatMap((note, i) => [note, i % 8 === 7 ? '-' : '.'])
    .join(' ')
  const low = bass.flatMap((note) => [note, '-', '.', '.']).join(' ')
  const chime = harmony.flatMap((note) => [note, '.', '.', '.']).join(' ')
  const rhythm = boss ? 'x . x . x . x . x . x . x . x .' : beat
  return {
    bpm: spec.bpm,
    stepsPerBeat: 2,
    tracks: [
      { steps: tune, type: spec.lead ?? 'triangle', vol: 0.045 },
      { steps: `${low} ${low}`, type: 'sine', vol: 0.038 },
      { steps: `${chime} ${chime}`, type: 'triangle', vol: 0.018 },
      { steps: `${rhythm} ${rhythm}`, noise: true, vol: 0.014 },
    ],
  }
}

export const PLUMBER_WORLD_MUSIC: readonly MusicLoop[] = SCORES.map((each) =>
  score(each),
)

export const PLUMBER_BOSS_MUSIC: MusicLoop = score(
  {
    bpm: 164,
    melody: 'D5 D5 F5 E5 C5 D5 A4 D5 F5 A5 G5 E5 D5 C5 A4 D5',
    bass: 'D3 A2 F3 C3',
    harmony: 'D4 F4 C4 A3',
    lead: 'square',
  },
  true,
)

/** Original, restrained jump and landing gestures, not borrowed game audio. */
export const PLUMBER_JUMP_NOTES: Note[] = [
  { freq: 510, to: 920, dur: 0.11, type: 'sine', vol: 0.065 },
  { freq: 760, to: 1040, dur: 0.07, type: 'triangle', vol: 0.024, at: 0.035 },
]

export const PLUMBER_LAND_NOTES: Note[] = [
  { freq: 155, to: 83, dur: 0.09, type: 'triangle', vol: 0.07 },
  { freq: 240, dur: 0.045, noise: true, vol: 0.025 },
]
