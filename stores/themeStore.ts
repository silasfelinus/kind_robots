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

  const sharedThemes = ref<Theme[]>([])
  const open = ref(false)
  const showCustom = ref(false)
  const botOverride = ref(true)
  const savedTheme = ref('retro')
  const firstThemeChanged = ref(false)

  const currentTheme = computed(() => savedTheme.value)

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

  async function addTheme(theme: Theme) {
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
      userId, // this assumes your backend still expects userId as confirmation of ownership
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

  return {
    availableThemes,
    sharedThemes,
    getThemes,
    addTheme,
    updateTheme,
    deleteTheme,

    open,
    toggleMenu,

    currentTheme,
    savedTheme,
    changeTheme,
    updateBotTheme,
    firstThemeChanged,

    showCustom,
    setShowCustom,

    botOverride,
    initialize,
  }
})
