// /stores/tutorialStore.ts
import { defineStore } from 'pinia'
import { tutorialChannelKeys } from './helpers/tutorialCards'

const STORAGE_KEY = 'kindrobots:tutorial-state:v1'

export type TutorialChannelKey = string

type TutorialState = {
  showByChannel: Record<TutorialChannelKey, boolean>
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
    shouldAutoShow:
      (state) =>
      (channel: TutorialChannelKey): boolean =>
        state.showByChannel[channel] ?? true,

    isOpen: (state): boolean => state.activeChannel !== null,
  },

  actions: {
    hydrate() {
      if (this.hydrated) return
      if (typeof window === 'undefined') return

      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Record<string, boolean>>
          const next = defaultShowMap()

          for (const [key, value] of Object.entries(parsed)) {
            if (key.trim() && typeof value === 'boolean') {
              next[key] = value
            }
          }

          this.showByChannel = next
        }
      } catch {}

      this.hydrated = true
    },

    syncToLocalStorage() {
      if (typeof window === 'undefined') return

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(this.showByChannel),
        )
      } catch {}
    },

    open(channel: TutorialChannelKey) {
      this.hydrate()
      this.activeChannel = channel
    },

    close() {
      this.activeChannel = null
    },

    maybeAutoOpen(channel: TutorialChannelKey): boolean {
      this.hydrate()

      if (this.shouldAutoShow(channel)) {
        this.activeChannel = channel
        return true
      }

      return false
    },

    setShowForChannel(channel: TutorialChannelKey, show: boolean) {
      this.showByChannel = { ...this.showByChannel, [channel]: show }
      this.syncToLocalStorage()
    },

    dismissChannel(channel: TutorialChannelKey) {
      this.setShowForChannel(channel, false)
    },

    resetAll() {
      this.showByChannel = defaultShowMap()
      this.syncToLocalStorage()
    },
  },
})
