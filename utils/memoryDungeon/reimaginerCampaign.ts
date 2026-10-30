/**
 * Reimaginer campaign authoring and route rules. This is a content/branching
 * contract, not twelve shipped maps or delivered illustrations.
 * Briar's existing save/coordinate IDs continue to be owned by
 * memoryDungeonWorld.ts; these IDs identify *experience variants* instead.
 */
export type MemoryConceptId = 'briar' | 'hearth' | 'crown' | 'city'
export type RealityPerspective =
  'earth-protagonist' | 'morrow' | 'scylla' | 'char' | 'vesper'
export type RealityOntology =
  | 'storybook'
  | 'mundane'
  | 'enchanted-earth'
  | 'underwater'
  | 'science-fiction'
  | 'hybrid'
export type ReimaginationState =
  | 'original'
  | 'dark-reflection'
  | 'wished-for'
  | 'possible-future'
  | 'remembrance'
  | 'repair'
export type VariantDimension =
  'meaning' | 'mechanics' | 'traversal' | 'cast' | 'visual-language'
export type ExperienceId =
  | 'e01'
  | 'e02'
  | 'e03'
  | 'e04'
  | 'e05'
  | 'e06'
  | 'e07'
  | 'e08'
  | 'e09'
  | 'e10'
  | 'e11'
  | 'e12'
  | 'e13'
  | 'e14'
  | 'e15'
  | 'e16'

export interface WorldConcept {
  id: MemoryConceptId
  title: string
  thesis: string
  landmarkPromise: string
}

export interface RealityExperience {
  id: ExperienceId
  concept: MemoryConceptId
  title: string
  viewpoint: RealityPerspective
  ontology: RealityOntology
  state: ReimaginationState
  changeDimensions: readonly VariantDimension[]
  dramaticQuestion: string
  playableRule: string
  artSubject: string
  planned: true
  gallery: { local: 30; collaborations: 2 }
}

const deckBudget = { local: 30, collaborations: 2 } as const

export const MEMORY_WORLD_CONCEPTS: readonly WorldConcept[] = [
  {
    id: 'briar',
    title: 'Briar / Borderland',
    thesis: 'Protection can look like predation',
    landmarkPromise:
      'The wolf road, original village and House That Remembers remain recognizable',
  },
  {
    id: 'hearth',
    title: 'Hearth / Home',
    thesis: 'Care can become control',
    landmarkPromise:
      'Oven, village square, cottages and refuge retain their relationships',
  },
  {
    id: 'crown',
    title: 'Crown / Depths',
    thesis: 'Loving someone does not entitle us to choose for them',
    landmarkPromise: 'A shore road becomes a route through tide and palace',
  },
  {
    id: 'city',
    title: 'City / Ordinary Life',
    thesis: 'Everyday customs are mysterious from outside',
    landmarkPromise:
      'Office, station, neighborhood and hospital remain in place after magic',
  },
]

function experience(
  id: ExperienceId,
  concept: MemoryConceptId,
  title: string,
  viewpoint: RealityPerspective,
  ontology: RealityOntology,
  state: ReimaginationState,
  changeDimensions: readonly VariantDimension[],
  dramaticQuestion: string,
  playableRule: string,
  artSubject: string,
): RealityExperience {
  return {
    id,
    concept,
    title,
    viewpoint,
    ontology,
    state,
    changeDimensions,
    dramaticQuestion,
    playableRule,
    artSubject,
    planned: true,
    gallery: deckBudget,
  }
}

