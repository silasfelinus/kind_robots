// /stores/zuzuLairStore.ts
//
// Zuzu's Lair player options (conductor zuzu-lair): difficulty, flash assist, on-screen
// buttons and sound. Remembered per browser; the page reads and writes only through here.

import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { LairDifficulty } from '~/utils/zuzuLair/types'
import { sanitizeLairPrefs, type LairPrefs } from '~/utils/zuzuLair/prefs'

const PREFS_KEY = 'kr-zuzu-lair-prefs'

export const useZuzuLairStore = defineStore('zuzuLair', () => {
  const difficulty = ref<LairDifficulty>('assist')
  /** null: follow the difficulty (on for Assist, off for Classic). */
  const flash = ref<boolean | null>(null)
  /** null: follow the pointer (on for coarse pointers). */
  const buttons = ref<boolean | null>(null)
  const muted = ref(false)
  const loaded = ref(false)

  function load() {
    if (loaded.value) return
    loaded.value = true
    try {
      const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
      apply(sanitizeLairPrefs(raw))
    } catch {
      // Private mode or bad JSON: defaults stand.
    }
  }

  function apply(prefs: LairPrefs) {
    difficulty.value = prefs.difficulty
    flash.value = prefs.flash
    buttons.value = prefs.buttons
    muted.value = prefs.muted
  }

  function save() {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({
          difficulty: difficulty.value,
          flash: flash.value,
          buttons: buttons.value,
          muted: muted.value,
        }),
      )
    } catch {
      // The choice just won't persist.
    }
  }

  function setDifficulty(value: LairDifficulty) {
    difficulty.value = value
    save()
  }
  function setFlash(value: boolean) {
    flash.value = value
    save()
  }
  function setButtons(value: boolean) {
    buttons.value = value
    save()
  }
  function setMuted(value: boolean) {
    muted.value = value
    save()
  }

  return {
    difficulty,
    flash,
    buttons,
    muted,
    load,
    setDifficulty,
    setFlash,
    setButtons,
    setMuted,
  }
})
