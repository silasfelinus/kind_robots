import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useUserStore } from './userStore'
import { resolveMemoryDungeonDeck } from './helpers/memoryDungeonDeckSource'
import {
  DEFAULT_DUNGEON_DECK,
  normalizeDungeonDeck,
  type DungeonDeckSelection,
} from '~/utils/memoryDungeonDeck'
import {
  BRIAR_DUNGEON,
  BRIAR_GATE,
  BRIAR_LINKS,
  BRIAR_SITES,
  briarConnected,
  newBriarSave,
  restoreBriarSave,
  type BriarMemoryCard,
  type BriarSave,
} from '~/utils/memoryDungeonWorld'
import {
  describeEvents,
  index as cellIndex,
  scout,
  strike,
  type Cell,
  type WeaponId,
} from '~/utils/memoryDungeon/combat'
import {
  COMBAT_PAIRS,
  COMBAT_ROOMS,
  isCombatRoom,
  startCombatRoom,
} from '~/utils/memoryDungeon/rooms'
import { BRIAR_REVEAL_WAVES, BRIAR_CROSS_MAP_PUZZLES, createBriarWaveCards } from '~/utils/memoryDungeonWaves'

const STORAGE_KEY = 'memoryDungeonBriarCampV1'
const DECK_KEY = 'memoryDungeonDeckChoiceV1'

function shuffle<T>(list: T[]): T[] {
  const shuffled = [...list]
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[other]] = [shuffled[other]!, shuffled[index]!]
  }
  return shuffled
}

