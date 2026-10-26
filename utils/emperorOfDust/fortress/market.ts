// The market (conductor emperor-of-dust t-024, SYSTEMS-V03.md "Market —
// equipment"): seeded stalls that turn over three times an act, selling back
// to the stalls, and treatments for the wounded. Bed upgrades stay in the
// engine (`upgradeBeds`); the market shows the carpenters too.
//
// Stock is a pure function of the run: the seed, the branch and the stock
// window rank every item, and what is eligible (who trades with the court
// today) decides what is laid out. A rewind bumps the branch, so a replayed
// window lays out fresh stock ("random stays random"); within a branch the same
// state always shows the same stalls.
import {
  KINGDOM_FACTION_DEFS,
  LOCAL_FACTION_DEFS,
  affinityTier,
} from './factions'
import {
  actOf,
  applyEffects,
  followerStatus,
  injuryDaysLeft,
  rollFor,
} from './engine'
import { LAST_DAY } from './content'
import { followerDef } from './followers'
import { ITEMS, itemDef } from './items'
import { AFFINITY_TIERS } from './types'
import type {
  AbilityKind,
  AffinityTier,
  Effects,
  FortressRun,
  ItemDef,
  KingdomFactionId,
  LocalFactionId,
} from './types'

/** Stalls always lay out at least this many items when that many are eligible. */
export const MIN_STOCK = 4
/** Percent chance an eligible item is on the stalls in a window. */
export const STOCK_CHANCE = 35
/** Act V: the host faction's goods travel with the court; others thin out. */
export const HOST_STOCK_CHANCE = 80
export const EXILE_STOCK_CHANCE = 20
/** Selling returns this share of the price, rounded down. */
export const SELL_SHARE = 0.5
export const SURGEON_BASE = 8
export const SURGEON_PER_DAY = 2
/** Saltroad medicine takes this share off the surgeon's fee while they are Friendly. */
export const SALTROAD_DISCOUNT = 0.25
export const POULTICE_PRICE = 5
export const INFIRMARY_BASE = 9
export const INFIRMARY_PER_DAY = 3

const clone = (run: FortressRun): FortressRun =>
  JSON.parse(JSON.stringify(run)) as FortressRun

const tierRank = (tier: AffinityTier): number => AFFINITY_TIERS.indexOf(tier)

const factionName = (id: KingdomFactionId): string =>
  KINGDOM_FACTION_DEFS.find((def) => def.id === id)?.name ?? id

const localName = (id: LocalFactionId): string =>
  LOCAL_FACTION_DEFS.find((def) => def.id === id)?.name ?? id

const TIER_NAME: Record<AffinityTier, string> = {
  hostile: 'Hostile',
  wary: 'Wary',
  neutral: 'Neutral',
  friendly: 'Friendly',
  allied: 'Allied',
}

// --- stock windows ------------------------------------------------------------

/**
 * Stalls turn over three times an act: days 1-3, 4-6 and 7-10 of each act.
 * Windows count from 0 across the campaign (Act II's first stall is 3).
 */
export const marketWindow = (day: number): number => {
  const act = actOf(day)
  const inAct = Math.max(0, day - (act - 1) * 10 - 1)
  return (act - 1) * 3 + Math.min(2, Math.floor(inAct / 3))
}

/** The first day of the next stock window. */
export const nextRestockDay = (day: number): number => {
  let next = day + 1
  while (next <= LAST_DAY && marketWindow(next) === marketWindow(day)) next += 1
  return next
}

const factionTrading = (run: FortressRun, id: KingdomFactionId): boolean =>
  run.revealedFactions.includes(id) && !run.wipedOut.includes(id)

/**
 * Why an item is not on the stalls this window, or null when it is eligible.
 * The market shows these reasons so the player learns what a road would open.
 */
export const stockBlocker = (
  run: FortressRun,
  item: ItemDef,
): string | null => {
  if (item.faction) {
    if (run.wipedOut.includes(item.faction))
      return `${factionName(item.faction)}: gone from the map`
    if (!run.revealedFactions.includes(item.faction))
      return 'Nobody on the map makes these yet'
    const need = item.stock?.tier ?? 'neutral'
    if (tierRank(affinityTier(run.affinity[item.faction])) < tierRank(need))
      return `Needs ${factionName(item.faction)} ${TIER_NAME[need]}`
  }
  for (const [id, min] of Object.entries(item.stock?.local ?? {})) {
    if (run.local[id as LocalFactionId] < (min ?? 0))
      return `Needs ${localName(id as LocalFactionId)} ${min}`
  }
  return null
}

