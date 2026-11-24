import { defineStore } from 'pinia'
import {
  cleanRoyalDisplayPrefs,
  decodeRoyalDisplayPrefs,
  ROYAL_DISPLAY_DEFAULTS,
  type RoyalDisplayPrefs,
} from '~/utils/rulerHooked/displayPrefs'

const KEY = 'rulerHooked:display:v1'

export const useRulerHookedDisplayStore = defineStore(
  'rulerHookedDisplay',
  () => {
    const prefs = ref<RoyalDisplayPrefs>({ ...ROYAL_DISPLAY_DEFAULTS })

    function initialize() {
      try {
        prefs.value = decodeRoyalDisplayPrefs(localStorage.getItem(KEY))
      } catch {
        // The current session remains usable when storage is unavailable.
      }
    }

    function update(patch: Partial<RoyalDisplayPrefs>) {
      prefs.value = cleanRoyalDisplayPrefs({ ...prefs.value, ...patch })
      try {
        localStorage.setItem(KEY, JSON.stringify(prefs.value))
      } catch {
        // Keep the selected preferences for this session.
      }
    }

    function reset() {
      update(ROYAL_DISPLAY_DEFAULTS)
    }

    return { prefs, initialize, update, reset }
  },
)
