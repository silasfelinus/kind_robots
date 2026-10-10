import { defineStore } from 'pinia'
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
  newAuthoredJourney,
  restoreAuthoredJourney,
  stepAuthoredJourney,
  type AuthoredAction,
  type AuthoredJourneyState,
} from '~/utils/shiftingLands/authoredJourney'

const SAVE_KEY = 'kr.shiftingLands.authoredJourney.v2'

export const useShiftingLandsJourneyStore = defineStore('shiftingLandsJourney', () => {
  const session = ref<AuthoredJourneyState>(newAuthoredJourney(20261009))
  const state = computed(() => session.value.journey)
  const loaded = ref(false)
  const restoreWarning = ref(false)
  const currentLand = computed(() => JOURNEY_WORLD.lands[state.value.landIndex]!)
  const locations = computed(() => {
    const land = currentLand.value
    return state.value.layouts[land.id]!.map((id) => land.locations.find((item) => item.id === id)!)
  })
  const reachable = computed(() => reachableLocations(state.value))
  const resolved = computed(() => state.value.resolved.filter((entry) => entry.landId === currentLand.value.id))
  const activeCard = computed(() => locations.value.find((card) => card.id === state.value.active) ?? null)
  const activeEncounter = computed(() => activeAuthoredEncounter(session.value))
  const lastAuthoredOutcome = computed(() => session.value.outcomes[session.value.outcomes.length - 1] ?? null)
  const currentShift = computed(() => [...state.value.shifts].reverse().find((shift) => shift.landId === currentLand.value.id) ?? null)
  const remaining = computed(() => locations.value.filter((card) => !state.value.resolved.some((entry) => entry.locationId === card.id)))
  const bossReady = computed(() => state.value.phase === 'boss')
  const completed = computed(() => state.value.phase === 'complete')
  const finished = computed(() => ['complete', 'fallen', 'retired'].includes(state.value.phase))
  const encounterHistory = computed(() => session.value.outcomes)
  const savedEncounter = (locationId: string) =>
    authoredOutcomeForLocation(session.value, locationId)

  function initialize() {
    if (loaded.value) return
    loaded.value = true
    if (!import.meta.client) return
    try {
      const saved = window.localStorage.getItem(SAVE_KEY)
      if (!saved) return
      const restored = restoreAuthoredJourney(JSON.parse(saved))
      if (restored) session.value = restored
      else restoreWarning.value = true
    } catch {
      restoreWarning.value = true
    }
  }
  function persist() {
    if (!import.meta.client) return
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(session.value))
    } catch {
      restoreWarning.value = true
    }
  }
  function dispatch(action: AuthoredAction): boolean {
    if (!loaded.value) return false
    const next = stepAuthoredJourney(session.value, action)
    if (next === session.value) return false
    session.value = next
    restoreWarning.value = false
    persist()
    return true
  }
  function travel(id: string) { return dispatch({ type: 'TRAVEL', locationId: id }) }
  function draw() {
    const next = reachable.value.find((id) => remaining.value.some((card) => card.id === id))
    return next ? travel(next) : false
  }
  function choose(choiceId: string) { return dispatch({ type: 'CHOOSE', choiceId }) }
  function resolve(approach: EncounterApproach) { return dispatch({ type: 'RESOLVE', approach }) }
  function confront(approach: BossApproach) { return dispatch({ type: 'BOSS', approach }) }
  function fresh() {
    if (!loaded.value) return
    session.value = newAuthoredJourney(Date.now() % 2147483647)
    restoreWarning.value = false
    persist()
  }
  return {
    session, state, loaded, restoreWarning, currentLand, locations, reachable, resolved,
    activeCard, activeEncounter, lastAuthoredOutcome, encounterHistory, savedEncounter,
    currentShift, remaining, bossReady, completed, finished, world: JOURNEY_WORLD,
    initialize, travel, draw, choose, resolve, confront, fresh,
  }
})
