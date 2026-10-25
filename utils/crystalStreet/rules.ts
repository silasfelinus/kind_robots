import avatarsData from './avatars.json'
import charactersData from './characters.json'
import companionsData from './companions.json'
import decksData from './decks.json'
import itemsData from './items.json'
import locationsData from './locations.json'
import specialEndingsData from './special-endings.json'
import titleArtData from './title-art.json'
import { VILLAINS } from './villains'
import { editChoices, joinBody, liveTextStore } from '../playbook/textOverlay'
import {
  SKILLS,
  type Archetype,
  type Avatar,
  type Character,
  type Choice,
  type Companion,
  type Effects,
  type Emotion,
  type Encounter,
  type EndingTier,
  type Faction,
  type Item,
  type Location,
  type Outcome,
  type Skill,
  type SpecialEnding,
  type SpecialEndingText,
  type Style,
  type Tag,
  type TagDeck,
  type Villain,
} from './types'
import type { CompanionId, ItemId, LocationId, VillainId } from './ids'

export { VILLAINS }
export const AVATARS = avatarsData as Avatar[]
export const CHARACTERS = charactersData as Character[]
export const COMPANIONS = companionsData as Companion[]
/** The idyllic daytime Crystal Street behind the title. */
export const TITLE_ART: string = titleArtData.title
export const DECKS = decksData as TagDeck[]
export const ITEMS = itemsData as Item[]
export const LOCATIONS = locationsData as Location[]

export const DAYS = 7
export const ACTIONS_PER_DAY = 3
export const CREW_LIMIT = 10
export const MAX_NERVE = 10
export const START_NERVE = 7
export const MAX_DREAD = 10
export const SKILL_CAP = 5
export const TRAIN_CAP = 4
export const BEST_WINS = 12
export const NIGHT_DRAWS = 2
export const HEAL_NERVE = 3
export const GROCERY_COST = 2
export const ACTS = 3
/** Finale rolls gain +1 for each act whose villain card you beat. */
export const EDGE_BONUS = 1
export const CREW_BONUS_CAP = 1
export const NIGHT_PENALTY = 1
export const DREAD_STEP = 4
export const SCHEMA_VERSION = 1

export const DAY_NAMES = [
  'Saturday, October 25',
  'Sunday, October 26',
  'Monday, October 27',
  'Tuesday, October 28',
  'Wednesday, October 29',
  'Thursday, October 30',
  'Friday, October 31',
]

export const ARCHETYPES: Archetype[] = [
  {
    id: 'jock',
    style: 'brave',
    name: 'The Jock',
    text: 'Varsity jacket, mouthguard, unexpectedly great at hugs.',
    skills: { brawn: 3, brains: 1, charm: 2, nerve: 2, lore: 0, hustle: 1 },
  },
  {
    id: 'brain',
    style: 'clever',
    name: 'The Brain',
    text: 'Calculator watch, library card, a theory about everything.',
    skills: { brawn: 0, brains: 3, charm: 1, nerve: 1, lore: 2, hustle: 2 },
  },
  {
    id: 'theatre-kid',
    style: 'camp',
    name: 'The Theatre Kid',
    text: 'Knows every word of every midnight movie. Projects to the back row.',
    skills: { brawn: 1, brains: 1, charm: 3, nerve: 2, lore: 1, hustle: 1 },
  },
  {
    id: 'burnout',
    style: 'reckless',
    name: 'The Burnout',
    text: 'Leather jacket, cassette deck, knows every shortcut in town.',
    skills: { brawn: 2, brains: 0, charm: 1, nerve: 2, lore: 1, hustle: 3 },
  },
  {
    id: 'prep',
    style: 'kind',
    name: 'The Prep',
    text: 'Popped collar, perfect grades, secretly tired of both.',
    skills: { brawn: 1, brains: 2, charm: 3, nerve: 1, lore: 0, hustle: 2 },
  },
  {
    id: 'weirdo',
    style: 'sneaky',
    name: 'The Weirdo',
    text: 'Ouija board in the backpack. Has been waiting for this week all year.',
    skills: { brawn: 0, brains: 2, charm: 0, nerve: 2, lore: 3, hustle: 2 },
  },
]

export const STYLE_LABELS: Record<Style, string> = {
  brave: 'Brave',
  clever: 'Clever',
  kind: 'Kind',
  camp: 'Camp',
  sneaky: 'Sneaky',
  reckless: 'Reckless',
}

/**
 * A look's signature style bonus. The rarer ways to play (camp, sneaky,
 * reckless turn up on about half as many choices) pay double so every look
 * pulls its weight.
 */
export const STYLE_BONUS: Record<Style, number> = {
  brave: 1,
  clever: 1,
  kind: 1,
  camp: 2,
  sneaky: 2,
  reckless: 2,
}

export const START_STANDING = 3
export const MAX_STANDING = 5

export const FACTION_LABELS: Record<Faction, string> = {
  friends: 'Friends',
  family: 'Family',
  officials: 'Officials',
  neighbors: 'Neighbors',
}

export const FACTION_ICONS: Record<Faction, string> = {
  friends: 'kind-icon:users',
  family: 'kind-icon:house',
  officials: 'kind-icon:shield',
  neighbors: 'kind-icon:door',
}

export const FACTION_HINTS: Record<Faction, string> = {
  friends:
    'Drops when a friend is shaken or sent home, or when you face a night alone and it goes wrong; rises when one joins.',
  family:
    'Drops the first time each night a nightmare card goes wrong and you come home late; rises when you rest at home or bring home comfort food.',
  officials:
    'Drops when a sneaky or reckless night roll fails; rises when you study at the library or the high school.',
  neighbors:
    'Drops the first time each night a street card goes wrong; rises with every kind choice that works.',
}

export const SPECIAL_ENDINGS = specialEndingsData as Record<
  SpecialEnding,
  SpecialEndingText
>

export function startingStanding(): Record<Faction, number> {
  // Family starts with a little more patience: every nightmare card risks it.
  return {
    friends: START_STANDING,
    family: START_STANDING + 1,
    officials: START_STANDING,
    neighbors: START_STANDING,
  }
}

export function standingOf(run: RunState): Record<Faction, number> {
  return run.standing ?? startingStanding()
}

/** The standing a resolved roll moves, before chance (shaken friends). */
export function standingShift(
  run: RunState,
  choice: Choice,
  success: boolean,
): Partial<Record<Faction, number>> {
  const shift: Partial<Record<Faction, number>> = {}
  if (run.current?.kind === 'finale') return shift
  if (success && choice.intent === 'kind') shift.neighbors = 1
  if (!success && run.phase === 'night') {
    if (choice.intent === 'sneaky' || choice.intent === 'reckless')
      shift.officials = -1
    const once = (tag: string) => !run.flags.includes(`${tag}-${run.day}`)
    if (run.current?.kind === 'night' && once('ruckus'))
      shift.neighbors = (shift.neighbors ?? 0) - 1
    if (run.current?.kind === 'signature' && once('curfew')) shift.family = -1
    if (!activeCrew(run).length && once('alone')) shift.friends = -1
  }
  return shift
}

