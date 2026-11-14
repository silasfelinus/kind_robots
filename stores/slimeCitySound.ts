/**
 * Slime City's audio: the on/off choices (all sound, music, effects), saved on
 * this device, and the one synth every Slime City screen plays through. The
 * notes themselves live in `utils/slimeCity/sound.ts`; browsers keep audio
 * silent until the first tap or key press, so `attach()` waits for one.
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { createArcadeSound, type ArcadeSound } from '~/utils/arcade/sound'
import {
  SLIME_MUSIC,
  parseSlimeAudioPrefs,
  slimeCueSequence,
  type SlimeAudioPrefs,
  type SlimeCue,
  type SlimeMusic,
} from '~/utils/slimeCity/sound'

const PREFS_KEY = 'kr-slime-city-audio-v1'

function readPrefs(): SlimeAudioPrefs {
  if (typeof window === 'undefined') return parseSlimeAudioPrefs(null)
  try {
    return parseSlimeAudioPrefs(
      JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? 'null'),
    )
  } catch {
    return parseSlimeAudioPrefs(null)
  }
}

function writePrefs(prefs: SlimeAudioPrefs): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Storage can be disabled; the choice still holds for this visit.
  }
}

const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const

export const useSlimeCitySoundStore = defineStore('slimeCitySound', () => {
  const sound = ref(true)
  const music = ref(true)
  const effects = ref(true)
  const loaded = ref(false)
  const scene = ref<SlimeMusic | null>(null)
  const unlocked = ref(false)
  /** A fight is on and a boss is low: BATTLE gives way to SHOWDOWN. */
  const tense = ref(false)

  let engine: ArcadeSound | null = null
  let playing: SlimeMusic | null = null
  let attached = 0

  function load(): void {
    if (loaded.value) return
    const prefs = readPrefs()
    sound.value = prefs.sound
    music.value = prefs.music
    effects.value = prefs.effects
    loaded.value = true
  }

  function save(): void {
    writePrefs({
      version: 1,
      sound: sound.value,
      music: music.value,
      effects: effects.value,
    })
  }

  function syncMusic(): void {
    if (!engine) return
    const want = sound.value && music.value ? scene.value : null
    if (want === playing) return
    playing = want
    if (want) engine.startMusic(SLIME_MUSIC[want])
    else engine.stopMusic()
  }

  function unlock(): void {
    if (typeof window === 'undefined') return
    engine ??= createArcadeSound()
    engine.unlock()
    if (!unlocked.value) {
      unlocked.value = true
      for (const name of UNLOCK_EVENTS)
        window.removeEventListener(name, unlock, true)
    }
    syncMusic()
  }

  /** A Slime City screen mounted: load the choices and wait for a gesture. */
  function attach(): void {
    load()
    attached += 1
    if (typeof window === 'undefined' || unlocked.value) return
    for (const name of UNLOCK_EVENTS)
      window.addEventListener(name, unlock, { capture: true, passive: true })
  }

  /** The last Slime City screen left: silence and release the synth. */
  function detach(): void {
    attached = Math.max(0, attached - 1)
    if (attached > 0) return
    scene.value = null
    tense.value = false
    playing = null
    engine?.dispose()
    engine = null
    unlocked.value = false
    if (typeof window !== 'undefined')
      for (const name of UNLOCK_EVENTS)
        window.removeEventListener(name, unlock, true)
  }

  /** Which loop the current screen wants; null is silence. */
  function setScene(next: SlimeMusic | null): void {
    scene.value = next
    syncMusic()
  }

  /** Play effect cues in order (nothing while sound or effects are off). */
  function cue(cues: SlimeCue | readonly SlimeCue[]): void {
    if (!engine || !sound.value || !effects.value) return
    const list = typeof cues === 'string' ? [cues] : cues
    if (list.length) engine.playNotes(slimeCueSequence(list))
  }

  function setTense(value: boolean): void {
    tense.value = value
  }

  function setSound(value: boolean): void {
    sound.value = value
    save()
    syncMusic()
  }
  function setMusic(value: boolean): void {
    music.value = value
    save()
    syncMusic()
  }
  function setEffects(value: boolean): void {
    effects.value = value
    save()
  }
  function toggleSound(): void {
    setSound(!sound.value)
    if (sound.value) cue('select')
  }

  return {
    sound,
    music,
    effects,
    loaded,
    scene,
    unlocked,
    tense,
    attach,
    detach,
    unlock,
    setScene,
    setTense,
    cue,
    setSound,
    setMusic,
    setEffects,
    toggleSound,
  }
})
