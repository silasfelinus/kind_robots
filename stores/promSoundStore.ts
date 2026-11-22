import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  DEFAULT_PROM_MIX,
  PROM_MIX_KEY,
  PromSound,
  parsePromMix,
  type PromCue,
  type PromMix,
  type PromMood,
} from '~/utils/cometAcademy/sound'

function storedMix(): PromMix {
  if (typeof window === 'undefined') return { ...DEFAULT_PROM_MIX }
  try {
    return parsePromMix(window.localStorage.getItem(PROM_MIX_KEY))
  } catch {
    return { ...DEFAULT_PROM_MIX }
  }
}

function persistMix(mix: PromMix): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PROM_MIX_KEY, JSON.stringify(mix))
  } catch {
    // Sound controls still work for this visit without local storage.
  }
}

/** Shared by the title, campaign, and settings while the game route is mounted. */
export const usePromSoundStore = defineStore('promSound', () => {
  const mix = ref<PromMix>(storedMix())
  const unlocked = ref(false)
  let player: PromSound | null = null

  function engine(): PromSound {
    if (!player) {
      player = new PromSound()
      player.setMix(mix.value)
    }
    return player
  }

  function loadMix(): void {
    mix.value = storedMix()
    player?.setMix(mix.value)
  }

  function setMix(patch: Partial<PromMix>): void {
    mix.value = parsePromMix({ ...mix.value, ...patch })
    persistMix(mix.value)
    player?.setMix(mix.value)
  }

  function unlock(): void {
    if (typeof window === 'undefined') return
    unlocked.value = engine().unlock()
  }

  function setMood(mood: PromMood): void {
    engine().setMood(mood)
  }

  function play(cues: readonly PromCue[]): void {
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
    loadMix,
    setMix,
    unlock,
    setMood,
    play,
    setHidden,
    stop,
  }
})
