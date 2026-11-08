// Clash evolution DSL (Silas, 2026-11-08 PT): "We want custom evolution steps
// on all cards ... not just stat improvements but real gameplay decisions and
// new interactions, including stage special effects. Level threes should feel
// like something cool is happening no matter what." Inspirations: classic
// Solforge (cards that transform as you play them) and Hearthstone (themes
// leaned into, big fun moments).
//
// Each card's level-2 and level-3 stages are DATA: a stage name plus abilities
// (a trigger and a list of actions) and optional static rules. One interpreter
// in clash.ts runs them at fixed engine hooks, and the rules text on the card
// is generated from the same data here, so the text can never promise
// something the code does not do. No imports from clash.ts (no cycles).
import type { Keyword } from '../prototypes'

/** When an ability fires. Creatures and equipped fighters use all of these;
 * spells and gear use 'enter' (on cast / on install); traps use 'spring'. */
export type EvoTrigger =
  | 'enter'
  | 'hit'
  | 'kill'
  | 'boss'
  | 'strike'
  | 'death'
  | 'roundEnd'
  | 'turnStart'
  | 'spring'

/** Who an action touches, relative to the source's side and alley. */
export type EvoScope =
  | 'self'
  | 'target'
  | 'across'
  | 'adjacentAllies'
  | 'allies'
  | 'otherAllies'
  | 'adjacentFoes'
  | 'laneFoes'
  | 'allFoes'
  | 'randomFoe'
  | 'weakestFoe'
  | 'strongestFoe'
  | 'woundedAlly'

export type EvoSummonWhere = 'neighbors' | 'nearest' | 'everyEmpty'

export type EvoAction =
  | { do: 'damage'; n: number; to: EvoScope; pierce?: boolean }
  | { do: 'heal'; n: number; to: EvoScope }
  /** +power this round (surge), or for good when `lasting`. */
  | { do: 'power'; n: number; to: EvoScope; lasting?: boolean }
  /** +max life and life, for good. */
  | { do: 'life'; n: number; to: EvoScope }
  /** +armor for good, capped at 3. */
  | { do: 'armor'; n: number; to: EvoScope }
  /** Extra armor until the owner's next turn. */
  | { do: 'guard'; n: number; to: EvoScope }
  | { do: 'stun'; to: EvoScope }
  | { do: 'cleanse'; to: EvoScope }
  | { do: 'grant'; keyword: Keyword; to: EvoScope }
  | {
      do: 'summon'
      where: EvoSummonWhere
      attack: number
      hp: number
      keywords?: Keyword[]
    }
  /** The rival boss loses n. */
  | { do: 'boss'; n: number }
  /** Your boss heals n (up to its cap). */
  | { do: 'mend'; n: number }
  | { do: 'draw'; n: number }
  /** A seeded gamble: `p` percent chance to run `then`. */
  | { do: 'chance'; p: number; then: EvoAction[] }

export interface EvoAbility {
  when: EvoTrigger
  do: EvoAction[]
  /** Fires at most once per fighter (or once per cast). */
  once?: boolean
}

/** Rules that hold while the fighter (or the equipped fighter) stands. */
export interface EvoStatic {
  /** Never strikes (its power is 0); it lives to support. */
  pacifist?: boolean
  /** Friends in reach strike harder. */
  aura?: { n: number; to: 'adjacentAllies' | 'otherAllies' }
  /** Rivals in reach strike softer. */
  hex?: { n: number; to: 'across' | 'laneFoes' }
  /** +n power while it has a friend next door. */
  pack?: number
  /** +n power while it stands with no friend next door. */
  lone?: number
  /** +n power against a stunned blocker. */
  bully?: number
}

export interface EvoStage {
  /** The stage's name, shown with its level: flavor first. */
  title: string
  abilities: EvoAbility[]
  static?: EvoStatic
}

export interface CardEvolution {
  /** The name the card wears at level 1 (usually its own name). */
  base?: string
  2: EvoStage
  3: EvoStage
}

