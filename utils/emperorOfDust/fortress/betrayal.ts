// Young Komodo's betrayal and the court in hiding (conductor emperor-of-dust
// t-028; SYSTEMS-V03 "Young Komodo and the betrayal" and "The final act: the
// hideout"). The betrayal always comes at the Day 41 dawn. Play decides three
// things, all read from the run's state and never rolled:
//
// - who Komodo sells the tower to. His bargain is always with the Abbess, so
//   the Abbey holds it unless the run made another hand more plausible: a
//   Black Verge the crown kept crossing, or Old Houses the crown had lost;
// - who goes with him: followers whose hidden allegiance points at the buyer,
//   and followers nobody at court ever sat with while their people were
//   crossed. A sealed romance, a heard story or being away on a quest keeps
//   them; never more than three go, and never so many that the court is left
//   without hands;
// - what the court lives on in hiding: the host's share, not the regions'
//   taxes, and half wages, because the host feeds the court.
import { KINGDOM_FACTION_DEFS, affinityTier } from './factions'
import { followerDef } from './followers'
import { TALKS } from './talks'
import { AFFINITY_TIERS, gateHolds, pickVariant, variantText } from './types'
import type {
  AffinityTier,
  BuyerId,
  DepartureWhy,
  FlagGate,
  FollowerDef,
  FollowerState,
  FortressRun,
  KingdomFactionId,
  LocalFactionId,
  TextVariant,
  TraitDef,
} from './types'

/** The dawn the tower falls. */
export const BETRAYAL_DAY = 41
const BETRAYAL = 'komodo-betrayal'

// --- the buyer --------------------------------------------------------------

export type BuyerDef = {
  id: BuyerId
  name: string
  /** The banner over the tower, as the dawn and the briefings name it. */
  banner: string
  /** Hidden allegiances to this kingdom faction pull followers after him. */
  faction?: KingdomFactionId
  local?: LocalFactionId
  /** How the tower changed hands, for the Day 41 dawn. */
  fell: string
  /** Why this buyer, in the run's own terms. */
  why: string
  /** The whole fall, as runs holding certain flags read it (t-040). */
  fellVariants?: TextVariant[]
  whyVariants?: TextVariant[]
}

/**
 * Bought on Day 37 (d37-verge-terms): while the peace holds the Verge does
 * not bid for the tower. A common front at the long table breaks it.
 */
export const VERGE_PEACE = 'd37-verge-peace'
export const VERGE_PEACE_BROKEN = 'congress-common-front'
export const vergeAtPeace = (run: FortressRun): boolean =>
  run.flags.includes(VERGE_PEACE) && !run.flags.includes(VERGE_PEACE_BROKEN)

/** The sentence every buyer's fall opens with, unless the last night changed it. */
export const FALL_OPENING =
  'Young Komodo opened the gate at midnight with your seal.'

/**
 * The fall's first sentence as the last night's precautions left it (t-040):
 * the first match replaces FALL_OPENING for every buyer. The tower still falls.
 */
export const FALL_OPENINGS: TextVariant[] = [
  {
    flags: ['d40-komodo-held'],
    text: 'Young Komodo spent midnight in your cells. He left by the drain in the Mole boy’s old cell, and the postern was already open.',
  },
  {
    flags: ['d40-seals-checked'],
    text: 'Young Komodo opened the gate at midnight with an order you had read. The thirty-first in his stack: a pass for the Abbey’s soup cart. It said exactly what it said.',
  },
  {
    flags: ['d40-watch-recalled'],
    text: 'The Watch stood the walls at midnight, as you ordered. Young Komodo did not need the walls. Sergeant Holloway lifted the bar for him from inside.',
  },
  {
    flags: ['komodo-escorted'],
    text: 'Young Komodo rode out with Dunmark at his side, as you ordered. At the Abbey he showed the sisters your seal, and the sisters showed Dunmark a cot. At midnight your seal opened your gate without him.',
  },
  {
    flags: ['d40-seal-order-stood'],
    text: 'Half the Watch was on the mission road by your order. Young Komodo opened the gate at midnight with your seal, and nobody stood behind it to ask.',
  },
]

