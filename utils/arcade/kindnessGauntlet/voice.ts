// /utils/arcade/kindnessGauntlet/voice.ts
//
// The Mainframe's voice (conductor kr-arcade t-051, depth-pass/CABINETS.md section 5, "Systems that
// run through the whole descent"): the Old Mainframe, a kindly machine who ran the city for decades,
// watches the bots from a little portrait at the screen's edge and comments on everything. Short
// original lines in the arcade's pixel font, spoken in bleeps (WebAudio pitch patterns: no speech
// synthesis, no runtime LLM). {BOT} is the bot the line is about.

import type { Note } from '../sound'
import { INK, RAMPS, pixelSprite } from '../snes'

export type VoiceCue =
  | 'floor'
  | 'low'
  | 'flat'
  | 'revive'
  | 'share'
  | 'snack-sparked'
  | 'token-taken'
  | 'token-passed'
  | 'token-dropped'
  | 'overload'
  | 'key-near'
  | 'key-stolen'
  | 'pulse-stolen'
  | 'charge-stolen'
  | 'loot-back'
  | 'escaped'
  | 'digested'
  | 'mimic'
  | 'spill-dry'
  | 'swarm'
  | 'new-glitch'
  | 'generator'
  | 'stairs'
  | 'game-over'
  | 'note'
  | 'guardian'
  | 'secret'
  | 'charm'
  | 'chip'
  | 'lost'
  | 'lift'
  | 'stun'
  | 'bluescreen'
  | 'fake'
  | 'trap'
  | 'cloud'
  | 'helper'
  | 'memory'
  | 'dance'

/** Higher cues cut in over lower ones; equal or lower ones wait their turn or are dropped. */
export const CUE_PRIORITY: Record<VoiceCue, number> = {
  floor: 1,
  generator: 1,
  share: 1,
  'spill-dry': 1,
  'key-near': 2,
  swarm: 2,
  mimic: 2,
  'snack-sparked': 2,
  'token-taken': 2,
  'token-passed': 2,
  'token-dropped': 2,
  'new-glitch': 3,
  overload: 3,
  'charge-stolen': 3,
  'loot-back': 3,
  digested: 3,
  low: 3,
  revive: 3,
  'key-stolen': 4,
  'pulse-stolen': 4,
  escaped: 4,
  stairs: 4,
  flat: 5,
  'game-over': 6,
  note: 2,
  stun: 2,
  charm: 3,
  chip: 3,
  lift: 4,
  lost: 4,
  secret: 5,
  bluescreen: 5,
  guardian: 5,
  fake: 3,
  trap: 3,
  cloud: 2,
  helper: 2,
  memory: 6,
  dance: 2,
}

export const VOICE_LINES: Record<VoiceCue, readonly string[]> = {
  floor: [
    'MIND THE RACKS, LITTLE ONES.',
    'MY MEMORY IS FUZZY DOWN HERE.',
    'THIS FLOOR NEEDS A FRIEND.',
    'I REMEMBER THIS ROOM. SORT OF.',
  ],
  low: ['{BOT} IS RUNNING LOW!', '{BOT} NEEDS A SNACK!', 'CHARGE UP, {BOT}!'],
  flat: ['{BOT} IS FLAT! ROLL OVER AND SHARE.', '{BOT} NEEDS A FRIEND!'],
  revive: ['{BOT} IS BACK UP!', 'THAT IS THE SPIRIT, {BOT}!'],
  share: [
    'SHARING IS CARING.',
    'WHAT A KIND SPARK.',
    'A LITTLE CHARGE GOES FAR.',
  ],
  'snack-sparked': [
    "DON'T SPARK THE SNACKS!",
    'THAT WAS A PERFECTLY GOOD SNACK.',
    'OH, THE CRUMBS!',
  ],
  'token-taken': ['{BOT} HAS THE TOKEN!', 'EVERY GLITCH WANTS {BOT} NOW!'],
  'token-passed': ['{BOT} HAS THE TOKEN!', 'A HUG FOR {BOT}!'],
  'token-dropped': ['THE TOKEN IS LOOSE!'],
  overload: ['OVERLOADED! WHAT A HUG.', 'TOO MUCH LOVE FOR ONE MACHINE!'],
  'key-near': ['A KEY IS NEAR.', 'I SEE A KEY!'],
  'key-stolen': [
    'THE PICKPOCKET HAS YOUR KEY!',
    'STOP THAT THIEF! IT HAS A KEY!',
  ],
  'pulse-stolen': ['A PICKPOCKET TOOK A PULSE!'],
  'charge-stolen': ["A LEECH TOOK {BOT}'S CHARGE!", 'SPARK THAT LEECH, {BOT}!'],
  'loot-back': ['GOT IT BACK!', 'FINDERS KEEPERS.'],
  escaped: ['IT GOT AWAY DOWN THE STAIRS.', 'OH NO, IT SLIPPED OFF!'],
  digested: ['THE LEECH ATE THE CHARGE. BURP.'],
  mimic: ['THAT SNACK BIT BACK!', 'NOT EVERY SNACK IS A SNACK.'],
  'spill-dry': ['ALL DRIED UP.', 'MOP AND GO!'],
  swarm: ['BUGS! SO MANY BUGS!', 'HEAR THAT BUZZING?'],
  'new-glitch': ['SOMETHING NEW IS DOWN HERE.'],
  generator: ['ONE LESS GENERATOR.', 'THAT ONE IS QUIET NOW.', 'NICE WORK.'],
  stairs: ['DOWN WE GO!', 'DEEPER INTO MY MEMORY...'],
  'game-over': ['REST NOW, LITTLE BOTS.', 'I WILL KEEP YOUR SEATS WARM.'],
  note: ['READ THE NOTE.'],
  guardian: ['IT REMEMBERS WHO IT IS!', 'THANK YOU. IT IS QUIET NOW.'],
  secret: ['{BOT} FOUND A SECRET!', 'OH! I HAD FORGOTTEN THAT ONE.'],
  charm: ['{BOT} HAS A CHARM!'],
  chip: ['{BOT} IS GETTING STRONGER!', 'A CHIP FOR {BOT}!'],
  lost: ["TIME'S UP! THE BINS ARE CLOSING."],
  lift: ['EXPRESS LIFT! HOLD ON TIGHT.'],
  stun: ['MIND THE STATIC MATS!', 'ZAP! {BOT} IS STUNNED.'],
  bluescreen: ['THE SCREEN IS CLEAR AGAIN!', 'BLUE NO MORE!'],
  fake: ['THOSE STAIRS WERE PAINTED ON!', 'MADE YOU LOOK!'],
  trap: ['SOMETHING OPENED SOMEWHERE.', 'A WALL JUST LIFTED!'],
  cloud: ['MIND THE CLOUDS, THEY COME AND GO.'],
  helper: ['IT WANTS TO HELP {BOT} NOW!', 'A NEW FRIEND FOR {BOT}!'],
  memory: ['I REMEMBER!'],
  dance: ['STAY OFF THE LIT TILES!', '{BOT} MISSED THE BEAT!'],
}

