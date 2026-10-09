import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  BOSS_CARD,
  HOMESTEAD_CARDS,
  confrontAbbess,
  createHomestead,
  drawHomestead,
  isHomesteadState,
  resolveHomestead,
  type HomesteadState,
} from '~/utils/shiftingLands/homestead'
const SAVE_KEY = 'kr.shiftingLands.homestead.v1'
export const useShiftingLandsStore = defineStore('shiftingLands', () => {
  const state = ref<HomesteadState>(createHomestead(20261009))
  const loaded = ref(false)
  const activeCard = computed(
    () => HOMESTEAD_CARDS.find((c) => c.id === state.value.active) ?? null,
  )
  const bossReady = computed(
    () =>
      !state.value.deck.length &&
      !state.value.active &&
      state.value.health > 0 &&
      !state.value.bossResolved,
  )
  function persist() {
    if (!import.meta.client) return
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(state.value))
    } catch {
      /* private browsing */
    }
  }
  function initialize() {
    if (loaded.value) return
    if (import.meta.client) {
      try {
        const value = window.localStorage.getItem(SAVE_KEY)
        if (value) {
          const parsed: unknown = JSON.parse(value)
          if (isHomesteadState(parsed)) state.value = parsed
        }
      } catch {
        /* malformed save creates fresh run */
      }
    }
    loaded.value = true
  }
  function fresh() {
    state.value = createHomestead(Date.now() % 2147483647)
    persist()
  }
  function draw() {
    const next = drawHomestead(state.value)
    if (next === state.value) return false
    state.value = next
    persist()
    return true
  }
  function resolve(choice: 'help' | 'risk') {
    state.value = resolveHomestead(state.value, choice)
    persist()
  }
  function boss(choice: 'confront' | 'escape') {
    state.value = confrontAbbess(state.value, choice)
    persist()
  }
  return {
    state,
    loaded,
    activeCard,
    bossReady,
    bossCard: BOSS_CARD,
    cards: HOMESTEAD_CARDS,
    initialize,
    fresh,
    draw,
    resolve,
    boss,
  }
})