const stockChance = (run: FortressRun, item: ItemDef): number => {
  if (actOf(run.day) < 5 || !run.hideout) return STOCK_CHANCE
  const host = HOST_OF[run.hideout]
  if (item.faction && item.faction === host) return HOST_STOCK_CHANCE
  return item.faction ? EXILE_STOCK_CHANCE : STOCK_CHANCE
}

/** Act V hideout -> the faction whose people run its peddler. */
const HOST_OF: Record<string, KingdomFactionId | undefined> = {
  'mole-tunnels': 'moles',
  'crow-cave': 'storm-crows',
  'bell-cellars': 'hollow-bell',
  'wagon-circle': 'jackalwire',
  'moving-caravan': 'saltroad',
  'freehold-barn': 'freeholds',
  'rail-station': 'rustline',
}

/** Whether the court is in hiding and buys from a peddler, not the market. */
export const isPeddler = (run: FortressRun): boolean =>
  actOf(run.day) >= 5 && !!run.hideout

/**
 * The window's layout, in catalog order: every eligible item whose seeded
 * roll clears its chance, topped up to MIN_STOCK with the next-best rolls.
 * Each item rolls on its own, so a faction warming mid-window adds its goods
 * without taking anything else off the stalls.
 */
export const marketStock = (run: FortressRun): string[] => {
  const window = marketWindow(run.day)
  const eligible = ITEMS.filter((item) => stockBlocker(run, item) === null)
  const rolled = eligible.map((item) => ({
    id: item.id,
    roll: rollFor(run, `stock:${window}:${item.id}`),
    chance: stockChance(run, item),
  }))
  const shown = new Set(
    rolled
      .filter((entry) => entry.roll < entry.chance)
      .map((entry) => entry.id),
  )
  const spare = rolled
    .filter((entry) => !shown.has(entry.id))
    .sort((a, b) => a.roll - b.roll || a.id.localeCompare(b.id))
  while (shown.size < MIN_STOCK && spare.length) shown.add(spare.shift()!.id)
  return ITEMS.map((item) => item.id).filter((id) => shown.has(id))
}

/** Bought from this window's stalls already (each item is laid out once). */
export const boughtThisWindow = (run: FortressRun): string[] =>
  run.market?.window === marketWindow(run.day) ? run.market.bought : []

/** Followers treated today: each can be seen once a day. */
export const treatedToday = (run: FortressRun): string[] =>
  run.market?.day === run.day ? run.market.treated : []

const marketState = (run: FortressRun): NonNullable<FortressRun['market']> => ({
  window: marketWindow(run.day),
  bought: [...boughtThisWindow(run)],
  day: run.day,
  treated: [...treatedToday(run)],
})

// --- buying and selling -------------------------------------------------------

export const buyItem = (run: FortressRun, itemId: string): FortressRun => {
  const item = itemDef(itemId)
  if (!item) throw new Error(`unknown item: ${itemId}`)
  if (boughtThisWindow(run).includes(itemId))
    throw new Error('Sold. The stall has no other.')
  if (!marketStock(run).includes(itemId))
    throw new Error('That is not on the stalls today')
  if (run.brass < item.price) throw new Error(`Needs ${item.price} brass`)
  const next = clone(run)
  next.brass -= item.price
  next.inventory.push(itemId)
  const market = marketState(next)
  market.bought.push(itemId)
  next.market = market
  if (item.onBuy) applyEffects(next, item.onBuy)
  return next
}

export const sellPrice = (item: ItemDef): number =>
  Math.floor(item.price * SELL_SHARE)

/** Sell an unequipped storeroom item back to the stalls. */
export const sellItem = (run: FortressRun, itemId: string): FortressRun => {
  const item = itemDef(itemId)
  if (!item) throw new Error(`unknown item: ${itemId}`)
  const index = run.inventory.indexOf(itemId)
  if (index < 0) throw new Error('the storeroom does not hold that')
  const next = clone(run)
  next.inventory.splice(index, 1)
  next.brass += sellPrice(item)
  return next
}

