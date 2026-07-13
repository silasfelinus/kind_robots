// /stores/channelContentStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  filterChannelsByRole,
  resolveChannelLocation,
  resolveChannels,
  type ChannelContentItem,
  type ChannelLocationInput,
} from '@/stores/helpers/channelContent'
import { useUserStore } from '@/stores/userStore'
import { handleError } from '@/stores/utils'

const channelTabsStorageKey = 'channelTabs'
const isClient = typeof window !== 'undefined'

function readStoredTabs(): Record<string, string> {
  if (!isClient) return {}

  try {
    const raw = localStorage.getItem(channelTabsStorageKey)
    if (!raw) return {}

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([key, value]) => key.trim() && typeof value === 'string',
      ),
    ) as Record<string, string>
  } catch {
    return {}
  }
}

export const useChannelContentStore = defineStore('channelContentStore', () => {
  const items = ref<ChannelContentItem[]>([])
  const activeTabs = ref<Record<string, string>>({})
  const activeTabsHydrated = ref(false)
  const initialized = ref(false)
  const loading = ref(false)
  const lastError = ref<string | null>(null)
  const initializePromise = ref<Promise<void> | null>(null)

  const userStore = useUserStore()

  const channels = computed(() => resolveChannels(items.value))
  const visibleChannels = computed(() =>
    filterChannelsByRole(channels.value, userStore.role),
  )

  function syncActiveTabs(): void {
    if (!isClient) return

    try {
      localStorage.setItem(channelTabsStorageKey, JSON.stringify(activeTabs.value))
    } catch {}
  }

  function hydrateActiveTabs(force = false): void {
    if (activeTabsHydrated.value && !force) return

    activeTabs.value = readStoredTabs()
    activeTabsHydrated.value = true
  }

  function normalizeActiveTabs(): void {
    const normalized: Record<string, string> = {}

    for (const channel of channels.value) {
      const stored = activeTabs.value[channel.channelKey]
      const active = channel.tabs.some((tab) => tab.tabKey === stored)
        ? stored
        : channel.defaultTab

      if (active) normalized[channel.channelKey] = active
    }

    activeTabs.value = normalized
    syncActiveTabs()
  }

  async function initialize(force = false): Promise<void> {
    hydrateActiveTabs(force)

    if (initializePromise.value && !force) return initializePromise.value
    if (initialized.value && !force) {
      normalizeActiveTabs()
      return
    }

    initializePromise.value = (async () => {
      loading.value = true
      lastError.value = null

      try {
        const content = await queryCollection('content').all()

        items.value = (content as ChannelContentItem[]).filter(
          (item) => item.contentType === 'channel' || item.contentType === 'tab',
        )
        normalizeActiveTabs()
        initialized.value = true
      } catch (error) {
        handleError(error, 'loading channel content')
        lastError.value =
          error instanceof Error
            ? error.message
            : 'Failed to load channel content'
        initialized.value = false
      } finally {
        loading.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  function getChannel(channelKey: string) {
    const normalized = channelKey.trim()

    return (
      visibleChannels.value.find(
        (channel) =>
          channel.channelKey === normalized ||
          channel.dashboardKey === normalized,
      ) ?? null
    )
  }

  function getTab(channelKey: string, tabKey: string) {
    const channel = getChannel(channelKey)
    if (!channel) return null

    const normalized = tabKey.trim()

    return (
      channel.tabs.find(
        (tab) =>
          tab.tabKey === normalized || tab.dashboardTab === normalized,
      ) ?? null
    )
  }

  function getActiveTab(channelKey: string): string {
    const channel = getChannel(channelKey)
    if (!channel) return ''

    const stored = activeTabs.value[channel.channelKey]

    return channel.tabs.some((tab) => tab.tabKey === stored)
      ? stored
      : channel.defaultTab
  }

  function setActiveTab(channelKey: string, tabKey: string): string {
    const channel = getChannel(channelKey)
    if (!channel) return ''

    const tab = getTab(channel.channelKey, tabKey)
    const resolved = tab?.tabKey || channel.defaultTab

    if (!resolved) return ''

    activeTabs.value = {
      ...activeTabs.value,
      [channel.channelKey]: resolved,
    }
    syncActiveTabs()

    return resolved
  }

  function resolveLocation(input: ChannelLocationInput) {
    return resolveChannelLocation(visibleChannels.value, input)
  }

  function reset(): void {
    items.value = []
    activeTabs.value = {}
    activeTabsHydrated.value = false
    initialized.value = false
    loading.value = false
    lastError.value = null
    initializePromise.value = null
  }

  return {
    items,
    channels,
    visibleChannels,
    activeTabs,
    activeTabsHydrated,
    initialized,
    loading,
    lastError,
    initializePromise,
    initialize,
    hydrateActiveTabs,
    getChannel,
    getTab,
    getActiveTab,
    setActiveTab,
    resolveLocation,
    reset,
  }
})
