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
  [key: string]: unknown // Use unknown for more type safety
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
    sidebarStatus: typeof window !== 'undefined' && localStorage.getItem('sidebarStatus')
      ? (localStorage.getItem('sidebarStatus') as 'open' | 'close' | 'icon')
      : 'open',
    sidebarOrientation: typeof window !== 'undefined' && localStorage.getItem('sidebarOrientation')
      ? (localStorage.getItem('sidebarOrientation') as 'vertical' | 'horizontal')
      : 'vertical',
  }),
  getters: {
    currentPage: (state) => state.page,
    isSidebarOpen: (state) => state.sidebarStatus === 'open',
    isSidebarClosed: (state) => state.sidebarStatus === 'close',
    // New getter for highlightPages
    highlightPages: (state) => state.pages.filter((page) => page.sort === 'highlight'),
  },
  actions: {
    toggleSidebar() {
      // Toggle between open and close, respecting localStorage
      if (this.sidebarStatus === 'open') {
        this.sidebarStatus = 'close'
      } else {
        this.sidebarStatus = 'open'
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarStatus', this.sidebarStatus)
      }
    },

    setSidebarOrientation(orientation: 'vertical' | 'horizontal') {
      // Update the orientation and save to localStorage
      this.sidebarOrientation = orientation
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarOrientation', orientation)
      }
    },

    // Optionally allow direct setting of the sidebar status for flexibility
    setSidebarStatus(status: 'open' | 'close' | 'icon') {
      this.sidebarStatus = status
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarStatus', status)
      }
    },

    // Add the missing toggleInfo method
    toggleInfo() {
      this.showInfo = !this.showInfo;
    },
  },
})