// --- treatments ---------------------------------------------------------------

export type TreatmentKind = 'surgeon' | 'poultice' | 'infirmary'

/** The caravans bring medicine while the Saltroad is Friendly. */
export const saltroadMedicine = (run: FortressRun): boolean =>
  factionTrading(run, 'saltroad') &&
  tierRank(affinityTier(run.affinity.saltroad)) >= tierRank('friendly')

/** The Mire Mothers sell poultices to anyone they are not hostile to. */
export const poulticeOffered = (run: FortressRun): boolean =>
  factionTrading(run, 'mire-mothers') &&
  tierRank(affinityTier(run.affinity['mire-mothers'])) >= tierRank('wary')

/** The surgeon's fee: deeper wounds cost more; Saltroad medicine is cheaper. */
export const surgeonPrice = (run: FortressRun, followerId: string): number => {
  const base = SURGEON_BASE + SURGEON_PER_DAY * injuryDaysLeft(run, followerId)
  return saltroadMedicine(run)
    ? Math.ceil(base * (1 - SALTROAD_DISCOUNT))
    : base
}

export const treatmentPrice = (
  run: FortressRun,
  followerId: string,
  kind: TreatmentKind,
): number =>
  kind === 'surgeon'
    ? surgeonPrice(run, followerId)
    : kind === 'infirmary'
      ? INFIRMARY_BASE + INFIRMARY_PER_DAY * injuryDaysLeft(run, followerId)
      : POULTICE_PRICE

/** Why a follower cannot be treated this way now, or null. */
export const treatmentBlocker = (
  run: FortressRun,
  followerId: string,
  kind: TreatmentKind,
): string | null => {
  const status = followerStatus(run, followerId)
  if (status !== 'injured') return 'Only the wounded at court'
  if (treatedToday(run).includes(followerId)) return 'Seen today already'
  if (kind === 'infirmary' && followerStatus(run, 'F003') !== 'ready')
    return 'Kiyo must be at the infirmary to offer intensive care'
  if (kind === 'poultice' && !poulticeOffered(run))
    return 'No Mire woman will come'
  const price = treatmentPrice(run, followerId, kind)
  if (run.brass < price) return `Needs ${price} brass`
  return null
}

export type TreatmentResult = {
  run: FortressRun
  /** Injury days taken off; negative when the poultice went bad. */
  healed: number
  text: string
}

/**
 * Paid surgery restores a wounded follower to duty immediately, even for
 * an old save with a longer wound. Kiyo provides guaranteed intensive care;
 * a Mire poultice is cheaper but unreliable. The Abbey hears.
 */
export const treatFollower = (
  run: FortressRun,
  followerId: string,
  kind: TreatmentKind,
): TreatmentResult => {
  const blocker = treatmentBlocker(run, followerId, kind)
  if (blocker) throw new Error(blocker)
  const name = followerDef(followerId)?.name ?? followerId
  const next = clone(run)
  next.brass -= treatmentPrice(run, followerId, kind)
  const market = marketState(next)
  market.treated.push(followerId)
  next.market = market
  const state = next.roster.find((entry) => entry.id === followerId)!
  let healed = injuryDaysLeft(run, followerId)
  let text = `The surgeon works by lamp. ${name} is fit for duty today.`
  if (kind === 'infirmary') {
    healed = injuryDaysLeft(run, followerId)
    text = `Kiyo works swiftly. ${name} can return to duty today. The court pays for the medicines, not the kindness.`
  }
  if (kind === 'poultice') {
    const roll = rollFor(run, `poultice:${run.day}:${followerId}`)
    healed = roll < 50 ? injuryDaysLeft(run, followerId) : 0
    text =
      healed > 0
        ? `The poultice smells of the fen. ${name} can ride again today.`
        : `The poultice dries and cracks. Nothing changes; ${name} must rest until dawn.`
    applyEffects(next, { affinity: { abbey: -1 } })
  }
  const until = (state.injuredUntilDay ?? next.day) - healed
  state.injuredUntilDay = Math.max(next.day, until)
  return { run: next, healed, text }
}

