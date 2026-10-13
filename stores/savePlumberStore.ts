import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  DEFAULT_HEROINE_SEED,
  HEROINE_SEED_STORAGE_KEY,
  createHeroine,
  parseStoredHeroineSeed,
  rollHeroineSeed,
} from '~/utils/arcade/games/savePlumberHeroine'

export const useSavePlumberStore = defineStore('savePlumber', () => {
  const seed = ref(DEFAULT_HEROINE_SEED)
  const keptSeed = ref<number | null>(null)
  const loaded = ref(false)

  const heroine = computed(() => createHeroine(seed.value))
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
    seed.value = rollHeroineSeed()
  }

  function keep(): void {
    keptSeed.value = seed.value
    try {
      localStorage.setItem(HEROINE_SEED_STORAGE_KEY, String(seed.value))
    } catch {
      return
    }
  }

  return { seed, heroine, kept, load, reroll, keep }
})
