import {
  BRIAR_CROSS_MAP_KEYS,
  BRIAR_CROSS_MAP_PUZZLES,
} from '../memoryDungeonWaves'
import { darkBriarExtraBridge } from './firstTwoConsequences'
import { DARK_BRIAR_NORTH } from './darkBriarNorth'
import { DARK_BRIAR_BORDER } from './darkBriarBorder'
import { DARK_BRIAR_RIVER } from './darkBriarRiver'
import { DARK_BRIAR_DEPTHS } from './darkBriarDepths'
import {
  BRIAR_START,
  BRIAR_TILES,
  briarConnected,
  type BriarMapCard,
  type BriarSave,
} from '../memoryDungeonWorld'

export interface DarkBriarChoice {
  id: string
  label: string
  outcome: string
}

export interface DarkBriarScene {
  key: string
  title: string
  opening: string
  artPrompt: string
  originalCallback?: {
    key: string
    choice: string
    alternateChoice: string
    line: string
    alternate: string
  }
  choices: readonly [DarkBriarChoice, DarkBriarChoice]
}

function scene(
  key: string,
  title: string,
  opening: string,
  artPrompt: string,
  choices: readonly [DarkBriarChoice, DarkBriarChoice],
  originalCallback?: DarkBriarScene['originalCallback'],
): DarkBriarScene {
  return { key, title, opening, artPrompt, choices, originalCallback }
}

