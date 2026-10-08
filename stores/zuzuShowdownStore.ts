// /stores/zuzuShowdownStore.ts
//
// Player options for Zuzu Showdown (conductor zuzu-showdown): sound, the
// render style (Pixel or HD, t-027), the CRT overlay, Easy Specials, the
// hitbox overlay, the match mode, the CPU's level and Training's settings. Remembered per browser; the match itself
// lives in the pure sim (utils/zuzuShowdown).

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { isRenderStyle, type RenderStyle } from '~/utils/arcade/display'
import { DEFAULT_FIGHTERS, FIGHTERS } from '~/utils/zuzuShowdown/fighters'
import { CPU_LEVELS, type CpuLevel } from '~/utils/zuzuShowdown/cpu'
import {
  DUMMY_MODES,
  type DummyMode,
  type TrainingPlace,
} from '~/utils/zuzuShowdown/training'

/** P2 is a CPU opponent, a second player, or the training dummy. */
export type ShowdownMode = 'cpu' | 'versus' | 'dummy'

type ShowdownPrefs = {
  muted?: boolean
  renderStyle?: RenderStyle
  crt?: boolean
  easySpecials?: boolean
  showBoxes?: boolean
  mode?: ShowdownMode
  cpuLevel?: CpuLevel
  fighters?: [string, string]
  dummy?: DummyMode
  infiniteMeter?: boolean
  infiniteHealth?: boolean
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
  const renderStyle = ref<RenderStyle>('pixel')
  const crt = ref(false)
  const easySpecials = ref(false)
  const showBoxes = ref(false)
  const mode = ref<ShowdownMode>('cpu')
  const cpuLevel = ref<CpuLevel>('normal')
  const reducedMotion = ref(false)
  const fighters = ref<[string, string]>([...DEFAULT_FIGHTERS])
  // Training (t-022): what the dummy does, the refills, and a reset the stage carries out.
  const dummy = ref<DummyMode>('stand')
  const infiniteMeter = ref(true)
  const infiniteHealth = ref(true)
  const reset = ref<{ place: TrainingPlace; count: number }>({
    place: 'center',
    count: 0,
  })

  /** Read saved options; touch screens default to Easy Specials. */
  function loadPreferences(options: {
    reducedMotion: boolean
    coarsePointer: boolean
  }) {
    const prefs = readPrefs()
    reducedMotion.value = options.reducedMotion
    muted.value = prefs.muted ?? true
    renderStyle.value = isRenderStyle(prefs.renderStyle)
      ? prefs.renderStyle
      : 'pixel'
    crt.value = prefs.crt ?? !options.reducedMotion
    easySpecials.value = prefs.easySpecials ?? options.coarsePointer
    showBoxes.value = prefs.showBoxes === true
    mode.value =
      prefs.mode === 'versus' || prefs.mode === 'dummy' ? prefs.mode : 'cpu'
    cpuLevel.value =
      prefs.cpuLevel && CPU_LEVELS.includes(prefs.cpuLevel)
        ? prefs.cpuLevel
        : 'normal'
    dummy.value =
      prefs.dummy && DUMMY_MODES.includes(prefs.dummy) ? prefs.dummy : 'stand'
    infiniteMeter.value = prefs.infiniteMeter ?? true
    infiniteHealth.value = prefs.infiniteHealth ?? true
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
      renderStyle: renderStyle.value,
      crt: crt.value,
      easySpecials: easySpecials.value,
      showBoxes: showBoxes.value,
      mode: mode.value,
      cpuLevel: cpuLevel.value,
      fighters: fighters.value,
      dummy: dummy.value,
      infiniteMeter: infiniteMeter.value,
      infiniteHealth: infiniteHealth.value,
    })
  }

  function setMuted(value: boolean) {
    muted.value = value
    save()
  }

  function setRenderStyle(value: RenderStyle) {
    if (!isRenderStyle(value)) return
    renderStyle.value = value
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

  function setDummy(value: DummyMode) {
    if (!DUMMY_MODES.includes(value)) return
    dummy.value = value
    save()
  }

  function setInfiniteMeter(value: boolean) {
    infiniteMeter.value = value
    save()
  }

  function setInfiniteHealth(value: boolean) {
    infiniteHealth.value = value
    save()
  }

  /** Ask the stage to put the fighters back: in the centre, or with P1 or P2 in the corner. */
  function resetPositions(place: TrainingPlace) {
    reset.value = { place, count: reset.value.count + 1 }
  }

  return {
    muted,
    renderStyle,
    crt,
    easySpecials,
    showBoxes,
    mode,
    cpuLevel,
    reducedMotion,
    fighters,
    dummy,
    infiniteMeter,
    infiniteHealth,
    reset,
    loadPreferences,
    setFighter,
    setMuted,
    setRenderStyle,
    setCrt,
    setEasySpecials,
    setShowBoxes,
    setMode,
    setCpuLevel,
    setDummy,
    setInfiniteMeter,
    setInfiniteHealth,
    resetPositions,
  }
})