/** How the tower fell and why, as this run reads them. */
export const fallText = (
  run: FortressRun,
  buyer: BuyerDef,
): { fell: string; why: string } => {
  const opening = variantText(run.flags, FALL_OPENING, FALL_OPENINGS)
  const fell = buyer.fell.startsWith(FALL_OPENING)
    ? opening + buyer.fell.slice(FALL_OPENING.length)
    : buyer.fell
  return {
    fell: variantText(run.flags, fell, buyer.fellVariants),
    why: variantText(run.flags, buyer.why, buyer.whyVariants),
  }
}

export const BUYERS: Record<BuyerId, BuyerDef> = {
  abbey: {
    id: 'abbey',
    name: 'The Abbey',
    banner: 'the Abbey’s grey banner',
    faction: 'abbey',
    fell: 'Young Komodo opened the gate at midnight with your seal. The grey sisters came in with lanterns and soup. By dawn the tower flies the Abbey’s grey banner.',
    why: 'He sold to the Abbess. He always had. Nobody the crown had crossed was strong enough to outbid her.',
    // The thirty-sixth night, paid off (playtest act4 R4).
    whyVariants: [
      {
        flags: ['d36-komodo-at-rehearsal'],
        text: 'You sent him to her yourself, on the thirty-sixth night. They had three hours. It was enough to agree a price.',
      },
      {
        flags: ['rehearsal-attended'],
        text: 'She held your hand three hours on the thirty-sixth night. She remembered the warmth. She bought the rest of you from him.',
      },
    ],
  },
  'black-verge': {
    id: 'black-verge',
    name: 'The Black Verge',
    banner: 'the plum banner of the Black Verge',
    faction: 'black-verge',
    fell: 'Young Komodo opened the gate at midnight with your seal. Plum riders came through it at a walk. By dawn the tower flies the plum banner of the Black Verge. The Abbess paid for the horses.',
    why: 'The crown made an enemy of the Black Verge. Its riders outnumber the sisters. The Abbess let them have the walls.',
    whyVariants: [
      {
        flags: [VERGE_PEACE, VERGE_PEACE_BROKEN],
        text: 'The crown bought a peace from the Verge and broke it at the long table two days later. The Verge does not take apologies. It took the gate.',
      },
      {
        flags: ['d37-verge-refused'],
        text: 'The envoy named three prices on the thirty-seventh day. The crown paid none of them. Komodo named a fourth.',
      },
    ],
  },
  'old-houses': {
    id: 'old-houses',
    name: 'House Vask',
    banner: 'the black swan of House Vask',
    local: 'old-houses',
    fell: 'Young Komodo opened the gate at midnight with your seal. Lady Vask’s sons were already in the yard. By dawn the tower flies the black swan of House Vask. The Abbess sent flowers.',
    why: 'The crown lost the Old Houses. Komodo had paid Lady Vask’s house for two years. It was ready.',
    whyVariants: [
      {
        flags: ['d37-vask-son-sent'],
        text: 'The crown sent Lady Vask’s son to winter with the Verge. Komodo told her where to send the bill.',
      },
      {
        flags: ['d37-houses-surety'],
        text: 'The Old Houses stood surety for the crown on the thirty-seventh day, and Komodo signed as witness. He had paid Lady Vask’s house for two years. The crown lost them anyway.',
      },
      {
        // t-043: the Day 10 oath named the Houses beside the crown.
        flags: ['d10-oath-names-houses'],
        text: 'On the tenth day the Watch swore to the crown and to the Houses that fed it. On the last night the Houses called in their half. The young sentries who had said Lady Vask’s name stood aside for her sons.',
      },
    ],
  },
}

export const BUYER_IDS = Object.keys(BUYERS) as BuyerId[]

/**
 * Slights the Black Verge remembers. Three of them, or an open feud, and a
 * Verge stronger than the Abbey takes the walls instead of the sisters.
 */
export const VERGE_SLIGHTS: readonly string[] = [
  'd16-border-silver-seized',
  'd20-verge-answered',
  'chose:d28-verge-envoy:refuse',
  'd28-pups-asked',
  'sable-sheltered',
  'sable-hidden',
  'congress-common-front',
  'd37-verge-refused',
]
export const VERGE_SLIGHTS_NEEDED = 3
/** Old Houses support at or below this on the last night: Lady Vask is ready. */
export const OLD_HOUSES_LOST = 3

const tierRank = (tier: AffinityTier): number => AFFINITY_TIERS.indexOf(tier)

const stands = (run: FortressRun, faction: KingdomFactionId): boolean =>
  run.revealedFactions.includes(faction) && !run.wipedOut.includes(faction)