/** Existing sixteen-scene pilot, with four additional authored geographical quadrants. */
const DARK_BRIAR_LEGACY_AUTHORED: Record<string, DarkBriarScene> = {
  '2,4': scene(
    '2,4',
    'The Camp That Knows You',
    'Your campfire is burning under a glass bell. Beside it sits the courier you thought you helped. Here, the courier remembers the price you never agreed to pay. There are two chairs and neither casts your shadow.',
    'Enchanted dark mirror Briar camp under an enormous glass bell, two empty mismatched chairs, an anxious courier with sealed letters, familiar forest landmarks under reverse moonlight, cinematic frame, no text.',
    [
      {
        id: 'listen',
        label: 'Ask whose memory was spent',
        outcome:
          'The courier names the village as the creditor. Your questions will travel ahead of you, though not everybody will welcome them.',
      },
      {
        id: 'name',
        label: 'Offer your own name as evidence',
        outcome:
          'The glass bell cracks. For one alarming second, both the life you lost and the one you inhabit answer when called.',
      },
    ],
    {
      key: '2,4',
      choice: 'copy',
      alternateChoice: 'lend',
      line: 'The impossible address you copied is pinned beneath the bell. Its intended recipient has finally come looking for the letter.',
      alternate:
        'The courier still carries the lantern you lent. Its cracked glass sheltered another traveler, though the undelivered letter remains a debt.',
    },
  ),
  '3,4': scene(
    '3,4',
    'The Courier Who Received Both Letters',
    'Two royal orders lie opened on a roadside stone. Both were delivered, and both were followed. The courier is exhausted by the idea that you can solve this by choosing which to burn.',
    'Cinematic fairy tale courier by a stone table with two opened wax-sealed orders, twin conflicting roads visible behind, violet dusk, no legible words.',
    [
      {
        id: 'trace',
        label: 'Trace who issued each order',
        outcome:
          'The handwriting belongs to different kings. The seal belongs to the same machine. You have found a mechanism, not a liar.',
      },
      {
        id: 'shelter',
        label: 'Shelter the courier from both factions',
        outcome:
          'A grateful courier gives you a safe route, but the palace calls your act an obstruction of justice.',
      },
    ],
  ),
  '4,4': scene(
    '4,4',
    'The Princesses Who Disagree with Your Memory',
    'Scylla reads the escort proclamation with immaculate outrage. Char has found her drawing on the back, but the skull looks like a warning now. They remember helping you. They disagree about who paid for it.',
    'Two sturdy identical-faced adult princesses in tailored proper and unmistakably goth travelling attire, one gripping a decree, the other studying a sinister skull sketch, thick forest shadows, no text.',
    [
      {
        id: 'scylla',
        label: 'Hear Scylla’s account of the escort',
        outcome:
          'Scylla remembers a frightened household turned away because her rescue party took the only carriage. Her embarrassment does not diminish her resolve to help them.',
      },
      {
        id: 'char',
        label: 'Ask Char who drew the warning',
        outcome:
          'Char drew it to make a joke. Now she recognizes the pattern in the House windows. For once she asks you to believe a serious thing she said by accident.',
      },
    ],
    {
      key: '4,4',
      choice: 'escort',
      alternateChoice: 'question',
      line: 'The proclamation you accepted hangs here beside a list of people the carriage could not carry.',
      alternate:
        'The lantern the sisters offered after your question about their matching faces now reveals two separate signatures beneath a single royal seal.',
    },
  ),
  '4,3': scene(
    '4,3',
    'Oren’s Ledger of Absences',
    'Oren has counted every missing passenger twice, once under those who left, once under those nobody saw arrive. He does not remove his hood. He has placed his axe across a bridge to stop a stampede.',
    'Masked royal headsman with broad axe laid across a bridge, exacting supply manifests covered with illegible tally marks, silhouettes of travelers on both banks, no text.',
    [
      {
        id: 'counts',
        label: 'Reconcile the passenger counts',
        outcome:
          'There are exactly two extra seats. Oren calmly announces that the road has been transporting wishes without their owners.',
      },
      {
        id: 'rescue',
        label: 'Help Oren guide the stranded back',
        outcome:
          'The evacuation works, but a bridge toll collector adds your name to a future account. Oren keeps the receipt.',
      },
    ],
  ),
  '5,3': scene(
    '5,3',
    'The Manifest of Lost Tomorrows',
    'A ledger shows errands scheduled for people whose histories were removed. Someone has continued paying them for futures they can no longer imagine.',
    'Dark fantasy office-like ledger chained to thorn tree, rows rendered as unreadable marks, ghostly workers waiting beside a winding forest road, no text.',
    [
      {
        id: 'publish',
        label: 'Show the wages to the workers',
        outcome:
          'The workers demand back pay in memories. Their collective claim will inconvenience the House far more than a heroic duel.',
      },
      {
        id: 'audit',
        label: 'Follow the invoices to their source',
        outcome:
          'A second ledger exists beneath the Sleeping Sigil, promising to explain who benefited from the exchange.',
      },
    ],
  ),
  '5,2': scene(
    '5,2',
    'The Sleeping Sigil Wakes',
    'The seal has opened, but it does not reveal a key. It reveals the name of someone you once called a monster, written in the handwriting of the person they protected.',
    'A split sigil rooted in forest soil, contrasting handprints, reflected silhouettes of a wolf guard and a frightened villager, supernatural engraved marks but no lettering.',
    [
      {
        id: 'testify',
        label: 'Carry both names to the House',
        outcome:
          'You copy the two testimonies without choosing which person deserves to be believed first. The House cannot dismiss either witness.',
      },
      {
        id: 'shield',
        label: 'Conceal the protected witness’s name',
        outcome:
          'You carry the accusation but hide its vulnerable source. The House may challenge your evidence, but nobody can trace it back to the witness.',
      },
    ],
  ),
  '5,4': scene(
    '5,4',
    'The Knight at the Wrong Bridge',
    'The Brass Knight stands guard over a crossing that never existed. People queue anyway because his perfect manners make it feel safer than admitting the road has gone.',
    'Stout weathered brass knight carefully guarding an absent bridge, spectral travelers queuing before an impossible ravine, tragicomic twilight, no text.',
    [
      {
        id: 'draw',
        label: 'Help the knight build a real crossing',
        outcome:
          'There is no spell. You spend the night carrying planks. The knight learns a promise can be honored without its original object.',
      },
      {
        id: 'release',
        label: 'Release him from the oath',
        outcome:
          'He walks away smiling; the queue panics. You must find another way for ordinary travelers to cross.',
      },
    ],
  ),
  '6,4': scene(
    '6,4',
    'The Two Orders of the Crown',
    'A royal courier delivered both contradictory orders and now two neighborhoods have followed them into the same square. Both have documents proving they belong here.',
    'Clashing small villages occupying overlapping fairy tale street plan, displaced townsfolk holding unreadable decrees, luminous mirrored borders, no text.',
    [
      {
        id: 'mediate',
        label: 'Let the displaced residents negotiate',
        outcome:
          'Neither village is restored exactly. They agree on shared water and refuse the king’s claim to decide who is real.',
      },
      {
        id: 'trace',
        label: 'Seek the Reimaginer’s original instruction',
        outcome:
          'The machine obeyed an earnest request to make everyone feel at home. It did not know that two homes occupied the same land.',
      },
    ],
  ),
  '6,3': scene(
    '6,3',
    'The House Has an Ear',
    'Its walls now listen without moving. The carved names from your first journey have become doorbells; to ring one is to summon a person who may not want to be found.',
    'Living manor facade with individual brass bells and carved nameless lintels, dim lit windows with human silhouettes, heavy roots entwined with listening horns, no text.',
    [
      {
        id: 'consent',
        label: 'Ask before summoning the witnesses',
        outcome:
          'Only three answer. Their agreement is more valuable than the dozens a coercive bell could produce.',
      },
      {
        id: 'records',
        label: 'Copy the bells without ringing them',
        outcome:
          'You collect a route map without exposing anybody. The House calls your silence obstruction.',
      },
    ],
  ),
  '6,2': scene(
    '6,2',
    'The Unremembered House',
    'The Warden offers you a remarkable victory: erase every debt of memory by erasing everybody who remembers the debt. It would make the village happy, briefly, and leave nobody who could explain why.',
    'Dark twin of living rooted manor, enormous memory vault containing luminous human testimonies, imposing Warden behind veil, doors opening onto contradictory outcomes, no text.',
    [
      {
        id: 'witness',
        label: 'Reconcile the witnesses instead',
        outcome:
          'The House cannot manufacture agreement. People leave with competing memories and a newly enforceable right to tell the truth. The dark forest stays strange, but not silent.',
      },
      {
        id: 'refuse',
        label: 'Deny the House the power to decide',
        outcome:
          'You refuse its painless blank slate. The ledger survives in many imperfect hands; every future wish will have to contend with them.',
      },
    ],
  ),
  '2,5': scene(
    '2,5',
    'The Photograph with Two Shadows',
    'The Earth photo still shows Morrow carrying a box from the research office. A second shadow suggests someone tried to help. The image was true; your interpretation of it was incomplete.',
    'Contemporary research office photograph seen through ghostly forest mirror, androgynous Morrow with moving box and another person reaching from doorway, no text.',
    [
      {
        id: 'question',
        label: 'Ask who took the photograph',
        outcome:
          'The photographer had come to offer a lift. You cannot recover their reply from the image alone, and finally stop treating photographs as verdicts.',
      },
      {
        id: 'preserve',
        label: 'Keep both shadows in the Chronicle',
        outcome:
          'The contradictory evidence survives. This matters when a future asks you to erase a scene you dislike.',
      },
    ],
    {
      key: '2,5',
      choice: 'archive',
      alternateChoice: 'grieve',
      line: 'You archived the original photo; the negative reveals the helping hand outside its frame.',
      alternate:
        'You admitted how frightened you were for your stolen life. The returned photograph now shows a helping hand outside its first frame.',
    },
  ),
  '2,6': scene(
    '2,6',
    'The Rune That Reads Backward',
    'Leaf, leaf, sun becomes sun, leaf, leaf when the stones are held up to the sky. The inscription was not wrong. It was written for somebody walking in the other direction.',
    'Three rune stones alongside reflected river, leaf and sun pictograms rearranged in reverse order, luminous moss, no words.',
    [
      {
        id: 'reverse',
        label: 'Solve the sequence from the other shore',
        outcome:
          'The stones open a shortcut from the dark camp to the old witness road. A familiar solution becomes useful only after changing viewpoint.',
      },
      {
        id: 'guide',
        label: 'Leave a two-sided clue for future travelers',
        outcome:
          'Both sequences glow. Nobody else has to guess which bank the author considered the beginning.',
      },
    ],
  ),
  '3,6': scene(
    '3,6',
    'The Cache That Already Paid',
    'The wildflowers are gone from the creekside chest. An old receipt says they were used to buy medicine for someone who never knew a stranger had saved them.',
    'Open mossy treasure box by a river containing only a silver receipt and one pressed wildflower, moonlit water, no text.',
    [
      {
        id: 'follow',
        label: 'Find the person who received the medicine',
        outcome:
          'The recipient remembers waking without fever. They cannot repay a gift they never requested, and they shouldn’t have to.',
      },
      {
        id: 'honor',
        label: 'Leave the gift anonymous',
        outcome:
          'For the first time, a treasure chest teaches you what is valuable about something you cannot reclaim.',
      },
    ],
  ),
  '4,6': scene(
    '4,6',
    'The People the Warden Forgot',
    'Three witnesses disagree about which monsters attacked the village. They agree on one point: the House took a memory as payment from each of them, and called their gratitude consent.',
    'Three distinct adult witnesses gathered at a ruined bridge, fading storybook memories hovering in glass lanterns, faint manor in distance, no letters.',
    [
      {
        id: 'hear',
        label: 'Hear all three incompatible accounts',
        outcome:
          'The details contradict; the pattern does not. Each was offered rescue without being told its price.',
      },
      {
        id: 'protect',
        label: 'Let the witnesses choose a spokesperson',
        outcome:
          'They elect the quietest among them. The House will hear their evidence without deciding who must speak.',
      },
    ],
  ),
  '4,5': scene(
    '4,5',
    'The Bridge That Never Burned',
    'In the first Briar you believed a bridge had burned. Here it has never been built, but ash lies beneath the river. Someone remembered a disaster so vividly that nobody dared build it.',
    'Ash swirling below pristine river with absent wooden bridge, waiting workmen on banks of dark fairy forest, atmospheric cinematic landscape, no text.',
    [
      {
        id: 'build',
        label: 'Help build a cautious crossing',
        outcome:
          'The workers set safety rules based on a disaster none can prove. Memory becomes a warning instead of a prison.',
      },
      {
        id: 'study',
        label: 'Follow the ash to its source',
        outcome:
          'You discover the river is carrying discarded imagined futures from the House. Your missing bridge may exist in one of them.',
      },
    ],
  ),
  '3,5': scene(
    '3,5',
    'A Traveler Who Took the Other Road',
    'A traveler emerges from the marsh with two maps: the road they walked and the road a borrowed voice described. Both routes have left scars. They want a say in where they go next.',
    'Rugged adult wayfarer holding two overlapping translucent road maps through mirrored shadow-marsh, warm distant firelight, no text.',
    [
      {
        id: 'apologize',
        label: 'Offer to correct the borrowed directions',
        outcome:
          'The traveler accepts your offer to carry their correction to Pip. They choose a third road, not the one a borrowed voice assigned.',
      },
      {
        id: 'ask',
        label: 'Ask what they actually wanted',
        outcome:
          'To be consulted, they say. Pip offers a blank map; the traveler decides which roads are worth drawing.',
      },
    ],
  ),
  ...DARK_BRIAR_NORTH,
  ...DARK_BRIAR_BORDER,
  ...DARK_BRIAR_RIVER,
  ...DARK_BRIAR_DEPTHS,
}

