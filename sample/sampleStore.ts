// @ts-nocheck
/* eslint-disable */
// test-ignore

//stores/[model]Store.ts
import { defineStore } from 'pinia'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { SampleModel } from '@prisma/client'

export interface SampleModelForm extends Partial<SampleModel> {}

export const useSampleModelStore = defineStore('sampleModelStore', {
  state: () => ({
    items: [] as SampleModel[],
    selected: null as SampleModel | null,
    form: {} as SampleModelForm,
    isSaving: false,
    isInitialized: false,
    loading: false,
  }),

  getters: {
    ownedItems(): SampleModel[] {
      const user = useUserStore().user
      return this.items.filter((i) => i.userId === user?.id)
    },
  },

  actions: {
    async initialize() {
      if (this.isInitialized) return

      try {
        const localItems = localStorage.getItem('sampleModels')
        const localForm = localStorage.getItem('sampleModelForm')

        if (localItems) this.items = JSON.parse(localItems)
        if (localForm) this.form = JSON.parse(localForm)

        const fetched = await this.fetchAll()
        const fetchedIds = new Set(fetched.map((i) => i.id))

        this.items = [
          ...this.items.filter((i) => !fetchedIds.has(i.id)),
          ...fetched,
        ]

        this.syncToLocalStorage()
        this.isInitialized = true
      } catch (error) {
        handleError(error, 'initializing sampleModel store')
      }
    },

    syncToLocalStorage() {
      try {
        localStorage.setItem('sampleModels', JSON.stringify(this.items))
        localStorage.setItem('sampleModelForm', JSON.stringify(this.form))
      } catch (error) {
        console.error('[sampleModelStore] localStorage sync error:', error)
      }
    },

    async fetchAll(): Promise<SampleModel[]> {
      this.loading = true
      try {
        const res = await performFetch<SampleModel[]>('/api/sampleModels')
        if (res.success && res.data) {
          this.items = res.data
          this.syncToLocalStorage()
          return res.data
        } else {
          throw new Error(res.message || 'Failed to fetch sampleModels')
        }
      } catch (error) {
        handleError(error, 'fetching sampleModels')
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchById(id: number): Promise<SampleModel | null> {
      try {
        const res = await performFetch<SampleModel>(`/api/sampleModels/${id}`)
        if (res.success && res.data) return res.data
        throw new Error(res.message)
      } catch (error) {
        handleError(error, 'fetching sampleModel by ID')
        return null
      }
    },

    async create(payload: Partial<SampleModel>) {
      this.isSaving = true
      try {
        const res = await performFetch('/api/sampleModels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.success) throw new Error(res.message)
        this.items.push(res.data)
        this.syncToLocalStorage()
        return { success: true, data: res.data }
      } catch (error) {
        handleError(error, 'creating sampleModel')
        return { success: false, message: (error as Error).message }
      } finally {
        this.isSaving = false
      }
    },

    async update(id: number, updates: Partial<SampleModel>) {
      this.isSaving = true
      try {
        const res = await performFetch(`/api/sampleModels/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!res.success) throw new Error(res.message)
        const index = this.items.findIndex((i) => i.id === id)
        if (index !== -1) this.items[index] = res.data
        this.syncToLocalStorage()
        return { success: true, data: res.data }
      } catch (error) {
        handleError(error, 'updating sampleModel')
        return { success: false, message: (error as Error).message }
      } finally {
        this.isSaving = false
      }
    },

    async delete(id: number) {
      try {
        const res = await performFetch(`/api/sampleModels/${id}`, {
          method: 'DELETE',
        })

        if (res.success) {
          this.items = this.items.filter((i) => i.id !== id)
          if (this.selected?.id === id) this.deselect()
          this.syncToLocalStorage()
        } else {
          throw new Error(res.message)
        }
      } catch (error) {
        handleError(error, 'deleting sampleModel')
      }
    },

    select(id: number) {
      const item = this.items.find((i) => i.id === id)
      if (item) {
        this.selected = item
        this.form = { ...item }
      }
    },

    deselect() {
      this.selected = null
      this.form = {}
    },

    createNew() {
      this.form = {
        title: '',
        type: '',
        // other defaults...
      }
      this.selected = null
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
        handleError(error, 'saving sampleModel')
        return { success: false, message: (error as Error).message }
      } finally {
        this.isSaving = false
      }
    },
  },
})

export type { SampleModel }
