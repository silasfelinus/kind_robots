import {
  CHARACTERS,
  ROLES,
  SUPPORTS,
  SYNERGIES,
  character,
  pairKey,
} from './roster'
import { CUSTOM_HERO_ID } from './types'
import type {
  Archetype,
  Gender,
  HeroSetup,
  RoleId,
  Support,
  Synergy,
  Value,
} from './types'

// Party composition: which synergies and supports a party switches on, who
// the hero can romance in it, and the optimizer that searches every party of
// one to three companions for the best fit to a goal.

export const MAX_COMPANIONS = 3

export type PartyGoal =
  'balanced' | 'power' | 'romance' | 'treasure' | 'puzzles'

export const GOAL_LABEL: Record<PartyGoal, string> = {
  balanced: 'Balanced',
  power: 'Raw power',
  romance: 'Romance',
  treasure: 'Treasure',
  puzzles: 'Puzzles',
}

const CASTERS: RoleId[] = ['mage', 'warlock', 'necromancer']
const HOLY: RoleId[] = ['cleric', 'paladin']
const DARK: RoleId[] = ['warlock', 'necromancer']

export function roleFor(id: string, hero?: HeroSetup): RoleId {
  return id === CUSTOM_HERO_ID
    ? (hero?.custom?.role ?? 'warrior')
    : character(id).role
}

function roles(ids: readonly string[], hero?: HeroSetup): RoleId[] {
  return ids.map((id) => roleFor(id, hero))
}

function archetypes(ids: readonly string[], hero?: HeroSetup): Archetype[] {
  return roles(ids, hero).map((r) => ROLES[r].archetype)
}

const has = (list: RoleId[], ...wanted: RoleId[]) =>
  list.some((r) => wanted.includes(r))
const count = (list: RoleId[], ...wanted: RoleId[]) =>
  list.filter((r) => wanted.includes(r)).length

const SYNERGY_TEST: Record<
  string,
  (ids: readonly string[], hero?: HeroSetup) => boolean
> = {
  trinity: (ids, hero) => {
    const a = archetypes(ids, hero)
    return a.includes('tank') && a.includes('healer') && a.includes('striker')
  },
  arcane: (ids, hero) => count(roles(ids, hero), ...CASTERS) >= 2,
  twilight: (ids, hero) =>
    has(roles(ids, hero), ...HOLY) && has(roles(ids, hero), ...DARK),
  scouts: (ids, hero) =>
    has(roles(ids, hero), 'ranger') && has(roles(ids, hero), 'rogue'),
  hunters: (ids, hero) =>
    has(roles(ids, hero), 'rogue') &&
    has(roles(ids, hero), 'artificer', 'alchemist'),
  bookworms: (ids, hero) =>
    has(roles(ids, hero), 'scholar') && has(roles(ids, hero), 'mage'),
  warband: (ids, hero) => count(roles(ids, hero), 'warrior', 'monk') >= 2,
  bulwark: (ids, hero) =>
    archetypes(ids, hero).filter((a) => a === 'tank').length >= 2,
  green: (ids, hero) =>
    has(roles(ids, hero), 'druid') && has(roles(ids, hero), 'ranger'),
  encore: (ids, hero) => has(roles(ids, hero), 'bard') && ids.length >= 3,
  'grave-glass': (ids, hero) =>
    has(roles(ids, hero), 'necromancer') && has(roles(ids, hero), 'alchemist'),
  mixed: (ids, hero) => new Set(archetypes(ids, hero)).size >= 4,
  duo: (ids) => ids.length === 2,
}

export function activeSynergies(
  ids: readonly string[],
  hero?: HeroSetup,
): Synergy[] {
  return SYNERGIES.filter((s) => SYNERGY_TEST[s.id]?.(ids, hero))
}

export function hasSynergyEffect(
  ids: readonly string[],
  effect: Synergy['effects'][number],
  hero?: HeroSetup,
): boolean {
  return activeSynergies(ids, hero).some((s) => s.effects.includes(effect))
}

export function activeSupports(ids: readonly string[]): Support[] {
  const set = new Set(ids)
  return SUPPORTS.filter((s) => set.has(s.a) && set.has(s.b))
}

export function heroGender(hero: HeroSetup): Gender {
  return hero.gender
}

/** Already together when the delve begins: a married or poly pair in one party. */
export function startingPartners(
  hero: HeroSetup,
  companions: readonly string[],
): string[] {
  if (hero.presetId === CUSTOM_HERO_ID) return []
  const lead = character(hero.presetId)
  if (lead.partner && companions.includes(lead.partner)) return [lead.partner]
  return []
}

/**
 * Whether the hero can court this companion in this party. Both have to be
 * drawn to each other; a companion who is already partnered can only be
 * courted when they are poly and their partner is in the party too.
 */
export function canRomance(
  hero: HeroSetup,
  companionId: string,
  companions: readonly string[],
): boolean {
  const c = character(companionId)
  if (!c.romanceable) return false
  if (!c.drawnTo.includes(hero.gender) || !hero.drawnTo.includes(c.gender))
    return false
  if (!c.partner || c.partner === hero.presetId) return true
  if (!c.poly) return false
  const other = character(c.partner)
  return (
    companions.includes(c.partner) &&
    other.drawnTo.includes(hero.gender) &&
    hero.drawnTo.includes(other.gender)
  )
}

/**
 * Things the player has actually learned. Mechanical effects still apply
 * regardless of discovery; this only controls what the party planner may
 * infer or expose before a relationship is encountered in play.
 */
export type PartyKnowledge = {
  supports: readonly string[]
  romances: readonly string[]
  values: Readonly<Record<string, readonly Value[]>>
}

