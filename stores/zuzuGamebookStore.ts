import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  startRun, takeChoice, fight, isSavedRun,
  type Run, type BattleAction,
} from '~/utils/zuzuGamebook/adventure'

const SAVE_KEY = 'kr-zuzu-gamebook-v1'
const ENDINGS_KEY = 'kr-zuzu-gamebook-endings-v1'

export const useZuzuGamebookStore = defineStore('zuzuGamebook', () => {
  const run = ref<Run>(startRun(1))
  const discovered = ref<string[]>([])
  const loaded = ref(false)
  const rollSerial = ref(0)

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(run.value))
      localStorage.setItem(ENDINGS_KEY, JSON.stringify(discovered.value))
    } catch {
      // The game remains playable without browser storage.
    }
  }

  function rememberEnding() {
    for (const ending of run.value.endings) {
      if (!discovered.value.includes(ending)) discovered.value.push(ending)
    }
  }

  function load() {
    if (loaded.value) return
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (isSavedRun(parsed)) run.value = parsed
      }
      const endings: unknown = JSON.parse(localStorage.getItem(ENDINGS_KEY) ?? '[]')
      if (Array.isArray(endings)) discovered.value = endings.filter((entry): entry is string => typeof entry === 'string')
    } catch {
      // Corrupt or blocked storage starts a new adventure safely.
    }
    loaded.value = true
    save()
  }

  function choose(id: string) {
    if (!loaded.value) return
    const next = takeChoice(run.value, id)
    if (next === run.value) return
    run.value = next
    if (next.lastRoll) rollSerial.value++
    rememberEnding()
    save()
  }

  function battle(action: BattleAction) {
    if (!loaded.value) return
    const next = fight(run.value, action)
    if (next === run.value) return
    run.value = next
    rollSerial.value++
    rememberEnding()
    save()
  }

  function restart() {
    run.value = startRun(Date.now() >>> 0 || 1)
    rollSerial.value = 0
    save()
  }

  return { run, discovered, loaded, rollSerial, load, choose, battle, restart }
})