// ---------------------------------------------------------------- builders
export const on = (when: EvoTrigger, ...actions: EvoAction[]): EvoAbility => ({
  when,
  do: actions,
})
export const once = (
  when: EvoTrigger,
  ...actions: EvoAction[]
): EvoAbility => ({ when, do: actions, once: true })
export const stage = (
  title: string,
  abilities: EvoAbility[],
  rules?: EvoStatic,
): EvoStage =>
  rules ? { title, abilities, static: rules } : { title, abilities }
export const damage = (n: number, to: EvoScope, pierce = false): EvoAction =>
  pierce ? { do: 'damage', n, to, pierce } : { do: 'damage', n, to }
export const heal = (n: number, to: EvoScope): EvoAction => ({
  do: 'heal',
  n,
  to,
})
export const power = (n: number, to: EvoScope): EvoAction => ({
  do: 'power',
  n,
  to,
})
export const sharpen = (n: number, to: EvoScope): EvoAction => ({
  do: 'power',
  n,
  to,
  lasting: true,
})
export const life = (n: number, to: EvoScope): EvoAction => ({
  do: 'life',
  n,
  to,
})
export const armor = (n: number, to: EvoScope): EvoAction => ({
  do: 'armor',
  n,
  to,
})
export const guard = (n: number, to: EvoScope): EvoAction => ({
  do: 'guard',
  n,
  to,
})
export const stun = (to: EvoScope): EvoAction => ({ do: 'stun', to })
export const cleanse = (to: EvoScope): EvoAction => ({ do: 'cleanse', to })
export const grant = (keyword: Keyword, to: EvoScope): EvoAction => ({
  do: 'grant',
  keyword,
  to,
})
export const summon = (
  where: EvoSummonWhere,
  attack: number,
  hp: number,
  keywords: Keyword[] = [],
): EvoAction =>
  keywords.length
    ? { do: 'summon', where, attack, hp, keywords }
    : { do: 'summon', where, attack, hp }
export const boss = (n: number): EvoAction => ({ do: 'boss', n })
export const mend = (n: number): EvoAction => ({ do: 'mend', n })
export const draw = (n: number): EvoAction => ({ do: 'draw', n })
export const chance = (p: number, ...then: EvoAction[]): EvoAction => ({
  do: 'chance',
  p,
  then,
})

