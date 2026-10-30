import { defineStore } from 'pinia'
import { grantMemoryRewardOnce } from '~/utils/memoryDungeon/encounterRewards'
import {
  canEnterDarkHouse,
  darkHouseChoose as makeDarkHouseChoice,
  darkHouseFlip as flipDarkHouseCard,
  darkHouseCloseMismatch as closeDarkHouseMismatch,
  darkHouseRecall as recallDarkHousePair,
  darkHouseAnswerPuzzle as answerDarkHousePuzzle,
  darkHousePuzzleHint as hintDarkHousePuzzle,
  darkHouseEchoes,
  darkHouseStrain,
  darkHouseRoomResolved,
  darkHouseTrialSolved,
  darkHouseVerdict,
  darkHouseExits,
  darkHouseMove as advanceDarkHouseRoom,
  newDarkHouseProgress,
  restoreDarkHouseProgress,
  DARK_HOUSE_ROOMS,
  type DarkHouseProgress,
} from '~/utils/memoryDungeon/darkHouse'
import {
  DARK_HOUSE_TRIALS,
  DARK_HOUSE_PUZZLES,
  darkHouseTrialFaces,
} from '~/utils/memoryDungeon/darkHouseChallenges'
import {
  firstTwoWorldFrames,
  firstTwoSceneCallbacks,
  firstTwoPhysicalConsequence,
  crossRealmHouseEpilogue,
  earnedDarkHousePuzzleClue,
  earnedCourierCompensation,
  earnedCourierBellOutcome,
  earnedBorrowedVoiceOutcome,
  earnedRoyalEscortOutcome,
  earnedOrenManifestOutcome,
  earnedKnightCrossingOutcome,
  earnedVesperRookeryOutcome,
  earnedMosswickPromiseOutcome,
  earnedWitnessBellOutcome,
} from '~/utils/memoryDungeon/firstTwoConsequences'
import {
  newMemoryCampaignProgress,
  completeMemoryExperience,
  type MemoryCampaignProgress,
} from '~/utils/memoryDungeon/reimaginerCampaign'
import {
  newCrossMapSealChronicle,
  restoreCrossMapSealChronicle,
  inspectCrossMapSeal,
  crossMapSealProgress,
  missingFirstMapSeals,
  type CrossMapSealChronicle,
} from '~/utils/memoryDungeon/crossMapSealChronicle'
import { restoreMemoryRealitySave } from '~/utils/memoryDungeon/campaignPersistence'
import {
  DARK_BRIAR_WAVES,
  DARK_BRIAR_SCENES,
  DARK_BRIAR_SEALS,
  darkBriarInspectSeal,
  advanceDarkBriarWave,
  darkBriarOpening,
  darkBriarChoose,
  darkBriarCanTravel,
  newDarkBriarProgress,
  restoreDarkBriarProgress,
  recoverDarkBriarTurn,
  type DarkBriarProgress,
} from '~/utils/memoryDungeon/darkBriar'
import {
  DARK_BRIAR_DUELS,
  darkBriarCanDuel,
  darkBriarDuelForRoom,
  type DarkBriarDuel,
} from '~/utils/memoryDungeon/darkBriarDuels'
import { settleDarkBriarReturn } from '~/utils/memoryDungeon/darkBriarReturn'
import { computed, ref, watch } from 'vue'
import {
  newEarthChronicle,
  restoreEarthChronicle,
  reconcileEarthChronicle,
  reconcileHoshimoriEarthChronicle,
  respondToEarthPhoto,
  recoveredEarthPhotos,
  type EarthChronicle,
  type PhotoResponse,
} from '~/utils/memoryDungeon/chronicle'
import {
  coordinate,
  provenCells,
  type Cell as MineCell,
} from '~/utils/memoryDungeon/minefield'
import {
  advanceMinefieldRun,
  createMinefieldRun,
  MINEFIELD_SITE,
  minefieldRunExhausted,
  minefieldRewardKey,
  playMinefieldRun,
  type MinefieldMove,
  type MinefieldSize,
} from '~/utils/memoryDungeon/minefieldRun'
import { useUserStore } from './userStore'
import { WORLD_ONE_GALLERY } from '~/utils/memoryDungeon/realmGallery'
import {
  normalizeMemoryCardBack,
  type MemoryCardBackId,
} from '~/utils/memoryDungeonCardArt'
import { resolveMemoryDungeonDeck } from './helpers/memoryDungeonDeckSource'
import {
  DEFAULT_DUNGEON_DECK,
  normalizeDungeonDeck,
  type DungeonDeckSelection,
} from '~/utils/memoryDungeonDeck'
import {
  BRIAR_DUNGEON,
  BRIAR_GATE,
  BRIAR_SITES,
  BRIAR_START,
  briarConnected,
  newBriarSave,
  restoreBriarSave,
  recoverBriarCombatDefeat,
  recoverBriarRoomMissPenalty,
  recoverBriarRoomFirstFlip,
  type BriarMapCard,
  type BriarMemoryCard,
  type BriarSave,
  type BriarPrologueChoice,
} from '~/utils/memoryDungeonWorld'
import {
  BRIAR_SCENES,
  briarSceneOpening,
  canChooseBriarScene,
} from '~/utils/memoryDungeon/scenes'
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
  HOUSE_DUEL_ROOMS,
  isCombatRoom,
  isHouseDuelOrigin,
  startCombatRoom,
  type HouseDuelOrigin,
} from '~/utils/memoryDungeon/rooms'
import {
  HOUSE_EXIT_POINTS,
  HOUSE_ROOMS,
  houseExits,
  houseRoom,
  houseWitnessEvidence,
  newHouseProgress,
  type HouseCombatOrigin,
} from '~/utils/memoryDungeon/house'
import {
  houseEpilogue as earnedHouseEpilogue,
  houseEpilogueLens,
} from '~/utils/memoryDungeon/houseEpilogues'
import { briarQuestLog } from '~/utils/memoryDungeon/briarQuests'
import { earnedBriarRareEvents } from '~/utils/memoryDungeon/briarRareEvents'
import {
  memoryAchievementGallery,
  reconcileMemoryAchievements,
  restoreMemoryAchievements,
} from '~/utils/memoryDungeon/achievements'
import { briarLossContinuation } from '~/utils/memoryDungeon/lossContinuations'
import {
  BRIAR_REVEAL_WAVES,
  BRIAR_CROSS_MAP_PUZZLES,
  createBriarWaveCards,
  recoverBriarWaveTurn,
  settleBriarWavePair,
} from '~/utils/memoryDungeonWaves'
import {
  restoreMemoryCheckpoint,
  restoreMemorySaveSlots,
  writeMemorySaveSlot,
  type MemorySaveSlots,
} from '~/utils/memoryDungeon/saveSlots'

