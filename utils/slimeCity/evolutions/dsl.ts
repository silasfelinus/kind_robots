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
  | 'tap'
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
  | 'woundedAllies'
  | 'healthyAllies'

export type EvoSummonWhere = 'neighbors' | 'nearest' | 'everyEmpty'
/** Relocation is adjacent and needs an unoccupied friendly alley. */
export type EvoShiftWhere = 'safe' | 'engage'

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
  /** Upgrade another card already owned in hand/deck, never beyond level 3. */
  | { do: 'promote'; zone: 'hand' | 'deck' }
  /** Knock out an already-wounded rival at or below this remaining life. */
  | { do: 'execute'; threshold: number; to: 'target' }
  /** A seeded gamble: `p` percent chance to run `then`. */
  | { do: 'chance'; p: number; then: EvoAction[] }
  /** Run `then` only when the board matches `cond` (situational payoffs). */
  | { do: 'if'; cond: EvoCondition; then: EvoAction[] }
  /** Your most recently fallen fighter returns as an echo nearby. */
  | { do: 'revive'; attack: number; hp: number }
  /** The fighter leaves the board for the top of your deck. */
  | { do: 'retreat' }
  /** The fighter trades blows with the chosen foe right now. */
  | { do: 'duel'; to: EvoScope }
  /** The next lethal hit leaves them at 1 life instead (once each). */
  | { do: 'rescue'; to: EvoScope }
  /** Move an existing fighter one alley. It keeps its life, gear and turn state. */
  | { do: 'shift'; to: 'self' | 'target'; where: EvoShiftWhere }
  /** A sprung trap arms again in the same alley (once). */
  | { do: 'rearm' }
  /** The fighter's current power hits the rival boss. */
  | { do: 'pounce' }

/** Board facts a situational payoff can check. */
export type EvoCondition =
  | 'acrossEmpty'
  | 'allyFell'
  | 'targetHeavy'
  | 'crowd'
  | 'foesPresent'
  | 'crewWhole'

export interface EvoAbility {
  when: EvoTrigger
  do: EvoAction[]
  /** Tap is a chosen, once-per-own-turn action that spends the fighter's strike. */
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
  /** One conditional free play per turn while the play phase remains open. */
  freeIf?: EvoCondition
}