/** All 64 stable map coordinates remain in the existing saved reveal rounds. */
export const DARK_BRIAR_KEYS = Object.keys(DARK_BRIAR_LEGACY_AUTHORED)
export const DARK_BRIAR_SEAL_KEYS = BRIAR_CROSS_MAP_KEYS
const darkSeals = new Set<string>(DARK_BRIAR_SEAL_KEYS)

/** Four inscription sites are interactive landmarks, never ordinary encounters. */
export const DARK_BRIAR_SEALS = Object.fromEntries(
  BRIAR_CROSS_MAP_KEYS.map((key) => [
    key,
    {
      key,
      title: BRIAR_CROSS_MAP_PUZZLES[key].title,
      opening: DARK_BRIAR_LEGACY_AUTHORED[key]!.opening,
      artPrompt: DARK_BRIAR_LEGACY_AUTHORED[key]!.artPrompt,
      hint: BRIAR_CROSS_MAP_PUZZLES[key].hint,
    },
  ]),
) as Record<
  string,
  {
    key: string
    title: string
    opening: string
    artPrompt: string
    hint: string
  }
>

export const DARK_BRIAR_SCENES: Record<string, DarkBriarScene> =
  Object.fromEntries(
    Object.entries(DARK_BRIAR_LEGACY_AUTHORED).filter(
      ([key]) => !darkSeals.has(key),
    ),
  )