export const vergeSlights = (run: FortressRun): number =>
  VERGE_SLIGHTS.filter((flag) => run.flags.includes(flag)).length

/**
 * Who takes the tower, from the run as it stands on the last night. The
 * Abbey by default; the Verge when the crown kept crossing a Verge stronger
 * than the Abbey; House Vask when the crown lost the Old Houses.
 */
export const selectBuyer = (run: FortressRun): BuyerId => {
  const verge = 'black-verge'
  if (
    !vergeAtPeace(run) &&
    stands(run, verge) &&
    (run.strength[verge] > run.strength.abbey || !stands(run, 'abbey')) &&
    (vergeSlights(run) >= VERGE_SLIGHTS_NEEDED ||
      affinityTier(run.affinity[verge]) === 'hostile')
  )
    return verge
  if (run.local['old-houses'] <= OLD_HOUSES_LOST) return 'old-houses'
  return 'abbey'
}

/** The buyer this run's betrayal chose; older saves read as the Abbey. */
export const buyerOf = (run: FortressRun): BuyerId | undefined => {
  const flag = run.flags.find((entry) => entry.startsWith('buyer:'))
  const id = flag?.slice('buyer:'.length) as BuyerId | undefined
  if (id && id in BUYERS) return id
  return run.flags.includes(BETRAYAL) ? 'abbey' : undefined
}

// --- who goes with him ------------------------------------------------------

/** No more than this many followers leave with Komodo. */
export const MAX_DEPARTURES = 3
/** Followers the court always keeps (alive, not gone), away ones included. */
export const MIN_LEFT = 4
/** Neglect needs time: at court since this day or earlier. */
export const NEGLECT_JOINED_BY = BETRAYAL_DAY - 11
/** Local support at or below this: the follower's people are losing faith. */
export const LOCAL_CROSSED = 5
/**
 * How far below where it started a kingdom faction must fall, by the crown's
 * hand, before a follower born to it goes home to it (t-041).
 */
export const KIN_FALL = 20

const ROMANCE_NAMES: Record<string, string> = {
  F001: 'rook',
  F002: 'saffron',
  F006: 'nera',
  F007: 'ash',
  F016: 'sable',
  F018: 'vesper',
}

export const romanceSealed = (run: FortressRun, id: string): boolean => {
  const name = ROMANCE_NAMES[id]
  return !!name && run.flags.includes(`romance-${name}-sealed`)
}

/** A follower's talks that can happen while the tower stands. */
export const towerTalks = (id: string) =>
  TALKS.filter(
    (talk) =>
      talk.follower === id && !(talk.requires?.flags ?? []).includes(BETRAYAL),
  )

export const talksHeardWith = (run: FortressRun, id: string): number =>
  towerTalks(id).filter((talk) => (run.talksHeard ?? []).includes(talk.id))
    .length

/**
 * Their story heard: the emperor sat with them at least twice (or through
 * every talk they had, when they had fewer).
 */
export const storyHeard = (run: FortressRun, id: string): boolean => {
  const total = towerTalks(id).length
  return total > 0 && talksHeardWith(run, id) >= Math.min(2, total)
}

const allegianceTo = (
  def: FollowerDef,
  faction: KingdomFactionId | undefined,
): TraitDef | undefined =>
  faction === undefined
    ? undefined
    : def.traits.find(
        (trait) =>
          trait.kind === 'allegiance' &&
          trait.trigger.faction === faction &&
          trait.amount > 0,
      )

/** How the follower's own people stand with the crown, if they are crossed. */
export const peopleCrossed = (
  run: FortressRun,
  def: FollowerDef,
): string | null => {
  const origin = def.origin
  if (origin in run.local) {
    return run.local[origin as LocalFactionId] <= LOCAL_CROSSED
      ? 'are losing faith in the throne'
      : null
  }
  const faction = origin as KingdomFactionId
  // Estranged from their own people (Tamsin, Sable): no pull either way.
  if (
    def.traits.some(
      (trait) =>
        trait.kind === 'allegiance' &&
        trait.trigger.faction === faction &&
        trait.amount < 0,
    )
  )
    return null
  if (run.wipedOut.includes(faction)) return 'are gone from the map'
  const tier = affinityTier(run.affinity[faction])
  if (tierRank(tier) > tierRank('wary')) return null
  return tier === 'hostile'
    ? 'are hostile to the crown'
    : 'are wary of the crown'
}

