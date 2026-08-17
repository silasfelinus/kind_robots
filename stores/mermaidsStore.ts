import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/userStore'

const STORAGE_KEY = 'kindrobots:mermaids-page-draft:v1'
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

export const useMermaidsStore = defineStore('mermaidsStore', () => {
  const userStore = useUserStore()
  const draft = ref<MermaidsPageDraft>(freshDefaults())
  const loaded = ref(false)
  const saving = ref(false)
  const savedAt = ref<Date | null>(null)
  const lastError = ref<string | null>(null)
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  const saveStatus = computed(() => {
    if (lastError.value) return lastError.value
    if (saving.value) return 'Saving draft…'
    if (savedAt.value) return `Saved ${savedAt.value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    return 'Draft not saved yet'
  })

  function loadDraft(): void {
    if (loaded.value || !import.meta.client) return

    lastError.value = null
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) draft.value = normalizeDraft(JSON.parse(stored))
      loaded.value = true
    } catch (error) {
      loaded.value = true
      lastError.value =
        error instanceof Error ? error.message : 'Could not load the Mermaids draft.'
    }
  }

  function saveDraft(): void {
    if (!import.meta.client || !userStore.isAdmin) return

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft.value))
      savedAt.value = new Date()
      lastError.value = null
    } catch (error) {
      lastError.value =
        error instanceof Error ? error.message : 'Could not save the Mermaids draft.'
    } finally {
      saving.value = false
    }
  }

  function scheduleSave(): void {
    if (!loaded.value || !import.meta.client || !userStore.isAdmin) return
    if (saveTimer) clearTimeout(saveTimer)
    saving.value = true
    saveTimer = setTimeout(saveDraft, SAVE_DELAY_MS)
  }

  function resetDraft(): void {
    if (!userStore.isAdmin) return
    draft.value = freshDefaults()
    scheduleSave()
  }

  watch(draft, scheduleSave, { deep: true })

  return {
    draft,
    loaded,
    saving,
    savedAt,
    lastError,
    saveStatus,
    loadDraft,
    saveDraft,
    resetDraft,
  }
})
