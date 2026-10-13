import { defineStore } from 'pinia'
import { journeyCharacterSheet } from '~/utils/shiftingLands/progression'
import {
  migrateJourneyLedger,
  restoreJourneyLedger,
  stepJourneyLedger,
  type JourneyLedgerAction,
  type JourneyLedger,
} from '~/utils/shiftingLands/saveLedger'
import {
  activeFiveLandEncounter,
  findFiveLandCard,
} from '~/utils/shiftingLands/authoredFiveLands'
import {
  encounterArt,
  landScenery,
  locationArt,
  outcomeArt,
  trialArt,
} from '~/utils/shiftingLands/sceneArt'
import {
  trialForLand,
  canChooseTrial,
  type TrialResult,
} from '~/utils/shiftingLands/authoredBosses'
import {
  newJourneyLedgerV5,
  restoreJourneyLedgerV5,
  stepJourneyLedgerV5,
  type JourneyActionV5,
  type JourneyLedgerV5,
} from '~/utils/shiftingLands/saveLedgerV5'
import {
  restoreJourneyLedgerV4,
  stepJourneyLedgerV4,
  type JourneyLedgerV4,
} from '~/utils/shiftingLands/saveLedgerV4'
import { computed, ref } from 'vue'
import {
  JOURNEY_WORLD,
  reachableLocations,
  type BossApproach,
  type EncounterApproach,
} from '~/utils/shiftingLands/journey'
import {
  activeAuthoredEncounter,
  authoredOutcomeForLocation,
  type AuthoredResult,
} from '~/utils/shiftingLands/authoredJourney'

const SAVE_KEY = 'kr.shiftingLands.journeyLedger.v5'
const LEGACY_V4_SAVE_KEY = 'kr.shiftingLands.journeyLedger.v4'
const LEGACY_V3_SAVE_KEY = 'kr.shiftingLands.journeyLedger.v3'
const LEGACY_SAVE_KEY = 'kr.shiftingLands.authoredJourney.v2'