/**
 * Followers the crown itself sent to the buyer's door before the last night
 * (t-038): they go when that buyer calls, whoever sat with them. A sealed
 * romance still keeps them.
 */
export const CALLED_HOME: readonly {
  follower: string
  flags: string[]
  buyer: BuyerId
}[] = [{ follower: 'F012', flags: ['d36-teodor-at-rehearsal'], buyer: 'abbey' }]

const calledHome = (run: FortressRun, buyer: BuyerId, id: string): boolean =>
  CALLED_HOME.some(
    (entry) =>
      entry.follower === id &&
      entry.buyer === buyer &&
      entry.flags.every((flag) => run.flags.includes(flag)),
  )

/**
 * The crown turned the follower's own people against it (t-041): a fortress
 * faction losing faith, a kingdom faction gone from the map, Hostile, or Wary
 * and at least KIN_FALL below where it stood on Day 1. A people who were
 * always wary of the crown do not count; a people the crown made wary do.
 * Followers estranged from their people feel no pull.
 */
export const peopleBroken = (
  run: FortressRun,
  def: FollowerDef,
): string | null => {
  const crossed = peopleCrossed(run, def)
  if (!crossed || def.origin in run.local) return crossed
  const faction = def.origin as KingdomFactionId
  if (crossed !== 'are wary of the crown') return crossed
  const start =
    KINGDOM_FACTION_DEFS.find((entry) => entry.id === faction)?.startAffinity ??
    0
  return run.affinity[faction] <= start - KIN_FALL
    ? 'turned wary of the crown'
    : null
}

export type DepartureCheck =
  { why: DepartureWhy } | { why: null; kept?: 'away' | 'romance' | 'story' }

/** Whether this follower would leave with Komodo for this buyer, and why. */
export const departureCheck = (
  run: FortressRun,
  buyer: BuyerId,
  state: FollowerState,
): DepartureCheck => {
  const def = followerDef(state.id)
  if (!def || state.dead || state.departed) return { why: null }
  if (run.active.some((quest) => quest.party.includes(state.id)))
    return { why: null, kept: 'away' }
  if (romanceSealed(run, state.id)) return { why: null, kept: 'romance' }
  if (calledHome(run, buyer, state.id)) return { why: 'allegiance' }
  // Sitting with someone does not outweigh turning their people (t-041).
  if (talksHeardWith(run, state.id) > 0 && peopleBroken(run, def))
    return { why: 'kin' }
  if (storyHeard(run, state.id)) return { why: null, kept: 'story' }
  if (allegianceTo(def, BUYERS[buyer].faction)) return { why: 'allegiance' }
  if (
    talksHeardWith(run, state.id) === 0 &&
    state.joinedDay <= NEGLECT_JOINED_BY &&
    peopleCrossed(run, def)
  )
    return { why: 'neglect' }
  return { why: null }
}

// --- what the careful crown saved (t-038) -------------------------------------

/**
 * A precaution the last nights left standing. Every one gets its line on the
 * betrayal page; each that `guards` the tower lowers how many can go with
 * Komodo, down to GUARDED_FLOOR. The tower still falls.
 */
export type Precaution = FlagGate & {
  id: string
  line: string
  guards?: boolean
}