export interface CardEvolution {
  /** The name the card wears at level 1 (usually its own name). */
  base?: string
  /** Optional level-one signature ability. Like L2/L3 it fires through the
   * real battle interpreter: a first play can make a fragile worker, protect
   * one ally, or set up a specific future combo instead of paying a blank
   * upgrade tax. Omitted for existing cards whose native keywords already
   * give Level 1 its useful action. */
  1?: EvoStage
  /** Trajectory stat changes from the shared curve (creatures only). Most
   * cards grow; an early bloomer can shrink at level 3 (rare by design). */
  stats?: Partial<Record<1 | 2 | 3, { attack?: number; hp?: number }>>
  2: EvoStage
  3: EvoStage
  /** A choose-one level three (approved by Silas 2026-11-08 PT): whoever
   * plays the card at level three picks `3` or `choice.stage`. Both share the
   * level-three stats. The CPU takes `3` while `cpu` holds, else the other. */
  choice?: { stage: EvoStage; cpu: EvoCondition }
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
export const promote = (zone: 'hand' | 'deck'): EvoAction => ({
  do: 'promote',
  zone,
})
export const execute = (threshold: number): EvoAction => ({
  do: 'execute',
  threshold,
  to: 'target',
})
export const chance = (p: number, ...then: EvoAction[]): EvoAction => ({
  do: 'chance',
  p,
  then,
})

export const when = (cond: EvoCondition, ...then: EvoAction[]): EvoAction => ({
  do: 'if',
  cond,
  then,
})
export const revive = (attack: number, hp: number): EvoAction => ({
  do: 'revive',
  attack,
  hp,
})
export const retreat = (): EvoAction => ({ do: 'retreat' })
export const shift = (
  to: 'self' | 'target',
  where: EvoShiftWhere,
): EvoAction => ({ do: 'shift', to, where })
export const duel = (to: EvoScope): EvoAction => ({ do: 'duel', to })
export const rescue = (to: EvoScope): EvoAction => ({ do: 'rescue', to })
export const rearm = (): EvoAction => ({ do: 'rearm' })
export const pounce = (): EvoAction => ({ do: 'pounce' })

// ------------------------------------------------------------------- text
const PLURAL: EvoScope[] = ['adjacentAllies', 'adjacentFoes', 'laneFoes']
const WHO: Record<EvoScope, string> = {
  self: 'itself',
  target: 'the target',
  across: 'the foe across',
  adjacentAllies: 'adjacent allies',
  allies: 'all allies',
  otherAllies: 'other allies',
  adjacentFoes: 'adjacent foes',
  laneFoes: 'the 3 facing foes',
  allFoes: 'all foes',
  randomFoe: 'a random foe',
  weakestFoe: 'the weakest foe',
  strongestFoe: 'the strongest foe',
  woundedAlly: 'your most hurt ally',
  woundedAllies: 'every hurt ally',
  healthyAllies: 'every unhurt ally',
}
const WHERE: Record<EvoSummonWhere, string> = {
  neighbors: 'beside it',
  nearest: 'nearby',
  everyEmpty: 'in every empty alley',
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
    to === 'self' ? (subject === 'it' ? 'it' : 'the wearer') : WHO[to]
  const get = (to: EvoScope) =>
    who(to) +
    (PLURAL.includes(to) || to === 'allies' || to === 'otherAllies'
      ? ' get '
      : ' gets ')
  const signed = (n: number) => (n < 0 ? String(n) : '+' + n)
  switch (a.do) {
    case 'damage':
      return a.n + (a.pierce ? ' piercing' : '') + ' to ' + who(a.to)
    case 'heal':
      return 'heal ' + who(a.to) + ' ' + a.n
    case 'power':
      return (
        get(a.to) + signed(a.n) + ' power' + (a.lasting ? ' for good' : ' now')
      )
    case 'life':
      return get(a.to) + signed(a.n) + ' life'
    case 'armor':
      return get(a.to) + signed(a.n) + ' armor'
    case 'guard':
      return get(a.to) + '+' + a.n + ' shield'
    case 'stun':
      return 'stun ' + who(a.to)
    case 'cleanse':
      return 'unstun ' + who(a.to)
    case 'grant':
      return get(a.to) + KEYWORD[a.keyword]
    case 'summon':
      return (
        'summon ' +
        (a.where === 'nearest' ? 'a ' : '') +
        a.attack +
        '/' +
        a.hp +
        (a.keywords?.length
          ? ' ' + a.keywords.map((k) => KEYWORD[k]).join(' ')
          : '') +
        (a.where === 'nearest' ? ' echo ' : ' echoes ') +
        WHERE[a.where]
      )
    case 'boss':
      return a.n + ' to the rival boss'
    case 'mend':
      return 'your boss +' + a.n
    case 'draw':
      return 'draw ' + a.n
    case 'promote':
      return (
        'level up the lowest-level other card in your ' + a.zone + ' (max L3)'
      )
    case 'execute':
      return (
        'knock out a wounded rival target at ' + a.threshold + ' or less life'
      )
    case 'chance':
      return (
        a.p + '%: ' + a.then.map((x) => evoActionText(x, subject)).join(', ')
      )
    case 'if':
      return (
        COND[a.cond] +
        ', ' +
        a.then.map((x) => evoActionText(x, subject)).join(', ')
      )
    case 'revive':
      return (
        'your last fallen fighter returns as a ' +
        a.attack +
        '/' +
        a.hp +
        ' echo nearby'
      )
    case 'retreat':
      return (
        (subject === 'it' ? 'it' : 'the wearer') +
        ' returns to the top of your deck'
      )
    case 'shift':
      return (
        (a.to === 'self' ? 'sidestep' : 'shift the target') +
        (a.where === 'safe'
          ? ' to an empty neighboring alley with no foe across'
          : ' to an empty neighboring alley across from a foe')
      )
    case 'duel':
      return (
        (subject === 'it' ? 'it' : 'the wearer') +
        ' trades blows with ' +
        WHO[a.to]
      )
    case 'rescue':
      return (
        who(a.to) +
        ' survive' +
        (PLURAL.includes(a.to) || a.to === 'allies' ? '' : 's') +
        ' the next lethal hit at 1 life'
      )
    case 'rearm':
      return 'it arms again here (once)'
    case 'pounce':
      return (
        (subject === 'it' ? 'its' : "the wearer's") +
        ' power hits the rival boss'
      )
  }
}

const COND: Record<EvoCondition, string> = {
  acrossEmpty: 'if no foe is across',
  allyFell: 'if an ally has fallen',
  targetHeavy: 'if the target is a 2-play fighter',
  crowd: 'with 2+ allies on the field',
  foesPresent: 'if a foe is on the field',
  crewWhole: 'with under 2 hurt allies',
}
const WHEN: Record<EvoTrigger, string> = {
  enter: 'Arrive',
  hit: 'Hit',
  kill: 'Knockout',
  boss: 'Boss hit',
  strike: 'After striking',
  death: 'Last breath',
  roundEnd: 'Round end',
  turnStart: 'Turn start',
  tap: 'Tap (skip this turn\'s attack)',
  spring: 'Sprung',
}
type Kind = 'creature' | 'spell' | 'trap' | 'equipment'
function abilityText(ab: EvoAbility, kind: Kind): string {
  const subject = kind === 'creature' ? 'it' : 'self'
  const body = ab.do.map((a) => evoActionText(a, subject)).join(', ')
  let lead: string
  if (kind === 'spell' && ab.when === 'enter') lead = 'Also'
  else if (kind === 'equipment' && ab.when === 'enter') lead = 'Install'
  else lead = WHEN[ab.when]
  return lead + (ab.once ? ' (once)' : '') + ': ' + body + '.'
}
function staticText(r: EvoStatic, kind: Kind): string[] {
  const out: string[] = []
  const it = kind === 'equipment' ? 'Wearer' : 'It'
  if (r.pacifist) out.push(it + ' never strikes.')
  if (r.aura)
    out.push(
      (r.aura.to === 'adjacentAllies' ? 'Adjacent' : 'Other') +
        ' allies +' +
        r.aura.n +
        ' power.',
    )
  if (r.hex)
    out.push(
      (r.hex.to === 'across' ? 'Foe across' : '3 facing foes') +
        ' -' +
        r.hex.n +
        ' power.',
    )
  if (r.pack) out.push(it + ' has +' + r.pack + ' power beside an ally.')
  if (r.lone)
    out.push(it + ' has +' + r.lone + ' power with no ally beside it.')
  if (r.bully) out.push(it + ' has +' + r.bully + ' power vs stunned foes.')
  return out
}
/** Rules text for a stage, generated from the same data the engine runs. */
export function evoStageText(st: EvoStage, kind: Kind): string {
  return [
    ...st.abilities.map((ab) => abilityText(ab, kind)),
    ...(st.static ? staticText(st.static, kind) : []),
    ...(st.freeIf
      ? ['Free once per turn ' + COND[st.freeIf] + ' (during your play phase).']
      : []),
  ].join(' ')
}
