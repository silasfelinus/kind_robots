// /stores/themeStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeSource = {
  page?: string
  user?: string
  custom?: string
}

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

  async function fetchPublicThemes() {
    try {
      const result = await $fetch<Theme[]>('/api/themes')
      sharedThemes.value = result.filter((t) => t.isPublic)
    } catch (error) {
      console.error('[themeStore] Failed to fetch public themes:', error)
    }
  }

  const open = ref(false)
  const firstThemeChanged = ref(false)
  const botOverride = ref(true)

  const themeSources = ref<Record<'main' | 'splash' | 'header', ThemeSource>>({
    main: {},
    splash: {},
    header: {},
  })

  const customThemes = ref<Record<string, string>>(
    JSON.parse(localStorage.getItem('customThemes') || '{}'),
  )

  const resolvedTheme = (type: 'main' | 'splash' | 'header') =>
    computed(
      () =>
        themeSources.value[type].page ||
        themeSources.value[type].user ||
        themeSources.value[type].custom ||
        'retro',
    )

  const mainTheme = computed(() => resolvedTheme('main').value)
  const splashTheme = computed(() => resolvedTheme('splash').value)
  const headerTheme = computed(() => resolvedTheme('header').value)

  function toggleMenu() {
    open.value = !open.value
  }

  function setThemeSource(
    type: 'main' | 'splash' | 'header',
    source: ThemeSource,
  ) {
    themeSources.value[type] = source
    persistCustomThemes()
  }

  function changeTheme(theme: string) {
    if (
      !availableThemes.includes(theme) &&
      !Object.values(customThemes.value).includes(theme)
    ) {
      console.error(`Invalid theme: "${theme}"`)
      return
    }
    firstThemeChanged.value = true
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }

  function saveCustomTheme(name: string, theme: string) {
    customThemes.value[name] = theme
    persistCustomThemes()
  }

  function persistCustomThemes() {
    localStorage.setItem('customThemes', JSON.stringify(customThemes.value))
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'retro'
    if (
      availableThemes.includes(savedTheme) ||
      Object.values(customThemes.value).includes(savedTheme)
    ) {
      changeTheme(savedTheme)
    } else {
      changeTheme('retro')
    }
  }

  function updateBotTheme(theme: string) {
    if (botOverride.value) changeTheme(theme)
  }

  return {
    availableThemes,
    sharedThemes,
    fetchPublicThemes,

    open,
    mainTheme,
    splashTheme,
    headerTheme,
    themeSources,
    customThemes,
    botOverride,
    firstThemeChanged,

    toggleMenu,
    changeTheme,
    setThemeSource,
    saveCustomTheme,
    initTheme,
    updateBotTheme,
  }
})
