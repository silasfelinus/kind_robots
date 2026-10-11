// /utils/arcade/sinkSuds/pests.ts
//
// Sink Suds' pests as data (conductor kr-arcade/t-043). Each pest has a tell
// and an answer, and what it does to the bubble on contact:
//
//   hit     pops a small bubble (stage 1-2); a bigger one splashes and shrinks
//           two stages instead (growth is health);
//   soak    soaks up suds: shrinks the bubble one stage, never pops it;
//   deadly  always pops (the skaters).
//
// The soap shot traps any pest marked trappable; a trapped pest drifts to the
// drain for TRAP_POINTS x the chain it was caught on.

export type PestKind =
  'mite' | 'brush' | 'sponge' | 'gremlin' | 'slug' | 'loofah' | 'minibrush'

export type Touch = 'hit' | 'soak' | 'deadly'

export type PestRule = {
  name: string
  /** Contact radius in logical pixels. */
  radius: number
  touch: Touch
  /** The bubble eats it from this stage up. */
  edibleFrom?: number
  /** Points for eating it (or tipping it, for a brush). */
  points: number
  trappable: boolean
  /** It scrubs grime within this radius as it goes (0: it does not clean). */
  cleans: number
  /** It eats crumbs and grease, racing the bubble for food. */
  eatsMess: boolean
  /** A trapped one pays this many times the usual trap points. */
  trapBonus?: number
  /** Left out of the table guide (a boss's spawn). */
  hidden?: boolean
  /** What warns you, and what to do about it (the table guide). */
  tell: string
  answer: string
}

export const PESTS: Record<PestKind, PestRule> = {
  mite: {
    name: 'RUST MITE',
    radius: 4,
    touch: 'hit',
    edibleFrom: 3,
    points: 100,
    trappable: true,
    cleans: 0,
    eatsMess: false,
    tell: 'SMALL AND SCUTTLING',
    answer: 'DODGE IT SMALL, EAT IT FROM SIZE 3',
  },
  brush: {
    name: 'SCRUB BRUSH',
    radius: 10,
    touch: 'hit',
    points: 500,
    trappable: true,
    cleans: 11,
    eatsMess: true,
    tell: 'HUNTS WHEN YOU ARE CLOSE',
    answer: 'FULL SIZE: BUMP IT FROM BEHIND',
  },
  sponge: {
    name: 'SPONGE',
    radius: 10,
    touch: 'soak',
    points: 0,
    trappable: true,
    cleans: 12,
    eatsMess: true,
    tell: 'FAT AND POROUS',
    answer: 'KEEP AWAY OR TRAP IT IN SOAP',
  },
  gremlin: {
    name: 'DRAIN GREMLIN',
    radius: 7,
    touch: 'hit',
    points: 0,
    trappable: true,
    cleans: 0,
    eatsMess: false,
    tell: 'THE DRAIN GURGLES FIRST',
    answer: 'DO NOT LOITER OVER THE DRAIN',
  },
  slug: {
    name: 'SCUM SLUG',
    radius: 6,
    touch: 'hit',
    edibleFrom: 4,
    points: 150,
    trappable: true,
    cleans: 0,
    eatsMess: false,
    tell: 'A STICKY TRAIL',
    answer: 'DO NOT CROSS THE TRAIL',
  },
  loofah: {
    name: 'LOOFAH',
    radius: 15,
    touch: 'soak',
    points: 0,
    trappable: true,
    trapBonus: 3,
    cleans: 15,
    eatsMess: true,
    tell: 'BIG AND SLOW',
    answer: 'GO ROUND, OR TRAP IT FOR X3',
  },
  minibrush: {
    name: 'MINI BRUSH',
    radius: 6,
    touch: 'hit',
    edibleFrom: 5,
    points: 200,
    trappable: true,
    cleans: 6,
    eatsMess: true,
    hidden: true,
    tell: 'SHED BY THE BIG BRUSH',
    answer: 'A FULL BUBBLE SWALLOWS THEM',
  },
}

/** A scum slug's trail stays sticky this long. */
export const TRAIL_TICKS = 60 * 7
/** Velocity kept each tick while the bubble is stuck in slug trail. */
export const TRAIL_DRAG = 0.86

/** Base points for a trapped pest reaching the drain, times the chain it was caught on. */
export const TRAP_POINTS = 300
/** A tipped brush lies stunned this long (4 s). */
export const TIP_TICKS = 60 * 4
/** The brush turns this fast (rad/tick), slowly enough to get behind it. */
export const BRUSH_TURN = 0.045
/** Ticks the drain gurgles before the gremlin pops out. */
export const GURGLE_TICKS = 80
/** Ticks the gremlin darts about before it heads home. */
export const GREMLIN_OUT = 60 * 5
