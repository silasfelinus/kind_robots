import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'
import {
  HOSHIMORI_OVEN_ROOMS,
  HOSHIMORI_WARM_SITES,
  advanceHoshimoriWarm,
  hoshimoriLanternClues,
  hoshimoriOvenResolution,
  hoshimoriOvenSecondAccount,
  hoshimoriRidgeAccount,
  hoshimoriLowlandAccount,
  newHoshimoriWarmProgress,
  restoreHoshimoriWarm,
  type HoshimoriEvent,
} from '~/utils/memoryDungeon/hoshimoriWarm'

const SAVE_KEY = 'memory-dungeon-hoshimori-e07-v1'

export const useMemoryHoshimoriStore = defineStore('memoryHoshimori', () => {
  const progress = ref(newHoshimoriWarmProgress(7))
  const hydrated = ref(false)
  const notice = ref('')
  const currentSite = computed(() =>
    HOSHIMORI_WARM_SITES.find((site) => site.key === progress.value.current),
  )
  const currentOvenRoom = computed(() =>
    HOSHIMORI_OVEN_ROOMS.find((room) => room.id === progress.value.ovenRoom),
  )
  const clues = computed(() => hoshimoriLanternClues(progress.value))
  const resolution = computed(() => hoshimoriOvenResolution(progress.value))
  const secondAccount = computed(() => hoshimoriOvenSecondAccount(progress.value))
  const ridgeAccount = computed(() => hoshimoriRidgeAccount(progress.value))
  const lowlandAccount = computed(() => hoshimoriLowlandAccount(progress.value))
  const lastOvenOutcome = computed(() => {
    const last = progress.value.events.at(-1)
    if (last?.type !== 'oven-choice') return null
    return (
      HOSHIMORI_OVEN_ROOMS.flatMap((room) => room.choices).find(
        (choice) => choice.id === last.id,
      )?.outcome ?? null
    )
  })
  const canEnterOven = computed(
    () =>
      progress.value.current === '4,3' &&
      !progress.value.ovenRoom &&
      !progress.value.ovenComplete &&
      (progress.value.lanternLit ||
        progress.value.flags.includes('oven-passage-offer') ||
        progress.value.flags.includes('oven-passage-pledge')),
  )

  const canEnterOvenWing = computed(
    () =>
      progress.value.current === '4,3' &&
      !progress.value.ovenRoom &&
      progress.value.ovenComplete &&
      !progress.value.ovenChoices['OV-09'],
  )

  function hydrate(): void {
    if (hydrated.value || !import.meta.client) return
    hydrated.value = true
    try {
      const saved = window.localStorage.getItem(SAVE_KEY)
      if (!saved) return
      const restored = restoreHoshimoriWarm(JSON.parse(saved))
      if (restored) {
        progress.value = restored
        useMemoryWorldStore().syncHoshimoriPhoto(restored.choices)
      } else
        notice.value =
          'The village could not verify that journey. A fresh route is ready.'
    } catch {
      notice.value =
        'The village could not read its last journey. A fresh route is ready.'
    }
  }

  function persist(): void {
    if (!import.meta.client) return
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(progress.value))
    } catch {
      notice.value = 'Your journey continues, but this browser cannot save it.'
    }
  }

  function canMove(to: string): boolean {
    if (progress.value.ovenRoom) return false
    const [x, y] = progress.value.current.split(',').map(Number)
    const [nextX, nextY] = to.split(',').map(Number)
    return (
      HOSHIMORI_WARM_SITES.some((site) => site.key === to) &&
      Math.abs(x! - nextX!) + Math.abs(y! - nextY!) === 1
    )
  }

  function act(event: HoshimoriEvent): boolean {
    const next = advanceHoshimoriWarm(progress.value, event)
    if (next === progress.value) {
      if (event.type === 'light')
        notice.value = 'The lanterns stay dark. Check the numbered clues.'
      return false
    }
    progress.value = next
    notice.value = ''
    if (event.type === 'choose')
      useMemoryWorldStore().syncHoshimoriPhoto(next.choices)
    persist()
    return true
  }

  function restart(): void {
    progress.value = newHoshimoriWarmProgress(
      Math.floor(Math.random() * 2147483648),
    )
    notice.value = ''
    persist()
  }

  return {
    progress,
    notice,
    currentSite,
    currentOvenRoom,
    clues,
    resolution,
    secondAccount,
    ridgeAccount,
    lowlandAccount,
    lastOvenOutcome,
    canEnterOven,
    canEnterOvenWing,
    canMove,
    hydrate,
    act,
    restart,
  }
})
