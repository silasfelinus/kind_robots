import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  JOURNEY_WORLD,
  newJourney,
  reachableLocations,
  restoreJourney,
  stepJourney,
  type BossApproach,
  type EncounterApproach,
  type JourneyAction,
  type JourneyState,
} from '~/utils/shiftingLands/journey'

const SAVE_KEY = 'kr.shiftingLands.journey.v1'

export const useShiftingLandsJourneyStore = defineStore('shiftingLandsJourney', () => {
  const state = ref<JourneyState>(newJourney(20261009))
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
  const currentShift = computed(() => [...state.value.shifts].reverse().find((shift) => shift.landId === currentLand.value.id) ?? null)
  const remaining = computed(() => locations.value.filter((card) => !state.value.resolved.some((entry) => entry.locationId === card.id)))
  const bossReady = computed(() => state.value.phase === 'boss')
  const completed = computed(() => state.value.phase === 'complete')
  const finished = computed(() => ['complete', 'fallen', 'retired'].includes(state.value.phase))

  function initialize() {
    if (loaded.value) return
    loaded.value = true
    if (!import.meta.client) return
    try {
      const saved = window.localStorage.getItem(SAVE_KEY)
      if (!saved) return
      const restored = restoreJourney(JSON.parse(saved))
      if (restored) state.value = restored
      else restoreWarning.value = true
    } catch {
      restoreWarning.value = true
    }
  }
  function persist() {
    if (!import.meta.client) return
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(state.value))
    } catch {
      restoreWarning.value = true
    }
  }
  function dispatch(action: JourneyAction): boolean {
    if (!loaded.value) return false
    const next = stepJourney(state.value, action)
    if (next === state.value) return false
    state.value = next
    restoreWarning.value = false
    persist()
    return true
  }
  function travel(id: string) { return dispatch({ type: 'TRAVEL', locationId: id }) }
  function draw() {
    const next = reachable.value.find((id) => remaining.value.some((card) => card.id === id))
    return next ? travel(next) : false
  }
  function resolve(approach: EncounterApproach) { return dispatch({ type: 'RESOLVE', approach }) }
  function confront(approach: BossApproach) { return dispatch({ type: 'BOSS', approach }) }
  function fresh() {
    if (!loaded.value) return
    state.value = newJourney(Date.now() % 2147483647)
    restoreWarning.value = false
    persist()
  }
  return {
    state, loaded, restoreWarning, currentLand, locations, reachable, resolved, activeCard,
    currentShift, remaining, bossReady, completed, finished, world: JOURNEY_WORLD,
    initialize, travel, draw, resolve, confront, fresh,
  }
})
