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
    page: {} as Page,  // Ensure page is typed correctly as Page
    pages: [] as Page[],
    showTooltip: true,
    showAmitip: false,
    showInfo: true,
    sidebarStatus: localStorage.getItem('sidebarStatus') as 'open' | 'close' | 'icon' || 'open',
    sidebarOrientation: localStorage.getItem('sidebarOrientation') as 'vertical' | 'horizontal' || 'vertical',
  }),
  getters: {
    currentPage: (state) => state.page,
    isSidebarOpen: (state) => state.sidebarStatus === 'open',
    isSidebarClosed: (state) => state.sidebarStatus === 'close',
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
      localStorage.setItem('sidebarOrientation', orientation)
    },
  },
})
