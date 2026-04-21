// /stores/themeStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch, nextTick } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import type { Theme } from '~/prisma/generated/prisma/client'

import {
  buildThemePayload,
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

type ThemeForm = Partial<Omit<Theme, 'values'>> & {
  values?: Record<string, string>
}

type ActiveTheme = string | ThemeForm

type ThemeApiPayload = Partial<Omit<Theme, 'values'>> & {
  values?: string
}

function toApiPayload(
  src: ThemeForm | Partial<Theme>,
  userId?: number,
): ThemeApiPayload {
  const raw = (src as ThemeForm).values
  const values: string | undefined =
    typeof raw === 'string'
      ? raw
      : raw && typeof raw === 'object'
        ? JSON.stringify(sanitizeThemeValues(raw))
        : undefined

  return {
    id: (src as Partial<Theme>).id,
    userId: userId ?? (src as Partial<Theme>).userId ?? undefined,
    name: (src as Partial<Theme>).name,
    values,
    isPublic: (src as Partial<Theme>).isPublic,
    tagline: (src as Partial<Theme>).tagline ?? null,
    room: (src as Partial<Theme>).room ?? null,
    colorScheme: (src as Partial<Theme>).colorScheme,
    prefersDark: (src as Partial<Theme>).prefersDark,
  }
}

export const useThemeStore = defineStore('themeStore', () => {
  const activeTheme = ref<ActiveTheme>('retro')
  const themeForm = ref<ThemeForm>({})
  const applyAfterSave = ref(true)
  const sharedThemes = ref<Theme[]>([])
  const open = ref(false)
  const showCustom = ref(false)
  const botOverride = ref(true)
  const firstThemeChanged = ref(false)
  const initialized = ref(false)
  const initializePromise = ref<Promise<void> | null>(null)
  const getThemesPromise = ref<Promise<Theme[]> | null>(null)

  const currentTheme = computed(() =>
    typeof activeTheme.value === 'string'
      ? activeTheme.value
      : activeTheme.value?.name || 'retro',
  )

  function clearAppliedThemeValues(): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    for (const key of allThemeKeys) {
      root.style.removeProperty(key)
      root.style.removeProperty(`--${key}`)
    }

    for (const key of extraVars) {
      root.style.removeProperty(key)
      root.style.removeProperty(`--${key}`)
    }
  }

  async function getActiveThemeSnapshot(
    themeName?: string,
  ): Promise<ThemeForm | null> {
    if (typeof document === 'undefined') return null

    await nextTick()

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })

    const snapshot = extractComputedTheme(themeName)
    return normalizeThemeFromServer(snapshot)
  }

  function setApplyAfterSave(val: boolean): void {
    applyAfterSave.value = val
  }

  function toggleMenu(): void {
    open.value = !open.value
  }

  async function setActiveTheme(input: string | ThemeForm): Promise<{
    success: boolean
    message?: string
  }> {
    if (typeof document === 'undefined') {
      return { success: false, message: 'Cannot set theme server-side' }
    }

    if (typeof input === 'string') {
      if (!daisyuiThemes.includes(input)) {
        const message = `[themeStore] Invalid theme name: "${input}" not found in DaisyUI`
        console.warn(message)
        return { success: false, message }
      }

      clearAppliedThemeValues()
      document.documentElement.setAttribute('data-theme', input)
      localStorage.setItem('theme', input)
      activeTheme.value = input

      const snapshot = await getActiveThemeSnapshot(input)
      themeForm.value =
        snapshot || normalizeThemeFromServer(extractComputedTheme(input))
      firstThemeChanged.value = true

      return { success: true }
    }

    if (input.values && isThemeValuesRecord(input.values)) {
      const values = sanitizeThemeValues(input.values)
      clearAppliedThemeValues()
      applyThemeValues(values)
      document.documentElement.setAttribute('data-theme', 'custom')
      localStorage.setItem('theme', input.name || 'custom')

      const normalized = normalizeThemeFromServer(input)
      activeTheme.value = normalized
      themeForm.value = normalized
      firstThemeChanged.value = true

      return { success: true }
    }

    const message = '[themeStore] Invalid input passed to setActiveTheme'
    console.warn(message)
    return { success: false, message }
  }

  function updateBotTheme(theme: string): void {
    if (botOverride.value) {
      void setActiveTheme(theme)
    }
  }

  function setShowCustom(value: boolean): void {
    showCustom.value = value

    if (typeof window !== 'undefined') {
      localStorage.setItem('showCustom', String(value))
    }
  }

  function revertForm(): void {
    if (typeof activeTheme.value === 'object') {
      themeForm.value = normalizeThemeFromServer(activeTheme.value)
      return
    }

    themeForm.value = normalizeThemeFromServer(extractComputedTheme())
  }

  function resetThemeForm(): void {
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

  function fillWithRandomTheme(): void {
    const values = themeForm.value.values
    if (!values) return

    for (const key of colorKeys) {
      values[key] = getRandomHex()
    }
  }

  function setColorValue(key: string, value: string): void {
    const values = themeForm.value.values
    if (!values) return
    values[key] = value
  }

  function initializeThemeFormIfNeeded(): void {
    if (!themeForm.value.values) {
      resetThemeForm()
      fillWithRandomTheme()
    }
  }

  async function getThemes(force = false): Promise<Theme[]> {
    if (!force && sharedThemes.value.length) {
      return sharedThemes.value
    }

    if (getThemesPromise.value) {
      return getThemesPromise.value
    }

    getThemesPromise.value = (async () => {
      const { success, data } = await performFetch<{ themes: Theme[] }>(
        '/api/themes',
      )

      if (success && data?.themes) {
        sharedThemes.value = data.themes
        return sharedThemes.value
      }

      sharedThemes.value = []
      console.warn('[themeStore] No themes found or fetch failed.')
      return []
    })()

    try {
      return await getThemesPromise.value
    } finally {
      getThemesPromise.value = null
    }
  }

  function initialize(): Promise<void> | void {
    if (typeof window === 'undefined') return
    if (initialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        const storedFlag = localStorage.getItem('showCustom')
        if (storedFlag !== null) {
          showCustom.value = storedFlag === 'true'
        }

        const storedTheme = localStorage.getItem('theme') || 'retro'
        const storedForm = localStorage.getItem('themeForm')
        const builtIn = daisyuiThemes.includes(storedTheme)

        if (builtIn) {
          await setActiveTheme(storedTheme)
        } else if (storedForm) {
          const parsed = JSON.parse(storedForm) as ThemeForm
          if (parsed?.values) {
            await setActiveTheme(normalizeThemeFromServer(parsed))
          } else {
            await setActiveTheme('retro')
          }
        } else {
          await setActiveTheme('retro')
        }

        await getThemes()
        initialized.value = true
      } catch (error) {
        console.warn('[themeStore] Failed to initialize themeStore:', error)
        await setActiveTheme('retro')
        initialized.value = false
        throw error
      } finally {
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function addTheme(theme: ThemeForm | Partial<Theme>) {
    const userStore = useUserStore()
    const userId = userStore.user?.id || 10
    const payload = toApiPayload(theme, userId)

    const result = await performFetch('/api/themes', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (result.success) {
      await getThemes(true)
    } else {
      useErrorStore().setError(
        ErrorType.NETWORK_ERROR,
        result.message || 'Theme save failed.',
      )
    }

    return result
  }

  async function updateTheme(
    id: number,
    updates: ThemeForm | Partial<Theme>,
  ): Promise<void> {
    const userStore = useUserStore()
    const userId = userStore.user?.id || 10
    const payload = toApiPayload(updates, userId)

    const { success } = await performFetch(`/api/themes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    if (success) {
      await getThemes(true)
    }
  }

  async function deleteTheme(id: number): Promise<void> {
    const { success } = await performFetch(`/api/themes/${id}`, {
      method: 'DELETE',
    })

    if (success) {
      await getThemes(true)
    }
  }

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
    initialized,
    initializePromise,
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
    getActiveThemeSnapshot,
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
