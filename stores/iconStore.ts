// /stores/smartIconStore.ts
import { defineStore } from 'pinia'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { SmartIcon } from '@prisma/client'

export interface SmartIconForm extends Partial<SmartIcon> {}

export const useSmartIconStore = defineStore('smartIconStore', {
  state: () => ({
    icons: [] as SmartIcon[],
    selectedIcon: null as SmartIcon | null,
    iconForm: {} as SmartIconForm,
    isSaving: false,
    isInitialized: false,
    loading: false,
    defaultIconIds: [1, 2, 3], // Replace with real default IDs
  }),

  getters: {
    customIconsEnabled(): boolean {
      const user = useUserStore().user
      return user?.customIcons ?? false
    },
    smartBarIds(): number[] {
      const user = useUserStore().user
      const raw = user?.smartBar
      if (!raw) return []
      return raw
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n))
    },
    activeIcons(): SmartIcon[] {
      const ids = this.customIconsEnabled
        ? this.smartBarIds
        : this.defaultIconIds
      return ids
        .map((id) => this.icons.find((i) => i.id === id))
        .filter(Boolean) as SmartIcon[]
    },
  },

  actions: {
    async initialize() {
      if (this.isInitialized) return

      try {
        const savedIcons = localStorage.getItem('smartIcons')
        const savedForm = localStorage.getItem('smartIconForm')

        if (savedIcons) this.icons = JSON.parse(savedIcons)
        if (savedForm) this.iconForm = JSON.parse(savedForm)

        const fetchedIcons = await this.fetchIcons()
        const fetchedIds = new Set(fetchedIcons.map((i) => i.id))

        this.icons = [
          ...this.icons.filter((i) => !fetchedIds.has(i.id)),
          ...fetchedIcons,
        ]

        this.syncToLocalStorage()
        this.isInitialized = true
      } catch (error) {
        handleError(error, 'initializing smartIcon store')
      }
    },

    syncToLocalStorage() {
      try {
        localStorage.setItem('smartIcons', JSON.stringify(this.icons))
        localStorage.setItem('smartIconForm', JSON.stringify(this.iconForm))
      } catch (error) {
        console.error('Error syncing SmartIcons to localStorage:', error)
      }
    },

    async fetchIcons(): Promise<SmartIcon[]> {
      this.loading = true
      try {
        const response = await performFetch<SmartIcon[]>('/api/icons')
        if (response.success && response.data) {
          this.icons = response.data
          this.syncToLocalStorage()
          return response.data
        } else {
          throw new Error(response.message || 'Failed to fetch SmartIcons.')
        }
      } catch (error) {
        handleError(error, 'fetching SmartIcons')
        return []
      } finally {
        this.loading = false
      }
    },

    async updateSmartBar(ids: number[]) {
      const userStore = useUserStore()
      const user = userStore.user
      if (!user) return

      try {
        const smartBar = ids.join(',')
        await userStore.updateUser({ smartBar, customIcons: true })
        user.smartBar = smartBar
        user.customIcons = true
      } catch (error) {
        handleError(error, 'updating smartBar')
      }
    },

    async toggleCustomIcons(enabled: boolean) {
      const userStore = useUserStore()
      const user = userStore.user
      if (!user) return

      try {
        await userStore.updateUser({ customIcons: enabled })
        user.customIcons = enabled
      } catch (error) {
        handleError(error, 'toggling customIcons')
      }
    },

    async selectIcon(iconId: number) {
      const icon = this.icons.find((i) => i.id === iconId)
      if (!icon) {
        console.warn(`SmartIcon with ID ${iconId} not found.`)
        return
      }
      this.selectedIcon = icon
      this.iconForm = { ...icon }
    },

    deselectIcon() {
      this.selectedIcon = null
      this.iconForm = {}
    },

    async createIcon(payload: Partial<SmartIcon>) {
      this.isSaving = true
      try {
        const response = await performFetch('/api/icons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.success) {
          throw new Error(response.message || 'Failed to create SmartIcon.')
        }

        console.log('[smartIconStore] Created new SmartIcon:', response.data)
        return { success: true, data: response.data }
      } catch (error) {
        handleError(error, 'creating SmartIcon')
        return { success: false, message: (error as Error).message }
      } finally {
        this.isSaving = false
      }
    },

    async updateIcon(id: number, updates: Partial<SmartIcon>) {
      this.isSaving = true
      try {
        const response = await performFetch(`/api/icons/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!response.success) {
          throw new Error(response.message || 'Failed to update SmartIcon.')
        }

        console.log('[smartIconStore] Updated SmartIcon ID:', id)
        return { success: true, data: response.data }
      } catch (error) {
        handleError(error, 'updating SmartIcon')
        return { success: false, message: (error as Error).message }
      } finally {
        this.isSaving = false
      }
    },

    createNewIcon() {
      this.iconForm = {
        title: '',
        type: '',
        icon: '',
        label: '',
        link: '',
        component: '',
        isPublic: true,
      }
      this.selectedIcon = null
      this.syncToLocalStorage()
    },

    async saveIcon() {
      if (!this.iconForm) {
        console.warn('[smartIconStore] No iconForm loaded.')
        return { success: false, message: 'No icon form loaded.' }
      }

      this.isSaving = true

      try {
        if (this.iconForm.id) {
          console.log('[smartIconStore] Updating existing SmartIcon.')
          return await this.updateIcon(this.iconForm.id, this.iconForm)
        } else {
          console.log('[smartIconStore] Creating new SmartIcon.')
          return await this.createIcon(this.iconForm)
        }
      } catch (error) {
        handleError(error, 'saving SmartIcon')
        return { success: false, message: (error as Error).message }
      } finally {
        this.isSaving = false
      }
    },

    async deleteIcon(id: number) {
      try {
        const response = await performFetch(`/api/icons/${id}`, {
          method: 'DELETE',
        })

        if (response.success) {
          this.icons = this.icons.filter((i) => i.id !== id)
          if (this.selectedIcon?.id === id) this.deselectIcon()
          this.syncToLocalStorage()
        } else {
          throw new Error(response.message || 'Failed to delete SmartIcon.')
        }
      } catch (error) {
        handleError(error, 'deleting SmartIcon')
      }
    },

    async fetchIconById(id: number): Promise<SmartIcon | null> {
      try {
        const response = await performFetch<SmartIcon>(`/api/icons/${id}`)
        if (response.success && response.data) {
          return response.data
        } else {
          throw new Error(response.message || 'Failed to fetch SmartIcon.')
        }
      } catch (error) {
        handleError(error, 'fetching SmartIcon by ID')
        return null
      }
    },
  },
})

export type { SmartIcon }
