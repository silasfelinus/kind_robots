import { ALIEN_BY_ID, ALIEN_SPECIES, type AlienSpecies } from './alienSpecies'
import type { VoyageRun } from './rules'

export type AlienChoice = 'approach' | 'observe' | 'improvise'
export type AlienMood = 'wary' | 'playful' | 'protective'
export type AlienOutcome = 'retreat' | 'chaos' | 'bond'
export type AlienContact = {
  speciesId: string
  mood: AlienMood
  outcome: AlienOutcome
}
export type AlienGuide = {
  version: 1
  discovered: string[]
  friends: string[]
  attempted: string[]
  milestoneSeen: number[]
  contacts?: Record<string, AlienOutcome>
  lastContact?: AlienContact
}
export type AlienSighting = {
  species: AlienSpecies
  chapter: number
  seed: number
  milestone: (typeof ALIEN_MILESTONES)[number] | null
  mood: AlienMood
  scene: string
}
export const ALIEN_CHOICES: readonly {
  id: AlienChoice
  label: string
  hint: string
}[] = [
  {
    id: 'approach',
    label: 'OFFER A PEACEFUL HELLO',
    hint: 'Open the bubble just enough to offer a small gift.',
  },
  {
    id: 'observe',
    label: 'WATCH AND LISTEN',
    hint: 'Read its signals before making yourself known.',
  },
  {
    id: 'improvise',
    label: 'TRY SOMETHING RIDICULOUS',
    hint: 'Attempt an unlikely solution with whatever is on the couch.',
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
  const rawContacts = source.contacts
  const contacts: Record<string, AlienOutcome> = {}
  if (
    rawContacts &&
    typeof rawContacts === 'object' &&
    !Array.isArray(rawContacts)
  ) {
    for (const [id, outcome] of Object.entries(rawContacts)) {
      if (ALIEN_BY_ID.has(id) && isAlienOutcome(outcome)) contacts[id] = outcome
    }
  }
  const last = source.lastContact as Partial<AlienContact> | undefined
  const lastContact =
    last &&
    ALIEN_BY_ID.has(last.speciesId ?? '') &&
    isAlienMood(last.mood) &&
    isAlienOutcome(last.outcome)
      ? { speciesId: last.speciesId!, mood: last.mood, outcome: last.outcome }
      : undefined
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
  return {
    version: 1,
    discovered,
    friends,
    attempted,
    milestoneSeen,
    ...(Object.keys(contacts).length ? { contacts } : {}),
    ...(lastContact ? { lastContact } : {}),
  }
}
const hash = (value: string): number => {
  let n = 2166136261
  for (const char of value)
    n = Math.imul(n ^ char.charCodeAt(0), 16777619) >>> 0
  return n
}
const ALIEN_MOODS: readonly AlienMood[] = ['wary', 'playful', 'protective']
const isAlienMood = (value: unknown): value is AlienMood =>
  ALIEN_MOODS.includes(value as AlienMood)
const isAlienOutcome = (value: unknown): value is AlienOutcome =>
  value === 'retreat' || value === 'chaos' || value === 'bond'

// A Latin square: every approach can bond, cause chaos or drive the visitor
// away, depending on its legible emotional situation. Never label the outcome
// on the button. Two of three choices still unlock a scrapbook entry.
const ALIEN_OUTCOME_MATRIX: Record<
  AlienMood,
  Record<AlienChoice, AlienOutcome>
> = {
  wary: { approach: 'retreat', observe: 'bond', improvise: 'chaos' },
  playful: { approach: 'bond', observe: 'chaos', improvise: 'retreat' },
  protective: { approach: 'chaos', observe: 'retreat', improvise: 'bond' },
}
export const alienOutcome = (
  mood: AlienMood,
  choice: AlienChoice,
): AlienOutcome => ALIEN_OUTCOME_MATRIX[mood][choice]

const SITUATION = {
  wary: {
    setup:
      'It freezes beside a broken rescue beacon, its whole body turned toward the couch bubble.',
    clue: 'Every loud gesture makes it edge backward. A quiet pause seems to calm it.',
  },
  playful: {
    setup:
      'It has stolen a dangling emergency ribbon and keeps looping around the couch to show off.',
    clue: 'It is plainly inviting attention, but gets restless when nobody joins the game.',
  },
  protective: {
    setup:
      'It stands guard over something fragile in its habitat, refusing to abandon it.',
    clue: "A direct approach would cross its boundary. It follows the movements of the crew's loose equipment.",
  },
} as const
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
  if (!species) return null
  const mood = ALIEN_MOODS[hash(visitKey(run) + ':mood:' + species.id) % 3]!
  const setting = SITUATION[mood]
  const history = guide.lastContact
  const callback = history
    ? history.outcome === 'chaos'
      ? 'Word of an earlier couch-related incident has already reached this place.'
      : history.outcome === 'bond'
        ? 'A previous new friend has apparently told the locals you are safe to approach.'
        : 'The creature watches the couch cautiously; apparently a previous visitor warned it about awkward tourists.'
    : ''
  const scene =
    `${species.name} is ${species.appearance} near ${species.habitat}. Local rumor: ${species.fieldNote}. ${setting.setup} ${setting.clue} ${callback}`.trim()
  return {
    species,
    seed: run.seed,
    chapter: run.chapter,
    milestone,
    mood,
    scene,
  }
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
  const outcome = alienOutcome(sighting.mood, choice)
  const recorded = outcome !== 'retreat'
  const alreadyKnown = guide.discovered.includes(sighting.species.id)
  const discovered =
    recorded && !alreadyKnown
      ? [...guide.discovered, sighting.species.id]
      : [...guide.discovered]
  const friends =
    outcome === 'bond' && !guide.friends.includes(sighting.species.id)
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
    contacts: { ...(guide.contacts ?? {}), [sighting.species.id]: outcome },
    lastContact: {
      speciesId: sighting.species.id,
      mood: sighting.mood,
      outcome,
    },
  }
  const species = sighting.species
  const reaction =
    ALIEN_REACTIONS[species.category][
      outcome === 'bond' ? 'befriend' : outcome === 'retreat' ? 'flee' : 'chaos'
    ]
  const moodReactions: Record<AlienMood, Record<AlienOutcome, string>> = {
    wary: {
      retreat:
        'The sudden closeness is too much. It tucks itself away before anyone can sketch a fin.',
      chaos:
        'An improvisation startles it into a wildly photogenic emergency display. The bubble saves the crew.',
      bond: 'Your patience gives it space to decide. It approaches on its own terms and leaves a friendly mark.',
    },
    playful: {
      retreat:
        'Your stunt is a little much for the game. It darts away, taking the stolen ribbon with it.',
      chaos:
        'A careful attempt at documentation turns into a public performance. The audience is delighted, the captain less so.',
      bond: 'It responds to the greeting with a delighted invitation to an absurdly elaborate game.',
    },
    protective: {
      retreat:
        'Being watched near what it guards feels threatening. It withdraws with its treasured cargo intact.',
      chaos:
        'Your offer crosses its boundary. It makes its displeasure spectacularly clear, and the incident is documented.',
      bond: 'The ridiculous distraction becomes an unexpected rescue. It relaxes, and chooses to trust the crew.',
    },
  }
  const text = `${moodReactions[sighting.mood][outcome]} ${reaction} ${species.name}: ${outcome === 'retreat' ? 'It may be encountered again on another voyage.' : outcome === 'bond' ? 'A new friend has been recorded in the scrapbook.' : 'An extraordinarily messy field record is saved.'}`
  return { guide: next, recorded: recorded && !alreadyKnown, text }
}
