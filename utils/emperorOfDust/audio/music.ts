// utils/emperorOfDust/audio/music.ts
//
// Emperor of Dust's score (conductor emperor-of-dust t-073), composed in code
// and played by EmperorSound (./player.ts) with WebAudio, after the house
// pattern in utils/cthulhuquariumMusic.ts. Stark and dry: a low drone, plucked
// FM strings, a breathy end-blown flute, a frame drum, and a bell at dawn --
// closer to a ronin crossing salt flats than to a court orchestra.
//
// Two layers make a theme:
//
//   the act's mood (the key, tempo and how dark it is), by game day
//     Act I    days  1-10   D dorian           first light on the dust
//     Act II   days 11-20   A aeolian          roads and rumours
//     Act III  days 21-30   E phrygian         the long dry
//     Act IV   days 31-40   C# phrygian dom.   knives in the court
//     Act V    days 41-50   B locrian          the hideout, after Komodo
//   and the room's style (which instruments, how busy), by where the player is:
//     title, briefing, throne, quests, barracks, market, map, dawn, ending.
//
// The title and the ending carry their own moods; the ending's depends on how
// the reign ended. Pure and deterministic (seeded by context, mood and phrase
// number), so a test can hear every theme without speakers. A phrase is four
// chords of four beats; the player schedules phrases back to back.

import type { EndingId } from '../fortress/endings'

export type EmperorMusicContext =
  | 'title'
  | 'briefing'
  | 'throne'
  | 'quests'
  | 'barracks'
  | 'market'
  | 'map'
  | 'dawn'
  | 'ending'

export const EMPEROR_MUSIC_CONTEXTS: readonly EmperorMusicContext[] = [
  'title',
  'briefing',
  'throne',
  'quests',
  'barracks',
  'market',
  'map',
  'dawn',
  'ending',
]

export type EmperorMoodId =
  | 'title'
  | 'act1'
  | 'act2'
  | 'act3'
  | 'act4'
  | 'act5'
  | 'hideout'
  | 'ending-hopeful'
  | 'ending-hard'
  | 'ending-grim'

export type EmperorEndingTone = 'hopeful' | 'hard' | 'grim'

/** What to play: a room style over a mood. */
export type EmperorMusicCue = {
  context: EmperorMusicContext
  mood: EmperorMoodId
}

export type EmperorMood = {
  id: EmperorMoodId
  name: string
  bpm: number
  /** MIDI note of the tonic in the low (drone/bass) register. */
  rootMidi: number
  /** Scale intervals in semitones from the tonic. */
  scale: readonly number[]
  /** Chords as scale degrees (0-based); four per phrase. */
  progression: readonly number[]
  /** Drone low-pass cutoff in Hz: darker as the reign wears on. */
  cutoff: number
  /** Multiplies every density: later acts leave more silence. */
  busy: number
  /** Echo feedback on plucks, flute and bells (0-1). */
  echo: number
}

export type EmperorRoomStyle = {
  context: EmperorMusicContext
  /** Tempo relative to the mood. */
  tempo: number
  /** Chance of a plucked note on each half beat. */
  pluck: number
  /** Plucks run a fixed figure on every half beat (the dispatch room). */
  ostinato: boolean
  /** Semitones the plucked line sits above its usual register. */
  lift: number
  drone: boolean
  bass: 'chord' | 'pedal' | 'none'
  /** Beats in each four-beat chord where the frame drum may fall. */
  drum: readonly number[]
  drumChance: number
  /** Chance per chord of a long flute note. */
  flute: number
  /** Bells: tolled at each chord, now and then, or never. */
  bell: 'toll' | 'sparse' | 'none'
  /** Chance of a dry hand-percussion tick on each half beat (the market). */
  tick: number
}