export const DARK_BRIAR_ENCOUNTER_KEYS = Object.keys(DARK_BRIAR_SCENES)

/** Old players may have earned testimony on the Sleeping Sigil before it was
 * reserved. Honor that existing record as a one-time substitute at (5,3). */
export function darkBriarHasWitness(
  progress: Pick<DarkBriarProgress, 'sceneChoices'>,
  key: string,
): boolean {
  return Boolean(
    progress.sceneChoices[key] ||
    (key === '5,3' &&
      ['testify', 'shield'].includes(progress.sceneChoices['5,2'] ?? '')),
  )
}
export function darkBriarWitnessCount(
  progress: Pick<DarkBriarProgress, 'sceneChoices'>,
): number {
  return DARK_BRIAR_WITNESSES.filter((key) =>
    darkBriarHasWitness(progress, key),
  ).length
}

/**
 * Four 8-pair reveals, preserving all sixteen pilot coordinates and route IDs.
 * Later rounds grow outward from already-revealed Briar roads.
 */
export const DARK_BRIAR_WAVES: readonly (readonly string[])[] = [
  [
    '2,4',
    '3,4',
    '4,4',
    '4,3',
    '5,3',
    '5,2',
    '5,4',
    '6,4',
    '6,3',
    '6,2',
    '2,5',
    '2,6',
    '3,6',
    '4,6',
    '4,5',
    '3,5',
  ],
  [
    '6,1',
    '4,2',
    '3,2',
    '3,1',
    '4,1',
    '5,1',
    '2,2',
    '2,1',
    '2,3',
    '3,3',
    '7,3',
    '7,2',
    '7,1',
    '8,2',
    '8,1',
    '7,4',
  ],
  [
    '8,4',
    '8,3',
    '7,5',
    '8,5',
    '8,6',
    '8,7',
    '7,6',
    '7,7',
    '7,8',
    '8,8',
    '5,5',
    '6,5',
    '6,6',
    '5,6',
    '5,7',
    '6,7',
  ],
  [
    '6,8',
    '2,7',
    '1,7',
    '1,8',
    '2,8',
    '4,7',
    '3,7',
    '3,8',
    '4,8',
    '5,8',
    '1,6',
    '1,5',
    '1,4',
    '1,3',
    '1,2',
    '1,1',
  ],
]

