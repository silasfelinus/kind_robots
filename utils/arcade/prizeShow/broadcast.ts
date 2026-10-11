// /utils/arcade/prizeShow/broadcast.ts
//
// What makes Prize Show Panic a broadcast (conductor kr-arcade t-028, depth-pass/ASSESSMENT.md
// section 2, "The show"): the host and the co-host and everything they say, their bleep-speak
// voices, the ratings meter and its tiers, cheer chains, the prize tally between episodes and the
// Prize Swap. Pure data and rules; games/prizeShowPanic.ts runs them.
//
// Every line is original writing (no catchphrases from the source) in the arcade's pixel font:
// capitals, digits and . , ! ? - + = : / ( ) ' only. The voices are WebAudio bleeps (no speech
// synthesis, no LLM): one note a syllable, the pitch rising for a ! or a ? and falling for a full
// stop.

import type { Note } from '../sound'
import type { PowerKind } from './arsenal'

// --- the host and the co-host ----------------------------------------------------------------

/** TINSEL hosts every episode; LENS, a dry camera bot, joins from episode 3 (Encore 3 for now). */
export type Voice = 'host' | 'cohost'

export const HOST_NAME = 'TINSEL'
export const COHOST_NAME = 'LENS'

export type Cue =
  | 'room-start'
  | 'big-prize'
  | 'near-miss'
  | 'low-time'
  | 'boss-intro'
  | 'death'
  | 'clear'
  | 'chain'
  | 'no-damage'
  | 'risky-route'
  | 'ticket'
  | 'prime-time'
  | 'off-air'
  | 'wrap'
  | 'game-over'

export const HOST_LINES: Record<Cue, readonly string[]> = {
  'room-start': [
    "LIGHTS UP! LET'S MEET OUR CRASHERS!",
    'BACK FROM THE BREAK, AND LOOK WHO CAME!',
    "THE SET'S DRESSED. NOW GET IT CLEARED!",
    'THE STUDIO IS ALL YOURS, SPARKLE!',
    'CAMERA ONE ON SPARKLE, AND... ACTION!',
    'WARM HANDS, EVERYBODY! HERE THEY COME!',
  ],
  'big-prize': [
    'A NEW CAR! THE CROWD IS ON ITS FEET!',
    'WOULD YOU LOOK AT THAT PRIZE!',
    "SOMEBODY'S GOING HOME HAPPY!",
    "THAT ONE'S GOING ON THE MANTEL!",
  ],
  'near-miss': [
    'OOH! BY A WHISKER!',
    'CLOSE ONE! I FELT THAT IN MY CIRCUITS!',
    'THE CAMERA CREW GASPED!',
    'NOT EVEN A SCRATCH ON THE PAINT!',
  ],
  'low-time': [
    'TEN SECONDS, SPARKLE! FIND A DOOR!',
    'THE CLOCK IS NOT YOUR FRIEND!',
    'HURRY, HURRY, HURRY!',
    'THE DIRECTOR IS WAVING AT ME!',
  ],
  'boss-intro': [
    'HERE COMES THE BIG ATTRACTION!',
    'MAKE SOME NOISE FOR OUR SPECIAL GUEST!',
    "THIS ONE'S BEEN PRACTISING ALL WEEK!",
    "STAND BACK, IT'S PARADE TIME!",
  ],
  death: [
    "OOF! WE'LL FIX THAT IN THE EDIT!",
    'SHAKE IT OFF, THE SHOW GOES ON!',
    'BACK TO YOUR MARK, SPARKLE!',
    'THE AUDIENCE STILL ADORES YOU!',
  ],
  clear: [
    'SET CLEARED! PICK YOUR DOOR!',
    "THAT'S HOW IT'S DONE!",
    'EVERY CRASHER DANCING! BEAUTIFUL!',
    'ROLL THE APPLAUSE!',
  ],
  chain: [
    'LOOK AT THAT CHAIN GO!',
    'COMBO! COMBO! COMBO!',
    "THEY CAN'T STOP DANCING!",
    'KEEP THE PARTY ROLLING!',
  ],
  'no-damage': [
    'NOT A SCUFF! SPOTLESS!',
    'FLAWLESS, LIKE A REHEARSAL!',
    'CLEAN AS A NEW STUDIO FLOOR!',
  ],
  'risky-route': [
    'THE RICH DOOR? BOLD CHOICE!',
    'OOH, GOING FOR THE BIG PRIZES!',
    'THE DANGEROUS ROUTE! WHAT A GAMBLE!',
  ],
  ticket: [
    'A GOLDEN TICKET! KEEP IT SAFE!',
    "THAT'S ONE STEP CLOSER TO THE VAULT!",
    'SHINY! THE SPONSORS WILL BE THRILLED!',
  ],
  'prime-time': [
    "WE'RE IN PRIME TIME, FOLKS!",
    'THE RATINGS ARE THROUGH THE ROOF!',
    'A CARE PACKAGE FROM OUR SPONSORS!',
  ],
  'off-air': [
    'UH OH, VIEWERS ARE CHANGING CHANNELS!',
    'WE NEED A PLOT TWIST, AND FAST!',
    'THE PRODUCER SAYS: SPICE IT UP!',
  ],
  wrap: ["THAT'S A WRAP ON THE EPISODE!", "WHAT A SHOW! LET'S COUNT THE HAUL!"],
  'game-over': [
    "AND THAT'S OUR SHOW! GOODNIGHT!",
    'THANKS FOR PLAYING, SPARKLE!',
  ],
}

