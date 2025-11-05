// /stores/navStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSmartbarStore } from '@/stores/smartbarStore'
import { usePageStore } from '@/stores/pageStore'

export type NavViewMode = 'favorites' | 'suggested' | 'model' | 'all'

export const useNavStore = defineStore('navStore', () => {
  const smartbarStore = useSmartbarStore()
  const pageStore = usePageStore()

  // All nav-capable SmartIcons
  const allNavIcons = computed(() =>
    smartbarStore.icons.filter((icon) => icon.type === 'nav'),
  )

  const viewMode = ref<NavViewMode>('suggested')

  // Separate favorites for navs, local only for now
  const navFavoriteIds = ref<number[]>([])

  // Active nav is by SmartIcon id, derived from page meta when unset
  const manualNavId = ref<number | null>(null)

  const activeNavIcon = computed({
    get() {
      if (manualNavId.value != null) {
        return allNavIcons.value.find((i) => i.id === manualNavId.value) ?? null
      }

      const cmp = pageStore.page?.navComponent?.trim()
      if (!cmp) return null

      return (
        allNavIcons.value.find(
          (i) => i.component === cmp || i.label === cmp || i.title === cmp,
        ) ?? null
      )
    },
    set(icon) {
      manualNavId.value = icon?.id ?? null
    },
  })

  const favoriteNavs = computed(() =>
    allNavIcons.value.filter((i) => navFavoriteIds.value.includes(i.id)),
  )

  const suggestedNavs = computed(() => {
    const primary = activeNavIcon.value
    if (!primary)
      return favoriteNavs.value.length ? favoriteNavs.value : allNavIcons.value

    const siblings = allNavIcons.value.filter(
      (i) =>
        i.category && i.category === primary.category && i.id !== primary.id,
    )

    return [primary, ...siblings]
  })

  const modelNavs = computed(() => {
    const modelType =
      (pageStore.page as any)?.modelType ??
      (pageStore.page as any)?.model ??
      null

    if (!modelType) return suggestedNavs.value

    const matches = allNavIcons.value.filter((i) => i.modelType === modelType)
    return matches.length ? matches : suggestedNavs.value
  })

  const visibleNavs = computed(() => {
    switch (viewMode.value) {
      case 'favorites':
        return favoriteNavs.value.length
          ? favoriteNavs.value
          : suggestedNavs.value
      case 'model':
        return modelNavs.value
      case 'all':
        return allNavIcons.value
      case 'suggested':
      default:
        return suggestedNavs.value
    }
  })

  function setViewMode(mode: NavViewMode) {
    viewMode.value = mode
  }

  function setActiveNavById(id: number) {
    manualNavId.value = id
  }

  function toggleFavorite(id: number) {
    const list = navFavoriteIds.value
    const idx = list.indexOf(id)
    if (idx >= 0) list.splice(idx, 1)
    else list.push(id)
  }

  function resetToPageDefault() {
    manualNavId.value = null
  }

  return {
    viewMode,
    allNavIcons,
    activeNavIcon,
    visibleNavs,
    favoriteNavs,
    modelNavs,
    suggestedNavs,
    navFavoriteIds,
    setViewMode,
    setActiveNavById,
    toggleFavorite,
    resetToPageDefault,
  }
})
