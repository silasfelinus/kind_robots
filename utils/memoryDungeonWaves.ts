import {
  BRIAR_TILES,
  BRIAR_SITES,
  BRIAR_START,
  type BriarMapCard,
  type BriarSave,
} from './memoryDungeonWorld'

/**
 * Four increasingly large, hand-arranged memory reveal waves.
 * Each TWO matching images reveal TWO different squares of the stable map.
 * Four additional spaces are cross-region sigils, NOT matched in Briar Camp.
 */
export const BRIAR_CROSS_MAP_KEYS = ['5,2', '1,1', '8,1', '8,8'] as const
export const BRIAR_WAVE_SIZES = [12, 14, 16, 18] as const

const first: string[] = [
  '2,4',
  '1,4',
  '3,4',
  '4,4',
  '4,3',
  '4,2',
  '2,5',
  '3,5',
  '3,6',
  '2,6',
  '2,7',
  '3,2',
]
const second: string[] = [
  '5,3',
  '5,4',
  '6,4',
  '6,3',
  '6,2',
  '5,5',
  '5,6',
  '6,5',
  '6,6',
  '3,3',
  '2,3',
  '1,3',
  '4,5',
  '4,6',
]
const third: string[] = [
  '7,4',
  '8,4',
  '7,3',
  '7,2',
  '7,1',
  '8,3',
  '8,2',
  '7,5',
  '7,6',
  '8,5',
  '8,6',
  '6,7',
  '5,7',
  '4,7',
  '3,7',
  '1,5',
]
const used = new Set([...first, ...second, ...third, ...BRIAR_CROSS_MAP_KEYS])
const last = BRIAR_TILES.map((tile) => tile.key).filter((key) => !used.has(key))

export const BRIAR_REVEAL_WAVES: readonly (readonly string[])[] = [
  first,
  second,
  third,
  last,
]

export const BRIAR_CROSS_MAP_PUZZLES: Record<
  (typeof BRIAR_CROSS_MAP_KEYS)[number],
  { title: string; counterpart: string; hint: string }
> = {
  '5,2': {
    title: 'Sleeping Sigil',
    counterpart: 'Bloom Orchard',
    hint: 'A second almost-identical sigil sleeps in the Mirror Orchard.',
  },
  '1,1': {
    title: 'North Star Twin',
    counterpart: 'Lake Terrace',
    hint: 'Search a distant shoreline for a star with one mismatched point.',
  },
  '8,1': {
    title: 'Whitewing Cipher',
    counterpart: 'Salt Cliffs',
    hint: 'The gull on this marker is missing a single feather.',
  },
  '8,8': {
    title: 'Moonroot Knot',
    counterpart: 'Moonwell Vale',
    hint: 'The same knot appears much later, with its roots reversed.',
  },
}

export function validateBriarWaves(): string[] {
  const errors: string[] = []
  const all = BRIAR_REVEAL_WAVES.flatMap((wave) => wave)
  const reserves = [...BRIAR_CROSS_MAP_KEYS]
  if (BRIAR_REVEAL_WAVES.length !== 4)
    errors.push('Must contain four reveal waves')
  BRIAR_REVEAL_WAVES.forEach((wave, i) => {
    if (wave.length !== BRIAR_WAVE_SIZES[i])
      errors.push(`Wave ${i + 1}: incorrect size`)
    if (wave.length % 2) errors.push(`Wave ${i + 1}: unpaired card count`)
  })
  if (new Set([...all, ...reserves]).size !== 64)
    errors.push('Overlapping or missing terrain squares')
  if (
    [...all, ...reserves].some((key) => !BRIAR_TILES.some((t) => t.key === key))
  )
    errors.push('Out-of-bounds terrain square')
  if (!first.includes('4,2'))
    errors.push('Merchant must be discoverable in wave one')
  if (!second.includes('6,2'))
    errors.push('Dungeon must be discoverable in wave two')
  if (!third.includes('8,4'))
    errors.push('Gate must be discoverable by wave three')
  if (!BRIAR_CROSS_MAP_KEYS.every((key) => BRIAR_SITES[key]?.kind === 'sealed'))
    errors.push('Reserved cross-map landmarks must have authored coordinates')
  return errors
}

export function briarWaveFor(key: string): number {
  return BRIAR_REVEAL_WAVES.findIndex((wave) => wave.includes(key))
}

