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

export const useChannelContentStore = defineStore('channelContentStore', () => {
  const items = ref<ChannelContentItem[]>([])
  const initialized = ref(false)
  const loading = ref(false)
  const lastError = ref<string | null>(null)
  const initializePromise = ref<Promise<void> | null>(null)

  const userStore = useUserStore()

  const channels = computed(() => resolveChannels(items.value))
  const visibleChannels = computed(() =>
    filterChannelsByRole(channels.value, userStore.role),
  )

  async function initialize(force = false): Promise<void> {
    if (initializePromise.value && !force) return initializePromise.value
    if (initialized.value && !force) return

    initializePromise.value = (async () => {
      loading.value = true
      lastError.value = null

      try {
        const content = await queryCollection('content').all()

        items.value = (content as ChannelContentItem[]).filter(
          (item) => item.contentType === 'channel' || item.contentType === 'tab',
        )
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

  function resolveLocation(input: ChannelLocationInput) {
    return resolveChannelLocation(visibleChannels.value, input)
  }

  function reset(): void {
    items.value = []
    initialized.value = false
    loading.value = false
    lastError.value = null
    initializePromise.value = null
  }

  return {
    items,
    channels,
    visibleChannels,
    initialized,
    loading,
    lastError,
    initializePromise,
    initialize,
    getChannel,
    getTab,
    resolveLocation,
    reset,
  }
})
