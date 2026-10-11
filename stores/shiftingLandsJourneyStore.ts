import { defineStore } from 'pinia'
import { journeyCharacterSheet } from '~/utils/shiftingLands/progression'
import {
  migrateJourneyLedger,
  newJourneyLedger,
  restoreJourneyLedger,
  stepJourneyLedger,
  type JourneyLedgerAction,
} from '~/utils/shiftingLands/saveLedger'
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
} from '~/utils/shiftingLands/authoredJourney'

const SAVE_KEY = 'kr.shiftingLands.journeyLedger.v3'
const LEGACY_SAVE_KEY = 'kr.shiftingLands.authoredJourney.v2'

export const useShiftingLandsJourneyStore = defineStore(
  'shiftingLandsJourney',
  () => {
    const ledger = ref(newJourneyLedger(20261009))
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
      activeAuthoredEncounter(session.value),
    )
    const lastAuthoredOutcome = computed(
      () => session.value.outcomes[session.value.outcomes.length - 1] ?? null,
    )
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
          const restored = restoreJourneyLedger(JSON.parse(saved))
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
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(ledger.value))
      } catch {
        restoreWarning.value = true
      }
    }
    function dispatch(action: JourneyLedgerAction): boolean {
      if (!loaded.value) return false
      const next = stepJourneyLedger(ledger.value, action)
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
      return dispatch({ type: 'BOSS', approach })
    }
    function useReward(rewardId: string) {
      return dispatch({ type: 'USE_REWARD', rewardId })
    }
    function fresh() {
      if (!loaded.value) return
      ledger.value = newJourneyLedger(Date.now() % 2147483647)
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
