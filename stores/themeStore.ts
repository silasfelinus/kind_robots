// /stores/themeStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { Theme } from '@prisma/client'

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

  const themeForm = ref<Partial<Theme>>(
    JSON.parse(localStorage.getItem('themeForm') || '{}'),
  )

  watch(
    themeForm,
    (val) => {
      localStorage.setItem('themeForm', JSON.stringify(val))
    },
    { deep: true },
  )

  const sharedThemes = ref<Theme[]>([])
  const currentThemeObj = ref<Theme | null>(null)
  const savedTheme = ref('retro')
  const currentTheme = computed(() => savedTheme.value)

  const open = ref(false)
  const showCustom = ref(false)
  const botOverride = ref(true)
  const firstThemeChanged = ref(false)

  function toggleMenu() {
    open.value = !open.value
  }

  function changeTheme(theme: string) {
    if (!availableThemes.includes(theme)) {
      console.error(`[themeStore] Invalid theme: "${theme}"`)
      return
    }

    firstThemeChanged.value = true
    savedTheme.value = theme

    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    }
  }

  function updateBotTheme(theme: string) {
    if (botOverride.value) changeTheme(theme)
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
      changeTheme(availableThemes.includes(storedTheme) ? storedTheme : 'retro')

      getThemes()
    } catch (err) {
      console.warn('[themeStore] Failed localStorage init:', err)
      changeTheme('retro')
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

    const payload = {
      ...theme,
      userId,
    }

    const { success } = await performFetch('/api/themes', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (success) await getThemes()
  }

  async function updateTheme(id: number, updates: Partial<Theme>) {
    const userStore = useUserStore()
    const userId = userStore.user?.id

    const payload = {
      ...updates,
      userId,
    }

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

  function applyThemeValues(values: Record<string, string>) {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    for (const [key, value] of Object.entries(values)) {
      if (key.startsWith('--color-')) {
        root.style.setProperty(key, value)
      } else {
        console.warn(`[themeStore] Skipping invalid key: ${key}`)
      }
    }
  }

  function selectTheme(theme: Theme) {
    currentThemeObj.value = theme
    themeForm.value = { ...theme }

    if (theme.values && typeof theme.values === 'object') {
      applyThemeValues(theme.values as Record<string, string>)
      savedTheme.value = theme.name
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme.name)
      }
    } else {
      console.warn('[themeStore] Theme values are invalid or missing.')
    }
  }

  function deselectTheme() {
    currentThemeObj.value = null
    themeForm.value = {}
  }

  function revertForm() {
    if (currentThemeObj.value) {
      themeForm.value = { ...currentThemeObj.value }
    }
  }

  return {
    availableThemes,
    sharedThemes,
    currentTheme,
    currentThemeObj,
    themeForm,

    getThemes,
    addTheme,
    updateTheme,
    deleteTheme,

    selectTheme,
    deselectTheme,
    revertForm,

    open,
    toggleMenu,
    changeTheme,
    savedTheme,
    updateBotTheme,
    firstThemeChanged,
    showCustom,
    setShowCustom,
    botOverride,
    initialize,
  }
})

export type { Theme }
