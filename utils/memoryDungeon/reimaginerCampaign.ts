/**
 * Reimaginer campaign authoring and route rules. This is a content/branching
 * contract, not sixteen shipped maps or delivered illustrations.
 * Briar's existing save/coordinate IDs continue to be owned by
 * memoryDungeonWorld.ts; these IDs identify *experience variants* instead.
 */
export type MemoryConceptId =
  | 'briar'
  | 'hearth'
  | 'crown'
  | 'market'
  | 'city'
  | 'crossing'
  | 'archive'
  | 'forge'
export type RealityPerspective = 'earth-protagonist' | 'morrow' | 'scylla'
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
    id: 'market',
    title: 'Market / Desire',
    thesis: 'The value of a future cannot be reduced to a price',
    landmarkPromise: 'The carnival lanes recur as a market for possible lives',
  },
  {
    id: 'city',
    title: 'City / Ordinary Life',
    thesis: 'Everyday customs are mysterious from outside',
    landmarkPromise:
      'Office, station, neighborhood and hospital remain in place after magic',
  },
  {
    id: 'crossing',
    title: 'Transit / Crossing',
    thesis: 'Return is never free of other peoples stories',
    landmarkPromise:
      'Ferry terminals, bridges and crossings retain stable routes',
  },
  {
    id: 'archive',
    title: 'Archive / Authorship',
    thesis: 'Competing testimonies cannot simply be edited into one history',
    landmarkPromise:
      'The record hall survives successive ontologies and viewpoints',
  },
  {
    id: 'forge',
    title: 'Forge / Transformation',
    thesis: 'Repairing reality requires accountable compromises',
    landmarkPromise:
      'The foundry transforms into sea vent, server room and Last Door',
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
    'What did Scylla and Char believe leaving the sea would cost?',
    'Mermaid childhood memories, a landward escape plan, twin testimony and Oren logistics',
    'The sisters as young mermaid princesses, an underwater palace, their departure chart and the shore they dreamed about',
  ),
  experience(
    'e06',
    'crown',
    'Undertide Crown',
    'scylla',
    'underwater',
    'dark-reflection',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'What does Scylla owe Char when the last crossing changes their futures?',
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
    'What may a community sacrifice to stay fed?',
    'Memory recipes, rations and accountable bargains',
    'Village oven, generous baker, missing family memories',
  ),
  experience(
    'e08',
    'hearth',
    'Hearth of Perfect Safety',
    'scylla',
    'hybrid',
    'wished-for',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'When does protecting a home prevent anyone from leaving?',
    'Safety contracts that transform available routes',
    'The same cottages sealed by a seemingly benevolent protective wish',
  ),
  experience(
    'e09',
    'market',
    'Carnival of Debts',
    'earth-protagonist',
    'storybook',
    'original',
    ['meaning', 'mechanics', 'cast', 'visual-language'],
    'Can future happiness be traded with consent?',
    'Transparent probabilities and memory-of-regret puzzles',
    'Carnival midway, joy ledgers and performers with binding bargains',
  ),
  experience(
    'e10',
    'market',
    'Tomorrow Market',
    'morrow',
    'science-fiction',
    'possible-future',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'Is a predicted life something a person agreed to live?',
    'Possible-future valuation and informed negotiation',
    'Same carnival footprint rebuilt as a predictive future exchange',
  ),
  experience(
    'e11',
    'crossing',
    'Between Sea',
    'scylla',
    'storybook',
    'original',
    ['meaning', 'mechanics', 'traversal'],
    'Can anybody claim a return ticket another person needs?',
    'Fair portal pairings, passenger testimony and ferry routes',
    'Ferry keeper, mermaid crossings and unwillingly exchanged lives',
  ),
  experience(
    'e12',
    'crossing',
    'The Transfer Network',
    'morrow',
    'science-fiction',
    'repair',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'What does a repaired identity transport system owe its passengers?',
    'Consent-aware transfers and route capacity puzzles',
    'The same harbor reimagined as a body-and-permission network',
  ),
  experience(
    'e13',
    'archive',
    'Index of What Happened',
    'earth-protagonist',
    'storybook',
    'remembrance',
    ['meaning', 'mechanics', 'cast', 'visual-language'],
    'Can conflicting witnesses all tell a useful truth?',
    'Testimony reconciliation across shifting perspectives',
    'A library unfolding into an Earth office archive and drowned royal records',
  ),
  experience(
    'e14',
    'archive',
    'Index of What Could Be',
    'morrow',
    'science-fiction',
    'possible-future',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'Who owns a possible future before it becomes real?',
    'Compare and constrain competing rewrite proposals',
    'Paper stacks becoming data servers, fairytale scripts and human homes',
  ),
  experience(
    'e15',
    'forge',
    'Forge of Consequences',
    'scylla',
    'hybrid',
    'repair',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'Which repairs are possible without imposing them on others?',
    'Multi-reality traversal and resource-bounded rescues',
    'A foundry becomes volcanic vent, station, data conduit and portal',
  ),
  experience(
    'e16',
    'forge',
    'Unwritten Country',
    'earth-protagonist',
    'hybrid',
    'wished-for',
    ['meaning', 'mechanics', 'traversal', 'cast', 'visual-language'],
    'Can anyone write a future that everyone affected can inhabit?',
    'Multiple phases of evidence, rescue, combat, negotiation and consent',
    'The Last Door and six visually distinct realities repaired in sequence',
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
export const MEMORY_MIDDLE_PAIRS = [
  ['e07', 'e08'],
  ['e09', 'e10'],
  ['e11', 'e12'],
] as const
export const MEMORY_FINALE_ORDER = ['e13', 'e14', 'e15', 'e16'] as const

/**
 * Eight distinct authored geographies, each immediately followed by its
 * distorted reimagining. Pair order is canonical even if scenes are not built.
 * Keep machine IDs and the historic wish-anchor keys stable for old saves.
 */
export const MEMORY_REALITY_PAIRS = [
  ['e01', 'e02'],
  ['e03', 'e04'],
  ['e05', 'e06'],
  ['e07', 'e08'],
  ['e09', 'e10'],
  ['e11', 'e12'],
  ['e13', 'e14'],
  ['e15', 'e16'],
] as const satisfies readonly (readonly [ExperienceId, ExperienceId])[]

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
  | 'e02'
  | 'e04'
  | 'e06'
  | 'e08'
  | 'e10'
  | 'e12'
  | 'e14'
  | 'e16'

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
      publicResult: 'The camp survives, but the witnesses wait beyond the wall.',
      worldFlag: 'briar-village-sealed',
      futureConsequence: 'Former outsiders cannot offer an early archive clue.',
    },
  ],
  e04: [
    {
      id: 'open-the-tide-gate',
      label: 'Open the tidal gate and evacuate the trapped commuters',
      publicResult:
        'The trains escape. A defender holds the sea-side anchor while the signal breaks.',
      worldFlag: 'earth-crowd-evacuated',
      futureConsequence:
        'Char chooses to hold the collapsing anchor and dies. Scylla investigates what happened. The player is not told this in the opening caption.',
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
      futureConsequence: 'Archive witnesses can challenge the official sea record.',
    },
    {
      id: 'protect-private-memory',
      label: 'Keep the sisters’ private departure records sealed',
      publicResult: 'The court cannot compel either sister to retell her memories.',
      worldFlag: 'twin-testimony-private',
      futureConsequence: 'The party must find independent evidence at the Archive.',
    },
  ],
  e08: [
    {
      id: 'unbar-all-doors',
      label: 'Let everyone leave the village, even those the spirits fear for',
      publicResult: 'The night roads open, and households must organize their own help.',
      worldFlag: 'hoshimori-exits-open',
      futureConsequence: 'Pip can call on voluntary yōkai witnesses later.',
    },
    {
      id: 'keep-shelter-charter',
      label: 'Keep voluntary refuge rules but remove compulsory guardianship',
      publicResult: 'Guests may stay or go, although the village has fewer beds.',
      worldFlag: 'hoshimori-refuge-charter',
      futureConsequence: 'The village supplies a small emergency refuge later.',
    },
  ],
  e10: [
    {
      id: 'destroy-price-ledger',
      label: 'Erase the market’s valuations of other people’s futures',
      publicResult: 'The futures are free, but the party loses the prediction map.',
      worldFlag: 'market-predictions-erased',
      futureConsequence: 'The party must navigate later routes without a forecast.',
    },
    {
      id: 'publish-price-ledger',
      label: 'Release the predictions with informed opt-out rights',
      publicResult: 'The forecasts become contestable, and some vendors leave.',
      worldFlag: 'market-predictions-accountable',
      futureConsequence: 'The party gains a disputed prediction as later evidence.',
    },
  ],
  e12: [
    {
      id: 'free-transit',
      label: 'Open the transfer crossing with strict passenger consent',
      publicResult: 'Travel resumes; waiting passengers receive priority.',
      worldFlag: 'crossing-passenger-consent',
      futureConsequence: 'The final crossing can rely on freely given transport.',
    },
    {
      id: 'disable-transit',
      label: 'Shut down the system until identities can be verified',
      publicResult: 'No more identities are taken, but refugees remain separated.',
      worldFlag: 'crossing-system-disabled',
      futureConsequence: 'The final crossing must use a slower rescue route.',
    },
  ],
  e14: [
    {
      id: 'publish-contradictions',
      label: 'Preserve all contradictory accounts for the final hearing',
      publicResult: 'No one can rewrite the past without facing another witness.',
      worldFlag: 'archive-testimonies-protected',
      futureConsequence: 'The final tribunal has a stronger, noisier evidence record.',
    },
    {
      id: 'seal-dangerous-records',
      label: 'Withhold dangerous records until their subjects can consent',
      publicResult: 'Some testimony stays private, even when it might help.',
      worldFlag: 'archive-testimonies-sealed',
      futureConsequence: 'The final tribunal must earn access through negotiation.',
    },
  ],
  e16: [
    {
      id: 'share-repair',
      label: 'Commit to a shared repair that nobody can own alone',
      publicResult: 'The new world is difficult, provisional and freely inhabited.',
      worldFlag: 'finale-shared-repair',
      futureConsequence: 'The ending honors independent consent and accountability.',
    },
    {
      id: 'retain-separate-worlds',
      label: 'Let the worlds remain separate with negotiated crossings',
      publicResult: 'The borders survive; people can choose whether to cross.',
      worldFlag: 'finale-separate-worlds',
      futureConsequence: 'The ending preserves distance and a costly right to leave.',
    },
  ],
}

