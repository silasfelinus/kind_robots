// /stores/themeStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import type { Theme } from '~/server/generated/prisma'

import {
  buildThemePayload, // keep if you use it elsewhere
  applyThemeValues,
  getThemeValues,
  sanitizeThemeValues,
  extractComputedTheme,
  colorKeys,
  allThemeKeys,
  daisyuiThemes,
  getThemeStyle,
  isThemeValuesRecord,
  extraVars,
  defaultExtraVars,
  getRandomHex,
  normalizeThemeFromServer,
  fillThemeWithRandomColors,
  isValidColor,
  labelFromKey,
} from '~/stores/helpers/themeHelper'

/** UI form uses an object for values; DB expects a string */
type ThemeForm = Partial<Omit<Theme, 'values'>> & {
  values?: Record<string, string>
}
type ActiveTheme = string | ThemeForm

type ThemeApiPayload = Partial<Omit<Theme, 'values'>> & { values?: string }

function toApiPayload(
  src: ThemeForm | Partial<Theme>,
  userId?: number,
): ThemeApiPayload {
  const raw = (src as any).values
  const values: string | undefined =
    typeof raw === 'string'
      ? raw
      : raw && typeof raw === 'object'
        ? JSON.stringify(sanitizeThemeValues(raw))
        : undefined

  return {
    id: (src as any).id,
    userId: userId ?? (src as any).userId ?? undefined,
    name: (src as any).name,
    values,
    isPublic: (src as any).isPublic,
    tagline: (src as any).tagline ?? null,
    room: (src as any).room ?? null,
    colorScheme: (src as any).colorScheme,
    prefersDark: (src as any).prefersDark,
    // createdAt is server-generated
  }
}

export const useThemeStore = defineStore('themeStore', () => {
  const activeTheme = ref<ActiveTheme>('retro')
  const themeForm = ref<ThemeForm>({})
  const applyAfterSave = ref(true)

  const sharedThemes = ref<Theme[]>([])

  const currentTheme = computed(() =>
    typeof activeTheme.value === 'string'
      ? activeTheme.value
      : activeTheme.value?.name || 'retro',
  )

  const open = ref(false)
  const showCustom = ref(false)
  const botOverride = ref(true)
  const firstThemeChanged = ref(false)

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
        if (parsed?.values) {
          setActiveTheme(normalizeThemeFromServer(parsed))
        }
      } else {
        setActiveTheme('retro')
      }

      getThemes()
    } catch (err) {
      console.warn('[themeStore] Failed to initialize themeStore:', err)
      setActiveTheme('retro')
    }
  }

  function setApplyAfterSave(val: boolean) {
    applyAfterSave.value = val
  }

  function toggleMenu() {
    open.value = !open.value
  }

  function setActiveTheme(input: string | ThemeForm): {
    success: boolean
    message?: string
  } {
    if (typeof document === 'undefined')
      return { success: false, message: 'Cannot set theme server-side' }

    if (typeof input === 'string') {
      if (!daisyuiThemes.includes(input)) {
        const msg = `[themeStore] Invalid theme name: "${input}" not found in DaisyUI`
        console.warn(msg)
        return { success: false, message: msg }
      }

      document.documentElement.setAttribute('data-theme', input)
      localStorage.setItem('theme', input)
      activeTheme.value = input
      themeForm.value = normalizeThemeFromServer(extractComputedTheme(input))
      firstThemeChanged.value = true
      return { success: true }
    }

    if (
      typeof input === 'object' &&
      input.values &&
      isThemeValuesRecord(input.values)
    ) {
      const values = sanitizeThemeValues(input.values)
      applyThemeValues(values)
      document.documentElement.setAttribute('data-theme', 'custom')
      localStorage.setItem('theme', input.name || 'custom')

      const normalized = normalizeThemeFromServer(input as any)
      activeTheme.value = normalized
      themeForm.value = normalized
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
      themeForm.value = normalizeThemeFromServer(activeTheme.value as any)
    } else {
      themeForm.value = normalizeThemeFromServer(extractComputedTheme())
    }
  }

  function resetThemeForm() {
    themeForm.value = {
      name: `MyTheme-${Date.now()}`,
      room: '',
      isPublic: true,
      prefersDark: false,
      colorScheme: 'light',
      values: {
        ...Object.fromEntries(colorKeys.map((key) => [key, '#ffffff'])),
        ...defaultExtraVars,
      },
    }
  }

  function fillWithRandomTheme() {
    const values = themeForm.value.values as Record<string, string> | undefined
    if (!values) return
    for (const key of colorKeys) values[key] = getRandomHex()
  }

  function setColorValue(key: string, value: string) {
    const values = themeForm.value.values as Record<string, string> | undefined
    if (!values) return
    values[key] = value
  }

  function initializeThemeFormIfNeeded() {
    if (!themeForm.value.values) {
      resetThemeForm()
      fillWithRandomTheme()
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
      console.warn('[themeStore] No themes found or fetch failed.')
    }
  }
  async function addTheme(theme: ThemeForm | Partial<Theme>) {
    const { user } = useUserStore()
    const userId = user?.id || 10
    const payload = toApiPayload(theme, userId)

    const result = await performFetch('/api/themes', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (result.success) {
      await getThemes()
    } else {
      // If you don't have errorStore, replace with console.warn
      // import { useErrorStore, ErrorType } from '@/stores/errorStore' at top if you use this
      useErrorStore().setError(
        ErrorType.NETWORK_ERROR,
        result.message || 'Theme save failed.',
      )
    }
    return result
  }
  async function updateTheme(id: number, updates: ThemeForm | Partial<Theme>) {
    const { user } = useUserStore()
    const userId = user?.id || 10
    const payload = toApiPayload(updates, userId)

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

  // Persist the draft themeForm locally for UX
  if (typeof window !== 'undefined') {
    let saveTimeout: ReturnType<typeof setTimeout>
    watch(
      themeForm,
      (val) => {
        clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => {
          localStorage.setItem('themeForm', JSON.stringify(val))
        }, 250)
      },
      { deep: true },
    )
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
    applyAfterSave,

    toggleMenu,
    setActiveTheme,
    updateBotTheme,
    setShowCustom,
    revertForm,
    initialize,
    resetThemeForm,
    fillWithRandomTheme,
    setColorValue,
    initializeThemeFormIfNeeded,

    getThemes,
    addTheme,
    updateTheme,
    deleteTheme,

    getThemeValues,
    buildThemePayload,
    colorKeys,
    extraVars,
    allThemeKeys,
    daisyuiThemes,
    getThemeStyle,
    fillThemeWithRandomColors,
    sanitizeThemeValues,
    isValidColor,
    labelFromKey,
    setApplyAfterSave,
  }
})

export type { Theme }
export { defaultExtraVars }