function shiftStanding(run: RunState, faction: Faction, delta: number): void {
  const standing = { ...standingOf(run) }
  standing[faction] = clamp(standing[faction] + delta, 0, MAX_STANDING)
  run.standing = standing
}

/**
 * A faction at zero ends the week its own way. Friends at zero start the
 * Final Girl sequence instead: the finale comes early, faced alone.
 */
function checkStanding(run: RunState): void {
  if (run.phase === 'ended') return
  const standing = standingOf(run)
  const fallen = (['family', 'officials', 'neighbors'] as const).find(
    (f) => standing[f] <= 0,
  )
  if (fallen) {
    run.pending = null
    run.current = null
    run.queue = []
    run.draws = 0
    run.phase = 'ended'
    run.ending = { tier: 'bittersweet', at: Date.now(), special: fallen }
    return
  }
  if (standing.friends <= 0 && !run.flags.includes(FINAL_GIRL)) {
    run.flags.push(FINAL_GIRL)
    if (run.phase === 'night') {
      run.queue = [{ id: villainOf(run).finale.id, kind: 'finale' }]
      run.draws = 0
    }
  }
}

export const FINAL_GIRL = 'final-girl'

export function isFinalGirl(run: RunState): boolean {
  return run.flags.includes(FINAL_GIRL)
}

export function specialEndingOf(run: RunState): SpecialEndingText | null {
  const special = run.ending?.special
  if (!special) return null
  const base = SPECIAL_ENDINGS[special]
  const fill = (text: string) =>
    text
      .replaceAll('{villain}', villainOf(run).name)
      .replaceAll('{name}', run.name)
  return { title: fill(base.title), text: fill(base.text), art: base.art }
}

export const SKILL_LABELS: Record<Skill, string> = {
  brawn: 'Brawn',
  brains: 'Brains',
  charm: 'Charm',
  nerve: 'Nerve',
  lore: 'Lore',
  hustle: 'Hustle',
}

export const TIER_LABELS: Record<EndingTier, string> = {
  best: 'Best ending',
  good: 'Good ending',
  bittersweet: 'Bittersweet ending',
  bad: 'Taken',
}

export const ENDING_TIERS: EndingTier[] = ['best', 'good', 'bittersweet', 'bad']

export const TIER_HOW: Record<EndingTier, string> = {
  best: `Reach its heart on Halloween after a week with at least ${BEST_WINS} night wins (the finale counts).`,
  good: 'Win the Halloween finale by fighting or tricking it, or reach its heart with fewer night wins.',
  bittersweet: 'Lose the Halloween finale with more than 3 nerve left.',
  bad: 'Run out of nerve, or lose the finale with 3 nerve or less.',
}

const PAWNSHOP_SPOTS = [
  'the far end of the Starlight Mall parking lot',
  'the gravel lot behind St. Jude’s',
  'the empty lot at 13 Crystal Street',
  'under the KGLM water tower',
  'the old drive-in by the junkyard',
  'the loading dock behind Rewind Video',
  'the high school bus barn',
]

export type EncounterKind =
  'beat' | 'clue' | 'meet' | 'arc' | 'night' | 'signature' | 'finale'

export type Roll = {
  dice: [number, number]
  modifier: number
  breakdown: string[]
  total: number
  target: number
  success: boolean
}

export type Pending = {
  choiceId: string
  roll: Roll
  rerolled: boolean
  shielded: CompanionId | null
}

export type LogEntry = {
  day: number
  phase: 'day' | 'night'
  encounterId: string
  title: string
  choiceId: string
  label: string
  success: boolean
  text: string
  art: string
}

export type RunState = {
  version: number
  seed: string
  rng: number
  name: string
  pronouns: string
  /** Chosen avatar id; weeks saved before avatars existed have none. */
  avatar?: string
  archetype: string
  villain: VillainId
  day: number
  phase: 'day' | 'night' | 'ended'
  actions: number
  skills: Record<Skill, number>
  nerve: number
  dread: number
  quarters: number
  items: ItemId[]
  clues: string[]
  flags: string[]
  crew: CompanionId[]
  shaken: CompanionId[]
  perksUsed: CompanionId[]
  trained: number
  trainedToday: boolean
  seenBeats: string[]
  usedDeck: string[]
  shopOpen: boolean
  stock: ItemId[]
  pawnshopSpot: string
  queue: { id: string; kind: EncounterKind }[]
  /** Cards still to draw tonight; the player picks the deck for each. */
  draws?: number
  teleported: boolean
  current: { id: string; kind: EncounterKind; location?: LocationId } | null
  pending: Pending | null
  /** Standing with each faction, 0-5; weeks saved before factions have none. */
  standing?: Record<Faction, number>
  revealed: boolean
  wins: number
  rolls: number
  log: LogEntry[]
  ending: {
    tier: EndingTier
    at: number
    /** A faction collapse or the Final Girl's win. */
    special?: SpecialEnding
  } | null
}

const ENCOUNTERS = new Map<string, Encounter>()
const ENCOUNTER_TAG = new Map<string, Tag>()
const ENCOUNTER_VILLAIN = new Map<string, VillainId>()

for (const v of VILLAINS) {
  for (const c of v.clues) ENCOUNTERS.set(c.encounter.id, c.encounter)
  for (const e of v.signature) {
    ENCOUNTERS.set(e.id, e)
    ENCOUNTER_VILLAIN.set(e.id, v.id as VillainId)
  }
  ENCOUNTERS.set(v.finale.id, v.finale)
}
for (const d of DECKS)
  for (const e of d.encounters) {
    ENCOUNTERS.set(e.id, e)
    ENCOUNTER_TAG.set(e.id, d.tag)
  }
for (const l of LOCATIONS) for (const e of l.beats) ENCOUNTERS.set(e.id, e)
for (const c of COMPANIONS) ENCOUNTERS.set(c.meet.id, c.meet)
const ARC_STEP = new Map<string, { companion: CompanionId; step: number }>()
for (const c of COMPANIONS)
  (c.arc ?? []).forEach((e, i) => {
    ENCOUNTERS.set(e.id, e)
    ARC_STEP.set(e.id, { companion: c.id as CompanionId, step: i + 1 })
  })

export const CRYSTAL_STREET_LIVE_TEXT = liveTextStore()

export function authoredEncounter(id: string): Encounter | null {
  return ENCOUNTERS.get(id) ?? null
}