const DORIAN = [0, 2, 3, 5, 7, 9, 10] as const
const AEOLIAN = [0, 2, 3, 5, 7, 8, 10] as const
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10] as const
const PHRYGIAN_DOMINANT = [0, 1, 4, 5, 7, 8, 10] as const
const LOCRIAN = [0, 1, 3, 5, 6, 8, 10] as const
const MIXOLYDIAN = [0, 2, 4, 5, 7, 9, 10] as const

export const EMPEROR_MOODS: Readonly<Record<EmperorMoodId, EmperorMood>> = {
  title: {
    id: 'title',
    name: 'Emperor of Dust',
    bpm: 60,
    rootMidi: 50,
    scale: AEOLIAN,
    progression: [0, 5, 6, 0],
    cutoff: 1300,
    busy: 1,
    echo: 0.32,
  },
  act1: {
    id: 'act1',
    name: 'First Light on the Dust',
    bpm: 72,
    rootMidi: 50,
    scale: DORIAN,
    progression: [0, 3, 0, 6],
    cutoff: 1500,
    busy: 1,
    echo: 0.22,
  },
  act2: {
    id: 'act2',
    name: 'Roads and Rumours',
    bpm: 66,
    rootMidi: 45,
    scale: AEOLIAN,
    progression: [0, 5, 2, 6],
    cutoff: 1250,
    busy: 0.9,
    echo: 0.26,
  },
  act3: {
    id: 'act3',
    name: 'The Long Dry',
    bpm: 60,
    rootMidi: 52,
    scale: PHRYGIAN,
    progression: [0, 1, 0, 6],
    cutoff: 1050,
    busy: 0.8,
    echo: 0.3,
  },
  act4: {
    id: 'act4',
    name: 'Knives in the Court',
    bpm: 56,
    rootMidi: 49,
    scale: PHRYGIAN_DOMINANT,
    progression: [0, 1, 3, 0],
    cutoff: 900,
    busy: 0.72,
    echo: 0.34,
  },
  act5: {
    id: 'act5',
    name: 'After the Tower',
    bpm: 52,
    rootMidi: 47,
    scale: LOCRIAN,
    progression: [0, 0, 1, 4],
    cutoff: 700,
    busy: 0.62,
    echo: 0.4,
  },
  hideout: {
    id: 'hideout',
    name: 'The Hideout',
    bpm: 48,
    rootMidi: 47,
    scale: LOCRIAN,
    progression: [0, 1, 0, 4],
    cutoff: 560,
    busy: 0.55,
    echo: 0.46,
  },
  'ending-hopeful': {
    id: 'ending-hopeful',
    name: 'The Roads Open',
    bpm: 58,
    rootMidi: 50,
    scale: MIXOLYDIAN,
    progression: [0, 6, 3, 0],
    cutoff: 1500,
    busy: 0.8,
    echo: 0.36,
  },
  'ending-hard': {
    id: 'ending-hard',
    name: 'The Peace That Holds',
    bpm: 54,
    rootMidi: 45,
    scale: AEOLIAN,
    progression: [0, 5, 3, 4],
    cutoff: 1100,
    busy: 0.7,
    echo: 0.38,
  },
  'ending-grim': {
    id: 'ending-grim',
    name: 'Names in the Dust',
    bpm: 46,
    rootMidi: 49,
    scale: PHRYGIAN,
    progression: [0, 1, 0, 0],
    cutoff: 650,
    busy: 0.55,
    echo: 0.48,
  },
}

export const EMPEROR_ROOM_STYLES: Readonly<
  Record<EmperorMusicContext, EmperorRoomStyle>
