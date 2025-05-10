// /stores/iconStore.ts
import { defineStore } from 'pinia'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { SmartIcon } from '@prisma/client'
import { swarmMessages } from '@/stores/seeds/swarmMessages'

export interface SmartIconForm extends Partial<SmartIcon> {}

export const useIconStore = defineStore('iconStore', {
  state: () => ({
    icons: [] as SmartIcon[],
    selectedIcon: null as SmartIcon | null,
    iconForm: {} as SmartIconForm,
    isSaving: false,
    isInitialized: false,
    loading: false,
    defaultIconIds: [1, 2, 3, 4, 5, 6, 7, 8],
    isEditing: false,
    showSwarm: false,
    swarmMessage: '',
  }),

  getters: {
    customIconsEnabled(): boolean {
      return useUserStore().user?.customIcons ?? false
    },
    smartBarIds(): number[] {
      const raw = useUserStore().user?.smartBar
      return (
        raw
          ?.split(',')
          .map(Number)
          .filter((n) => !isNaN(n)) ?? []
      )
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

        const fetched = await this.fetchIcons()
        const fetchedIds = new Set(fetched.map((i) => i.id))
        this.icons = [
          ...this.icons.filter((i) => !fetchedIds.has(i.id)),
          ...fetched,
        ]
        this.syncToLocalStorage()
        this.isInitialized = true
      } catch (error) {
        handleError(error, 'initializing smartIcon store')
      }
    },
    toggleEditing() {
      this.isEditing = !this.isEditing
    },
    toggleSwarm() {
      this.showSwarm = !this.showSwarm
      if (this.showSwarm) {
        const randomIndex = Math.floor(Math.random() * swarmMessages.length)
        this.swarmMessage = swarmMessages[randomIndex]
      }
    },

    syncToLocalStorage() {
      try {
        localStorage.setItem('smartIcons', JSON.stringify(this.icons))
        localStorage.setItem('smartIconForm', JSON.stringify(this.iconForm))
      } catch (e) {
        console.warn('localStorage sync failed:', e)
      }
    },

    async fetchIcons(): Promise<SmartIcon[]> {
      this.loading = true
      try {
        const res = await performFetch<SmartIcon[]>('/api/icons')
        if (res.success && res.data) {
          this.icons = res.data
          this.syncToLocalStorage()
          return res.data
        }
        throw new Error(res.message || 'Failed to fetch icons.')
      } catch (e) {
        handleError(e, 'fetching icons')
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchIconById(id: number): Promise<SmartIcon | null> {
      try {
        const res = await performFetch<SmartIcon>(`/api/icons/${id}`)
        const icon = res.success ? (res.data ?? null) : null
        return icon
      } catch (e) {
        handleError(e, 'fetch icon by ID')
        return null
      }
    },
    patchIconLocally(id: number, updates: Partial<SmartIcon>) {
      const icon = this.icons.find((i) => i.id === id)
      if (!icon) return
      Object.assign(icon, updates)
      this.syncToLocalStorage()
    },

    async updateIcon(id: number, updates: Partial<SmartIcon>) {
      this.patchIconLocally(id, updates)
      try {
        const res = await performFetch(`/api/icons/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!res.success) throw new Error(res.message || 'Failed to update.')
        return { success: true, data: res.data }
      } catch (e) {
        handleError(e, 'updating icon')
        return { success: false, message: (e as Error).message }
      }
    },

    async createIcon(payload: Partial<SmartIcon>) {
      try {
        const res = await performFetch('/api/icons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.success) throw new Error(res.message || 'Failed to create.')
        this.icons.push(res.data as SmartIcon)
        this.syncToLocalStorage()
        return { success: true, data: res.data }
      } catch (e) {
        handleError(e, 'creating icon')
        return { success: false, message: (e as Error).message }
      }
    },

    async deleteIcon(id: number) {
      this.icons = this.icons.filter((i) => i.id !== id)
      this.syncToLocalStorage()
      try {
        const res = await performFetch(`/api/icons/${id}`, { method: 'DELETE' })
        if (!res.success) throw new Error(res.message || 'Delete failed.')
        return true
      } catch (e) {
        handleError(e, 'deleting icon')
        return false
      }
    },

    async saveIcon() {
      if (!this.iconForm) return { success: false, message: 'No icon form.' }
      if (this.iconForm.id) {
        return await this.updateIcon(this.iconForm.id, this.iconForm)
      } else {
        return await this.createIcon(this.iconForm)
      }
    },

    async updateSmartBar(ids: number[]) {
      const userStore = useUserStore()
      const user = userStore.user
      if (!user) return

      const smartBar = ids.join(',')
      user.smartBar = smartBar
      user.customIcons = true
      try {
        await userStore.updateUser({ smartBar, customIcons: true })
      } catch (e) {
        handleError(e, 'saving smartBar')
      }
    },

    async toggleCustomIcons(enabled: boolean) {
      const user = useUserStore().user
      if (!user) return
      user.customIcons = enabled
      try {
        await useUserStore().updateUser({ customIcons: enabled })
      } catch (e) {
        handleError(e, 'toggle customIcons')
      }
    },

    setIconOrder(ids: number[]) {
      this.updateSmartBar(ids)
    },

    addIconToSmartBar(id: number) {
      const ids = [...this.smartBarIds, id]
      this.updateSmartBar(ids)
    },

    removeIconFromSmartBar(id: number) {
      const ids = this.smartBarIds.filter((existing) => existing !== id)
      this.updateSmartBar(ids)
    },

    selectIcon(iconId: number) {
      const icon = this.icons.find((i) => i.id === iconId)
      if (icon) {
        this.selectedIcon = icon
        this.iconForm = { ...icon }
      }
    },

    deselectIcon() {
      this.selectedIcon = null
      this.iconForm = {}
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
  },
})

export type { SmartIcon }