/** LENS never gets excited. It answers the host now and then. */
export const COHOST_LINES: readonly string[] = [
  'RATINGS: ADEQUATE.',
  'I SAW THAT. THE CAMERA SAW THAT.',
  'NOTED FOR THE BLOOPER REEL.',
  'TECHNICALLY IMPRESSIVE.',
  "I'VE SEEN BETTER. ONCE.",
  'THAT WAS LOUD.',
  'HM.',
  'CUT TO COMMERCIAL? NO? FINE.',
  'I WILL BE ZOOMING IN ON THAT.',
  'THE LIGHTING WAS OFF, BUT SURE.',
]

/** Lines that would be lifted from the source show, so never ours. */
export const BORROWED_PHRASES: readonly string[] = [
  'BIG MONEY',
  'TOTAL CARNAGE',
  'BUY THAT FOR A DOLLAR',
  "YOU'LL NEED IT",
  'I LOVE IT',
  'GOOD LUCK',
]

/** The episode LENS joins on (Countdown Concert); every encore loop has both voices. */
export const COHOST_FROM_EPISODE = 3

/** A line wrapped into rows of at most `width` characters on word breaks. */
export function wrapLine(text: string, width = 26): string[] {
  const rows: string[] = []
  let row = ''
  for (const word of text.split(' ')) {
    const next = row ? `${row} ${word}` : word
    if (next.length > width && row) {
      rows.push(row)
      row = word
    } else row = next
  }
  if (row) rows.push(row)
  return rows
}

/**
 * Bleep-speak: one short note a syllable (vowel groups), pitched by the letters so the same line
 * always sounds the same, rising at a ! or ? and falling at a full stop. The host is a bright square
 * wave; the co-host a low, flat triangle.
 */
export function bleepSpeak(text: string, voice: Voice): Note[] {
  const syllables = text.toUpperCase().match(/[AEIOUY]+/g) ?? []
  const count = Math.max(1, Math.min(12, syllables.length))
  const host = voice === 'host'
  const base = host ? 520 : 300
  const end = text.trim().slice(-1)
  const lift = end === '!' || end === '?' ? 1.35 : end === '.' ? 0.75 : 1
  const step = host ? 0.075 : 0.095
  const notes: Note[] = []
  for (let i = 0; i < count; i++) {
    const code = text.charCodeAt((i * 7) % text.length) || 65
    const wobble = host
      ? 1 + ((code % 7) - 3) * 0.06
      : 1 + ((code % 3) - 1) * 0.02
    const last = i === count - 1
    const freq = Math.round(base * wobble * (last ? lift : 1))
    notes.push({
      freq,
      to: last
        ? Math.round(freq * (lift > 1 ? 1.15 : lift < 1 ? 0.85 : 1))
        : undefined,
      dur: host ? 0.055 : 0.08,
      type: host ? 'square' : 'triangle',
      vol: host ? 0.035 : 0.05,
      at: i * step,
    })
  }
  return notes
}

// --- the ratings meter -------------------------------------------------------------------------

export type Tier = {
  name: string
  from: number
  multiplier: number
  colour: string
}

/** Four tiers, Off Air to Prime Time; each raises the score multiplier. */
export const TIERS: readonly Tier[] = [
  { name: 'OFF AIR', from: 0, multiplier: 1, colour: '#6b7a99' },
  { name: 'LATE NIGHT', from: 25, multiplier: 1.5, colour: '#7c5cf0' },
  { name: 'DAYTIME', from: 50, multiplier: 2, colour: '#14a3a0' },
  { name: 'PRIME TIME', from: 80, multiplier: 2.5, colour: '#f2b52b' },
]

export function tierOf(ratings: number): number {
  let tier = 0
  TIERS.forEach((t, i) => {
    if (ratings >= t.from) tier = i
  })
  return tier
}

/** How the meter fills (with style) and drains (idle, or hit). */
export const RATINGS = {
  start: 35,
  max: 100,
  cheer: 1.5,
  chainStep: 4,
  nearMiss: 5,
  prize: 3,
  noDamageClear: 15,
  ticket: 10,
  hit: -30,
  /** Lost a tick once Sparkle has gone this long without cheering anyone up. */
  idleAfter: 180,
  idleDrain: 0.06,
  /** Ticks between sponsor care packages at Prime Time, and between plot twists Off Air. */
  packageEvery: 900,
  twistEvery: 1200,
  /** A plot twist waits this long into a room before it may fire. */
  twistGrace: 300,
} as const

// --- cheer chains ----------------------------------------------------------------------------------