export const DARK_BRIAR_WITNESSES = [
  '2,5',
  '4,4',
  '4,6',
  '5,3',
  '3,1',
  '7,6',
  '3,8',
  '7,8',
] as const
export const DARK_BRIAR_CLIMAX = '6,2'

export interface DarkBriarProgress {
  version: 3
  waveIndex: number
  phase: 'matching' | 'exploring'
  mapCards: BriarMapCard[]
  revealed: string[]
  visited: string[]
  player: string
  sceneChoices: Record<string, string>
  /** Separate from scenes and late-act counterpart matches. */
  sealInspections: string[]
  seenImages: string[]
  attempts: number
  completed: boolean
  /** True only for a completed, previously shipped sixteen-scene save. */
  legacyCompleted: boolean
  status: string
}

export function newDarkBriarProgress(): DarkBriarProgress {
  return {
    version: 3,
    waveIndex: 0,
    phase: 'matching',
    mapCards: [],
    revealed: [],
    visited: [],
    player: BRIAR_START,
    sceneChoices: {},
    sealInspections: [],
    seenImages: [],
    attempts: 0,
    completed: false,
    legacyCompleted: false,
    status:
      'A familiar road holds a different story. Match the paired pictures to find its altered places.',
  }
}

/** V1 saves retain their first sixteen reveals, decisions, and former House victory. */
export function restoreDarkBriarProgress(input: unknown): DarkBriarProgress {
  const initial = newDarkBriarProgress()
  if (!input || typeof input !== 'object') return initial
  const saved = input as Partial<Omit<DarkBriarProgress, 'version'>> & {
    version?: number
  }
  const keyset = new Set(DARK_BRIAR_KEYS)
  const validKeys = (value: unknown): string[] =>
    Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (key): key is string =>
                typeof key === 'string' && keyset.has(key),
            ),
          ),
        ]
      : []
  const savedRevealed = validKeys(saved.revealed)
  const proposedIndex =
    (saved.version === 2 || saved.version === 3) &&
    Number.isSafeInteger(saved.waveIndex) &&
    (saved.waveIndex ?? -1) >= 0 &&
    (saved.waveIndex ?? 99) < DARK_BRIAR_WAVES.length
      ? saved.waveIndex!
      : 0
  const previousWaves = DARK_BRIAR_WAVES.slice(0, proposedIndex).flat()
  const waveIndex = previousWaves.every((key) => savedRevealed.includes(key))
    ? proposedIndex
    : 0
  const currentWave = DARK_BRIAR_WAVES[waveIndex]!
  const allowed = new Set(currentWave)
  const cards =
    Array.isArray(saved.mapCards) &&
    saved.mapCards.length === currentWave.length
      ? saved.mapCards
      : []
  const validCards =
    cards.length === currentWave.length &&
    cards.every(
      (card) =>
        card !== null &&
        typeof card === 'object' &&
        allowed.has(card.tile) &&
        typeof card.image === 'string' &&
        card.image.length > 0 &&
        Number.isSafeInteger(card.pairId) &&
        typeof card.matched === 'boolean',
    ) &&
    new Set(cards.map((card) => card.tile)).size === currentWave.length &&
    [...new Set(cards.map((card) => card.pairId))].length ===
      currentWave.length / 2 &&
    [...new Set(cards.map((card) => card.pairId))].every(
      (pairId) => cards.filter((card) => card.pairId === pairId).length === 2,
    )
  const mapCards = validCards
    ? cards.map((card) => ({
        ...card,
        flipped: Boolean(card.matched),
        matched: Boolean(card.matched),
      }))
    : []
  const matched = mapCards
    .filter((card) => card.matched)
    .map((card) => card.tile)
  const revealed = [
    ...new Set([...DARK_BRIAR_WAVES.slice(0, waveIndex).flat(), ...matched]),
  ]
  const allMatched =
    mapCards.length > 0 && mapCards.every((card) => card.matched)
  const sceneChoices: Record<string, string> = {}
  if (saved.sceneChoices && typeof saved.sceneChoices === 'object') {
    for (const [key, choice] of Object.entries(saved.sceneChoices)) {
      if (
        revealed.includes(key) &&
        (DARK_BRIAR_SCENES[key]?.choices.some(
          (option) => option.id === choice,
        ) ||
          (key === '5,2' && ['testify', 'shield'].includes(choice)))
      ) {
        sceneChoices[key] = choice
      }
    }
  }
  const visited = validKeys(saved.visited).filter((key) =>
    revealed.includes(key),
  )
  if (revealed.includes(BRIAR_START) && !visited.includes(BRIAR_START))
    visited.unshift(BRIAR_START)
  const player =
    typeof saved.player === 'string' && visited.includes(saved.player)
      ? saved.player
      : BRIAR_START
  const seenImages = Array.isArray(saved.seenImages)
    ? [
        ...new Set(
          saved.seenImages.filter(
            (src): src is string => typeof src === 'string' && src.length > 0,
          ),
        ),
      ]
    : []
  for (const src of mapCards.map((card) => card.image))
    if (!seenImages.includes(src)) seenImages.push(src)
  const legacyCompleted =
    Boolean(sceneChoices[DARK_BRIAR_CLIMAX]) &&
    (saved.version === 1 || saved.legacyCompleted === true)
  const completed =
    Boolean(sceneChoices[DARK_BRIAR_CLIMAX]) &&
    (legacyCompleted ||
      (waveIndex === 3 &&
        allMatched &&
        DARK_BRIAR_WITNESSES.every((key) =>
          darkBriarHasWitness({ sceneChoices }, key),
        )))
  return {
    ...initial,
    mapCards,
    waveIndex,
    phase: allMatched ? 'exploring' : 'matching',
    revealed,
    visited,
    player,
    sceneChoices,
    sealInspections: validKeys(saved.sealInspections).filter(
      (key) => darkSeals.has(key) && visited.includes(key),
    ),
    seenImages,
    attempts:
      Number.isSafeInteger(saved.attempts) && (saved.attempts ?? 0) >= 0
        ? saved.attempts!
        : 0,
    completed,
    legacyCompleted,
    status:
      typeof saved.status === 'string'
        ? saved.status.slice(0, 450)
        : initial.status,
  }
}