export const PRECAUTIONS: readonly Precaution[] = [
  {
    id: 'secret-tunnel',
    flags: ['d35-tunnel-secret', 'route-tunnel'],
    notFlags: ['quest:q-d35-tunnel:partial'],
    guards: true,
    line: 'He sent riders down the trestle road after you. You were not on it. Granny Umber’s chalk took the court under the badlands, and nobody followed.',
  },
  {
    id: 'rosters',
    flags: ['d38-rosters-changed'],
    guards: true,
    line: 'The rosters he carried up the mission road were a week old. Dunmark’s new ones put the right people on the wrong walls. It cost him an hour.',
  },
  {
    id: 'watch-recalled',
    flags: ['d40-watch-recalled'],
    guards: true,
    line: 'The Watch was on the walls when the bar came up. Most of them came out with you, in order, spears first.',
  },
  {
    id: 'seals-checked',
    flags: ['d40-seals-checked'],
    guards: true,
    line: 'He had one order you had read, and nothing else. The rest of his stack was grain chits.',
  },
  {
    id: 'komodo-held',
    flags: ['d40-komodo-held'],
    guards: true,
    line: 'He lost the first hour of the night in a cell. The court did not lose it.',
  },
  {
    id: 'militia-on-gate',
    flags: ['d34-militia-on-gate'],
    guards: true,
    line: 'The Freehold sergeant had the gate at midnight. He would not lift the bar for a seal. They lifted it over him. His thirty held the yard until the court was out.',
  },
  {
    id: 'escorted',
    flags: ['komodo-escorted'],
    guards: true,
    line: 'The doubled watch was still on the gate when it opened. They did not stop it. They saw who came through, and they said so.',
  },
  {
    id: 'archive-evacuated',
    flags: ['archive-evacuated'],
    guards: true,
    line: 'The sisters found the Archive’s shelves bare. Vellum’s crates were already on the back road.',
  },
  {
    id: 'archive-bait',
    flags: ['d40-archive-bait'],
    notFlags: ['archive-evacuated'],
    line: 'He came to the Archive at eleven and asked for the forty orders by number. Vellum gave him the wrong forty.',
  },
  {
    id: 'followed',
    flags: ['d40-komodo-followed'],
    line: 'Rook was on the ridge when the gate opened. “He walked his horse back in the old ruts,” the hare says. “I know which ruts now.”',
  },
  {
    id: 'sealed-name',
    flags: ['d40-vellum-sealed-name'],
    line: 'At dawn you find Vellum’s slip in your sleeve. The wax is whole. You never got to read it alone. One word. You knew it.',
  },
]

/** However careful the crown, Komodo takes at least this many he can reach. */
export const GUARDED_FLOOR = 1

export const precautionsTaken = (run: FortressRun): Precaution[] =>
  PRECAUTIONS.filter((entry) => gateHolds(run.flags, entry))

/** How many can go with Komodo, after the guards the crown set. */
export const departureCap = (run: FortressRun): number => {
  const guards = precautionsTaken(run).filter((entry) => entry.guards).length
  return guards
    ? Math.max(GUARDED_FLOOR, MAX_DEPARTURES - guards)
    : MAX_DEPARTURES
}

/**
 * The note under the seal on the gatehouse table: the answer the crown gave
 * the physician question, kept (playtest act4 R8.3).
 */
export const KOMODO_NOTES: readonly TextVariant[] = [
  {
    flags: ['d40-komodo-told-ask'],
    text: 'You said to ask. I am asking now, and you are not here to answer. Forgive the hat.',
  },
  {
    flags: ['d40-komodo-told-do-it'],
    text: 'You said that is what love is for. I am holding you to it.',
  },
  {
    flags: ['d40-komodo-told-no-cure'],
    text: 'You said there is no such cure. You were right. I am selling it anyway.',
  },
  {
    flags: ['d40-komodo-asked-who'],
    text: 'You asked who. Ask the Abbess what she charges.',
  },
]

/**
 * Who goes: allegiance, then kin, then neglect, then in the order they
 * joined; at most `cap` (MAX_DEPARTURES less the crown's guards), and never
 * below MIN_LEFT followers left to the court.
 */
export const selectDepartures = (
  run: FortressRun,
  buyer: BuyerId,
  cap: number = departureCap(run),
): { followerId: string; why: DepartureWhy }[] => {
  const present = run.roster.filter((state) => !state.dead && !state.departed)
  const room = Math.max(0, Math.min(cap, present.length - MIN_LEFT))
  const leaving = present.flatMap((state) => {
    const check = departureCheck(run, buyer, state)
    return check.why ? [{ followerId: state.id, why: check.why }] : []
  })
  const rank = (why: DepartureWhy) =>
    why === 'allegiance' ? 0 : why === 'kin' ? 1 : 2
  return leaving
    .map((entry, i) => ({ entry, i }))
    .sort((a, b) => rank(a.entry.why) - rank(b.entry.why) || a.i - b.i)
    .slice(0, room)
    .map(({ entry }) => entry)
}

// --- Komodo's last recruit (t-041) -------------------------------------------
//
// Three persona campaigns sat with everyone and lost nobody: the betrayal cost
// nothing personal. Komodo was the emperor's advisor. He knows who the emperor
// trusts. If nobody else goes with him, he sits up with the follower the
// emperor sat with most, and that follower goes. It is always someone the
// player knows, it is named days ahead, and three things stop it: Komodo held
// in the cells or followed on the last night, a sealed romance, or that
// follower away on a quest when the gate opens.