export type MemoryCharFate = 'lost' | 'alive' | 'unresolved'

export function memoryCharFate(progress: MemoryCampaignProgress): MemoryCharFate {
  const decision = progress.pairDecisions?.e04
  if (decision === 'open-the-tide-gate') return 'lost'
  if (
    decision === 'seal-the-tide-gate' ||
    decision === 'divert-the-current'
  )
    return 'alive'
  return 'unresolved'
}

/**
 * Scylla's chapters share the same maps for every World Four outcome.
 * Death is withheld from the initial player-visible account; an earned
 * later reveal may distinguish a missing sister from a fatal last stand.
 */
export function scyllaOpeningForMemory(
  progress: MemoryCampaignProgress,
  reality: 'e05' | 'e06',
): string {
  const fate = memoryCharFate(progress)
  if (reality === 'e05') {
    if (fate === 'lost')
      return 'Scylla returns to the palace where she and Char once drew their first map of the land. The last signal from the crossing is still unanswered.'
    if (progress.pairDecisions?.e04 === 'seal-the-tide-gate')
      return 'Scylla remembers the shore she once dreamed of reaching with Char. She knows Char survived the sealed crossing, but the stranded travelers have not returned.'
    if (progress.pairDecisions?.e04 === 'divert-the-current')
      return 'Scylla revisits her childhood with Char beside her, troubled by the maintenance district destroyed to keep them safe.'
    return 'Scylla begins with the palace and the two sisters’ plan to reach land. The current record cannot tell the party what followed.'
  }
  if (fate === 'lost')
    return 'The drowned court repeats Char’s last signal. Scylla must separate memory, guilt and the true costs of the crossing.'
  if (progress.pairDecisions?.e04 === 'seal-the-tide-gate')
    return 'The drowned court promises a perfect evacuation, but Scylla and Char must confront those the closed gate left behind.'
  if (progress.pairDecisions?.e04 === 'divert-the-current')
    return 'The drowned court calls the diverted surge a clean rescue. Scylla and Char know the ruined district was not empty by decree.'
  return 'The drowned court rewrites the voyage. Scylla must recover independent testimony before naming the cost.'
}