/** Production order is not a public level counter. World One is live separately. */
export const MEMORY_REALITY_EXPERIENCES: readonly RealityExperience[] = [
  experience(
    'e01',
    'briar',
    'Briar Marches',
    'earth-protagonist',
    'storybook',
    'original',
    ['meaning', 'cast', 'visual-language'],
    'Who is truly protecting the village?',
    'Leaf-seal memory matching and the House choice',
    'Wolf road, Briar camp, princesses, Oren and the rooted mansion',
  ),
  experience(
    'e02',
    'briar',
    'Briar Understory',
    'earth-protagonist',
    'storybook',
    'dark-reflection',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'Who pays for the victory in Briar?',
    'Revisit familiar coordinates with changed witness testimony and mirror routes',
    'Corrupted but spatially recognizable Briar and altered House testimony',
  ),
  experience(
    'e03',
    'city',
    'Morrow’s Shift',
    'morrow',
    'mundane',
    'original',
    ['meaning', 'mechanics', 'cast', 'visual-language'],
    'Can someone raised on magic understand an ordinary life?',
    'Technology, transit, work and social-memory logic',
    'Office, research desk, subway, human colleagues interpreted as fey archetypes',
  ),
  experience(
    'e04',
    'city',
    'The Unbelieving City',
    'morrow',
    'enchanted-earth',
    'possible-future',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'Whose safety fails when magic arrives uninvited?',
    'Rescue routes across a city where technology and magic conflict',
    'Same office and station now genuinely haunted by unleashed magic',
  ),
  experience(
    'e05',
    'crown',
    'Scylla’s Shore',
    'scylla',
    'underwater',
    'original',
    ['meaning', 'mechanics', 'cast', 'visual-language'],
    'Having witnessed the crossing, will Scylla choose to run away with Char again?',
    'Play the days before their first escape as an adult Scylla with future knowledge; decide whether to repeat, delay or disclose the plan',
    'The younger Char and the same royal palace as before the original escape; Scylla has been sent back into her younger life',
  ),
  experience(
    'e06',
    'crown',
    'Undertide Crown',
    'scylla',
    'underwater',
    'dark-reflection',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'Can Scylla face a warped second timeline without taking the choice away from Char?',
    'Twisted tide routes, conflicting witness memories and departures nobody can erase',
    'The same submerged court and escape route bent into a nightmare of rewritten testimony',
  ),
  experience(
    'e07',
    'hearth',
    'Hearth and Hunger',
    'earth-protagonist',
    'storybook',
    'original',
    ['meaning', 'mechanics', 'cast'],
    'Can Vesper confront a childhood safe-route map that later became a weapon?',
    'Return to Vesper’s cedar bridge, trace protected paths and decide who controls the refuge atlas',
    'Vesper the dusty-grey moth-folk cartographer, warm yōkai Hoshimori, cedar bridge, private atlas and Red Oven',
  ),
  experience(
    'e08',
    'hearth',
    'Hearth of Perfect Safety',
    'scylla',
    'hybrid',
    'dark-reflection',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'Can Vesper rescue people when every road insists on exposing their addresses?',
    'Distorted paper roads, looping houses, testimony-based exits and the monstrous yōkai night procession',
    'The same cedar bridge, refuge paths and Red Oven transformed into original ink-heavy anatomical and architectural nightmare',
  ),
  experience(
    'e09',
    'briar',
    'Briar: The Forest Between Floors',
    'earth-protagonist',
    'hybrid',
    'remembrance',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'Can you rescue people trapped inside a forest that now shares a floorplan with Morrow’s city?',
    'Recover the office turnstile and the submerged root map while forest monsters invade office corridors',
    'Same Briar paths, now cut by research offices, saltwater stairwells and Hoshimori lantern rites',
  ),
  experience(
    'e10',
    'city',
    'Morrow: The Office That Ate a Forest',
    'morrow',
    'hybrid',
    'repair',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'Will Morrow save the life he built on Earth without treating others as expendable?',
    'Recover the living-hours ledger and borrowed house key while yōkai shelter spirits reroute a flooded office',
    'Same Earth office, station and human neighborhood, intersecting Briar wolves and sea-palace flood tunnels',
  ),
  experience(
    'e11',
    'crown',
    'Char: The Sea Above the Station',
    'char',
    'hybrid',
    'remembrance',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'Can Char choose what to become while Scylla remembers a present in which she may have died?',
    'Recover the two sisters’ tide chart and the witness bell as forest roads bisect the mermaid palace',
    'The same underwater palace and escape route with subway trains, inverted cottages and past/future Char echoes',
  ),
  experience(
    'e12',
    'hearth',
    'Vesper: The Last Unwritten Road',
    'vesper',
    'hybrid',
    'repair',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'Who may redraw a world when every rescued person has their own right to leave?',
    'Recover the unsold refuge atlas and Oven hearth seal, then choose a negotiated shape for the final crossing',
    'Same Hoshimori cedar bridge, red Oven and childhood refuges invaded by office towers, tide gates and Briar wolves',
  ),
]

export const MEMORY_EARLY_ORDER = [
  'e01',
  'e02',
  'e03',
  'e04',
  'e05',
  'e06',
] as const
/**
 * Four intimate paired acts (eight realities) followed by four connected
 * memory-collision maps. The finale revisits, rather than invents, geographies.
 * e13–e16 remain retired save identifiers, not playable or planned worlds.
 */
export const MEMORY_REALITY_PAIRS = [
  ['e01', 'e02'],
  ['e03', 'e04'],
  ['e05', 'e06'],
  ['e07', 'e08'],
] as const satisfies readonly (readonly [ExperienceId, ExperienceId])[]

export const MEMORY_COLLISION_ORDER = ['e09', 'e10', 'e11', 'e12'] as const
export const MEMORY_FINALE_ORDER = MEMORY_COLLISION_ORDER

export const MEMORY_WISH_ANCHORS = {
  'morrow-magic-attempt': {
    source: 'e03',
    meaning:
      'Morrow attempted magic on mundane Earth; the future is not yet inevitable',
  },
  'scylla-home-wish': {
    source: 'e05',
    meaning:
      'Scylla asked to return home and discovered the underwater kingdom',
  },
  'char-possible-future': {
    source: 'e06',
    meaning:
      'Scylla investigates the cost of the World Four crossing; Char may be lost or alive depending on the player’s decision',
  },
} as const satisfies Record<string, { source: ExperienceId; meaning: string }>

export type MemoryPairEndingWorld =
  'e02' | 'e04' | 'e06' | 'e08' | 'e10' | 'e12'

export interface MemoryPairEndingChoice {
  id: string
  label: string
  publicResult: string
  worldFlag: string
  futureConsequence: string
}

/** Authoring contracts, not claims that later-world endings are already playable. */
export const MEMORY_PAIR_ENDINGS: Record<
  MemoryPairEndingWorld,
  readonly MemoryPairEndingChoice[]
