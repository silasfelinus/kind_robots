// /utils/musicVideoSpecs.ts
//
// Prepared music-video specs (music-video/t-033). Silas, 2026-10-06: "you should
// be able to create the entire setup for our prompts, desired hero shots,
// lyrics, pitch, etc from api for both new projects." Each spec is a complete
// MusicVideoDoc (pitch, settings, lyrics, scenes on the beat grid with prompts,
// hero shots with animation prompts) that POST /api/music-video/import turns
// into a video in one call. Pure and DB-free: the server resolves the comic
// series slug and checks the keyframe ArtImages.
//
// Scene prompts follow the scene-prompt rules (no negations, no jargon such as
// "silhouette", no words that summon lettering), because the server refuses a
// still that breaks them; verifyMusicVideoSpecs.test.ts runs those checks.

import type {
  MusicVideoScene,
  MusicVideoSection,
  MusicVideoSettings,
} from '@/utils/musicVideoDoc'

export type MusicVideoSpecScene = {
  /** Length in beats; scenes run back to back from 0:00. The last runs to the end. */
  beats: number
  prompt: string
  /** Lyric lines this scene carries, as "sectionId:lineIdx". */
  lyrics?: string[]
  /** Marks a hero shot: the scene is animated with this prompt. */
  motionPrompt?: string
  kenBurns?: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right'
  /** A vetted keyframe to use instead of a fresh still. */
  artImageId?: number
  transition?: 'cut' | 'crossfade'
}

export type MusicVideoSpec = {
  key: string
  title: string
  /** What the spec makes, for the picker. */
  summary: string
  /** A Comic Studio series to render in, looked up by slug on import. */
  comicSeriesSlug?: string
  pitch: string
  settings: Omit<MusicVideoSettings, 'comicSeriesId'>
  sections: MusicVideoSection[]
  scenes: MusicVideoSpecScene[]
}

