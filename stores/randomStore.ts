// /stores/randomStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch, type WatchStopHandle } from 'vue'
import type { Dream } from '~/prisma/generated/prisma/client'

import { useUserStore } from './userStore'
import { useArtStore } from './artStore'
import { handleError, performFetch } from './utils'

import { artListPresets } from '@/stores/seeds/artList'
import {
  getRandom,
  supportedKeys,
  getAllPresetLists,
} from './helpers/randomHelper'
import type { RandomListItem } from './helpers/randomHelper'

type PerformFetchResult<T> = {
  success: boolean
  data?: T
  message?: string
  statusCode?: number
}

type RandomListDream = Dream & {
  examples?: string | null
}

const isClient = typeof window !== 'undefined'

function isRandomListDream(dream: Pick<Dream, 'dreamType'>): boolean {
  return dream.dreamType === 'BRAINSTORM'
}

function safeParseStringArray(value: unknown): string[] {
  if (typeof value !== 'string') return []

  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (v): v is string => typeof v === 'string' && v.trim().length > 0,
    )
  } catch {
    return []
  }
}

function stringifyExamples(values: string[]): string {
  return JSON.stringify(
    values.map((value) => value.trim()).filter((value) => value.length > 0),
  )
}

function dreamToRandomListItem(dream: RandomListDream): RandomListItem {
  const examplesJson = dream.examples || dream.pitch || '[]'
  const content = safeParseStringArray(examplesJson)

  return {
    id: dream.id,
    source: 'user',
    title: dream.title || `Random List #${dream.id}`,
    content,
    examplesJson,
    userId: dream.userId,
    isPublic: dream.isPublic,
    isMature: dream.isMature,
  } as RandomListItem
}

