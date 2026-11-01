import { ALIEN_BY_ID, ALIEN_SPECIES, type AlienSpecies } from './alienSpecies'
import type { VoyageRun } from './rules'

export type AlienChoice = 'chaos' | 'flee' | 'befriend'
export type AlienGuide = {
  version: 1
  discovered: string[]
  friends: string[]
  attempted: string[]
  milestoneSeen: number[]
}
export type AlienSighting = {
  species: AlienSpecies
  chapter: number
  seed: number
  milestone: (typeof ALIEN_MILESTONES)[number] | null
}
export const ALIEN_CHOICES: readonly {
  id: AlienChoice
  label: string
  hint: string
}[] = [
  {
    id: 'chaos',
    label: 'DO SOMETHING TERRIBLE',
    hint: 'Probably goes spectacularly wrong. Still counts.',
  },
  {
    id: 'flee',
    label: 'ACT CASUAL',
    hint: 'It may run away. No permanent penalty.',
  },
  {
    id: 'befriend',
    label: 'MAKE A NEW BEST FRIEND',
    hint: 'One more passenger who will not fit on the couch.',
  },
]
export const ALIEN_MILESTONES = [
  {
    at: 5,
    title: 'The Couch Has Acquired a Following',
    scene:
      'Five species begin following the red couch in a lopsided parade. The force bubble is now officially a mobile birdbath.',
  },
  {
    at: 12,
    title: 'The Intergalactic Census Calls',
    scene:
      'A census official in a novelty squid hat insists the couch register as a zoological institution. Twelve separate species have already listed it as their next of kin.',
  },
  {
    at: 25,
    title: 'Unauthorized Wildlife Fan Club',
    scene:
      'Your collected aliens have started a fan club without asking. Its first vote is whether the captain is domesticated.',
  },
  {
    at: 50,
    title: 'The Counterfeit Couch Appears',
    scene:
      'A second red couch has arrived, entirely woven from sleeping creatures. They want to compete for the title of Most Couch.',
  },
  {
    at: 75,
    title: 'The Congress of Things with Feet',
    scene:
      'A conference of species with zero to seventeen feet holds a diplomatic summit behind the couch. Even the chair has a chair.',
  },
  {
    at: 100,
    title: 'One Empty Page Remains',
    scene:
      'One hundred alien species have signed your scrapbook. An impossible visitor has been reading it upside down and waiting to be noticed.',
  },
] as const

export const emptyAlienGuide = (): AlienGuide => ({
  version: 1,
  discovered: [],
  friends: [],
  attempted: [],
  milestoneSeen: [],
})
export function normalizeAlienGuide(value: unknown): AlienGuide {
  if (!value || typeof value !== 'object') return emptyAlienGuide()
  const source = value as Record<string, unknown>
  const strings = (key: string): string[] =>
    Array.isArray(source[key])
      ? [
          ...new Set(
            (source[key] as unknown[]).filter(
              (x): x is string => typeof x === 'string',
            ),
          ),
        ]
      : []
  const discovered = strings('discovered').filter((id) => ALIEN_BY_ID.has(id))
  const friends = strings('friends').filter((id) => discovered.includes(id))
  const attempted = strings('attempted')
    .filter((key) => /^\d+:\d+$/.test(key))
    .slice(-400)
  const milestoneSeen = Array.isArray(source.milestoneSeen)
    ? [
        ...new Set(
          source.milestoneSeen.filter(
            (n): n is number =>
              typeof n === 'number' && ALIEN_MILESTONES.some((m) => m.at === n),
          ),
        ),
      ]
    : []
  return { version: 1, discovered, friends, attempted, milestoneSeen }
}
const hash = (value: string): number => {
  let n = 2166136261
  for (const char of value)
    n = Math.imul(n ^ char.charCodeAt(0), 16777619) >>> 0
  return n
}
const visitKey = (run: Pick<VoyageRun, 'seed' | 'chapter'>) =>
  run.seed + ':' + run.chapter

