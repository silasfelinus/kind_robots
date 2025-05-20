// /stores/themeStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type DaisyUIColorTokens = {
  primary: string
  secondary: string
  accent: string
  neutral: string
  'base-100': string
  'base-200'?: string
  'base-300'?: string
  info?: string
  success?: string
  warning?: string
  error?: string
}

export interface Theme {
  id?: number
  name: string
  values: Record<string, string>
  userId?: number
  room?: string
  tagline?: string
  isPublic?: boolean
  createdAt?: string
}

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

  const sharedThemes = ref<Theme[]>([])

  async function getThemes() {
    try {
      const result = await $fetch<Theme[]>('/api/themes')
      sharedThemes.value = result.filter((t) => t.isPublic)
    } catch (error) {
      console.error('[themeStore] Failed to fetch public themes:', error)
    }
  }

  async function addTheme(theme: Theme) {
    try {
      await $fetch('/api/themes', { method: 'POST', body: theme })
      await getThemes()
    } catch (error) {
      console.error('[themeStore] Failed to save custom theme:', error)
    }
  }

  async function updateTheme(id: number, updates: Partial<Theme>) {
    try {
      await $fetch(`/api/themes/${id}`, { method: 'PATCH', body: updates })
      await getThemes()
    } catch (error) {
      console.error(`[themeStore] Failed to update theme ${id}:`, error)
    }
  }

  async function deleteTheme(id: number) {
    try {
      await $fetch(`/api/themes/${id}`, { method: 'DELETE' })
      await getThemes()
    } catch (error) {
      console.error(`[themeStore] Failed to delete theme ${id}:`, error)
    }
  }

  const open = ref(false)
  const firstThemeChanged = ref(false)
  const botOverride = ref(true)

  const showCustom = ref(false)
  const savedTheme = ref('retro')

  const currentTheme = computed(() => savedTheme.value)

  function toggleMenu() {
    open.value = !open.value
  }

  function changeTheme(theme: string) {
    if (!availableThemes.includes(theme)) {
      console.error(`Invalid theme: "${theme}"`)
      return
    }
    firstThemeChanged.value = true
    savedTheme.value = theme

    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    }
  }

  function setShowCustom(value: boolean) {
    showCustom.value = value
    if (typeof window !== 'undefined') {
      localStorage.setItem('showCustom', String(value))
    }
  }

  function initialize() {
    if (typeof window !== 'undefined') {
      try {
        const storedCustomFlag = localStorage.getItem('showCustom')
        if (storedCustomFlag !== null) {
          showCustom.value = storedCustomFlag === 'true'
        }

        const storedTheme = localStorage.getItem('theme') || 'retro'
        if (availableThemes.includes(storedTheme)) {
          changeTheme(storedTheme)
        } else {
          changeTheme('retro')
        }

        getThemes()
      } catch (e) {
        console.warn(
          '[themeStore] Failed to parse localStorage theme state during initialize():',
          e,
        )
        changeTheme('retro')
      }
    }
  }

  function updateBotTheme(theme: string) {
    if (botOverride.value) changeTheme(theme)
  }

  return {
    availableThemes,
    sharedThemes,
    getThemes,
    addTheme,
    updateTheme,
    deleteTheme,

    open,
    currentTheme,
    savedTheme,
    showCustom,
    botOverride,
    firstThemeChanged,

    toggleMenu,
    changeTheme,
    initialize,
    updateBotTheme,
    setShowCustom,
  }
})