export function encounterById(id: string): Encounter | null {
  const encounter = ENCOUNTERS.get(id)
  if (!encounter) return null
  const edit = CRYSTAL_STREET_LIVE_TEXT.get(id)
  if (!edit) return encounter
  return {
    ...encounter,
    title: edit.title ?? encounter.title,
    text: joinBody(edit, encounter.text),
    choices: editChoices(encounter.choices, edit, (choice, change) => ({
      success: change.success
        ? { ...choice.success, text: change.success }
        : choice.success,
      failure: change.failure
        ? { ...choice.failure, text: change.failure }
        : choice.failure,
    })),
  }
}

export function allEncounters(): Encounter[] {
  return [...ENCOUNTERS.values()]
}

export function archetypeById(id: string): Archetype | null {
  return ARCHETYPES.find((a) => a.id === id) ?? null
}

export function characterId(avatar: string, archetype: string): string {
  return `${avatar}--${archetype}`
}

export function characterFor(
  avatar: string | null | undefined,
  archetype: string,
): Character | null {
  if (!avatar) return null
  const id = characterId(avatar, archetype)
  return CHARACTERS.find((c) => c.id === id) ?? null
}

export type StyleBonus = { style: Style; amount: number; why: string }

/**
 * Look × clique synergy. The look brings its signature style; a clique
 * whose home style matches is Typecast (+1 more on it), any other clique
 * plays Against type (+1 on the clique's own style too).
 */
export function synergyOf(
  avatarId: string | null | undefined,
  archetypeId: string,
): { typecast: boolean; bonuses: StyleBonus[] } | null {
  const look = avatarById(avatarId ?? '')
  const clique = archetypeById(archetypeId)
  if (!look || !clique) return null
  const typecast = look.style === clique.style
  const bonuses: StyleBonus[] = [
    {
      style: look.style,
      amount: Math.min(2, STYLE_BONUS[look.style] + (typecast ? 1 : 0)),
      why: typecast ? `${look.name}, typecast` : look.name,
    },
  ]
  if (!typecast)
    bonuses.push({ style: clique.style, amount: 1, why: 'Against type' })
  return { typecast, bonuses }
}

export function avatarById(id: string): Avatar | null {
  return AVATARS.find((a) => a.id === id) ?? null
}

export function villainById(id: string): Villain | null {
  return VILLAINS.find((v) => v.id === id) ?? null
}

/** "A gender flip of Jason Voorhees · Friday the 13th (1980)". */
export function remixLine(villain: Villain): string {
  const i = villain.inspiration
  const verb = {
    flip: 'A gender flip of',
    bend: 'A gender-bent',
    remix: 'A remix of',
  }[i.kind]
  return `${verb} ${i.original} · ${i.film} (${i.year})`
}

/** What friends call them: a quoted nickname, else the first name after any title. */
export function shortName(name: string): string {
  const nickname = name.match(/"([^"]+)"/)
  if (nickname?.[1]) return nickname[1]
  const words = name
    .split(/\s+/)
    .filter((w) => !/^(Dr|Ms|Mrs|Mr|Father|Coach)\.?$/.test(w))
  return words[0] ?? name
}

export function companionById(id: string): Companion | null {
  return COMPANIONS.find((c) => c.id === id) ?? null
}

export function locationById(id: string): Location | null {
  return LOCATIONS.find((l) => l.id === id) ?? null
}

export function itemById(id: string): Item | null {
  return ITEMS.find((i) => i.id === id) ?? null
}

export function deckByTag(tag: Tag): TagDeck | null {
  return DECKS.find((d) => d.tag === tag) ?? null
}

export function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

export function nextRandom(state: number): [number, number] {
  let t = (state + 0x6d2b79f5) >>> 0
  const next = t
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next]
}

function random(run: RunState): number {
  const [value, next] = nextRandom(run.rng)
  run.rng = next
  return value
}

function pick<T>(run: RunState, list: readonly T[]): T {
  return list[Math.floor(random(run) * list.length)] as T
}

