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
  MusicVideoSong,
} from '@/utils/musicVideoDoc'
import { RAINBOW_OPENING_TRACK } from './arcade/games/rainbowOpening'

export type MusicVideoSpecScene = {
  /** Length in beats; scenes run back to back from 0:00. The last runs to the end. */
  beats?: number
  /**
   * Where the scene starts, in seconds, for a song that already exists: its
   * lyric line's measured start (t-035). It runs to the next scene's start.
   */
  atSec?: number
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
  /**
   * A song already rendered for this video, so Produce skips straight to the
   * pictures. The import checks the ArtImage still exists.
   */
  song?: MusicVideoSong
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
  song?: MusicVideoSong
} {
  const bpm = spec.settings.bpm ?? 120
  const beat = 60 / bpm
  const end = spec.settings.durationSec
  let at = 0
  const scenes = spec.scenes.map((row, index): MusicVideoScene => {
    const last = index === spec.scenes.length - 1
    if (typeof row.atSec === 'number') at = row.atSec
    const startSec = round3(at)
    const next = spec.scenes[index + 1]?.atSec
    at = typeof next === 'number' ? next : at + (row.beats ?? 0) * beat
    const endSec = last ? end : round3(Math.min(at, end))
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
    ...(spec.song ? { song: spec.song } : {}),
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
      motionPrompt:
        'The two friends look up and smile as the rainbow behind them flares and sparkles burst outward.',
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
      kenBurns: 'pan-right',
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
 * A2. The classic Kind Robots theme song (t-015), as first imported. Silas,
 * 2026-10-06, after the android rewrite: "i actually liked the song and i love
 * the art that has been created for it. can you restore the classic kind
 * robots animation pitch as another project". Kept word for word, so a
 * recovery import can match the deleted copy's song and stills to it. An
 * original homage to 80s Saturday-morning action cartoons, starring a
 * recurring crew so the stills stay consistent. 140 BPM, 75 s = 175 beats; scene changes on bar lines.
 */
const BOLT =
  'Bolt, a small round orange robot with one big glowing blue lens eye and a wrench for a left hand'
const SPROCKET =
  'Sprocket, a lanky teal robot with springy legs and a radio antenna'
const DOTTIE =
  'Dottie, a hovering pink drone robot with a heart-shaped speaker grille'
const JUNK =
  'Junk, a giant friendly mech built from scrap metal, old car doors and a bathtub'

const kindRobotsThemeClassic: MusicVideoSpec = {
  key: 'kind-robots-theme-classic',
  title: 'Kind Robots: Theme Song (Classic)',
  summary:
    'The original crew (Bolt, Sprocket, Dottie and Junk): 75 s duet, 140 BPM, 20 scenes, 5 hero shots, Krea 2.',
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
      motionPrompt:
        'The garage door flies open in a blast of orange light and the robot strikes a heroic pose.',
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
      kenBurns: 'pan-right',
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
 * B. Zuzu: Koala Assassin intro (t-029). Silas, 2026-10-06, on the first cut:
 * "The fill-ins are LAUGHABLE, and the song rhymes behind with behind, and
 * doesn't include Zuzu anywhere, when it would make a killer ending. There's a
 * much better song and image set here." The song and the shots now tell Book
 * One in order (conductor projects/comic-creator/issues/zuzu-koala-assassin-01
 * BOOK-ONE.md): the watering hole and the croc, the bandaged stump, Hollow
 * Bell, the sister's stare, the apples, the nuns, the altar, the road as a
 * pack, and his name as the last word. Vetted comic renders carry the croc,
 * the stump, the nuns, the road and the title; fresh stills use the comic's
 * own canon tags, house look and negatives (VIDEO-GUARDRAILS.md), which the
 * first cut lacked. Heroes open, close and land the Hollow Bell surprise in
 * the middle. 100 BPM, 72 s = 120 beats, one lyric line per two bars.
 */
const ZUZU_BODY =
  'anthro, koala, male, adult, (short:1.2), (stocky:1.2), standing upright, short legs, small stature, slight paunch, grey fur, round fluffy ears, broad black nose, serious, squinting, rust-brown poncho, orange zigzag trim, dark tunic, orange sash, dark brown cloth trousers, (katana on back:1.3), hilt over right shoulder, (fully clothed:1.3)'
const ZUZU = `${ZUZU_BODY}, conical straw kasa, wide brim shading the eyes`
const SISTER =
  'anthro, fennec fox, female, young, about ten years old, thin, enormous ears, sand-colored fur, dusty fur, claw-torn ragged pale dress, bandaged wrists, (fully clothed:1.3)'
const TODDLER =
  'anthro, fennec fox, toddler, tiny, enormous ears, sand-colored fur, ragged checked cloth tunic, bandaged paw, wide eyes'
const COYOTE =
  'anthro, coyote, male, adult, one-eyed, eyepatch over right eye, tattered patched long riding coat, ripped trousers, crushed hat, mangy fur, thin, sickly, underfed, (fully clothed:1.3)'

const zuzuIntro: MusicVideoSpec = {
  key: 'zuzu-intro',
  title: 'Zuzu: Koala Assassin — Intro',
  summary:
    '72 s low-voiced western ballad of Book One, 100 BPM, 15 scenes, 5 vetted comic keyframes, 5 hero shots, comic house look.',
  comicSeriesSlug: 'zuzu-koala-assassin',
  pitch:
    "The title sequence for Zuzu: Koala Assassin, a mature weird western about a koala ronin crossing a dying wasteland. A low, gravelly ballad tells Book One in a minute: Zuzu drinks at a watering hole across from a one-eyed coyote, a giant crocodile erupts between them, it takes the coyote's gun hand and Zuzu binds the stump. He walks into Hollow Bell after a massacre and finds two starving fennec-fox orphans, a sister who stares him down and the toddler in her arms. He leaves them apples, delivers them to kind otter nuns, and comes back when the kindness turns to candles, an altar and something in the dark. It ends on the road, the three of them walking as one, and on his name.",
  settings: {
    durationSec: 72,
    aspect: '16:9',
    bpm: 100,
    vocal: 'male',
    genre:
      'dark western ballad, low gravelly baritone, shakuhachi, twangy baritone guitar, deep taiko',
    mood: 'slow, ominous, dusty, building to one hard final hit',
    heroShots: 5,
    // The comic's house lane: Arthemy Western Art v3.0. When the comic series
    // exists in Comic Studio, its own lane and negatives take over.
    imageLaneKey: 'il-arthemy',
    styleBible:
      'gritty, dark atmosphere, grindhouse, high contrast, heavy shadows, muted earthy palette, desaturated, weathered, grimy, cinematic wide shot',
    negativePrompt:
      '(nude:1.4), (naked:1.3), topless, bare chest, bare back, undressing, nsfw, suggestive, revealing clothes, skull, jolly roger, emblem, logo, tall, lanky, long legs, slender, straw boater, cowboy hat, cloak, cape, ribs, ribcage, skeleton, feather duster, lowres, worst quality, bad anatomy, bad hands, extra limbs, deformed, watermark, signature, blurry, jpeg artifacts, chibi, human, text',
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
    section('v1', 'verse', [
      'Dust on his poncho and a blade on his back',
      'He drank at the water where the stones run black',
      'A one-eyed coyote on the far bank stood',
      'Then the deep pool shattered and the jaws came for blood',
    ]),
    section('v2', 'verse', [
      'Steel bit scale and the gun hand was gone',
      "He bound the stranger's wrist and they both walked on",
      'Hollow Bell was burning when he bared his head',
      'Two small foxes hiding with the dead',
    ]),
    section('v3', 'bridge', [
      'Apples on a stone for the ones who follow',
      'Kind nuns smiling, but the smiles were hollow',
      'Candles on the altar and a shadow in the dark',
      'The girl stood her ground and the steel found its mark',
    ]),
    section('o1', 'outro', [
      'Now the road runs long and the three walk as one',
      'They call him Zuzu, the Koala Assassin!',
    ]),
  ],
  scenes: [
    {
      beats: 8,
      prompt:
        'wide shot, vast desert wasteland at dawn, cracked earth, dead trees, drifting dust, pale smoky sky, low sun, a tiny lone figure far away on the horizon, scenery',
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${ZUZU}, walking toward the viewer across the desert, wind tugging the poncho, dust swirling, low angle, full body`,
      lyrics: ['v1:0'],
      motionPrompt:
        'He walks steadily toward the camera as the wind tugs at his poncho and dust blows past.',
    },
    {
      beats: 8,
      prompt: `${ZUZU}, kneeling at a muddy desert watering hole, drinking from cupped paws, black stones, still water, dusk, long shadows`,
      lyrics: ['v1:1'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${COYOTE}, standing on the far bank of a desert watering hole, empty paw hovering over a revolver holstered on his right hip, hard stare, dusk, long shadows`,
      lyrics: ['v1:2'],
      kenBurns: 'pan-left',
    },
    {
      beats: 8,
      prompt:
        'giant crocodile, bursting out of water, open jaws, sharp teeth, water spray, muddy desert watering hole, action, dynamic angle, feral',
      lyrics: ['v1:3'],
      artImageId: 241893,
      motionPrompt:
        'The crocodile bursts out of the water with its jaws wide as spray explodes and the camera shakes.',
    },
    {
      beats: 8,
      prompt: `${COYOTE}, right arm ending in a stump at the sleeve, gloved left hand, pained, desert watering hole behind him`,
      lyrics: ['v2:0'],
      artImageId: 242428,
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${ZUZU}, kneeling beside a wounded one-eyed coyote, wrapping a cloth bandage around the coyote's right wrist stump, a dead giant crocodile floating in the water behind them, dusk`,
      lyrics: ['v2:1'],
      kenBurns: 'pan-right',
    },
    {
      beats: 8,
      prompt: `${ZUZU_BODY}, holding his straw kasa against his chest, standing small in a wide ruined frontier street, burning wooden buildings, bell tower, smoke, embers, falling ash, wide shot, full body`,
      lyrics: ['v2:2'],
      motionPrompt:
        'Smoke rolls through the burning street as he slowly lowers his hat to his chest.',
    },
    {
      beats: 8,
      prompt: `${SISTER}, carrying a tiny fennec fox toddler in her arms, ${TODDLER}, standing in burned ruins, shielding him, smoke, embers, staring hard at the viewer, full body`,
      lyrics: ['v2:3'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt:
        'red apples piled on a flat stone beside a dusty desert road, a single living apple tree, a thin sand-colored fox paw reaching for the apples, golden light, close-up',
      lyrics: ['v3:0'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt:
        'three otter nuns in black habits smiling at the gate of a desert mission wall, a rusted merry-go-round wrapped in cobwebs in the yard',
      lyrics: ['v3:1'],
      artImageId: 241895,
      kenBurns: 'pan-right',
    },
    {
      beats: 8,
      prompt:
        'candlelit stone altar in a dark chapel, dripping candles, coiled ropes, a huge dark shadow with tentacles rising up the wall, eerie violet glow, scenery',
      lyrics: ['v3:2'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${SISTER}, standing alone in a dark candlelit chapel, gripping a small dagger in both hands, trembling, defiant, hard stare, full body`,
      lyrics: ['v3:3'],
      kenBurns: 'zoom-out',
    },
    {
      beats: 8,
      prompt: `wide shot, long desert road at sunset, ${ZUZU}, walking ahead with a fennec fox girl and a fennec fox toddler close behind him, from behind, long shadows, the koala is shorter than the fox girl`,
      lyrics: ['o1:0'],
      artImageId: 241899,
      motionPrompt:
        'The three of them walk away down the long road into the sunset as the camera slowly rises.',
    },
    {
      beats: 8,
      prompt: `${ZUZU}, hero shot, standing in the desert wind, poncho flaring, low angle`,
      lyrics: ['o1:1'],
      artImageId: 241913,
      motionPrompt:
        'He lifts the brim of his hat and his eyes catch the light as dust blows past.',
    },
  ],
}

/*
 * C. "My Only Friend, a Giant Skeleton" (t-035). Silas, 2026-10-06: "this
 * time I have the mp3 already made, so i need you to identify the lyrics,
 * match them to images. I want a tex avery type vibe with the art. use
 * Illustr." The lyrics were transcribed from his MP3 (faster-whisper, checked
 * across three model sizes) and every scene starts on its line's measured
 * time; the song itself is his upload, so nothing is generated. Two words
 * stayed unclear and are best guesses he can edit under the image: "howls and
 * bites" and "the spirits' charm". Cast: a tiny black cat and a twelve-foot
 * skeleton in a top hat, drawn as a 1940s theatrical cartoon (wild takes,
 * squash and stretch) on the Illustrious furrytoonmix checkpoint, picked as a
 * catalog checkpoint so no western lane suffix rides along.
 */
const CAT =
  'tiny scrawny black cartoon cat, huge round white eyes, skinny legs, long thin tail, red striped scarf'
const SKELLY =
  "giant friendly cartoon skeleton, very tall, long rubbery bony limbs, wide jack-o'-lantern grin, battered black top hat"
const SKELETON_CHORUS = [
  'My only friend, a giant skeleton',
  'Twelve feet tall and made for fun',
  "Dancing wild till the night's undone",
  'My only friend, my only one',
]
const SKELETON_BRIDGE = [
  'Oh, the moon laughs loud in the inky sky',
  'As the gravestones lean and the owls cry',
  'We stomp, we twirl till the dawn arrives',
  "In his empty eyes, my joy's alive",
]

const giantSkeleton: MusicVideoSpec = {
  key: 'giant-skeleton',
  title: 'My Only Friend, a Giant Skeleton',
  summary:
    "Silas's MP3 (upload it in the Song panel): 3:20, 46 scenes cut on the transcribed lines, 6 hero shots, Tex Avery cartoon on Illustrious.",
  pitch:
    "A zany 1940s theatrical-cartoon music video for a Halloween novelty song. A tiny, jittery black cat wanders lost through a moonlit graveyard and finds its only friend: a twelve-foot, top-hatted skeleton with a jack-o'-lantern grin who was made for fun. They dance wild till dawn: rattling bones, a laughing moon, crying owls, gravestones that lean and hop, squash-and-stretch gags and wild cartoon takes, until the sun comes up and the skeleton sinks back into his grave with one last wave.",
  settings: {
    durationSec: 200,
    aspect: '16:9',
    genre: 'halloween novelty swing, spooky big band, playful',
    mood: 'zany, spooky, joyful',
    heroShots: 6,
    imageLaneKey: 'ckpt:Illustrious/furrytoonmix_xlV3.safetensors',
    styleBible:
      'masterpiece, best quality, 1940s theatrical cartoon, retro cartoon, classic hand-drawn animation, exaggerated squash and stretch, wild cartoon take, bold ink outlines, flat cel colors, painted technicolor background, moonlit halloween graveyard, orange, purple and midnight blue palette',
    negativePrompt:
      'lowres, worst quality, bad anatomy, bad hands, extra limbs, deformed, watermark, signature, blurry, jpeg artifacts, text, logo, photorealistic, realistic, 3d, anime, gore, blood, nsfw, nude',
    bannedTerms: [
      'tex avery',
      'droopy',
      'screwy squirrel',
      'red hot riding hood',
      'looney tunes',
      'bugs bunny',
      'daffy duck',
      'mickey mouse',
      'disney',
    ],
  },
  sections: [
    section('i1', 'intro', [
      'Halloween night, howls and bites',
      'Graveyard whispers under pale moonlight',
    ]),
    section('v1', 'verse', [
      "I wandered off, but I ain't alone",
      'Hear the rattling bones, hear the rattling bones',
    ]),
    section('c1', 'chorus', SKELETON_CHORUS),
    section('v2', 'verse', [
      'He steps from the shadows, creaks and groans',
      'With a pumpkin grin and hollow tones',
      "We spin through the graves for the spirits' charm",
      'His bony hands beat like a drum',
    ]),
    section('c2', 'chorus', SKELETON_CHORUS),
    section('b1', 'bridge', SKELETON_BRIDGE),
    section('c3', 'chorus', SKELETON_CHORUS),
    section('b2', 'bridge', SKELETON_BRIDGE),
    section('c4', 'chorus', SKELETON_CHORUS),
    section('b3', 'bridge', SKELETON_BRIDGE),
    section('c5', 'chorus', SKELETON_CHORUS),
  ],
  scenes: [
    {
      atSec: 0,
      prompt:
        'moonlit cartoon graveyard at night, crooked tombstones, twisted bare trees, huge full moon with a grinning face, bats, rolling purple fog, scenery, wide shot',
      kenBurns: 'zoom-in',
    },
    {
      atSec: 4.14,
      prompt: `huge yellow full moon, a flock of bats bursting out of a hollow dead tree, ${CAT}, howling on a broken fence, night sky, wide shot`,
      lyrics: ['i1:0'],
      motionPrompt:
        'The bats burst out of the hollow tree and swirl across the moon as the little cat howls.',
    },
    {
      atSec: 8.14,
      prompt:
        'friendly cartoon ghosts whispering behind crooked tombstones, cupped hands, pale blue moonlight, purple fog, night',
      lyrics: ['i1:1'],
      kenBurns: 'pan-right',
    },
    {
      atSec: 12.38,
      prompt: `${CAT}, tiptoeing through a dark graveyard, knees knocking, sweat drops, looking over its shoulder, full body`,
      lyrics: ['v1:0'],
      kenBurns: 'pan-left',
    },
    {
      atSec: 16.02,
      prompt: `${CAT}, fur standing on end, eyes popping out of its head, jaw dropped, a pile of bones rattling and hopping on a grave, wild cartoon take`,
      lyrics: ['v1:1'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 21.6,
      prompt: `${SKELLY}, rising out of an open grave, towering over a ${CAT}, both grinning, dirt flying, low angle`,
      lyrics: ['c1:0'],
      motionPrompt:
        'The giant skeleton bursts up out of the grave, stretches tall and tips his top hat to the little cat.',
    },
    {
      atSec: 25.86,
      prompt: `${SKELLY}, stretched extremely tall, a measuring tape running from his top hat to his toes, a ${CAT} sitting on his shoulder`,
      lyrics: ['c1:1'],
      kenBurns: 'pan-left',
    },
    {
      atSec: 30.68,
      prompt: `${SKELLY}, dancing a wild jitterbug on top of tombstones with a ${CAT}, motion lines, music notes`,
      lyrics: ['c1:2'],
      kenBurns: 'zoom-out',
    },
    {
      atSec: 34.28,
      prompt: `${CAT}, hugging the bony leg of a ${SKELLY}, little hearts floating, moonlight`,
      lyrics: ['c1:3'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 39.72,
      prompt: `${SKELLY}, stepping out of a dark crypt doorway, creaking joints, long shadow, spooky green glow`,
      lyrics: ['v2:0'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 44.24,
      prompt:
        "close-up, grinning cartoon skull with a glowing orange jack-o'-lantern grin, battered black top hat, singing, orange glow",
      lyrics: ['v2:1'],
      kenBurns: 'zoom-out',
    },
    {
      atSec: 48.9,
      prompt: `${SKELLY}, spinning in a whirlwind between tombstones with a ${CAT}, speed lines, motion blur, dizzy`,
      lyrics: ['v2:2'],
      kenBurns: 'pan-right',
    },
    {
      atSec: 52.34,
      prompt: `${SKELLY}, drumming on his own ribcage with two bones, a ${CAT} bopping along, music notes`,
      lyrics: ['v2:3'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 57.8,
      prompt: `${SKELLY}, juggling his own skull with one hand, a ${CAT} laughing and rolling on the ground`,
      lyrics: ['c2:0'],
      kenBurns: 'zoom-out',
    },
    {
      atSec: 62,
      prompt: `${SKELLY}, peeking over the treetops, a ${CAT} perched on top of his top hat, full moon behind`,
      lyrics: ['c2:1'],
      kenBurns: 'pan-left',
    },
    {
      atSec: 66.8,
      prompt: `${SKELLY}, leading a conga line of little cartoon ghosts across a mausoleum roof, a ${CAT} at the end of the line`,
      lyrics: ['c2:2'],
      kenBurns: 'pan-right',
    },
    {
      atSec: 71.4,
      prompt: `${CAT}, sitting beside a ${SKELLY} on a tombstone, gazing at the full moon, cozy`,
      lyrics: ['c2:3'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 76.48,
      prompt:
        'huge cartoon full moon with a face laughing hysterically, tears of laughter, stars shaking, inky purple night sky',
      lyrics: ['b1:0'],
      motionPrompt:
        'The moon throws its head back and laughs so hard the stars around it shake.',
    },
    {
      atSec: 78.9,
      prompt:
        'crooked tombstones leaning over, cartoon owls with huge eyes crying on a dead branch, moonlight',
      lyrics: ['b1:1'],
      kenBurns: 'pan-left',
    },
    {
      atSec: 81.32,
      prompt: `${SKELLY}, stomping and twirling with a ${CAT}, the ground shaking, tombstones bouncing into the air`,
      lyrics: ['b1:2'],
      kenBurns: 'zoom-out',
    },
    {
      atSec: 83.64,
      prompt:
        'close-up, empty eye sockets of a giant cartoon skull, reflecting a tiny happy black cat, warm glow',
      lyrics: ['b1:3'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 85.96,
      prompt: `${CAT}, riding on the shoulders of a ${SKELLY}, through a moonlit graveyard, cheering`,
      lyrics: ['c3:0'],
      kenBurns: 'pan-right',
    },
    {
      atSec: 89.64,
      prompt: `${SKELLY}, so tall the full moon bumps his top hat, a ${CAT} laughing at his feet`,
      lyrics: ['c3:1'],
      kenBurns: 'zoom-out',
    },
    {
      atSec: 94.6,
      prompt: `${SKELLY}, doing the splits, bones flying apart in midair, a ${CAT} with its jaw dropped, wild cartoon take`,
      lyrics: ['c3:2'],
      motionPrompt:
        'His bones fly apart in midair and snap back together as he lands the splits.',
    },
    {
      atSec: 98.84,
      prompt: `${CAT}, sharing a giant candy apple with a ${SKELLY}, smiling, moonlight`,
      lyrics: ['c3:3'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 102.4,
      prompt:
        'a band of little cartoon ghosts playing a trumpet, a trombone and a bass fiddle on top of a crypt, music notes, moonlight',
      kenBurns: 'pan-right',
    },
    {
      atSec: 110.96,
      prompt:
        'cartoon full moon with a face wiping away tears of laughter with a handkerchief, starry inky sky',
      lyrics: ['b2:0'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 113.08,
      prompt:
        'tombstones leaning like falling dominoes, cartoon owls crying into tiny handkerchiefs, moonlit graveyard',
      lyrics: ['b2:1'],
      kenBurns: 'pan-left',
    },
    {
      atSec: 115.26,
      prompt: `${CAT}, spinning like a top on the fingertip of a ${SKELLY}, motion lines, dizzy stars`,
      lyrics: ['b2:2'],
      kenBurns: 'zoom-out',
    },
    {
      atSec: 117.68,
      prompt:
        'close-up, giant cartoon skull with eye sockets glowing with little pink hearts, battered black top hat',
      lyrics: ['b2:3'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 119.9,
      prompt: `${SKELLY}, pushing a ${CAT} in a rickety wheelbarrow between the graves, both laughing`,
      lyrics: ['c4:0'],
      kenBurns: 'pan-right',
    },
    {
      atSec: 123.62,
      prompt: `${SKELLY}, stretching up to pluck a bat off the full moon, a ${CAT} cheering below`,
      lyrics: ['c4:1'],
      kenBurns: 'zoom-out',
    },
    {
      atSec: 128.44,
      prompt: `${SKELLY}, dancing with a ${CAT} under a spotlight, a crowd of jack-o'-lanterns cheering`,
      lyrics: ['c4:2'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 132.5,
      prompt: `${CAT}, napping in the ribcage of a ${SKELLY} like a hammock, moonlight`,
      lyrics: ['c4:3'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 136.4,
      prompt: `${SKELLY}, tap dancing on a coffin lid, sparks flying from his bony feet, a ${CAT} clapping`,
      kenBurns: 'pan-left',
    },
    {
      atSec: 142.8,
      prompt:
        'a conga line of cartoon bats flying across a huge full moon, purple night sky, wide shot',
      kenBurns: 'pan-right',
    },
    {
      atSec: 149.2,
      prompt: `${SKELLY}, pulling a giant glowing pumpkin out of his top hat, a ${CAT} with its eyes popping out, wild cartoon take`,
      motionPrompt:
        "He reaches into his top hat and pulls out a giant glowing pumpkin as the little cat's eyes pop out.",
    },
    {
      atSec: 157.5,
      prompt:
        'cartoon full moon with a face laughing so hard it rolls across the inky sky, stars scattering',
      lyrics: ['b3:0'],
      kenBurns: 'pan-left',
    },
    {
      atSec: 163.1,
      prompt:
        'sleepy cartoon owls in nightcaps crying on a crooked tombstone, leaning gravestones, moonlight',
      lyrics: ['b3:1'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 167.1,
      prompt: `the whole cartoon graveyard dancing, tombstones hopping, trees swaying, a ${SKELLY} and a ${CAT} in the middle`,
      lyrics: ['b3:2'],
      kenBurns: 'zoom-out',
    },
    {
      atSec: 170.6,
      prompt:
        'close-up, empty eye sockets of a giant cartoon skull reflecting the first pink light of dawn',
      lyrics: ['b3:3'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 176.38,
      prompt: `${SKELLY}, lifting a ${CAT} high toward a pink dawn sky, both overjoyed`,
      lyrics: ['c5:0'],
      kenBurns: 'zoom-out',
    },
    {
      atSec: 180.2,
      prompt: `${SKELLY}, standing at full height against an orange dawn sky, a ${CAT} on his top hat`,
      lyrics: ['c5:1'],
      kenBurns: 'pan-left',
    },
    {
      atSec: 184.8,
      prompt: `${SKELLY}, leaping in midair mid-dance with a ${CAT}, sunrise breaking pink and orange behind them`,
      lyrics: ['c5:2'],
      kenBurns: 'zoom-in',
    },
    {
      atSec: 188.48,
      prompt: `${SKELLY}, waving goodbye as he sinks back into his grave at dawn, a ${CAT} waving back`,
      lyrics: ['c5:3'],
      kenBurns: 'zoom-out',
    },
    {
      atSec: 193.2,
      prompt: `a bony skeleton hand popping out of a grave to wave one last time, a ${CAT} laughing, golden sunrise, morning fog`,
      motionPrompt:
        'A bony hand pops up out of the grave and waves as the little cat laughs and the sun rises.',
    },
  ],
}

/*
 * D. Zuzu's Lair, chapter 1: "The Dry Gulch" keyframes (zuzu-lair t-006).
 * One scene per SCENES.yaml node (conductor projects/zuzu-lair/chapters/
 * 01-dry-gulch), in node order, each as long as its clip. A silent
 * instrumental run in the comic's house lane, with the same Zuzu canon,
 * negatives and bannedTerms as the intro. The importer caps hero shots at
 * eight, so the opening, the first moment pair and the later moments carry
 * the motion prompts; the rest render as stills. Success and death nodes
 * start from their moment's last frame (SCENES.yaml from_last_frame_of): the
 * spec has no field for that yet, so t-007 pins those first frames when it
 * animates the clips.
 */
const zuzuLairCh1: MusicVideoSpec = {
  key: 'zuzu-lair-ch1',
  title: "Zuzu's Lair: The Dry Gulch",
  summary:
    '51 s, 14 keyframes for the chapter 1 scene graph, one per node, comic house look.',
  comicSeriesSlug: 'zuzu-koala-assassin',
  pitch:
    "Chapter one of Zuzu's Lair, an interactive weird western. Zuzu, a short stocky koala ronin in a kasa and poncho, walks into a sun-bleached canyon at late afternoon and meets four dangers in a row: a collapsing rope bridge, a giant scorpion, a rockslide and a gila monster bandit at a high noon standoff. Each danger has a clean escape and a cartoonishly violent death, then he walks out into the sunset.",
  settings: {
    ...zuzuIntro.settings,
    durationSec: 51,
    bpm: 120,
    vocal: 'instrumental',
    heroShots: 8,
    genre: 'spaghetti western instrumental',
    mood: 'tense, dusty, sun-bleached',
  },
  sections: [],
  scenes: [
    {
      atSec: 0,
      prompt: `${ZUZU}, standing at the mouth of a narrow red-rock canyon at late afternoon, long shadow stretching ahead of him, dust blowing, bleached cattle skull on a rock, wide shot`,
      motionPrompt:
        'The camera slowly pushes in as Zuzu tilts his kasa down against the wind and walks into the canyon.',
    },
    {
      atSec: 5,
      prompt: `${ZUZU}, halfway across a frayed rope bridge over a deep canyon gorge, planks splintering under his feet, ropes snapping, low angle from the far cliff`,
      motionPrompt:
        'The bridge planks crack and drop away one by one toward Zuzu as the camera shakes.',
    },
    {
      atSec: 9,
      prompt: `${ZUZU}, leaping across a gap in a collapsing rope bridge, poncho flaring, landing on the far cliff edge in a crouch, dust rising`,
      motionPrompt:
        'Zuzu leaps the gap and lands on the cliff edge as the last of the bridge falls away behind him.',
    },
    {
      atSec: 12,
      prompt: `${ZUZU}, falling backward off a snapped rope bridge into a deep canyon gorge, arms and short legs flailing, eyes wide, his kasa flying off above him, broken planks tumbling around him`,
      kenBurns: 'zoom-in',
    },
    {
      atSec: 16,
      prompt: `${ZUZU}, walking along a narrow canyon ledge, a giant scorpion rising from behind a boulder on his left, its stinger arched high over him, low angle`,
      motionPrompt:
        "The giant scorpion's tail whips down toward Zuzu from the left as the camera pulls back.",
    },
    {
      atSec: 20,
      prompt: `${ZUZU}, rolling right across the canyon ledge as a giant scorpion stinger strikes the rock where he stood, rock chips flying`,
      kenBurns: 'zoom-in',
    },
    {
      atSec: 23,
      prompt: `${ZUZU}, just stung by a giant scorpion's stinger, his grey fur turned sickly green, cheeks puffed out, eyes crossed, body stiff as a plank, tipping over backward on a canyon ledge`,
      kenBurns: 'zoom-in',
    },
    {
      atSec: 26,
      prompt: `${ZUZU}, running down a steep canyon trail as a wall of tumbling boulders and dust pours down the slope behind him, a dark crevice in the rock wall to his left`,
      motionPrompt:
        'Boulders thunder down the slope after Zuzu as the camera tracks alongside him.',
    },
    {
      atSec: 30,
      prompt: `${ZUZU}, pressed flat inside a narrow rock crevice, boulders and dust roaring past the opening in front of him, his eyes narrowed under the kasa`,
      motionPrompt:
        'The rockslide roars past the crevice mouth and the dust slowly settles around Zuzu.',
    },
    {
      atSec: 33,
      prompt: `a huge round boulder sitting on a canyon trail with a pair of small grey koala feet sticking out from under it, a flattened straw kasa beside them, dust hanging in the air`,
      kenBurns: 'zoom-in',
    },
    {
      atSec: 36,
      prompt: `${ZUZU}, facing an anthro gila monster bandit in a tattered long riding coat across a dusty canyon floor, the bandit reaching for a revolver at his hip, high noon standoff, wide shot`,
      motionPrompt:
        "The camera pushes in slowly as the gila monster's claw twitches toward his revolver.",
    },
    {
      atSec: 40,
      prompt: `${ZUZU}, katana drawn in one flash of steel, the gila monster bandit's revolver spinning out of his claw into the dust, the bandit stumbling back wide-eyed`,
      kenBurns: 'zoom-in',
    },
    {
      atSec: 43,
      prompt: `${ZUZU}, blown backward off his feet by a revolver shot, his kasa spinning off his head with a smoking hole through the brim, the gila monster bandit grinning behind a smoking revolver, dusty canyon floor`,
      kenBurns: 'zoom-in',
    },
    {
      atSec: 46,
      prompt: `${ZUZU}, walking away from the camera out of the canyon mouth into a huge orange sunset, katana on his back, long shadow behind him, the defeated gila monster sitting in the dust in the foreground`,
      motionPrompt:
        'The camera holds still as Zuzu walks out into the sunset and the dust settles.',
    },
  ],
}

/*
 * E. "Terrors on Crystal Street" theme (conductor crystal-street/t-015).
 * Silas, 2026-10-24 PT: "a 1 minute long high energy Addams family meets
 * Halloween theme punk music video". The first cut is MusicVideo 15 (shipped
 * as /crystal-street/video/theme.mp4). Every scene was a pan or zoom, so this
 * spec takes the same song (ArtJob 45179) and the 14 reviewed stills, including
 * the re-rendered Jess, Countess and flashlight crew, and animates four
 * hero shots. 172 BPM, 12 beats a scene, the last to 0:60. Family and film
 * names stay banned; the counselor is Jess, never the film's killer.
 */
const CRYSTAL_STREET_CHORUS = [
  'Terrors on Crystal Street, we’re not afraid',
  'Finger snaps unite, in the ghost parade',
  'Terrors on Crystal Street, together we’ll stand',
  'No one’s a monster, we’re a brave band',
]

const crystalStreetTheme: MusicVideoSpec = {
  key: 'crystal-street-theme',
  title: 'Terrors on Crystal Street: Theme',
  summary:
    '60 s horror-punk duet, 172 BPM, 14 scenes from the reviewed stills, its song already made, 4 hero shots to animate.',
  pitch:
    "A one-minute high-energy theme for Terrors on Crystal Street, an 80s horror-comedy game: gothic family-sitcom swagger meets a relentless slasher-movie synth pulse, played as snotty Halloween punk. A gang of misfit teens and their drag-queen ally ride bikes down an idyllic white-picket cul-de-sac as Halloween week turns weird: jack-o'-lanterns grin, porch lights flicker, a towering masked lake counselor rises from the water, a beehived salon nightmare snips dream-smoke, a teddy bear with a cassette tummy waddles at the head of an army of bears, a disco vampire spins under a mirror ball, a werewolf in a letterman jacket waits at the homecoming bonfire. A shout-along chorus, finger snaps, and the crew vowing to survive seven nights together and to let nobody be the monster for who they are. Campy, funny, queer-joyful, spooky, never gory.",
  settings: {
    durationSec: 60,
    aspect: '16:9',
    bpm: 172,
    vocal: 'duet',
    genre: 'horror punk, gothic surf, synth punk',
    mood: 'campy, menacing, triumphant, fun',
    heroShots: 4,
    styleBible:
      'painted 1986 horror-comedy VHS box art, airbrushed gouache, hot magenta and cyan neon rim light, deep midnight purple shadows, suburban Halloween atmosphere, playful spooky mood',
    bannedTerms: [
      'addams',
      'halloween theme',
      'michael myers',
      'jason',
      'freddy',
      'krueger',
      'carpenter',
      'wednesday',
      'gomez',
      'morticia',
    ],
  },
  song: {
    source: 'comfy-acestep',
    artImageId: 253093,
    jobId: 45179,
    durationSec: 60,
    bpm: 172,
    seed: 1993197032,
    tags: 'horror punk, gothic surf, synth punk, campy, menacing, triumphant, fun, male and female duet vocals',
  },
  sections: [
    section('v1', 'verse', [
      "Cruisin' down the street, bikes flashin' bright",
      "Jack-o'-lanterns grin, under the moonlight",
      'Masked counselor looms, from the lake she creeps',
      'Hiding in shadows, where the laughter leaps',
    ]),
    section('c1', 'chorus', CRYSTAL_STREET_CHORUS),
    section('v2', 'verse', [
      'Beehived nightmare snips, with a wicked twist',
      'Teddy bear brigade, can’t let them be missed',
      'Disco vampire spins, under the mirror glow',
      'Werewolf in a jacket, ready for the show',
    ]),
    section('c2', 'chorus', CRYSTAL_STREET_CHORUS),
  ],
  scenes: [
    {
      beats: 12,
      prompt:
        'A group of misfit teens rides colorful bikes down a tree-lined cul-de-sac, laughter in their expressions, with white picket fences and glowing Halloween decorations framing the scene under a vibrant purple sky.',
      lyrics: ['v1:0'],
      artImageId: 253055,
      motionPrompt:
        'The teens pedal hard down the street toward the camera as porch lights flicker and autumn leaves whirl up behind their bikes.',
    },
    {
      beats: 12,
      prompt:
        "A cluster of grinning jack-o'-lanterns sits on porches, flickering candlelight casting playful shadows, while the full moon bathes the street in silver light, creating a whimsical yet eerie atmosphere.",
      lyrics: ['v1:1'],
      artImageId: 253056,
      kenBurns: 'pan-right',
    },
    {
      beats: 12,
      prompt:
        'A towering muscular woman with long wet dark hair pulling a cracked, scarred lake-rescue mask over her face as she rises waist-deep from a moonlit lake, a torn navy lace-up dress and a leather belt, a summer-camp whistle on a lanyard around her neck, pines and a lit cabin across the water behind her',
      lyrics: ['v1:2'],
      artImageId: 253090,
      motionPrompt:
        'She rises slowly out of the moonlit lake, water streaming from her shoulders, as she pulls the cracked mask down over her face.',
    },
    {
      beats: 12,
      prompt:
        'Laughing teens hide in the deep shadows of a tall hedge, vibrant colors glowing from nearby houses, as ghostly shapes swirl around them, evoking a sense of playful mischief.',
      lyrics: ['v1:3'],
      artImageId: 253058,
      kenBurns: 'pan-left',
    },
    {
      beats: 12,
      prompt:
        'The gang stands together, fists raised in defiance, surrounded by glowing pumpkins and swirling mist, with a backdrop of brightly lit houses casting a warm glow against the midnight sky.',
      lyrics: ['c1:0'],
      artImageId: 253059,
      kenBurns: 'zoom-in',
    },
    {
      beats: 12,
      prompt:
        'A diverse group of friends snaps their fingers in unison, vibrant colors swirling around them, as they march down the street, illuminated by flickering porch lights and glowing decorations.',
      lyrics: ['c1:1'],
      artImageId: 253060,
      kenBurns: 'pan-right',
    },
    {
      beats: 12,
      prompt:
        'The crew stands united, arms around each other, against a backdrop of colorful lights and Halloween decor, with a sense of camaraderie and bravery radiating from their expressions.',
      lyrics: ['c1:2', 'c1:3'],
      artImageId: 253061,
      kenBurns: 'zoom-out',
    },
    {
      beats: 12,
      prompt:
        'A beehived salon nightmare, scissors in hand, snips through ethereal dream-smoke, surrounded by floating sparkles and vibrant colors, capturing a whimsical yet slightly sinister mood.',
      lyrics: ['v2:0'],
      artImageId: 253062,
      kenBurns: 'pan-left',
    },
    {
      beats: 12,
      prompt:
        'A teddy bear with a cassette tummy waddles proudly at the forefront of an army of plush bears, all dressed in colorful costumes, marching energetically down the street under a playful, glowing sky.',
      lyrics: ['v2:1'],
      artImageId: 253063,
      kenBurns: 'zoom-in',
    },
    {
      beats: 12,
      prompt:
        "A glamorous vampire disco diva in a white jumpsuit with a towering collar and a black satin cape, a golden lion's-mane of hair and glinting fangs, arms raised beneath a giant glowing mirror ball on a light-up dance floor, teen dancers in glitter and leg warmers spinning around her",
      lyrics: ['v2:2'],
      artImageId: 253091,
      motionPrompt:
        'The mirror ball spins and throws sparkles across the floor as she flings her cape wide and the dancers whirl around her.',
    },
    {
      beats: 12,
      prompt:
        'A werewolf in a letterman jacket stands confidently by a roaring bonfire, shadows flickering across the scene, with embers rising against a backdrop of ecstatic teens and colorful decorations.',
      lyrics: ['v2:3'],
      artImageId: 253065,
      kenBurns: 'zoom-out',
    },
    {
      beats: 12,
      prompt:
        "The crew of misfit teens stands together on a misty cul-de-sac, shoulder to shoulder, holding up flashlights, walkie-talkies and a boombox, determined grins lit by rows of glowing jack-o'-lanterns, porch lights shining from the houses behind them",
      lyrics: ['c2:0'],
      artImageId: 253092,
      kenBurns: 'pan-left',
    },
    {
      beats: 12,
      prompt:
        'Friends snap their fingers in unison again, the vibrant colors of Halloween swirling around them, as they march joyfully through a ghostly parade of playful spirits and decorations.',
      lyrics: ['c2:1'],
      artImageId: 253067,
      kenBurns: 'zoom-in',
    },
    {
      beats: 12,
      prompt:
        'The group forms a tight circle, each member shining with confidence and joy, surrounded by glowing ghosts and colorful lights, united in their pledge of bravery and acceptance.',
      lyrics: ['c2:2', 'c2:3'],
      artImageId: 253068,
      motionPrompt:
        'The friends close the circle and throw their fists up together as the glowing ghosts swirl around them and the camera pulls back.',
    },
  ],
}

/*
 * F. The Rainbow Space Princess opening (conductor rainbow t-034). Silas,
 * 2026-10-23 PT: "We can use a real animation at the beginning, maybe a 15
 * second high energy thrash metal music video." The thrash track (ArtJob
 * 44644) and nine approved stills from the clip ledger (OPENING-CLIPS-1.yaml)
 * already exist; those clips rendered as animated webp, which the exporter
 * cannot decode, so Produce animates the six hero shots again as mp4. The
 * four pilots' power-ups are the fast cuts in the middle. 176 BPM, 16 s,
 * instrumental. The genre benchmarks it was pitched against stay banned.
 */
const rainbowPrincessOpening: MusicVideoSpec = {
  key: 'rainbow-princess-opening',
  title: 'Rainbow Space Princess: Opening',
  summary:
    '16 s instrumental thrash-metal opening, 176 BPM, 9 shots from the approved stills, its track already made, 6 hero shots to animate.',
  pitch:
    'The opening of Rainbow Bullet Hell Space Princess, a four-player candy-colored space shooter. Sixteen seconds of blistering instrumental thrash metal: a violet storm breaks over the pearl palace, the mission-control liaison Lilt turns from a cracked mirror screen as alarms strobe, the dark eclipse orb wakes in its chains, then four fast cuts as each pilot powers up (Maribel in rose pink, Azure in cyan, Solenne in butter yellow, Vivi in lilac), the robot dolphin fleet surges across the stars, and the four ships blast off over the palace in rainbow trails on the final hit.',
  settings: {
    durationSec: 16,
    aspect: '16:9',
    bpm: RAINBOW_OPENING_TRACK.bpm,
    vocal: 'instrumental',
    genre: 'thrash metal',
    mood: 'blistering, aggressive, triumphant, high energy',
    heroShots: 6,
    styleBible:
      'bold flat-color cartoon animation, clean ink outlines, candy pink, lilac, powder cyan and butter-yellow neon glow against deep navy space, glossy pearl and glass highlights, high-energy anime opening framing',
    bannedTerms: ['gradius', 'darius', 'r-type', 'konami', 'irem', 'taito'],
  },
  song: {
    source: 'comfy-acestep',
    artImageId: 252834,
    jobId: 44644,
    durationSec: RAINBOW_OPENING_TRACK.seconds,
    bpm: RAINBOW_OPENING_TRACK.bpm,
    tags: RAINBOW_OPENING_TRACK.prompt,
  },
  sections: [],
  scenes: [
    {
      beats: 6,
      prompt:
        'A gleaming pearl palace with tall glowing towers on a glowing ocean at dawn, violet lightning forking across a stormy pink sky, crashing waves, wide shot',
      artImageId: 247738,
      motionPrompt:
        "Violet lightning forks across the dawn sky and the glowing ocean heaves into crashing waves; the pearl palace's towers flare with pink alarm lights and the clouds race.",
    },
    {
      beats: 5,
      prompt:
        'A calm androgynous pearl-glass synthetic person with luminous filaments and warm gold eyes turning in alarm at a cracked mirror screen, red warning light, sparks',
      artImageId: 247809,
      kenBurns: 'zoom-in',
    },
    {
      beats: 5,
      prompt:
        'A huge dark eclipse orb wrapped in glowing chains, throbbing with violet energy, rings of light pulsing outward, crackling lightning, deep space',
      artImageId: 247752,
      kenBurns: 'zoom-in',
    },
    {
      beats: 4,
      prompt:
        'A compact short-haired pink-haired pilot princess in a rose-pink flight suit leaning into a power-up, pink petals of light blasting outward, sparks streaming past',
      artImageId: 247644,
      motionPrompt:
        'The pink-haired pilot leans into the charge as her hair whips back, pink petals of light blast outward and sparks stream past.',
    },
    {
      beats: 4,
      prompt:
        'A tall pilot princess in a long cyan coat snapping a glowing lance forward, a beam of cyan light flaring, coat whipping in the blast',
      artImageId: 247649,
      motionPrompt:
        'The cyan-coated pilot snaps her lance forward as a beam of cyan light flares and her coat whips in the blast.',
    },
    {
      beats: 4,
      prompt:
        'A powerfully muscular pilot princess in butter-yellow armor bracing as a golden halo ring spins and blazes above her, rings of warm light pulsing outward',
      artImageId: 247803,
      motionPrompt:
        'The muscular pilot braces as her golden halo ring spins up and blazes, rings of warm light pulsing outward.',
    },
    {
      beats: 4,
      prompt:
        'A curvy punk pilot princess with a shaved side and lilac-streaked hair grinning as lilac comet sparks burst around them, hair streaking back',
      artImageId: 247844,
      motionPrompt:
        'The punk pilot grins as lilac comet sparks burst around them and their hair streaks back in the rush.',
    },
    {
      beats: 6,
      prompt:
        'A fleet of sleek robot dolphin starships surging across a starry sky at full speed, glowing trails streaking behind them',
      artImageId: 247740,
      kenBurns: 'pan-left',
    },
    {
      beats: 8,
      prompt:
        'Four pilot starships blasting forward over a pearl palace, engines flaring in pink, cyan, gold and lilac rainbow trails, sparks and light streaks, triumphant',
      artImageId: 247508,
      motionPrompt:
        'The four pilot ships blast forward over the pearl palace, engines flaring in pink, cyan, gold and lilac rainbow trails as sparks and light streaks whip past.',
    },
  ],
}

/*
 * G. The Space Couch opening titles (conductor game-of-captains
 * OPENING-TITLES.md). Silas, 2026-10-27 PT: "write me a music video for the
 * opening to space couch ... jazzy, surprise beats, high energy, engine
 * humming and loud percussive horns." The ship IS a long red couch in open
 * space inside a faint force bubble (kind_robots docs/space-couch); the crew
 * looks match the game's portrait round. Scenes follow the 18-plate storyboard
 * (OPENING-TITLES-ROUND-1.yaml); once those render, a scene can point at its
 * plate with artImageId. 176 BPM swing, 74 s; the stop after the verse is the
 * first surprise beat, the warp barrel roll the second.
 */
const COUCH =
  'a very long tufted crimson upholstered couch with two rolled armrests floating in open outer space inside a thin transparent bubble of faint blue refracted light'
const FLUKE =
  'Captain Fluke, a middle-aged man with shaggy silver hair, an uneven burgundy jacket with two gold shoulder bars and a crooked pale-gold medal'
const PELL =
  'Bosun Pell, a short stocky red-skinned engineer with dark freckles, a shaved scalp, grey coveralls and one heavy steel prosthetic forearm'
const TESS =
  'Tess Helio, a lean East Asian woman with shoulder-length black hair, silver wire goggles on her forehead, a navy jumpsuit and a long tan woven scarf'
const MOX =
  'Mox-9, a small spherical silver robot with one large blue eye and three thin legs'
const CREW = 'four crew members seated shoulder to shoulder on the cushions'

const spaceCouchOpening: MusicVideoSpec = {
  key: 'space-couch-opening',
  title: 'Space Couch: Opening',
  summary:
    '74 s big-band swing opening, 176 BPM, 23 scenes on the red couch with two hard stops, 7 hero shots, Krea 2.',
  pitch:
    'The opening titles of Space Couch, a comic sci-fi captain game whose starship is one very long red couch floating in open space inside a faint force bubble. A Saturday-morning superhero-cartoon theme: a booming, over-serious narrator, big-band swing at full blast with percussive horn stabs on every hit, and a low engine hum under the whole song that keeps going even when the band stops dead. Captain Fluke, Bosun Pell, Tess Helio and the robot Mox-9 get name-card freeze-frames, pocket rooms unfold behind the backrest (holodeck, war room, infirmary), the villains loom in a half-time drop (the Galactic Auditor, the Queen of Borrowed Faces, Dr. Curdle and his elected food dispenser), the couch barrel-rolls through a warp, docks at the Serendipity Space Bar with Barkeep Vox, and ends on a key change and a shouted gang chorus: Sit down for justice!',
  settings: {
    durationSec: 74,
    aspect: '16:9',
    bpm: 176,
    vocal: 'duet',
    genre:
      'big-band swing cartoon theme, blaring brass section, percussive horn stabs, walking bass, gang-vocal shout chorus',
    mood: 'bombastic, goofy, heroic, high energy, sudden stops',
    heroShots: 7,
    styleBible:
      'bold 1990s Saturday-morning action cartoon, thick black ink outlines, flat saturated cel colour with hard cel shadows, halftone dots in the sky, crimson red, electric blue, deep violet and brassy gold, starfields and nebulae, speed lines and comic impact bursts, heroic low camera angles',
    bannedTerms: [
      'the tick',
      'arthur',
      'spoon',
      'red dwarf',
      'hitchhiker',
      'star trek',
      'enterprise',
    ],
  },
  sections: [
    section('intro', 'intro', [
      'In the cold and uncaring vacuum of space',
      'One piece of furniture chose to recline',
      'Space! Couch!',
    ]),
    section('v1', 'verse', [
      "Who's got the stars in the palm of their hand?",
      'Who reads the sky like a cheap paper map?',
      "Who's got opinions and, sadly, they're right?",
      "And the one in the middle who's sitting up straight!",
    ]),
    section('c1', 'chorus', [
      'Space Couch! (Space Couch!)',
      'Cushions to the stars!',
      'No hull, no hatch, no bridge to guard',
      'Just a bubble and a whole lot of heart!',
      'Space Couch! (Sit down!)',
      'Sit down for justice!',
      "When the galaxy calls, you don't stand up",
      'You scoot over!',
    ]),
    section('b1', 'bridge', [
      'Pop goes the holodeck, flip goes the map',
      'Doctor on call when the warp gets rough',
      'Here comes the Auditor, here comes the bill',
      'Borrowed faces shining in the shield',
      'Doctor Curdle got himself elected mayor',
      "Pull up at Serendipity, the round's on Vox",
    ]),
    section('c2', 'chorus', [
      'Space Couch! (Space Couch!)',
      'Cushions to the stars!',
      'Keep your feet off the force field, friend',
      'And your heart where the people are!',
      'Space Couch! (Sit down!)',
      'Sit down for justice!',
      "When the universe asks who's gonna help",
      "We're already sitting here!",
    ]),
    section('outro', 'outro', ['Space Couch!']),
  ],
  scenes: [
    {
      beats: 24,
      prompt: `a vast violet nebula full of glittering stars with ${COUCH} drifting sideways through it, small at the center, ${CREW}, one bright glint on the bubble`,
      lyrics: ['intro:0', 'intro:1'],
      motionPrompt:
        'The red couch drifts slowly sideways through the nebula as the camera pushes in, purple gas clouds swirl, and a single bright glint slides across the bubble.',
    },
    {
      beats: 8,
      prompt: `${COUCH} rocketing straight toward the viewer out of a starfield, huge and foreshortened, bright speed lines streaking past, ${CREW} leaning back with their hair blown flat, a burst of gold light rays across the violet sky above`,
      lyrics: ['intro:2'],
      motionPrompt:
        'The couch rockets straight at the camera, speed lines whipping past and gold light rays bursting outward as the crew are pressed back into the cushions.',
    },
    {
      beats: 8,
      prompt: `${PELL} sitting on a red couch cushion belting out a song into a large wrench held like a microphone, eyes squeezed shut, an electric blue and gold halftone starburst behind him`,
      lyrics: ['v1:0'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${TESS} kneeling on a red couch cushion and pointing dramatically at one bright star with a wobbly motion trail, holding a transparent navigation disk with six green dots, scarf streaming sideways, violet starfield`,
      lyrics: ['v1:1'],
      kenBurns: 'pan-left',
    },
    {
      beats: 8,
      prompt: `${MOX} sitting alone on a plump crimson couch cushion, its eye half-lidded in deadpan annoyance, one tiny projector arm raised like an eyebrow, an electric blue starburst behind it`,
      lyrics: ['v1:2'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${FLUKE} standing heroically on the seat of a long crimson couch in space, chest out, saluting proudly toward the empty left side of the sky with an upside-down brass star chart flapping in his other hand, a giant ringed planet behind him`,
      lyrics: ['v1:3'],
      kenBurns: 'zoom-out',
    },
    {
      beats: 8,
      prompt: `side view of ${COUCH} in quiet starry space, ${CREW} frozen mid-pose like statues with arms raised in a dance move, a single square red cushion floating slowly up and away, the small silver robot turning its blue eye to follow it, a small brass cowbell drifting in the dark sky`,
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${COUCH} swooping across a violet nebula, ${CREW} singing at the top of their lungs with mouths wide open, gold halftone bursts and speed lines`,
      lyrics: ['c1:0', 'c1:1'],
      kenBurns: 'pan-right',
    },
    {
      beats: 8,
      prompt: `close view of ${CREW} of a long crimson couch hugging each other inside a glowing faint blue bubble, open deep space and stars on every side, warm pink light on their grinning faces`,
      lyrics: ['c1:2', 'c1:3'],
      kenBurns: 'zoom-out',
    },
    {
      beats: 8,
      prompt: `low heroic angle of ${CREW} of a long crimson couch thrusting their fists in the air, the faint blue bubble flaring gold at the edges, a ringed planet behind them`,
      lyrics: ['c1:4', 'c1:5'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `front view of ${COUCH}, ${FLUKE}, ${TESS}, ${PELL} and ${MOX} all sliding one seat to the right together with bright motion lines, a tiny round fuzzy teal alien with three eyes and a big grin waving from the freed left cushion`,
      lyrics: ['c1:6', 'c1:7'],
      motionPrompt:
        'The four crew members slide one seat to the right in perfect unison, and the tiny teal alien pops up on the empty cushion and waves at the camera.',
    },
    {
      beats: 6,
      prompt: `${COUCH} with ${CREW}, a large room of glowing neon-cyan grid lines unfolding behind its backrest like a pop-up book, a friendly translucent green holographic dragon bowing politely inside it`,
      lyrics: ['b1:0'],
      kenBurns: 'zoom-out',
    },
    {
      beats: 6,
      prompt:
        'over-the-shoulder view from behind a long crimson couch in open space, a tall folding chamber flipped open behind its backrest, an enormous holographic star map of planets, orbit rings and glowing route lines hanging in the air, four crew members leaning over the backrest toward it, red and gold light',
      kenBurns: 'pan-left',
    },
    {
      beats: 6,
      prompt:
        'a compact glowing white and mint-green infirmary room unfolding behind the backrest of a long crimson couch in space, Dr. Vela Sorn, a broad lilac-skinned alien woman with small pointed ears, large round amber eyes and a sea-green medical jacket, spinning around with an orange scanner raised and one eyebrow arched',
      lyrics: ['b1:1'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `a colossal stern figure in a long charcoal coat with brass ledger plates down its front looming over a planet, a smooth pale mask face with thin glowing gold eyes, holding a brass clipboard as big as a moon, far below it ${COUCH} glowing a worried orange, a huge glowing holographic sheet of empty ledger columns hanging over the couch`,
      lyrics: ['b1:2'],
      motionPrompt:
        'The colossal figure leans down over the planet and slams its moon-sized clipboard forward as the tiny couch bubble flickers orange.',
    },
    {
      beats: 8,
      prompt:
        'close view of the curved faint blue bubble around a long crimson couch acting like a mirror, four crew members staring at their reflections, every reflection showing the same serene tall woman in a sweeping pale gray cloak flaring like moth wings holding a silver mask on a slender rod, porcelain masks drifting in the starry dark, cold silver moonlight',
      lyrics: ['b1:3'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `a colossal chrome food dispenser machine the size of a city block in orbit over a green planet, nozzles, conveyor chutes and steaming copper vats, a brass mayoral sash across its front, a round cheerful bald scientist in a stained white lab coat and thick goggles riding on top waving a ladle, cubes of pale nutrient paste tumbling past ${COUCH} with ${CREW}`,
      lyrics: ['b1:4'],
      kenBurns: 'pan-right',
    },
    {
      beats: 8,
      prompt: `${COUCH} tilted sideways mid-barrel-roll through an exploding white and electric blue warp starburst, red square cushions scattering everywhere, the crew snatching cushions out of the air, the captain in a burgundy jacket grabbing at two cushions and missing both, speed lines and comic impact bursts`,
      motionPrompt:
        'The couch barrel-rolls through the exploding warp, cushions scatter in every direction, and the crew snatch them out of the air one after another while the captain misses both of his.',
    },
    {
      beats: 8,
      prompt: `a cozy circular space bar with copper wall pipes, round portholes, dark red booths and warm amber lamps, ${COUCH} docked right at the curved counter through a wide open porthole, Barkeep Vox, a short bipedal beige tardigrade in a brown vest, sliding four glowing drinks down a scratched wooden counter toward the crew`,
      lyrics: ['b1:5'],
      kenBurns: 'pan-left',
    },
    {
      beats: 16,
      prompt: `low heroic angle looking up at ${COUCH} soaring upward through a brilliant gold and violet sunrise over a ringed planet, ${FLUKE} at the center with ${TESS}, ${PELL} and ${MOX}, all seated and pointing forward together with fists raised, brassy gold light rays and halftone bursts`,
      lyrics: ['c2:0', 'c2:1', 'c2:2', 'c2:3'],
      motionPrompt:
        'The couch soars upward into the sunrise as the bubble blazes gold at its edges and the crew punch their fists forward on the beat.',
    },
    {
      beats: 8,
      prompt: `${COUCH} blasting through a giant ring of gold light, ${CREW} shouting with fists raised, sparks and stars streaming past`,
      lyrics: ['c2:4', 'c2:5'],
      kenBurns: 'zoom-in',
    },
    {
      beats: 8,
      prompt: `${CREW} of a long crimson couch leaning back relaxed with big confident grins, arms folded behind their heads, a calm starfield and a spiral galaxy behind them`,
      lyrics: ['c2:6', 'c2:7'],
      kenBurns: 'zoom-out',
    },
    {
      prompt: `an enormous calm starfield with a spiral galaxy and distant colourful planets, ${COUCH} floating peacefully at lower center, four tiny crew members lounging on the cushions sharing one big bowl of popcorn, a few kernels floating in the air, one bright glint on the bubble`,
      lyrics: ['outro:0'],
      motionPrompt:
        'The camera pulls slowly back from the couch as popcorn kernels drift upward, then one bright glint slides across the bubble on the final horn hit.',
    },
  ],
}

export const MUSIC_VIDEO_SPECS: readonly MusicVideoSpec[] = [
  kindRobotsTheme,
  kindRobotsThemeClassic,
  zuzuIntro,
  giantSkeleton,
  zuzuLairCh1,
  crystalStreetTheme,
  rainbowPrincessOpening,
  spaceCouchOpening,
]

export function musicVideoSpecByKey(key: string): MusicVideoSpec | null {
  return MUSIC_VIDEO_SPECS.find((spec) => spec.key === key) ?? null
}
