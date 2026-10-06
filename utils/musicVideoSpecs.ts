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
  /**
   * A site image (a path under /images/, such as the logo) to put on this
   * scene. The import copies it into a private ArtImage; until then, or if it
   * cannot be read, the scene renders its prompt instead.
   */
  siteImage?: string
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
 * A. The Kind Robots theme song (t-015). Silas, 2026-10-06: "I don't want to
 * see a bunch of metal robots in this video. our robots have character and
 * personality ... our robots are androids. this should also have a saturday
 * morning cartoon feel. use our logo as one of the images, or two." The cast
 * is the site's own: AMI, the Anti-Malaria Intelligence (amibotsquare1.webp),
 * and the two androids from the logo (kindlogo_new.webp), which opens and
 * closes the video. 140 BPM, 75 s = 175 beats; scene changes on bar lines.
 */
const TEAL =
  'a cheerful teal-skinned android woman with a glossy teal-and-purple cat-eared helmet, gold headphones, green eyes and a playful purple-lipped smile'
const PINK =
  'a bubbly android girl with curly pink hair, big teal eyes, glowing cat-ear headphones and shiny purple-and-gold armor'
const AMI =
  'a blue-skinned android fairy with big golden eyes, a glowing amber honeycomb dome on her head, purple headphones, shimmering green dragonfly wings and yellow butterfly wings, holding a glowing honeycomb orb'
const LOGO = '/images/kindlogo_new.webp'