// Plain JSON copy: the run usually arrives wrapped in a Pinia proxy, which
// structuredClone refuses.
function cloneRun(run: RunState): RunState {
  return JSON.parse(JSON.stringify(run)) as RunState
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function rollStock(run: RunState): void {
  const pool = ITEMS.map((i) => i.id as ItemId)
  const stock: ItemId[] = []
  while (stock.length < 5 && pool.length) {
    const index = Math.floor(random(run) * pool.length)
    stock.push(pool.splice(index, 1)[0] as ItemId)
  }
  run.stock = stock
  run.pawnshopSpot = pick(run, PAWNSHOP_SPOTS)
}

export type NewRunOptions = {
  seed: string
  name: string
  pronouns: string
  archetype: string
  avatar?: string | null
  villain?: VillainId | null
}

export function newRun(options: NewRunOptions): RunState {
  const archetype =
    ARCHETYPES.find((a) => a.id === options.archetype) ?? ARCHETYPES[0]!
  const run: RunState = {
    version: SCHEMA_VERSION,
    seed: options.seed,
    rng: hashSeed(options.seed),
    name: options.name.trim().slice(0, 24) || 'You',
    pronouns: options.pronouns.trim().slice(0, 16) || 'they/them',
    ...(avatarById(options.avatar ?? '') ? { avatar: options.avatar! } : {}),
    archetype: archetype.id,
    villain: VILLAINS[0]!.id as VillainId,
    day: 1,
    phase: 'day',
    actions: ACTIONS_PER_DAY,
    skills: { ...archetype.skills },
    nerve: START_NERVE,
    dread: 0,
    quarters: 4,
    items: [],
    clues: [],
    flags: [],
    crew: [],
    shaken: [],
    perksUsed: [],
    trained: 0,
    trainedToday: false,
    seenBeats: [],
    usedDeck: [],
    shopOpen: false,
    stock: [],
    pawnshopSpot: '',
    queue: [],
    teleported: false,
    current: null,
    pending: null,
    standing: startingStanding(),
    revealed: false,
    wins: 0,
    rolls: 0,
    log: [],
    ending: null,
  }
  const chosen = options.villain ? villainById(options.villain) : null
  run.villain = (chosen ?? pick(run, VILLAINS)).id as VillainId
  rollStock(run)
  return run
}

export function villainOf(run: RunState): Villain {
  return villainById(run.villain) ?? VILLAINS[0]!
}

/** Hangouts in a companion's arc; finishing them all makes them Loyal. */
export const ARC_STEPS = 3
/** Finale bonus per Loyal friend in your crew, and its cap. */
export const LOYAL_BONUS_CAP = 2

/** How many of a companion's hangouts you've had this week. */
export function arcProgress(run: RunState, id: string): number {
  let n = 0
  while (n < ARC_STEPS && run.flags.includes(`arc:${id}:${n + 1}`)) n++
  return n
}

export function isLoyal(run: RunState, id: string): boolean {
  return arcProgress(run, id) >= ARC_STEPS
}

/** Loyal friends standing with you (not shaken). */
export function loyalCrew(run: RunState): Companion[] {
  return activeCrew(run).filter((c) => isLoyal(run, c.id))
}

/** A crew member's line about this week's nightmare, once it's revealed. */
export function reactionTo(run: RunState, companion: Companion): string | null {
  if (!run.revealed || !companion.reactions) return null
  for (const tag of villainOf(run).tags)
    if (companion.reactions[tag]) return companion.reactions[tag]!
  return null
}

/**
 * The outcome text to show: an outcome that puts the choice's bonus
 * companion in the scene has an ``alone`` version for when they're not in
 * your crew.
 */
export function outcomeText(
  run: RunState,
  choice: Choice,
  outcome: Outcome,
): string {
  const friend = choice.bonus?.companion
  return friend && outcome.alone && !run.crew.includes(friend as CompanionId)
    ? outcome.alone
    : outcome.text
}

export function activeCrew(run: RunState): Companion[] {
  if (isFinalGirl(run)) return []
  return run.crew
    .filter((id) => !run.shaken.includes(id))
    .map((id) => companionById(id))
    .filter((c): c is Companion => !!c)
}

function perkHolder(
  run: RunState,
  kind: Companion['perk']['effect']['kind'],
): Companion | null {
  const spent = run.perksUsed.some(
    (id) => companionById(id)?.perk.effect.kind === kind,
  )
  if (spent) return null
  return activeCrew(run).find((c) => c.perk.effect.kind === kind) ?? null
}

export function wardFor(run: RunState, encounterId: string): Tag | null {
  const deckTag = ENCOUNTER_TAG.get(encounterId)
  const villain = ENCOUNTER_VILLAIN.get(encounterId)
  const tags = deckTag ? [deckTag] : villain ? villainOf(run).tags : []
  for (const tag of tags) {
    if (run.items.some((id) => itemById(id)?.ward === tag)) return tag
    if (
      activeCrew(run).some(
        (c) => c.perk.effect.kind === 'tag-ward' && c.perk.effect.tag === tag,
      )
    )
      return tag
  }
  return null
}

export function lockReason(run: RunState, choice: Choice): string | null {
  const r = choice.requires
  if (!r) return null
  if (r.clues && run.clues.length < r.clues)
    return `Needs ${r.clues} clues (you have ${run.clues.length})`
  if (r.item && !run.items.includes(r.item as ItemId))
    return `Needs ${itemById(r.item)?.name ?? r.item}`
  if (r.flag && !run.flags.includes(r.flag))
    return 'Needs something you have not found'
  return null
}

export function dreadPenalty(run: RunState): number {
  if (run.phase !== 'night') return 0
  return NIGHT_PENALTY + Math.floor(run.dread / DREAD_STEP)
}

export function bonusApplies(run: RunState, choice: Choice): boolean {
  const b = choice.bonus
  if (!b) return false
  return (
    (!!b.companion && activeCrew(run).some((c) => c.id === b.companion)) ||
    (!!b.item && run.items.includes(b.item as ItemId)) ||
    (!!b.flag && run.flags.includes(b.flag))
  )
}

export function modifierFor(
  run: RunState,
  choice: Choice,
): { modifier: number; breakdown: string[] } {
  const breakdown: string[] = []
  let modifier = run.skills[choice.skill]
  breakdown.push(`${SKILL_LABELS[choice.skill]} ${run.skills[choice.skill]}`)
  const helpers = activeCrew(run).filter((c) => c.skills.includes(choice.skill))
  const crew = Math.min(CREW_BONUS_CAP, helpers.length)
  if (crew) {
    modifier += crew
    breakdown.push(
      `${helpers
        .slice(0, CREW_BONUS_CAP)
        .map((c) => shortName(c.name))
        .join(' & ')} +${crew}`,
    )
  }
  const item = run.items
    .map((id) => itemById(id))
    .find((i) => i?.skill === choice.skill && i.bonus)
  if (item) {
    modifier += item.bonus ?? 0
    breakdown.push(`${item.name} +${item.bonus}`)
  }
  const b = choice.bonus
  if (b) {
    if (bonusApplies(run, choice)) {
      modifier += b.amount
      const who = b.companion
        ? shortName(companionById(b.companion)?.name ?? '')
        : b.item
          ? itemById(b.item)?.name
          : 'What you learned'
      breakdown.push(`${who} +${b.amount}`)
    }
  }
  if (run.current) {
    const ward = wardFor(run, run.current.id)
    if (ward) {
      modifier += 2
      breakdown.push(`Ward vs ${ward} +2`)
    }
  }
  if (run.current?.kind === 'finale') {
    const edges = edgesOf(run).length * EDGE_BONUS
    if (edges) {
      modifier += edges
      breakdown.push(`Edges from the week +${edges}`)
    }
    const loyal = loyalCrew(run).slice(0, LOYAL_BONUS_CAP)
    if (loyal.length) {
      modifier += loyal.length
      breakdown.push(
        `Loyal: ${loyal.map((c) => shortName(c.name)).join(' & ')} +${loyal.length}`,
      )
    }
  }
  const style = synergyOf(run.avatar, run.archetype)?.bonuses.find(
    (b) => b.style === choice.intent,
  )
  if (style) {
    modifier += style.amount
    breakdown.push(
      `${STYLE_LABELS[style.style]} (${style.why}) +${style.amount}`,
    )
  }
  const penalty = dreadPenalty(run)
  if (penalty) {
    modifier -= penalty
    breakdown.push(`Night −${penalty}`)
  }
  return { modifier, breakdown }
}

export function successChance(modifier: number, target: number): number {
  let wins = 0
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++) {
      const sum = a + b
      if (sum === 12 || (sum !== 2 && sum + modifier >= target)) wins++
    }
  return wins / 36
}

function roll(run: RunState, choice: Choice): Roll {
  const { modifier, breakdown } = modifierFor(run, choice)
  const dice: [number, number] = [
    1 + Math.floor(random(run) * 6),
    1 + Math.floor(random(run) * 6),
  ]
  const natural = dice[0] + dice[1]
  const total = natural + modifier
  const success = natural === 12 || (natural !== 2 && total >= choice.target)
  return { dice, modifier, breakdown, total, target: choice.target, success }
}

export function currentEncounter(run: RunState): Encounter | null {
  return run.current ? encounterById(run.current.id) : null
}

function currentChoice(run: RunState, choiceId: string): Choice | null {
  return currentEncounter(run)?.choices.find((c) => c.id === choiceId) ?? null
}

export function choose(run: RunState, choiceId: string): RunState {
  if (run.pending || !run.current || run.phase === 'ended') return run
  const choice = currentChoice(run, choiceId)
  if (!choice || lockReason(run, choice)) return run
  const next = cloneRun(run)
  next.pending = {
    choiceId,
    roll: roll(next, choice),
    rerolled: false,
    shielded: null,
  }
  return next
}