const STORAGE_KEY = 'memoryDungeonBriarCampV1'
const SAVE_SLOTS_KEY = 'memoryDungeonManualCheckpointsV1'
const DECK_KEY = 'memoryDungeonDeckChoiceV1'
const CARD_BACK_KEY = 'memoryDungeonCardBackV1'
const REALM_UNLOCKS_KEY = 'memoryDungeonRealmGalleryUnlocksV1'
const REALITY_KEY = 'memoryDungeonRealityV1'
const DARK_BRIAR_KEY = 'memoryDungeonDarkBriarV1'
const DARK_HOUSE_KEY = 'memoryDungeonDarkHouseV1'
const EARTH_CHRONICLE_KEY = 'memoryDungeonEarthChronicleV1'
const CROSS_MAP_SEALS_KEY = 'memoryDungeonCrossMapSealsV1'
const ACHIEVEMENTS_KEY = 'memoryDungeonAchievementsV1'

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
  const cardBack = ref<MemoryCardBackId>('briar')
  const unlockedRealms = ref<number[]>([])
  const realmArtReady = ref(false)
  const state = ref<BriarSave>(newBriarSave())
  const saveSlots = ref<MemorySaveSlots>(restoreMemorySaveSlots(null))
  const saveSlotMessage = ref('')
  const earnedAchievementIds = ref<string[]>([])
  const briarAchievements = computed(() =>
    memoryAchievementGallery(earnedAchievementIds.value),
  )
  const minefieldActive = ref(false)
  const minefieldHint = ref<{ cell: MineCell; type: 'safe' | 'hazard' } | null>(
    null,
  )
  const minefieldBoard = computed(() =>
    state.value.minefield ? playMinefieldRun(state.value.minefield) : null,
  )
  const earthChronicle = ref<EarthChronicle>(newEarthChronicle())
  const earthPhotos = computed(() => recoveredEarthPhotos(earthChronicle.value))
  const campaign = ref<MemoryCampaignProgress>(newMemoryCampaignProgress())
  const activeReality = ref<'e01' | 'e02'>('e01')
  const dark = ref<DarkBriarProgress>(newDarkBriarProgress())
  const crossMapSeals = ref<CrossMapSealChronicle>(newCrossMapSealChronicle())
  const darkHouse = ref<DarkHouseProgress>(newDarkHouseProgress())
  const darkDeckError = ref('')
  const darkLoading = ref(false)
  const darkTurnLocked = ref(false)
  const darkFirstCard = ref<string | null>(null)
  let darkEpoch = 0
  const darkHouseOpen = computed(() => darkHouse.value.active)
  const canEnterDarkHouseAtCamp = computed(() => canEnterDarkHouse(dark.value))
  const darkHouseRoom = computed(
    () => DARK_HOUSE_ROOMS[darkHouse.value.current] ?? null,
  )
  const darkHouseDoors = computed(() => darkHouseExits(darkHouse.value))
  const darkHouseTrial = computed(
    () => DARK_HOUSE_TRIALS[darkHouse.value.current] ?? null,
  )
  const darkHouseCards = computed(() =>
    darkHouseTrialFaces(darkHouse.value.current),
  )
  const darkHousePuzzle = computed(
    () => DARK_HOUSE_PUZZLES[darkHouse.value.current] ?? null,
  )
  const darkHouseReady = computed(() => darkHouseRoomResolved(darkHouse.value))
  const darkHouseTrialComplete = computed(() =>
    darkHouseTrialSolved(darkHouse.value, darkHouse.value.current),
  )
  const darkHouseEarnedClue = computed(() =>
    earnedDarkHousePuzzleClue(state.value, darkHouse.value.current),
  )
  const darkHouseEchoCount = computed(() => darkHouseEchoes(darkHouse.value))
  const darkHouseScarCount = computed(() => darkHouseStrain(darkHouse.value))
  const darkHouseEndingCopy = computed(() =>
    [
      darkHouseVerdict(darkHouse.value),
      crossRealmHouseEpilogue(state.value, darkHouse.value, dark.value),
    ]
      .filter(Boolean)
      .join(' '),
  )
  const canEnterDarkBriar = computed(() =>
    campaign.value.completed.includes('e01'),
  )
  const darkMatching = computed(() => dark.value.phase === 'matching')
  /** A Dark Briar bout is on the combat board (the stage yields to it). */
  const darkDuelActive = computed(
    () =>
      state.value.room === 'memory' &&
      darkBriarDuelForRoom(state.value.roomId) !== null,
  )
  const darkPairsMatched = computed(
    () => dark.value.mapCards.filter((card) => card.matched).length / 2,
  )
  const crossMapDiscovery = computed(() =>
    crossMapSealProgress(crossMapSeals.value),
  )
  const missingOriginalSeals = computed(() =>
    missingFirstMapSeals(crossMapSeals.value),
  )
  const darkSelectedSeal = computed(
    () => DARK_BRIAR_SEALS[dark.value.player] ?? null,
  )
  const firstTwoFrames = computed(() =>
    firstTwoWorldFrames(state.value, darkHouse.value),
  )
  const darkCallbacks = computed(() =>
    firstTwoSceneCallbacks(
      dark.value.player,
      state.value.sceneChoices,
      dark.value,
    ),
  )
  const darkPhysicalConsequence = computed(() =>
    firstTwoPhysicalConsequence(dark.value.player, firstTwoFrames.value),
  )
  const darkSelectedScene = computed(
    () => DARK_BRIAR_SCENES[dark.value.player] ?? null,
  )
  const darkCurrentText = computed(() => {
    const scene = darkSelectedScene.value
    if (!scene) return darkSelectedSeal.value?.opening ?? dark.value.status
    const chosen = scene.choices.find(
      (choice) => choice.id === dark.value.sceneChoices[dark.value.player],
    )
    const earned =
      dark.value.player === '2,4'
        ? earnedCourierBellOutcome(state.value, dark.value)
        : dark.value.player === '3,5'
          ? earnedBorrowedVoiceOutcome(state.value, dark.value)
          : dark.value.player === '4,4'
            ? earnedRoyalEscortOutcome(state.value, dark.value)
            : dark.value.player === '5,4'
              ? earnedKnightCrossingOutcome(state.value, dark.value)
              : dark.value.player === '3,2'
                ? earnedVesperRookeryOutcome(state.value, dark.value)
                : dark.value.player === '4,2'
                  ? earnedMosswickPromiseOutcome(state.value, dark.value)
                  : dark.value.player === '4,3'
                    ? earnedOrenManifestOutcome(state.value, dark.value)
                    : dark.value.player === '6,3'
                      ? earnedWitnessBellOutcome(state.value, dark.value)
                      : null
    return earned ?? chosen?.outcome ?? darkBriarOpening(scene, state.value)
  })
  const ready = ref(false)
  const loading = ref(false)
  const turnLocked = ref(false)
  const firstCard = ref<number | null>(null)
  const firstMapCard = ref<string | null>(null)
  const latestMapCardKey = ref<string | null>(null)
  const mapDeckError = ref('')
  const runeInput = ref<string[]>([])
  const inspectedSigil = ref<string | null>(null)
  /** Combat cells face up after the last action (by board index), until they turn back. */
  const combatShown = ref<number[]>([])
  /** The first Scout pick, shown face up while the second is chosen. */
  const combatPick = ref<number | null>(null)
  /** What the last combat action did, for the status line and live region. */
  const combatNote = ref('')
  let roomEpoch = 0

  const activeSiteKey = computed(
    () => inspectedSigil.value ?? state.value.player,
  )
  const selectedSite = computed(() => BRIAR_SITES[activeSiteKey.value] ?? null)
  const activeHouseRoom = computed(() =>
    houseRoom(state.value.house?.current ?? 'HD-01'),
  )
  const houseAvailableDoors = computed(() =>
    state.value.house
      ? houseExits(state.value.house.current, state.value.house)
      : [],
  )
  const briarQuests = computed(() =>
    briarQuestLog(state.value.sceneChoices, state.value.house?.decisions ?? {}),
  )
  const briarRareEvents = computed(() =>
    earnedBriarRareEvents(
      state.value.sceneChoices,
      state.value.house?.decisions ?? {},
    ),
  )
  function syncAchievements(): void {
    const next = reconcileMemoryAchievements(
      earnedAchievementIds.value,
      briarRareEvents.value,
    )
    if (next.length === earnedAchievementIds.value.length) return
    earnedAchievementIds.value = next
    if (!import.meta.client) return
    try {
      window.localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(next))
    } catch {
      // Cosmetic medals remain visible until storage is available.
    }
  }
  const houseEpilogue = computed(() =>
    earnedHouseEpilogue(state.value.house, state.value.sceneChoices),
  )
  const houseMayExit = computed(() =>
    Boolean(
      state.value.house &&
      HOUSE_EXIT_POINTS.includes(state.value.house.current),
    ),
  )
  function canChooseHouse(id: string): boolean {
    const house = state.value.house
    if (
      !house ||
      state.value.room !== 'house' ||
      house.decisions[house.current]
    )
      return false
    const room = HOUSE_ROOMS[house.current]
    if (!room?.choices.some((choice) => choice.id === id)) return false
    if (house.current === 'HD-32' && id === 'petition')
      return houseWitnessEvidence(house, state.value.sceneChoices)
    if (house.current === 'HD-36' && !house.ending) return false
    return true
  }
  const activeScene = computed(() =>
    state.value.room === 'map' &&
    state.value.wavePhase === 'exploring' &&
    (inspectedSigil.value !== null ||
      state.value.visited.includes(state.value.player))
      ? (BRIAR_SCENES[activeSiteKey.value] ?? null)
      : null,
  )
  const currentSceneText = computed(() => {
    const scene = activeScene.value
    if (!scene) return ''
    const chosenId = state.value.sceneChoices[activeSiteKey.value]
    return (
      scene.choices.find((option) => option.id === chosenId)?.outcome ??
      briarSceneOpening(scene, state.value.sceneChoices)
    )
  })
  const mapMatching = computed(
    () => state.value.room === 'map' && state.value.wavePhase === 'matching',
  )
  const currentDeckSignature = computed(() => JSON.stringify(deck.value))
  const deckNeedsRefresh = computed(
    () =>
      mapMatching.value &&
      state.value.mapCards.length > 0 &&
      state.value.mapDeckSignature !== currentDeckSignature.value,
  )
  const waveSize = computed(
    () => BRIAR_REVEAL_WAVES[state.value.waveIndex]?.length ?? 0,
  )
  const mapPairsMatched = computed(
    () => state.value.mapCards.filter((card) => card.matched).length / 2,
  )
  const waveComplete = computed(
    () =>
      state.value.mapCards.length > 0 &&
      state.value.mapCards.every((card) => card.matched),
  )
  function mapCardAt(key: string): BriarMapCard | undefined {
    return state.value.mapCards.find((card) => card.tile === key)
  }
  // A readable, enlarged card face belongs in the encounter panel while the
  // player is examining a picture, not squeezed into a 1/8-scale terrain tile.
  const activeMapCard = computed(() => {
    const key = latestMapCardKey.value
    if (!key || !mapMatching.value) return null
    const card = mapCardAt(key)
    return card && card.flipped && !card.matched ? card : null
  })

  const matureAvailable = computed(
    () =>
      userStore.isLoggedIn &&
      !userStore.isChild &&
      userStore.showMature === true,
  )

  async function checkRealmGalleryReady(): Promise<void> {
    if (!import.meta.client || !unlockedRealms.value.includes(1)) return
    const results = await Promise.all(
      WORLD_ONE_GALLERY.map(async (card) => {
        try {
          const response = await fetch(card.artPath, { method: 'HEAD' })
          return (
            response.ok &&
            (response.headers.get('content-type') ?? '').startsWith('image/')
          )
        } catch {
          return false
        }
      }),
    )
    realmArtReady.value = results.every(Boolean)
    if (!realmArtReady.value && deck.value.family === 'realm') {
      selectDeck({ family: 'designed' })
      state.value.status =
        'The painted realm gallery is incomplete. Enchanted Deck restored without changing your expedition.'
    }
  }

  function selectCardBack(selection: MemoryCardBackId): void {
    cardBack.value = normalizeMemoryCardBack(selection)
    if (!import.meta.client) return
    try {
      window.localStorage.setItem(CARD_BACK_KEY, cardBack.value)
    } catch {
      state.value.status =
        'Card-back choice is active for this visit; browser storage is unavailable.'
    }
  }

  function selectDeck(selection: Partial<DungeonDeckSelection>): void {
    if (
      selection.family === 'realm' &&
      (!unlockedRealms.value.includes(
        selection.realmId ?? deck.value.realmId,
      ) ||
        !realmArtReady.value)
    ) {
      state.value.status =
        'Finish a realm and collect its painted gallery before reusing that deck.'
      return
    }
    const previous = JSON.stringify(deck.value)
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
    if (previous !== currentDeckSignature.value && mapMatching.value) {
      void refreshMapDeck()
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

  function persistEarthChronicle(): void {
    if (!import.meta.client) return
    try {
      window.localStorage.setItem(
        EARTH_CHRONICLE_KEY,
        JSON.stringify(earthChronicle.value),
      )
    } catch {
      // Keep playable progress even in browsers without durable storage.
    }
  }

  function syncEarthChronicle(): void {
    const next = reconcileEarthChronicle(earthChronicle.value, {
      e01: state.value.sceneChoices,
      e02: dark.value.sceneChoices,
    })
    if (next === earthChronicle.value) return
    earthChronicle.value = next
    persistEarthChronicle()
  }

  function syncHoshimoriPhoto(
    choices: Readonly<Record<string, string>>,
  ): void {
    if (!campaign.value.completed.includes('e06')) return
    const next = reconcileHoshimoriEarthChronicle(earthChronicle.value, choices)
    if (next === earthChronicle.value) return
    earthChronicle.value = next
    persistEarthChronicle()
  }

  function answerEarthPhoto(id: string, response: PhotoResponse): void {
    const next = respondToEarthPhoto(earthChronicle.value, id, response)
    if (next === earthChronicle.value) return
    earthChronicle.value = next
    persistEarthChronicle()
  }

  function persistReality(): void {
    if (!import.meta.client) return
    try {
      window.localStorage.setItem(
        REALITY_KEY,
        JSON.stringify({
          version: 1,
          active: activeReality.value,
          progress: campaign.value,
        }),
      )
      window.localStorage.setItem(DARK_BRIAR_KEY, JSON.stringify(dark.value))
      window.localStorage.setItem(
        CROSS_MAP_SEALS_KEY,
        JSON.stringify(crossMapSeals.value),
      )
      window.localStorage.setItem(
        DARK_HOUSE_KEY,
        JSON.stringify(darkHouse.value),
      )
    } catch {
      dark.value.status =
        'The other Marches remain playable, but browser storage is unavailable.'
    }
  }

  function grantBriarCompletion(): void {
    if (campaign.value.completed.includes('e01')) return
    campaign.value = completeMemoryExperience(campaign.value, 'e01')
    persistReality()
  }

  function saveCheckpoint(index: number, overwrite = false): boolean {
    if (!import.meta.client) return false
    const snapshot = restoreMemoryCheckpoint(
      JSON.parse(
        JSON.stringify({
          version: 1,
          savedAt: new Date().toISOString(),
          briar: state.value,
          dark: dark.value,
          house: darkHouse.value,
          reality: {
            version: 1,
            active: activeReality.value,
            progress: campaign.value,
          },
          seals: crossMapSeals.value,
        }),
      ),
    )
    if (!snapshot) return false
    const next = writeMemorySaveSlot(
      saveSlots.value,
      index,
      snapshot,
      overwrite,
    )
    if (!next) {
      saveSlotMessage.value =
        'That checkpoint is occupied. Confirm before replacing it.'
      return false
    }
    try {
      window.localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(next))
      saveSlots.value = next
      saveSlotMessage.value = `Checkpoint ${index + 1} saved.`
      return true
    } catch {
      saveSlotMessage.value =
        'The checkpoint could not be stored in this browser.'
      return false
    }
  }

  function loadCheckpoint(index: number): boolean {
    if (!import.meta.client) return false
    const checkpoint = restoreMemoryCheckpoint(saveSlots.value[index])
    if (!checkpoint) {
      saveSlotMessage.value = 'That checkpoint is empty or damaged.'
      return false
    }
    const resumed = recoverBriarWaveTurn(
      restoreBriarSave(checkpoint.briar),
      checkpoint.briar,
    )
    const recoveredCombat = recoverBriarCombatDefeat(resumed.progress)
    const recoveredRoom = recoverBriarRoomMissPenalty(recoveredCombat)
    const resumedRoom = recoverBriarRoomFirstFlip(
      recoveredRoom,
      checkpoint.briar,
    )
    const reality = restoreMemoryRealitySave(checkpoint.reality)
    const resumedDark = recoverDarkBriarTurn(
      restoreDarkBriarProgress(checkpoint.dark),
      checkpoint.dark,
    )
    const restoredHouse = restoreDarkHouseProgress(checkpoint.house)
    const restoredSeals = restoreCrossMapSealChronicle(checkpoint.seals)

    roomEpoch++
    darkEpoch++
    loading.value = false
    darkLoading.value = false
    turnLocked.value = false
    darkTurnLocked.value = false
    firstCard.value = resumedRoom.firstCard
    darkFirstCard.value = resumedDark.firstTile
    firstMapCard.value = resumed.firstTile
    latestMapCardKey.value = resumed.firstTile
    mapDeckError.value = ''
    darkDeckError.value = ''
    runeInput.value = []
    inspectedSigil.value = null
    combatShown.value = []
    combatPick.value = null
    combatNote.value = ''
    minefieldActive.value = false
    minefieldHint.value = null

    state.value = resumedRoom.progress
    dark.value = resumedDark.progress
    darkHouse.value = restoredHouse
    crossMapSeals.value = restoredSeals
    for (const key of dark.value.sealInspections)
      crossMapSeals.value = inspectCrossMapSeal(crossMapSeals.value, key, 'e02')
    campaign.value = reality.progress
    activeReality.value = reality.active
    if (state.value.gateOpened) grantBriarCompletion()
    if (
      dark.value.completed &&
      campaign.value.completed.includes('e01') &&
      !campaign.value.completed.includes('e02')
    )
      campaign.value = completeMemoryExperience(campaign.value, 'e02')
    if (activeReality.value === 'e02' && !canEnterDarkBriar.value)
      activeReality.value = 'e01'

    persist()
    persistReality()
    syncEarthChronicle()
    saveSlotMessage.value = `Checkpoint ${index + 1} restored.`
    if (activeReality.value === 'e02' && !dark.value.mapCards.length)
      void prepareDarkDeck()
    else void syncActiveMapDeck()
    return true
  }

  function persist(): void {
    if (!import.meta.client) return
    syncAchievements()
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
    } catch {
      state.value.status =
        'Your progress is playable here, but browser storage is unavailable.'
    }
  }

  function hydrate(): void {
    if (ready.value) return
    let recoveredDarkTurn = false
    if (import.meta.client) {
      try {
        const saved = window.localStorage.getItem(ACHIEVEMENTS_KEY)
        earnedAchievementIds.value = restoreMemoryAchievements(
          saved ? JSON.parse(saved) : null,
        )
      } catch {
        earnedAchievementIds.value = []
      }
    }
    if (import.meta.client) {
      try {
        const rawSlots = window.localStorage.getItem(SAVE_SLOTS_KEY)
        saveSlots.value = restoreMemorySaveSlots(
          rawSlots ? JSON.parse(rawSlots) : null,
        )
      } catch {
        saveSlots.value = restoreMemorySaveSlots(null)
      }
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const raw = JSON.parse(saved) as unknown
          const resumed = recoverBriarWaveTurn(restoreBriarSave(raw), raw)
          const recoveredCombat = recoverBriarCombatDefeat(resumed.progress)
          const recoveredRoom = recoverBriarRoomMissPenalty(recoveredCombat)
          const resumedRoom = recoverBriarRoomFirstFlip(recoveredRoom, raw)
          state.value = resumedRoom.progress
          firstCard.value = resumedRoom.firstCard
          firstMapCard.value = resumed.firstTile
          latestMapCardKey.value = resumed.firstTile
          if (
            resumed.recovered ||
            recoveredRoom !== resumed.progress ||
            resumedRoom.recovered
          )
            persist()
        }
        const savedUnlocks = window.localStorage.getItem(REALM_UNLOCKS_KEY)
        const parsedUnlocks: unknown = savedUnlocks
          ? JSON.parse(savedUnlocks)
          : []
        unlockedRealms.value = Array.isArray(parsedUnlocks)
          ? parsedUnlocks.filter(
              (value): value is number =>
                typeof value === 'number' &&
                Number.isSafeInteger(value) &&
                value >= 1 &&
                value <= 16,
            )
          : []
        if (state.value.gateOpened && !unlockedRealms.value.includes(1)) {
          unlockedRealms.value.push(1)
          window.localStorage.setItem(
            REALM_UNLOCKS_KEY,
            JSON.stringify(unlockedRealms.value),
          )
        }
        cardBack.value = normalizeMemoryCardBack(
          window.localStorage.getItem(CARD_BACK_KEY),
        )
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
    if (import.meta.client) {
      try {
        const rawReality = window.localStorage.getItem(REALITY_KEY)
        const reality = restoreMemoryRealitySave(
          rawReality ? JSON.parse(rawReality) : null,
        )
        campaign.value = reality.progress
        activeReality.value = reality.active
      } catch {
        campaign.value = newMemoryCampaignProgress()
        activeReality.value = 'e01'
      }
      try {
        const rawDark = window.localStorage.getItem(DARK_BRIAR_KEY)
        const savedDark = rawDark ? JSON.parse(rawDark) : null
        const resumedDark = recoverDarkBriarTurn(
          restoreDarkBriarProgress(savedDark),
          savedDark,
        )
        dark.value = resumedDark.progress
        darkFirstCard.value = resumedDark.firstTile
        recoveredDarkTurn = resumedDark.recovered
      } catch {
        dark.value = newDarkBriarProgress()
      }
      try {
        const rawSeals = window.localStorage.getItem(CROSS_MAP_SEALS_KEY)
        crossMapSeals.value = restoreCrossMapSealChronicle(
          rawSeals ? JSON.parse(rawSeals) : null,
        )
        // Pre-60+4 Dark progress already inspected seals by visiting their
        // former ordinary scenes. Preserve discoveries while never minting a
        // future counterpart match.
        for (const key of dark.value.sealInspections) {
          crossMapSeals.value = inspectCrossMapSeal(
            crossMapSeals.value,
            key,
            'e02',
          )
        }
      } catch {
        crossMapSeals.value = newCrossMapSealChronicle()
      }
      try {
        const savedHouse = window.localStorage.getItem(DARK_HOUSE_KEY)
        darkHouse.value = restoreDarkHouseProgress(
          savedHouse ? JSON.parse(savedHouse) : null,
        )
      } catch {
        darkHouse.value = newDarkHouseProgress()
      }
      try {
        const recorded = window.localStorage.getItem(EARTH_CHRONICLE_KEY)
        earthChronicle.value = restoreEarthChronicle(
          recorded ? JSON.parse(recorded) : null,
        )
      } catch {
        earthChronicle.value = newEarthChronicle()
      }
      // Pre-Chronicle save compatibility: old scene choices already earned
      // the photograph, even when the journal did not exist yet.
      syncEarthChronicle()
      syncAchievements()
      if (state.value.gateOpened) grantBriarCompletion()
      if (
        dark.value.completed &&
        !campaign.value.completed.includes('e02') &&
        campaign.value.completed.includes('e01')
      ) {
        campaign.value = completeMemoryExperience(campaign.value, 'e02')
        persistReality()
      }
      if (activeReality.value === 'e02' && !canEnterDarkBriar.value) {
        activeReality.value = 'e01'
      }
    }
    if (recoveredDarkTurn) persistReality()
    ready.value = true
    if (import.meta.client) {
      void checkRealmGalleryReady()
      if (activeReality.value === 'e02' && !dark.value.mapCards.length)
        void prepareDarkDeck()
    }
  }

  /** A saved round can predate the source selector; resync it without losing matches. */
  async function syncActiveMapDeck(): Promise<void> {
    if (!mapMatching.value) return
    if (!state.value.mapCards.length) {
      await prepareWave()
    } else if (deckNeedsRefresh.value) {
      await refreshMapDeck()
    }
  }

  watch(matureAvailable, (allowed) => {
    if (allowed || !deck.value.includeMature) return
    selectDeck({ includeMature: false })
    if (state.value.room === 'memory') {
      leaveRoom(
        'Your mature-art preference changed. The gallery room closed without losing your map.',
      )
    }
  })

  function recordPrologueChoice(choice: BriarPrologueChoice): void {
    if (
      state.value.prologueChoice !== null ||
      state.value.revealed.length > 0 ||
      state.value.mapCards.length > 0 ||
      state.value.attempts > 0
    )
      return
    state.value.prologueChoice = choice
    if (choice === 'terms') {
      state.value.lanterns += 1
      state.value.status =
        'You demanded the terms of the exchange. You awaken holding a second lantern, though Morrow kept the answers.'
    } else {
      state.value.wildflowers += 1
      state.value.status =
        'You held fast to the memory of an ordinary morning. A single silver flower survives the crossing with you.'
    }
    persist()
  }

  function enterDarkHouse(): void {
    if (activeReality.value !== 'e02' || !canEnterDarkHouse(dark.value)) return
    darkHouse.value = {
      ...darkHouse.value,
      active: true,
      status:
        DARK_HOUSE_ROOMS[darkHouse.value.current]?.opening ??
        'The House listens.',
    }
    persistReality()
  }

  function leaveDarkHouse(): void {
    if (!darkHouse.value.active) return
    darkHouse.value.active = false
    persistReality()
  }

  function walkDarkHouse(id: string): void {
    if (activeReality.value !== 'e02' || !darkHouse.value.active) return
    const next = advanceDarkHouseRoom(
      darkHouse.value,
      id as DarkHouseProgress['current'],
    )
    if (next === darkHouse.value) return
    darkHouse.value = next
    persistReality()
  }

  function chooseDarkHouse(id: string): void {
    if (activeReality.value !== 'e02' || !darkHouse.value.active) return
    const next = makeDarkHouseChoice(darkHouse.value, id)
    if (next === darkHouse.value) return
    darkHouse.value = next
    persistReality()
  }

  function darkHouseFlipCard(id: string): void {
    if (activeReality.value !== 'e02') return
    const updated = flipDarkHouseCard(darkHouse.value, id)
    if (updated === darkHouse.value) return
    darkHouse.value = updated
    persistReality()
  }

  function darkHouseTurnCardsOver(): void {
    if (activeReality.value !== 'e02') return
    const updated = closeDarkHouseMismatch(darkHouse.value)
    if (updated === darkHouse.value) return
    darkHouse.value = updated
    persistReality()
  }

  function darkHouseUseRecall(): void {
    if (activeReality.value !== 'e02') return
    const updated = recallDarkHousePair(darkHouse.value)
    if (updated === darkHouse.value) return
    darkHouse.value = updated
    persistReality()
  }

  function darkHouseAnswer(id: string): void {
    if (activeReality.value !== 'e02') return
    const updated = answerDarkHousePuzzle(darkHouse.value, id)
    if (updated === darkHouse.value) return
    darkHouse.value = updated
    persistReality()
  }

  function darkHouseUseHint(): void {
    if (activeReality.value !== 'e02') return
    const updated = hintDarkHousePuzzle(
      darkHouse.value,
      darkHouseEarnedClue.value,
    )
    if (updated === darkHouse.value) return
    darkHouse.value = updated
    persistReality()
  }

  async function prepareDarkDeck(): Promise<void> {
    if (
      dark.value.phase !== 'matching' ||
      dark.value.mapCards.length > 0 ||
      darkLoading.value
    )
      return
    const ticket = ++darkEpoch
    darkLoading.value = true
    darkDeckError.value = ''
    try {
      const wave = DARK_BRIAR_WAVES[dark.value.waveIndex]!
      const expected = wave.length / 2
      const paths = await resolveMemoryDungeonDeck(
        deck.value,
        expected,
        dark.value.waveIndex * 8,
        dark.value.seenImages,
      )
      if (ticket !== darkEpoch) return
      if (paths.length !== expected || new Set(paths).size !== paths.length) {
        throw new Error(
          'The selected gallery does not have eight distinct matching pictures.',
        )
      }
      dark.value.mapCards = createBriarWaveCards(wave, paths)
      dark.value.seenImages = [...new Set([...dark.value.seenImages, ...paths])]
      dark.value.status =
        'Find the matching pictures. Every pair reveals two familiar, changed landmarks.'
      persistReality()
    } catch (error) {
      if (ticket === darkEpoch) {
        darkDeckError.value =
          error instanceof Error
            ? error.message
            : 'The mirrored pictures did not load.'
      }
    } finally {
      if (ticket === darkEpoch) darkLoading.value = false
    }
  }

  async function enterDarkBriar(): Promise<void> {
    if (!canEnterDarkBriar.value || loading.value || darkTurnLocked.value)
      return
    activeReality.value = 'e02'
    persistReality()
    if (darkMatching.value && !dark.value.mapCards.length)
      await prepareDarkDeck()
  }

  async function nextDarkWave(): Promise<void> {
    if (
      activeReality.value !== 'e02' ||
      darkLoading.value ||
      darkTurnLocked.value
    )
      return
    const next = advanceDarkBriarWave(dark.value)
    if (next === dark.value) return
    darkEpoch++
    darkFirstCard.value = null
    darkDeckError.value = ''
    dark.value = next
    persistReality()
    await prepareDarkDeck()
  }

  function returnToBriar(): void {
    darkEpoch++
    dark.value = settleDarkBriarReturn(dark.value)
    darkHouse.value.active = false
    darkTurnLocked.value = false
    darkFirstCard.value = null
    darkLoading.value = false
    activeReality.value = 'e01'
    persistReality()
  }

  function darkPickCard(tile: string): void {
    if (
      activeReality.value !== 'e02' ||
      !darkMatching.value ||
      darkLoading.value ||
      darkTurnLocked.value ||
      darkDeckError.value
    )
      return
    const card = dark.value.mapCards.find((item) => item.tile === tile)
    if (!card || card.matched || card.flipped) return
    card.flipped = true
    if (darkFirstCard.value === null) {
      darkFirstCard.value = tile
      persistReality()
      return
    }
    const first = dark.value.mapCards.find(
      (item) => item.tile === darkFirstCard.value,
    )
    darkFirstCard.value = null
    if (!first || first.tile === card.tile) return
    dark.value.attempts++
    darkTurnLocked.value = true
    const ticket = darkEpoch
    if (first.pairId === card.pairId && first.image === card.image) {
      dark.value.status = 'Two altered memories agree. The reflection sharpens.'
      window.setTimeout(() => {
        if (ticket !== darkEpoch) return
        first.matched = true
        card.matched = true
        for (const key of [first.tile, card.tile]) {
          if (!dark.value.revealed.includes(key)) dark.value.revealed.push(key)
        }
        if (dark.value.mapCards.every((item) => item.matched)) {
          dark.value.phase = 'exploring'
          if (!dark.value.visited.includes(BRIAR_START))
            dark.value.visited.push(BRIAR_START)
          dark.value.status =
            dark.value.waveIndex === DARK_BRIAR_WAVES.length - 1
              ? 'Every reflected road has emerged. The House will hear all eight witnesses.'
              : 'Another ring of Briar is revealed. The forest keeps its earlier decisions.'
        }
        darkTurnLocked.value = false
        persistReality()
      }, 680)
    } else {
      dark.value.status =
        'Not the same memory. Watch which pair of pictures truly belongs together.'
      window.setTimeout(() => {
        if (ticket !== darkEpoch) return
        first.flipped = false
        card.flipped = false
        darkTurnLocked.value = false
        persistReality()
      }, 1150)
    }
    persistReality()
  }

  function darkWalk(key: string): void {
    if (
      activeReality.value !== 'e02' ||
      darkMatching.value ||
      !darkBriarCanTravel(
        dark.value.player,
        key,
        dark.value.revealed,
        dark.value,
      )
    )
      return
    dark.value.player = key
    if (!dark.value.visited.includes(key)) dark.value.visited.push(key)
    dark.value.status =
      DARK_BRIAR_SCENES[key]?.opening ??
      DARK_BRIAR_SEALS[key]?.opening ??
      'The dark road waits.'
    persistReality()
  }

  function darkInspectSeal(key: string): void {
    if (activeReality.value !== 'e02') return
    const updated = darkBriarInspectSeal(dark.value, key)
    if (updated === dark.value) return
    dark.value = updated
    crossMapSeals.value = inspectCrossMapSeal(crossMapSeals.value, key, 'e02')
    persistReality()
  }

  function darkChooseScene(id: string): void {
    if (activeReality.value !== 'e02' || darkMatching.value) return
    const key = dark.value.player
    const next = darkBriarChoose(dark.value, key, id)
    if (next === dark.value) return
    dark.value = next
    if (
      key === '2,4' ||
      key === '3,5' ||
      key === '4,4' ||
      key === '4,3' ||
      key === '4,2' ||
      key === '5,4' ||
      key === '3,2' ||
      key === '6,3'
    ) {
      const earned =
        key === '2,4'
          ? earnedCourierBellOutcome(state.value, next)
          : key === '3,5'
            ? earnedBorrowedVoiceOutcome(state.value, next)
            : key === '4,4'
              ? earnedRoyalEscortOutcome(state.value, next)
              : key === '4,3'
                ? earnedOrenManifestOutcome(state.value, next)
                : key === '5,4'
                  ? earnedKnightCrossingOutcome(state.value, next)
                  : key === '4,2'
                    ? earnedMosswickPromiseOutcome(state.value, next)
                    : key === '6,3'
                      ? earnedWitnessBellOutcome(state.value, next)
                      : earnedVesperRookeryOutcome(state.value, next)
      if (earned) dark.value.status = earned
    }
    if (key === '3,4') {
      const compensation = earnedCourierCompensation(state.value, id)
      if (compensation === 'lantern') {
        state.value.lanterns += 1
        persist()
      } else if (compensation === 'wildflower') {
        state.value.wildflowers += 1
        persist()
      }
    }
    syncEarthChronicle()
    if (next.completed && !campaign.value.completed.includes('e02')) {
      campaign.value = completeMemoryExperience(campaign.value, 'e02')
    }
    persistReality()
  }

  /** Begin the optional bout at the Dark Briar tile the traveller stands on. */
  async function startDarkDuel(): Promise<void> {
    if (activeReality.value !== 'e02' || darkMatching.value || loading.value)
      return
    const key = dark.value.player
    const duel = DARK_BRIAR_DUELS[key]
    if (!duel || !darkBriarCanDuel(dark.value, key)) return
    if (
      state.value.room === 'memory' ||
      state.value.combat ||
      minefieldActive.value
    ) {
      dark.value.status =
        'Another challenge is still waiting in the Briar Marches. Finish or leave it first.'
      persistReality()
      return
    }
    dark.value.duelReturn = state.value.room === 'house' ? 'house' : 'map'
    persistReality()
    await beginRoom(duel.room)
    if (!darkDuelActive.value) {
      dark.value.duelReturn = null
      dark.value.status = state.value.status
      persistReality()
    }
  }

  /** End a Dark Briar bout and put the Briar save back where it was. */
  function closeDarkDuel(message: string): void {
    roomEpoch++
    state.value.room = dark.value.duelReturn ?? 'map'
    state.value.roomId = null
    state.value.cards = []
    state.value.combat = null
    state.value.roomMisses = 0
    state.value.status = message
    dark.value.duelReturn = null
    dark.value.status = message
    combatShown.value = []
    combatPick.value = null
    combatNote.value = ''
    firstCard.value = null
    turnLocked.value = false
    loading.value = false
    persist()
    persistReality()
  }

  function finishDarkDuel(duel: DarkBriarDuel): void {
    const awarded = grantMemoryRewardOnce(
      dark.value.duels,
      duel.key,
      state.value,
      {
        lanterns: 1,
      },
    )
    closeDarkDuel(
      awarded
        ? duel.victory
        : 'The bout is already recorded. Its lantern cannot be claimed twice.',
    )
  }

  function reset(): void {
    roomEpoch++
    turnLocked.value = false
    firstCard.value = null
    firstMapCard.value = null
    latestMapCardKey.value = null
    mapDeckError.value = ''
    runeInput.value = []
    inspectedSigil.value = null
    state.value = newBriarSave()
    minefieldActive.value = false
    minefieldHint.value = null
    persist()
    void prepareWave()
  }

  async function prepareWave(): Promise<void> {
    if (
      state.value.room !== 'map' ||
      state.value.wavePhase !== 'matching' ||
      state.value.mapCards.length ||
      loading.value
    )
      return
    const keys = (BRIAR_REVEAL_WAVES[state.value.waveIndex] ?? []).filter(
      (key) => !state.value.revealed.includes(key),
    )
    if (!keys.length) {
      state.value.wavePhase = 'exploring'
      persist()
      return
    }
    loading.value = true
    const ticket = ++roomEpoch
    try {
      const usedPrior = BRIAR_REVEAL_WAVES.slice(
        0,
        state.value.waveIndex,
      ).reduce((total, wave) => total + wave.length / 2, 0)
      const paths = await resolveMemoryDungeonDeck(
        deck.value,
        keys.length / 2,
        usedPrior,
        state.value.seenMapImages,
      )
      if (ticket !== roomEpoch) return
      if (new Set(paths).size !== keys.length / 2) {
        throw new Error(
          'This deck does not have enough unique matching images for the current round.',
        )
      }
      const cards = createBriarWaveCards(keys, paths)
      state.value.mapCards = cards
      state.value.mapDeckSignature = currentDeckSignature.value
      mapDeckError.value = ''
      state.value.seenMapImages = [
        ...new Set([...state.value.seenMapImages, ...paths]),
      ]
      state.value.status = `Round ${state.value.waveIndex + 1}: match ${paths.length} image pairs to uncover ${keys.length} map squares.`
      persist()
    } catch (error) {
      if (ticket === roomEpoch) {
        state.value.status =
          error instanceof Error
            ? error.message
            : 'Images could not load. Choose another deck and retry.'
        mapDeckError.value = state.value.status
      }
    } finally {
      if (ticket === roomEpoch) loading.value = false
    }
  }

  /** Reface only unmatched pairs when the source changes, without discarding
   * earned terrain, attempts or run-wide no-repeat history. */
  async function refreshMapDeck(): Promise<void> {
    if (!mapMatching.value) return
    const ticket = ++roomEpoch
    firstMapCard.value = null
    turnLocked.value = false
    mapDeckError.value = ''
    for (const card of state.value.mapCards) {
      if (!card.matched) card.flipped = false
    }
    if (!state.value.mapCards.length) {
      loading.value = false
      await prepareWave()
      return
    }
    loading.value = true
    const pairs = [
      ...new Set(
        state.value.mapCards
          .filter((card) => !card.matched)
          .map((card) => card.pairId),
      ),
    ]
    const usedPrior = BRIAR_REVEAL_WAVES.slice(0, state.value.waveIndex).reduce(
      (total, wave) => total + wave.length / 2,
      0,
    )
    try {
      const paths = await resolveMemoryDungeonDeck(
        deck.value,
        pairs.length,
        usedPrior,
        state.value.seenMapImages,
      )
      if (ticket !== roomEpoch) return
      if (paths.length !== pairs.length)
        throw new Error(
          'The selected deck cannot fill the remaining card pairs.',
        )
      pairs.forEach((pairId, index) => {
        const replacement = paths[index]!
        state.value.mapCards
          .filter((card) => card.pairId === pairId)
          .forEach((card) => {
            card.image = replacement
            card.flipped = false
          })
      })
      state.value.seenMapImages = [
        ...new Set([...state.value.seenMapImages, ...paths]),
      ]
      state.value.mapDeckSignature = currentDeckSignature.value
      state.value.status = `Gallery applied to ${pairs.length} remaining pairs. Your matches, map and attempt count are preserved.`
      persist()
    } catch (error) {
      if (ticket === roomEpoch) {
        mapDeckError.value =
          error instanceof Error
            ? error.message
            : 'Could not load this collection.'
        state.value.status = `Image source not applied: ${mapDeckError.value}`
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
    if (
      !mapMatching.value ||
      loading.value ||
      turnLocked.value ||
      deckNeedsRefresh.value ||
      mapDeckError.value
    )
      return
    const card = mapCardAt(key)
    if (!card || card.matched || card.flipped) return
    latestMapCardKey.value = key
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
    if (first.pairId === card.pairId && first.image === card.image) {
      // Allow the same 550ms Y-axis animation used in Classic to finish
      // before replacing the successful pair with visible map terrain.
      state.value.status = 'A match! The fog is lifting…'
      persist()
      window.setTimeout(() => {
        if (epoch !== roomEpoch) return
        const settled = settleBriarWavePair(state.value, first.tile, card.tile)
        if (!settled) {
          turnLocked.value = false
          return
        }
        state.value = settled
        state.value.status =
          'A remembered pair! Two pieces of Briar Camp have emerged.'
        if (state.value.wavePhase === 'exploring') {
          state.value.status =
            state.value.waveIndex === 3
              ? 'All four reveal rounds are complete. Explore the map; four paired sigils await future regions.'
              : 'Round complete! Explore the revealed landscape, then begin the next matching round.'
        }
        turnLocked.value = false
        persist()
      }, 680)
    } else {
      state.value.status =
        'Not a match. Remember both images before they turn over.'
      persist()
      window.setTimeout(() => {
        if (epoch !== roomEpoch) return
        first.flipped = false
        card.flipped = false
        turnLocked.value = false
        persist()
      }, 1350)
    }
  }

  async function nextWave(): Promise<void> {
    if (
      state.value.room !== 'map' ||
      state.value.wavePhase !== 'exploring' ||
      state.value.waveIndex >= BRIAR_REVEAL_WAVES.length - 1
    )
      return
    inspectedSigil.value = null
    state.value.waveIndex++
    state.value.wavePhase = 'matching'
    state.value.mapCards = []
    state.value.mapDeckSignature = ''
    mapDeckError.value = ''
    firstMapCard.value = null
    state.value.status =
      'A fresh group of fog-bound memory cards stirs across the forest.'
    persist()
    await prepareWave()
  }

  function walk(key: string): void {
    if (state.value.room !== 'map' || state.value.wavePhase !== 'exploring')
      return
    if (!briarConnected(state.value.player, key, state.value.revealed)) return
    inspectedSigil.value = null
    state.value.player = key
    if (!state.value.visited.includes(key)) state.value.visited.push(key)
    const scene = BRIAR_SCENES[key]
    state.value.status =
      scene && !state.value.sceneChoices[key]
        ? briarSceneOpening(scene, state.value.sceneChoices)
        : (BRIAR_SITES[key]?.description ?? 'You retrace a familiar path.')
    persist()
  }

  function chooseScene(id: string): void {
    const key = activeSiteKey.value
    const scene = BRIAR_SCENES[key]
    const isInspectedSeal =
      inspectedSigil.value === key &&
      state.value.waveIndex === 3 &&
      key in BRIAR_CROSS_MAP_PUZZLES
    if (
      state.value.room !== 'map' ||
      state.value.wavePhase !== 'exploring' ||
      (!isInspectedSeal && !state.value.visited.includes(key)) ||
      state.value.sceneChoices[key] ||
      !scene
    )
      return
    const choice = scene.choices.find((option) => option.id === id)
    if (!choice || !canChooseBriarScene(choice, state.value)) return
    state.value.wildflowers -= choice.cost?.wildflowers ?? 0
    state.value.lanterns -= choice.cost?.lanterns ?? 0
    state.value.wildflowers += choice.gain?.wildflowers ?? 0
    state.value.lanterns += choice.gain?.lanterns ?? 0
    state.value.sceneChoices[key] = choice.id
    syncEarthChronicle()
    if (
      choice.settleDuel &&
      BRIAR_SITES[key]?.kind === 'enemy' &&
      !state.value.completedEncounters.includes(key)
    )
      state.value.completedEncounters.push(key)
    state.value.status = choice.outcome
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

  /** Rare logic chamber at the Three Quiet Stones. The core map keeps its IDs. */
  function openMinefield(size: MinefieldSize): void {
    if (
      activeReality.value !== 'e01' ||
      state.value.room !== 'map' ||
      state.value.wavePhase !== 'exploring' ||
      state.value.player !== MINEFIELD_SITE ||
      !state.value.puzzleSolved ||
      (size === 10 && state.value.waveIndex < 2)
    )
      return
    const previous = state.value.minefield
    if (
      !previous ||
      previous.size !== size ||
      minefieldRunExhausted(previous) ||
      playMinefieldRun(previous).outcome !== 'exploring'
    ) {
      const round = Math.min(999, state.value.minefieldRound + 1)
      state.value.minefieldRound = round
      state.value.minefield = createMinefieldRun(
        73013 + round * 67 + state.value.waveIndex * 997,
        size,
      )
    }
    minefieldHint.value = null
    minefieldActive.value = true
    persist()
  }

  /** Even a 600-move flag-toggling explorer can restart without a dead save. */
  function retryExhaustedMinefield(): void {
    const run = state.value.minefield
    if (!minefieldActive.value || !run || !minefieldRunExhausted(run)) return
    minefieldActive.value = false
    openMinefield(run.size)
  }

  function minefieldMove(move: MinefieldMove): void {
    if (!minefieldActive.value || !state.value.minefield) return
    const previous = state.value.minefield
    const next = advanceMinefieldRun(previous, move)
    if (next === previous) return
    state.value.minefield = next
    minefieldHint.value = null
    const board = minefieldBoard.value
    if (board?.outcome === 'escaped') {
      const rewardKey = minefieldRewardKey(next.size)
      if (
        grantMemoryRewardOnce(
          state.value.completedEncounters,
          rewardKey,
          state.value,
          {
            lanterns: 1,
            wildflowers: next.size === 10 ? 2 : 1,
          },
        )
      ) {
        state.value.status =
          'The archive door yields. You earn a lantern and flowers; the finding is remembered.'
      } else {
        state.value.status =
          'The archive opens again, but a remembered treasure cannot be collected twice.'
      }
    } else if (board?.outcome === 'defeated') {
      state.value.status =
        'The thorns return you to the entrance. Your discoveries remain; the chamber can be retried.'
    }
    persist()
  }

  /** A lantern lights one logically proven cell, never a secret hazard. */
  function requestMinefieldHint(): void {
    if (
      !minefieldActive.value ||
      !minefieldBoard.value ||
      minefieldBoard.value.outcome !== 'exploring' ||
      // Repeated hint taps before the next move must not charge twice
      // for the same proven square.
      minefieldHint.value !== null ||
      state.value.lanterns < 1
    )
      return
    const known = provenCells(minefieldBoard.value)
    const safe = known.safe[0]
    const hazard = known.hazards[0]
    if (!safe && !hazard) return
    state.value.lanterns--
    minefieldHint.value = safe
      ? { cell: safe, type: 'safe' }
      : { cell: hazard!, type: 'hazard' }
    state.value.status = `Lantern deduction: ${coordinate(minefieldHint.value.cell)} is ${minefieldHint.value.type}.`
    persist()
  }

  function closeMinefield(): void {
    minefieldActive.value = false
    minefieldHint.value = null
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
    if (
      state.value.room !== 'map' ||
      state.value.wavePhase !== 'exploring' ||
      loading.value
    )
      return
    const position = state.value.player
    if (kind === 'dungeon' && position !== BRIAR_DUNGEON) return
    if (kind === 'sprite' && position !== '5,5') return
    if (kind === 'patrol' && position !== '7,3') return
    if (
      kind !== 'dungeon' &&
      state.value.completedEncounters.includes(position)
    )
      return
    if (kind === 'dungeon') {
      state.value.house ??= newHouseProgress()
      state.value.room = 'house'
      state.value.roomId = null
      state.value.combat = null
      state.value.cards = []
      state.value.status =
        HOUSE_ROOMS[state.value.house.current]?.opening ?? 'The House opens.'
      persist()
      return
    }
    await beginRoom(kind)
  }

  function houseMove(next: string): void {
    const house = state.value.house
    if (!house || state.value.room !== 'house' || loading.value) return
    if (!houseAvailableDoors.value.includes(next as typeof house.current))
      return
    house.current = next as typeof house.current
    if (!house.visited.includes(house.current))
      house.visited.push(house.current)
    state.value.status =
      HOUSE_ROOMS[house.current]?.opening ?? 'The house shifts.'
    persist()
  }

  async function chooseHouse(id: string): Promise<void> {
    const house = state.value.house
    if (!house || !canChooseHouse(id)) return
    const choice = HOUSE_ROOMS[house.current]?.choices.find(
      (item) => item.id === id,
    )
    if (!choice) return
    if (
      (house.current === 'HD-32' && id === 'fight') ||
      (house.current === 'HD-19' && id === 'match') ||
      (isHouseDuelOrigin(house.current) && id === 'duel')
    ) {
      house.combatOrigin = house.current as HouseCombatOrigin
      persist()
      const combatRoom =
        house.current === 'HD-32'
          ? 'vault-2'
          : house.current === 'HD-19'
            ? 'vault-1'
            : HOUSE_DUEL_ROOMS[house.current as HouseDuelOrigin]
      await beginRoom(combatRoom)
      if (state.value.room !== 'memory') {
        house.combatOrigin = null
        persist()
      }
      return
    }

    house.decisions[house.current] = id
    if (choice.gain?.lanterns) state.value.lanterns += choice.gain.lanterns
    if (choice.gain?.wildflowers)
      state.value.wildflowers += choice.gain.wildflowers
    if (choice.gain?.hearts)
      state.value.hearts = Math.min(3, state.value.hearts + choice.gain.hearts)
    if (house.current === 'HD-32' && id === 'petition')
      house.wardenPassed = true
    if (
      house.current === 'HD-35' &&
      (id === 'release' || id === 'renew' || id === 'break')
    ) {
      house.ending = id
      house.endingLens = houseEpilogueLens(house, state.value.sceneChoices)
    }
    if (house.current === 'HD-36') {
      house.chimeClaimed = true
      if (!state.value.relics.includes('bramble-chime'))
        state.value.relics.push('bramble-chime')
      state.value.room = 'map'
      state.value.status = `${choice.outcome} The Bramble Chime now opens the next realm's gate.`
      persist()
      return
    }
    state.value.status = choice.outcome
    persist()
  }

  function exitHouse(): void {
    const house = state.value.house
    if (!house || state.value.room !== 'house' || !houseMayExit.value) return
    state.value.room = 'map'
    state.value.roomId = null
    state.value.status =
      'You take a safe return route to Briar Marches. The House remembers every room and decision.'
    persist()
  }

  function finishHouseCombat(origin: HouseCombatOrigin): void {
    const house = state.value.house
    if (!house) return
    house.decisions[origin] =
      origin === 'HD-32' ? 'fight' : origin === 'HD-19' ? 'match' : 'duel'
    if (origin === 'HD-32') house.wardenPassed = true
    house.combatOrigin = null
    state.value.room = 'house'
    state.value.roomId = null
    state.value.combat = null
    state.value.cards = []
    state.value.roomMisses = 0
    firstCard.value = null
    turnLocked.value = false
    combatShown.value = []
    combatPick.value = null
    combatNote.value = ''
    state.value.status =
      origin === 'HD-32'
        ? "The Warden yields to remembered pairs, not to ownership of anyone else's past."
        : origin === 'HD-19'
          ? 'The Echo Chamber accepts your matched memories and opens the mirrored passage.'
          : 'You resolved a fair House duel by remembering pairs. Your progress and its outcome are recorded.'
    persist()
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
            leaveRoom(briarLossContinuation(state.value, 'chamber', true), true)
            if (state.value.room === 'map') state.value.player = BRIAR_START
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
          if (darkBriarDuelForRoom(state.value.roomId)) {
            const rested = state.value.hearts <= 0
            if (rested) state.value.hearts = 3
            closeDarkDuel(
              rested
                ? `${next.enemy.name} wins this bout. You rest by the road until your strength returns; the challenger waits for a rematch.`
                : `${next.enemy.name} wins this bout. One heart lost; the challenger waits for a rematch.`,
            )
          } else if (state.value.hearts <= 0) {
            leaveRoom(
              briarLossContinuation(
                state.value,
                'combat',
                true,
                next.enemy.name,
              ),
              true,
            )
            if (state.value.room === 'map') state.value.player = BRIAR_START
            state.value.hearts = 3
          } else {
            leaveRoom(
              briarLossContinuation(
                state.value,
                'combat',
                false,
                next.enemy.name,
              ),
              true,
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
    const darkDuel = darkBriarDuelForRoom(room)
    if (darkDuel) {
      finishDarkDuel(darkDuel)
      return
    }
    const houseOrigin = state.value.house?.combatOrigin
    if (
      houseOrigin &&
      ((houseOrigin === 'HD-19' && room === 'vault-1') ||
        (houseOrigin === 'HD-32' && room === 'vault-2') ||
        (isHouseDuelOrigin(houseOrigin) &&
          (room === HOUSE_DUEL_ROOMS[houseOrigin] ||
            room === 'sprite' ||
            room === 'patrol')))
    ) {
      finishHouseCombat(houseOrigin)
      return
    }
    if (room === 'vault-1') {
      if (state.value.house?.combatOrigin === 'HD-19') {
        finishHouseCombat('HD-19')
        return
      }
      await beginRoom('vault-2')
      return
    }
    if (room === 'vault-2') {
      if (state.value.house?.combatOrigin === 'HD-32') {
        finishHouseCombat('HD-32')
        return
      }
      if (!state.value.relics.includes('bramble-chime'))
        state.value.relics.push('bramble-chime')
      leaveRoom(
        'You earned the Bramble Chime! Return to the eastern thorn gate to open the path toward Bloom Orchard.',
      )
      return
    }
    if (room === 'sprite' || room === 'patrol') {
      const key = room === 'sprite' ? '5,5' : '7,3'
      const awarded = grantMemoryRewardOnce(
        state.value.completedEncounters,
        key,
        state.value,
        { wildflowers: 1 },
      )
      leaveRoom(
        awarded
          ? 'The forest challenger bows and gives you a wildflower.'
          : 'The forest challenger bows again. The first victory already claimed its flower.',
      )
      return
    }
    if (room) leaveRoom()
  }

  function leaveRoom(
    message = 'You step out of the challenge and return to the same place on the map.',
    contextualRetreat = false,
  ): void {
    if (darkBriarDuelForRoom(state.value.roomId)) {
      closeDarkDuel(
        'You step back from the bout. The challenger waits for a rematch.',
      )
      return
    }
    roomEpoch++
    const houseOrigin = state.value.house?.combatOrigin
    if (houseOrigin && state.value.house) {
      state.value.house.combatOrigin = null
      state.value.house.current = 'HD-18'
      if (!state.value.house.visited.includes('HD-18'))
        state.value.house.visited.push('HD-18')
      state.value.room = 'house'
      if (!contextualRetreat)
        message = `${message} You recover in the House's quiet bedchamber without losing your discoveries.`
    } else {
      state.value.room = 'map'
    }
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
    if (
      state.value.room !== 'map' ||
      state.value.wavePhase !== 'exploring' ||
      state.value.waveIndex !== 3
    )
      return
    const sigil =
      BRIAR_CROSS_MAP_PUZZLES[key as keyof typeof BRIAR_CROSS_MAP_PUZZLES]
    if (!sigil) return
    inspectedSigil.value = key
    crossMapSeals.value = inspectCrossMapSeal(crossMapSeals.value, key, 'e01')
    persistReality()
    state.value.status = `${sigil.title}: ${sigil.hint} Its true match awaits in ${sigil.counterpart}.`
    persist()
  }

  function openGate(): void {
    if (state.value.player !== BRIAR_GATE || !hasChime.value) return
    state.value.gateOpened = true
    grantBriarCompletion()
    if (!unlockedRealms.value.includes(1)) unlockedRealms.value.push(1)
    if (import.meta.client) {
      try {
        window.localStorage.setItem(
          REALM_UNLOCKS_KEY,
          JSON.stringify(unlockedRealms.value),
        )
      } catch {
        state.value.status =
          'Realm gallery unlock is active but could not be saved.'
      }
    }
    void checkRealmGalleryReady()
    state.value.status =
      'The Bramble Chime parts the thorns. Your own forest appears beyond them, but its memories have changed. Follow the reflection.'
    persist()
  }

  return {
    state,
    saveSlots,
    saveSlotMessage,
    saveCheckpoint,
    loadCheckpoint,
    campaign,
    earthChronicle,
    earthPhotos,
    answerEarthPhoto,
    syncHoshimoriPhoto,
    activeReality,
    dark,
    darkHouse,
    darkHouseOpen,
    canEnterDarkHouseAtCamp,
    darkHouseRoom,
    darkHouseDoors,
    darkHouseTrial,
    darkHouseCards,
    darkHousePuzzle,
    darkHouseReady,
    darkHouseTrialComplete,
    darkHouseEchoCount,
    darkHouseEarnedClue,
    darkHouseScarCount,
    darkHouseEndingCopy,
    darkHouseFlipCard,
    darkHouseTurnCardsOver,
    darkHouseUseRecall,
    darkHouseAnswer,
    darkHouseUseHint,
    enterDarkHouse,
    leaveDarkHouse,
    walkDarkHouse,
    chooseDarkHouse,
    darkDeckError,
    darkLoading,
    darkTurnLocked,
    darkMatching,
    darkPairsMatched,
    darkSelectedScene,
    darkSelectedSeal,
    firstTwoFrames,
    darkCallbacks,
    darkPhysicalConsequence,
    crossMapSeals,
    crossMapDiscovery,
    missingOriginalSeals,
    darkInspectSeal,
    darkCurrentText,
    canEnterDarkBriar,
    prepareDarkDeck,
    enterDarkBriar,
    nextDarkWave,
    returnToBriar,
    darkPickCard,
    darkWalk,
    darkChooseScene,
    startDarkDuel,
    darkDuelActive,
    deck,
    cardBack,
    selectCardBack,
    unlockedRealms,
    realmArtReady,
    checkRealmGalleryReady,
    matureAvailable,
    selectDeck,
    ready,
    loading,
    turnLocked,
    runeInput,
    minefieldActive,
    minefieldBoard,
    minefieldHint,
    openMinefield,
    minefieldMove,
    retryExhaustedMinefield,
    requestMinefieldHint,
    closeMinefield,
    combatShown,
    combatPick,
    combatNote,
    selectedSite,
    activeHouseRoom,
    houseAvailableDoors,
    houseMayExit,
    houseEpilogue,
    briarQuests,
    briarRareEvents,
    briarAchievements,
    canChooseHouse,
    houseMove,
    chooseHouse,
    exitHouse,
    activeSiteKey,
    inspectedSigil,
    activeScene,
    currentSceneText,
    mapMatching,
    mapPairsMatched,
    activeMapCard,
    waveSize,
    waveComplete,
    mapCardAt,
    mapDeckError,
    deckNeedsRefresh,
    syncActiveMapDeck,
    refreshMapDeck,
    examineCrossMapSigil,
    prepareWave,
    nextWave,
    pickMapCard,
    hasChime,
    roomComplete,
    matchedPairs,
    hydrate,
    reset,
    recordPrologueChoice,
    reveal,
    walk,
    chooseScene,
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
