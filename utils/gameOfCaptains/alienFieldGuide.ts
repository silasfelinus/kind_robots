import { ALIEN_BY_ID, ALIEN_SPECIES, type AlienSpecies } from './alienSpecies'
import type { VoyageRun } from './rules'

export type AlienChoice = 'approach' | 'observe' | 'improvise'
export type AlienMood = 'wary' | 'playful' | 'protective'
export type AlienOutcome = 'retreat' | 'chaos' | 'bond'
export type AlienContact = {
  speciesId: string
  mood: AlienMood
  outcome: AlienOutcome
  choice?: AlienChoice
}
export type AlienGuide = {
  version: 1
  discovered: string[]
  friends: string[]
  attempted: string[]
  milestoneSeen: number[]
  contacts?: Record<string, AlienOutcome>
  lastContact?: AlienContact
  fieldReports?: AlienContact[]
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
  const validatedContact = (value: unknown): AlienContact | null => {
    if (!value || typeof value !== 'object') return null
    const candidate = value as Partial<AlienContact>
    if (
      !ALIEN_BY_ID.has(candidate.speciesId ?? '') ||
      !isAlienMood(candidate.mood) ||
      !isAlienOutcome(candidate.outcome)
    )
      return null
    return {
      speciesId: candidate.speciesId!,
      mood: candidate.mood,
      outcome: candidate.outcome,
      ...(isAlienChoice(candidate.choice) ? { choice: candidate.choice } : {}),
    }
  }
  const lastContact = validatedContact(source.lastContact) ?? undefined
  const fieldReports = Array.isArray(source.fieldReports)
    ? source.fieldReports
        .map(validatedContact)
        .filter((report): report is AlienContact => !!report)
        .slice(-101)
    : []
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
    ...(fieldReports.length ? { fieldReports } : {}),
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
const isAlienChoice = (value: unknown): value is AlienChoice =>
  value === 'approach' || value === 'observe' || value === 'improvise'
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

const SCENE_CLUES: Record<
  AlienSpecies['category'],
  Record<AlienMood, { incident: string; evidence: string }>
> = {
  zodiac: {
    wary: {
      incident:
        "The stars printed across its body go dark whenever the couch's shield crackles.",
      evidence:
        'A dropped star-chart fragment lies at its feet; none of its markings change while the captain is still.',
    },
    playful: {
      incident:
        'It nudges a paper horoscope toward the bubble, snatches it back, and repeats the performance.',
      evidence:
        'One sign keeps pointing toward the couch, even though the creature has no reason to need directions.',
    },
    protective: {
      incident:
        'A small constellation is tucked beneath its fins while the solar wind pulls at its outermost lights.',
      evidence:
        'The creature tracks a loose cushion strap more closely than the visitors standing beside it.',
    },
  },
  hybrid: {
    wary: {
      incident:
        "Both animal halves go perfectly still when the crew's footsteps fall out of rhythm.",
      evidence:
        'Their breathing settles into a single beat when the couch stops moving.',
    },
    playful: {
      incident:
        'It offers a stolen button with one appendage and waits for the other half to take it back.',
      evidence:
        'After the third exchange, it leaves the button precisely at the edge of the bubble.',
    },
    protective: {
      incident:
        'One set of limbs guards a nest while the other struggles with a snapped branch.',
      evidence:
        'A stray bit of couch upholstery is exactly the width of the gap in the branch.',
    },
  },
  cosmic: {
    wary: {
      incident:
        'The light around it collapses to a dim point whenever the shield gives off a pulse.',
      evidence:
        'A drifting pebble crosses its path unharmed while the engines fall silent.',
    },
    playful: {
      incident:
        'It sends an absurd three-note pulse toward the couch, then waits through a very deliberate silence.',
      evidence:
        'The pulse begins again whenever someone inside the bubble taps a foot.',
    },
    protective: {
      incident:
        'A pocket of dangerous radiation has opened behind a cluster of small drifting shapes.',
      evidence:
        'The creature keeps itself between the light and the smaller bodies, while a harmless reflective emergency blanket hangs loose on the couch.',
    },
  },
  social: {
    wary: {
      incident:
        'A ring of tiny spectators becomes quiet as the strangers step closer.',
      evidence:
        'The visitor folds its ceremonial greeting card without offering it to anyone.',
    },
    playful: {
      incident:
        'It arranges three seats facing the couch and places an unclaimed fourth seat nearest the bubble.',
      evidence:
        'Whenever the captain shifts position, the creature rearranges the seats to match.',
    },
    protective: {
      incident:
        'It holds a place in a crowded procession for someone who has not arrived.',
      evidence:
        'The crowd is pushing against a delicate barricade; a ridiculous diversion would buy the missing member a little space.',
    },
  },
  ecology: {
    wary: {
      incident:
        'A whole colony retreats into its host at the first metallic thump from the couch.',
      evidence:
        'Only the smallest members reappear while the crew remains motionless.',
    },
    playful: {
      incident:
        'A juvenile pushes a bright seed toward the crew, chases it, then sends it back again.',
      evidence:
        'Its companions repeat the exchange, waiting for a participant on the other side.',
    },
    protective: {
      incident:
        'Several young cling to their guardian at the edge of a collapsing shelter.',
      evidence:
        'The creature watches a loose length of safety webbing far more carefully than it watches the captain.',
    },
  },
  legendary: {
    wary: {
      incident:
        'Its countless small lights blink out one by one when the red couch approaches.',
      evidence:
        'A single ancient light continues pulsing while the crew makes no movement at all.',
    },
    playful: {
      incident:
        'It folds one impossible shape into an imitation of the couch, then makes the same shape again.',
      evidence:
        'A spare cushion drifts upward and the creature mirrors its tiny wobble.',
    },
    protective: {
      incident:
        'A piece of the sky behind it has torn open around something impossibly young.',
      evidence:
        'The visitor will not abandon the opening; the couch still carries a rolled-up emergency membrane.',
    },
  },
}
export const alienEvidence = (
  category: AlienSpecies['category'],
  mood: AlienMood,
): { incident: string; evidence: string } => SCENE_CLUES[category][mood]

export const alienObservation = (contact: AlienContact): string => {
  const species = ALIEN_BY_ID.get(contact.speciesId)
  if (!species) return ''
  const action = ALIEN_CHOICES.find((choice) => choice.id === contact.choice)
  const evidence = SCENE_CLUES[species.category][contact.mood].evidence
  const result =
    contact.outcome === 'bond'
      ? 'It chose to stay.'
      : contact.outcome === 'chaos'
        ? 'Everyone witnessed the consequences.'
        : 'It vanished before we could make a proper record.'
  return `${species.name}: "${evidence}" We tried ${action?.label.toLowerCase() ?? 'something unrecorded'}. ${result}`
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
  if (!species) return null
  const mood = ALIEN_MOODS[hash(visitKey(run) + ':mood:' + species.id) % 3]!
  const setting = SCENE_CLUES[species.category][mood]
  const history = guide.lastContact
  const callback = history
    ? history.outcome === 'chaos'
      ? 'Word of an earlier couch-related incident has already reached this place.'
      : history.outcome === 'bond'
        ? 'A previous new friend left the captain a note: Consider what this creature might need before assuming it wants company.'
        : 'The creature watches the couch cautiously; apparently a previous visitor warned it about awkward tourists.'
    : ''
  const scene =
    `From the red couch, the crew spots ${species.name} near ${species.habitat}: ${species.appearance}. ${setting.incident} ${setting.evidence} The old field guide adds only: "${species.fieldNote}." ${callback}`.trim()
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
      choice,
    },
    fieldReports: [
      ...(guide.fieldReports ?? []),
      { speciesId: sighting.species.id, mood: sighting.mood, outcome, choice },
    ].slice(-101),
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