export function rerollHelper(run: RunState): Companion | null {
  if (!run.pending || run.pending.roll.success || run.pending.rerolled)
    return null
  return perkHolder(run, 'reroll')
}

export function reroll(run: RunState): RunState {
  const helper = rerollHelper(run)
  if (!helper || !run.pending) return run
  const choice = currentChoice(run, run.pending.choiceId)
  if (!choice) return run
  const next = cloneRun(run)
  next.perksUsed.push(helper.id as CompanionId)
  next.pending = { ...next.pending!, roll: roll(next, choice), rerolled: true }
  return next
}

export function pendingOutcome(run: RunState): Outcome | null {
  if (!run.pending) return null
  const choice = currentChoice(run, run.pending.choiceId)
  if (!choice) return null
  const outcome = run.pending.roll.success ? choice.success : choice.failure
  return { ...outcome, text: outcomeText(run, choice, outcome) }
}

function applyEffects(run: RunState, effects: Effects, failed: boolean): void {
  let nerve = effects.nerve ?? 0
  if (failed && nerve < 0 && run.phase === 'night') {
    const shield = perkHolder(run, 'shield')
    if (shield) {
      run.perksUsed.push(shield.id as CompanionId)
      if (run.pending) run.pending.shielded = shield.id as CompanionId
      nerve = 0
    }
  }
  run.nerve = clamp(run.nerve + nerve, 0, MAX_NERVE)
  run.dread = clamp(run.dread + (effects.dread ?? 0), 0, MAX_DREAD)
  run.quarters = Math.max(0, run.quarters + (effects.quarters ?? 0))
  for (const [skill, delta] of Object.entries(effects.skills ?? {}))
    run.skills[skill as Skill] = clamp(
      run.skills[skill as Skill] + (delta ?? 0),
      0,
      SKILL_CAP,
    )
  for (const item of effects.items ?? []) {
    if (run.items.includes(item as ItemId)) run.quarters += 1
    else run.items.push(item as ItemId)
  }
  run.items = run.items.filter((i) => !(effects.loseItems ?? []).includes(i))
  const own = new Set(villainOf(run).clues.map((c) => c.id))
  for (const clue of effects.clues ?? [])
    if (own.has(clue) && !run.clues.includes(clue)) run.clues.push(clue)
  for (const flag of effects.flags ?? []) {
    if (flag.startsWith('recruit:')) {
      const id = flag.slice(8) as CompanionId
      if (!run.crew.includes(id) && run.crew.length < CREW_LIMIT) {
        run.crew.push(id)
        shiftStanding(run, 'friends', 1)
      }
    } else if (flag === 'crew-shaken') {
      const steady = run.crew.filter((id) => !run.shaken.includes(id))
      if (steady.length) {
        run.shaken.push(pick(run, steady))
        shiftStanding(run, 'friends', -1)
      }
    }
    if (!run.flags.includes(flag)) run.flags.push(flag)
  }
  if (effects.teleport && run.phase === 'night' && !run.teleported) {
    const id = drawDeck(run, effects.teleport)
    if (id) {
      run.queue.unshift({ id, kind: 'night' })
      run.teleported = true
    }
  }
}

export function resolve(run: RunState): RunState {
  if (!run.pending || !run.current) return run
  const choice = currentChoice(run, run.pending.choiceId)
  const encounter = currentEncounter(run)
  if (!choice || !encounter) return run
  const next = cloneRun(run)
  const success = next.pending!.roll.success
  const outcome = success ? choice.success : choice.failure
  next.rolls += 1
  if (success && next.phase === 'night') next.wins += 1
  else if (next.phase === 'night' && next.crew.length) {
    const steady = next.crew.filter((id) => !next.shaken.includes(id))
    if (steady.length && random(next) < 0.35) {
      next.shaken.push(pick(next, steady))
      shiftStanding(next, 'friends', -1)
    }
  }
  const shift = standingShift(next, choice, success)
  for (const [faction, delta] of Object.entries(shift))
    shiftStanding(next, faction as Faction, delta ?? 0)
  if (shift.family) next.flags.push(`curfew-${next.day}`)
  if ((shift.neighbors ?? 0) < 0) next.flags.push(`ruckus-${next.day}`)
  if (shift.friends) next.flags.push(`alone-${next.day}`)
  applyEffects(next, outcome.effects, !success)
  next.log.push({
    day: next.day,
    phase: next.phase === 'night' ? 'night' : 'day',
    encounterId: encounter.id,
    title: encounter.title,
    choiceId: choice.id,
    label: choice.label,
    success,
    text: outcomeText(next, choice, outcome),
    art: outcome.art,
  })
  const kind = next.current!.kind
  const arc = kind === 'arc' ? ARC_STEP.get(encounter.id) : undefined
  if (arc && !next.flags.includes(`arc:${arc.companion}:${arc.step}`))
    next.flags.push(`arc:${arc.companion}:${arc.step}`)
  if (success && kind === 'signature') {
    const act = actOfSignature(next, encounter.id)
    if (act && !next.flags.includes(`edge-${act}`))
      next.flags.push(`edge-${act}`)
  }
  next.pending = null
  next.current = null
  if (kind === 'finale') {
    next.ending = {
      tier: finaleTier(next, choice.approach ?? choice.id, success),
      at: Date.now(),
      ...(success && isFinalGirl(next)
        ? { special: 'final-girl' as const }
        : {}),
    }
    next.phase = 'ended'
    return next
  }
  if (next.nerve <= 0) {
    next.ending = { tier: 'bad', at: Date.now() }
    next.phase = 'ended'
    return next
  }
  checkStanding(next)
  if (next.phase === 'ended') return next
  if (next.phase === 'night') advanceNight(next)
  return next
}

export function finaleTier(
  run: RunState,
  choiceId: string,
  success: boolean,
): EndingTier {
  if (run.nerve <= 0) return 'bad'
  if (!success) return run.nerve > 3 ? 'bittersweet' : 'bad'
  if (choiceId === 'heart' && run.wins >= BEST_WINS) return 'best'
  return 'good'
}

export function endingOf(run: RunState) {
  if (!run.ending) return null
  return villainOf(run).endings[run.ending.tier]
}

export function endingKey(villain: string, tier: EndingTier): string {
  return `${villain}:${tier}`
}

export function specialKey(special: SpecialEnding): string {
  return `special:${special}`
}

/** Villain ending keys only (special endings are tallied on their own). */
export function villainEndings(keys: string[]): string[] {
  return keys.filter((k) => !k.startsWith('special:'))
}

export type DayActivity =
  | { kind: 'beat'; encounterId: string }
  | { kind: 'clue'; encounterId: string; clueId: string }
  | { kind: 'meet'; companionId: CompanionId }
  | { kind: 'rejoin'; companionId: CompanionId }
  | { kind: 'hangout'; companionId: CompanionId; step: number }
  | { kind: 'train'; skill: Skill }
  | { kind: 'shop' }
  | { kind: 'rest' }
  | { kind: 'heal' }
  | { kind: 'groceries' }