> = {
  e02: [
    {
      id: 'trust-witnesses',
      label: 'Let the forest witnesses decide whose protection was real',
      publicResult: 'The village opens testimony to former enemies.',
      worldFlag: 'briar-witnesses-protected',
      futureConsequence: 'Later archive scenes recognize the forest witnesses.',
    },
    {
      id: 'protect-village',
      label: 'Keep the village gates closed until the danger is understood',
      publicResult:
        'The camp survives, but the witnesses wait beyond the wall.',
      worldFlag: 'briar-village-sealed',
      futureConsequence: 'Former outsiders cannot offer an early archive clue.',
    },
  ],
  e04: [
    {
      id: 'open-the-tide-gate',
      label:
        'Open the tide gate to save the commuters; the sea anchor may collapse',
      publicResult:
        'The trains escape. Scylla sees Char hold the sea anchor, then die when the crossing collapses.',
      worldFlag: 'earth-crowd-evacuated',
      futureConsequence:
        'Scylla witnesses Char die in the present at the end of World Four. A mysterious wish or echo sends Scylla back to her final days at home with a younger Char.',
    },
    {
      id: 'seal-the-tide-gate',
      label: 'Seal the tide gate before it destroys both shores',
      publicResult:
        'The sea-side defenders survive. The evacuation stops with people still inside.',
      worldFlag: 'earth-passengers-stranded',
      futureConsequence:
        'Char survives; Scylla investigates how to recover the stranded commuters and why the crossing was sealed.',
    },
    {
      id: 'divert-the-current',
      label: 'Send the surge into the abandoned maintenance district',
      publicResult:
        'The gate holds, but the surge ruins a district where someone might still be hiding.',
      worldFlag: 'earth-district-flooded',
      futureConsequence:
        'Char survives but is badly shaken, and the party must answer for the district that absorbed the surge.',
    },
  ],
  e06: [
    {
      id: 'publish-twin-testimony',
      label: 'Let the sisters’ testimony stand beside the court records',
      publicResult: 'The royal record now admits two incompatible accounts.',
      worldFlag: 'twin-testimony-public',
      futureConsequence:
        'Archive witnesses can challenge the official sea record.',
    },
    {
      id: 'protect-private-memory',
      label: 'Keep the sisters’ private departure records sealed',
      publicResult:
        'The court cannot compel either sister to retell her memories.',
      worldFlag: 'twin-testimony-private',
      futureConsequence:
        'The party must find independent evidence at the Archive.',
    },
  ],
  e08: [
    {
      id: 'unbar-all-doors',
      label: 'Let everyone leave the village, even those the spirits fear for',
      publicResult:
        'The night roads open, and households must organize their own help.',
      worldFlag: 'hoshimori-exits-open',
      futureConsequence: 'Pip can call on voluntary yōkai witnesses later.',
    },
    {
      id: 'keep-shelter-charter',
      label: 'Keep voluntary refuge rules but remove compulsory guardianship',
      publicResult:
        'Guests may stay or go, although the village has fewer beds.',
      worldFlag: 'hoshimori-refuge-charter',
      futureConsequence: 'The village supplies a small emergency refuge later.',
    },
  ],
  e10: [
    {
      id: 'destroy-price-ledger',
      label: 'Destroy the forecast that would sacrifice office evacuees',
      publicResult:
        'Morrow gets the workers out, but loses the predictive map of the distorted city.',
      worldFlag: 'market-predictions-erased',
      futureConsequence:
        'The party must navigate later routes without a forecast.',
    },
    {
      id: 'publish-price-ledger',
      label:
        'Publish the forecast with voluntary opt-out and independent review',
      publicResult:
        'The office workers can dispute the forecast, while some evacuation routes close.',
      worldFlag: 'market-predictions-accountable',
      futureConsequence:
        'The party gains a disputed prediction as later evidence.',
    },
  ],
  e12: [
    {
      id: 'free-transit',
      label: 'Unite the broken roads under a freely negotiated crossing',
      publicResult:
        'Vesper opens the Hoshimori crossings with consent-based passage and witnessed limits.',
      worldFlag: 'crossing-passenger-consent',
      futureConsequence:
        'The final crossing can rely on freely given transport.',
    },
    {
      id: 'disable-transit',
      label: 'Protect independent worlds by closing the unstable crossings',
      publicResult:
        'The worlds remain separate while refugees negotiate slower, safer routes.',
      worldFlag: 'crossing-system-disabled',
      futureConsequence: 'The final crossing must use a slower rescue route.',
    },
  ],
}

export const MEMORY_SCYLLA_DEPARTURE_CHOICES = [
  {
    id: 'run-again',
    label: 'Run away to the human world together, just as before',
    publicResult:
      'Scylla agrees to the original route. She refuses to assume history will repeat without a fight.',
    worldFlag: 'scylla-repeats-escape',
    futureConsequence:
      'The later crossing remembers both the original risk and Scylla’s decision to try again.',
  },
  {
    id: 'stay',
    label: 'Stay beneath the sea, even if it means giving up their dream',
    publicResult:
      'The sisters remain at court for now. Char demands to know why Scylla suddenly fears the surface.',
    worldFlag: 'scylla-stays-below',
    futureConsequence:
      'The altered present gains a new naval-political danger instead of a guaranteed rescue.',
  },
  {
    id: 'tell-char',
    label: 'Tell Char what Scylla remembers and let her decide',
    publicResult:
      'Scylla explains the impossible return without demanding a promise. Char listens, then insists her future belongs to her.',
    worldFlag: 'scylla-shares-foreknowledge',
    futureConsequence:
      'Char becomes an informed participant in the altered escape, even when her decision risks repeating tragedy.',
  },
] as const

export type MemoryScyllaDepartureChoice =
  (typeof MEMORY_SCYLLA_DEPARTURE_CHOICES)[number]['id']

/**
 * This is World Five's playable, irreversible decision, separate from
 * the ending choice of the e05/e06 geography. A second chance is not
 * automatic resurrection and cannot silently erase World Four history.
 */
export function chooseMemoryScyllaDeparture(
  progress: MemoryCampaignProgress,
  choice: MemoryScyllaDepartureChoice,
): MemoryCampaignProgress {
  if (
    !availableMemoryExperiences(progress).includes('e05') ||
    progress.scyllaDeparture
  )
    throw new Error('Scylla must be in her unchosen past')
  if (!MEMORY_SCYLLA_DEPARTURE_CHOICES.some((option) => option.id === choice))
    throw new Error('Unknown Scylla departure choice')
  return { ...progress, scyllaDeparture: choice }
}

export type MemoryCharFate = 'lost' | 'alive' | 'unresolved'

