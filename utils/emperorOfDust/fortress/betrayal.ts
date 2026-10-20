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
import { affinityTier } from './factions'
import { followerDef } from './followers'
import { TALKS } from './talks'
import { AFFINITY_TIERS } from './types'
import type {
  AffinityTier,
  BuyerId,
  DepartureWhy,
  FollowerDef,
  FollowerState,
  FortressRun,
  KingdomFactionId,
  LocalFactionId,
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
}

export const BUYERS: Record<BuyerId, BuyerDef> = {
  abbey: {
    id: 'abbey',
    name: 'The Abbey',
    banner: 'the Abbey’s grey banner',
    faction: 'abbey',
    fell: 'Young Komodo opened the gate at midnight with your seal. The grey sisters came in with lanterns and soup. By dawn the tower flies the Abbey’s grey banner.',
    why: 'His bargain was always with the Abbess. Nobody the crown had wronged was strong enough to outbid her.',
  },
  'black-verge': {
    id: 'black-verge',
    name: 'The Black Verge',
    banner: 'the plum banner of the Black Verge',
    faction: 'black-verge',
    fell: 'Young Komodo opened the gate at midnight with your seal. Plum riders came through it at a walk. By dawn the tower flies the plum banner of the Black Verge. The Abbess paid for the horses.',
    why: 'The crown crossed the Black Verge again and again. Its riders outnumber the sisters. The Abbess let them have the walls.',
  },
  'old-houses': {
    id: 'old-houses',
    name: 'House Vask',
    banner: 'the black swan of House Vask',
    local: 'old-houses',
    fell: 'Young Komodo opened the gate at midnight with your seal. Lady Vask’s sons were already in the yard. By dawn the tower flies the black swan of House Vask. The Abbess sent flowers.',
    why: 'The crown lost the Old Houses. Komodo had paid Lady Vask’s house for two years. It was ready.',
  },
}

export const BUYER_IDS = Object.keys(BUYERS) as BuyerId[]

/**
 * Slights the Black Verge remembers. Three of them, or an open feud, and a
 * Verge stronger than the Abbey takes the walls instead of the sisters.
 */
export const VERGE_SLIGHTS: readonly string[] = [
  'd20-verge-answered',
  'chose:d28-verge-envoy:refuse',
  'd28-pups-asked',
  'sable-sheltered',
  'sable-hidden',
  'congress-common-front',
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

/**
 * Who goes: allegiance before neglect, then in the order they joined; at most
 * MAX_DEPARTURES, and never below MIN_LEFT followers left to the court.
 */
export const selectDepartures = (
  run: FortressRun,
  buyer: BuyerId,
): { followerId: string; why: DepartureWhy }[] => {
  const present = run.roster.filter((state) => !state.dead && !state.departed)
  const room = Math.max(0, Math.min(MAX_DEPARTURES, present.length - MIN_LEFT))
  const leaving = present.flatMap((state) => {
    const check = departureCheck(run, buyer, state)
    return check.why ? [{ followerId: state.id, why: check.why }] : []
  })
  const rank = (why: DepartureWhy) => (why === 'allegiance' ? 0 : 1)
  return leaving
    .map((entry, i) => ({ entry, i }))
    .sort((a, b) => rank(a.entry.why) - rank(b.entry.why) || a.i - b.i)
    .slice(0, room)
    .map(({ entry }) => entry)
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
} => {
  const buyer = selectBuyer(run)
  run.flags.push(`buyer:${buyer}`)
  const departed = selectDepartures(run, buyer)
  for (const { followerId, why } of departed) {
    const state = run.roster.find((entry) => entry.id === followerId)
    if (!state) continue
    state.departed = { day: run.day, why }
    for (const item of Object.values(state.equipment))
      if (item) run.inventory.push(item)
    state.equipment = {}
    delete state.injuredUntilDay
  }
  events.push(BUYERS[buyer].fell)
  for (const { followerId } of departed)
    events.push(
      `${followerDef(followerId)?.name ?? followerId} went with Young Komodo.`,
    )
  return { buyer, departed }
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
  F008: 'Bram counted the court’s bread before he went. He took his share. Exactly his share.',
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
  F020: 'Juniper left broth on the fire and a note under the pot. The note says: stir it.',
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
  const words = PRONOUNS[def.pronouns] ?? PRONOUNS['they/them']!
  const buyer = BUYERS[buyerOf(run) ?? 'abbey']
  if (why === 'allegiance') {
    const trait = allegianceTo(def, buyer.faction)
    return `${trait?.name ?? 'A hidden allegiance'}. ${buyer.name} called. ${words.subj} went.`
  }
  const state = run.roster.find((entry) => entry.id === followerId)
  const days = BETRAYAL_DAY - (state?.joinedDay ?? 1)
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
            line: DEPARTURE_LINES[state.id] ?? '',
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