/** Last-night answers that leave Komodo no hour alone with anyone. */
export const KOMODO_WATCHED: readonly string[] = [
  'd40-komodo-held',
  'd40-komodo-followed',
]
/** From this day the briefing names who Komodo is sitting up with. */
export const COURTING_FROM_DAY = BETRAYAL_DAY - 4
/** Only someone at court since this day: long enough to be known. */
export const COURTED_JOINED_BY = BETRAYAL_DAY - 11

/**
 * The follower Komodo is working on: the one the emperor sat with most (at
 * least once), never a sealed romance; earliest at court breaks a tie.
 * `ignoreAway` reads the court as the briefing sees it, before quests ride.
 */
export const komodoCourts = (
  run: FortressRun,
  ignoreAway = false,
): string | undefined => {
  if (KOMODO_WATCHED.some((flag) => run.flags.includes(flag))) return undefined
  const present = run.roster.filter((state) => !state.dead && !state.departed)
  if (present.length <= MIN_LEFT) return undefined
  return present
    .filter(
      (state) =>
        state.joinedDay <= COURTED_JOINED_BY &&
        !romanceSealed(run, state.id) &&
        (ignoreAway ||
          !run.active.some((quest) => quest.party.includes(state.id))) &&
        talksHeardWith(run, state.id) > 0,
    )
    .map((state, i) => ({ state, i, heard: talksHeardWith(run, state.id) }))
    .sort((a, b) => b.heard - a.heard || a.i - b.i)[0]?.state.id
}

/**
 * The briefing's warning from Day 37: who Komodo sits up with, and what
 * would keep them. Silent once he is watched, or nobody fits.
 */
export const komodoCourtingLine = (
  run: FortressRun,
): { source: string; text: string } | undefined => {
  if (run.day < COURTING_FROM_DAY || run.day >= BETRAYAL_DAY) return undefined
  const id = komodoCourts(run, true)
  const def = id ? followerDef(id) : undefined
  if (!def) return undefined
  const words = PRONOUNS[def.pronouns] ?? PRONOUNS['they/them']!
  const nights = run.day - COURTING_FROM_DAY + 1
  const count = ['One night', 'Two nights', 'Three nights', 'Four nights']
  return {
    source: 'The barracks',
    text: `Young Komodo has sat up late with ${def.name}. ${count[nights - 1] ?? 'Every night'} now, the lamp turned low, his book shut on the table between them. Nobody hears what he says. ${words.subj} ${words.subj === 'They' ? 'laugh' : 'laughs'} once, quietly, and then ${words.subj === 'They' ? 'do' : 'does'} not.`,
  }
}

/**
 * The Day 41 dawn's choices, applied to a run already marked betrayed: the
 * buyer's flag, and the followers who go (their kit stays on the bunk).
 */
export const applyBetrayal = (
  run: FortressRun,
  events: string[],
): {
  buyer: BuyerId
  departed: { followerId: string; why: DepartureWhy }[]
  fell: string
  why: string
  ready?: string[]
  note?: string
} => {
  const buyer = selectBuyer(run)
  run.flags.push(`buyer:${buyer}`)
  const departed = selectDepartures(run, buyer)
  const going = new Set(departed.map((entry) => entry.followerId))
  const stayed = selectDepartures(run, buyer, MAX_DEPARTURES).filter(
    (entry) => !going.has(entry.followerId),
  )
  // Nobody else went: Komodo takes the one he sat up with (t-041).
  const courted = departed.length ? undefined : komodoCourts(run)
  if (courted) departed.push({ followerId: courted, why: 'persuaded' })
  for (const { followerId, why } of departed) {
    const state = run.roster.find((entry) => entry.id === followerId)
    if (!state) continue
    state.departed = { day: run.day, why }
    for (const item of Object.values(state.equipment))
      if (item) run.inventory.push(item)
    state.equipment = {}
    delete state.injuredUntilDay
  }
  const { fell, why } = fallText(run, BUYERS[buyer])
  events.push(fell)
  for (const { followerId } of departed)
    events.push(
      `${followerDef(followerId)?.name ?? followerId} went with Young Komodo.`,
    )
  const ready = [
    ...precautionsTaken(run).map((entry) => entry.line),
    ...stayed.map(({ followerId }) => stayedLine(followerId)),
  ]
  events.push(...ready)
  const note = pickVariant(run.flags, KOMODO_NOTES)?.text
  return {
    buyer,
    departed,
    fell,
    why,
    ...(ready.length ? { ready } : {}),
    ...(note ? { note } : {}),
  }
}