/** Finish an interrupted mirrored map turn from a validated restored deck.
 * A completed pair was already charged before its animation; do not charge twice. */
export function recoverDarkBriarTurn(
  progress: DarkBriarProgress,
  saved: unknown,
): {
  progress: DarkBriarProgress
  firstTile: string | null
  recovered: boolean
} {
  const unchanged = { progress, firstTile: null, recovered: false }
  const wave = DARK_BRIAR_WAVES[progress.waveIndex]
  if (
    progress.phase !== 'matching' ||
    !wave ||
    progress.mapCards.length !== wave.length ||
    !saved ||
    typeof saved !== 'object'
  )
    return unchanged
  const rawCards = (saved as Partial<DarkBriarProgress>).mapCards
  if (!Array.isArray(rawCards)) return unchanged
  const pending = rawCards.filter(
    (card): card is BriarMapCard =>
      !!card &&
      typeof card === 'object' &&
      card.flipped === true &&
      card.matched === false &&
      typeof card.tile === 'string',
  )
  if (!pending.length) return unchanged
  const discarded = { ...unchanged, recovered: true }
  if (pending.length > 2) return discarded
  const tiles = pending.map((card) => card.tile)
  if (
    new Set(tiles).size !== pending.length ||
    !pending.every((card) => {
      const current = progress.mapCards.find(
        (entry) => entry.tile === card.tile,
      )
      return (
        current &&
        !current.matched &&
        wave.includes(card.tile) &&
        current.id === card.id &&
        current.pairId === card.pairId &&
        current.image === card.image
      )
    })
  )
    return discarded

  const restoredCards = progress.mapCards.map((card) =>
    tiles.includes(card.tile) ? { ...card, flipped: true } : card,
  )
  if (pending.length === 1) {
    return {
      progress: {
        ...progress,
        mapCards: restoredCards,
        status: 'Your first reflected picture is still face up. Find its twin.',
      },
      firstTile: tiles[0]!,
      recovered: true,
    }
  }

  const first = restoredCards.find((card) => card.tile === tiles[0])
  const second = restoredCards.find((card) => card.tile === tiles[1])
  if (
    !first ||
    !second ||
    first.pairId !== second.pairId ||
    first.image !== second.image ||
    progress.attempts < 1
  ) {
    return {
      progress: {
        ...progress,
        status: 'An interrupted reflected mismatch turned face down.',
      },
      firstTile: null,
      recovered: true,
    }
  }
  const mapCards = restoredCards.map((card) =>
    tiles.includes(card.tile)
      ? { ...card, flipped: true, matched: true }
      : card,
  )
  const revealed = [...new Set([...progress.revealed, ...tiles])]
  const complete = mapCards.every((card) => card.matched)
  return {
    progress: {
      ...progress,
      mapCards,
      revealed,
      visited:
        revealed.includes(BRIAR_START) &&
        !progress.visited.includes(BRIAR_START)
          ? [...progress.visited, BRIAR_START]
          : progress.visited,
      phase: complete ? 'exploring' : 'matching',
      status: complete
        ? 'Your interrupted reflection completed the round. Explore its roads.'
        : 'Your remembered reflected pair survived the interruption.',
    },
    firstTile: null,
    recovered: true,
  }
}