export const useShiftingLandsJourneyStore = defineStore(
  'shiftingLandsJourney',
  () => {
    const ledger = ref<JourneyLedger | JourneyLedgerV4 | JourneyLedgerV5>(
      newJourneyLedgerV5(20261011),
    )
    const session = computed(() => ledger.value.current)
    const state = computed(() => session.value.journey)
    const characterSheet = computed(() =>
      journeyCharacterSheet(session.value, ledger.value.usedRewards),
    )
    const loaded = ref(false)
    const restoreWarning = ref(false)
    const currentLand = computed(
      () => JOURNEY_WORLD.lands[state.value.landIndex]!,
    )
    const locations = computed(() => {
      const land = currentLand.value
      return state.value.layouts[land.id]!.map((id) =>
        land.locations.find((item) => item.id === id)!,
      )
    })
    const reachable = computed(() => reachableLocations(state.value))
    const resolved = computed(() =>
      state.value.resolved.filter(
        (entry) => entry.landId === currentLand.value.id,
      ),
    )
    const activeCard = computed(
      () =>
        locations.value.find((card) => card.id === state.value.active) ?? null,
    )
    const activeEncounter = computed(() =>
      ledger.value.version >= 4
        ? activeFiveLandEncounter(session.value)
        : activeAuthoredEncounter(session.value),
    )
    const landArt = computed(() => landScenery(currentLand.value.id))
    const activeArt = computed(() =>
      encounterArt(
        currentLand.value.id,
        activeEncounter.value,
        activeCard.value,
      ),
    )
    const bossArt = computed(() =>
      trialArt(currentLand.value.id, currentLand.value.boss.art),
    )
    const roadArt = (locationId: string): string => {
      const land = JOURNEY_WORLD.lands.find((item) =>
        item.locations.some((location) => location.id === locationId),
      )
      const location = land?.locations.find((item) => item.id === locationId)
      return land && location ? locationArt(land.id, location) : landArt.value
    }
    const playedArt = (locationId: string): string => {
      const land = JOURNEY_WORLD.lands.find((item) =>
        item.locations.some((location) => location.id === locationId),
      )
      const location =
        land?.locations.find((item) => item.id === locationId) ?? null
      const drawnId = session.value.drawn?.[locationId]
      const encounter = drawnId ? findFiveLandCard(drawnId) : null
      return land ? encounterArt(land.id, encounter, location) : landArt.value
    }
    const outcomePlate = (
      result: AuthoredResult,
    ): { src: string; painted: boolean } => {
      const painted = outcomeArt(
        result.encounterId,
        result.choiceId,
        result.roll.success,
      )
      return {
        src: painted ?? playedArt(result.locationId),
        painted: !!painted,
      }
    }
    const trialPlate = (
      result: TrialResult,
    ): { src: string; painted: boolean } => {
      const land = JOURNEY_WORLD.lands.find((item) => item.id === result.landId)
      const painted = outcomeArt(
        'trial-' + result.landId,
        result.choiceId,
        result.roll.success,
      )
      return {
        src: painted ?? trialArt(result.landId, land?.boss.art ?? null),
        painted: !!painted,
      }
    }
    const lastAuthoredOutcome = computed(
      () => session.value.outcomes[session.value.outcomes.length - 1] ?? null,
    )
    const currentTrial = computed(() =>
      ledger.value.version === 5 && state.value.phase === 'boss'
        ? trialForLand(currentLand.value.id)
        : null,
    )
    const trialResults = computed(() =>
      ledger.value.version === 5 ? ledger.value.trialResults : [],
    )
    const lastTrialOutcome = computed(() => trialResults.value.at(-1) ?? null)
    const canTrial = (choiceId: string): boolean => {
      const choice = currentTrial.value?.choices.find(
        (item) => item.id === choiceId,
      )
      return (
        !!choice &&
        canChooseTrial(choice, session.value.flags, state.value.provisions)
      )
    }
    const currentShift = computed(
      () =>
        [...state.value.shifts]
          .reverse()
          .find((shift) => shift.landId === currentLand.value.id) ?? null,
    )
    const remaining = computed(() =>
      locations.value.filter(
        (card) =>
          !state.value.resolved.some((entry) => entry.locationId === card.id),
      ),
    )
    const bossReady = computed(() => state.value.phase === 'boss')
    const completed = computed(() => state.value.phase === 'complete')
    const finished = computed(() =>
      ['complete', 'fallen', 'retired'].includes(state.value.phase),
    )
    const encounterHistory = computed(() => session.value.outcomes)
    const savedEncounter = (locationId: string) =>
      authoredOutcomeForLocation(session.value, locationId)

    function initialize() {
      if (loaded.value) return
      loaded.value = true
      if (!import.meta.client) return
      try {
        const saved = window.localStorage.getItem(SAVE_KEY)
        if (saved !== null) {
          const restored = restoreJourneyLedgerV5(JSON.parse(saved))
          if (restored) ledger.value = restored
          else restoreWarning.value = true
          return
        }
        const savedV4 = window.localStorage.getItem(LEGACY_V4_SAVE_KEY)
        if (savedV4 !== null) {
          const restored = restoreJourneyLedgerV4(JSON.parse(savedV4))
          if (restored) ledger.value = restored
          else restoreWarning.value = true
          return
        }
        const savedV3 = window.localStorage.getItem(LEGACY_V3_SAVE_KEY)
        if (savedV3 !== null) {
          const restored = restoreJourneyLedger(JSON.parse(savedV3))
          if (restored) ledger.value = restored
          else restoreWarning.value = true
          return
        }
        const legacy = window.localStorage.getItem(LEGACY_SAVE_KEY)
        if (legacy === null) return
        const migrated = migrateJourneyLedger(JSON.parse(legacy))
        if (!migrated) {
          restoreWarning.value = true
          return
        }
        ledger.value = migrated
        persist()
      } catch {
        restoreWarning.value = true
      }
    }
    function persist() {
      if (!import.meta.client) return
      try {
        const key =
          ledger.value.version === 5
            ? SAVE_KEY
            : ledger.value.version === 4
              ? LEGACY_V4_SAVE_KEY
              : LEGACY_V3_SAVE_KEY
        window.localStorage.setItem(key, JSON.stringify(ledger.value))
      } catch {
        restoreWarning.value = true
      }
    }
    function dispatch(action: JourneyActionV5): boolean {
      if (!loaded.value) return false
      const active = ledger.value
      if (
        active.version !== 5 &&
        (action.type === 'TRIAL' || action.type === 'RETREAT')
      )
        return false
      const next =
        active.version === 5
          ? stepJourneyLedgerV5(active, action)
          : active.version === 4
            ? stepJourneyLedgerV4(active, action as JourneyLedgerAction)
            : stepJourneyLedger(active, action as JourneyLedgerAction)
      if (next === ledger.value) return false
      ledger.value = next
      restoreWarning.value = false
      persist()
      return true
    }
    function travel(id: string) {
      return dispatch({ type: 'TRAVEL', locationId: id })
    }
    function draw() {
      const next = reachable.value.find((id) =>
        remaining.value.some((card) => card.id === id),
      )
      return next ? travel(next) : false
    }
    function choose(choiceId: string) {
      return dispatch({ type: 'CHOOSE', choiceId })
    }
    function resolve(approach: EncounterApproach) {
      return dispatch({ type: 'RESOLVE', approach })
    }
    function confront(approach: BossApproach) {
      if (ledger.value.version === 5)
        return approach === 'retreat' ? dispatch({ type: 'RETREAT' }) : false
      return dispatch({ type: 'BOSS', approach })
    }
    function attemptTrial(choiceId: string) {
      return dispatch({ type: 'TRIAL', choiceId })
    }
    function useReward(rewardId: string) {
      return dispatch({ type: 'USE_REWARD', rewardId })
    }
    function fresh() {
      if (!loaded.value) return
      ledger.value = newJourneyLedgerV5(Date.now() % 2147483647)
      restoreWarning.value = false
      persist()
    }
    return {
      ledger,
      session,
      state,
      characterSheet,
      loaded,
      restoreWarning,
      currentLand,
      locations,
      reachable,
      resolved,
      activeCard,
      activeEncounter,
      landArt,
      activeArt,
      bossArt,
      roadArt,
      playedArt,
      outcomePlate,
      trialPlate,
      currentTrial,
      lastTrialOutcome,
      canTrial,
      attemptTrial,
      lastAuthoredOutcome,
      encounterHistory,
      savedEncounter,
      currentShift,
      remaining,
      bossReady,
      completed,
      finished,
      world: JOURNEY_WORLD,
      initialize,
      travel,
      draw,
      choose,
      useReward,
      resolve,
      confront,
      fresh,
    }
  },
)