export const useRandomStore = defineStore('randomStore', () => {
  const userStore = useUserStore()
  const artStore = useArtStore()

  const initialized = ref(false)
  const randomSelections = ref<Record<string, string>>({})
  const randomLists = ref<RandomListDream[]>([])
  const presetLists = ref<RandomListItem[]>(getAllPresetLists(artListPresets))
  const randomListsLoaded = ref(false)
  const fetchRandomListsPromise = ref<Promise<void> | null>(null)

  let randomSelectionsWatcher: WatchStopHandle | null = null

  const filteredLists = computed<RandomListItem[]>(() => {
    const userLists = (
      Array.isArray(randomLists.value) ? randomLists.value : []
    )
      .filter((dream: RandomListDream) => {
        const isOwner = dream.userId === userStore.userId
        const isVisible = dream.isPublic || isOwner
        const maturityOk = userStore.showMature || !dream.isMature
        return isRandomListDream(dream) && isVisible && maturityOk
      })
      .map(dreamToRandomListItem)

    return [...presetLists.value, ...userLists]
  })

  function pickRandomFromArray(arr: string[], count: number): string[] {
    if (!Array.isArray(arr)) return []
    const shuffled = [...arr].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, arr.length))
  }

  function toggleSelection(key: string) {
    const result = getRandom(key, 1)[0]
    if (!result) return

    if (randomSelections.value[key] === result) {
      const next = getRandom(key, 1)[0]
      if (next) randomSelections.value[key] = next
      return
    }

    randomSelections.value[key] = result
  }

  function clearSelection(key: string) {
    delete randomSelections.value[key]
  }

  function clearAllSelections() {
    randomSelections.value = {}
  }

  function getAllSelections() {
    return randomSelections.value
  }

  function initialize() {
    if (initialized.value) return

    if (isClient) {
      const stored = localStorage.getItem('artRandomizerRandomSelections')
      if (stored) {
        try {
          randomSelections.value = JSON.parse(stored) as Record<string, string>
        } catch (error: unknown) {
          handleError(
            error,
            'Failed to parse randomSelections from localStorage',
          )
        }
      }

      if (!randomSelectionsWatcher) {
        randomSelectionsWatcher = watch(
          randomSelections,
          (val: Record<string, string>) => {
            try {
              localStorage.setItem(
                'artRandomizerRandomSelections',
                JSON.stringify(val),
              )
            } catch (error: unknown) {
              handleError(
                error,
                'Failed to save randomSelections to localStorage',
              )
            }
          },
          { deep: true },
        )
      }
    }

    initialized.value = true
  }

  async function fetchRandomLists(force = false) {
    if (!force && randomListsLoaded.value) return
    if (fetchRandomListsPromise.value) return fetchRandomListsPromise.value

    fetchRandomListsPromise.value = (async () => {
      const res = (await performFetch<RandomListDream[]>(
        '/api/dreams?dreamType=RANDOMLIST',
      )) as PerformFetchResult<RandomListDream[]>

      if (res.success && res.data) {
        randomLists.value = res.data.filter(isRandomListDream)
        randomListsLoaded.value = true
        return
      }

      handleError(
        new Error(res.message || 'Failed to fetch random lists'),
        'fetching random lists',
      )
    })()

    try {
      await fetchRandomListsPromise.value
    } finally {
      fetchRandomListsPromise.value = null
    }
  }

  async function createList(title: string) {
    const examplesJson = '[]'
    const body: Partial<RandomListDream> & Record<string, unknown> = {
      title,
      pitch: examplesJson,
      examples: examplesJson,
      description: 'User-created random list.',
      dreamType: 'BRAINSTORM',
      userId: userStore.userId,
      isPublic: true,
      isMature: false,
      isActive: true,
    }

    const res = (await performFetch<RandomListDream>('/api/dreams', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })) as PerformFetchResult<RandomListDream>

    if (res.success && res.data) {
      randomLists.value.push(res.data)
      return
    }

    handleError(
      new Error(res.message || 'Failed to create list'),
      'creating list',
    )
  }

  async function updateList(dream: RandomListDream) {
    const res = (await performFetch<RandomListDream>(
      `/api/dreams/${dream.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(dream),
        headers: { 'Content-Type': 'application/json' },
      },
    )) as PerformFetchResult<RandomListDream>

    if (res.success && res.data) {
      const idx = randomLists.value.findIndex(
        (entry: RandomListDream) => entry.id === res.data?.id,
      )
      if (idx !== -1) randomLists.value[idx] = res.data
      return
    }

    handleError(
      new Error(res.message || 'Failed to update list'),
      'updating list',
    )
  }

  async function updateListItem(list: RandomListItem) {
    if (list.source !== 'user') return

    const examplesJson = list.examplesJson || stringifyExamples(list.content)
    const body: Partial<RandomListDream> & Record<string, unknown> = {
      id: list.id,
      title: list.title,
      dreamType: 'PITCH',
      userId: list.userId ?? userStore.userId,
      isPublic: list.isPublic,
      isMature: list.isMature,
      pitch: examplesJson,
      examples: examplesJson,
    }

    await updateList(body as RandomListDream)
  }

  async function deleteList(id: number) {
    const res = (await performFetch(`/api/dreams/${id}`, {
      method: 'DELETE',
    })) as PerformFetchResult<unknown>

    if (res.success) {
      randomLists.value = randomLists.value.filter(
        (entry: RandomListDream) => entry.id !== id,
      )
      return
    }

    handleError(
      new Error(res.message || 'Failed to delete list'),
      'deleting list',
    )
  }

  async function generateListItems(id: number) {
    const list = randomLists.value.find((entry) => entry.id === id)
    if (!list) return

    const existing = safeParseStringArray(list.examples || list.pitch)
    const fallbackSource = presetLists.value
      .flatMap((entry) => entry.content || [])
      .filter(Boolean)

    const generated = existing.length
      ? pickRandomFromArray(existing, Math.min(existing.length, 12))
      : pickRandomFromArray(fallbackSource, Math.min(fallbackSource.length, 12))

    const examplesJson = stringifyExamples(generated)

    await updateList({
      ...list,
      examples: examplesJson,
      pitch: examplesJson,
    })
  }

  function resetAll() {
    Object.keys(artStore.artListSelections).forEach((key: string) => {
      artStore.updateArtListSelection(key, [])
    })
    clearAllSelections()
  }

  function applyMakePretty() {
    const pretty = artListPresets.find((p) => p.id === '__pretty__')
    const negative = artListPresets.find((p) => p.id === '__negative__')

    if (pretty) {
      artStore.updateArtListSelection(
        '__pretty__',
        pickRandomFromArray(pretty.content, 4),
      )
    }

    if (negative) {
      artStore.updateArtListSelection(
        '__negative__',
        pickRandomFromArray(negative.content, 4),
      )
    }
  }

  function applySurprise() {
    for (const entry of artListPresets) {
      const values = entry.allowMultiple
        ? pickRandomFromArray(
            entry.content,
            Math.ceil(Math.random() * entry.content.length),
          )
        : pickRandomFromArray(entry.content, 1)

      artStore.updateArtListSelection(entry.id, values)
    }
  }

  function getExamplesForList(list: RandomListItem): string[] {
    return safeParseStringArray(list.examplesJson)
  }

  function setExamplesForList(list: RandomListItem, values: string[]) {
    const cleaned = Array.isArray(values)
      ? values.filter((v) => typeof v === 'string' && v.trim().length > 0)
      : []
    list.examplesJson = stringifyExamples(cleaned)
    list.content = cleaned
  }

  return {
    initialize,
    initialized,
    getRandom,
    supportedKeys,
    pickRandomFromArray,
    toggleSelection,
    clearSelection,
    clearAllSelections,
    getAllSelections,
    applyMakePretty,
    applySurprise,
    resetAll,

    presetLists,
    randomLists,
    filteredLists,
    randomListsLoaded,
    fetchRandomLists,
    createList,
    updateList,
    updateListItem,
    deleteList,
    generateListItems,
    getExamplesForList,
    setExamplesForList,
    randomSelections,
  }
})
