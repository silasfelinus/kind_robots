import {
  isCombatRoom,
  restoreBriarCombat,
  type BriarCombat,
} from './memoryDungeon/rooms'
import { BRIAR_SCENES } from './memoryDungeon/scenes'
import {
  restoreMinefieldRun,
  type MinefieldRun,
} from './memoryDungeon/minefieldRun'
import {
  newHouseProgress,
  restoreHouseProgress,
  type HouseProgress,
} from './memoryDungeon/house'

export const BRIAR_WIDTH = 8
export const BRIAR_START = '2,4'
export const BRIAR_GATE = '8,4'
export const BRIAR_DUNGEON = '6,2'
export const BRIAR_SAVE_VERSION = 2

export type BriarSiteKind =
  | 'camp'
  | 'merchant'
  | 'dungeon'
  | 'chest'
  | 'puzzle'
  | 'sealed'
  | 'enemy'
  | 'gate'
  | 'rune'
  | 'story'

export interface BriarSite {
  kind: BriarSiteKind
  name: string
  description: string
}

export const BRIAR_SITES: Record<string, BriarSite> = {
  ...Object.fromEntries(
    Object.entries(BRIAR_SCENES).map(([key, scene]) => [
      key,
      { kind: 'story' as const, name: scene.title, description: scene.opening },
    ]),
  ),
  '2,4': {
    kind: 'camp',
    name: 'Briar Camp',
    description:
      'A friendly fire and a deeply unreliable signpost. Your discoveries will be remembered.',
  },
  '4,2': {
    kind: 'merchant',
    name: "Mosswick's Stall",
    description:
      'Mosswick will trade one found wildflower for a Lantern hint. He also knows the path to the Vault.',
  },
  '1,1': {
    kind: 'sealed',
    name: 'North Star Twin',
    description: 'Its close companion hides in the distant Lake Terrace.',
  },
  '8,1': {
    kind: 'sealed',
    name: 'Whitewing Cipher',
    description:
      'A nearly matching feathered emblem is rumored at Salt Cliffs.',
  },
  '8,8': {
    kind: 'sealed',
    name: 'Moonroot Knot',
    description: 'The other half of the knot rests in Moonwell Vale.',
  },
  '5,2': {
    kind: 'sealed',
    name: 'The Sleeping Sigil',
    description:
      'One half of a forgotten pair. Its partner waits in a later dungeon, beyond Briar Camp.',
  },
  '6,2': {
    kind: 'dungeon',
    name: 'The House That Remembers · Rootbound Vault',
    description:
      'Thirty-six rooms of remembered bargains, with fair choices and a guarded Bramble Chime.',
  },
  '8,4': {
    kind: 'gate',
    name: 'Thorn Gate',
    description:
      'The path toward Bloom Orchard is closed until the Bramble Chime sings.',
  },
  '2,7': {
    kind: 'puzzle',
    name: 'Three Quiet Stones',
    description:
      'The stones ask for the same forest rune twice, then the sun. Examine the nearby clues.',
  },
  '3,6': {
    kind: 'chest',
    name: 'Creekside Cache',
    description: 'A weatherproof little chest hidden among the ferns.',
  },
  '7,6': {
    kind: 'chest',
    name: 'Riverbank Chest',
    description: 'A brighter chest beside the water.',
  },
  '2,6': {
    kind: 'rune',
    name: 'Moss Inscription',
    description:
      'A carving reads: leaf, leaf, sun. The same pattern was scratched into the old stone rings.',
  },
  '5,5': {
    kind: 'enemy',
    name: 'Moss Sprite',
    description:
      'A mischievous sprite wants a quick matching duel. You can refuse and keep exploring.',
  },
  '7,3': {
    kind: 'enemy',
    name: 'Thorn Patrol',
    description:
      'A pair of disgruntled sentries guards a shortcut. Their challenge is optional.',
  },
}

