import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  DEFAULT_TACTICS_MIX,
  TACTICS_MIX_KEY,
  TacticsSound,
  parseTacticsMix,
  type TacticsCue,
  type TacticsMix,
  type TacticsMood,
} from '~/utils/everyVillainTactics/sound'

function readMix(): TacticsMix {
  if (typeof window === 'undefined') return { ...DEFAULT_TACTICS_MIX }
  try {
    return parseTacticsMix(window.localStorage.getItem(TACTICS_MIX_KEY))
  } catch {
    return { ...DEFAULT_TACTICS_MIX }
  }
}

function persistMix(mix: TacticsMix): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TACTICS_MIX_KEY, JSON.stringify(mix))
  } catch {
    // Private browsing can disable storage; keep the current session's mix.
  }
}

/** One gesture-unlocked, route-scoped WebAudio player for game and settings. */
export const useEveryVillainSoundStore = defineStore('everyVillainSound', () => {
  const mix = ref<TacticsMix>(readMix())
  const unlocked = ref(false)
  let player: TacticsSound | null = null

  function engine(): TacticsSound {
    if (!player) {
      player = new TacticsSound()
      player.setMix(mix.value)
    }
    return player
  }

  function loadMix(): void {
    mix.value = readMix()
    player?.setMix(mix.value)
  }

  function setMix(patch: Partial<TacticsMix>): void {
    mix.value = parseTacticsMix({ ...mix.value, ...patch })
    persistMix(mix.value)
    player?.setMix(mix.value)
  }

  function resetMix(): void {
    setMix({ ...DEFAULT_TACTICS_MIX })
  }

  function unlock(): void {
    if (typeof window === 'undefined') return
    unlocked.value = engine().unlock()
  }

  function setMood(mood: TacticsMood): void {
    engine().setMood(mood)
  }

  function play(cues: readonly TacticsCue[]): void {
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
    resetMix,
    unlock,
    setMood,
    play,
    setHidden,
    stop,
  }
})
