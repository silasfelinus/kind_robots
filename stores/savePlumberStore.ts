import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  DEFAULT_HEROINE_SEED,
  HEROINE_SEED_STORAGE_KEY,
  parseStoredHeroineSeed,
} from '~/utils/arcade/games/savePlumberHeroine'
import {
  PLUMBER_ROSTER,
  rosterHeroine,
  rosterIndex,
  seedForRoster,
} from '~/utils/arcade/games/savePlumberRoster'

export const useSavePlumberStore = defineStore('savePlumber', () => {
  const seed = ref(DEFAULT_HEROINE_SEED)
  const keptSeed = ref<number | null>(null)
  const loaded = ref(false)

  const heroine = computed(() => rosterHeroine(seed.value))
  const rosterSlot = computed(() => rosterIndex(seed.value))
  const kept = computed(() => keptSeed.value === seed.value)

  function load(): void {
    if (loaded.value) return
    loaded.value = true
    try {
      const stored = parseStoredHeroineSeed(
        localStorage.getItem(HEROINE_SEED_STORAGE_KEY),
      )
      if (stored === null) return
      seed.value = stored
      keptSeed.value = stored
    } catch {
      return
    }
  }

  function reroll(): void {
    const others = PLUMBER_ROSTER.length - 1
    seed.value = seedForRoster(
      rosterSlot.value + 1 + Math.floor(Math.random() * others),
    )
  }

  function choose(index: number): void {
    if (index === rosterSlot.value) return
    seed.value = seedForRoster(index)
  }

  function keep(): void {
    keptSeed.value = seed.value
    try {
      localStorage.setItem(HEROINE_SEED_STORAGE_KEY, String(seed.value))
    } catch {
      return
    }
  }

  return { seed, heroine, rosterSlot, kept, load, reroll, choose, keep }
})