const LINK_ENTRIES: [string, string[]][] = [
  ['2,4', ['3,4', '2,5']],
  ['3,4', ['4,4', '3,5']],
  ['4,4', ['4,3', '5,4']],
  ['4,3', ['4,2', '5,3']],
  ['4,2', ['3,2']],
  ['5,3', ['5,2']],
  ['5,4', ['6,4', '5,5']],
  ['6,4', ['6,3', '7,4']],
  ['6,3', ['6,2', '7,3']],
  ['7,4', ['8,4', '7,5']],
  ['2,5', ['2,6', '1,5']],
  ['2,6', ['2,7', '3,6']],
  ['3,5', ['3,6', '4,5']],
  ['7,5', ['7,6', '8,5']],
  ['5,5', ['5,6', '6,5']],
  ['3,2', ['2,2', '3,1']],
  ['2,2', ['2,1', '2,3']],
  ['3,1', ['4,1']],
  ['1,5', ['1,6', '1,4']],
  ['1,6', ['1,7']],
  ['1,7', ['2,7', '1,8']],
  ['3,6', ['4,6']],
  ['4,5', ['4,6']],
  ['4,6', ['4,7']],
  ['4,7', ['3,7']],
  ['3,7', ['3,8']],
  ['5,6', ['5,7']],
  ['5,7', ['6,7']],
  ['6,7', ['6,8']],
  ['7,6', ['8,6', '7,7']],
  ['8,5', ['8,6']],
  ['8,6', ['8,7']],
  ['6,2', ['6,1']],
  ['7,3', ['7,2']],
  ['7,2', ['7,1', '8,2']],
  ['8,4', ['8,3']],
  ['1,4', ['1,3']],
  ['1,3', ['1,2']],
  ['1,2', ['1,1']],
  ['2,3', ['3,3']],
  ['4,1', ['5,1']],
  ['8,2', ['8,1']],
  ['6,5', ['6,6']],
  ['7,7', ['7,8']],
  ['7,8', ['8,8']],
  ['1,8', ['2,8']],
  ['3,8', ['4,8']],
  ['4,8', ['5,8']],
]

export const BRIAR_LINKS: Record<string, readonly string[]> =
  Object.fromEntries(LINK_ENTRIES)

export const BRIAR_TILES = Array.from({ length: 64 }, (_, i) => {
  const x = (i % BRIAR_WIDTH) + 1
  const y = Math.floor(i / BRIAR_WIDTH) + 1
  return {
    key: `${x},${y}`,
    x,
    y,
  }
})

export function isBriarCoordinate(key: string): boolean {
  return BRIAR_TILES.some((tile) => tile.key === key)
}

export function briarNeighbors(key: string): string[] {
  const [x = 0, y = 0] = key.split(',').map(Number)
  return [
    `${x - 1},${y}`,
    `${x + 1},${y}`,
    `${x},${y - 1}`,
    `${x},${y + 1}`,
  ].filter(isBriarCoordinate)
}

export function validateBriarLinks(): string[] {
  const errors: string[] = []
  for (const [from, targets] of LINK_ENTRIES) {
    if (!isBriarCoordinate(from)) errors.push(`Invalid source ${from}`)
    if (targets.length > 2) errors.push(`Too many new frontiers at ${from}`)
    for (const to of targets) {
      if (!briarNeighbors(from).includes(to)) {
        errors.push(`Non-adjacent step ${from} → ${to}`)
      }
    }
  }
  const reached = new Set([BRIAR_START])
  const todo = [BRIAR_START]
  for (let i = 0; i < todo.length; i++) {
    for (const target of BRIAR_LINKS[todo[i]!] ?? []) {
      if (!reached.has(target)) {
        reached.add(target)
        todo.push(target)
      }
    }
  }
  for (const tile of BRIAR_TILES) {
    if (!reached.has(tile.key)) {
      errors.push(`Unreachable map square ${tile.key}`)
    }
  }
  return errors
}