> = {
  // The splash and the introduction: the flute over a drone, a few plucks.
  title: {
    context: 'title',
    tempo: 1,
    pluck: 0.26,
    ostinato: false,
    lift: 0,
    drone: true,
    bass: 'none',
    drum: [0],
    drumChance: 0.35,
    flute: 0.65,
    bell: 'none',
    tick: 0,
  },
  // The morning briefing: the act's own theme, plainly stated.
  briefing: {
    context: 'briefing',
    tempo: 1,
    pluck: 0.36,
    ostinato: false,
    lift: 0,
    drone: false,
    bass: 'chord',
    drum: [0],
    drumChance: 0.5,
    flute: 0.15,
    bell: 'none',
    tick: 0,
  },
  // The throne room by day: slow, upright, a drum on the strong beats.
  throne: {
    context: 'throne',
    tempo: 0.9,
    pluck: 0.24,
    ostinato: false,
    lift: 0,
    drone: true,
    bass: 'chord',
    drum: [0, 2],
    drumChance: 0.9,
    flute: 0.12,
    bell: 'none',
    tick: 0,
  },
  // The dispatch room: a driving figure of plucks and a walking drum.
  quests: {
    context: 'quests',
    tempo: 1.15,
    pluck: 1,
    ostinato: true,
    lift: 0,
    drone: false,
    bass: 'pedal',
    drum: [0, 1.5, 2, 3],
    drumChance: 0.8,
    flute: 0,
    bell: 'none',
    tick: 0,
  },
  // The barracks: close and quiet, the flute and gentle strings, no drum.
  barracks: {
    context: 'barracks',
    tempo: 0.85,
    pluck: 0.3,
    ostinato: false,
    lift: 0,
    drone: false,
    bass: 'chord',
    drum: [],
    drumChance: 0,
    flute: 0.5,
    bell: 'none',
    tick: 0,
  },
  // The market: busier strings set higher, dry hand percussion.
  market: {
    context: 'market',
    tempo: 1.1,
    pluck: 0.52,
    ostinato: false,
    lift: 12,
    drone: false,
    bass: 'chord',
    drum: [0],
    drumChance: 0.4,
    flute: 0,
    bell: 'none',
    tick: 0.55,
  },
  // The map room: a heavy drone, a bell far off now and then.
  map: {
    context: 'map',
    tempo: 0.8,
    pluck: 0.16,
    ostinato: false,
    lift: 0,
    drone: true,
    bass: 'none',
    drum: [0],
    drumChance: 0.3,
    flute: 0.1,
    bell: 'sparse',
    tick: 0,
  },
  // Night into dawn (the report of the night): the bell tolls over a drone.
  dawn: {
    context: 'dawn',
    tempo: 0.75,
    pluck: 0.12,
    ostinato: false,
    lift: 0,
    drone: true,
    bass: 'none',
    drum: [],
    drumChance: 0,
    flute: 0.4,
    bell: 'toll',
    tick: 0,
  },
  // The reign is over.
  ending: {
    context: 'ending',
    tempo: 0.8,
    pluck: 0.24,
    ostinato: false,
    lift: 0,
    drone: true,
    bass: 'chord',
    drum: [0],
    drumChance: 0.25,
    flute: 0.5,
    bell: 'sparse',
    tick: 0,
  },
}

const ENDING_TONES: Readonly<Record<EndingId, EmperorEndingTone>> = {
  'bell-restored': 'hopeful',
  'open-roads': 'hopeful',
  'tunnels-and-councils': 'hopeful',
  'iron-peace': 'hard',
  'crows-bargain': 'hard',
  'witchwater-throne': 'hard',
  'long-night': 'grim',
  'hundred-candles': 'grim',
}

export function emperorEndingTone(
  ending: EndingId | string | null | undefined,
): EmperorEndingTone {
  return ENDING_TONES[ending as EndingId] ?? 'hard'
}

/** The act (1-5) of a game day, as the engine counts them (ten days each). */
export function emperorActOfDay(day: number): 1 | 2 | 3 | 4 | 5 {
  const safe = Number.isFinite(day) ? day : 1
  return Math.min(5, Math.max(1, Math.ceil(safe / 10))) as 1 | 2 | 3 | 4 | 5
}

