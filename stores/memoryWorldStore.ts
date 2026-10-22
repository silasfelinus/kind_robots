import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
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
  const runeInput = ref<string[]>([])
  let roomEpoch = 0

  const selectedSite = computed(() => BRIAR_SITES[state.value.player] ?? null)
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
        state.value.status = 'Deck choice is active for this visit; browser storage is unavailable.'
      }
    }
  }

  const hasChime = computed(() => state.value.relics.includes('bramble-chime'))
  const roomComplete = computed(
    () =>
      state.value.room === 'memory' &&
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
        if (previousDeck) deck.value = normalizeDungeonDeck(JSON.parse(previousDeck) as unknown)
        if (!matureAvailable.value) deck.value.includeMature = false
      } catch {
        state.value = newBriarSave()
      }
    }
    ready.value = true
  }

  function reset(): void {
    roomEpoch++
    turnLocked.value = false
    firstCard.value = null
    runeInput.value = []
    state.value = newBriarSave()
    persist()
  }

  function reveal(key: string): void {
    if (loading.value || state.value.room !== 'map') return
    if (state.value.revealed.includes(key)) {
      walk(key)
      return
    }
    if (!state.value.frontier.includes(key)) return

    state.value.revealed.push(key)
    state.value.frontier = state.value.frontier.filter((tile) => tile !== key)
    for (const next of BRIAR_LINKS[key] ?? []) {
      if (
        !state.value.revealed.includes(next) &&
        !state.value.frontier.includes(next)
      ) {
        state.value.frontier.push(next)
      }
    }
    state.value.player = key
    const site = BRIAR_SITES[key]
    state.value.status = site
      ? `${site.name}: ${site.description}`
      : 'The mist clears. Another piece of the forest belongs to your map.'
    if (key === BRIAR_GATE && !hasChime.value) {
      state.value.status =
        'The east gate is sealed. Clear the Rootbound Vault and return with the Bramble Chime.'
    }
    persist()
  }

  function walk(key: string): void {
    if (state.value.room !== 'map') return
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
    if (state.value.room !== 'map' || loading.value) return
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
      const paths = await resolveMemoryDungeonDeck(
        deck.value,
        roomId === 'vault-2' ? 4 : 3,
      )
      if (ticket !== roomEpoch) return
      const required = roomId === 'vault-2' ? 4 : 3
      if (new Set(paths).size < required) {
        state.value.status = `Your selected gallery needs at least ${required} distinct loadable images. Choose a richer collection, then try again.`
        return
      }
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
      state.value.status =
        roomId === 'vault-2'
          ? 'The Rootbound Warden guards the Chime. Remember four pairs to win.'
          : roomId === 'vault-1'
            ? 'The Vault welcomes you with three pairs from your chosen art gallery.'
            : 'An optional forest challenger invites you to remember three pairs.'
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
    state.value.roomMisses = 0
    state.value.status = message
    firstCard.value = null
    turnLocked.value = false
    loading.value = false
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
    selectedSite,
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
    finishRoom,
    leaveRoom,
    openGate,
  }
})
