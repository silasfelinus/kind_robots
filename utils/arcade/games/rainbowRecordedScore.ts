// /utils/arcade/games/rainbowRecordedScore.ts
//
// Silas's second playtest (2026-10-19): "we REALLY need better music. think space opera, and more than a midi
// 8 note on repeat." The recorded score: one ACE-Step render per Act's flight, per boss, for the guardians,
// the ending and the failure, rendered as ArtJobs on our own box (utils/scripts/enqueueRainbowScore.ts) and
// published as looped files under /rainbow-princess-audio/. A cue plays its recording once its file is listed
// in RAINBOW_RECORDED_TRACKS and has loaded; until then (or if it fails) the layered oscillator score in
// rainbowScore.ts plays, so the game is never silent.

import type { RecordedLoop } from '../sound'

export type RainbowScoreCueId =
  | `act${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}-${'flight' | 'boss'}`
  | 'guardian'
  | 'ending'
  | 'failure'

export type RainbowScoreBrief = {
  id: RainbowScoreCueId
  /** Seconds to render (the loop is cut from this). */
  seconds: number
  bpm: number
  /** ACE-Step tags: instrumental, comma separated. */
  prompt: string
}

/** What every cue shares: a space-opera orchestra, no vocals. */
const SCORE =
  'instrumental, no vocals, epic space opera film score, cinematic orchestra, full string section, french horns, trumpets, trombones, timpani, synth pads, high fidelity, stereo, loopable'

const brief = (
  id: RainbowScoreCueId,
  seconds: number,
  bpm: number,
  tags: string,
): RainbowScoreBrief => ({
  id,
  seconds,
  bpm,
  prompt: `${SCORE}, ${tags}, ${bpm} bpm`,
})

export const RAINBOW_SCORE_BRIEFS: readonly RainbowScoreBrief[] = [
  brief(
    'act1-flight',
    120,
    132,
    'heroic main title theme, soaring horn melody, bright brass fanfare, driving string ostinato, sparkling harp and celesta arpeggios, rainbow shimmer synth, hopeful, adventurous, D major',
  ),
  brief(
    'act2-flight',
    120,
    112,
    'ethereal wonder, wordless choir aahs, celesta, harp glissandi, slow swelling strings, glassy bell synth, floating jellyfish nebula, mysterious and beautiful, E minor to G major',
  ),
  brief(
    'act3-flight',
    120,
    138,
    'tense deep trench, low brass stabs, pounding taiko and timpani, staccato cello ostinato, dark synth bass pulse, danger and pursuit, C minor',
  ),
  brief(
    'act4-flight',
    120,
    150,
    'high speed space train chase, galloping strings, brass hits on the offbeat, snare rolls, rushing synth arpeggio, exhilarating, A major',
  ),
  brief(
    'act5-flight',
    120,
    124,
    'melancholic heroism among starship wreckage, solo french horn lament over pulsing strings, metallic industrial percussion, rising to defiant brass, F minor',
  ),
  brief(
    'act6-flight',
    120,
    128,
    'majestic alien coral kingdom, regal brass chorale, pipe organ, choir, harp, grand and ominous, B flat major with dark turns',
  ),
  brief(
    'act7-flight',
    120,
    120,
    'crystalline glass current, shimmering glass harmonica and vibraphone, pulsing tremolo strings, airy synth choir, suspenseful mystery, F sharp minor',
  ),
  brief(
    'act8-flight',
    120,
    116,
    'dark imperial palace march, massive choir chant, low brass, war drums, relentless string ostinato, eclipse menace, original melody, D minor',
  ),
  brief(
    'act9-flight',
    120,
    136,
    'final ascent to the eclipse crown, full orchestra and choir, heroic main theme returns in brass, thundering timpani, climactic and triumphant, D major',
  ),
  brief(
    'act1-boss',
    90,
    148,
    'boss battle, aggressive brass and string runs, pounding timpani, rapid synth arpeggios, heroic counter melody, E minor',
  ),
  brief(
    'act2-boss',
    90,
    140,
    'boss battle against a giant jellyfish array, choir stabs, swirling strings, deep brass, pulsing synth, otherworldly menace, B minor',
  ),
  brief(
    'act3-boss',
    90,
    152,
    'boss battle with a giant crab machine, heavy taiko, distorted low brass, frantic strings, industrial synth, C minor',
  ),
  brief(
    'act4-boss',
    90,
    160,
    'boss battle on a speeding rail, twin dolphin duel, galloping brass, rapid string spiccato, snare and timpani, A minor',
  ),
  brief(
    'act5-boss',
    90,
    146,
    'boss battle with a sawtooth regent warship, grinding metal percussion, dark brass, desperate strings, F minor',
  ),
  brief(
    'act6-boss',
    90,
    140,
    'boss battle with a colossal lantern ray, organ and choir, sweeping brass, timpani, grand menace, G minor',
  ),
  brief(
    'act7-boss',
    90,
    150,
    'boss battle with a glass eel, shattering glass percussion, frantic tremolo strings, staccato brass, eerie synth, F sharp minor',
  ),
  brief(
    'act8-boss',
    90,
    144,
    'boss battle with a prism leviathan, enormous choir, low brass, war drums, dissonant strings resolving to heroism, D minor',
  ),
  brief(
    'act9-boss',
    90,
    150,
    'final boss battle against the eclipse crown, everything at once, full choir, brass fanfares, timpani rolls, desperate then triumphant, D minor to D major',
  ),
  brief(
    'guardian',
    75,
    144,
    'mid boss skirmish, urgent brass ostinato, snare and timpani, rising strings, heroic, G minor',
  ),
  brief(
    'ending',
    120,
    92,
    'end credits, triumphant and tender reprise of the heroic main theme, warm strings, horns, harp, choir, D major',
  ),
  brief(
    'failure',
    60,
    72,
    'mournful defeat, solo cello and soft strings, distant choir, quiet hope at the end, D minor',
  ),
]

