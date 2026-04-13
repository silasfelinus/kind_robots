// /stores/smartbarStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import { useNavStore } from '@/stores/navStore'
import { swarmMessages } from '@/stores/seeds/swarmMessages'
import type { SmartIcon } from '~/prisma/generated/prisma/client'

export type SmartIconForm = Partial<SmartIcon>

export const useSmartbarStore = defineStore('smartbarStore', () => {
  const icons = ref<SmartIcon[]>([])
  const selectedIcon = ref<SmartIcon | null>(null)
  const iconForm = ref<SmartIconForm>({})

  const isSaving = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchIconsPromise = ref<Promise<SmartIcon[]> | null>(null)

  const defaultIconIds = ref<number[]>([1, 2, 3, 4, 5, 6, 7, 8])

  const isEditing = ref(false)
  const showSwarm = ref(false)
  const swarmMessage = ref('')

  const editableIcons = ref<SmartIcon[]>([])
  const originalIcons = ref<SmartIcon[]>([])
  const dragIndex = ref(-1)

  const userStore = useUserStore()
  const navStore = useNavStore()

  const customIconsEnabled = computed(
    () => userStore.user?.customIcons ?? false,
  )

  const smartBarIds = computed(() => {
    const raw = userStore.user?.smartBar
    return (
      raw
        ?.split(',')
        .map((v: string) => Number(v))
        .filter((n: number) => Number.isFinite(n)) ?? []
    )
  })

  const activeIcons = computed(() => {
    const ids = customIconsEnabled.value
      ? smartBarIds.value
      : defaultIconIds.value

    return ids
      .map((id) => icons.value.find((i) => i.id === id))
      .filter((i): i is SmartIcon => Boolean(i))
  })

  const hasChanges = computed(() => {
    return (
      JSON.stringify(editableIcons.value.map((i) => i.id)) !==
      JSON.stringify(originalIcons.value.map((i) => i.id))
    )
  })

  function syncToLocalStorage() {
    try {
      localStorage.setItem('smartIcons', JSON.stringify(icons.value))
      localStorage.setItem('smartIconForm', JSON.stringify(iconForm.value))
    } catch {}
  }

  function hydrateFromLocalStorage() {
    try {
      const savedIcons = localStorage.getItem('smartIcons')
      const savedForm = localStorage.getItem('smartIconForm')

      if (savedIcons) icons.value = JSON.parse(savedIcons)
      if (savedForm) iconForm.value = JSON.parse(savedForm)
    } catch {}
  }

  async function fetchIcons(force = false): Promise<SmartIcon[]> {
    if (!force && icons.value.length) {
      return icons.value
    }

    if (fetchIconsPromise.value) {
      return fetchIconsPromise.value
    }

    fetchIconsPromise.value = (async () => {
      loading.value = true

      try {
        const res = await performFetch<SmartIcon[]>('/api/icons')

        if (res.success && res.data) {
          icons.value = res.data
          syncToLocalStorage()
          return icons.value
        }

        return []
      } catch (e) {
        handleError(e, 'fetching icons')
        return []
      } finally {
        loading.value = false
        fetchIconsPromise.value = null
      }
    })()

    return fetchIconsPromise.value
  }

  async function initialize(): Promise<void> {
    if (isInitialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        hydrateFromLocalStorage()

        // 🔥 reuse navStore if already loaded
        if (navStore.items.length) {
          icons.value = navStore.items
        } else if (!icons.value.length) {
          await fetchIcons()
        }

        isInitialized.value = true
      } catch (error) {
        handleError(error, 'initializing smartbar store')
      } finally {
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  function toggleSwarm() {
    showSwarm.value = !showSwarm.value
    if (showSwarm.value) {
      const i = Math.floor(Math.random() * swarmMessages.length)
      swarmMessage.value = swarmMessages[i] ?? ''
    }
  }

  return {
    icons,
    selectedIcon,
    iconForm,
    isSaving,
    isInitialized,
    loading,
    defaultIconIds,
    isEditing,
    showSwarm,
    swarmMessage,
    editableIcons,
    originalIcons,
    dragIndex,
    customIconsEnabled,
    smartBarIds,
    activeIcons,
    hasChanges,
    initialize,
    fetchIcons,
    syncToLocalStorage,
    toggleSwarm,
  }
})

export type { SmartIcon }