/** The mood of a day; Act V turns to the hideout once Komodo has the tower. */
export function emperorMoodOfDay(day: number, hideout = false): EmperorMoodId {
  const act = emperorActOfDay(day)
  if (act === 5 && hideout) return 'hideout'
  return `act${act}`
}

/** Where the player is, as the page knows it. */
export type EmperorMusicState = {
  /** The title splash or the introduction is showing. */
  title: boolean
  /** The current room (the page's RoomId; unknown rooms read as briefing). */
  room: string
  /** The dawn report is open. */
  dawn: boolean
  day: number
  /** Komodo has taken the tower and the crown is in hiding (run.hideout). */
  hideout: boolean
  /** The reign is over, and how it ended. */
  over: boolean
  ending?: EndingId | string | null
}

const ROOM_CONTEXTS: Readonly<Record<string, EmperorMusicContext>> = {
  briefing: 'briefing',
  throne: 'throne',
  quests: 'quests',
  barracks: 'barracks',
  market: 'market',
  map: 'map',
  chronicle: 'title',
}

/** The theme for where the player is. */
export function emperorMusicCueFor(state: EmperorMusicState): EmperorMusicCue {
  if (state.over)
    return {
      context: 'ending',
      mood: `ending-${emperorEndingTone(state.ending)}`,
    }
  if (state.title) return { context: 'title', mood: 'title' }
  const mood = emperorMoodOfDay(state.day, state.hideout)
  if (state.dawn) return { context: 'dawn', mood }
  const context = ROOM_CONTEXTS[state.room] ?? 'briefing'
  return { context, mood: context === 'title' ? 'title' : mood }
}

export function emperorCueKey(cue: EmperorMusicCue): string {
  return `${cue.context}/${cue.mood}`
}

export type EmperorMusicVoice =
  'drone' | 'pluck' | 'bass' | 'flute' | 'bell' | 'drum' | 'tick'

export interface EmperorMusicNote {
  /** Beat offset from the start of the phrase. */
  beat: number
  /** Length in beats. */
  beats: number
  midi: number
  voice: EmperorMusicVoice
  /** 0-1. */
  velocity: number
}

export const EMPEROR_PHRASE_BEATS = 16

/** The tempo a cue plays at. */
export function emperorCueBpm(cue: EmperorMusicCue): number {
  return EMPEROR_MOODS[cue.mood].bpm * EMPEROR_ROOM_STYLES[cue.context].tempo
}

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

