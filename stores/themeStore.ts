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
} from '@/utils/helpers/themeHelpers'

export const useThemeStore = defineStore('themeStore', () => {
  const availableThemes = [
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset',
    'caramellatte',
    'abyss',
    'silk',
  ]

  const activeTheme = ref<string | Theme>('retro')
  const themeForm = ref<Partial<Theme>>({})
  const sharedThemes = ref<Theme[]>([])

  if (typeof window !== 'undefined') {
    watch(
      themeForm,
      (val) => {
        localStorage.setItem('themeForm', JSON.stringify(val))
      },
      { deep: true },
    )
  }

  const currentTheme = computed(() => {
    return typeof activeTheme.value === 'string'
      ? activeTheme.value
      : activeTheme.value?.name || 'retro'
  })

  const open = ref(false)
  const showCustom = ref(false)
  const botOverride = ref(true)
  const firstThemeChanged = ref(false)

  function toggleMenu() {
    open.value = !open.value
  }

  function setActiveTheme(input: string | Theme): {
    success: boolean
    message?: string
  } {
    if (typeof input === 'string') {
      if (!availableThemes.includes(input)) {
        const msg = `[themeStore] Invalid theme name: "${input}" not found in DaisyUI`
        console.warn(msg)
        return { success: false, message: msg }
      }
      activeTheme.value = input
      document.documentElement.setAttribute('data-theme', input)
      localStorage.setItem('theme', input)
      firstThemeChanged.value = true
      return { success: true }
    }

    if (typeof input === 'object' && input.values) {
      activeTheme.value = input
      applyThemeValues(input.values as Record<string, string>)
      localStorage.setItem('theme', input.name)
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

  function initialize() {
    if (typeof window === 'undefined') return

    try {
      const storedFlag = localStorage.getItem('showCustom')
      if (storedFlag !== null) showCustom.value = storedFlag === 'true'

      const storedTheme = localStorage.getItem('theme') || 'retro'
      const builtIn = availableThemes.includes(storedTheme)
      const storedForm = localStorage.getItem('themeForm')

      if (builtIn) {
        setActiveTheme(storedTheme)
      } else if (storedForm) {
        const parsedForm = JSON.parse(storedForm)
        if (parsedForm && parsedForm.values) setActiveTheme(parsedForm)
      } else {
        setActiveTheme('retro')
      }

      getThemes()
    } catch (err) {
      console.warn('[themeStore] Failed localStorage init:', err)
      setActiveTheme('retro')
    }
  }

  async function getThemes() {
    const { success, data } = await performFetch<{ themes: Theme[] }>(
      '/api/themes',
    )
    if (success && data?.themes) {
      sharedThemes.value = data.themes
    } else {
      sharedThemes.value = []
      console.warn('[themeStore] No themes found or fetch failed.', data)
    }
  }

  async function addTheme(theme: Partial<Theme>) {
    const userStore = useUserStore()
    const userId = userStore.user?.id
    if (!userId) {
      console.warn('[themeStore] No user ID found. Cannot add theme.')
      return
    }
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

  function revertForm() {
    if (typeof activeTheme.value === 'object') {
      themeForm.value = { ...activeTheme.value }
    }
  }

  return {
    availableThemes,
    sharedThemes,
    activeTheme,
    currentTheme,
    themeForm,
    getThemes,
    addTheme,
    updateTheme,
    deleteTheme,
    revertForm,
    open,
    toggleMenu,
    setActiveTheme,
    updateBotTheme,
    firstThemeChanged,
    showCustom,
    setShowCustom,
    botOverride,
    initialize,
    getThemeValues,
    buildThemePayload,
  }
})

export type { Theme }
