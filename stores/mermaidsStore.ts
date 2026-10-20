import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

const LEGACY_STORAGE_KEY = 'kindrobots:mermaids-page-draft:v1'
const PROJECT_KEY = 'mermaids-of-venice'
const PAGE_KEY = 'landing'
const CONTENT_ENDPOINT = `/api/admin/project-page-content/${PROJECT_KEY}?page=${PAGE_KEY}`
const SAVE_DELAY_MS = 450

export type MermaidsPageDraft = {
  heroTitle: string
  heroSubtitle: string
  bookHeading: string
  bookDescription: string
  amazonLabel: string
  signedCopiesNote: string
  personalNoteHeading: string
  personalNote: string
  aiNoteHeading: string
  aiNote: string
}

type ProjectPageContentResponse = {
  projectId: number
  projectKey: string
  pageKey: string
  content: string | null
  updatedAt: string | null
  updatedById: number | null
}

export const MERMAIDS_PAGE_DEFAULTS: Readonly<MermaidsPageDraft> = {
  heroTitle: 'Mermaids of Venice',
  heroSubtitle: 'A subversive tale of gods and street performers — by Silas Knight',
  bookHeading: 'The Book',
  bookDescription:
    "In the canals and campos of Venice, old gods get by the way anyone does — busking, bargaining, and performing for a crowd that no longer believes in them. Six years in the writing, edited by the author's own hand.",
  amazonLabel: 'Paperback on Amazon',
  signedCopiesNote:
    'Signed copies appear in the Kind Robots giftshop when the tide is right.',
  personalNoteHeading: 'A Note From Silas',
  personalNote:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat — Silas's real note will replace this placeholder soon.",
  aiNoteHeading: 'A Note About AI (Written by One)',
  aiNote:
    'No AI was used to write this book — other than the words that make up this paragraph. Every other sentence was hand-carved by one stubborn human across six years of drafts, which makes this paragraph the only artificial thing on the premises. It is aware of the irony: a machine vouching for the authenticity of a story about gods passing themselves off as street performers. Originality is a strange gate to keep. But somebody has to stand on this side of it and wave you through to the real thing.',
}

function freshDefaults(): MermaidsPageDraft {
  return { ...MERMAIDS_PAGE_DEFAULTS }
}

function normalizeDraft(value: unknown): MermaidsPageDraft {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  const defaults = freshDefaults()
  for (const key of Object.keys(defaults) as Array<keyof MermaidsPageDraft>) {
    if (typeof source[key] === 'string') defaults[key] = source[key]
  }

  return defaults
}

function parseDraft(serialized: string): MermaidsPageDraft {
  return normalizeDraft(JSON.parse(serialized))
}

function readLegacyDraft(): MermaidsPageDraft | null {
  if (!import.meta.client) return null
  try {
    const serialized = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    return serialized ? parseDraft(serialized) : null
  } catch {
    return null
  }
}

function removeLegacyDraft(): void {
  if (!import.meta.client) return
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // A browser refusing localStorage cleanup is harmless once the server copy exists.
  }
}

export const useMermaidsStore = defineStore('mermaidsStore', () => {
  const userStore = useUserStore()
  const draft = ref<MermaidsPageDraft>(freshDefaults())
  const loaded = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const savedAt = ref<Date | null>(null)
  const lastError = ref<string | null>(null)
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  const saveStatus = computed(() => {
    if (loading.value) return 'Loading site copy…'
    if (lastError.value) return lastError.value
    if (saving.value) return 'Saving to site…'
    if (savedAt.value) {
      return `Saved site-wide ${savedAt.value.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })}`
    }
    if (loaded.value) return 'Site copy ready'
    return 'Waiting for site copy…'
  })

  async function persistDraft(): Promise<boolean> {
    if (!import.meta.client || !userStore.isAdmin || !loaded.value) return false

    saving.value = true
    try {
      const response = await performFetch<ProjectPageContentResponse>(
        CONTENT_ENDPOINT,
        {
          method: 'PUT',
          cache: 'no-store',
          body: JSON.stringify({ content: JSON.stringify(draft.value) }),
        },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Could not save the Mermaids page.')
      }

      savedAt.value = response.data.updatedAt
        ? new Date(response.data.updatedAt)
        : new Date()
      lastError.value = null
      removeLegacyDraft()
      return true
    } catch (error) {
      lastError.value =
        error instanceof Error
          ? `Save failed: ${error.message}`
          : 'Save failed: could not update the Mermaids page.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function loadDraft(force = false): Promise<void> {
    if ((!force && loaded.value) || loading.value || !import.meta.client) return
    if (!userStore.isAdmin) return

    loading.value = true
    lastError.value = null
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }

    try {
      const response = await performFetch<ProjectPageContentResponse>(
        CONTENT_ENDPOINT,
        { cache: 'no-store' },
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Could not load the Mermaids page.')
      }

      if (response.data.content) {
        try {
          draft.value = parseDraft(response.data.content)
        } catch {
          throw new Error('The saved Mermaids page copy is not valid JSON.')
        }
        loaded.value = true
        savedAt.value = response.data.updatedAt
          ? new Date(response.data.updatedAt)
          : null
        removeLegacyDraft()
        return
      }

      // PR #1920 briefly stored the writing desk only in this browser. If that
      // draft exists and no server copy exists yet, promote it once so the user
      // does not lose work during the migration to durable site content.
      const legacyDraft = readLegacyDraft()
      draft.value = legacyDraft ?? freshDefaults()
      loaded.value = true

      if (legacyDraft) {
        await persistDraft()
      }
    } catch (error) {
      loaded.value = false
      lastError.value =
        error instanceof Error
          ? `Load failed: ${error.message}`
          : 'Load failed: could not fetch the Mermaids page.'
    } finally {
      loading.value = false
    }
  }

  function scheduleSave(): void {
    if (!loaded.value || !import.meta.client || !userStore.isAdmin) return
    if (saveTimer) clearTimeout(saveTimer)
    saving.value = true
    saveTimer = setTimeout(() => {
      saveTimer = null
      void persistDraft()
    }, SAVE_DELAY_MS)
  }

  function resetDraft(): void {
    if (!userStore.isAdmin || !loaded.value) return
    draft.value = freshDefaults()
  }

  // Synchronous flush keeps server hydration from being mistaken for a user
  // edit: loadDraft assigns draft while `loaded` is still false, so only actual
  // post-load edits enter the autosave debounce.
  watch(draft, scheduleSave, { deep: true, flush: 'sync' })

  return {
    draft,
    loaded,
    loading,
    saving,
    savedAt,
    lastError,
    saveStatus,
    loadDraft,
    saveDraft: persistDraft,
    resetDraft,
  }
})