/** A follower the crown's guards kept: packed to go, and stayed. */
export const stayedLine = (followerId: string): string => {
  const def = followerDef(followerId)
  const words = PRONOUNS[def?.pronouns ?? ''] ?? PRONOUNS['they/them']!
  return `${def?.name ?? followerId} had packed to go with him. ${words.subj} saw the court awake and put the bag down.`
}

// --- the stark lines ----------------------------------------------------------

/** What was left behind, one image per follower. */
export const DEPARTURE_LINES: Record<string, string> = {
  F001: 'Rook’s bedroll is gone. So is the good saddle. The tracks go toward the tower at a walk.',
  F002: 'Saffron left her bridge drawings on the bunk. She took the toolkit with the insignia welded inside.',
  F003: 'Kiyo’s kettle is still warm. She packed Zuzu’s blanket first. She did not wake anyone.',
  F004: 'Duchess Flint walked out the front gate and told the guard her name. Slowly. Exactly.',
  F005: 'Pip took one ledger and left the rest in alphabetical order.',
  F006: 'Nera went out into weather nobody else could read. The wind was going her way.',
  F007: 'Ash wrote their own pass at the kitchen table. The ink was dry before the gate opened.',
  F008: 'Bram counted the court’s spears before he went. He took one. Exactly one.',
  F009: 'Keel went down a drain nobody knew was a door. They mapped it years ago. For pay.',
  F010: 'Lumen left a list of who is owed what. Her own name is not on it.',
  F011: 'Tamsin went over the wall the way she came in. She owes the crown nothing. She checked.',
  F012: 'Brother Teodor took his ladle and his grey wax. The soup is still on the fire.',
  F013: 'Mags stood aside. First time in her life. Then she followed them out.',
  F014: 'Pell took everything that hums. The crown’s strongbox does not hum. He took that too.',
  F015: 'Isolde left a green candle burning on her bunk. Nobody can put it out.',
  F016: 'Sable folded their white gloves on the pillow, fingertips mended. They went without them.',
  F017: 'Cobb walked out with his hammer. He did not say goodbye. He never said much.',
  F018: 'Vesper left in the middle of a song. One ball is still on the floor where it fell.',
  F019: 'Hollin flew out slow, with his scroll case. The map on his desk has one door circled.',
  F020: 'Juniper’s bunk is stripped to the boards. She left the blanket folded for whoever comes next.',
  F021: 'Nettle tied one red thread around the bedpost. The herb shelf is bare.',
  F022: 'Tiller tapped three times on the old pipe. Nothing answered. He went.',
  F023: 'Sera took the loose clapper. The gate bell has not sounded right since.',
  F024: 'Tarn erased the safe roads from his map. The boots were still warm.',
  F025: 'Odo emptied the black sand and carried the glass into the rain.',
}

const PRONOUNS: Record<string, { subj: string; obj: string; poss: string }> = {
  'they/them': { subj: 'They', obj: 'them', poss: 'Their' },
  'she/her': { subj: 'She', obj: 'her', poss: 'Her' },
  'he/him': { subj: 'He', obj: 'him', poss: 'His' },
}

/** The honest one-line reason, in the rule's own terms. */
export const departureReason = (
  run: FortressRun,
  followerId: string,
  why: DepartureWhy,
): string => {
  const def = followerDef(followerId)
  if (!def) return ''
  if (why === 'dismissed')
    return (
      run.roster.find((entry) => entry.id === followerId)?.departed?.reason ??
      ''
    )
  const words = PRONOUNS[def.pronouns] ?? PRONOUNS['they/them']!
  const buyer = BUYERS[buyerOf(run) ?? 'abbey']
  if (why === 'allegiance') {
    const trait = allegianceTo(def, buyer.faction)
    return `${trait?.name ?? 'A hidden allegiance'}. ${buyer.name} called. ${words.subj} went.`
  }
  const state = run.roster.find((entry) => entry.id === followerId)
  const days = BETRAYAL_DAY - (state?.joinedDay ?? 1)
  if (why === 'persuaded') {
    const heard = talksHeardWith(run, followerId)
    const times =
      ['once', 'twice', 'three times', 'four times', 'five times'][heard - 1] ??
      'more times than you counted'
    return `You sat with ${words.obj} ${times}. Young Komodo sat with ${words.obj} the last night. ${words.subj} went.`
  }
  if (why === 'kin')
    return `You sat with ${words.obj}. ${words.poss} people ${peopleBroken(run, def) ?? peopleCrossed(run, def) ?? 'are gone'}. ${words.subj} went to them.`
  const people = peopleCrossed(run, def) ?? 'owe the crown nothing'
  return `${days} days at court. Nobody sat with ${words.obj} once. ${words.poss} people ${people}.`
}