/** Assign each distinct selected picture to exactly two independently placed tiles. */
export function createBriarWaveCards(
  tiles: readonly string[],
  images: readonly string[],
  random: () => number = Math.random,
): BriarMapCard[] {
  if (
    tiles.length % 2 ||
    images.length !== tiles.length / 2 ||
    new Set(tiles).size !== tiles.length ||
    new Set(images).size !== images.length
  ) {
    throw new Error(
      'A reveal round needs two unique terrain squares for every unique image.',
    )
  }
  const positions = [...tiles]
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[positions[i], positions[j]] = [positions[j]!, positions[i]!]
  }
  return positions.map((tile, i) => ({
    id: i,
    tile,
    pairId: Math.floor(i / 2),
    image: images[Math.floor(i / 2)]!,
    flipped: false,
    matched: false,
  }))
}

/** Resume an interrupted map flip without charging another attempt.
 * restoreBriarSave deliberately hides unmatched faces; consult the raw snapshot
 * only to recover a valid in-flight turn, never to invent new map cards. */
export function recoverBriarWaveTurn(
  progress: BriarSave,
  saved: unknown,
): { progress: BriarSave; firstTile: string | null; recovered: boolean } {
  const unchanged = { progress, firstTile: null, recovered: false }
  const wave = BRIAR_REVEAL_WAVES[progress.waveIndex]
  if (
    progress.room !== 'map' ||
    progress.wavePhase !== 'matching' ||
    !wave ||
    progress.mapCards.length !== wave.length ||
    !saved ||
    typeof saved !== 'object'
  )
    return unchanged
  const rawCards = (saved as Partial<BriarSave>).mapCards
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
  if (new Set(tiles).size !== pending.length) return discarded
  if (
    !pending.every((card) => {
      const current = progress.mapCards.find((entry) => entry.tile === card.tile)
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
        status: 'Your first picture is still face up. Choose its match.',
      },
      firstTile: tiles[0]!,
      recovered: true,
    }
  }
  const settled = settleBriarWavePair(
    { ...progress, mapCards: restoredCards },
    tiles[0]!,
    tiles[1]!,
  )
  return {
    progress: settled
      ? {
          ...settled,
          status:
            settled.wavePhase === 'exploring'
              ? 'Your interrupted match completed the round. Explore the forest.'
              : 'Your remembered pair survived the interruption.',
        }
      : {
          ...progress,
          status: 'An interrupted mismatch turned face down. Try again.',
        },
    firstTile: null,
    recovered: true,
  }
}

/** Settle a genuinely matching two-card turn after its flip animation.
 * Shared by the playable store and seeded fresh-expedition witnesses. */
export function settleBriarWavePair(
  progress: BriarSave,
  firstTile: string,
  secondTile: string,
): BriarSave | null {
  const wave = BRIAR_REVEAL_WAVES[progress.waveIndex]
  if (
    progress.room !== 'map' ||
    progress.wavePhase !== 'matching' ||
    !wave ||
    progress.mapCards.length !== wave.length ||
    firstTile === secondTile
  )
    return null
  const first = progress.mapCards.find((card) => card.tile === firstTile)
  const second = progress.mapCards.find((card) => card.tile === secondTile)
  if (
    !first ||
    !second ||
    !wave.includes(firstTile) ||
    !wave.includes(secondTile) ||
    !first.flipped ||
    !second.flipped ||
    first.matched ||
    second.matched ||
    first.pairId !== second.pairId ||
    first.image !== second.image ||
    progress.mapCards.filter((card) => card.pairId === first.pairId).length !==
      2
  )
    return null
  const mapCards = progress.mapCards.map((card) =>
    card.tile === firstTile || card.tile === secondTile
      ? { ...card, matched: true, flipped: true }
      : card,
  )
  const revealed = [...new Set([...progress.revealed, firstTile, secondTile])]
  const visited =
    revealed.includes(BRIAR_START) && !progress.visited.includes(BRIAR_START)
      ? [...progress.visited, BRIAR_START]
      : progress.visited
  return {
    ...progress,
    mapCards,
    revealed,
    visited,
    wavePhase: mapCards.every((card) => card.matched)
      ? 'exploring'
      : 'matching',
  }
}