export function nextBeat(run: RunState, location: Location): string | null {
  const unseen = location.beats.filter((b) => !run.seenBeats.includes(b.id))
  if (!unseen.length) return null
  const offset = hashSeed(`${run.seed}:${location.id}`) % unseen.length
  return unseen[offset]!.id
}

export function activitiesAt(
  run: RunState,
  locationId: LocationId,
): DayActivity[] {
  const location = locationById(locationId)
  if (!location || run.phase !== 'day') return []
  const list: DayActivity[] = []
  if (location.id === 'pawnshop') list.push({ kind: 'shop' })
  const beat = nextBeat(run, location)
  if (beat) list.push({ kind: 'beat', encounterId: beat })
  if (run.revealed) {
    const clue = villainOf(run).clues.find(
      (c) => c.location === location.id && !run.clues.includes(c.id),
    )
    if (clue)
      list.push({
        kind: 'clue',
        encounterId: clue.encounter.id,
        clueId: clue.id,
      })
  }
  for (const c of COMPANIONS.filter((c) => c.location === location.id)) {
    const id = c.id as CompanionId
    if (run.crew.includes(id)) {
      // One hangout a day, with one friend standing with you.
      const step = arcProgress(run, id) + 1
      if (
        c.arc?.[step - 1] &&
        !run.shaken.includes(id) &&
        !isFinalGirl(run) &&
        !run.flags.includes(`hangout-${run.day}`)
      )
        list.push({ kind: 'hangout', companionId: id, step })
      continue
    }
    list.push(
      run.flags.includes(`recruit:${id}`)
        ? { kind: 'rejoin', companionId: id }
        : { kind: 'meet', companionId: id },
    )
  }
  if (!run.trainedToday && run.skills[location.train] < TRAIN_CAP)
    list.push({ kind: 'train', skill: location.train })
  if (
    location.id === 'crystal-street' &&
    (run.nerve < MAX_NERVE || standingOf(run).family < MAX_STANDING)
  )
    list.push({ kind: 'rest' })
  // Day stops Silas listed (2026-10-24 PT): the nurse patches you up and
  // steadies a shaken friend; the market sells the comfort food that makes a
  // night less frightening.
  if (
    location.id === 'mercy-clinic' &&
    (run.nerve < MAX_NERVE || run.shaken.length)
  )
    list.push({ kind: 'heal' })
  if (location.id === 'thriftee-mart' && run.quarters >= GROCERY_COST)
    list.push({ kind: 'groceries' })
  return list
}

export function doActivity(
  run: RunState,
  locationId: LocationId,
  activity: DayActivity,
): RunState {
  if (run.phase !== 'day' || run.current || run.actions <= 0) return run
  const allowed = activitiesAt(run, locationId).some(
    (a) => JSON.stringify(a) === JSON.stringify(activity),
  )
  if (!allowed) return run
  if (
    (activity.kind === 'meet' || activity.kind === 'rejoin') &&
    run.crew.length >= CREW_LIMIT
  )
    return run
  const next = cloneRun(run)
  next.actions -= 1
  next.shopOpen = false
  if (activity.kind === 'beat') {
    next.seenBeats.push(activity.encounterId)
    next.current = {
      id: activity.encounterId,
      kind: 'beat',
      location: locationId,
    }
  } else if (activity.kind === 'clue') {
    next.current = {
      id: activity.encounterId,
      kind: 'clue',
      location: locationId,
    }
  } else if (activity.kind === 'meet') {
    const companion = companionById(activity.companionId)
    if (companion)
      next.current = {
        id: companion.meet.id,
        kind: 'meet',
        location: locationId,
      }
  } else if (activity.kind === 'hangout') {
    const encounter = companionById(activity.companionId)?.arc?.[
      activity.step - 1
    ]
    if (encounter) {
      next.flags.push(`hangout-${next.day}`)
      next.current = { id: encounter.id, kind: 'arc', location: locationId }
    }
  } else if (activity.kind === 'rejoin') {
    next.crew.push(activity.companionId)
    shiftStanding(next, 'friends', 1)
  } else if (activity.kind === 'train') {
    if (locationId === 'library' || locationId === 'high-school')
      shiftStanding(next, 'officials', 1)
    next.skills[activity.skill] = Math.min(
      TRAIN_CAP,
      next.skills[activity.skill] + 1,
    )
    next.trained += 1
    next.trainedToday = true
  } else if (activity.kind === 'shop') {
    next.shopOpen = true
  } else if (activity.kind === 'rest') {
    next.nerve = Math.min(MAX_NERVE, next.nerve + 2)
    shiftStanding(next, 'family', 1)
  } else if (activity.kind === 'heal') {
    next.nerve = Math.min(MAX_NERVE, next.nerve + HEAL_NERVE)
    next.shaken = []
  } else if (activity.kind === 'groceries') {
    next.quarters -= GROCERY_COST
    next.nerve = Math.min(MAX_NERVE, next.nerve + 1)
    next.dread = Math.max(0, next.dread - 1)
    shiftStanding(next, 'family', 1)
  }
  return next
}

export function buy(run: RunState, itemId: ItemId): RunState {
  const item = itemById(itemId)
  if (
    !item ||
    !run.shopOpen ||
    !run.stock.includes(itemId) ||
    run.quarters < item.price ||
    run.items.includes(itemId)
  )
    return run
  const next = cloneRun(run)
  next.quarters -= item.price
  next.items.push(itemId)
  return next
}

export function useItem(run: RunState, itemId: ItemId): RunState {
  const item = itemById(itemId)
  if (!item?.consumable || !run.items.includes(itemId) || run.pending)
    return run
  const next = cloneRun(run)
  next.items = next.items.filter((i) => i !== itemId)
  if (itemId === 'first-aid') next.nerve = Math.min(MAX_NERVE, next.nerve + 2)
  if (itemId === 'jolt-cola') {
    next.nerve = Math.min(MAX_NERVE, next.nerve + 1)
    next.dread = Math.max(0, next.dread - 1)
  }
  return next
}

export function dismiss(run: RunState, companionId: CompanionId): RunState {
  if (!run.crew.includes(companionId) || run.pending) return run
  const next = cloneRun(run)
  next.crew = next.crew.filter((id) => id !== companionId)
  next.shaken = next.shaken.filter((id) => id !== companionId)
  shiftStanding(next, 'friends', -1)
  checkStanding(next)
  return next
}

function drawDeck(run: RunState, tag: Tag): string | null {
  const deck = deckByTag(tag)
  if (!deck?.encounters.length) return null
  const fresh = deck.encounters.filter((e) => !run.usedDeck.includes(e.id))
  const pool = fresh.length ? fresh : deck.encounters
  const id = pick(run, pool).id
  run.usedDeck.push(id)
  return id
}