/** Who is gone with Komodo, with what they left and why. */
export const departedFollowers = (run: FortressRun) =>
  run.roster.flatMap((state) =>
    state.departed
      ? [
          {
            followerId: state.id,
            day: state.departed.day,
            why: state.departed.why,
            line:
              state.departed.why === 'dismissed'
                ? ''
                : (DEPARTURE_LINES[state.id] ?? ''),
            reason: departureReason(run, state.id, state.departed.why),
          },
        ]
      : [],
  )

// --- the court in hiding: what the host shares ---------------------------------

/** Act V hideout -> the faction that shelters the court there. */
export const HIDEOUT_HOST: Record<string, KingdomFactionId> = {
  'mole-tunnels': 'moles',
  'crow-cave': 'storm-crows',
  'bell-cellars': 'hollow-bell',
  'wagon-circle': 'jackalwire',
  'moving-caravan': 'saltroad',
  'freehold-barn': 'freeholds',
  'rail-station': 'rustline',
}

/** In hiding the host feeds the court; the crown pays half wages. */
export const HIDEOUT_WAGE = 2
/** The nameless cave's revolutionaries share what they steal. Not much. */
export const CAVE_SHARE = 3
/** Brass per point of the host's strength, by how the host stands with the crown. */
export const HOST_SHARE_RATE: Record<AffinityTier, number> = {
  hostile: 0,
  wary: 0,
  neutral: 1,
  friendly: 2,
  allied: 3,
}

export type HostShare = {
  hideout: string
  host?: KingdomFactionId
  tier?: AffinityTier
  strength?: number
  paid: number
}

/** What the host shares with the court each dawn of Act V. */
export const hostShare = (run: FortressRun): HostShare | undefined => {
  const hideout = run.hideout
  if (!hideout) return undefined
  const host = HIDEOUT_HOST[hideout]
  if (!host) return { hideout, paid: CAVE_SHARE }
  if (!stands(run, host)) return { hideout, host, paid: 0 }
  const tier = affinityTier(run.affinity[host])
  const strength = run.strength[host]
  return {
    hideout,
    host,
    tier,
    strength,
    paid: strength * HOST_SHARE_RATE[tier],
  }
}

/** Where the court hides, as the dawn and the ledger name it. */
export const HIDEOUT_NAMES: Record<string, string> = {
  'mole-tunnels': 'the Mole tunnels beneath the badlands',
  'crow-cave': 'a Storm Crow cave',
  'bell-cellars': 'the cellars under Hollow Bell’s chapel',
  'wagon-circle': 'a circle of painted wagons in the rail canyon',
  'moving-caravan': 'a Saltroad caravan that never stops moving',
  'freehold-barn': 'a Freehold barn and its root cellar',
  'rail-station': 'a collapsed Rustline rail station',
  'nameless-cave': 'a nameless cave, with a handful of revolutionaries',
}

const TIER_WORD: Record<AffinityTier, string> = {
  hostile: 'Hostile',
  wary: 'Wary',
  neutral: 'Neutral',
  friendly: 'Friendly',
  allied: 'Allied',
}

/** The ledger's word on what the host shares, and why that much. */
export const hostShareLine = (
  run: FortressRun,
  hostName: (faction: KingdomFactionId) => string,
): string => {
  const share = hostShare(run)
  if (!share) return ''
  if (!share.host)
    return `The revolutionaries share what they steal: ${share.paid} brass a day.`
  const name = hostName(share.host)
  if (!share.tier) return `Your host, ${name}, has nothing left to share.`
  const rate = HOST_SHARE_RATE[share.tier]
  return rate
    ? `Your host, ${name}, shares ${share.paid} brass a day: strength ${share.strength}, ${TIER_WORD[share.tier]}, ${rate} a point.`
    : `Your host, ${name}, shares nothing. ${TIER_WORD[share.tier]} hosts keep their brass.`
}