/** The doc a spec describes, minus the comic series id the server resolves. */
export function specToDoc(spec: MusicVideoSpec): {
  pitch: string
  settings: MusicVideoSpec['settings']
  lyrics: { sections: MusicVideoSection[] }
  timeline: {
    beatGrid: { bpm: number; offsetSec: number; beatsPerBar: number }
    markers: []
  }
  scenes: MusicVideoScene[]
} {
  const bpm = spec.settings.bpm ?? 120
  const beat = 60 / bpm
  const end = spec.settings.durationSec
  let at = 0
  const scenes = spec.scenes.map((row, index): MusicVideoScene => {
    const last = index === spec.scenes.length - 1
    const startSec = round3(at)
    const endSec = last ? end : round3(Math.min(at + row.beats * beat, end))
    at += row.beats * beat
    const hero = Boolean(row.motionPrompt)
    const scene: MusicVideoScene = {
      id: `s${String(index + 1).padStart(2, '0')}`,
      startSec,
      endSec,
      lyricRefs: (row.lyrics ?? []).map((ref) => {
        const [sectionId = '', lineIdx = '0'] = ref.split(':')
        return { sectionId, lineIdx: Number(lineIdx) }
      }),
      prompt: row.prompt,
      promptSource: 'user',
      image: row.artImageId
        ? { source: 'gallery', artImageId: row.artImageId }
        : { source: 'generated' },
      motion: hero
        ? { kind: 'clip' }
        : { kind: 'kenburns', preset: row.kenBurns ?? 'zoom-in' },
      transition: row.transition ?? 'cut',
      transitionSec: row.transition === 'crossfade' ? 0.5 : 0,
    }
    if (row.motionPrompt) scene.motionPrompt = row.motionPrompt
    return scene
  })
  return {
    pitch: spec.pitch,
    settings: spec.settings,
    lyrics: { sections: spec.sections },
    timeline: {
      beatGrid: { bpm, offsetSec: 0, beatsPerBar: 4 },
      markers: [],
    },
    scenes,
  }
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

function section(
  id: string,
  kind: MusicVideoSection['kind'],
  lines: string[],
): MusicVideoSection {
  return { id, kind, lines, locked: true }
}

/*
 * A. The Kind Robots theme song (t-015): an original homage to 80s
 * Saturday-morning action cartoons, starring a recurring crew so the stills
 * stay consistent. 140 BPM, 75 s = 175 beats; scene changes on bar lines.
 */
const BOLT =
  'Bolt, a small round orange robot with one big glowing blue lens eye and a wrench for a left hand'
const SPROCKET =
  'Sprocket, a lanky teal robot with springy legs and a radio antenna'
const DOTTIE =
  'Dottie, a hovering pink drone robot with a heart-shaped speaker grille'
const JUNK =
  'Junk, a giant friendly mech built from scrap metal, old car doors and a bathtub'

const kindRobotsTheme: MusicVideoSpec = {
  key: 'kind-robots-theme',
  title: 'Kind Robots: Theme Song',
  summary:
    '75 s duet, 140 BPM, 20 scenes on the bar grid, 5 hero shots, Krea 2.',
  pitch:
    'The opening theme for the Kind Robots cartoon: a crew of small, friendly, mismatched robots who build things, fix things and help people, racing across a neon city at night. Rooftop chases, a workshop full of sparks, a junkyard team-up, a skateboarding robot, a giant friendly mech assembled from scraps, and a final heroic group pose under a rainbow-lit sky. Kindness is the superpower. The chorus is a shouted gang-vocal hook about being kind robots.',
  settings: {
    durationSec: 75,
    aspect: '16:9',
    bpm: 140,
    vocal: 'duet',
    genre:
      '80s Saturday-morning cartoon theme, synth rock, gated drums, shouted gang-vocal chorus',
    mood: 'heroic, goofy, high-energy',
    heroShots: 5,
    styleBible:
      '80s Saturday-morning action cartoon, thick black ink outlines, flat cel colour with hard two-tone shadows, saturated neon pink, teal and orange against deep night blue, painted cel backgrounds of a rain-slick neon city, speed lines, low heroic camera angles, dramatic rim light, small friendly robots with clear readable shapes',
    bannedTerms: [
      'teenage mutant',
      'ninja turtle',
      'ninja turtles',
      'tmnt',
      'turtle',
      'turtles',
      'shredder',
      'splinter',
      'michelangelo',
      'donatello',
      'raphael',
      'leonardo',
      'krang',
      'foot clan',
      'cowabunga',
      "april o'neil",
    ],
  },
  sections: [
    section('intro', 'intro', ['Kind Robots, power up!']),
    section('v1', 'verse', [
      'Neon on the rooftops and the rain coming down',
      'Little tin heroes rolling into town',
      'Bolts in their pockets and a spark in their eyes',
      'Lighting up the city when the sirens cry',
    ]),
    section('c1', 'chorus', [
      'Kind Robots! (Kind Robots!)',
      'Built from scraps and built for good',
      'Kind Robots! (Kind Robots!)',
      'Helping out the neighborhood',
    ]),
    section('v2', 'verse', [
      'Sparks in the workshop, wheels on the street',
      'Skateboard flipping on every beat',
      'Junkyard giant made of borrowed parts',
      'Biggest thing about him is his heart',
    ]),
    section('c2', 'chorus', [
      'Kind Robots! (Kind Robots!)',
      'Built from scraps and built for good',
      'Kind Robots! (Kind Robots!)',
      'Helping out the neighborhood',
    ]),
    section('outro', 'outro', ['Kindness is the superpower!', 'Kind Robots!']),
  ],
  scenes: [
    {
      beats: 8,
      prompt:
        'A rain-slick neon city skyline at night, water towers and glowing windows, a big full moon behind the rooftops',
      kenBurns: 'pan-right',
    },
    {
      beats: 8,
      prompt: `A garage door bursting open in a burst of orange light, ${BOLT} striking a heroic pose in the doorway`,
      lyrics: ['intro:0'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt:
        'Neon rooftops in heavy rain, puddles reflecting pink and teal signs, steam rising from vents',
      lyrics: ['v1:0'],
      kenBurns: 'pan-left',
    },
    {
      beats: 8,
      prompt: `${BOLT}, ${SPROCKET} and ${DOTTIE} rolling down a wet neon street side by side`,
      lyrics: ['v1:1'],
      kenBurns: 'pan-right',
    },
    {
      beats: 8,
      prompt: `Close-up of ${BOLT}, his blue lens eye glowing, sparks dancing off his wrench hand`,
      lyrics: ['v1:2'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${DOTTIE} flying above a flashing ambulance at a busy crossroads, beaming a bright rainbow light down on the street`,
      lyrics: ['v1:3'],
      kenBurns: 'zoom-out',
    },
    {
      beats: 8,
      prompt: `${SPROCKET} leaping between two neon rooftops against the moon, arms spread wide, speed lines behind him`,
      lyrics: ['c1:0'],
      motionPrompt:
        'The robot springs off the rooftop and sails across the gap as the camera tracks sideways with him.',
    },
    {
      beats: 8,
      prompt: `${BOLT} bolting a dented street lamp back together while the lamp flickers on`,
      lyrics: ['c1:1'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${BOLT}, ${SPROCKET} and ${DOTTIE} cheering together on a rooftop, fists raised, neon signs glowing behind them`,
      lyrics: ['c1:2'],
      kenBurns: 'zoom-out',
    },
    {
      beats: 8,
      prompt: `${DOTTIE} carrying a lost kitten home to a smiling old robot neighbor on a cozy brick stoop`,
      lyrics: ['c1:3'],
      kenBurns: 'pan-left',
    },
    {
      beats: 8,
      prompt: `${BOLT} welding at a cluttered robot workshop bench, a fountain of orange sparks lighting up shelves of gears and spare parts`,
      lyrics: ['v2:0'],
      motionPrompt:
        'Sparks spray from the welding torch while the camera pushes in slowly on the workbench.',
    },
    {
      beats: 8,
      prompt: `${SPROCKET} riding a glowing skateboard mid-air over a ramp in a neon alley, board flipping under his feet`,
      lyrics: ['v2:1'],
      motionPrompt:
        'The robot kicks the skateboard into a spinning flip and lands it as the camera follows the jump.',
    },
    {
      beats: 8,
      prompt: `${JUNK} rising to his full height in a junkyard at dusk, the small robots cheering at his feet, scrap metal clanking into place`,
      lyrics: ['v2:2'],
      motionPrompt:
        'Scrap pieces fly up and lock into place as the giant mech stands up and the camera tilts up with him.',
    },
    {
      beats: 8,
      prompt: `${JUNK} gently holding ${BOLT} in his huge open palm, a warm glowing heart-shaped lamp shining in his chest`,
      lyrics: ['v2:3'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${SPROCKET} and ${DOTTIE} racing across a neon bridge at night, rain streaking past them`,
      lyrics: ['c2:0'],
      kenBurns: 'pan-right',
    },
    {
      beats: 8,
      prompt: `${BOLT} and ${JUNK} lifting a fallen tree off a little delivery robot's cart in a rainy street`,
      lyrics: ['c2:1'],
      kenBurns: 'zoom-out',
    },
    {
      beats: 8,
      prompt: `The whole crew, ${BOLT}, ${SPROCKET}, ${DOTTIE} and ${JUNK}, sliding down a fire escape in a line, laughing`,
      lyrics: ['c2:2'],
      kenBurns: 'pan-left',
    },
    {
      beats: 8,
      prompt:
        'A neighborhood street at night full of small happy robots waving from windows and stoops, warm lights in every window',
      lyrics: ['c2:3'],
      kenBurns: 'zoom-out',
    },
    {
      beats: 16,
      prompt: `${DOTTIE} painting a rainbow across the night sky with her light beam, the city glowing below`,
      lyrics: ['outro:0'],
      kenBurns: 'pan-right',
    },
    {
      beats: 15,
      prompt: `${BOLT}, ${SPROCKET}, ${DOTTIE} and ${JUNK} in a heroic group pose on the highest rooftop under a rainbow-lit sky, low camera angle`,
      lyrics: ['outro:1'],
      motionPrompt:
        'The camera rises slowly up to the crew as their eyes light up and the rainbow brightens behind them.',
    },
  ],
}

/*
 * B. Zuzu: Koala Assassin intro (t-029), from conductor
 * projects/music-video/docs/zuzu-intro.md. 100 BPM, 55 s = 91.7 beats; the
 * brief's 13 beats with the road shot split in two (one keyframe per
 * sibling). The brief asked for an instrumental; Silas, 2026-10-06: "I did
 * expect you to write lyrics, match to images", so it is a sung ballad with
 * one lyric line per scene from the second shot on. Stills render in the series' house lane (Arthemy, tag-style).
 * The style bible is the brief's, reworded to drop the negations ("no
 * dialogue, no narration") the prompt rules refuse; its meaning is unchanged.
 */
const ZUZU =
  'anthro koala ronin, short and stocky, barrel-chested, serious expression, rust-brown poncho with orange zigzag trim, conical straw kasa hat shading the eyes, dark tunic, orange sash, dark brown cloth trousers, katana sheathed diagonally across the back, hilt over the right shoulder'

const zuzuIntro: MusicVideoSpec = {
  key: 'zuzu-intro',
  title: 'Zuzu: Koala Assassin — Intro',
  summary:
    '55 s low-voiced western ballad, 100 BPM, 14 scenes with their lyric lines, 7 vetted keyframes, 5 hero clips, Arthemy lane.',
  comicSeriesSlug: 'zuzu-koala-assassin',
  pitch:
    'A 55-second title-sequence for Zuzu: Koala Assassin, a mature weird-western about a koala ronin crossing a dying wasteland with two starving fennec-fox orphans. A samurai in a western: dust, a poncho, a wide kasa shading the eyes, a katana across the back. The intro makes a promise of mood, not plot: lone figure, long road, a world that has been beaten down, a hard stillness, then the title. A low, gravelly male voice sings it like a dusty western ballad, sparse over shakuhachi and taiko, ending on the name.',
  settings: {
    durationSec: 55,
    aspect: '16:9',
    bpm: 100,
    vocal: 'male',
    genre:
      'samurai western ballad, low gravelly baritone, shakuhachi, twangy baritone guitar, deep taiko',
    mood: 'slow, ominous, dusty, building tension, one hard final hit',
    heroShots: 5,
    // The checkpoint when the comic series does not exist yet (proof of
    // concept); once it does, the series' house lane wins.
    imageLaneKey: 'il-arthemy',
    styleBible:
      'mature graphic-novel weird western, dark gritty desaturated palette, dust brown and rust, hard sidelight, long shadows, pale smoky sky, orange accents, painted western comic linework, low camera angles, wide landscapes with a small lone figure, every character an animal',
    bannedTerms: [
      'human',
      'humans',
      'humanity',
      'mankind',
      'people',
      'pharmacy',
      'great wall',
      'skyscraper',
      'highway',
      'billboard',
      'road sign',
      'english lettering',
    ],
  },
  sections: [
    section('intro', 'intro', ['Ho... ha... ho...']),
    section('v1', 'verse', [
      'Dust on the ridge where the dry wind blows',
      'Straw hat low and the long road goes',
      'Two small shadows trailing behind',
      "Two hungry hearts that he won't leave behind",
    ]),
    section('c1', 'chorus', [
      "One eye watching from the water's edge",
      'Iron on his hip and a broken pledge',
      'Something hungry sleeping down below',
      'The sand gives way and the teeth all show',
    ]),
    section('b1', 'bridge', [
      'Zuzu... Zuzu...',
      'Hand on the hilt and the world holds still',
    ]),
    section('o1', 'outro', ['One flash of steel', 'Koala assassin']),
  ],
  scenes: [
    {
      beats: 8,
      prompt:
        'wind-blown desert dunes at dawn, empty wasteland, drifting dust, pale smoky sky',
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      lyrics: ['intro:0'],
      prompt: `${ZUZU}, close-up on the hat brim, eyes in shadow`,
      artImageId: 241913,
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      lyrics: ['v1:0'],
      prompt: `wide shot, tiny ${ZUZU} walking along a desert ridge, long road, vast wasteland`,
      artImageId: 241899,
      kenBurns: 'pan-right',
    },
    {
      beats: 8,
      lyrics: ['v1:1'],
      prompt:
        'close-up of worn boots and a rust-brown poncho hem with orange zigzag trim stepping through dust',
      kenBurns: 'pan-left',
    },
    {
      beats: 4,
      lyrics: ['v1:2'],
      prompt:
        'gaunt fennec fox girl in a long torn pale dress walking away down a dusty road, distant, turned away',
      artImageId: 241879,
      kenBurns: 'pan-right',
    },
    {
      beats: 4,
      lyrics: ['v1:3'],
      prompt:
        'tiny fennec fox toddler in a checked tunic trailing behind on a dusty road, distant, turned away',
      artImageId: 241883,
      kenBurns: 'pan-right',
    },
    {
      beats: 8,
      lyrics: ['c1:0'],
      prompt:
        'one-eyed coyote at a muddy waterhole at dusk, eyepatch over the right eye, thin and sickly, one eye glinting in the dark',
      artImageId: 242435,
      motionPrompt:
        'Slow dolly in toward the coyote as its one eye catches the last light.',
    },
    {
      beats: 8,
      lyrics: ['c1:1'],
      prompt:
        'close-up of a revolver holstered on the right hip of a ragged coyote, a paw hovering above it, dusk light',
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      lyrics: ['c1:2'],
      prompt:
        'oasis water bulging, the long dark shadow of a huge crocodile beneath the surface',
      artImageId: 241893,
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      lyrics: ['c1:3'],
      prompt:
        'sand and water erupting from an oasis, huge crocodile jaws and teeth bursting upward, spray and dust',
      motionPrompt:
        'The water bursts upward as the jaws snap open and the camera shakes.',
    },
    {
      beats: 6,
      lyrics: ['b1:0'],
      prompt: `${ZUZU}, standing still on the road, wind tugging at the poncho, front view`,
      artImageId: 241913,
      motionPrompt:
        'Slow push in on the hat brim as the wind tugs at the poncho.',
    },
    {
      beats: 6,
      lyrics: ['b1:1'],
      prompt: `${ZUZU}, three-quarter view, paw rising to the katana hilt above the right shoulder`,
      artImageId: 241920,
      motionPrompt:
        'The paw rises and closes on the sword hilt above the right shoulder.',
    },
    {
      beats: 4,
      lyrics: ['o1:0'],
      prompt:
        'a katana blade flashing across a dark frame, a single bright streak of light, dust in the air',
      motionPrompt:
        'A single streak of light sweeps across the blade, then the frame falls to black.',
    },
    {
      beats: 4,
      lyrics: ['o1:1'],
      prompt:
        'black background, swirling desert dust lit by a thin orange sunset glow, a lone straw kasa hat resting in the sand',
      kenBurns: 'zoom-out',
      transition: 'crossfade',
    },
  ],
}

export const MUSIC_VIDEO_SPECS: readonly MusicVideoSpec[] = [
  kindRobotsTheme,
  zuzuIntro,
]

export function musicVideoSpecByKey(key: string): MusicVideoSpec | null {
  return MUSIC_VIDEO_SPECS.find((spec) => spec.key === key) ?? null
}