export function briarConnected(
  from: string,
  to: string,
  revealed: readonly string[],
): boolean {
  const safe = new Set(revealed)
  if (!safe.has(from) || !safe.has(to)) return false
  const visited = new Set([from])
  const queue = [from]
  while (queue.length) {
    const current = queue.shift()!
    if (current === to) return true
    const adjacent = [
      ...(BRIAR_LINKS[current] ?? []),
      ...Object.entries(BRIAR_LINKS)
        .filter(([, links]) => links.includes(current))
        .map(([key]) => key),
    ]
    for (const step of adjacent) {
      if (safe.has(step) && !visited.has(step)) {
        visited.add(step)
        queue.push(step)
      }
    }
  }
  return false
}

export interface BriarMemoryCard {
  id: number
  pairId: number
  image: string
  flipped: boolean
  matched: boolean
}

export interface BriarMapCard extends BriarMemoryCard {
  tile: string
}

export type BriarPrologueChoice = 'terms' | 'anchor'

export interface BriarSave {
  waveIndex: number
  wavePhase: 'matching' | 'exploring'
  mapCards: BriarMapCard[]
  /** Each image used by a reveal wave; persisted across saves to prevent duplicates. */
  seenMapImages: string[]
  /** Exact art-source choice that dealt the current map cards. */
  mapDeckSignature: string
  version: number
  revealed: string[]
  visited: string[]
  sceneChoices: Record<string, string>
  prologueChoice: BriarPrologueChoice | null
  frontier: string[]
  player: string
  attempts: number
  relics: string[]
  wildflowers: number
  lanterns: number
  chestClaims: string[]
  puzzleSolved: boolean
  /** Independent, resumable side chamber at the Three Quiet Stones. */
  minefield: MinefieldRun | null
  minefieldRound: number
  gateOpened: boolean
  completedEncounters: string[]
  sealedPartnerFound: boolean
  room: 'map' | 'memory' | 'house'
  house: HouseProgress | null
  roomId: 'vault-1' | 'vault-2' | 'sprite' | 'patrol' | null
  cards: BriarMemoryCard[]
  /** A combat room in progress (t-007); null in Classic rooms and on the map. */
  combat: BriarCombat | null
  roomMisses: number
  hearts: number
  status: string
}

export function newBriarSave(): BriarSave {
  return {
    version: BRIAR_SAVE_VERSION,
    revealed: [],
    visited: [],
    sceneChoices: {},
    prologueChoice: null,
    frontier: [],
    waveIndex: 0,
    wavePhase: 'matching',
    mapCards: [],
    seenMapImages: [],
    mapDeckSignature: '',
    player: BRIAR_START,
    attempts: 0,
    relics: [],
    wildflowers: 0,
    lanterns: 1,
    chestClaims: [],
    puzzleSolved: false,
    minefield: null,
    minefieldRound: 0,
    gateOpened: false,
    completedEncounters: [],
    sealedPartnerFound: false,
    room: 'map',
    house: null,
    roomId: null,
    cards: [],
    combat: null,
    roomMisses: 0,
    hearts: 3,
    status:
      'Find six matching pairs to uncover the first twelve pieces of Briar Camp.',
  }
}

