import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from './utils'
import type {
  MandarinCurationPayload,
  MandarinCurationRow,
  MandarinCurationUpdate,
} from '@/types/mandarinCuration'

export type MandarinCurationSort = 'hanzi' | 'pinyin' | 'meaning' | 'hsk'

export type MandarinCurationDraft = {
  traditional: string
  pinyin: string
  meaning: string
  meaningsText: string
  usageNote: string
  categoriesText: string
  note: string
}

function editableCategories(categories: string[]): string[] {
  return categories.filter(
    (category) => category !== 'beginner' && !/^hsk-\d+$/i.test(category),
  )
}

function draftFromRow(row: MandarinCurationRow): MandarinCurationDraft {
  return {
    traditional: row.effective.traditional,
    pinyin: row.effective.pinyin,
    meaning: row.effective.meaning,
    meaningsText: row.effective.meanings.join('\n'),
    usageNote: row.effective.usageNote,
    categoriesText: editableCategories(row.effective.categories).join(', '),
    note: '',
  }
}

function splitMeanings(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12)
}

function splitCategories(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 40)
}

export const useMandarinCurationStore = defineStore(
  'mandarinCurationStore',
  () => {
    const payload = ref<MandarinCurationPayload | null>(null)
    const loading = ref(false)
    const saving = ref(false)
    const error = ref('')
    const notice = ref('')
    const search = ref('')
    const categoryFilter = ref('all')
    const hskFilter = ref<'all' | '1' | '2'>('all')
    const sortKey = ref<MandarinCurationSort>('hsk')
    const overrideOnly = ref(false)
    const selectedCardKey = ref<string | null>(null)
    const draft = ref<MandarinCurationDraft | null>(null)

    const selectedRow = computed(
      () =>
        payload.value?.rows.find(
          (row) => row.cardKey === selectedCardKey.value,
        ) ?? null,
    )

    const visibleRows = computed(() => {
      const query = search.value.trim().toLowerCase()
      const rows = (payload.value?.rows ?? []).filter((row) => {
        if (overrideOnly.value && !row.hasOverride) return false
        if (
          hskFilter.value !== 'all' &&
          row.effective.hskLevel !== Number(hskFilter.value)
        ) {
          return false
        }
        if (
          categoryFilter.value !== 'all' &&
          !row.effective.categories.includes(categoryFilter.value)
        ) {
          return false
        }
        if (!query) return true
        return [
          row.effective.simplified,
          row.effective.traditional,
          row.effective.pinyin,
          row.effective.meaning,
          ...row.effective.meanings,
          ...row.effective.categories,
          row.effective.sourceLabel,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      })

      return [...rows].sort((a, b) => {
        if (sortKey.value === 'hanzi') {
          return a.effective.simplified.localeCompare(
            b.effective.simplified,
            'zh-Hans',
          )
        }
        if (sortKey.value === 'pinyin') {
          return a.effective.pinyin.localeCompare(b.effective.pinyin)
        }
        if (sortKey.value === 'meaning') {
          return a.effective.meaning.localeCompare(b.effective.meaning)
        }
        const levelA = a.effective.hskLevel ?? 99
        const levelB = b.effective.hskLevel ?? 99
        if (levelA !== levelB) return levelA - levelB
        return (a.effective.frequency ?? 1_000_000) -
          (b.effective.frequency ?? 1_000_000)
      })
    })

    async function load() {
      if (loading.value) return
      loading.value = true
      error.value = ''
      try {
        const response = await performFetch<MandarinCurationPayload>(
          '/api/admin/curation-studio/mandarin',
          {},
          1,
          45_000,
        )
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load Mandarin curation.')
        }
        payload.value = response.data
        if (
          selectedCardKey.value &&
          !response.data.rows.some(
            (row) => row.cardKey === selectedCardKey.value,
          )
        ) {
          selectedCardKey.value = null
          draft.value = null
        }
      } catch (cause) {
        error.value =
          cause instanceof Error
            ? cause.message
            : 'Failed to load Mandarin curation.'
      } finally {
        loading.value = false
      }
    }

    function selectCard(cardKey: string) {
      const row = payload.value?.rows.find(
        (candidate) => candidate.cardKey === cardKey,
      )
      if (!row) return
      selectedCardKey.value = cardKey
      draft.value = draftFromRow(row)
      notice.value = ''
      error.value = ''
    }

    function closeEditor() {
      selectedCardKey.value = null
      draft.value = null
    }

    function resetDraftToSource() {
      const row = selectedRow.value
      if (!row) return
      draft.value = {
        traditional: row.source.traditional,
        pinyin: row.source.pinyin,
        meaning: row.source.meaning,
        meaningsText: row.source.meanings.join('\n'),
        usageNote: '',
        categoriesText: editableCategories(row.source.categories).join(', '),
        note: 'Restore the learner-facing entry to the immutable source values.',
      }
    }

    async function saveSelected(): Promise<boolean> {
      const row = selectedRow.value
      const currentDraft = draft.value
      if (!row || !currentDraft || saving.value) return false
      saving.value = true
      error.value = ''
      notice.value = ''
      try {
        const body: MandarinCurationUpdate = {
          cardKey: row.cardKey,
          traditional: currentDraft.traditional,
          pinyin: currentDraft.pinyin,
          meaning: currentDraft.meaning,
          meanings: splitMeanings(currentDraft.meaningsText),
          usageNote: currentDraft.usageNote,
          categories: splitCategories(currentDraft.categoriesText),
          note: currentDraft.note,
        }
        const response = await performFetch<MandarinCurationRow>(
          '/api/admin/curation-studio/mandarin',
          {
            method: 'POST',
            body: JSON.stringify(body),
          },
          1,
          30_000,
        )
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to save Mandarin curation.')
        }

        if (payload.value) {
          const index = payload.value.rows.findIndex(
            (candidate) => candidate.cardKey === row.cardKey,
          )
          if (index >= 0) payload.value.rows.splice(index, 1, response.data)
          payload.value.categories = [
            ...new Set(
              payload.value.rows.flatMap(
                (candidate) => candidate.effective.categories,
              ),
            ),
          ].sort((a, b) => a.localeCompare(b))
          payload.value.editableCategories = payload.value.categories.filter(
            (category) =>
              category !== 'beginner' && !/^hsk-\d+$/i.test(category),
          )
          payload.value.stats.overridden = payload.value.rows.filter(
            (candidate) => candidate.hasOverride,
          ).length
        }
        draft.value = draftFromRow(response.data)
        notice.value = response.message || 'Mandarin catalog change saved.'
        return true
      } catch (cause) {
        error.value =
          cause instanceof Error
            ? cause.message
            : 'Failed to save Mandarin curation.'
        return false
      } finally {
        saving.value = false
      }
    }

    return {
      payload,
      loading,
      saving,
      error,
      notice,
      search,
      categoryFilter,
      hskFilter,
      sortKey,
      overrideOnly,
      selectedCardKey,
      draft,
      selectedRow,
      visibleRows,
      load,
      selectCard,
      closeEditor,
      resetDraftToSource,
      saveSelected,
    }
  },
)