export function memoryCharFate(
  progress: MemoryCampaignProgress,
): MemoryCharFate {
  const decision = progress.pairDecisions?.e04
  if (decision === 'open-the-tide-gate') return 'lost'
  if (decision === 'seal-the-tide-gate' || decision === 'divert-the-current')
    return 'alive'
  return 'unresolved'
}

/**
 * World Four occurs in the present. The time displacement starts World Five
 * for ALL three endings; Char's original fate remains a stable historical
 * consequence while any new future is yet to be earned.
 */
export function scyllaOpeningForMemory(
  progress: MemoryCampaignProgress,
  reality: 'e05' | 'e06',
): string {
  const fate = memoryCharFate(progress)
  if (reality === 'e05') {
    if (fate === 'lost')
      return 'Scylla watched Char die at the sea gate. She wakes years earlier in her childhood palace. Char stands alive before her, excited for the escape they have planned. Only Scylla remembers the death.'
    if (progress.pairDecisions?.e04 === 'seal-the-tide-gate')
      return 'Char survived the sealed crossing, but commuters remain trapped. Scylla wakes years earlier, with a young Char still planning their escape to land. The same past now offers an unsettling second choice.'
    if (progress.pairDecisions?.e04 === 'divert-the-current')
      return 'Char survived, but the maintenance district paid for it. Scylla wakes in her younger body days before their escape. Char has no idea why her sister is suddenly afraid of a road they have not taken.'
    return 'Scylla stands in her childhood palace just before the sisters planned to escape to land. The past has returned, but not its answers.'
  }
  const departure = progress.scyllaDeparture
  if (fate === 'lost') {
    if (departure === 'run-again')
      return 'The distorted palace replays the same escape while Scylla hears Char’s final cry across the years. Repeating the journey is not a guarantee of changing the outcome.'
    if (departure === 'stay')
      return 'The drowned court offers safety beneath the sea, but Char resents being imprisoned by a future only Scylla can remember.'
    return 'The court tries to erase Char’s testimony after Scylla told her the future. The sisters must decide what they believe together.'
  }
  if (departure === 'stay')
    return 'The distorted sea makes staying seem perfectly safe. Char asks what the two of them have sacrificed for that safety.'
  if (departure === 'tell-char')
    return 'The court demands a single official story, but Char remembers what Scylla told her and refuses to surrender her choice.'
  return 'The distorted timeline recreates the escape. Scylla remembers what happened at the crossing and what it cost, even with Char still alive in the present she left behind.'
}

export function memoryPairWorldFlags(
  progress: MemoryCampaignProgress,
): string[] {
  const flags = (
    Object.entries(progress.pairDecisions ?? {}) as [
      MemoryPairEndingWorld,
      string,
    ][]
  ).flatMap(([world, id]) => {
    const choice = MEMORY_PAIR_ENDINGS[world]?.find((item) => item.id === id)
    return choice ? [choice.worldFlag] : []
  })
  const departure = MEMORY_SCYLLA_DEPARTURE_CHOICES.find(
    (option) => option.id === progress.scyllaDeparture,
  )
  if (departure) flags.push(departure.worldFlag)
  return flags
}

/** One durable, irreversible decision per paired world, before its exit. */
export function chooseMemoryPairEnding(
  progress: MemoryCampaignProgress,
  world: MemoryPairEndingWorld,
  choiceId: string,
): MemoryCampaignProgress {
  if (
    !availableMemoryExperiences(progress).includes(world) ||
    progress.pairDecisions?.[world]
  )
    throw new Error('World-pair decision is not available or already resolved')
  if (!MEMORY_PAIR_ENDINGS[world].some((choice) => choice.id === choiceId))
    throw new Error('Unknown world-pair decision')
  return {
    ...progress,
    pairDecisions: { ...progress.pairDecisions, [world]: choiceId },
  }
}

export const MEMORY_COLLISION_FRAGMENTS = [
  {
    id: 'briar-office-key',
    world: 'e09',
    source: 'city',
    location: 'Briar House / Office turnstile',
    encounter:
      'A wolf has learned to punch a timecard. Rescue the office guards before the old Briar House names them trespassers.',
  },
  {
    id: 'briar-tide-roots',
    world: 'e09',
    source: 'crown',
    location: 'Wolf road / Flooded stair',
    encounter:
      'The rooted path follows underwater palace currents. Restore two contradictory maps without condemning the hidden households.',
  },
  {
    id: 'city-lantern-charter',
    world: 'e10',
    source: 'hearth',
    location: 'Morrow research lab / Yōkai refuge',
    encounter:
      'A zashiki-warashi has taken the night shift. Negotiate shelter rights while the fluorescent lights make ghosts out of office workers.',
  },
  {
    id: 'city-forest-hours',
    world: 'e10',
    source: 'briar',
    location: 'Subway platform / Briar canopy',
    encounter:
      'The forest grows across the train timetable. Reconcile an office shift with a seasonal ward before the last commuter disappears.',
  },
  {
    id: 'sea-unwritten-map',
    world: 'e11',
    source: 'hearth',
    location: 'Mermaid palace / Vesper atlas',
    encounter:
      'Char follows Vesper’s refuge map along coral corridors that were never safe to publish.',
  },
  {
    id: 'sea-sister-bell',
    world: 'e11',
    source: 'city',
    location: 'Royal audience chamber / Train announcement',
    encounter:
      'A station bell calls two versions of Char by name. Char must decide what testimony belongs to her and what is only Scylla’s memory.',
  },
  {
    id: 'village-wolf-door',
    world: 'e12',
    source: 'briar',
    location: 'Hoshimori footbridge / Briar wolf gate',
    encounter:
      'A wolf carrying an office badge guards Vesper’s childhood stepping stones. Negotiate a route without revealing the refugees’ homes.',
  },
  {
    id: 'village-tidal-oven',
    world: 'e12',
    source: 'crown',
    location: 'Red Oven / Palace tide gate',
    encounter:
      'The baker’s oven empties into the mermaid palace. Recover the right to refuse a memory payment before any final world can be repaired.',
  },
] as const