/** A rendered, looped and published recording of a cue. */
export type RainbowRecordedTrack = {
  id: RainbowScoreCueId
  /** Site path of the published file. */
  path: string
  /** Who played it: our own offline orchestra (scripts/rainbow-score) or an ACE-Step ArtJob. */
  source: 'orchestra' | 'ace'
  /** The ArtJob that rendered an ACE-Step take. */
  artJob?: number
  /** The loop's length, and the seconds of the file it loops between. */
  seconds: number
  loopStart: number
  loopEnd: number
}

/** The orchestral renditions' loop lengths, from compose.py's output (a 0.5 s periodic pad either side). */
export const RAINBOW_ORCHESTRA_LOOPS: Record<
  RainbowScoreCueId,
  { seconds: number; loopStart: number; loopEnd: number }
> = {
  'act1-flight': { seconds: 61.818, loopStart: 0.5, loopEnd: 62.3182 },
  'act2-flight': { seconds: 75.556, loopStart: 0.5, loopEnd: 76.0556 },
  'act3-flight': { seconds: 59.13, loopStart: 0.5, loopEnd: 59.6304 },
  'act4-flight': { seconds: 53.684, loopStart: 0.5, loopEnd: 54.1842 },
  'act5-flight': { seconds: 68.0, loopStart: 0.5, loopEnd: 68.5 },
  'act6-flight': { seconds: 64.762, loopStart: 0.5, loopEnd: 65.2619 },
  'act7-flight': { seconds: 70.345, loopStart: 0.5, loopEnd: 70.8448 },
  'act8-flight': { seconds: 72.857, loopStart: 0.5, loopEnd: 73.3571 },
  'act9-flight': { seconds: 60.0, loopStart: 0.5, loopEnd: 60.5 },
  'act1-boss': { seconds: 42.162, loopStart: 0.5, loopEnd: 42.6622 },
  'act2-boss': { seconds: 50.323, loopStart: 0.5, loopEnd: 50.8226 },
  'act3-boss': { seconds: 40.519, loopStart: 0.5, loopEnd: 41.0195 },
  'act4-boss': { seconds: 37.143, loopStart: 0.5, loopEnd: 37.6429 },
  'act5-boss': { seconds: 45.882, loopStart: 0.5, loopEnd: 46.3824 },
  'act6-boss': { seconds: 43.944, loopStart: 0.5, loopEnd: 44.4437 },
  'act7-boss': { seconds: 47.273, loopStart: 0.5, loopEnd: 47.7727 },
  'act8-boss': { seconds: 48.75, loopStart: 0.5, loopEnd: 49.25 },
  'act9-boss': { seconds: 41.053, loopStart: 0.5, loopEnd: 41.5526 },
  guardian: { seconds: 43.333, loopStart: 0.5, loopEnd: 43.8333 },
  ending: { seconds: 49.091, loopStart: 0.5, loopEnd: 49.5909 },
  failure: { seconds: 27.429, loopStart: 0.5, loopEnd: 27.9286 },
}

/**
 * Published recordings; a cue missing here plays the oscillator score. Until the ACE-Step takes are rendered,
 * reviewed and ingested, every cue plays its orchestral rendition from scripts/rainbow-score/compose.py.
 */
export const RAINBOW_RECORDED_TRACKS: readonly RainbowRecordedTrack[] =
  RAINBOW_SCORE_BRIEFS.map(({ id }) => ({
    id,
    path: `/rainbow-princess-audio/${id}.mp3`,
    source: 'orchestra' as const,
    ...RAINBOW_ORCHESTRA_LOOPS[id],
  }))

export const rainbowScoreJobKey = (id: RainbowScoreCueId) =>
  `rainbow-score:v1:${id}`

/** The recording a cue plays, if it has one, as the sound engine's recorded loop. */
export function rainbowRecordedLoop(
  id: RainbowScoreCueId,
  tracks: readonly RainbowRecordedTrack[] = RAINBOW_RECORDED_TRACKS,
): RecordedLoop | undefined {
  const track = tracks.find((each) => each.id === id)
  return track
    ? { src: track.path, loopStart: track.loopStart, loopEnd: track.loopEnd }
    : undefined
}
