/**
 * MONSTRIQUE cutscenes: one script, two media.
 *
 * Every cutscene is a shot list. The playable game shows each shot as a 2D
 * letterboxed panel with the cast on stage; the animated version reads the
 * same shot's `camera` block as direction for a 3D key frame and its timing.
 * `composeShotPrompt` (artStyles.ts) renders any shot in any style, so a beat
 * looks like the game in 2D and like an animated feature in 3D without
 * forking the story.
 *
 * Tone rule from the story bible: steamy beats cut away on a comic beat
 * (the ice machine clanks, a neon letter burns out, Norb knocks with his
 * elbow). The `gag` on a shot is that cutaway.
 */
import {
  GENERAL_INTRO,
  MATURE_INTRO,
  type MonstriqueAudience,
} from '../monstressConvention/edition'
import type { CaseState } from '../monstressConvention/prologue'
import type { CastSlot, ShotArtInput } from './artStyles'

export interface StagedCast extends CastSlot {
  /** Horizontal place on the 2D panel, 0 to 100. */
  x: number
}

export interface CutsceneShot extends ShotArtInput {
  title: string
  /** The 2D panel caption, read by the player. */
  caption: string
  cast: StagedCast[]
  line?: string
  sfx?: string
  gag?: string
  camera: {
    move:
      | 'static'
      | 'dolly-in'
      | 'dolly-out'
      | 'crane-down'
      | 'whip-pan'
      | 'handheld'
      | 'push-in'
    lensMm: number
    seconds: number
    /** Character animation for the 3D pass, in Larry-style comic acting. */
    animation: string
  }
}

export interface Cutscene {
  id: string
  title: string
  /** Plays when this case flag first appears. Null for the cold open. */
  trigger: string | null
  matureOnly: boolean
  shots: CutsceneShot[]
}

const COLD_OPEN_STAGING: Array<
  Omit<CutsceneShot, 'title' | 'caption'> & {
    matureLine?: string
    matureAnimation?: string
  }
> = [
  {
    id: 'cold-open-1',
    setting:
      'rain-soaked neon Last Call Motor Lodge at night under a MONSTRIQUE: REAWAKENED billboard',
    cast: [
      { character: 'odette', expression: 'scheme', x: 38, living: true },
      { character: 'violet', expression: 'deadpan', x: 62, living: true },
    ],
    action:
      'two women climb the outdoor stairs to Room 205, one in a vampire cape',
    framing: 'wide establishing shot',
    sfx: 'BZZT. The L in LAST CALL burns out.',
    gag: 'The sign now reads AST CALL. It stays that way for the rest of the game.',
    camera: {
      move: 'crane-down',
      lensMm: 24,
      seconds: 7,
      animation:
        'Odette marches ahead waving a room key; Violet adjusts her wig and checks the exits.',
    },
  },
  {
    id: 'cold-open-2',
    setting:
      'Room 205, peeling wallpaper, a mirrored wall, an ice bucket on the nightstand',
    cast: [
      { character: 'odette', expression: 'smirk', x: 35, living: true },
      { character: 'violet', expression: 'smirk', x: 65, living: true },
    ],
    action: 'the ice arrives, the curtains swish shut',
    framing: 'medium two-shot, whip pan to the ice machine',
    sfx: 'CLANK. CLANK.',
    gag: 'Cut away to the ice machine downstairs, shuddering twice like applause.',
    line: 'Violet: You booked the full Countess. Accent costs extra.',
    matureLine:
      'Violet: You booked the full Countess, darling. Bite costs extra.',
    camera: {
      move: 'whip-pan',
      lensMm: 35,
      seconds: 6,
      animation:
        'Violet swirls the cape theatrically and loses a fang into the ice bucket; Odette signs a contract with a flourish; the curtain yanks shut and the camera whips away.',
    },
    matureAnimation:
      'Violet swirls the cape theatrically and loses a fang; Odette tops up the gin; the curtain yanks shut and the camera whips away.',
  },
  {
    id: 'cold-open-3',
    setting:
      'the closed door of Room 205 from inside, a mirror catching a jewelled knife',
    cast: [],
    action:
      'the door never opens; a jewelled prop knife glints and moves on its own',
    framing: 'slow insert close-up on the door, then the knife',
    sfx: 'A thump. Then nothing.',
    gag: 'Silence, then the ice machine clanks once more, apologetically.',
    camera: {
      move: 'dolly-in',
      lensMm: 50,
      seconds: 5,
      animation:
        'No killer on screen. Hold on the door; rack focus to the knife glinting in the mirror; cut to black.',
    },
  },
  {
    id: 'cold-open-4',
    setting:
      'Room 207, The Unwashed Truth field office, a ringing rotary phone at 3 a.m.',
    cast: [
      { character: 'iris', expression: 'smirk', x: 40 },
      { character: 'norb', expression: 'recoil', x: 78 },
    ],
    action: 'Iris answers the phone while Norb recoils from the receiver',
    framing: 'medium shot, handheld',
    line: 'Norb: Do not let that receiver touch your ear. Do you know where it has been?',
    gag: 'Norb disinfects the phone by spraying it from across the room. He misses.',
    camera: {
      move: 'handheld',
      lensMm: 35,
      seconds: 6,
      animation:
        'Iris flops across the bed to grab the phone; Norb springs onto a chair as if the cord were a snake.',
    },
  },
]

