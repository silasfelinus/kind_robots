// /stores/zuzuShowdownStore.ts
//
// Player options for Zuzu Showdown (conductor zuzu-showdown): sound, the CRT
// overlay, Easy Specials, the hitbox overlay, the match mode and the CPU's
// level. Remembered per browser; the match itself lives in the pure sim
// (utils/zuzuShowdown).

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { DEFAULT_FIGHTERS, FIGHTERS } from '~/utils/zuzuShowdown/fighters'
import { CPU_LEVELS, type CpuLevel } from '~/utils/zuzuShowdown/cpu'

/** P2 is a CPU opponent, a second player, or the training dummy. */
export type ShowdownMode = 'cpu' | 'versus' | 'dummy'

type ShowdownPrefs = {
  muted?: boolean
  crt?: boolean
  easySpecials?: boolean
  showBoxes?: boolean
  mode?: ShowdownMode
  cpuLevel?: CpuLevel
  fighters?: [string, string]
}

const PREFS_KEY = 'kr-zuzu-showdown-prefs'

function readPrefs(): ShowdownPrefs {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? (parsed as ShowdownPrefs) : {}
  } catch {
    return {}
  }
}

function writePrefs(prefs: ShowdownPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Private mode: the choice just won't persist.
  }
}

export const useZuzuShowdownStore = defineStore('zuzuShowdownStore', () => {
  const muted = ref(true)
  const crt = ref(false)
  const easySpecials = ref(false)
  const showBoxes = ref(false)
  const mode = ref<ShowdownMode>('cpu')
  const cpuLevel = ref<CpuLevel>('normal')
  const reducedMotion = ref(false)
  const fighters = ref<[string, string]>([...DEFAULT_FIGHTERS])

  /** Read saved options; touch screens default to Easy Specials. */
  function loadPreferences(options: {
    reducedMotion: boolean
    coarsePointer: boolean
  }) {
    const prefs = readPrefs()
    reducedMotion.value = options.reducedMotion
    muted.value = prefs.muted ?? true
    crt.value = prefs.crt ?? !options.reducedMotion
    easySpecials.value = prefs.easySpecials ?? options.coarsePointer
    showBoxes.value = prefs.showBoxes === true
    mode.value =
      prefs.mode === 'versus' || prefs.mode === 'dummy' ? prefs.mode : 'cpu'
    cpuLevel.value =
      prefs.cpuLevel && CPU_LEVELS.includes(prefs.cpuLevel)
        ? prefs.cpuLevel
        : 'normal'
    const known = (slug: unknown, fallback: string) =>
      typeof slug === 'string' && FIGHTERS.some((f) => f.slug === slug)
        ? slug
        : fallback
    fighters.value = [
      known(prefs.fighters?.[0], DEFAULT_FIGHTERS[0]),
      known(prefs.fighters?.[1], DEFAULT_FIGHTERS[1]),
    ]
  }

  function save() {
    writePrefs({
      muted: muted.value,
      crt: crt.value,
      easySpecials: easySpecials.value,
      showBoxes: showBoxes.value,
      mode: mode.value,
      cpuLevel: cpuLevel.value,
      fighters: fighters.value,
    })
  }

  function setMuted(value: boolean) {
    muted.value = value
    save()
  }

  function setCrt(value: boolean) {
    crt.value = value
    save()
  }

  function setEasySpecials(value: boolean) {
    easySpecials.value = value
    save()
  }

  function setShowBoxes(value: boolean) {
    showBoxes.value = value
    save()
  }

  function setFighter(side: 0 | 1, slug: string) {
    if (!FIGHTERS.some((f) => f.slug === slug)) return
    const next: [string, string] = [...fighters.value]
    next[side] = slug
    fighters.value = next
    save()
  }

  function setMode(value: ShowdownMode) {
    mode.value = value
    save()
  }

  function setCpuLevel(value: CpuLevel) {
    if (!CPU_LEVELS.includes(value)) return
    cpuLevel.value = value
    save()
  }

  return {
    muted,
    crt,
    easySpecials,
    showBoxes,
    mode,
    cpuLevel,
    reducedMotion,
    fighters,
    loadPreferences,
    setFighter,
    setMuted,
    setCrt,
    setEasySpecials,
    setShowBoxes,
    setMode,
    setCpuLevel,
  }
})