export function advanceDarkBriarWave(
  progress: DarkBriarProgress,
): DarkBriarProgress {
  if (
    progress.phase !== 'exploring' ||
    progress.waveIndex >= DARK_BRIAR_WAVES.length - 1 ||
    progress.mapCards.length !== DARK_BRIAR_WAVES[progress.waveIndex]!.length ||
    !progress.mapCards.every((card) => card.matched)
  )
    return progress
  return {
    ...progress,
    waveIndex: progress.waveIndex + 1,
    phase: 'matching',
    mapCards: [],
    status:
      'Another ring of the familiar forest changes shape. Match eight fresh picture pairs to reveal its paths.',
  }
}

export function darkBriarCanTravel(
  from: string,
  to: string,
  revealed: readonly string[],
  progress?: Pick<DarkBriarProgress, 'sceneChoices'>,
): boolean {
  return (
    DARK_BRIAR_KEYS.includes(to) &&
    revealed.includes(to) &&
    revealed.includes(from) &&
    (briarConnected(from, to, revealed) ||
      darkBriarExtraBridge(from, to, progress))
  )
}

export function darkBriarInspectSeal(
  progress: DarkBriarProgress,
  key: string,
): DarkBriarProgress {
  const seal = DARK_BRIAR_SEALS[key]
  if (
    !seal ||
    progress.phase !== 'exploring' ||
    progress.player !== key ||
    !progress.visited.includes(key) ||
    !progress.revealed.includes(key)
  )
    return progress
  if (progress.sealInspections.includes(key)) return progress
  return {
    ...progress,
    sealInspections: [...progress.sealInspections, key],
    status: `${seal.title}: the changed inscription is recorded in your Chronicle. ${seal.hint} Its final match belongs to another world.`,
  }
}

