/**
 * Save the Plumber's painted heroine roster (Silas, 2026-10-14: "multiple
 * heroines, with notable differences in body type, ethnicity, etc"). The run
 * seed picks one of eight; every heroine shares HEROINE_HITBOX and the same
 * abilities. `look` drives the code-drawn fallbacks so they match the art.
 */
import { PLUMBER_ART } from './savePlumberArt'
import { rollHeroineSeed, type Heroine } from './savePlumberHeroine'

export type ActionPoses = {
  idle: number
  land: number
  rise: number
  fall: number
}

export type RosterHeroine = {
  key: string
  name: string
  build: string
  signature: string
  /** Sprite height relative to Pip; the hitbox never changes. */
  scale: number
  look: Omit<Heroine, 'seed' | 'name' | 'roster'>
  run: string
  actions: string
  poses?: Partial<ActionPoses>
}

export const DEFAULT_ACTION_POSES: ActionPoses = {
  idle: 0,
  land: 1,
  rise: 2,
  fall: 3,
}

export const PLUMBER_ROSTER: readonly RosterHeroine[] = [
  {
    key: 'marisol',
    name: 'Marisol',
    build: 'Slim and athletic',
    signature: 'Big curls and a coral bandana',
    scale: 1,
    look: {
      skin: '#8a5636',
      skinShade: '#6e4128',
      hair: '#1f1a1c',
      hairStyle: 'curls',
      outfit: '#1f9aa2',
      shirt: '#fff4dc',
      scarf: '#f2786a',
      boots: '#b8322c',
    },
    run: PLUMBER_ART.anim('heroine-marisol-run-v3'),
    actions: PLUMBER_ART.anim('heroine-marisol-actions'),
  },
  {
    key: 'pip',
    name: 'Pip',
    build: 'Small and quick',
    signature: 'Freckles and a magenta bob',
    scale: 1,
    look: {
      skin: '#fbd9c0',
      skinShade: '#e9b897',
      hair: '#d9468f',
      hairStyle: 'bob',
      outfit: '#e3a92f',
      shirt: '#e6dcf5',
      scarf: '#ffffff',
      boots: '#2f3b5a',
    },
    run: PLUMBER_ART.anim('heroine-b-run'),
    actions: PLUMBER_ART.anim('heroine-b-actions'),
  },
  {
    key: 'tala',
    name: 'Tala',
    build: 'Tall, broad and strong',
    signature: 'A thick braid with a hibiscus clip',
    scale: 1.08,
    look: {
      skin: '#c98e64',
      skinShade: '#a9714b',
      hair: '#1f1a1c',
      hairStyle: 'braids',
      outfit: '#f2c230',
      shirt: '#ffffff',
      scarf: '#2ec4c0',
      boots: '#6b3b2a',
    },
    run: PLUMBER_ART.anim('heroine-tala-run'),
    actions: PLUMBER_ART.anim('heroine-tala-actions'),
  },
  {
    key: 'jiwoo',
    name: 'Ji-woo',
    build: 'Short, stocky and powerful',
    signature: 'A teal-topped undercut',
    scale: 0.9,
    look: {
      skin: '#f1c4a0',
      skinShade: '#dba37d',
      hair: '#2bb5b0',
      hairStyle: 'pixie',
      outfit: '#ff7a1a',
      shirt: '#ffb070',
      scarf: '#3a3a44',
      boots: '#1f1d24',
    },
    run: PLUMBER_ART.anim('heroine-jiwoo-run'),
    actions: PLUMBER_ART.anim('heroine-jiwoo-actions'),
  },
  {
    key: 'odette',
    name: 'Odette',
    build: 'Sixty-something and spry',
    signature: 'Silver locs and gold glasses',
    scale: 0.96,
    look: {
      skin: '#4e2c1c',
      skinShade: '#3b1f13',
      hair: '#c9c4bd',
      hairStyle: 'bun',
      outfit: '#4f74b8',
      shirt: '#7a3f72',
      scarf: '#e3a92f',
      boots: '#5fae6a',
    },
    run: PLUMBER_ART.anim('heroine-odette-run'),
    actions: PLUMBER_ART.anim('heroine-odette-actions'),
  },
  {
    key: 'hodan',
    name: 'Hodan',
    build: 'Very tall and long-limbed',
    signature: 'A sporty teal hijab',
    scale: 1.12,
    look: {
      skin: '#6b3f27',
      skinShade: '#55301c',
      hair: '#2bb5b0',
      hairStyle: 'bob',
      outfit: '#6b7a3a',
      shirt: '#e8705f',
      scarf: '#fff4dc',
      boots: '#f4f4f4',
    },
    run: PLUMBER_ART.anim('heroine-hodan-run'),
    actions: PLUMBER_ART.anim('heroine-hodan-actions'),
  },
  {
    key: 'priya',
    name: 'Priya',
    build: 'Short and curvy',
    signature: 'A long braid and a gold nose stud',
    scale: 0.92,
    look: {
      skin: '#a86e48',
      skinShade: '#8b5637',
      hair: '#1f1a1c',
      hairStyle: 'ponytail',
      outfit: '#7a2f3f',
      shirt: '#f4a32a',
      scarf: '#ef5da8',
      boots: '#c49a6c',
    },
    run: PLUMBER_ART.anim('heroine-priya-run'),
    actions: PLUMBER_ART.anim('heroine-priya-actions'),
  },
  {
    key: 'nova',
    name: 'Nova',
    build: 'Lean and wiry',
    signature: 'Twin braids and a running blade',
    scale: 1.02,
    look: {
      skin: '#b8774a',
      skinShade: '#97603a',
      hair: '#1f1a1c',
      hairStyle: 'braids',
      outfit: '#4a6f9e',
      shirt: '#2f6b45',
      scarf: '#d8352a',
      boots: '#6b3b2a',
    },
    run: PLUMBER_ART.anim('heroine-nova-run'),
    actions: PLUMBER_ART.anim('heroine-nova-actions'),
  },
]

export function rosterIndex(seed: number): number {
  return (seed >>> 0) % PLUMBER_ROSTER.length
}

export function rosterFor(
  heroine: Pick<Heroine, 'seed' | 'roster'>,
): RosterHeroine {
  return (
    PLUMBER_ROSTER.find((r) => r.key === heroine.roster) ??
    PLUMBER_ROSTER[rosterIndex(heroine.seed)]!
  )
}

/** The run's heroine: the seed picks a roster member; looks are cosmetic. */
export function rosterHeroine(seed: number): Heroine {
  const member = PLUMBER_ROSTER[rosterIndex(seed)]!
  return {
    seed: seed >>> 0,
    name: member.name,
    roster: member.key,
    ...member.look,
  }
}

/** A fresh seed that lands on roster member `index`. */
export function seedForRoster(
  index: number,
  random: () => number = Math.random,
): number {
  const size = PLUMBER_ROSTER.length
  const slot = ((Math.floor(index) % size) + size) % size
  const base = rollHeroineSeed(random)
  return (base - (base % size) + slot) >>> 0
}

export function rosterPortrait(member: RosterHeroine): string {
  return PLUMBER_ART.cast(`heroine-${member.key}`)
}

export function actionPoses(member: RosterHeroine): ActionPoses {
  return { ...DEFAULT_ACTION_POSES, ...member.poses }
}