// --- describing items -----------------------------------------------------------

const ABILITY_TEXT: Partial<Record<AbilityKind, (amount: number) => string>> = {
  'field-surgery': (n) => `Wounds heal ${n} day${n === 1 ? '' : 's'} sooner`,
  swift: () => 'Quests take a day less',
  scout: () => 'Shows hidden requirements',
  guardian: (n) => `Party injury chance −${n}`,
  lucky: () => 'Rolls twice, keeps the better',
  confessor: () => 'On success, companions’ secrets come out',
  warden: () => 'Nobody dies on the quest',
  bounty: (n) => `+${n} brass on success`,
  omen: () => 'A failure becomes a partial',
  apology: () => 'Goodwill lost on a bad result is halved',
  encore: () => 'Triumph far more often',
  chronicle: () => 'Shows the board’s hidden requirements',
  'jury-rig': () => 'Shores up the weakest requirement',
}

const STAT_NAME: Record<string, string> = {
  might: 'Might',
  guile: 'Guile',
  wits: 'Wits',
  heart: 'Heart',
  lore: 'Lore',
}

/** What an item does, as short clauses. */
export const itemEffects = (item: ItemDef): string[] => [
  ...Object.entries(item.stats ?? {}).map(
    ([stat, amount]) => `+${amount} ${STAT_NAME[stat] ?? stat}`,
  ),
  ...(item.edge
    ? [
        `+${item.edge.amount} on ${
          item.edge.faction
            ? `${factionName(item.edge.faction)}`
            : `${item.edge.tag}`
        } quests`,
      ]
    : []),
  ...(item.ability
    ? [
        ABILITY_TEXT[item.ability.kind]?.(item.ability.amount) ??
          item.ability.kind,
      ]
    : []),
]

const signed = (delta: number) => (delta > 0 ? `+${delta}` : `−${-delta}`)

/** Who reacts when it is bought, as short clauses ("The Abbey −3"). */
export const effectReactions = (effects: Effects | undefined): string[] => [
  ...Object.entries(effects?.affinity ?? {}).map(
    ([id, delta]) =>
      `${factionName(id as KingdomFactionId)} ${signed(delta ?? 0)}`,
  ),
  ...Object.entries(effects?.local ?? {}).map(
    ([id, delta]) => `${localName(id as LocalFactionId)} ${signed(delta ?? 0)}`,
  ),
]

/** The seller's name for an item, or the fortress stores. */
export const itemSource = (item: ItemDef): string =>
  item.faction ? factionName(item.faction) : 'Fortress stores'

// --- the stalls ---------------------------------------------------------------

/** Who is laying out goods, one line per seller, staples last. */
const STALL_LINES: Record<KingdomFactionId | 'stores', string> = {
  'hollow-bell': 'A Hollow Bell tinker with bells on a string.',
  abbey: 'Two Abbey sisters with candles. They smile at the children.',
  'storm-crows':
    'A Conclave trader at the well sells glass. The trader does not blink.',
  'mire-mothers':
    'A fen woman with a reed basket. The sisters cross the yard to miss her.',
  jackalwire:
    'A Pack rider leans on the gate. His wire is good. His prices are not.',
  saltroad: 'Saltroad mules in the yard. Salt on everything.',
  freeholds: 'A Freehold cart. Tools, a tired dog, no smiles.',
  moles: 'A tunnel trader sells lamps from a sack and watches the Gate Watch.',
  rustline:
    'Rustline merchants lay salvage out on oilcloth. Nobody asks where it was dug up.',
  'black-verge': 'A broker in a velvet coat. He sells from the shade only.',
  stores: 'The quartermaster unlocks the stores and counts out loud.',
}

/** The stall-keepers present this window, as short lines. */
export const stallLines = (run: FortressRun): string[] => {
  if (isPeddler(run))
    return ['One mule, two packs. The peddler does not haggle.']
  const sellers = new Set<string>(
    marketStock(run).map((id) => itemDef(id)?.faction ?? 'stores'),
  )
  const order: (KingdomFactionId | 'stores')[] = [
    ...KINGDOM_FACTION_DEFS.map((def) => def.id),
    'stores',
  ]
  return order.filter((id) => sellers.has(id)).map((id) => STALL_LINES[id])
}