export function memoryPairWorldFlags(progress: MemoryCampaignProgress): string[] {
  return (Object.entries(progress.pairDecisions ?? {}) as [
    MemoryPairEndingWorld,
    string,
  ][]).flatMap(([world, id]) => {
    const choice = MEMORY_PAIR_ENDINGS[world]?.find((item) => item.id === id)
    return choice ? [choice.worldFlag] : []
  })
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

export type MemoryWishAnchorId = keyof typeof MEMORY_WISH_ANCHORS

export interface MemoryCampaignProgress {
  completed: readonly ExperienceId[]
  rememberedAnchors: readonly MemoryWishAnchorId[]
  finaleCommitted: boolean
  pairDecisions?: Partial<Record<MemoryPairEndingWorld, string>>
}

export function newMemoryCampaignProgress(): MemoryCampaignProgress {
  return { completed: [], rememberedAnchors: [], finaleCommitted: false, pairDecisions: {} }
}

/** Only destinations discovered or earned are returned; no spoiler-filled map menu. */
export function availableMemoryExperiences(
  progress: MemoryCampaignProgress,
): ExperienceId[] {
  const completed = new Set(progress.completed)
  const anchors = new Set(progress.rememberedAnchors)
  const next = MEMORY_REALITY_PAIRS.flat().find((id) => !completed.has(id))
  if (!next) return []

  if (next === 'e04' && !anchors.has('morrow-magic-attempt')) return []
  if (next === 'e06' && !anchors.has('scylla-home-wish')) return []
  if (next === 'e13' && !anchors.has('char-possible-future')) return []
  if (
    MEMORY_FINALE_ORDER.includes(
      next as (typeof MEMORY_FINALE_ORDER)[number],
    ) &&
    next !== 'e13' &&
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
  if (!availableMemoryExperiences(progress).includes('e13')) {
    throw new Error('The final crossing has not been earned')
  }
  return { ...progress, finaleCommitted: true }
}

export function completeMemoryExperience(
  progress: MemoryCampaignProgress,
  id: ExperienceId,
): MemoryCampaignProgress {
  if (
    id !== 'e02' &&
    Object.prototype.hasOwnProperty.call(MEMORY_PAIR_ENDINGS, id) &&
    !progress.pairDecisions?.[id as MemoryPairEndingWorld]
  ) {
    throw new Error('World-pair ending requires an earned decision')
  }
  if (id === 'e13' && !progress.finaleCommitted) {
    throw new Error('Finale requires an explicit commitment')
  }
  if (!availableMemoryExperiences(progress).includes(id)) {
    throw new Error(`Experience ${id} is not currently reachable`)
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
  if (concepts.size !== 8 || MEMORY_WORLD_CONCEPTS.length !== 8)
    errors.push('Expected eight unique world concepts')
  if (ids.size !== 16 || MEMORY_REALITY_EXPERIENCES.length !== 16)
    errors.push('Expected sixteen unique experiences')
  if (
    MEMORY_REALITY_PAIRS.flat().join(',') !==
    MEMORY_REALITY_EXPERIENCES.map((entry) => entry.id).join(',')
  )
    errors.push(
      'Every overworld must be followed immediately by its twisted reality',
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
  const pairEndings = MEMORY_REALITY_PAIRS.map(([, second]) => second)
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
    if (variants.length !== 2)
      errors.push(`Concept ${concept.id} must have two authored incarnations`)
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
  if (MEMORY_FINALE_ORDER.join(',') !== 'e13,e14,e15,e16')
    errors.push('Final two concepts must be contiguous')
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