export function restoreBriarSave(input: unknown): BriarSave {
  const fresh = newBriarSave()
  if (!input || typeof input !== 'object') return fresh
  const saved = input as Partial<BriarSave>
  if (saved.version !== BRIAR_SAVE_VERSION) {
    // The prototype exposed fog by clicking single squares. Its save cannot
    // legitimately satisfy the new two-card matching progress contract.
    return {
      ...fresh,
      status:
        'Briar Camp now opens through four memory-matching rounds. A new expedition begins.',
    }
  }
  const validKeys = (value: unknown): string[] =>
    Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (v): v is string => typeof v === 'string' && isBriarCoordinate(v),
            ),
          ),
        ]
      : []
  const revealed = validKeys(saved.revealed)
  const visited = validKeys([
    ...(Array.isArray(saved.visited) ? saved.visited : []),
    saved.player,
    ...(Array.isArray(saved.chestClaims) ? saved.chestClaims : []),
    ...(Array.isArray(saved.completedEncounters)
      ? saved.completedEncounters
      : []),
    ...(saved.puzzleSolved ? ['2,7'] : []),
    ...(saved.gateOpened ? [BRIAR_GATE] : []),
  ]).filter((key) => revealed.includes(key))
  const sceneChoices: Record<string, string> = {}
  if (saved.sceneChoices && typeof saved.sceneChoices === 'object') {
    for (const [key, choice] of Object.entries(saved.sceneChoices)) {
      if (
        typeof choice === 'string' &&
        BRIAR_SCENES[key]?.choices.some((option) => option.id === choice)
      ) {
        sceneChoices[key] = choice
      }
    }
  }
  const frontier = validKeys(saved.frontier).filter(
    (key) => !revealed.includes(key),
  )
  const cards = Array.isArray(saved.cards)
    ? saved.cards
        .filter(
          (v): v is BriarMemoryCard =>
            typeof v?.id === 'number' &&
            typeof v?.pairId === 'number' &&
            typeof v?.image === 'string' &&
            typeof v?.matched === 'boolean',
        )
        .map((card) => ({ ...card, flipped: card.matched }))
    : []
  const combat = restoreBriarCombat(saved.combat)
  const house = restoreHouseProgress(saved.house)
  const waveIndex =
    Number.isInteger(saved.waveIndex) &&
    saved.waveIndex! >= 0 &&
    saved.waveIndex! < 4
      ? saved.waveIndex!
      : 0
  const waveCards: BriarMapCard[] = Array.isArray(saved.mapCards)
    ? saved.mapCards
        .filter(
          (card): card is BriarMapCard =>
            !!card &&
            typeof card.id === 'number' &&
            typeof card.pairId === 'number' &&
            typeof card.tile === 'string' &&
            isBriarCoordinate(card.tile) &&
            typeof card.image === 'string' &&
            typeof card.matched === 'boolean',
        )
        .map((card) => ({ ...card, flipped: card.matched }))
    : []
  const roomId =
    saved.roomId === 'vault-1' ||
    saved.roomId === 'vault-2' ||
    saved.roomId === 'sprite' ||
    saved.roomId === 'patrol'
      ? saved.roomId
      : null
  // A combat room restores only with its fight; a Classic room only with its cards.
  const combatRoom = isCombatRoom(roomId) && combat !== null
  const inRoom = combatRoom || (!isCombatRoom(roomId) && cards.length > 0)

  return {
    ...fresh,
    waveIndex,
    wavePhase: saved.wavePhase === 'exploring' ? 'exploring' : 'matching',
    mapCards: waveCards,
    mapDeckSignature:
      typeof saved.mapDeckSignature === 'string' ? saved.mapDeckSignature : '',
    seenMapImages: [
      ...new Set([
        ...(Array.isArray(saved.seenMapImages)
          ? saved.seenMapImages.filter(
              (value): value is string =>
                typeof value === 'string' && value.length > 0,
            )
          : []),
        ...waveCards.map((card) => card.image),
      ]),
    ],
    revealed,
    visited,
    sceneChoices,
    prologueChoice:
      saved.prologueChoice === 'terms' || saved.prologueChoice === 'anchor'
        ? saved.prologueChoice
        : null,
    frontier,
    player:
      typeof saved.player === 'string' && revealed.includes(saved.player)
        ? saved.player
        : BRIAR_START,
    attempts: Number.isSafeInteger(saved.attempts)
      ? Math.max(0, saved.attempts!)
      : 0,
    relics: Array.isArray(saved.relics)
      ? saved.relics.filter((v): v is string => typeof v === 'string')
      : [],
    wildflowers: Number.isSafeInteger(saved.wildflowers)
      ? Math.max(0, saved.wildflowers!)
      : 0,
    lanterns: Number.isSafeInteger(saved.lanterns)
      ? Math.max(0, saved.lanterns!)
      : 1,
    chestClaims: validKeys(saved.chestClaims),
    puzzleSolved: saved.puzzleSolved === true,
    minefield: restoreMinefieldRun(saved.minefield),
    minefieldRound: Number.isSafeInteger(saved.minefieldRound)
      ? Math.max(0, Math.min(999, saved.minefieldRound!))
      : 0,
    gateOpened: saved.gateOpened === true,
    completedEncounters: Array.isArray(saved.completedEncounters)
      ? saved.completedEncounters.filter(
          (v): v is string => typeof v === 'string',
        )
      : [],
    sealedPartnerFound: saved.sealedPartnerFound === true,
    room:
      saved.room === 'house' && house
        ? 'house'
        : saved.room === 'memory' && roomId && inRoom
          ? 'memory'
          : 'map',
    house,
    roomId: saved.room === 'memory' && inRoom ? roomId : null,
    cards: combatRoom ? [] : cards,
    combat: saved.room === 'memory' && combatRoom ? combat : null,
    roomMisses: Number.isSafeInteger(saved.roomMisses)
      ? Math.max(0, saved.roomMisses!)
      : 0,
    hearts: Number.isSafeInteger(saved.hearts)
      ? Math.max(1, Math.min(3, saved.hearts!))
      : 3,
    status:
      typeof saved.status === 'string'
        ? saved.status.slice(0, 220)
        : fresh.status,
  }
}

