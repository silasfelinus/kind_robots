// utils/emperorOfDust/audio/useEmperorAudio.ts
//
// Wires Emperor of Dust's sound to the page (conductor emperor-of-dust t-073)
// by watching state, so neither the engine nor the store ever calls it:
//
//   - the theme follows the page (title, room, dawn report, act, ending) and
//     crossfades when it changes;
//   - effects come from a pure diff of the run before and after each change
//     (./cues.ts), from the store's save/load/rewind/answer actions, and from
//     Emperor achievements as the achievement store is asked to award them;
//   - any other button in the game gives a dry click, unless something better
//     answered the same press.
//
// Nothing starts until the player's first press or key (and never while the
// settings say mute). Client only: on the server this does nothing.

import { onBeforeUnmount, onMounted, watch } from 'vue'
import type { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { useAchievementStore } from '~/stores/achievementStore'
import { emperorCuesFor, emperorRunJumped } from './cues'
import {
  emperorCueKey,
  emperorMusicCueFor,
  type EmperorMusicState,
} from './music'
import { emperorAudioLevels, readEmperorAudioPrefs } from './prefs'
import { EmperorSound } from './player'
import type { EmperorSfxName } from './sfx'

type FortressStore = ReturnType<typeof useEmperorFortressStore>

export type EmperorAudioOptions = {
  court: FortressStore
  /** Where the player is, for the theme. */
  music: () => EmperorMusicState
  /** The current room id, for the tab-select effect. */
  room: () => string
  /** The night (the dawn report) or the reign's end: the wind drops. */
  night: () => boolean
}

/** Same-name effects closer together than this are merged into one. */
const REPEAT_GAP_MS: Partial<Record<EmperorSfxName, number>> = {
  achievement: 2500,
  dawnBell: 1500,
  brassGain: 150,
  brassSpend: 150,
}

const CONFIRM_ACTIONS = new Set([
  'answer',
  'talk',
  'answerChanceEvent',
  'challengeReport',
])
const JUMP_ACTIONS = new Set([
  'loadFromSlot',
  'rewind',
  'newRun',
  'resetProgress',
])

export function useEmperorAudio(options: EmperorAudioOptions): void {
  const { court } = options
  let sound: EmperorSound | null = null
  let gestured = false
  let jumping = false
  let wasMuted = false
  let pendingClick: ReturnType<typeof setTimeout> | null = null
  const lastPlayed = new Map<EmperorSfxName, number>()
  const chimed = new Set<string>()
  const cleanups: (() => void)[] = []

  const prefs = () => readEmperorAudioPrefs(court.preferences)
  const levels = () => emperorAudioLevels(prefs())
  const cue = () => emperorMusicCueFor(options.music())
  const ambience = () => ({
    night: options.night(),
    hideout: !!court.run?.hideout && (court.run?.day ?? 0) > 40,
  })

  function cancelClick() {
    if (pendingClick) clearTimeout(pendingClick)
    pendingClick = null
  }

  function fire(name: EmperorSfxName, delay = 0) {
    cancelClick()
    if (!sound?.running) return
    const now = Date.now()
    const gap = REPEAT_GAP_MS[name] ?? 90
    if (now - (lastPlayed.get(name) ?? 0) < gap) return
    lastPlayed.set(name, now)
    sound.play(name, delay)
  }

  /** A run of effects, spaced so each is heard; a bell gets room to ring. */
  function fireAll(names: EmperorSfxName[]) {
    let delay = 0
    for (const name of names) {
      fire(name, delay)
      delay += name === 'dawnBell' || name === 'betrayal' ? 1.1 : 0.4
    }
  }

  function start() {
    if (!gestured || prefs().muted) return
    if (!sound) sound = new EmperorSound()
    if (!sound.start(levels())) return
    sound.setAmbience(ambience())
    sound.playMusic(cue())
  }

  function onGesture() {
    if (gestured) return
    gestured = true
    window.removeEventListener('pointerdown', onGesture, true)
    window.removeEventListener('keydown', onGesture, true)
    start()
  }

  /** Any button in the game: a click, unless something else answers it. */
  function onClick(event: MouseEvent) {
    const target = event.target as Element | null
    const control = target?.closest?.(
      'button, a[href], [role="button"], [role="tab"], input[type="checkbox"], input[type="radio"]',
    )
    if (!control || !control.closest('.eod')) return
    if ((control as HTMLButtonElement).disabled) return
    cancelClick()
    pendingClick = setTimeout(() => {
      pendingClick = null
      fire('click')
    }, 0)
  }

  function onVisibility() {
    if (!sound) return
    if (document.hidden) sound.pause()
    else if (gestured && !prefs().muted) sound.resume()
  }

  onMounted(() => {
    if (!EmperorSound.available) return
    window.addEventListener('pointerdown', onGesture, true)
    window.addEventListener('keydown', onGesture, true)
    document.addEventListener('click', onClick, true)
    document.addEventListener('visibilitychange', onVisibility)
    cleanups.push(() => {
      window.removeEventListener('pointerdown', onGesture, true)
      window.removeEventListener('keydown', onGesture, true)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('visibilitychange', onVisibility)
    })

    cleanups.push(
      watch(
        () => JSON.stringify(levels()),
        () => {
          if (prefs().muted) {
            wasMuted = true
            sound?.stop()
            return
          }
          if (sound?.running && !wasMuted) sound.setLevels(levels())
          else start()
          wasMuted = false
        },
      ),
    )
    cleanups.push(
      watch(
        () => emperorCueKey(cue()),
        () => sound?.playMusic(cue()),
      ),
    )
    cleanups.push(
      watch(
        () => JSON.stringify(ambience()),
        () => sound?.setAmbience(ambience()),
      ),
    )
    cleanups.push(
      watch(options.room, () => {
        // Only a room the player chose; the page moving them is silent.
        if (pendingClick) fire('select')
      }),
    )
    cleanups.push(
      watch(
        () => court.run,
        (next, prev) => {
          if (jumping || emperorRunJumped(prev, next)) return
          fireAll(emperorCuesFor(prev, next))
        },
      ),
    )
    cleanups.push(
      court.$onAction(({ name, after, onError }) => {
        if (JUMP_ACTIONS.has(name)) {
          jumping = true
          const settle = () => setTimeout(() => (jumping = false), 0)
          after(() => {
            fire(
              name === 'newRun' || name === 'resetProgress'
                ? 'confirm'
                : 'load',
            )
            settle()
          })
          onError(settle)
        } else if (name === 'saveToSlot') after(() => fire('save'))
        else if (CONFIRM_ACTIONS.has(name)) after(() => fire('confirm'))
      }),
    )
    try {
      const achievements = useAchievementStore()
      cleanups.push(
        achievements.$onAction(({ name, args, after }) => {
          if (name !== 'rewardAchievementByCode') return
          const code = String(args[0] ?? '')
          if (!code.startsWith('emperor-of-dust') || chimed.has(code)) return
          if (achievements.hasEarnedCode(code)) return
          chimed.add(code)
          after(() => fire('achievement', 0.9))
        }),
      )
    } catch {
      // No achievement store (a stripped-down harness): no chime.
    }
  })

  onBeforeUnmount(() => {
    cancelClick()
    for (const cleanup of cleanups.splice(0)) cleanup()
    sound?.dispose()
    sound = null
  })
}
