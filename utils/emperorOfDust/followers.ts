import type { Follower } from './types'

export type FollowerProfile = Follower & {
  species: string
  faction: string
  biography: string
  temperament: string
  recruitCost: number
  earliestDay: number
  requiredFlags: string[]
  starter: boolean
  art: {
    portrait: string | null
    injured: string | null
    splash: string | null
  }
}

const emptyArt = () => ({ portrait: null, injured: null, splash: null })

const profile = (
  id: string,
  name: string,
  species: string,
  faction: string,
  biography: string,
  temperament: string,
  values: [number, number, number],
  specialties: string[],
  cost: number,
  earliestDay: number,
  flags: string[] = [],
): FollowerProfile => ({
  id,
  name,
  species,
  faction,
  biography,
  temperament,
  stats: { might: values[0], diplomacy: values[1], ingenuity: values[2] },
  specialties,
  recruitCost: cost,
  earliestDay,
  requiredFlags: flags,
  starter: cost === 0,
  art: emptyArt(),
})

export const FOLLOWER_POOL: readonly FollowerProfile[] = [
  profile(
    'F001',
    'Rook Bramble',
    'Hare',
    'Border Freeholds / Hollow Bell',
    'An outrider who can track ruts across stone but struggles to face a debt owed to a raider who saved their family.',
    'Dry wit, a fierce sense of loyalty, wary of taxation.',
    [3, 2, 4],
    ['navigation', 'tracking'],
    0,
    1,
  ),
  profile(
    'F002',
    'Saffron Kett',
    'Hyena',
    'Jackalwire Pack',
    'A machinist and former raider who would rather build bridges than burn them, though her old companions still demand favors.',
    'Impatient, ingenious, stubbornly protective.',
    [3, 1, 5],
    ['mechanics', 'demolition'],
    0,
    1,
  ),
  profile(
    'F003',
    'Wisp Fen',
    'Heron',
    'Saltroad / Mirefen',
    "A medic who keeps a notebook of the recovered and wants to establish a clinic outside the swamp witches' influence.",
    'Kind, observant, difficult to intimidate.',
    [1, 3, 5],
    ['medicine', 'wetlands'],
    0,
    1,
  ),
  profile(
    'F004',
    'Duchess Flint',
    'Tortoise',
    'Border Freeholds',
    'A mediator whose honorary title began as a joke and who refuses to reduce casualties to figures on a ledger.',
    'Patient, principled, and famously uncompromising.',
    [2, 5, 3],
    ['arbitration', 'defense'],
    0,
    1,
  ),
  profile(
    'F005',
    'Pip Thread',
    'Moth',
    'Hollow Bell Council',
    "An archivist who saw evidence of missing people vanish from the mayor's records and will not burn inconvenient history.",
    'Careful, shy, relentless about the truth.',
    [1, 4, 5],
    ['archives', 'codes'],
    0,
    1,
  ),
  profile(
    'F006',
    'Nera Gale',
    'Crow',
    'Storm Crow Conclave',
    'A dissident weather-worker who believes rainfall must never become a commodity owned by the powerful.',
    'Elegant, incisive, privately afraid.',
    [2, 4, 5],
    ['weather', 'investigation'],
    12,
    11,
    ['rain-dispute-heard'],
  ),
  profile(
    'F007',
    'Ash Quill',
    'Fox',
    'Saltroad Caravans',
    'A courier who forged travel papers to save refugees while seeking a sibling lost on the mission road.',
    'Witty, anxious, resourceful.',
    [3, 3, 4],
    ['speed', 'forgery-detection'],
    10,
    14,
    ['courier-search-opened'],
  ),
  profile(
    'F008',
    'Bram Coil',
    'Buffalo',
    'Border Freeholds / Saltroad',
    'A quartermaster who once caused a riot with strict rationing and now insists everyone eats before a victory speech.',
    'Meticulous, brave, slow to compromise.',
    [5, 2, 3],
    ['defense', 'logistics'],
    15,
    9,
    ['food-road-secured'],
  ),
  profile(
    'F009',
    'Keel Understone',
    'Mole',
    'Mole Revolutionaries',
    'A tunnel surveyor resisting imperial water decrees and the swamp witches, but unwilling to flood poor homes for revolution.',
    'Skeptical, precise, committed to reform.',
    [2, 4, 5],
    ['tunnels', 'excavation'],
    18,
    41,
    ['mole-truce-earned'],
  ),
  profile(
    'F010',
    'Lumen Shale',
    'Mole',
    'Mole Revolutionaries',
    'A mutual-aid organizer who demands practical limits on imperial power rather than ceremonial reconciliation.',
    'Outspoken, thoughtful, unafraid of disagreement.',
    [1, 5, 4],
    ['organizing', 'negotiation'],
    16,
    51,
    ['mole-reforms-enacted'],
  ),
]

export const starterFollowers = (): Follower[] =>
  FOLLOWER_POOL.filter((entry) => entry.starter).map((entry) => ({
    id: entry.id,
    name: entry.name,
    stats: { ...entry.stats },
    specialties: [...entry.specialties],
  }))

export const followerProfile = (id: string): FollowerProfile | undefined =>
  FOLLOWER_POOL.find((entry) => entry.id === id)
