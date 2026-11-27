import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  DEFAULT_MONSTRIQUE_MIX,
  MONSTRIQUE_MIX_KEY,
  MonstriqueSound,
  parseMonstriqueMix,
  type MonstriqueCue,
  type MonstriqueMix,
  type MonstriqueMood,
} from '~/utils/monstrique/sound'

function readMix(): MonstriqueMix {
  if (typeof window === 'undefined') return { ...DEFAULT_MONSTRIQUE_MIX }
  try {
    return parseMonstriqueMix(window.localStorage.getItem(MONSTRIQUE_MIX_KEY))
  } catch {
    return { ...DEFAULT_MONSTRIQUE_MIX }
  }
}

function persistMix(mix: MonstriqueMix): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MONSTRIQUE_MIX_KEY, JSON.stringify(mix))
  } catch {
    // Storage can be unavailable in private browsing; keep this session's mix.
  }
}

/** The one MONSTRIQUE player shared by the title console and the stage. */
export const useMonstriqueSoundStore = defineStore('monstriqueSound', () => {
  const mix = ref<MonstriqueMix>(readMix())
  const unlocked = ref(false)
  const enabled = ref(true)
  const mood = ref<MonstriqueMood>('title')
  let player: MonstriqueSound | null = null

  function engine(): MonstriqueSound {
    if (!player) {
      player = new MonstriqueSound()
      player.setMix(mix.value)
      player.setEnabled(enabled.value)
      player.setMood(mood.value)
    }
    return player
  }

  function loadMix(): void {
    mix.value = readMix()
    player?.setMix(mix.value)
  }

  function setMix(patch: Partial<MonstriqueMix>): void {
    mix.value = parseMonstriqueMix({ ...mix.value, ...patch })
    persistMix(mix.value)
    player?.setMix(mix.value)
  }

  function resetMix(): void {
    setMix({ ...DEFAULT_MONSTRIQUE_MIX })
  }

  function unlock(): void {
    if (typeof window === 'undefined') return
    unlocked.value = engine().unlock()
  }

  function setEnabled(on: boolean): void {
    enabled.value = on
    player?.setEnabled(on)
  }

  function setMood(next: MonstriqueMood): void {
    mood.value = next
    player?.setMood(next)
  }

  function play(cues: readonly MonstriqueCue[]): void {
    if (cues.length) player?.play(cues)
  }

  function setHidden(hidden: boolean): void {
    player?.setHidden(hidden)
  }

  function stop(): void {
    player?.dispose()
    player = null
    unlocked.value = false
  }

  return {
    mix,
    unlocked,
    enabled,
    mood,
    loadMix,
    setMix,
    resetMix,
    unlock,
    setEnabled,
    setMood,
    play,
    setHidden,
    stop,
  }
})