export function maySeeAlien(run: VoyageRun | null, guide: AlienGuide): boolean {
  return (
    !!run &&
    run.phase === 'expedition' &&
    run.chapter >= 2 &&
    !guide.attempted.includes(visitKey(run)) &&
    guide.discovered.length < 101
  )
}
export function nextAlienSighting(
  run: VoyageRun,
  guide: AlienGuide,
): AlienSighting | null {
  if (!maySeeAlien(run, guide)) return null
  const count = guide.discovered.length
  const unseen = ALIEN_SPECIES.filter(
    (species) => !guide.discovered.includes(species.id),
  )
  const eligible = unseen.filter((species) =>
    species.rarity === 'legendary'
      ? count >= 25
      : species.rarity === 'rare'
        ? count >= 12
        : species.rarity === 'unusual'
          ? count >= 3
          : true,
  )
  const pool = eligible.length ? eligible : unseen
  const attempts = guide.attempted.length
  const special =
    count >= 25 && attempts % 6 === 5
      ? pool.filter((species) => species.rarity === 'legendary')
      : count >= 12 && attempts % 4 === 3
        ? pool.filter((species) => species.rarity === 'rare')
        : []
  const candidates = special.length ? special : pool
  const species =
    candidates[
      hash(visitKey(run) + ':' + count + ':' + attempts) % candidates.length
    ]
  const milestone =
    ALIEN_MILESTONES.find(
      (item) => count >= item.at && !guide.milestoneSeen.includes(item.at),
    ) ?? null
  return species
    ? { species, seed: run.seed, chapter: run.chapter, milestone }
    : null
}
export const alienHint = (species: AlienSpecies): string =>
  `Rumored near ${species.habitat}. ${species.rarity === 'legendary' ? 'Extremely rare, never permanently missed.' : 'Try another voyage.'}`

const ALIEN_REACTIONS = {
  zodiac: {
    chaos:
      'The horoscope runs backward. All twelve signs briefly declare the couch their chief executive.',
    flee: 'A constellation folds like an umbrella and the visitor slips behind it.',
    befriend:
      'The creature offers a prediction that is probably a hug in zodiac grammar.',
  },
  hybrid: {
    chaos:
      'The portable translator issues two incompatible animal passports and a third passport for the couch.',
    flee: 'One half of the creature retreats before the other half has agreed on a direction.',
    befriend:
      'Both halves agree the red sofa is a very acceptable third parent.',
  },
  cosmic: {
    chaos:
      'For eleven seconds gravity obeys interpretive dance. The bubble protects everyone, barely.',
    flee: 'A tiny local eclipse becomes a perfect getaway car.',
    befriend:
      'A starlight trail wraps itself around the couch like a hand-knitted scarf.',
  },
  social: {
    chaos:
      'Every witness starts applauding the wrong side of the argument. A parade forms without permission.',
    flee: 'A wave of collective embarrassment opens a convenient escape corridor.',
    befriend:
      'The lifeform invites its entire extended social network to future brunch.',
  },
  ecology: {
    chaos:
      'The food chain forms a peaceful picket line around the couch. Several predators carry snacks.',
    flee: 'Its whole symbiotic neighborhood folds itself into the scenery.',
    befriend:
      'Three different generations appear to vote yes on adopting the visitors.',
  },
  legendary: {
    chaos:
      'A small corner of reality resigns and must be persuaded to return for the end credits.',
    flee: 'The impossible visitor leaves a note saying Try Again, written in a language no one owns.',
    befriend:
      'The stars go briefly silent in respect, then someone on the couch sneezes.',
  },
} as const

export function resolveAlienSighting(
  guide: AlienGuide,
  sighting: AlienSighting,
  choice: AlienChoice,
): { guide: AlienGuide; recorded: boolean; text: string } {
  const key = sighting.seed + ':' + sighting.chapter
  if (!ALIEN_BY_ID.has(sighting.species.id) || guide.attempted.includes(key))
    return {
      guide,
      recorded: false,
      text: 'The field guide refuses to file the same sighting twice.',
    }
  const recorded = choice !== 'flee'
  const alreadyKnown = guide.discovered.includes(sighting.species.id)
  const discovered =
    recorded && !alreadyKnown
      ? [...guide.discovered, sighting.species.id]
      : [...guide.discovered]
  const friends =
    choice === 'befriend' && !guide.friends.includes(sighting.species.id)
      ? [...guide.friends, sighting.species.id]
      : [...guide.friends]
  const next: AlienGuide = {
    version: 1,
    discovered,
    friends,
    attempted: [...guide.attempted, key].slice(-400),
    milestoneSeen: sighting.milestone
      ? [...guide.milestoneSeen, sighting.milestone.at]
      : [...guide.milestoneSeen],
  }
  const species = sighting.species
  const reaction = ALIEN_REACTIONS[species.category][choice]
  const text =
    choice === 'chaos'
      ? `The captain presses DO NOT PRESS. ${reaction} ${species.name} poses for a bewildered field photograph. Discovery recorded.`
      : choice === 'flee'
        ? `${species.name} notices the crew attempting to look normal. ${reaction} No penalty: it can return another day.`
        : `The crew offers a cushion and a snack. ${reaction} ${species.name} accepts the friendship and signs with a muddy footprint.`
  return { guide: next, recorded: recorded && !alreadyKnown, text }
}