/** Finish a saved, already-decided defeat whose retreat timer was interrupted. */
export function recoverBriarCombatDefeat(progress: BriarSave): BriarSave {
  const combat = progress.combat
  if (progress.room !== 'memory' || combat?.state.outcome !== 'defeat')
    return progress

  const houseOrigin = progress.house?.combatOrigin
  const house =
    houseOrigin && progress.house
      ? {
          ...progress.house,
          combatOrigin: null,
          current: 'HD-18' as const,
          visited: progress.house.visited.includes('HD-18')
            ? progress.house.visited
            : [...progress.house.visited, 'HD-18' as const],
        }
      : progress.house
  const lastHeart = progress.hearts <= 1
  const retreat = lastHeart
    ? 'The fight overwhelms you. You retreat to Briar Camp, keeping your map and discoveries.'
    : `${combat.state.enemy.name} drives you back to the trail. One heart lost; the room waits for a rematch.`

  return {
    ...progress,
    room: houseOrigin ? 'house' : 'map',
    roomId: null,
    cards: [],
    combat: null,
    roomMisses: 0,
    hearts: lastHeart ? 3 : progress.hearts - 1,
    player: lastHeart ? BRIAR_START : progress.player,
    house,
    status: houseOrigin
      ? `${retreat} You recover in the House's quiet bedchamber without losing your discoveries.`
      : retreat,
  }
}

export type BriarTileProgress =
  'hidden' | 'unvisited' | 'unfinished' | 'complete'

/** A revealed square is not "clear" until its one-time story and site work are settled. */
export function briarTileProgress(
  save: BriarSave,
  key: string,
): BriarTileProgress {
  if (!save.revealed.includes(key)) return 'hidden'
  if (!save.visited.includes(key)) return 'unvisited'
  if (BRIAR_SCENES[key] && !save.sceneChoices[key]) return 'unfinished'

  switch (BRIAR_SITES[key]?.kind) {
    case 'chest':
      return save.chestClaims.includes(key) ? 'complete' : 'unfinished'
    case 'puzzle':
      return save.puzzleSolved ? 'complete' : 'unfinished'
    case 'enemy':
      return save.completedEncounters.includes(key) ? 'complete' : 'unfinished'
    case 'dungeon':
      return save.relics.includes('bramble-chime') ? 'complete' : 'unfinished'
    case 'gate':
      return save.gateOpened ? 'complete' : 'unfinished'
    case 'sealed':
      return 'unfinished'
    default:
      return 'complete'
  }
}
