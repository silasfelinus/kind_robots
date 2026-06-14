// /stores/tutorialStore.ts
//
// Single owner of "should the tutorial popup auto-open for this channel?"
// state. The map is keyed by FooterKey. true = still show on visit (unchecked
// "don't show again"); false = dismissed.
//
// Pattern notes (matches the rest of the project):
//  - State holder only; components read computed/getters, never localStorage.
//  - Mutations call syncToLocalStorage() immediately after changing state.
//  - useStore() is called lazily inside function bodies where needed.

import { defineStore } from 'pinia'
import {
  type TutorialChannelKey,
  tutorialChannelKeys,
  isTutorialChannelKey,
} from './helpers/tutorialCards'

const STORAGE_KEY = 'kindrobots:tutorial-state:v1'

type TutorialState = {
  // For each channel: true = auto-show tutorial, false = user dismissed it.
  showByChannel: Record<TutorialChannelKey, boolean>
  // Whether the popup is currently open, and for which channel.
  activeChannel: TutorialChannelKey | null
  hydrated: boolean
}

function defaultShowMap(): Record<TutorialChannelKey, boolean> {
  return Object.fromEntries(
    tutorialChannelKeys.map((key) => [key, true]),
  ) as Record<TutorialChannelKey, boolean>
}

export const useTutorialStore = defineStore('tutorialStore', {
  state: (): TutorialState => ({
    showByChannel: defaultShowMap(),
    activeChannel: null,
    hydrated: false,
  }),

  getters: {
    // Should the tutorial auto-open when the user lands on this channel?
    shouldAutoShow:
      (state) =>
      (channel: TutorialChannelKey): boolean =>
        state.showByChannel[channel] ?? true,

    isOpen: (state): boolean => state.activeChannel !== null,
  },

  actions: {
    // Pull persisted dismissals out of localStorage. Safe to call repeatedly;
    // no-ops after the first successful hydrate and on the server.
    hydrate() {
      if (this.hydrated) return
      if (typeof window === 'undefined') return

      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Record<string, boolean>>
          const next = defaultShowMap()
          for (const [key, value] of Object.entries(parsed)) {
            if (isTutorialChannelKey(key) && typeof value === 'boolean') {
              next[key] = value
            }
          }
          this.showByChannel = next
        }
      } catch {
        // Corrupt or unavailable storage — keep defaults, don't throw.
      }

      this.hydrated = true
    },

    syncToLocalStorage() {
      if (typeof window === 'undefined') return
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(this.showByChannel),
        )
      } catch {
        // Storage full or blocked — degrade quietly.
      }
    },

    // Open the popup for a channel. Used both for manual opens (the "?" button)
    // and auto-opens on first visit.
    open(channel: TutorialChannelKey) {
      this.hydrate()
      this.activeChannel = channel
    },

    close() {
      this.activeChannel = null
    },

    // Call on channel entry. Opens the tutorial only if the user hasn't
    // dismissed it. Returns whether it opened, in case the caller cares.
    maybeAutoOpen(channel: TutorialChannelKey): boolean {
      this.hydrate()
      if (this.shouldAutoShow(channel)) {
        this.activeChannel = channel
        return true
      }
      return false
    },

    // Toggle the "don't show this again" preference for a channel.
    // show=true means keep auto-showing; show=false means dismiss.
    setShowForChannel(channel: TutorialChannelKey, show: boolean) {
      this.showByChannel = { ...this.showByChannel, [channel]: show }
      this.syncToLocalStorage()
    },

    dismissChannel(channel: TutorialChannelKey) {
      this.setShowForChannel(channel, false)
    },

    // Re-enable every tutorial (handy for a "replay tutorials" settings button).
    resetAll() {
      this.showByChannel = defaultShowMap()
      this.syncToLocalStorage()
    },
  },
})
