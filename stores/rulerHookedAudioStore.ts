import { defineStore } from 'pinia'
import {
  cleanRoyalAudioPrefs,
  ROYAL_AUDIO_DEFAULTS,
  RoyalSound,
  type RoyalAudioPrefs,
  type RoyalCue,
  type RoyalTheme,
} from '~/utils/rulerHooked/audio'

const KEY = 'rulerHooked:audio:v1'

export const useRulerHookedAudioStore = defineStore('rulerHookedAudio', () => {
  const prefs = ref<RoyalAudioPrefs>({ ...ROYAL_AUDIO_DEFAULTS })
  const enabled = ref(false)
  const sound = new RoyalSound()
  let generation = 0

  function initialize() {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) prefs.value = cleanRoyalAudioPrefs(JSON.parse(raw))
    } catch {
      // Storage can be unavailable in private browsing.
    }
    sound.setPrefs(prefs.value)
  }

  function update(patch: Partial<RoyalAudioPrefs>) {
    prefs.value = cleanRoyalAudioPrefs({ ...prefs.value, ...patch })
    sound.setPrefs(prefs.value)
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs.value))
    } catch {
      // Audio remains usable without persistence.
    }
  }

  async function unlock() {
    const token = generation
    const result = await sound.unlock()
    if (token === generation) enabled.value = result
  }

  function scene(theme: RoyalTheme, quiet: boolean) {
    sound.setScene(theme, quiet)
  }

  function visibility(hidden: boolean) {
    sound.setHidden(hidden)
  }

  function play(cue: RoyalCue) {
    sound.play(cue)
  }

  function dispose() {
    generation++
    enabled.value = false
    sound.dispose()
  }

  return { prefs, enabled, initialize, update, unlock, scene, visibility, play, dispose }
})