function coldOpenScene(audience: MonstriqueAudience): Cutscene {
  const cards = audience === 'mature' ? MATURE_INTRO : GENERAL_INTRO
  return {
    id: 'cold-open',
    title: 'Cold Open',
    trigger: null,
    matureOnly: false,
    shots: COLD_OPEN_STAGING.map(
      ({ matureLine, matureAnimation, ...shot }, index) => ({
        ...shot,
        title: cards[index]?.title ?? '',
        caption: cards[index]?.text ?? '',
        line: audience === 'mature' && matureLine ? matureLine : shot.line,
        camera:
          audience === 'mature' && matureAnimation
            ? { ...shot.camera, animation: matureAnimation }
            : shot.camera,
      }),
    ),
  }
}

export const CUTSCENES: Cutscene[] = [
  {
    id: 'the-client',
    title: 'Your New Client',
    trigger: 'odette-hired-us',
    matureOnly: false,
    shots: [
      {
        id: 'client-1',
        title: 'Retainer',
        caption:
          'Odette fans out sixty years of contracts like a winning hand.',
        setting: 'Room 205 at night, a cracked mirror, two ghosts',
        cast: [
          { character: 'odette', expression: 'scheme', x: 30 },
          { character: 'norb', expression: 'recoil', x: 75 },
        ],
        action: 'a ghost agent waves a contract at a tiny gloved blogger',
        framing: 'medium shot',
        line: 'Odette: My estate pays in blackmail, darling.',
        camera: {
          move: 'push-in',
          lensMm: 40,
          seconds: 5,
          animation:
            'Odette floats in, contracts fanning; Norb leans back so far he nearly tips over.',
        },
      },
      {
        id: 'client-2',
        title: 'Two Metres',
        caption:
          'Norb shakes on it. From two metres. With a pen taped to a broom.',
        setting: 'Room 205 doorway',
        cast: [
          { character: 'norb', expression: 'deduce', x: 70 },
          { character: 'odette', expression: 'annoyed', x: 25 },
          { character: 'iris', expression: 'laugh', x: 48 },
        ],
        action: 'a tiny man accepts a deal at arm’s length plus a broom handle',
        framing: 'wide shot',
        sfx: 'Squeak of latex.',
        gag: 'The ghost’s hand passes straight through the broom. Norb sighs with relief.',
        camera: {
          move: 'static',
          lensMm: 28,
          seconds: 5,
          animation:
            'Norb extends a broom with a pen taped on; Odette’s ghostly hand passes through it; Iris doubles over laughing.',
        },
      },
    ],
  },
  {
    id: 'elbow-deep',
    title: 'Elbow Deep',
    trigger: 'fangs-found',
    matureOnly: false,
    shots: [
      {
        id: 'elbow-1',
        title: 'Free Ice',
        caption:
          'Iris goes in up to the shoulder. The ice machine is not ready for this.',
        setting:
          'the motel ice machine alcove, a glowing ICE sign, a vending machine',
        cast: [
          {
            character: 'iris',
            expression: 'disgust',
            x: 40,
            pose: 'arm deep in the ice machine',
          },
          { character: 'norb', expression: 'recoil', x: 85 },
        ],
        action: 'Iris digs inside a humming ice machine',
        framing: 'medium shot',
        sfx: 'CLANK. CLANK. Squelch.',
        camera: {
          move: 'dolly-in',
          lensMm: 35,
          seconds: 5,
          animation:
            'Iris’s whole arm vanishes into the hatch; ice cubes spill over her boots; Norb backs into the vending machine.',
        },
      },
      {
        id: 'elbow-2',
        title: 'Forty-Dollar Fangs',
        caption:
          'A pair of plastic fangs, a missing ice bucket and a smear of skin-tone foundation.',
        setting: 'the motel ice machine alcove',
        cast: [
          {
            character: 'iris',
            expression: 'smirk',
            x: 45,
            pose: 'holding up plastic fangs triumphantly',
          },
          { character: 'norb', expression: 'shock', x: 82 },
        ],
        action: 'triumphant slow-motion reveal of plastic vampire fangs',
        framing: 'low-angle hero shot',
        line: 'Norb: Do NOT bring that arm anywhere near me.',
        gag: 'Slow-motion hero music, interrupted by Norb gagging.',
        camera: {
          move: 'push-in',
          lensMm: 24,
          seconds: 4,
          animation:
            'Hero slow motion on the fangs, then a smash cut back to real time as Norb gags into his pocket square.',
        },
      },
    ],
  },
  {
    id: 'cold-kiss',
    title: 'A Cold Kiss',
    trigger: 'ghost-kiss',
    matureOnly: true,
    shots: [
      {
        id: 'kiss-1',
        title: 'Paid in Full',
        caption:
          'Fangs back, fee paid. Violet says thank you the way only a ghost can.',
        setting: 'Room 205, lavender ghost light, frost on the mirror',
        cast: [
          { character: 'violet', expression: 'smirk', x: 45 },
          { character: 'iris', expression: 'flirt', x: 58 },
        ],
        action:
          'a ghost in a vampire cape pulls Iris close; frost blooms across the mirror',
        framing: 'romantic medium close-up, tasteful and non-explicit',
        sfx: 'A shiver of wind chimes.',
        camera: {
          move: 'push-in',
          lensMm: 85,
          seconds: 4,
          animation:
            'Violet swirls the cape around them both; frost creeps over the mirror.',
        },
      },
      {
        id: 'kiss-2',
        title: 'Meanwhile, Downstairs',
        caption:
          'Somewhere below, the ice machine clanks twice. It knows what it did.',
        setting: 'the motel ice machine alcove and the second-floor hallway',
        cast: [
          {
            character: 'norb',
            expression: 'annoyed',
            x: 50,
            pose: 'standing in the hallway facing the wall',
          },
        ],
        action:
          'comic cutaway: the ice machine shudders; Norb stands facing the hallway wall',
        framing: 'wide comic cutaway',
        sfx: 'CLANK. CLANK.',
        line: 'Norb: I am facing the wall. I will continue facing the wall. Tell me when it is hygienic.',
        gag: 'The steamy beat cuts away to the ice machine, per house rules.',
        camera: {
          move: 'static',
          lensMm: 24,
          seconds: 4,
          animation:
            'Hold on the ice machine for two clanks, then pan to Norb, nose to the wallpaper, tapping his foot.',
        },
      },
    ],
  },
  {
    id: 'get-the-car',
    title: 'Get the Car',
    trigger: 'city-lead',
    matureOnly: false,
    shots: [
      {
        id: 'car-1',
        title: 'On a Towel',
        caption:
          'The case leaves the motel. Norb rides in the back seat. On a towel. In a shower cap.',
        setting:
          'a battered convertible on a neon Midnight City boulevard in the rain',
        cast: [
          {
            character: 'iris',
            expression: 'laugh',
            x: 35,
            pose: 'driving one-handed',
          },
          {
            character: 'norb',
            expression: 'annoyed',
            x: 70,
            pose: 'sitting rigidly on a towel in the back seat',
          },
        ],
        action:
          'Iris drives through neon rain toward the Monstrique convention',
        framing: 'tracking side shot of the car',
        line: 'Norb: Both hands on the wheel, Iris. The wheel is the only clean thing in this car.',
        gag: 'A billboard of four 1964 Beach Hex stars winks as they pass.',
        camera: {
          move: 'dolly-out',
          lensMm: 32,
          seconds: 6,
          animation:
            'Car bounces over a pothole; Norb’s shower cap flies off; Iris catches it without looking.',
        },
      },
    ],
  },
]

export function coldOpen(audience: MonstriqueAudience): Cutscene {
  return coldOpenScene(audience)
}

export function cutscenesFor(audience: MonstriqueAudience): Cutscene[] {
  return CUTSCENES.filter((scene) => audience === 'mature' || !scene.matureOnly)
}

/** The cutscene a state change just earned, if any. Never replays on load. */
export function cutsceneTriggeredBy(
  previous: CaseState,
  next: CaseState,
  audience: MonstriqueAudience,
): Cutscene | null {
  return (
    cutscenesFor(audience).find(
      (scene) =>
        scene.trigger !== null &&
        next.flags.includes(scene.trigger) &&
        !previous.flags.includes(scene.trigger),
    ) ?? null
  )
}