/** What the Old Mainframe remembers as each wing's Memory Card comes home. */
export const MEMORY_LINES: readonly string[] = [
  'I REMEMBER MY FIRST PUNCH CARD!',
  'I REMEMBER THE TAPES SPINNING ALL NIGHT.',
  'I REMEMBER THE KIDS AND THEIR HIGH SCORES.',
  'I REMEMBER THE SKY THROUGH THE SKYLIGHT.',
  'I REMEMBER... EVERYTHING.',
]

/** Fill in the bot's name. */
export function voiceLine(cue: VoiceCue, index: number, bot = ''): string {
  const lines = VOICE_LINES[cue]
  return lines[index % lines.length]!.replace(/\{BOT\}/g, bot)
}

/**
 * The Mainframe's bleep-speak: one note a syllable, low and warm, with a little tape wobble; the
 * pitch rises for a ! or a ? and falls for a full stop.
 */
export function mainframeBleeps(text: string): Note[] {
  const syllables = text.toUpperCase().match(/[AEIOUY]+/g) ?? []
  const count = Math.max(1, Math.min(10, syllables.length))
  const end = text.trim().slice(-1)
  const lift = end === '!' || end === '?' ? 1.3 : end === '.' ? 0.8 : 1
  const notes: Note[] = []
  for (let i = 0; i < count; i++) {
    const code = text.charCodeAt((i * 5) % text.length) || 65
    const wobble = 1 + ((code % 5) - 2) * 0.045
    const last = i === count - 1
    const freq = Math.round(330 * wobble * (last ? lift : 1))
    notes.push({
      freq,
      to: Math.round(
        freq * (last ? (lift > 1 ? 1.12 : lift < 1 ? 0.88 : 1) : 0.97),
      ),
      dur: 0.07,
      type: 'triangle',
      vol: 0.05,
      at: i * 0.085,
    })
  }
  return notes
}

/** The Mainframe's face: a beige console with tape reels for eyes and a speaker grille mouth. */
const FACE = {
  o: RAMPS.cream[1],
  c: RAMPS.cream[2],
  C: RAMPS.cream[3],
  h: RAMPS.cream[4],
  k: INK,
  r: RAMPS.steel[3],
  R: RAMPS.steel[4],
  g: RAMPS.leaf[3],
  m: RAMPS.night[1],
  p: RAMPS.pink[3],
}
const FACE_TOP = [
  '.hhhhhhhhhhhhhh.',
  'hCCCCCCCCCCCCCCo',
  'hCkkkkCCCCkkkkCo',
  'hkrRrrkCCkrRrrko',
  'hkRkkRkCCkRkkRko',
  'hkrRrrkCCkrRrrko',
  'hCkkkkCCCCkkkkCo',
  'hCCpCCCCCCCCpCCo',
]
const FACE_BOTTOM_SHUT = [
  'hCCCCmmmmmmCCCCo',
  'hCCCCCCCCCCCCCCo',
  'hcgcCCCCCCCCcgco',
  '.oooooooooooooo.',
]
const FACE_BOTTOM_OPEN = [
  'hCCCmkkkkkkmCCCo',
  'hCCCCmmmmmmCCCCo',
  'hcgcCCCCCCCCcgco',
  '.oooooooooooooo.',
]
export const MAINFRAME_FACE = [
  pixelSprite([...FACE_TOP, ...FACE_BOTTOM_SHUT], FACE),
  pixelSprite([...FACE_TOP, ...FACE_BOTTOM_OPEN], FACE),
]