/** Cheers this close together build a chain. */
export const CHAIN_WINDOW = 80
/** Every this many in a chain, the multiplier goes up one (to a cap). */
export const CHAIN_STEP = 5
export const CHAIN_CAP = 4

export function chainMultiplier(chain: number): number {
  return Math.min(CHAIN_CAP, 1 + Math.floor(chain / CHAIN_STEP))
}

/** The chains the announcer counts out loud. */
export function chainMilestone(chain: number): boolean {
  return chain >= CHAIN_STEP && chain % CHAIN_STEP === 0
}

// --- the prize tally ----------------------------------------------------------------------------

export type Wallet = { cash: number; toaster: number; car: number }

export function emptyWallet(): Wallet {
  return { cash: 0, toaster: 0, car: 0 }
}

export type TallyIcon =
  | 'cash'
  | 'toaster'
  | 'car'
  | 'ticket'
  | 'ratings'
  | 'chain'
  | 'bonus'
  | 'medal'

export type TallyRow = {
  label: string
  count: number
  /** Points the row pays when it has counted up (prize rows only count: they paid on pickup). */
  points: number
  icon: TallyIcon
}

/** What a golden ticket, each ratings tier reached, and the episode itself pay, per loop. */
export const TALLY_PAY = {
  ticket: 2500,
  tier: 2000,
  episode: 20_000,
  medal: 1500,
}

/** The rows an episode's tally counts up, in order. */
export function tallyRows(
  won: Wallet,
  tickets: number,
  peakTier: number,
  loop: number,
  /** Room medals won this episode (prizeShow/modes.ts): a row only when there are some. */
  medals = 0,
): TallyRow[] {
  return [
    { label: 'CASH', count: won.cash, points: 0, icon: 'cash' },
    { label: 'TOASTERS', count: won.toaster, points: 0, icon: 'toaster' },
    { label: 'NEW CARS', count: won.car, points: 0, icon: 'car' },
    {
      label: 'GOLDEN TICKETS',
      count: tickets,
      points: tickets * TALLY_PAY.ticket * loop,
      icon: 'ticket',
    },
    {
      label: `PEAK ${TIERS[peakTier]!.name}`,
      count: peakTier + 1,
      points: (peakTier + 1) * TALLY_PAY.tier * loop,
      icon: 'ratings',
    },
    ...(medals > 0
      ? [
          {
            label: 'ROOM MEDALS',
            count: medals,
            points: medals * TALLY_PAY.medal * loop,
            icon: 'medal' as const,
          },
        ]
      : []),
    {
      label: 'EPISODE BONUS',
      count: 1,
      points: TALLY_PAY.episode * loop,
      icon: 'bonus',
    },
  ]
}

/** The season's haul, for the game-over screen: counted the same way, nothing more to pay. */
export function seasonRows(
  won: Wallet,
  tickets: number,
  bestChain: number,
): TallyRow[] {
  return [
    { label: 'CASH', count: won.cash, points: 0, icon: 'cash' },
    { label: 'TOASTERS', count: won.toaster, points: 0, icon: 'toaster' },
    { label: 'NEW CARS', count: won.car, points: 0, icon: 'car' },
    { label: 'GOLDEN TICKETS', count: tickets, points: 0, icon: 'ticket' },
    { label: 'BEST CHAIN', count: bestChain, points: 0, icon: 'chain' },
  ]
}

// --- the Prize Swap ------------------------------------------------------------------------------

export type SwapId = 'contestant' | 'power' | 'clock' | 'secret'

export type SwapOffer = {
  id: SwapId
  title: string
  blurb: string
  cost: { cash?: number; toaster?: number; car?: number; ticket?: number }
}

/** What the prizes trade for between episodes (in-game prizes only, never real money). */
export const SWAP_OFFERS: readonly SwapOffer[] = [
  {
    id: 'contestant',
    title: 'EXTRA CONTESTANT',
    blurb: 'ONE MORE TRY',
    cost: { car: 1 },
  },
  {
    id: 'power',
    title: 'STARTING POWER-UP',
    blurb: 'OPEN THE EPISODE ARMED',
    cost: { toaster: 1 },
  },
  {
    id: 'clock',
    title: '+5 SECONDS',
    blurb: 'ON EVERY CLOCK NEXT EPISODE',
    cost: { cash: 2 },
  },
  {
    id: 'secret',
    title: 'REVEAL A SECRET',
    blurb: 'A CRACKED WALL, OPENED',
    cost: { ticket: 1 },
  },
]

/** Most extra seconds the cash can buy for one episode. */
export const CLOCK_BONUS_CAP = 15

export function affordable(
  offer: SwapOffer,
  wallet: Wallet,
  tickets: number,
): boolean {
  return (
    (offer.cost.cash ?? 0) <= wallet.cash &&
    (offer.cost.toaster ?? 0) <= wallet.toaster &&
    (offer.cost.car ?? 0) <= wallet.car &&
    (offer.cost.ticket ?? 0) <= tickets
  )
}

/** The power-ups a toaster can start an episode with. */
export const STARTING_POWERS: readonly PowerKind[] = [
  'shield',
  'spread',
  'orbiters',
  'rockets',
  'skates',
]