export type MemoryCollisionFragmentId =
  (typeof MEMORY_COLLISION_FRAGMENTS)[number]['id']

export function recoverMemoryCollisionFragment(
  progress: MemoryCampaignProgress,
  id: MemoryCollisionFragmentId,
): MemoryCampaignProgress {
  const fragment = MEMORY_COLLISION_FRAGMENTS.find((part) => part.id === id)
  if (!fragment) throw new Error('Unknown memory fragment')
  if (!availableMemoryExperiences(progress).includes(fragment.world))
    throw new Error('Fragment belongs to another world')
  if (progress.recoveredFragments?.includes(id)) return progress
  return {
    ...progress,
    recoveredFragments: [...(progress.recoveredFragments ?? []), id],
  }
}

export const MEMORY_LAST_CHOICE = [
  {
    id: 'repair-with-consent',
    label: 'Rebuild the crossings with explicit consent from each world',
    consequence:
      'The worlds remain distinct and sometimes difficult, but people can negotiate passage, keep their own histories and refuse a rescue.',
  },
  {
    id: 'let-worlds-separate',
    label:
      'Allow the worlds to pull apart, with protected routes for those stranded',
    consequence:
      'Borders settle. Rescue is slower, but no single cartographer, crown or machine can claim everyone as property.',
  },
] as const

export type MemoryLastChoice = (typeof MEMORY_LAST_CHOICE)[number]['id']

export function chooseMemoryLastChoice(
  progress: MemoryCampaignProgress,
  choice: MemoryLastChoice,
): MemoryCampaignProgress {
  if (
    !availableMemoryExperiences(progress).includes('e12') ||
    progress.lastChoice
  )
    throw new Error('The final decision has not been earned or is resolved')
  if (!MEMORY_LAST_CHOICE.some((option) => option.id === choice))
    throw new Error('Unknown final choice')
  return { ...progress, lastChoice: choice }
}

/**
 * Thirty-two core ending families come from four major paired-act outcomes
 * and one final decision. e10/e12 crossroads and Scylla's three-way choice
 * keep changing routes, relationships and epilogue facts, not the core ID.
 */
export function memoryCoreEndingId(
  progress: MemoryCampaignProgress,
): number | null {
  if (!progress.completed.includes('e12') || !progress.lastChoice) return null
  const flags = [
    progress.pairDecisions?.e02 === 'trust-witnesses',
    progress.pairDecisions?.e04 === 'open-the-tide-gate',
    progress.pairDecisions?.e06 === 'publish-twin-testimony',
    progress.pairDecisions?.e08 === 'unbar-all-doors',
    progress.lastChoice === 'repair-with-consent',
  ]
  return flags.reduce(
    (id, enabled, index) => id + (enabled ? 1 << index : 0),
    0,
  )
}

/**
 * Thirty-two different authored endpoint texts. Scenes and illustrated
 * cinematic production remain future work; these are deterministic story
 * contracts grounded in the four act choices and final resolution.
 */
