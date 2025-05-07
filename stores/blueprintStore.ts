// /stores/blueprintStore.ts
import { defineStore } from 'pinia'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { Blueprint, SupportedModel } from '@prisma/client'

export interface BlueprintForm extends Partial<Blueprint> {
  coverArtId?: number | null
  tags?: number[]
  steps?: any
  designer?: string
}

export type SupportedModel =
  | 'Pitch'
  | 'Character'
  | 'Bot'
  | 'Scenario'
  | 'Reward'
  | 'Blueprint'

export const useBlueprintStore = defineStore('blueprintStore', {
  state: () => ({
    items: [] as Blueprint[],
    selectedItem: null as Blueprint | null,
    form: {} as BlueprintForm,
    isSaving: false,
    isInitialized: false,
    loading: false,
  }),

  getters: {
    ownedItems(): Blueprint[] {
      const user = useUserStore().user
      return this.items.filter((b) => b.userId === user?.id)
    },
  },

  actions: {
    async initialize() {
      if (this.isInitialized) return
      try {
        const localItems = localStorage.getItem('blueprints')
        const localForm = localStorage.getItem('blueprintForm')
        if (localItems) this.items = JSON.parse(localItems)
        if (localForm) this.form = JSON.parse(localForm)

        const fetched = await this.fetchAll()
        const fetchedIds = new Set(fetched.map((b) => b.id))
        this.items = [
          ...this.items.filter((b) => !fetchedIds.has(b.id)),
          ...fetched,
        ]

        this.syncToLocalStorage()
        this.isInitialized = true
      } catch (error) {
        handleError(error, 'initializing blueprint store')
      }
    },

    syncToLocalStorage() {
      try {
        localStorage.setItem('blueprints', JSON.stringify(this.items))
        localStorage.setItem('blueprintForm', JSON.stringify(this.form))
      } catch (error) {
        console.error('[blueprintStore] localStorage sync error:', error)
      }
    },

    async fetchAll(): Promise<Blueprint[]> {
      this.loading = true
      try {
        const res = await performFetch<Blueprint[]>('/api/blueprints')
        if (res.success && res.data) {
          this.items = res.data as Blueprint[]
          this.syncToLocalStorage()
          return this.items
        } else {
          throw new Error(res.message || 'Failed to fetch blueprints')
        }
      } catch (error) {
        handleError(error, 'fetching blueprints')
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchById(id: number): Promise<Blueprint | null> {
      try {
        const res = await performFetch<Blueprint>(`/api/blueprints/${id}`)
        if (res.success && res.data) return res.data as Blueprint
        throw new Error(res.message)
      } catch (error) {
        handleError(error, 'fetching blueprint by ID')
        return null
      }
    },

    async create(payload: Partial<BlueprintForm>) {
      this.isSaving = true
      try {
        const res = await performFetch('/api/blueprints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.success) throw new Error(res.message)
        this.items.push(res.data as Blueprint)
        this.syncToLocalStorage()
        return { success: true, data: res.data }
      } catch (error) {
        handleError(error, 'creating blueprint')
        return { success: false, message: (error as Error).message }
      } finally {
        this.isSaving = false
      }
    },

    async update(id: number, updates: Partial<BlueprintForm>) {
      this.isSaving = true
      try {
        const res = await performFetch(`/api/blueprints/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!res.success) throw new Error(res.message)
        const index = this.items.findIndex((b) => b.id === id)
        if (index !== -1) this.items[index] = res.data as Blueprint
        this.syncToLocalStorage()
        return { success: true, data: res.data }
      } catch (error) {
        handleError(error, 'updating blueprint')
        return { success: false, message: (error as Error).message }
      } finally {
        this.isSaving = false
      }
    },

    async delete(id: number) {
      try {
        const res = await performFetch(`/api/blueprints/${id}`, {
          method: 'DELETE',
        })

        if (res.success) {
          this.items = this.items.filter((b) => b.id !== id)
          if (this.selectedItem?.id === id) this.deselect()
          this.syncToLocalStorage()
        } else {
          throw new Error(res.message)
        }
      } catch (error) {
        handleError(error, 'deleting blueprint')
      }
    },

    select(id: number) {
      const item = this.items.find((b) => b.id === id)
      if (item) {
        this.selectedItem = item
        this.form = {
          ...item,
          coverArtId: item.coverArtId ?? undefined,
          tags: [],
          steps: item.steps ?? [],
        }
      }
    },

    deselect() {
      this.selectedItem = null
      this.form = {}
    },

    createNew() {
      this.form = {
        title: '',
        description: '',
        steps: [],
        tags: [],
        coverArtId: null,
        isPublic: true,
        isMature: false,
      }
      this.selectedItem = null
      this.syncToLocalStorage()
    },

    async save() {
      if (!this.form) return { success: false, message: 'No form loaded.' }

      this.isSaving = true
      try {
        if (this.form.id) {
          return await this.update(this.form.id, this.form)
        } else {
          return await this.create(this.form)
        }
      } catch (error) {
        handleError(error, 'saving blueprint')
        return { success: false, message: (error as Error).message }
      } finally {
        this.isSaving = false
      }
    },
  },
})

export type { Blueprint }
