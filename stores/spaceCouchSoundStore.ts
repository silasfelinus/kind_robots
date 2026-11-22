/**
 * Space Couch's audio (conductor game-of-captains t-046): the music/effects
 * mix saved on this device, and the one `CouchSound` player every Space Couch
 * screen shares. The Playbook Kit's Sound setting is the master switch; the
 * notes and cue rules live in `utils/gameOfCaptains/sound.ts`. Browsers keep
 * audio silent until a tap or key press, so `unlock()` is called from one.
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  COUCH_MIX_KEY,
  CouchSound,
  parseCouchMix,
  type CouchCue,
  type CouchMix,
  type CouchMood,
} from '~/utils/gameOfCaptains/sound'

function readMix(): CouchMix {
  if (typeof window === 'undefined') return parseCouchMix(null)
  try {
    return parseCouchMix(window.localStorage.getItem(COUCH_MIX_KEY))
  } catch {
    return parseCouchMix(null)
  }
}

function writeMix(mix: CouchMix): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(COUCH_MIX_KEY, JSON.stringify(mix))
  } catch {
    // Storage can be disabled; the mix still holds for this visit.
  }
}

export const useSpaceCouchSoundStore = defineStore('spaceCouchSound', () => {
  const mix = ref<CouchMix>(readMix())
  const unlocked = ref(false)
  let player: CouchSound | null = null

  function engine(): CouchSound | null {
    if (typeof window === 'undefined') return null
    if (!player) {
      player = new CouchSound()
      player.setMix(mix.value)
    }
    return player
  }

  function setMix(next: Partial<CouchMix>) {
    mix.value = parseCouchMix(JSON.stringify({ ...mix.value, ...next }))
    writeMix(mix.value)
    engine()?.setMix(mix.value)
  }

  function unlock() {
    const p = engine()
    if (!p) return
    p.unlock()
    unlocked.value = p.unlocked
  }

  function setEnabled(on: boolean) {
    engine()?.setEnabled(on)
  }

  function setMood(mood: CouchMood) {
    engine()?.setMood(mood)
  }

  function play(cues: readonly CouchCue[]) {
    if (cues.length) engine()?.play(cues)
  }

  function setHidden(hidden: boolean) {
    player?.setHidden(hidden)
  }

  function stop() {
    player?.dispose()
    player = null
    unlocked.value = false
  }

  return {
    mix,
    unlocked,
    setMix,
    unlock,
    setEnabled,
    setMood,
    play,
    setHidden,
    stop,
  }
})