function hash(text: string): number {
  let h = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    h ^= text.charCodeAt(index)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** The MIDI note of a scale degree (any integer, wrapping into octaves). */
export function emperorScaleNote(mood: EmperorMood, degree: number): number {
  const size = mood.scale.length
  const octave = Math.floor(degree / size)
  const step = ((degree % size) + size) % size
  return mood.rootMidi + octave * 12 + mood.scale[step]!
}

export function emperorMidiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

/** The ostinato's figure, as scale degrees above the chord root. */
const OSTINATO = [0, 4, 7, 4, 2, 4, 7, 4] as const

/**
 * One phrase of a cue: a drone or bass under four chords, a plucked line (a
 * wandering melody, or the dispatch room's ostinato), now and then a long
 * flute note, a frame drum on the room's beats, and bells at dawn.
 */
export function composeEmperorPhrase(
  cue: EmperorMusicCue,
  phraseIndex: number,
): EmperorMusicNote[] {
  const mood = EMPEROR_MOODS[cue.mood] ?? EMPEROR_MOODS.act1
  const style = EMPEROR_ROOM_STYLES[cue.context] ?? EMPEROR_ROOM_STYLES.briefing
  const random = seeded(
    hash(emperorCueKey(cue)) ^
      Math.imul((Math.max(0, Math.floor(phraseIndex)) + 1) >>> 0, 104729),
  )
  const notes: EmperorMusicNote[] = []
  const size = mood.scale.length
  const upper = (degree: number) =>
    emperorScaleNote(mood, degree) + 12 + style.lift

  if (style.drone) {
    notes.push({
      beat: 0,
      beats: EMPEROR_PHRASE_BEATS,
      midi: mood.rootMidi - 12,
      voice: 'drone',
      velocity: 0.7,
    })
    // An open fifth above, except in the moods built on a flattened fifth.
    if (!mood.scale.includes(6))
      notes.push({
        beat: 0,
        beats: EMPEROR_PHRASE_BEATS,
        midi: mood.rootMidi - 5,
        voice: 'drone',
        velocity: 0.45,
      })
  }

  let melody = size + Math.floor(random() * 3)
  mood.progression.forEach((chord, chordIndex) => {
    const start = chordIndex * 4
    const bassMidi = emperorScaleNote(mood, chord) - 12

    if (style.bass === 'chord')
      notes.push({
        beat: start,
        beats: 4,
        midi: bassMidi,
        voice: 'bass',
        velocity: 0.6,
      })
    else if (style.bass === 'pedal')
      for (let beat = 0; beat < 4; beat += 1)
        notes.push({
          beat: start + beat,
          beats: 0.9,
          midi: bassMidi,
          voice: 'bass',
          velocity: beat === 0 ? 0.65 : 0.45,
        })

    if (style.ostinato) {
      OSTINATO.forEach((offset, half) => {
        if (half > 0 && random() > style.pluck * Math.max(0.75, mood.busy))
          return
        notes.push({
          beat: start + half / 2,
          beats: 0.5,
          midi: upper(chord + offset - size),
          voice: 'pluck',
          velocity: half % 2 === 0 ? 0.6 : 0.4,
        })
      })
    } else {
      let plucks = 0
      for (let half = 0; half < 8; half += 1) {
        const lastChance = half === 7 && plucks === 0
        if (!lastChance && random() >= style.pluck * mood.busy) continue
        const step =
          random() < 0.7 ? (random() < 0.5 ? -1 : 1) : random() < 0.5 ? -2 : 2
        melody = Math.min(size * 2, Math.max(size - 2, melody + step))
        // Land on a chord tone at the start of each chord.
        const degree =
          half === 0
            ? chord + size + [0, 2, 4][Math.floor(random() * 3)]!
            : melody
        notes.push({
          beat: start + half / 2,
          beats: 1,
          midi: upper(degree - size),
          voice: 'pluck',
          velocity: 0.45 + random() * 0.35,
        })
        plucks += 1
      }
    }

    if (random() < style.flute * Math.max(0.6, mood.busy)) {
      const at = random() < 0.5 ? 1 : 2
      notes.push({
        beat: start + at,
        beats: 4 - at + 1.5,
        midi: upper(chord + [0, 2, 4][Math.floor(random() * 3)]!),
        voice: 'flute',
        velocity: 0.5 + random() * 0.3,
      })
    }

    if (style.bell === 'toll' || (style.bell === 'sparse' && random() < 0.3))
      notes.push({
        beat: start,
        beats: 4,
        midi: emperorScaleNote(mood, chordIndex % 2 ? 4 : 0) + 12,
        voice: 'bell',
        velocity: style.bell === 'toll' ? 0.7 : 0.45,
      })

    for (const beat of style.drum) {
      if (random() >= style.drumChance) continue
      notes.push({
        beat: start + beat,
        beats: 0.5,
        midi: Math.max(28, mood.rootMidi - 24),
        voice: 'drum',
        velocity: beat === 0 ? 0.75 : 0.5,
      })
    }

    for (let half = 0; half < 8; half += 1) {
      if (!style.tick || random() >= style.tick) continue
      notes.push({
        beat: start + half / 2,
        beats: 0.25,
        midi: half % 2 ? 91 : 86,
        voice: 'tick',
        velocity: half % 2 ? 0.35 : 0.55,
      })
    }
  })
  return notes.sort((a, b) => a.beat - b.beat)
}
