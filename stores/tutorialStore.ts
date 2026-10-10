// /stores/tutorialStore.ts
import { defineStore } from 'pinia'

const STORAGE_KEY = 'kindrobots:tutorial-state:v1'
const SEEN_PAGES_STORAGE_KEY = 'kindrobots:tutorial-seen-pages:v1'

export type TutorialChannelKey = string

type TutorialState = {
  showByChannel: Record<TutorialChannelKey, boolean>
  activeChannel: TutorialChannelKey | null
  seenPages: Record<string, true>
  hydrated: boolean
}

export function tutorialPageKey(channelKey: string, tabKey: string): string {
  const channel = channelKey.trim()
  const tab = tabKey.trim()
  return channel && tab ? `${channel}/${tab}` : ''
}

function defaultShowMap(): Record<TutorialChannelKey, boolean> {
  return {}
}

export const useTutorialStore = defineStore('tutorialStore', {
  state: (): TutorialState => ({
    showByChannel: defaultShowMap(),
    activeChannel: null,
    seenPages: {},
    hydrated: false,
  }),

  getters: {
    shouldAutoShow:
      (state) =>
      (channel: TutorialChannelKey): boolean =>
        state.showByChannel[channel] ?? true,

    isOpen: (state): boolean => state.activeChannel !== null,

    isPageUnseen:
      (state) =>
      (pageKey: string): boolean =>
        state.hydrated && Boolean(pageKey) && !state.seenPages[pageKey],
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

      try {
        const raw = window.localStorage.getItem(SEEN_PAGES_STORAGE_KEY)
        const parsed: unknown = raw ? JSON.parse(raw) : []
        if (Array.isArray(parsed)) {
          const next: Record<string, true> = {}
          for (const key of parsed) {
            if (typeof key === 'string' && key.trim()) next[key] = true
          }
          this.seenPages = next
        }
      } catch {
        this.seenPages = {}
      }

      this.hydrated = true
    },

    markPageSeen(pageKey: string) {
      if (!pageKey || this.seenPages[pageKey]) return
      this.seenPages = { ...this.seenPages, [pageKey]: true }

      if (typeof window === 'undefined') return
      try {
        window.localStorage.setItem(
          SEEN_PAGES_STORAGE_KEY,
          JSON.stringify(Object.keys(this.seenPages)),
        )
      } catch {
        return
      }
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
      this.seenPages = {}
      try {
        window.localStorage.removeItem(SEEN_PAGES_STORAGE_KEY)
      } catch {
        return
      }
    },
  },
})