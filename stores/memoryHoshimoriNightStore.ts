import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  HOSHIMORI_NIGHT_SITES,
  advanceHoshimoriNight,
  canMoveHoshimoriNight,
  hoshimoriNightClues,
  hoshimoriNightCouncil,
  hoshimoriNightOrder,
  newHoshimoriNightProgress,
  restoreHoshimoriNight,
  type NightEvent,
} from '~/utils/memoryDungeon/hoshimoriNight'

const SAVE_KEY = 'memory-dungeon-hoshimori-e08-v1'

export const useMemoryHoshimoriNightStore = defineStore(
  'memoryHoshimoriNight',
  () => {
    const progress = ref(newHoshimoriNightProgress(7))
    const hydrated = ref(false)
    const notice = ref('')
    const currentSite = computed(() =>
      HOSHIMORI_NIGHT_SITES.find((site) => site.key === progress.value.current),
    )
    const clues = computed(() => hoshimoriNightClues(progress.value))
    const expectedOrder = computed(() =>
      hoshimoriNightOrder(progress.value.seed),
    )
    const council = computed(() => hoshimoriNightCouncil(progress.value))
    const lastOutcome = computed(() => {
      const last = progress.value.events.at(-1)
      if (last?.type !== 'choose') return null
      return (
        currentSite.value?.choices.find((choice) => choice.id === last.id)
          ?.outcome ?? null
      )
    })

    function hydrate(): void {
      if (hydrated.value || !import.meta.client) return
      hydrated.value = true
      try {
        const saved = window.localStorage.getItem(SAVE_KEY)
        if (!saved) return
        const restored = restoreHoshimoriNight(JSON.parse(saved))
        if (restored) progress.value = restored
        else
          notice.value =
            'The procession rejected an altered account. A fresh route is ready.'
      } catch {
        notice.value =
          'The night journal could not be read. A fresh route is ready.'
      }
    }

    function persist(): void {
      if (!import.meta.client) return
      try {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(progress.value))
      } catch {
        notice.value = 'The night continues, but this browser cannot save it.'
      }
    }

    function canMove(to: string): boolean {
      return canMoveHoshimoriNight(progress.value, to)
    }

    function act(event: NightEvent): boolean {
      const next = advanceHoshimoriNight(progress.value, event)
      if (next === progress.value) {
        if (event.type === 'unbind')
          notice.value =
            'The wall remembers three signs. Hear the bridge, choir and coat first.'
        return false
      }
      progress.value = next
      notice.value = ''
      persist()
      return true
    }

    function restart(): void {
      progress.value = newHoshimoriNightProgress(
        Math.floor(Math.random() * 2147483648),
      )
      notice.value = ''
      persist()
    }

    return {
      progress,
      notice,
      currentSite,
      clues,
      expectedOrder,
      council,
      lastOutcome,
      canMove,
      hydrate,
      act,
      restart,
    }
  },
)
