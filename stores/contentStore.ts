// /stores/contentStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Page {
  _id?: string
  _path?: string
  title?: string
  room?: string
  subtitle?: string
  description?: string
  layout?: string
  image?: string
  gallery?: string
  tags?: string[]
  icon?: string
  tooltip?: string
  amiold?: string
  category?: string
  sort?: string
  dottitip?: string
  amitip?: string
  navComponent?: string
  underConstruction?: boolean
  [key: string]: unknown
}

export const useContentStore = defineStore('contentStore', () => {
  const page = ref<Page>({} as Page)
  const pages = ref<Page[]>([])

  const showTooltip = ref(true)
  const showAmitip = ref(false)
  const showInfo = ref(true)

  const sidebarStatus = ref<'open' | 'close' | 'icon'>(
    typeof window !== 'undefined' && localStorage.getItem('sidebarStatus')
      ? (localStorage.getItem('sidebarStatus') as 'open' | 'close' | 'icon')
      : 'open',
  )

  const sidebarOrientation = ref<'vertical' | 'horizontal'>(
    typeof window !== 'undefined' && localStorage.getItem('sidebarOrientation')
      ? (localStorage.getItem('sidebarOrientation') as
          | 'vertical'
          | 'horizontal')
      : 'vertical',
  )

  const highlightPages = computed(() =>
    pages.value.filter((p) => p.sort === 'highlight'),
  )

  const underConstructionPages = computed(() =>
    pages.value.filter((p) => p.sort === 'underConstruction'),
  )

  const currentPage = computed(() => page.value)

  const isSidebarOpen = computed(() => sidebarStatus.value === 'open')
  const isSidebarClosed = computed(() => sidebarStatus.value === 'close')

  const pagesByTagAndSort = computed(() => {
    return (tag: string, sort: string): Page[] =>
      pages.value.filter(
        (page) => page.tags?.includes(tag) && page.sort === sort,
      )
  })

  function toggleSidebar() {
    sidebarStatus.value = sidebarStatus.value === 'open' ? 'close' : 'open'
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarStatus', sidebarStatus.value)
    }
  }

  function setSidebarOrientation(orientation: 'vertical' | 'horizontal') {
    sidebarOrientation.value = orientation
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOrientation', orientation)
    }
  }

  function setSidebarStatus(status: 'open' | 'close' | 'icon') {
    sidebarStatus.value = status
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarStatus', status)
    }
  }

  function toggleInfo() {
    showInfo.value = !showInfo.value
  }

  return {
    page,
    pages,
    showTooltip,
    showAmitip,
    showInfo,
    sidebarStatus,
    sidebarOrientation,
    highlightPages,
    underConstructionPages,
    currentPage,
    isSidebarOpen,
    isSidebarClosed,
    pagesByTagAndSort,
    toggleSidebar,
    setSidebarOrientation,
    setSidebarStatus,
    toggleInfo,
  }
})