export type ScoreLine = { label: string; points: number }

export type PartyScore = {
  companions: string[]
  total: number
  lines: ScoreLine[]
}

const GOAL_WEIGHTS: Record<
  PartyGoal,
  {
    cover: number
    synergy: number
    support: number
    romance: number
    power: number
    treasure: number
    puzzle: number
  }
> = {
  balanced: {
    cover: 1,
    synergy: 1,
    support: 1,
    romance: 0.5,
    power: 0.5,
    treasure: 0.5,
    puzzle: 0.5,
  },
  power: {
    cover: 1,
    synergy: 1.2,
    support: 0.8,
    romance: 0,
    power: 2,
    treasure: 0,
    puzzle: 0,
  },
  romance: {
    cover: 0.6,
    synergy: 0.6,
    support: 1.4,
    romance: 3,
    power: 0.2,
    treasure: 0,
    puzzle: 0,
  },
  treasure: {
    cover: 0.6,
    synergy: 0.8,
    support: 0.6,
    romance: 0.3,
    power: 0.3,
    treasure: 3,
    puzzle: 0.6,
  },
  puzzles: {
    cover: 0.6,
    synergy: 0.8,
    support: 0.6,
    romance: 0.3,
    power: 0.3,
    treasure: 0.6,
    puzzle: 3,
  },
}

function power(id: string, hero: HeroSetup): number {
  const base = ROLES[roleFor(id, hero)].base
  return base.hp / 5 + base.atk + base.def + base.mag + base.spd / 2
}

export function scoreParty(
  hero: HeroSetup,
  companions: readonly string[],
  goal: PartyGoal = 'balanced',
  knowledge?: PartyKnowledge,
): PartyScore {
  const w = GOAL_WEIGHTS[goal]
  const ids = [hero.presetId, ...companions]
  const lines: ScoreLine[] = []
  const add = (label: string, points: number) => {
    if (points) lines.push({ label, points: Math.round(points * 10) / 10 })
  }

  const a = new Set(archetypes(ids, hero))
  const cover =
    (a.has('tank') ? 5 : 0) +
    (a.has('healer') ? 5 : 0) +
    (a.has('striker') ? 3 : 0) +
    (a.has('caster') ? 2 : 0) +
    (a.has('support') ? 2 : 0)
  add('Role coverage', cover * w.cover)

  for (const s of activeSynergies(ids, hero)) add(s.name, s.value * w.synergy)
  for (const s of activeSupports(ids)) {
    if (!knowledge || knowledge.supports.includes(pairKey(s.a, s.b)))
      add(s.name, (s.kind === 'lovers' ? 5 : 3) * w.support)
  }

  const romances = companions.filter(
    (id) =>
      canRomance(hero, id, companions) &&
      (!knowledge || knowledge.romances.includes(id)),
  )
  add(
    romances.length === 1
      ? 'One possible romance'
      : `${romances.length} possible romances`,
    Math.min(romances.length, 2) * 3 * w.romance,
  )

  add(
    'Combat power',
    (ids.reduce((sum, id) => sum + power(id, hero), 0) / ids.length - 40) *
      0.4 *
      w.power,
  )

  const r = roles(ids, hero)
  const treasure =
    (has(r, 'rogue') ? 4 : 0) +
    (has(r, 'artificer') ? 2 : 0) +
    (has(r, 'alchemist') ? 2 : 0)
  add('Treasure sense', treasure * w.treasure)

  const wits = ids.reduce(
    (sum, id) => sum + ROLES[roleFor(id, hero)].base.wit,
    0,
  )
  add('Puzzle wits', (wits / ids.length - 6) * w.puzzle)

  let friction = 0
  for (const x of ids)
    for (const y of ids)
      if (
        x !== y &&
        x !== CUSTOM_HERO_ID &&
        y !== CUSTOM_HERO_ID &&
        character(x).likes.includes(character(y).dislikes) &&
        (!knowledge ||
          (knowledge.values[x]?.includes(character(y).dislikes) &&
            knowledge.values[y]?.includes(character(y).dislikes)))
      )
        friction += 0.5
  add('Clashing values', -friction)

  return {
    companions: [...companions],
    total: Math.round(lines.reduce((sum, l) => sum + l.points, 0) * 10) / 10,
    lines,
  }
}

/** Every party of one to three companions, best first. */
export function optimizeParty(
  hero: HeroSetup,
  goal: PartyGoal = 'balanced',
  limit = 3,
  sizes: number[] = [1, 2, 3],
  knowledge?: PartyKnowledge,
): PartyScore[] {
  const pool = CHARACTERS.map((c) => c.id).filter((id) => id !== hero.presetId)
  const best: PartyScore[] = []
  const consider = (party: string[]) => {
    const score = scoreParty(hero, party, goal, knowledge)
    if (best.length < limit || score.total > best[best.length - 1]!.total) {
      best.push(score)
      best.sort(
        (x, y) =>
          y.total - x.total ||
          x.companions.join().localeCompare(y.companions.join()),
      )
      if (best.length > limit) best.pop()
    }
  }
  for (let i = 0; i < pool.length; i++) {
    if (sizes.includes(1)) consider([pool[i]!])
    for (let j = i + 1; j < pool.length; j++) {
      if (sizes.includes(2)) consider([pool[i]!, pool[j]!])
      if (sizes.includes(3))
        for (let k = j + 1; k < pool.length; k++)
          consider([pool[i]!, pool[j]!, pool[k]!])
    }
  }
  return best
}

export function pairsInParty(ids: readonly string[]): string[] {
  return activeSupports(ids).map((s) => pairKey(s.a, s.b))
}