export const MEMORY_CORE_ENDINGS = [
  {
    title: 'The Road Nobody Claimed',
    closing:
      "With the worlds separated, the surviving villagers keep their refuge maps private. Morrow's city learns to live without a magical shortcut.",
  },
  {
    title: 'Witnesses at the Quiet Border',
    closing:
      "Briar's witnesses open an independent road tribunal, but crossing remains optional. The forest earns trust by refusing to demand it.",
  },
  {
    title: 'The Shore That Remembers',
    closing:
      'Scylla will never forget the gate Char held. The worlds separate before anyone can demand that another sister become the price of passage.',
  },
  {
    title: 'The Last Honest Confession',
    closing:
      "Briar's witnesses publish the rescue and its terrible price. The worlds still separate, with Char's name left in the hearing as an irreducible fact.",
  },
  {
    title: 'The Sealed Royal Letter',
    closing:
      "The court's testimony becomes public, but no border can repair a missing conversation. Families work across the divide through letters carried by volunteers.",
  },
  {
    title: 'A Choir of Unfinished Claims',
    closing:
      "Briar's rescued families and the mermaid court challenge their official histories. Separation protects their right to disagree rather than one ruler's preferred story.",
  },
  {
    title: 'The Bell at the Empty Gate',
    closing:
      "Char's sacrifice and the sea court's full testimony cannot be made harmless. A bell rings for the missing on both shores, and each shore keeps its own law.",
  },
  {
    title: 'The Archive That Refused a Verdict',
    closing:
      'Witnesses of Briar and the sea reject a single heroic summary of the gate. They protect a truthful record even when the worlds choose to part.',
  },
  {
    title: 'The Village with Open Doors',
    closing:
      "Hoshimori's doors remain open after the borders settle. Every traveler must still ask to enter, and no home is turned into a compulsory shelter.",
  },
  {
    title: 'A Road Through the Cedar Trees',
    closing:
      'Briar and Hoshimori create a voluntary courier route between separated worlds. Vesper shares oversight rather than selling the road.',
  },
  {
    title: 'The Lantern for Char',
    closing:
      "Hoshimori's children hang a lantern for the sister lost at the crossing. Their village keeps its gates open, but refuses a promise that everyone can be saved.",
  },
  {
    title: 'When Every Witness Walked Home',
    closing:
      "The village witnesses, the forest and Scylla all keep their own exits. The gate's loss remains real, yet no one can use it to cage a survivor.",
  },
  {
    title: 'The Tide Charter',
    closing:
      'Open Hoshimori doors and public sea testimony allow a shared rescue compact. Separate shores accept oversight instead of a permanent magical empire.',
  },
  {
    title: "The Moth's Unbroken Route",
    closing:
      "Vesper's neighbors protect the hidden roads while Briar's witnesses cross voluntarily. The sea testimony stays available without revealing a single refuge address.",
  },
  {
    title: 'An Open Door, an Empty Chair',
    closing:
      "The sea court and Hoshimori publish the costs of passage, including Char's death. The worlds part without pretending the empty chair belongs to a better timeline.",
  },
  {
    title: 'The Many-Lantern Accord',
    closing:
      'Forest, sea and village witnesses refuse a universal truth and write their separate rules together. Every door opens from inside.',
  },
  {
    title: 'Threads of a New Crossing',
    closing:
      'The repaired crossings join independent homes, not conquered territories. Each refuge keeps a right to withdraw its road from the network.',
  },
  {
    title: 'The Witness Bridge',
    closing:
      "Briar's witnesses supervise a fragile shared route. Morrow's office workers can object to a magical rule and expect an answer.",
  },
  {
    title: "The Sister's Unfinished Map",
    closing:
      "The crossings reopen with Char's loss written into their foundation, not erased from them. Scylla chooses to protect travelers who were not her sister.",
  },
  {
    title: 'The Price on Every Ticket',
    closing:
      'Briar witnesses name the cost of the earlier rescue. The joined worlds require informed consent, even when that makes a miracle slower.',
  },
  {
    title: 'The Open Royal Archive',
    closing:
      "Sea testimony turns a single passage into a place for disagreement. No royal signature can waive another passenger's consent.",
  },
  {
    title: 'The Bridge of Contrary Stories',
    closing:
      'Briar and the sea court share routes while preserving incompatible records. The bridge works precisely because nobody may rewrite an opposing witness.',
  },
  {
    title: 'The Tide That Kept Its Name',
    closing:
      "A restored crossing carries the story of Char's death into the future without turning it into a command. Scylla can grieve without owning the lives of strangers.",
  },
  {
    title: 'The Archive of Living Risks',
    closing:
      "Every witness can contest the repair. The bridge remains provisional, and the royal record includes the families once displaced by Vesper's map.",
  },
  {
    title: 'The Lantern Exchange',
    closing:
      'Hoshimori opens its gates to the reconstructed roads. Guests may accept food, refuse memory payment, and return to homes that remain their own.',
  },
  {
    title: 'The Cedar and the Wolf',
    closing:
      "Vesper's community and Briar's witnesses administer a shared passage. Neither a cartographer nor a guardian may publish every address.",
  },
  {
    title: 'A Lantern Carried for Two',
    closing:
      "Scylla crosses the new route carrying the memory of Char's last stand. Hoshimori offers a place to stay without calling the visit a cure.",
  },
  {
    title: 'The Map With Room to Leave',
    closing:
      "Briar and Hoshimori witnesses oversee the repair, and Char's sacrifice remains documented. Any traveler can choose the slower way out.",
  },
  {
    title: 'The Open Sea Council',
    closing:
      'The mermaid court and lantern village welcome each other without merging their laws. Every family can revoke a promise made in its name.',
  },
  {
    title: 'The Wing and the Wave',
    closing:
      "Vesper's shared atlas protects refugees while royal witnesses oversee the tides. The repaired worlds give even an absent person a right to privacy.",
  },
  {
    title: 'The Unpaid Debt of the Living',
    closing:
      "Char's death cannot be traded for a flawless ending. The reunited worlds instead keep open the roads on which future rescues may be freely chosen.",
  },
  {
    title: 'The Unwritten Country of Many Hands',
    closing:
      'All four journeys converge without a compulsory final author. Forest, city, sea and village keep the power to say no, and their people decide what comes next.',
  },
] as const

export function memoryCoreEnding(
  progress: MemoryCampaignProgress,
): { id: number; title: string; closing: string } | null {
  const id = memoryCoreEndingId(progress)
  if (id === null) return null
  const ending = MEMORY_CORE_ENDINGS[id]!
  return { id, title: ending.title, closing: ending.closing }
}

/** Vary the epilogue with choices that do not multiply the 32 core endings. */
export function memoryEndingConsequences(
  progress: MemoryCampaignProgress,
): string[] {
  if (!progress.completed.includes('e12')) return []
  const branches = [
    ...memoryPairWorldFlags(progress),
    ...(progress.recoveredFragments ?? []),
  ]
  return [...new Set(branches)]
}

export type MemoryWishAnchorId = keyof typeof MEMORY_WISH_ANCHORS

export interface MemoryCampaignProgress {
  completed: readonly ExperienceId[]
  rememberedAnchors: readonly MemoryWishAnchorId[]
  finaleCommitted: boolean
  pairDecisions?: Partial<Record<MemoryPairEndingWorld, string>>
  scyllaDeparture?: MemoryScyllaDepartureChoice | 'legacy-unspoken'
  recoveredFragments?: readonly MemoryCollisionFragmentId[]
  lastChoice?: MemoryLastChoice
  /** Historical e09–e16 entries, never automatic completion of new finale. */
  legacyCompleted?: readonly ExperienceId[]
  campaignVersion?: 2
}

export function newMemoryCampaignProgress(): MemoryCampaignProgress {
  return {
    completed: [],
    rememberedAnchors: [],
    finaleCommitted: false,
    pairDecisions: {},
    recoveredFragments: [],
    campaignVersion: 2,
  }
}