// The week runs in three acts of two nights each, then Halloween. Each night
// deals {NIGHT_DRAWS} cards, and for each one the player chooses the nightmare's own
// deck (cards of the current act, harder, and every win earns that act's edge
// for the finale) or the street deck its kind shares (Silas, 2026-10-24 PT: "a
// night cycle where they draw from either the generic encounter deck or the
// villain deck. A villain deck should have at least 2-3 encounters for each Act,
// with remembered consequences for the finale").
export type DeckChoice = 'villain' | 'street'

export function actOf(day: number): 1 | 2 | 3 {
  return Math.min(ACTS, Math.max(1, Math.ceil(day / 2))) as 1 | 2 | 3
}

export function villainDeck(run: RunState): Encounter[] {
  const act = actOf(run.day)
  return villainOf(run).signature.filter(
    (e) => e.act === act && !run.usedDeck.includes(e.id),
  )
}

export function awaitingDraw(run: RunState): boolean {
  return (
    run.phase === 'night' &&
    !run.current &&
    !run.pending &&
    (run.draws ?? 0) > 0
  )
}

export function drawFrom(run: RunState, deck: DeckChoice): RunState {
  if (!awaitingDraw(run)) return run
  const next = cloneRun(run)
  const villainCards = villainDeck(next)
  let card: { id: string; kind: EncounterKind } | null = null
  if (deck === 'villain' && villainCards.length) {
    const id = pick(next, villainCards).id
    next.usedDeck.push(id)
    card = { id, kind: 'signature' }
  } else {
    const id = drawDeck(next, pick(next, villainOf(next).tags))
    if (id) card = { id, kind: 'night' }
  }
  next.draws = (next.draws ?? 1) - 1
  if (card) next.current = card
  else advanceNight(next)
  checkStanding(next)
  return next
}

/** Edges: one per act whose villain card you beat this week. */
export function edgesOf(run: RunState): number[] {
  return [1, 2, 3].filter((act) => run.flags.includes(`edge-${act}`))
}

function actOfSignature(run: RunState, id: string): number | null {
  return villainOf(run).signature.find((e) => e.id === id)?.act ?? null
}

function nightQueue(run: RunState): { id: string; kind: EncounterKind }[] {
  const villain = villainOf(run)
  if (run.day >= DAYS || isFinalGirl(run))
    return [{ id: villain.finale.id, kind: 'finale' }]
  run.draws = NIGHT_DRAWS
  return []
}

export function nightfall(run: RunState): RunState {
  if (run.phase !== 'day' || run.current) return run
  const next = cloneRun(run)
  next.phase = 'night'
  next.actions = 0
  next.shopOpen = false
  next.revealed = true
  next.teleported = false
  next.perksUsed = []
  next.dread = clamp(next.dread + 1, 0, MAX_DREAD)
  next.queue = nightQueue(next)
  advanceNight(next)
  return next
}

function advanceNight(run: RunState): void {
  const upcoming = run.queue.shift()
  if (upcoming) {
    run.current = { id: upcoming.id, kind: upcoming.kind }
    return
  }
  if ((run.draws ?? 0) > 0) return
  dawn(run)
}

function dawn(run: RunState): void {
  run.day += 1
  run.phase = 'day'
  run.actions = ACTIONS_PER_DAY
  run.trainedToday = false
  run.shaken = []
  run.perksUsed = []
  run.current = null
  const crew = activeCrew(run)
  if (crew.some((c) => c.perk.effect.kind === 'dawn-nerve'))
    run.nerve = Math.min(MAX_NERVE, run.nerve + 1)
  for (const c of crew)
    if (c.perk.effect.kind === 'quarters') run.quarters += c.perk.effect.amount
  rollStock(run)
}

export function emotionOf(run: RunState, companionId: string): Emotion {
  if (run.ending)
    return run.ending.tier === 'bad' || run.ending.tier === 'bittersweet'
      ? 'sad'
      : 'happy'
  if (run.shaken.includes(companionId as CompanionId)) return 'scared'
  if (run.current?.kind === 'finale') return 'determined'
  const last = run.log[run.log.length - 1]
  if (!last) return 'neutral'
  if (last.success) return run.phase === 'night' ? 'determined' : 'happy'
  return last.phase === 'night' ? 'scared' : 'angry'
}

export function caseBoard(run: RunState) {
  const villain = villainOf(run)
  return villain.clues.map((clue) => ({
    id: clue.id,
    title: clue.title,
    hint: clue.hint,
    location: clue.location,
    found: run.clues.includes(clue.id),
  }))
}

export function isRunState(value: unknown): value is RunState {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<RunState>
  return (
    v.version === SCHEMA_VERSION &&
    typeof v.seed === 'string' &&
    typeof v.villain === 'string' &&
    !!villainById(v.villain) &&
    typeof v.day === 'number' &&
    Array.isArray(v.crew) &&
    Array.isArray(v.log) &&
    !!v.skills &&
    SKILLS.every((s) => typeof v.skills?.[s] === 'number')
  )
}

const ENCOUNTER_KINDS: EncounterKind[] = [
  'beat',
  'clue',
  'meet',
  'arc',
  'night',
  'signature',
  'finale',
]

/**
 * Rebuild a saved week from localStorage, clamping every number and dropping
 * every id the game does not know, so a hand-edited or stale save can never
 * crash a screen (roadmap #4143, save tampering). Returns null when the save
 * is not a week of this schema at all.
 */