// ------------------------------------------------------------------- text
const PLURAL: EvoScope[] = ['adjacentAllies', 'adjacentFoes', 'laneFoes']
const WHO: Record<EvoScope, string> = {
  self: 'itself',
  target: 'the target',
  across: 'the rival across',
  adjacentAllies: 'neighboring friends',
  allies: 'every friendly fighter',
  otherAllies: 'every other friendly fighter',
  adjacentFoes: 'neighboring rivals',
  laneFoes: 'the rival across and its neighbors',
  allFoes: 'every rival fighter',
  randomFoe: 'a random rival fighter',
  weakestFoe: 'the weakest rival fighter',
  strongestFoe: 'the strongest rival fighter',
  woundedAlly: 'your most wounded fighter',
}
const WHERE: Record<EvoSummonWhere, string> = {
  neighbors: 'in each empty neighboring alley',
  nearest: 'in the nearest empty alley',
  everyEmpty: 'in every empty alley on your side',
}
const KEYWORD: Record<Keyword, string> = {
  ambush: 'AMBUSH',
  regen: 'REGEN',
  swarm: 'SWARM',
  leech: 'LEECH',
  bulldoze: 'BULLDOZE',
  volatile: 'VOLATILE',
  pierce: 'PIERCE',
  snare: 'SNARE',
  collect: 'COLLECT',
}
export function evoActionText(a: EvoAction, subject: 'it' | 'self'): string {
  const who = (to: EvoScope) =>
    to === 'self' ? (subject === 'it' ? 'it' : 'this fighter') : WHO[to]
  const gain = (to: EvoScope) => (PLURAL.includes(to) ? ' gain' : ' gains')
  switch (a.do) {
    case 'damage':
      return (
        'deal ' +
        a.n +
        ' to ' +
        who(a.to) +
        (a.pierce ? ', ignoring armor' : '')
      )
    case 'heal':
      return 'heal ' + who(a.to) + ' for ' + a.n
    case 'power':
      return (
        who(a.to) +
        gain(a.to) +
        ' +' +
        a.n +
        ' power' +
        (a.lasting ? ' for good' : ' this round')
      )
    case 'life':
      return who(a.to) + gain(a.to) + ' +' + a.n + ' life'
    case 'armor':
      return who(a.to) + gain(a.to) + ' +' + a.n + ' armor'
    case 'guard':
      return who(a.to) + gain(a.to) + ' +' + a.n + ' armor until your next turn'
    case 'stun':
      return 'stun ' + who(a.to)
    case 'cleanse':
      return 'free ' + who(a.to) + ' from stuns'
    case 'grant':
      return who(a.to) + gain(a.to) + ' ' + KEYWORD[a.keyword]
    case 'summon':
      return (
        'summon a ' +
        a.attack +
        '/' +
        a.hp +
        (a.keywords?.length
          ? ' ' + a.keywords.map((k) => KEYWORD[k]).join(' ')
          : '') +
        ' echo ' +
        WHERE[a.where]
      )
    case 'boss':
      return 'the rival boss loses ' + a.n
    case 'mend':
      return 'your boss heals ' + a.n
    case 'draw':
      return 'draw ' + (a.n === 1 ? 'a card' : a.n + ' cards')
    case 'chance':
      return (
        a.p +
        '% chance to ' +
        a.then.map((x) => evoActionText(x, subject)).join(' and ')
      )
  }
}
const WHEN: Record<EvoTrigger, string> = {
  enter: 'On entry',
  hit: 'When it damages a fighter',
  kill: 'When it knocks out a fighter',
  boss: 'When it hits the rival boss',
  strike: 'After it strikes',
  death: 'When it falls',
  roundEnd: 'At round end',
  turnStart: 'At the start of your turn',
  spring: 'When sprung',
}
type Kind = 'creature' | 'spell' | 'trap' | 'equipment'
function abilityText(ab: EvoAbility, kind: Kind): string {
  const subject = kind === 'creature' ? 'it' : 'self'
  const body = ab.do.map((a) => evoActionText(a, subject)).join(', then ')
  let lead: string
  if (kind === 'spell' && ab.when === 'enter') lead = 'Also'
  else if (kind === 'trap' && ab.when === 'spring') lead = 'When sprung'
  else if (kind === 'equipment')
    lead =
      ab.when === 'enter'
        ? 'On install'
        : WHEN[ab.when].replace(' it ', ' the wearer ')
  else lead = WHEN[ab.when]
  return lead + (ab.once ? ' (once)' : '') + ': ' + body + '.'
}
function staticText(r: EvoStatic, kind: Kind): string[] {
  const who = kind === 'equipment' ? 'The wearer' : 'It'
  const out: string[] = []
  if (r.pacifist) out.push(who + ' never strikes.')
  if (r.aura)
    out.push(
      (r.aura.to === 'adjacentAllies'
        ? 'Neighboring friends'
        : 'Every other friendly fighter') +
        ' strike for +' +
        r.aura.n +
        '.',
    )
  if (r.hex)
    out.push(
      (r.hex.to === 'across'
        ? 'The rival across'
        : 'The rival across and its neighbors') +
        ' strike for -' +
        r.hex.n +
        '.',
    )
  const hits = kind === 'equipment' ? 'The wearer strikes' : 'It strikes'
  if (r.pack) out.push(hits + ' for +' + r.pack + ' beside a friend.')
  if (r.lone) out.push(hits + ' for +' + r.lone + ' with no friend beside it.')
  if (r.bully)
    out.push(hits + ' for +' + r.bully + ' against a stunned blocker.')
  return out
}
/** Rules text for a stage, generated from the same data the engine runs. */
export function evoStageText(st: EvoStage, kind: Kind): string {
  return [
    ...st.abilities.map((ab) => abilityText(ab, kind)),
    ...(st.static ? staticText(st.static, kind) : []),
  ].join(' ')
}