/** Only destinations discovered or earned are returned; no spoiler-filled map menu. */
export function availableMemoryExperiences(
  progress: MemoryCampaignProgress,
): ExperienceId[] {
  const completed = new Set(progress.completed)
  const anchors = new Set(progress.rememberedAnchors)
  const next = [...MEMORY_REALITY_PAIRS.flat(), ...MEMORY_COLLISION_ORDER].find(
    (id) => !completed.has(id),
  )
  if (!next) return []

  if (next === 'e04' && !anchors.has('morrow-magic-attempt')) return []
  if (next === 'e06' && !anchors.has('scylla-home-wish')) return []
  if (next === 'e09' && !anchors.has('char-possible-future')) return []
  if (
    MEMORY_FINALE_ORDER.includes(
      next as (typeof MEMORY_FINALE_ORDER)[number],
    ) &&
    next !== 'e09' &&
    !progress.finaleCommitted
  )
    return []

  return [next]
}

/** A wish records an authored event, rather than mutating all previous choices. */
export function rememberMemoryWish(
  progress: MemoryCampaignProgress,
  anchor: MemoryWishAnchorId,
): MemoryCampaignProgress {
  const source = MEMORY_WISH_ANCHORS[anchor].source
  if (
    !progress.completed.includes(source) &&
    !availableMemoryExperiences(progress).includes(source)
  ) {
    throw new Error(`Wish ${anchor} must be experienced in ${source}`)
  }
  if (progress.rememberedAnchors.includes(anchor)) return progress
  return {
    ...progress,
    rememberedAnchors: [...progress.rememberedAnchors, anchor],
  }
}

export function commitToMemoryFinale(
  progress: MemoryCampaignProgress,
): MemoryCampaignProgress {
  if (!availableMemoryExperiences(progress).includes('e09')) {
    throw new Error('The final crossing has not been earned')
  }
  return { ...progress, finaleCommitted: true }
}

export function completeMemoryExperience(
  progress: MemoryCampaignProgress,
  id: ExperienceId,
): MemoryCampaignProgress {
  if (!availableMemoryExperiences(progress).includes(id)) {
    throw new Error(`Experience ${id} is not currently reachable`)
  }
  if (id === 'e09' && !progress.finaleCommitted) {
    throw new Error('Finale requires an explicit commitment')
  }
  if (MEMORY_COLLISION_ORDER.some((world) => world === id)) {
    const missing = MEMORY_COLLISION_FRAGMENTS.filter(
      (part) =>
        part.world === id && !progress.recoveredFragments?.includes(part.id),
    )
    if (missing.length)
      throw new Error('Recover both misplaced world fragments before leaving')
  }
  if (id === 'e12' && !progress.lastChoice)
    throw new Error('The final world requires a consequential last choice')
  if (id === 'e05' && !progress.scyllaDeparture)
    throw new Error('Scylla must decide whether to repeat the escape')
  if (
    id !== 'e02' &&
    Object.prototype.hasOwnProperty.call(MEMORY_PAIR_ENDINGS, id) &&
    !progress.pairDecisions?.[id as MemoryPairEndingWorld]
  ) {
    throw new Error('World-pair ending requires an earned decision')
  }
  return { ...progress, completed: [...progress.completed, id] }
}

export interface FinaleRealityPhase {
  id: string
  ontology: RealityOntology
  perspective: RealityPerspective
  terrain: string
  playableCrisis: string
}

/** Each entry is a real gameplay state, not a background-only cinematic. */
export const MEMORY_FINALE_PHASES: readonly FinaleRealityPhase[] = [
  {
    id: 'ordinary-earth',
    ontology: 'mundane',
    perspective: 'earth-protagonist',
    terrain: 'Research district',
    playableCrisis:
      'Protect the people whose lives were traded without consent',
  },
  {
    id: 'earth-after-magic',
    ontology: 'enchanted-earth',
    perspective: 'morrow',
    terrain: 'Broken transit and office wards',
    playableCrisis:
      'Evacuate a neighborhood when ordinary institutions cannot explain a threat',
  },
  {
    id: 'remembered-briar',
    ontology: 'storybook',
    perspective: 'earth-protagonist',
    terrain: 'House and wolf road in a revised forest',
    playableCrisis:
      'Reconcile former protectors and their witnesses without erasing testimony',
  },
  {
    id: 'undertide-kingdom',
    ontology: 'underwater',
    perspective: 'scylla',
    terrain: 'Drowned royal court',
    playableCrisis:
      'Confront the sisters’ landward-departure record without erasing Char’s choices',
  },
  {
    id: 'optimized-future',
    ontology: 'science-fiction',
    perspective: 'morrow',
    terrain: 'Prediction and transfer network',
    playableCrisis:
      'Refuse a supposedly perfect algorithmic future that lacks consent',
  },
  {
    id: 'unwritten-synthesis',
    ontology: 'hybrid',
    perspective: 'earth-protagonist',
    terrain: 'Unwritten Country and the Last Door',
    playableCrisis:
      'Build a defensible future using verified history and freely given promises',
  },
]