export function repairRun(value: unknown): RunState | null {
  if (!isRunState(value)) return null
  const v = value as RunState & Record<string, unknown>
  const int = (x: unknown, lo: number, hi: number, fallback: number) =>
    typeof x === 'number' && Number.isFinite(x)
      ? clamp(Math.round(x), lo, hi)
      : fallback
  const bool = (x: unknown) => x === true
  const list = (x: unknown, limit = 400) =>
    Array.isArray(x)
      ? x.filter((s): s is string => typeof s === 'string').slice(0, limit)
      : []
  const strings = (x: unknown, limit = 400) => [...new Set(list(x, limit))]
  const known = <T extends string>(x: unknown, ok: (id: string) => boolean) =>
    strings(x).filter(ok) as T[]
  const villain = villainById(v.villain)!
  const crew = known<CompanionId>(v.crew, (id) => !!companionById(id)).slice(
    0,
    CREW_LIMIT,
  )
  const archetype = archetypeById(String(v.archetype))?.id ?? ARCHETYPES[0]!.id
  const encounter = (x: unknown) => {
    const c = x as { id?: unknown; kind?: unknown; location?: unknown } | null
    if (!c || typeof c.id !== 'string' || !encounterById(c.id)) return null
    if (!ENCOUNTER_KINDS.includes(c.kind as EncounterKind)) return null
    return {
      id: c.id,
      kind: c.kind as EncounterKind,
      ...(typeof c.location === 'string' && locationById(c.location)
        ? { location: c.location as LocationId }
        : {}),
    }
  }
  const current = encounter(v.current)
  const pendingRaw = v.pending as Pending | null
  const roll = pendingRaw?.roll
  const pending =
    current &&
    pendingRaw &&
    typeof pendingRaw.choiceId === 'string' &&
    encounterById(current.id)?.choices.some(
      (c) => c.id === pendingRaw.choiceId,
    ) &&
    roll &&
    Array.isArray(roll.dice) &&
    [roll.total, roll.modifier, roll.target, ...roll.dice].every(
      (n) => typeof n === 'number' && Number.isFinite(n),
    )
      ? {
          choiceId: pendingRaw.choiceId,
          roll: {
            ...roll,
            breakdown: list(roll.breakdown, 20),
            success: roll.success === true,
          },
          rerolled: bool(pendingRaw.rerolled),
          shielded:
            typeof pendingRaw.shielded === 'string' &&
            crew.includes(pendingRaw.shielded)
              ? pendingRaw.shielded
              : null,
        }
      : null
  const phase = (['day', 'night', 'ended'] as const).includes(v.phase as 'day')
    ? v.phase
    : 'day'
  const endingRaw = v.ending as RunState['ending']
  const ending =
    endingRaw &&
    ENDING_TIERS.includes(endingRaw.tier) &&
    typeof endingRaw.at === 'number' &&
    (!endingRaw.special || endingRaw.special in SPECIAL_ENDINGS)
      ? {
          tier: endingRaw.tier,
          at: endingRaw.at,
          ...(endingRaw.special ? { special: endingRaw.special } : {}),
        }
      : null
  if (phase === 'ended' && !ending) return null
  const standing = standingOf(v)
  const log = (Array.isArray(v.log) ? v.log : [])
    .filter(
      (l): l is LogEntry =>
        !!l &&
        typeof l === 'object' &&
        typeof (l as LogEntry).encounterId === 'string' &&
        typeof (l as LogEntry).text === 'string',
    )
    .slice(-200)
  return {
    version: SCHEMA_VERSION,
    seed: v.seed.slice(0, 80),
    rng: int(v.rng, 0, 2 ** 32 - 1, hashSeed(v.seed)),
    name: String(v.name ?? 'You').slice(0, 24) || 'You',
    pronouns: String(v.pronouns ?? 'they/them').slice(0, 16) || 'they/them',
    ...(typeof v.avatar === 'string' && avatarById(v.avatar)
      ? { avatar: v.avatar }
      : {}),
    archetype,
    villain: villain.id as VillainId,
    day: int(v.day, 1, DAYS, 1),
    phase,
    actions: int(v.actions, 0, ACTIONS_PER_DAY, 0),
    skills: Object.fromEntries(
      SKILLS.map((k) => [k, int(v.skills[k], 0, SKILL_CAP, 0)]),
    ) as Record<Skill, number>,
    nerve: int(v.nerve, 0, MAX_NERVE, START_NERVE),
    dread: int(v.dread, 0, MAX_DREAD, 0),
    quarters: int(v.quarters, 0, 999, 0),
    items: known<ItemId>(v.items, (id) => !!itemById(id)),
    clues: known<string>(v.clues, (id) =>
      villain.clues.some((c) => c.id === id),
    ),
    flags: strings(v.flags),
    crew,
    shaken: known<CompanionId>(v.shaken, (id) =>
      crew.includes(id as CompanionId),
    ),
    perksUsed: known<CompanionId>(v.perksUsed, (id) => !!companionById(id)),
    trained: int(v.trained, 0, 99, 0),
    trainedToday: bool(v.trainedToday),
    seenBeats: list(v.seenBeats),
    usedDeck: list(v.usedDeck),
    shopOpen: bool(v.shopOpen),
    stock: known<ItemId>(v.stock, (id) => !!itemById(id)),
    pawnshopSpot: typeof v.pawnshopSpot === 'string' ? v.pawnshopSpot : '',
    queue: (Array.isArray(v.queue) ? v.queue : [])
      .map(encounter)
      .filter((q) => q !== null)
      .slice(0, 8),
    ...(v.draws === undefined
      ? {}
      : { draws: int(v.draws, 0, NIGHT_DRAWS, 0) }),
    teleported: bool(v.teleported),
    current,
    pending,
    standing: Object.fromEntries(
      Object.entries(standing).map(([f, n]) => [
        f,
        int(n, 0, MAX_STANDING, START_STANDING),
      ]),
    ) as Record<Faction, number>,
    revealed: bool(v.revealed),
    wins: int(v.wins, 0, 99, 0),
    rolls: int(v.rolls, 0, 9999, 0),
    log,
    ending: phase === 'ended' ? ending : null,
  }
}

export type Chip = { text: string; tone: 'good' | 'bad' | 'info' }

export function effectChips(effects: Effects): Chip[] {
  const chips: Chip[] = []
  const signed = (n: number) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`)
  if (effects.nerve)
    chips.push({
      text: `${signed(effects.nerve)} Nerve`,
      tone: effects.nerve > 0 ? 'good' : 'bad',
    })
  if (effects.dread)
    chips.push({
      text: `${signed(effects.dread)} Dread`,
      tone: effects.dread > 0 ? 'bad' : 'good',
    })
  if (effects.quarters)
    chips.push({
      text: `${signed(effects.quarters)} ¢25`,
      tone: effects.quarters > 0 ? 'good' : 'bad',
    })
  for (const [skill, n] of Object.entries(effects.skills ?? {}))
    if (n)
      chips.push({
        text: `${signed(n)} ${SKILL_LABELS[skill as Skill]}`,
        tone: n > 0 ? 'good' : 'bad',
      })
  for (const id of effects.items ?? [])
    chips.push({ text: `Got ${itemById(id)?.name ?? id}`, tone: 'good' })
  for (const id of effects.loseItems ?? [])
    chips.push({ text: `Lost ${itemById(id)?.name ?? id}`, tone: 'bad' })
  if (effects.clues?.length) chips.push({ text: 'Clue found', tone: 'good' })
  for (const flag of effects.flags ?? []) {
    if (flag.startsWith('recruit:'))
      chips.push({
        text: `${companionById(flag.slice(8))?.name ?? 'Someone'} joins`,
        tone: 'good',
      })
    else if (flag === 'crew-shaken')
      chips.push({ text: 'A friend is shaken', tone: 'bad' })
  }
  if (effects.teleport)
    chips.push({ text: `Pulled into ${effects.teleport}`, tone: 'info' })
  return chips
}

export const ART_STYLE =
  'painted 1986 horror-comedy VHS box art, airbrushed gouache, hot magenta and cyan neon rim light, deep midnight purple shadows, suburban Halloween atmosphere, playful spooky mood'

export function artPath(kind: string, id: string): string {
  return `/crystal-street/${kind}/${id}.webp`
}