const kindRobotsTheme: MusicVideoSpec = {
  key: 'kind-robots-theme',
  title: 'Kind Robots: Theme Song',
  summary:
    '75 s duet, 140 BPM, 20 scenes starring AMI and the logo androids, the logo twice, 5 hero shots, Krea 2.',
  pitch:
    'The opening theme for the Kind Robots Saturday-morning cartoon. Our robots are androids with big personalities: AMI, the Anti-Malaria Intelligence, a hyperactive, loving android fairy who flies mosquito nets to families who need them, and the two best friends from the Kind Robots logo, a teal cat-eared android and a pink-haired android girl. They skate rainbow roads over a cosmic candy-coloured city, fix what is broken, throw rooftop dance parties and help the neighbourhood. Kindness is the superpower. The chorus is a shouted gang-vocal hook about being kind robots.',
  settings: {
    durationSec: 75,
    aspect: '16:9',
    bpm: 140,
    vocal: 'duet',
    genre:
      '80s Saturday-morning cartoon theme, bright synth pop rock, gated drums, shouted gang-vocal chorus',
    mood: 'joyful, heroic, goofy, high-energy',
    heroShots: 5,
    styleBible:
      '80s and early-90s Saturday-morning cartoon, bold black ink outlines, flat cel colour with soft two-tone shadows, bright candy palette of teal, pink, purple and gold, glossy android characters with expressive anime eyes and big friendly smiles, painted cel backgrounds of a cosmic city of floating towers under a rainbow, sparkles and stars, speed lines, heroic low camera angles',
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
      'Rainbow over the city and the stars coming out',
      'Two best friends with a smile and a shout',
      'Hearts made of starlight, circuits made of song',
      "Somebody needs a hand and they're running along",
    ]),
    section('c1', 'chorus', [
      'Kind Robots! (Kind Robots!)',
      'Built with love and built for good',
      'Kind Robots! (Kind Robots!)',
      'Helping out the neighbourhood',
    ]),
    section('v2', 'verse', [
      'Here comes AMI on her wings of light',
      'Mosquito nets sailing through the night',
      'Every little spark can light the way',
      'Kindness is the power that saves the day',
    ]),
    section('c2', 'chorus', [
      'Kind Robots! (Kind Robots!)',
      'Built with love and built for good',
      'Kind Robots! (Kind Robots!)',
      'Helping out the neighbourhood',
    ]),
    section('outro', 'outro', ['Kindness is the superpower!', 'Kind Robots!']),
  ],
  scenes: [
    {
      beats: 8,
      prompt:
        'a cosmic candy-coloured city of floating towers at night, a huge rainbow arching across a starry purple sky, sparkles drifting through the air',
      kenBurns: 'pan-right',
    },
    {
      beats: 8,
      prompt: `${TEAL} and ${PINK} smiling side by side at a cosmic café table under a rainbow`,
      lyrics: ['intro:0'],
      siteImage: LOGO,
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${TEAL} and ${PINK} roller skating along a glowing rainbow road high above the cosmic city`,
      lyrics: ['v1:0'],
      kenBurns: 'pan-left',
    },
    {
      beats: 8,
      prompt: `close-up of ${TEAL} and ${PINK} laughing together, cat-ear headphones glowing, sparkles all around`,
      lyrics: ['v1:1'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${PINK} playing a glowing rainbow keytar on a rooftop at night, musical sparkles swirling from the keys`,
      lyrics: ['v1:2'],
      kenBurns: 'zoom-out',
    },
    {
      beats: 8,
      prompt: `${TEAL} and ${PINK} sprinting down a bright candy-coloured street toward a kitten stuck high in a tree, speed lines behind them`,
      lyrics: ['v1:3'],
      kenBurns: 'pan-right',
    },
    {
      beats: 8,
      prompt: `${TEAL} and ${PINK} leaping off a rooftop toward the camera, arms spread wide, a rainbow trail streaming behind them`,
      lyrics: ['c1:0'],
      motionPrompt:
        'The two friends leap off the rooftop and fly toward the camera as a rainbow trail streams out behind them.',
    },
    {
      beats: 8,
      prompt: `${TEAL} kneeling on a sunny sidewalk fixing a child's bicycle, golden sparkles rising from her hands, the child grinning`,
      lyrics: ['c1:1'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${TEAL} and ${PINK} giving each other a big high five in front of a giant rainbow, stars bursting around their hands`,
      lyrics: ['c1:2'],
      kenBurns: 'zoom-out',
    },
    {
      beats: 8,
      prompt: `${PINK} handing glowing paper lanterns to smiling neighbours on a cozy street at dusk, warm light in every window`,
      lyrics: ['c1:3'],
      kenBurns: 'pan-left',
    },
    {
      beats: 8,
      prompt: `${AMI}, glowing butterflies around her, teal night sky`,
      lyrics: ['v2:0'],
      siteImage: '/images/amibotsquare1.webp',
      motionPrompt:
        'Her wings flutter open and the orb in her hands glows brighter as tiny butterflies circle her.',
    },
    {
      beats: 8,
      prompt: `${AMI} flying over a moonlit village of little huts, dropping glowing blue mosquito nets that float down like parachutes`,
      lyrics: ['v2:1'],
      kenBurns: 'pan-right',
    },
    {
      beats: 8,
      prompt: `${AMI} lifting her glowing orb as it bursts into hundreds of rainbow butterflies over the cosmic city`,
      lyrics: ['v2:2'],
      motionPrompt:
        'The orb bursts open and hundreds of rainbow butterflies pour out and swirl up into the sky.',
    },
    {
      beats: 8,
      prompt: `${AMI}, ${TEAL} and ${PINK} holding hands in a circle on a rooftop, glowing hearts floating above them`,
      lyrics: ['v2:3'],
      kenBurns: 'zoom-out',
    },
    {
      beats: 8,
      prompt: `${TEAL} and ${PINK} racing across a neon rainbow bridge at night while ${AMI} flies above them`,
      lyrics: ['c2:0'],
      kenBurns: 'pan-left',
    },
    {
      beats: 8,
      prompt: `${TEAL} painting a giant rainbow across a city wall with a glowing brush, colours splashing everywhere`,
      lyrics: ['c2:1'],
      motionPrompt:
        'She sweeps the glowing brush across the wall and the rainbow spreads out in a splash of colour.',
    },
    {
      beats: 8,
      prompt: `${PINK} spinning records at a rooftop dance party under the stars, friendly androids and neighbours dancing around her`,
      lyrics: ['c2:2'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt:
        'a whole cosmic neighbourhood of friendly androids and townsfolk waving from windows and balconies, rainbow bunting, warm glowing lights',
      lyrics: ['c2:3'],
      kenBurns: 'pan-right',
    },
    {
      beats: 16,
      prompt: `${AMI}, ${TEAL} and ${PINK} striking a heroic pose on the tallest floating tower, a huge rainbow behind them, low camera angle`,
      lyrics: ['outro:0'],
      kenBurns: 'zoom-out',
    },
    {
      beats: 15,
      prompt: `${TEAL} and ${PINK} smiling side by side at a cosmic café table under a rainbow, raising a glowing drink`,
      lyrics: ['outro:1'],
      siteImage: LOGO,
      motionPrompt:
        'The two friends turn to the camera and smile as the rainbow behind them shimmers and sparkles drift upward.',
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