export function darkBriarOpening(
  scene: DarkBriarScene,
  original: BriarSave,
): string {
  const echo = scene.originalCallback
  if (!echo) return scene.opening
  const selected = original.sceneChoices[echo.key]
  const callback =
    selected === echo.choice
      ? echo.line
      : selected === echo.alternateChoice
        ? echo.alternate
        : null
  return callback ? `${scene.opening} ${callback}` : scene.opening
}

export function darkBriarCanChoose(
  progress: DarkBriarProgress,
  key: string,
): boolean {
  if (
    progress.phase !== 'exploring' ||
    progress.player !== key ||
    !progress.visited.includes(key) ||
    Boolean(progress.sceneChoices[key])
  )
    return false
  if (key === DARK_BRIAR_CLIMAX) {
    return (
      progress.waveIndex === DARK_BRIAR_WAVES.length - 1 &&
      DARK_BRIAR_WITNESSES.every((witness) =>
        darkBriarHasWitness(progress, witness),
      )
    )
  }
  return Boolean(DARK_BRIAR_SCENES[key])
}

export function darkBriarChoose(
  progress: DarkBriarProgress,
  key: string,
  choiceId: string,
): DarkBriarProgress {
  const location = DARK_BRIAR_SCENES[key]
  if (
    !location ||
    !darkBriarCanChoose(progress, key) ||
    !location.choices.some((choice) => choice.id === choiceId)
  )
    return progress
  return {
    ...progress,
    sceneChoices: { ...progress.sceneChoices, [key]: choiceId },
    completed: key === DARK_BRIAR_CLIMAX || progress.completed,
    status: location.choices.find((choice) => choice.id === choiceId)!.outcome,
  }
}

export function validateDarkBriarSlice(): string[] {
  const errors: string[] = []
  if (DARK_BRIAR_KEYS.length !== 64)
    errors.push('All 64 Dark Briar positions must remain on the map')
  if (DARK_BRIAR_ENCOUNTER_KEYS.length !== 60)
    errors.push('Dark Briar must contain exactly 60 ordinary encounters')
  if (DARK_BRIAR_SEAL_KEYS.length !== 4)
    errors.push('Four special cross-world seals are required')
  if (DARK_BRIAR_SEAL_KEYS.some((key) => DARK_BRIAR_SCENES[key] !== undefined))
    errors.push('A reserved seal cannot also be an ordinary encounter')
  if (new Set(DARK_BRIAR_KEYS).size !== 64)
    errors.push('Duplicate Dark Briar positions')
  if (
    DARK_BRIAR_WAVES.length !== 4 ||
    DARK_BRIAR_WAVES.some((wave) => wave.length !== 16)
  )
    errors.push('Four eight-pair reveal rounds are required')
  const waveKeys = DARK_BRIAR_WAVES.flat()
  if (
    waveKeys.length !== 64 ||
    new Set(waveKeys).size !== 64 ||
    waveKeys.some((key) => !DARK_BRIAR_KEYS.includes(key))
  )
    errors.push('Four reveal rounds must cover each scene exactly once')
  if (!DARK_BRIAR_WAVES[0]?.includes(BRIAR_START))
    errors.push('Canonical starting position lost')
  if (!DARK_BRIAR_WAVES[0]?.includes(DARK_BRIAR_CLIMAX))
    errors.push('Original sixteen pilot keys changed')
  for (const location of Object.values(DARK_BRIAR_SCENES)) {
    if (!BRIAR_TILES.some((tile) => tile.key === location.key))
      errors.push('Out-of-bounds scene ' + location.key)
    if (
      location.choices.length !== 2 ||
      location.choices[0].id === location.choices[1].id ||
      !location.choices.every((choice) => choice.label && choice.outcome)
    )
      errors.push('Incomplete choice in ' + location.key)
    if (!location.opening || !location.artPrompt || !location.title)
      errors.push('Missing authored story or art in ' + location.key)
  }
  for (let index = 0; index < DARK_BRIAR_WAVES.length; index++) {
    const revealed = DARK_BRIAR_WAVES.slice(0, index + 1).flat()
    for (const key of revealed) {
      if (!briarConnected(BRIAR_START, key, revealed))
        errors.push(
          'Unreachable location after reveal ' + (index + 1) + ': ' + key,
        )
    }
  }
  for (const key of DARK_BRIAR_WITNESSES)
    if (!DARK_BRIAR_SCENES[key])
      errors.push('Missing House testimony at ' + key)
  return errors
}
