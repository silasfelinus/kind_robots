import { defineStore } from 'pinia'

export interface Page {
  _id?: string
  _path?: string
  title?: string
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
  underConstruction?: boolean
  [key: string]: unknown // For type safety
}

interface ContentState {
  page: Page
  pages: Page[]
  showTooltip: boolean
  showAmitip: boolean
  showInfo: boolean
  sidebarStatus: 'open' | 'close' | 'icon'
  sidebarOrientation: 'vertical' | 'horizontal'
}

export const useContentStore = defineStore({
  id: 'content',
  state: (): ContentState => ({
    page: {} as Page,
    pages: [] as Page[],
    showTooltip: true,
    showAmitip: false,
    showInfo: true,
    sidebarStatus:
      typeof window !== 'undefined' && localStorage.getItem('sidebarStatus')
        ? (localStorage.getItem('sidebarStatus') as 'open' | 'close' | 'icon')
        : 'open',
    sidebarOrientation:
      typeof window !== 'undefined' &&
      localStorage.getItem('sidebarOrientation')
        ? (localStorage.getItem('sidebarOrientation') as
            | 'vertical'
            | 'horizontal')
        : 'vertical',
  }),
  getters: {
    highlightPages(state): Page[] {
      return state.pages.filter((page) => page.sort === 'highlight')
    },
    underConstructionPages(state): Page[] {
      return state.pages.filter((page) => page.sort === 'underConstruction')
    },
    currentPage: (state): Page => state.page,
    isSidebarOpen: (state): boolean => state.sidebarStatus === 'open',
    isSidebarClosed: (state): boolean => state.sidebarStatus === 'close',

    // Getter for filtering pages by tag and sort
    pagesByTagAndSort:
      (state) =>
      (tag: string, sort: string): Page[] => {
        return state.pages.filter(
          (page) => page.tags?.includes(tag) && page.sort === sort,
        )
      },
  },
  actions: {
    toggleSidebar() {
      this.sidebarStatus = this.sidebarStatus === 'open' ? 'close' : 'open'
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarStatus', this.sidebarStatus)
      }
    },

    setSidebarOrientation(orientation: 'vertical' | 'horizontal') {
      this.sidebarOrientation = orientation
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarOrientation', orientation)
      }
    },

    setSidebarStatus(status: 'open' | 'close' | 'icon') {
      this.sidebarStatus = status
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarStatus', status)
      }
    },

    toggleInfo() {
      this.showInfo = !this.showInfo
    },
    async getPages() {
      try {
        const response = await fetch('/api/pages') // Adjust your API endpoint as needed
        const data = await response.json()
        this.pages = data // Assume the API returns an array of Page objects
      } catch (error) {
        console.error('Failed to fetch pages:', error)
      }
    },
  },
})
