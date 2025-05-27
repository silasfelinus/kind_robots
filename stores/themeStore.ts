// /stores/themeStore.ts

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { Theme } from '@prisma/client'

import {
  buildThemePayload,
  applyThemeValues,
  getThemeValues,
  sanitizeThemeValues,
  extractComputedTheme,
  colorKeys,
  allThemeKeys,
daisyuiThemes,
} from '@/stores/helpers/themeHelpers'

export const useThemeStore = defineStore('themeStore', () => {
  

  const activeTheme = ref<string | Theme>('retro')
  const themeForm = ref<Partial<Theme>>({})
  const sharedThemes = ref<Theme[]>([])

  const currentTheme = computed(() =>
    typeof activeTheme.value === 'string'
      ? activeTheme.value
      : activeTheme.value?.name || 'retro'
  )

  const open = ref(false)
  const showCustom = ref(false)
  const botOverride = ref(true)
  const firstThemeChanged = ref(false)

  function toggleMenu() {
    open.value = !open.value
  }

  function setActiveTheme(input: string | Theme): { success: boolean; message?: string } {
    if (typeof input === 'string') {
      if (!daisyuiThemes.includes(input)) {
        const msg = `[themeStore] Invalid theme name: "${input}" not found in DaisyUI`
        console.warn(msg)
        return { success: false, message: msg }
      }

      document.documentElement.setAttribute('data-theme', input)
      localStorage.setItem('theme', input)
      activeTheme.value = input
      themeForm.value = extractComputedTheme(input)
      firstThemeChanged.value = true
      return { success: true }
    }

    if (typeof input === 'object' && input.values) {
      const values = sanitizeThemeValues(input.values)
      applyThemeValues(values)
      document.documentElement.setAttribute('data-theme', 'custom')
      localStorage.setItem('theme', input.name)
      activeTheme.value = input
      themeForm.value = { ...input }
      firstThemeChanged.value = true
      return { success: true }
    }

    const msg = '[themeStore] Invalid input passed to setActiveTheme'
    console.warn(msg)
    return { success: false, message: msg }
  }

  function updateBotTheme(theme: string) {
    if (botOverride.value) setActiveTheme(theme)
  }

  function setShowCustom(value: boolean) {
    showCustom.value = value
    if (typeof window !== 'undefined') {
      localStorage.setItem('showCustom', String(value))
    }
  }

  function revertForm() {
    if (typeof activeTheme.value === 'object') {
      themeForm.value = { ...activeTheme.value }
    } else {
      themeForm.value = extractComputedTheme()
    }
  }

  function initialize() {
    if (typeof window === 'undefined') return

    try {
      const storedFlag = localStorage.getItem('showCustom')
      if (storedFlag !== null) showCustom.value = storedFlag === 'true'

      const storedTheme = localStorage.getItem('theme') || 'retro'
      const storedForm = localStorage.getItem('themeForm')
      const builtIn = daisyuiThemes.includes(storedTheme)

      if (builtIn) {
        setActiveTheme(storedTheme)
      } else if (storedForm) {
        const parsed = JSON.parse(storedForm)
        if (parsed?.values) setActiveTheme(parsed)
      } else {
        setActiveTheme('retro')
      }

      getThemes()
    } catch (err) {
      console.warn('[themeStore] Failed to initialize themeStore:', err)
      setActiveTheme('retro')
    }
  }

  async function getThemes() {
    const { success, data } = await performFetch<{ themes: Theme[] }>('/api/themes')
    if (success && data?.themes) {
      sharedThemes.value = data.themes
    } else {
      sharedThemes.value = []
      console.warn('[themeStore] No themes found or fetch failed.')
    }
  }

  async function addTheme(theme: Partial<Theme>) {
    const userStore = useUserStore()
    const userId = userStore.user?.id || 10
    const payload = { ...theme, userId }
    const { success } = await performFetch('/api/themes', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (success) await getThemes()
  }

  async function updateTheme(id: number, updates: Partial<Theme>) {
    const userStore = useUserStore()
    const userId = userStore.user?.id
    const payload = { ...updates, userId }
    const { success } = await performFetch(`/api/themes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    if (success) await getThemes()
  }

  async function deleteTheme(id: number) {
    const { success } = await performFetch(`/api/themes/${id}`, {
      method: 'DELETE',
    })
    if (success) await getThemes()
  }

  if (typeof window !== 'undefined') {
    watch(themeForm, (val) => {
      localStorage.setItem('themeForm', JSON.stringify(val))
    }, { deep: true })
  }

  return {
    
    sharedThemes,
    activeTheme,
    currentTheme,
    themeForm,
    open,
    showCustom,
    botOverride,
    firstThemeChanged,

    toggleMenu,
    setActiveTheme,
    updateBotTheme,
    setShowCustom,
    revertForm,
    initialize,

    getThemes,
    addTheme,
    updateTheme,
    deleteTheme,

    getThemeValues,
    buildThemePayload,
    colorKeys,
    allThemeKeys,
    // /stores/themeStore.ts

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { Theme } from '@prisma/client'

import {
  buildThemePayload,
  applyThemeValues,
  getThemeValues,
  sanitizeThemeValues,
  extractComputedTheme,
  colorKeys,
  allThemeKeys,
daisyuiThemes,
} from '@/stores/helpers/themeHelpers'

export const useThemeStore = defineStore('themeStore', () => {
  

  const activeTheme = ref<string | Theme>('retro')
  const themeForm = ref<Partial<Theme>>({})
  const sharedThemes = ref<Theme[]>([])

  const currentTheme = computed(() =>
    typeof activeTheme.value === 'string'
      ? activeTheme.value
      : activeTheme.value?.name || 'retro'
  )

  const open = ref(false)
  const showCustom = ref(false)
  const botOverride = ref(true)
  const firstThemeChanged = ref(false)

  function toggleMenu() {
    open.value = !open.value
  }

  function setActiveTheme(input: string | Theme): { success: boolean; message?: string } {
    if (typeof input === 'string') {
      if (!daisyuiThemes.includes(input)) {
        const msg = `[themeStore] Invalid theme name: "${input}" not found in DaisyUI`
        console.warn(msg)
        return { success: false, message: msg }
      }

      document.documentElement.setAttribute('data-theme', input)
      localStorage.setItem('theme', input)
      activeTheme.value = input
      themeForm.value = extractComputedTheme(input)
      firstThemeChanged.value = true
      return { success: true }
    }

    if (typeof input === 'object' && input.values) {
      const values = sanitizeThemeValues(input.values)
      applyThemeValues(values)
      document.documentElement.setAttribute('data-theme', 'custom')
      localStorage.setItem('theme', input.name)
      activeTheme.value = input
      themeForm.value = { ...input }
      firstThemeChanged.value = true
      return { success: true }
    }

    const msg = '[themeStore] Invalid input passed to setActiveTheme'
    console.warn(msg)
    return { success: false, message: msg }
  }

  function updateBotTheme(theme: string) {
    if (botOverride.value) setActiveTheme(theme)
  }

  function setShowCustom(value: boolean) {
    showCustom.value = value
    if (typeof window !== 'undefined') {
      localStorage.setItem('showCustom', String(value))
    }
  }

  function revertForm() {
    if (typeof activeTheme.value === 'object') {
      themeForm.value = { ...activeTheme.value }
    } else {
      themeForm.value = extractComputedTheme()
    }
  }

  function initialize() {
    if (typeof window === 'undefined') return

    try {
      const storedFlag = localStorage.getItem('showCustom')
      if (storedFlag !== null) showCustom.value = storedFlag === 'true'

      const storedTheme = localStorage.getItem('theme') || 'retro'
      const storedForm = localStorage.getItem('themeForm')
      const builtIn = daisyuiThemes.includes(storedTheme)

      if (builtIn) {
        setActiveTheme(storedTheme)
      } else if (storedForm) {
        const parsed = JSON.parse(storedForm)
        if (parsed?.values) setActiveTheme(parsed)
      } else {
        setActiveTheme('retro')
      }

      getThemes()
    } catch (err) {
      console.warn('[themeStore] Failed to initialize themeStore:', err)
      setActiveTheme('retro')
    }
  }

  async function getThemes() {
    const { success, data } = await performFetch<{ themes: Theme[] }>('/api/themes')
    if (success && data?.themes) {
      sharedThemes.value = data.themes
    } else {
      sharedThemes.value = []
      console.warn('[themeStore] No themes found or fetch failed.')
    }
  }

  async function addTheme(theme: Partial<Theme>) {
    const userStore = useUserStore()
    const userId = userStore.user?.id || 10
    const payload = { ...theme, userId }
    const { success } = await performFetch('/api/themes', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (success) await getThemes()
  }

  async function updateTheme(id: number, updates: Partial<Theme>) {
    const userStore = useUserStore()
    const userId = userStore.user?.id
    const payload = { ...updates, userId }
    const { success } = await performFetch(`/api/themes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    if (success) await getThemes()
  }

  async function deleteTheme(id: number) {
    const { success } = await performFetch(`/api/themes/${id}`, {
      method: 'DELETE',
    })
    if (success) await getThemes()
  }

  if (typeof window !== 'undefined') {
    watch(themeForm, (val) => {
      localStorage.setItem('themeForm', JSON.stringify(val))
    }, { deep: true })
  }

  return {
    
    sharedThemes,
    activeTheme,
    currentTheme,
    themeForm,
    open,
    showCustom,
    botOverride,
    firstThemeChanged,

    toggleMenu,
    setActiveTheme,
    updateBotTheme,
    setShowCustom,
    revertForm,
    initialize,

    getThemes,
    addTheme,
    updateTheme,
    deleteTheme,

    getThemeValues,
    buildThemePayload,
    colorKeys,
    allThemeKeys,
    daisyuiThemes,
  }
})

export type { Theme }

  }
})

export type { Theme }
