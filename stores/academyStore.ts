// /stores/academyStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  academyStyles,
  academyStylesBySlug,
  academyTimeline,
} from '@/stores/seeds/academyStyles'
import type { AcademyStyle } from '@/stores/seeds/academyStyles'

const storageKey = 'kindRobotsAcademyState'
const isClient = typeof window !== 'undefined'

interface AcademyPersistedState {
  viewedLessons: string[]
  remixedStyles: string[]
  selectedStyleSlug: string | null
}

export const useAcademyStore = defineStore('academyStore', () => {
  const selectedStyleSlug = ref<string | null>(null)
  const viewedLessons = ref<string[]>([])
  const remixedStyles = ref<string[]>([])
  const hasHydrated = ref(false)

  const styles = computed<AcademyStyle[]>(() => academyStyles)
  const timeline = computed<AcademyStyle[]>(() => academyTimeline)

  const selectedStyle = computed<AcademyStyle | null>(() => {
    if (!selectedStyleSlug.value) return null
    return academyStylesBySlug[selectedStyleSlug.value] ?? null
  })

  const lessonsViewedCount = computed(() => viewedLessons.value.length)
  const stylesRemixedCount = computed(() => remixedStyles.value.length)

  function hydrate() {
    if (!isClient || hasHydrated.value) return
    hasHydrated.value = true

    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return

      const parsed = JSON.parse(raw) as Partial<AcademyPersistedState>

      if (Array.isArray(parsed.viewedLessons)) {
        viewedLessons.value = parsed.viewedLessons.filter(
          (slug): slug is string =>
            typeof slug === 'string' && slug in academyStylesBySlug,
        )
      }

      if (Array.isArray(parsed.remixedStyles)) {
        remixedStyles.value = parsed.remixedStyles.filter(
          (slug): slug is string =>
            typeof slug === 'string' && slug in academyStylesBySlug,
        )
      }

      if (
        typeof parsed.selectedStyleSlug === 'string' &&
        parsed.selectedStyleSlug in academyStylesBySlug
      ) {
        selectedStyleSlug.value = parsed.selectedStyleSlug
      }
    } catch (error) {
      console.warn('[academyStore] hydrate failed:', error)
    }
  }

  function persist() {
    if (!isClient) return

    const payload: AcademyPersistedState = {
      viewedLessons: viewedLessons.value,
      remixedStyles: remixedStyles.value,
      selectedStyleSlug: selectedStyleSlug.value,
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch (error) {
      console.warn('[academyStore] persist failed:', error)
    }
  }

  function selectStyle(slug: string | null) {
    selectedStyleSlug.value = slug && slug in academyStylesBySlug ? slug : null
    persist()
  }

  function markLessonViewed(slug: string) {
    if (!(slug in academyStylesBySlug)) return
    if (!viewedLessons.value.includes(slug)) {
      viewedLessons.value = [...viewedLessons.value, slug]
      persist()
    }
  }

  function markStyleRemixed(slug: string) {
    if (!(slug in academyStylesBySlug)) return
    if (!remixedStyles.value.includes(slug)) {
      remixedStyles.value = [...remixedStyles.value, slug]
      persist()
    }
  }

  return {
    styles,
    timeline,
    selectedStyleSlug,
    selectedStyle,
    viewedLessons,
    remixedStyles,
    lessonsViewedCount,
    stylesRemixedCount,
    hydrate,
    selectStyle,
    markLessonViewed,
    markStyleRemixed,
  }
})
