// /stores/themeStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch, nextTick } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
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

type ThemeInitializeOptions = {
  force?: boolean
  fetchShared?: boolean
}

const defaultThemeName = 'retro'
const themeStorageKey = 'theme'
const themeFormStorageKey = 'themeForm'
const showCustomStorageKey = 'showCustom'

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

function canUseDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function safeGetLocalStorage(key: string): string | null {
  if (!canUseDom()) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  if (!canUseDom()) return

  try {
    localStorage.setItem(key, value)
  } catch {}
}

function safeParseThemeForm(raw: string | null): ThemeForm | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as ThemeForm
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function themeNameFromInput(input: string | ThemeForm): string {
  return typeof input === 'string' ? input : input.name || 'custom'
}

export const useThemeStore = defineStore('themeStore', () => {
  const activeTheme = ref<ActiveTheme>(defaultThemeName)
  const themeForm = ref<ThemeForm>({})
  const applyAfterSave = ref(true)
  const sharedThemes = ref<Theme[]>([])
  const open = ref(false)
  const showCustom = ref(false)
  const botOverride = ref(true)
  const firstThemeChanged = ref(false)
  const initialized = ref(false)
  const initializing = ref(false)
  const loadingThemes = ref(false)
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const getThemesPromise = ref<Promise<Theme[]> | null>(null)
  const savingThemeForm = ref(false)

  const currentTheme = computed(() =>
    typeof activeTheme.value === 'string'
      ? activeTheme.value
      : activeTheme.value?.name || defaultThemeName,
  )

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearAppliedThemeValues(): void {
    if (!canUseDom()) return

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
    if (!canUseDom()) return null

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

  function setShowCustom(value: boolean): void {
    showCustom.value = value
    safeSetLocalStorage(showCustomStorageKey, String(value))
  }

  function persistThemeForm(): void {
    safeSetLocalStorage(themeFormStorageKey, JSON.stringify(themeForm.value))
  }

  async function setActiveTheme(
    input: string | ThemeForm,
    options: { skipSnapshot?: boolean } = {},
  ): Promise<{
    success: boolean
    message?: string
  }> {
    if (!canUseDom()) {
      return { success: false, message: 'Cannot set theme server-side' }
    }

    const nextThemeName = themeNameFromInput(input)

    if (
      typeof input === 'string' &&
      currentTheme.value === input &&
      firstThemeChanged.value
    ) {
      return { success: true }
    }

    if (typeof input === 'string') {
      if (!daisyuiThemes.includes(input)) {
        const message = `[themeStore] Invalid theme name: "${input}" not found in DaisyUI`
        console.warn(message)
        return { success: false, message }
      }

      clearAppliedThemeValues()
      document.documentElement.setAttribute('data-theme', input)
      safeSetLocalStorage(themeStorageKey, input)
      activeTheme.value = input

      if (!options.skipSnapshot) {
        const snapshot = await getActiveThemeSnapshot(input)
        themeForm.value =
          snapshot || normalizeThemeFromServer(extractComputedTheme(input))
      }

      firstThemeChanged.value = true
      lastError.value = null

      return { success: true }
    }

    if (input.values && isThemeValuesRecord(input.values)) {
      const values = sanitizeThemeValues(input.values)
      const normalized = normalizeThemeFromServer({ ...input, values })

      clearAppliedThemeValues()
      applyThemeValues(values)
      document.documentElement.setAttribute('data-theme', 'custom')
      safeSetLocalStorage(themeStorageKey, nextThemeName)

      activeTheme.value = normalized
      themeForm.value = normalized
      firstThemeChanged.value = true
      lastError.value = null

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

    if (getThemesPromise.value && !force) {
      return getThemesPromise.value
    }

    getThemesPromise.value = (async () => {
      try {
        loadingThemes.value = true
        lastError.value = null

        const { success, data, message } = await performFetch<{
          themes: Theme[]
        }>('/api/themes')

        if (success && data?.themes) {
          sharedThemes.value = data.themes
          return sharedThemes.value
        }

        throw new Error(message || 'No themes found or fetch failed.')
      } catch (error) {
        handleError(error, 'getThemes')
        setLastError(error, 'Failed to fetch themes')
        return sharedThemes.value
      } finally {
        loadingThemes.value = false
        getThemesPromise.value = null
      }
    })()

    return getThemesPromise.value
  }

  async function initialize(
    options: ThemeInitializeOptions = {},
  ): Promise<void> {
    if (!canUseDom()) return
    if (initialized.value && !options.force) return
    if (initializePromise.value && !options.force)
      return initializePromise.value

    initializePromise.value = (async () => {
      try {
        initializing.value = true
        lastError.value = null

        const storedFlag = safeGetLocalStorage(showCustomStorageKey)

        if (storedFlag !== null) {
          showCustom.value = storedFlag === 'true'
        }

        const storedTheme =
          safeGetLocalStorage(themeStorageKey) || defaultThemeName
        const storedForm = safeParseThemeForm(
          safeGetLocalStorage(themeFormStorageKey),
        )

        const builtIn = daisyuiThemes.includes(storedTheme)

        savingThemeForm.value = true

        if (builtIn) {
          await setActiveTheme(storedTheme)
        } else if (storedForm?.values) {
          await setActiveTheme(normalizeThemeFromServer(storedForm))
        } else {
          await setActiveTheme(defaultThemeName)
        }

        savingThemeForm.value = false

        if (options.fetchShared !== false) {
          await getThemes(Boolean(options.force))
        }

        initialized.value = true
      } catch (error) {
        console.warn('[themeStore] Failed to initialize themeStore:', error)
        handleError(error, 'initialize themeStore')
        setLastError(error, 'Failed to initialize theme store')

        try {
          await setActiveTheme(defaultThemeName)
        } catch {}

        initialized.value = false
        throw error
      } finally {
        savingThemeForm.value = false
        initializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function addTheme(theme: ThemeForm | Partial<Theme>) {
    const userStore = useUserStore()
    const userId = userStore.user?.id || 10
    const payload = toApiPayload(theme, userId)

    try {
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
    } catch (error) {
      handleError(error, 'addTheme')
      setLastError(error, 'Theme save failed.')

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Theme save failed.',
      }
    }
  }

  async function updateTheme(
    id: number,
    updates: ThemeForm | Partial<Theme>,
  ): Promise<void> {
    const userStore = useUserStore()
    const userId = userStore.user?.id || 10
    const payload = toApiPayload(updates, userId)

    try {
      const { success, message } = await performFetch(`/api/themes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      if (success) {
        await getThemes(true)
        lastError.value = null
        return
      }

      throw new Error(message || 'Theme update failed.')
    } catch (error) {
      handleError(error, 'updateTheme')
      setLastError(error, 'Theme update failed.')
    }
  }

  async function deleteTheme(id: number): Promise<void> {
    try {
      const { success, message } = await performFetch(`/api/themes/${id}`, {
        method: 'DELETE',
      })

      if (success) {
        sharedThemes.value = sharedThemes.value.filter(
          (theme) => theme.id !== id,
        )
        return
      }

      throw new Error(message || 'Theme delete failed.')
    } catch (error) {
      handleError(error, 'deleteTheme')
      setLastError(error, 'Theme delete failed.')
    }
  }

  if (typeof window !== 'undefined') {
    let saveTimeout: ReturnType<typeof setTimeout> | null = null

    watch(
      themeForm,
      (val) => {
        if (savingThemeForm.value) return

        if (saveTimeout) {
          clearTimeout(saveTimeout)
        }

        saveTimeout = setTimeout(() => {
          safeSetLocalStorage(themeFormStorageKey, JSON.stringify(val))
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
    initializing,
    loadingThemes,
    lastError,
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