/** QA guardrails: the campaign must not drift back into sixteen cosmetic maps. */
export function validateMemoryReimaginerCampaign(): string[] {
  const errors: string[] = []
  const concepts = new Set(MEMORY_WORLD_CONCEPTS.map((concept) => concept.id))
  const ids = new Set(
    MEMORY_REALITY_EXPERIENCES.map((experience) => experience.id),
  )
  if (concepts.size !== 4 || MEMORY_WORLD_CONCEPTS.length !== 4)
    errors.push('Expected four original act geographies')
  if (ids.size !== 12 || MEMORY_REALITY_EXPERIENCES.length !== 12)
    errors.push('Expected twelve unique experiences')
  if (
    [...MEMORY_REALITY_PAIRS.flat(), ...MEMORY_COLLISION_ORDER].join(',') !==
    MEMORY_REALITY_EXPERIENCES.map((entry) => entry.id).join(',')
  )
    errors.push(
      'Four original/twisted pairs must be followed by four memory-collision maps',
    )
  for (const [original, twisted] of MEMORY_REALITY_PAIRS) {
    const before = MEMORY_REALITY_EXPERIENCES.find(
      (entry) => entry.id === original,
    )
    const after = MEMORY_REALITY_EXPERIENCES.find(
      (entry) => entry.id === twisted,
    )
    if (!before || !after || before.concept !== after.concept)
      errors.push(`Reality pair ${original}/${twisted} changes geography`)
  }
  const pairEndings = [
    ...MEMORY_REALITY_PAIRS.map(([, second]) => second),
    'e10',
    'e12',
  ]
  if (
    pairEndings.some(
      (id) =>
        !Object.prototype.hasOwnProperty.call(MEMORY_PAIR_ENDINGS, id) ||
        MEMORY_PAIR_ENDINGS[id as MemoryPairEndingWorld].length < 2,
    )
  )
    errors.push('Every twisted overworld needs a consequential exit choice')
  const flags = Object.values(MEMORY_PAIR_ENDINGS).flatMap((choices) =>
    choices.map((choice) => choice.worldFlag),
  )
  if (new Set(flags).size !== flags.length)
    errors.push('World-pair choices must have distinct cross-world flags')
  if (
    new Set(MEMORY_SCYLLA_DEPARTURE_CHOICES.map((option) => option.id)).size !==
      MEMORY_SCYLLA_DEPARTURE_CHOICES.length ||
    MEMORY_SCYLLA_DEPARTURE_CHOICES.some(
      (option) =>
        !option.label || !option.publicResult || !option.futureConsequence,
    )
  )
    errors.push('Scylla needs three consequential departure choices')
  for (const choices of Object.values(MEMORY_PAIR_ENDINGS)) {
    if (
      new Set(choices.map((choice) => choice.id)).size !== choices.length ||
      choices.some(
        (choice) =>
          !choice.label ||
          !choice.publicResult ||
          !choice.futureConsequence ||
          !choice.worldFlag,
      )
    )
      errors.push('Incomplete or duplicate world-pair consequence')
  }
  for (const concept of MEMORY_WORLD_CONCEPTS) {
    const variants = MEMORY_REALITY_EXPERIENCES.filter(
      (experience) => experience.concept === concept.id,
    )
    if (variants.length !== 3)
      errors.push(
        `Act ${concept.id} needs original, twisted, and crossover incarnations`,
      )
    if (
      new Set(variants.map((variant) => variant.state)).size !== variants.length
    ) {
      errors.push(
        `Concept ${concept.id} needs distinct wish/reinterpretation states`,
      )
    }
  }
  for (const experience of MEMORY_REALITY_EXPERIENCES) {
    if (!concepts.has(experience.concept))
      errors.push(`Unknown concept on ${experience.id}`)
    if (new Set(experience.changeDimensions).size < 3)
      errors.push(
        `Variant ${experience.id} changes fewer than three dimensions`,
      )
    if (
      experience.gallery.local !== 30 ||
      experience.gallery.collaborations !== 2
    ) {
      errors.push(`Variant ${experience.id} needs a 30+2 gallery`)
    }
    if (
      !experience.dramaticQuestion ||
      !experience.playableRule ||
      !experience.artSubject
    ) {
      errors.push(
        `Variant ${experience.id} lacks an authored production promise`,
      )
    }
  }
  if (MEMORY_FINALE_ORDER.join(',') !== 'e09,e10,e11,e12')
    errors.push(
      'Four connected finale maps must revisit the four original worlds',
    )
  if (MEMORY_COLLISION_FRAGMENTS.length !== 8)
    errors.push('The four finale maps need eight misplaced memory fragments')
  if (
    new Set(MEMORY_COLLISION_FRAGMENTS.map((part) => part.id)).size !== 8 ||
    MEMORY_COLLISION_ORDER.some(
      (world) =>
        MEMORY_COLLISION_FRAGMENTS.filter((part) => part.world === world)
          .length !== 2,
    )
  )
    errors.push('Each finale map needs two unique displaced memory fragments')
  if (
    MEMORY_COLLISION_ORDER.some(
      (world) =>
        MEMORY_REALITY_EXPERIENCES.find((entry) => entry.id === world)
          ?.ontology !== 'hybrid',
    )
  )
    errors.push('Every finale map must physically mix rules and locations')
  if (MEMORY_LAST_CHOICE.length !== 2)
    errors.push('The last decision must have two consequences')
  if (
    MEMORY_CORE_ENDINGS.length !== 32 ||
    new Set(MEMORY_CORE_ENDINGS.map((ending) => ending.title)).size !== 32
  )
    errors.push('Core finale needs thirty-two distinct authored outcomes')
  if (MEMORY_FINALE_PHASES.length < 6)
    errors.push(
      'Finale needs multiple playable realities and at least five transitions',
    )
  for (let index = 1; index < MEMORY_FINALE_PHASES.length; index++) {
    const previous = MEMORY_FINALE_PHASES[index - 1]!
    const current = MEMORY_FINALE_PHASES[index]!
    const shifts = [
      previous.ontology !== current.ontology,
      previous.perspective !== current.perspective,
      previous.terrain !== current.terrain,
    ]
    if (shifts.filter(Boolean).length < 2)
      errors.push(`Reality phase ${current.id} is a cosmetic reskin`)
  }
  return errors
}