export const useMemoryWorldStore = defineStore('memoryWorld', () => {
  const userStore = useUserStore()
  const deck = ref<DungeonDeckSelection>({ ...DEFAULT_DUNGEON_DECK })
  const state = ref<BriarSave>(newBriarSave())
  const ready = ref(false)
  const loading = ref(false)
  const turnLocked = ref(false)
  const firstCard = ref<number | null>(null)
  const firstMapCard = ref<string | null>(null)
  const runeInput = ref<string[]>([])
  /** Combat cells face up after the last action (by board index), until they turn back. */
  const combatShown = ref<number[]>([])
  /** The first Scout pick, shown face up while the second is chosen. */
  const combatPick = ref<number | null>(null)
  /** What the last combat action did, for the status line and live region. */
  const combatNote = ref('')
  let roomEpoch = 0

  const selectedSite = computed(() => BRIAR_SITES[state.value.player] ?? null)
  const mapMatching = computed(() =>
    state.value.room === 'map' && state.value.wavePhase === 'matching',
  )
  const waveSize = computed(() => BRIAR_REVEAL_WAVES[state.value.waveIndex]?.length ?? 0)
  const mapPairsMatched = computed(() => state.value.mapCards.filter((card) => card.matched).length / 2)
  const waveComplete = computed(() => state.value.mapCards.length > 0 &&
    state.value.mapCards.every((card) => card.matched))
  function mapCardAt(key: string): BriarMapCard | undefined {
    return state.value.mapCards.find((card) => card.tile === key)
  }

  const matureAvailable = computed(
    () => userStore.showMature === true || userStore.user?.showMature === true,
  )

  function selectDeck(selection: Partial<DungeonDeckSelection>): void {
    deck.value = normalizeDungeonDeck({ ...deck.value, ...selection })
    if (!matureAvailable.value) deck.value.includeMature = false
    if (import.meta.client) {
      try {
        window.localStorage.setItem(DECK_KEY, JSON.stringify(deck.value))
      } catch {
        state.value.status =
          'Deck choice is active for this visit; browser storage is unavailable.'
      }
    }
  }

  const hasChime = computed(() => state.value.relics.includes('bramble-chime'))
  const roomComplete = computed(() =>
    state.value.combat
      ? state.value.room === 'memory' &&
        state.value.combat.state.outcome === 'victory'
      : state.value.room === 'memory' &&
        state.value.cards.length > 0 &&
        state.value.cards.every((card) => card.matched),
  )
  const matchedPairs = computed(
    () => state.value.cards.filter((card) => card.matched).length / 2,
  )

  function persist(): void {
    if (!import.meta.client) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
    } catch {
      state.value.status =
        'Your progress is playable here, but browser storage is unavailable.'
    }
  }

  function hydrate(): void {
    if (ready.value) return
    if (import.meta.client) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (saved) state.value = restoreBriarSave(JSON.parse(saved) as unknown)
        const previousDeck = window.localStorage.getItem(DECK_KEY)
        if (previousDeck)
          deck.value = normalizeDungeonDeck(JSON.parse(previousDeck) as unknown)
        if (!matureAvailable.value && deck.value.includeMature) {
          deck.value.includeMature = false
          if (state.value.room === 'memory') {
            state.value.room = 'map'
            state.value.cards = []
            state.value.roomId = null
            state.value.status =
              'Mature gallery images are hidden until enabled in your account preferences.'
          }
        }
      } catch {
        state.value = newBriarSave()
      }
    }
    ready.value = true
  }

  watch(matureAvailable, (allowed) => {
    if (allowed || !deck.value.includeMature) return
    selectDeck({ includeMature: false })
    if (state.value.room === 'memory') {
      leaveRoom('Your mature-art preference changed. The gallery room closed without losing your map.')
    }
    if (state.value.mapCards.length && state.value.wavePhase === 'matching') {
      state.value.mapCards = []
      firstMapCard.value = null
      roomEpoch++
      turnLocked.value = false
      persist()
      void prepareWave()
    }
  })

  function reset(): void {
    roomEpoch++
    turnLocked.value = false
    firstCard.value = null
    firstMapCard.value = null
    runeInput.value = []
    state.value = newBriarSave()
    persist()
    void prepareWave()
  }

  async function prepareWave(): Promise<void> {
    if (state.value.room !== 'map' || state.value.wavePhase !== 'matching' ||
      state.value.mapCards.length || loading.value) return
    const keys = (BRIAR_REVEAL_WAVES[state.value.waveIndex] ?? [])
      .filter((key) => !state.value.revealed.includes(key))
    if (!keys.length) {
      state.value.wavePhase = 'exploring'
      persist()
      return
    }
    loading.value = true
    const ticket = ++roomEpoch
    try {
      const usedPrior = BRIAR_REVEAL_WAVES.slice(0, state.value.waveIndex)
        .reduce((total, wave) => total + wave.length / 2, 0)
      const paths = await resolveMemoryDungeonDeck(deck.value, keys.length / 2, usedPrior)
      if (ticket !== roomEpoch) return
      if (new Set(paths).size !== keys.length / 2) {
        throw new Error('This deck does not have enough unique matching images for the current round.')
      }
      const cards = createBriarWaveCards(keys, paths)
      state.value.mapCards = cards
      state.value.status = `Round ${state.value.waveIndex + 1}: match ${paths.length} image pairs to uncover ${keys.length} map squares.`
      persist()
    } catch (error) {
      if (ticket === roomEpoch) {
        state.value.status = error instanceof Error ? error.message : 'Images could not load. Choose another deck and retry.'
      }
    } finally {
      if (ticket === roomEpoch) loading.value = false
    }
  }

  function reveal(key: string): void {
    if (mapMatching.value) {
      pickMapCard(key)
      return
    }
    if (state.value.revealed.includes(key)) walk(key)
  }

  function pickMapCard(key: string): void {
    if (!mapMatching.value || loading.value || turnLocked.value) return
    const card = mapCardAt(key)
    if (!card || card.matched || card.flipped) return
    card.flipped = true
    if (!firstMapCard.value) {
      firstMapCard.value = key
      persist()
      return
    }
    const first = mapCardAt(firstMapCard.value)
    firstMapCard.value = null
    if (!first || first.tile === card.tile) return
    state.value.attempts++
    turnLocked.value = true
    const epoch = roomEpoch
    if (first.pairId === card.pairId) {
      first.matched = true
      card.matched = true
      for (const tile of [first.tile, card.tile]) {
        if (!state.value.revealed.includes(tile)) state.value.revealed.push(tile)
      }
      state.value.status = `A remembered pair! Two pieces of Briar Camp have emerged.`
      if (state.value.mapCards.every((tile) => tile.matched)) {
        state.value.wavePhase = 'exploring'
        state.value.status = state.value.waveIndex === 3
          ? 'All four reveal rounds are complete. Explore the map; four paired sigils await future regions.'
          : 'Round complete! Explore the revealed landscape, then begin the next matching round.'
      }
      persist()
      window.setTimeout(() => {
        if (epoch !== roomEpoch) return
        turnLocked.value = false
        persist()
      }, 260)
    } else {
      state.value.status = 'Not a match. Remember both images before they turn over.'
      persist()
      window.setTimeout(() => {
        if (epoch !== roomEpoch) return
        first.flipped = false
        card.flipped = false
        turnLocked.value = false
        persist()
      }, 1100)
    }
  }

  async function nextWave(): Promise<void> {
    if (state.value.room !== 'map' || state.value.wavePhase !== 'exploring' ||
      state.value.waveIndex >= BRIAR_REVEAL_WAVES.length - 1) return
    state.value.waveIndex++
    state.value.wavePhase = 'matching'
    state.value.mapCards = []
    firstMapCard.value = null
    state.value.status = 'A fresh group of fog-bound memory cards stirs across the forest.'
    persist()
    await prepareWave()
  }

  function walk(key: string): void {
    if (state.value.room !== 'map' || state.value.wavePhase !== 'exploring') return
    if (!briarConnected(state.value.player, key, state.value.revealed)) return
    state.value.player = key
    state.value.status =
      BRIAR_SITES[key]?.description ?? 'You retrace a familiar path.'
    persist()
  }

  function claimChest(): void {
    const key = state.value.player
    if (state.value.room !== 'map' || BRIAR_SITES[key]?.kind !== 'chest') return
    if (state.value.chestClaims.includes(key)) return
    state.value.chestClaims.push(key)
    if (key === '3,6') {
      state.value.wildflowers += 2
      state.value.status =
        'A cache of two silvery wildflowers. Mosswick would certainly have opinions.'
    } else {
      state.value.lanterns += 1
      state.value.status =
        'A Lantern glimmers within. Use its light to peek at a matching pair.'
    }
    persist()
  }

  function buyLantern(): void {
    if (
      state.value.room !== 'map' ||
      state.value.player !== '4,2' ||
      state.value.wildflowers < 1
    )
      return
    state.value.wildflowers -= 1
    state.value.lanterns += 1
    state.value.status =
      'Mosswick trades a Lantern for one wildflower and tips his hat.'
    persist()
  }

  function enterRune(symbol: 'leaf' | 'sun'): void {
    if (
      state.value.room !== 'map' ||
      state.value.player !== '2,7' ||
      state.value.puzzleSolved
    )
      return
    runeInput.value.push(symbol)
    const sequence = ['leaf', 'leaf', 'sun']
    if (runeInput.value.some((part, i) => part !== sequence[i])) {
      runeInput.value = []
      state.value.status = 'The three stones dim. A clue upstream might help.'
      persist()
      return
    }
    if (runeInput.value.length === sequence.length) {
      state.value.puzzleSolved = true
      state.value.wildflowers += 1
      state.value.status =
        'Leaf, leaf, sun. The hidden grove blooms and gives you one wildflower.'
      runeInput.value = []
    } else {
      state.value.status = `The stone glows. ${runeInput.value.length}/3 symbols remembered.`
    }
    persist()
  }

  async function startEncounter(
    kind: 'dungeon' | 'sprite' | 'patrol',
  ): Promise<void> {
    if (state.value.room !== 'map' || state.value.wavePhase !== 'exploring' || loading.value) return
    const position = state.value.player
    if (kind === 'dungeon' && position !== BRIAR_DUNGEON) return
    if (kind === 'sprite' && position !== '5,5') return
    if (kind === 'patrol' && position !== '7,3') return
    if (
      kind !== 'dungeon' &&
      state.value.completedEncounters.includes(position)
    )
      return
    await beginRoom(kind === 'dungeon' ? 'vault-1' : kind)
  }

  async function beginRoom(
    roomId: NonNullable<BriarSave['roomId']>,
  ): Promise<void> {
    loading.value = true
    const ticket = ++roomEpoch
    try {
      const required = isCombatRoom(roomId) ? COMBAT_PAIRS : 3
      const paths = await resolveMemoryDungeonDeck(deck.value, required)
      if (ticket !== roomEpoch) return
      if (new Set(paths).size < required) {
        state.value.status = `Your selected gallery needs at least ${required} distinct loadable images. Choose a richer collection, then try again.`
        return
      }
      combatShown.value = []
      combatPick.value = null
      combatNote.value = ''
      if (isCombatRoom(roomId)) {
        state.value.room = 'memory'
        state.value.roomId = roomId
        state.value.cards = []
        state.value.combat = startCombatRoom(
          roomId,
          Math.floor(Math.random() * 2 ** 31),
          [...new Set(paths)],
        )
        state.value.roomMisses = 0
        firstCard.value = null
        turnLocked.value = false
        state.value.status = COMBAT_ROOMS[roomId].intro
        persist()
        return
      }
      state.value.combat = null
      const cards: BriarMemoryCard[] = paths
        .slice(0, required)
        .flatMap((image, pairId) => [
          { id: pairId * 2, pairId, image, flipped: false, matched: false },
          { id: pairId * 2 + 1, pairId, image, flipped: false, matched: false },
        ])
      state.value.room = 'memory'
      state.value.roomId = roomId
      state.value.cards = shuffle(cards)
      state.value.roomMisses = 0
      firstCard.value = null
      turnLocked.value = false
      // Combat rooms returned above; only the Classic Echo Chamber reaches here.
      state.value.status =
        'The Vault welcomes you with three pairs from your chosen art gallery.'
      persist()
    } catch {
      if (ticket === roomEpoch)
        state.value.status =
          'The gallery could not load. Check your collection and try again.'
    } finally {
      if (ticket === roomEpoch) loading.value = false
    }
  }

  function peekPair(): void {
    if (
      state.value.room !== 'memory' ||
      state.value.combat ||
      turnLocked.value ||
      state.value.lanterns < 1 ||
      roomComplete.value
    )
      return
    const pairs = [
      ...new Set(
        state.value.cards.filter((c) => !c.matched).map((c) => c.pairId),
      ),
    ]
    const pair = pairs[0]
    if (pair === undefined) return
    state.value.lanterns--
    const epoch = roomEpoch
    turnLocked.value = true
    for (const card of state.value.cards) {
      if (card.pairId === pair) card.flipped = true
    }
    state.value.status = 'Lanternlight shows one pair. Memorize its positions.'
    persist()
    window.setTimeout(() => {
      if (epoch !== roomEpoch) return
      for (const card of state.value.cards) {
        if (!card.matched) card.flipped = false
      }
      firstCard.value = null
      turnLocked.value = false
      persist()
    }, 1800)
  }

  function pickCard(id: number): void {
    if (
      state.value.room !== 'memory' ||
      loading.value ||
      turnLocked.value ||
      roomComplete.value
    )
      return
    const card = state.value.cards.find((part) => part.id === id)
    if (!card || card.flipped || card.matched) return
    card.flipped = true
    if (firstCard.value === null) {
      firstCard.value = id
      persist()
      return
    }
    const other = state.value.cards.find((part) => part.id === firstCard.value)
    firstCard.value = null
    if (!other || other.id === card.id) return
    state.value.attempts += 1
    turnLocked.value = true
    const epoch = roomEpoch
    const match = other.pairId === card.pairId
    if (match) {
      card.matched = true
      other.matched = true
      state.value.status = 'A match! The gallery paintings settle into place.'
    } else {
      state.value.roomMisses += 1
      state.value.status =
        'Not quite. Watch the pictures before they turn back.'
    }
    persist()
    window.setTimeout(
      () => {
        if (epoch !== roomEpoch) return
        if (!match) {
          for (const part of state.value.cards)
            if (!part.matched) part.flipped = false
        }
        turnLocked.value = false
        if (!match && state.value.roomMisses >= 3) {
          state.value.roomMisses = 0
          state.value.hearts -= 1
          if (state.value.hearts <= 0) {
            leaveRoom(
              'The room overwhelms you. You retreat to Briar Camp, keeping your map and discoveries.',
            )
            state.value.player = '2,4'
            state.value.hearts = 3
          } else {
            state.value.status =
              'The chamber resets its unpaired cards. Your learned matches remain. One heart lost.'
          }
        }
        persist()
      },
      match ? 260 : 1000,
    )
  }

  /** Apply a combat action, show what it revealed, then turn unmatched cards back. */
  function resolveCombat(
    next: NonNullable<BriarSave['combat']>['state'],
  ): void {
    const combat = state.value.combat
    if (!combat || next === combat.state) return
    const events = next.log.slice(combat.state.log.length)
    combat.state = next
    state.value.attempts += 1
    const revealed = events.flatMap((e) =>
      e.type === 'reveal' ? e.cells.map((c) => cellIndex(next.cols, c)) : [],
    )
    combatShown.value = revealed
    combatPick.value = null
    combatNote.value = describeEvents(events)
    state.value.status = combatNote.value
    turnLocked.value = true
    const epoch = roomEpoch
    persist()
    window.setTimeout(
      () => {
        if (epoch !== roomEpoch) return
        combatShown.value = []
        turnLocked.value = false
        if (next.outcome === 'defeat') {
          state.value.hearts -= 1
          if (state.value.hearts <= 0) {
            leaveRoom(
              'The fight overwhelms you. You retreat to Briar Camp, keeping your map and discoveries.',
            )
            state.value.player = '2,4'
            state.value.hearts = 3
          } else {
            leaveRoom(
              `${next.enemy.name} drives you back to the trail. One heart lost; the room waits for a rematch.`,
            )
          }
        }
        persist()
      },
      revealed.length > 2 ? 1400 : 1000,
    )
  }

  /** Scout: the first tap shows a card, the second resolves the pair. */
  function combatScout(cell: Cell): void {
    const combat = state.value.combat
    if (!combat || turnLocked.value || combat.state.outcome !== 'fighting')
      return
    const i = cellIndex(combat.state.cols, cell)
    const card = combat.state.cards[i]
    if (!card || card.pair === null || card.matched) return
    if (combatPick.value === null) {
      combatPick.value = i
      return
    }
    if (combatPick.value === i) {
      combatPick.value = null
      return
    }
    const first = combatPick.value
    resolveCombat(
      scout(
        combat.state,
        {
          row: Math.floor(first / combat.state.cols),
          col: first % combat.state.cols,
        },
        cell,
      ),
    )
  }

  /** Strike: commit a previewed weapon mask. */
  function combatStrike(
    weapon: WeaponId,
    anchor: Cell,
    rotation: number,
  ): void {
    const combat = state.value.combat
    const roomId = state.value.roomId
    if (!combat || turnLocked.value || !isCombatRoom(roomId)) return
    if (!COMBAT_ROOMS[roomId].loadout.includes(weapon)) return
    combatPick.value = null
    resolveCombat(strike(combat.state, weapon, anchor, rotation))
  }

  async function finishRoom(): Promise<void> {
    if (!roomComplete.value || turnLocked.value) return
    const room = state.value.roomId
    if (room === 'vault-1') {
      await beginRoom('vault-2')
      return
    }
    if (room === 'vault-2') {
      if (!state.value.relics.includes('bramble-chime'))
        state.value.relics.push('bramble-chime')
      leaveRoom(
        'You earned the Bramble Chime! Return to the eastern thorn gate to open the path toward Bloom Orchard.',
      )
      return
    }
    if (room) {
      const key = room === 'sprite' ? '5,5' : '7,3'
      if (!state.value.completedEncounters.includes(key))
        state.value.completedEncounters.push(key)
      state.value.wildflowers += 1
      leaveRoom('The forest challenger bows and gives you a wildflower.')
    }
  }

  function leaveRoom(
    message = 'You step out of the challenge and return to the same place on the map.',
  ): void {
    roomEpoch++
    state.value.room = 'map'
    state.value.roomId = null
    state.value.cards = []
    state.value.combat = null
    state.value.roomMisses = 0
    state.value.status = message
    combatShown.value = []
    combatPick.value = null
    combatNote.value = ''
    firstCard.value = null
    turnLocked.value = false
    loading.value = false
    persist()
  }

  function examineCrossMapSigil(key: string): void {
    if (state.value.room !== 'map' || state.value.wavePhase !== 'exploring' ||
      state.value.waveIndex !== 3) return
    const sigil = BRIAR_CROSS_MAP_PUZZLES[key as keyof typeof BRIAR_CROSS_MAP_PUZZLES]
    if (!sigil) return
    state.value.status = `${sigil.title}: ${sigil.hint} Its true match awaits in ${sigil.counterpart}.`
    persist()
  }

  function openGate(): void {
    if (state.value.player !== BRIAR_GATE || !hasChime.value) return
    state.value.gateOpened = true
    state.value.status =
      'The Bramble Chime parts the thorns! Briar Camp is complete. Bloom Orchard is the next region to build.'
    persist()
  }

  return {
    state,
    deck,
    matureAvailable,
    selectDeck,
    ready,
    loading,
    turnLocked,
    runeInput,
    combatShown,
    combatPick,
    combatNote,
    selectedSite,
    mapMatching,
    mapPairsMatched,
    waveSize,
    waveComplete,
    mapCardAt,
    examineCrossMapSigil,
    prepareWave,
    nextWave,
    pickMapCard,
    hasChime,
    roomComplete,
    matchedPairs,
    hydrate,
    reset,
    reveal,
    walk,
    claimChest,
    buyLantern,
    enterRune,
    startEncounter,
    peekPair,
    pickCard,
    combatScout,
    combatStrike,
    finishRoom,
    leaveRoom,
    openGate,
  }
})
