<!-- /components/navigation/channel-select.vue -->
<template>
  <div class="dropdown">
    <button
      tabindex="0"
      type="button"
      class="flex h-10 min-h-10 shrink-0 items-center gap-2 overflow-hidden rounded-xl border border-base-300 bg-base-100 px-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:h-11 sm:min-h-11 xl:h-14 xl:min-h-14 xl:gap-2.5 xl:px-3"
      :title="`Navigate ${activeChannel.label}`"
      aria-haspopup="menu"
    >
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-base-300/70 bg-base-200 sm:h-9 sm:w-9 xl:h-10 xl:w-10"
      >
        <Icon
          :name="activeChannel.icon"
          class="h-4 w-4 shrink-0 xl:h-5 xl:w-5"
        />
      </span>

      <span class="flex min-w-0 flex-col items-start leading-tight">
        <span class="truncate text-sm font-black sm:text-base xl:text-lg">
          {{ activeChannel.label }}
        </span>
        <span
          v-if="activeTab"
          class="hidden max-w-32 truncate text-[0.62rem] font-bold text-base-content/55 sm:block xl:max-w-40 xl:text-xs"
        >
          {{ activeTab.label }}
        </span>
      </span>

      <Icon
        name="kind-icon:chevron-down"
        class="h-3.5 w-3.5 shrink-0 text-base-content/50 xl:h-4 xl:w-4"
      />
    </button>

    <div tabindex="0" class="dropdown-content z-110 mt-2">
      <ul
        ref="channelMenu"
        class="menu max-h-[min(38rem,calc(100dvh-5rem))] w-[min(22rem,calc(100vw-1rem))] flex-nowrap overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-2 shadow-2xl"
        @scroll="closeChannelTabs"
      >
        <li
          v-for="channel in visibleChannels"
          :key="channel.channelKey"
          class="channel-menu-item"
          @mouseenter="showChannelTabs(channel, $event)"
          @focusin="showChannelTabs(channel, $event)"
        >
          <div
            class="flex min-h-12 w-full items-stretch overflow-hidden rounded-xl"
            :class="
              activeChannel.channelKey === channel.channelKey
                ? 'bg-primary text-primary-content'
                : 'hover:bg-base-200'
            "
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left"
              @click="selectChannel(channel)"
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-base-300/50 bg-base-200 text-base-content xl:h-10 xl:w-10"
              >
                <Icon :name="channel.icon" class="h-4 w-4 shrink-0" />
              </span>

              <span
                class="flex min-w-0 flex-1 flex-col items-start leading-tight"
              >
                <span
                  class="max-w-full truncate text-sm font-black xl:text-base"
                >
                  {{ channel.label }}
                </span>
                <span
                  class="max-w-full truncate text-xs font-semibold opacity-65"
                >
                  {{ destinationTab(channel)?.label || channel.title }}
                </span>
              </span>
            </button>

            <button
              v-if="channel.tabs.length > 1"
              type="button"
              class="flex w-10 shrink-0 items-center justify-center border-l border-current/10"
              :aria-label="'Show ' + channel.label + ' tabs'"
              :aria-expanded="expandedChannelKey === channel.channelKey"
              @click.stop="toggleChannel(channel, $event)"
            >
              <Icon
                name="kind-icon:chevron-right"
                class="h-4 w-4 transition-transform"
                :class="
                  expandedChannelKey === channel.channelKey ? 'rotate-90' : ''
                "
              />
            </button>
          </div>
        </li>
      </ul>

      <ul
        v-if="expandedChannel"
        ref="channelFlyout"
        class="channel-submenu menu absolute left-full z-120 ml-2 max-h-[min(32rem,calc(100dvh-5rem))] w-[min(22rem,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-2 shadow-2xl md:w-80"
        :style="{ top: `${channelFlyoutTop}px` }"
        :aria-label="expandedChannel.label + ' tabs'"
      >
        <li v-for="tab in expandedChannel.tabs" :key="tab.tabKey">
          <button
            type="button"
            class="flex min-h-11 items-center gap-2 rounded-xl"
            :class="
              isActiveTab(expandedChannel, tab)
                ? 'active bg-secondary text-secondary-content'
                : ''
            "
            @click="selectTab(expandedChannel, tab)"
          >
            <span
              class="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-base-200"
            >
              <img
                v-if="tab.image"
                :src="tab.image"
                :alt="tab.title || tab.label"
                class="h-full w-full object-cover"
              />
              <span
                class="absolute inset-0 flex items-center justify-center bg-base-content/20"
              >
                <Icon
                  :name="tab.icon || expandedChannel.icon"
                  class="h-4 w-4 text-base-100 drop-shadow"
                />
              </span>
            </span>

            <span
              class="flex min-w-0 flex-1 flex-col items-start leading-tight"
            >
              <span class="max-w-full truncate text-sm font-black">
                {{ tab.label }}
              </span>
              <span
                v-if="tab.summary || tab.description"
                class="line-clamp-1 text-xs font-medium opacity-65"
              >
                {{ tab.summary || tab.description }}
              </span>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type {
  ResolvedChannel,
  ResolvedTab,
} from '@/stores/helpers/channelContent'
import { useChannelContentStore } from '@/stores/channelContentStore'
import { usePageStore } from '@/stores/pageStore'

const route = useRoute()
const router = useRouter()
const pageStore = usePageStore()
const channelContentStore = useChannelContentStore()
const expandedChannelKey = ref('')
const channelMenu = ref<HTMLElement | null>(null)
const channelFlyout = ref<HTMLElement | null>(null)
const channelFlyoutTop = ref(0)

await channelContentStore.initialize()

const visibleChannels = computed(() => channelContentStore.visibleChannels)
const expandedChannel = computed<ResolvedChannel | null>(() => {
  return (
    visibleChannels.value.find(
      (channel) => channel.channelKey === expandedChannelKey.value,
    ) ?? null
  )
})
const requestedTabKey = computed(() => {
  return typeof route.query.tab === 'string' ? route.query.tab.trim() : ''
})

const fallbackChannel: ResolvedChannel = {
  key: 'home',
  channelKey: 'home',
  dashboardKey: 'user',
  label: 'Home',
  title: 'Home',
  room: 'Kind Robots',
  subtitle: '',
  description: '',
  summary: '',
  narrative: '',
  tooltip: '',
  icon: 'kind-icon:home',
  image: '/images/channels/home/channel.webp',
  route: '/',
  defaultTab: 'dashboard',
  sort: 0,
  requiredRole: '',
  requiredPermission: '',
  loadingMessage: 'Loading Home…',
  refreshLabel: 'Refresh Home',
  dottiTip: '',
  amiTip: '',
  tutorial: null,
  tabs: [],
}

const activeChannel = computed<ResolvedChannel>(() => {
  return pageStore.resolvedChannel ?? visibleChannels.value[0] ?? fallbackChannel
})

const activeTab = computed<ResolvedTab | null>(() => {
  const channel = activeChannel.value
  const requested = channel.tabs.find(
    (tab) => tab.tabKey === requestedTabKey.value,
  )
  if (requested) return requested

  if (
    pageStore.resolvedTab &&
    pageStore.resolvedTab.channelKey === channel.channelKey
  ) {
    return pageStore.resolvedTab
  }

  const storedTabKey = channelContentStore.getActiveTab(channel.channelKey)

  return (
    channel.tabs.find((tab) => tab.tabKey === storedTabKey) ??
    channel.tabs.find((tab) => tab.tabKey === channel.defaultTab) ??
    channel.tabs[0] ??
    null
  )
})

function destinationTab(channel: ResolvedChannel): ResolvedTab | null {
  const storedTabKey = channelContentStore.getActiveTab(channel.channelKey)

  return (
    channel.tabs.find((tab) => tab.tabKey === storedTabKey) ??
    channel.tabs.find((tab) => tab.tabKey === channel.defaultTab) ??
    channel.tabs[0] ??
    null
  )
}

function isActiveTab(channel: ResolvedChannel, tab: ResolvedTab): boolean {
  return (
    activeChannel.value.channelKey === channel.channelKey &&
    activeTab.value?.tabKey === tab.tabKey
  )
}

function closeChannelTabs(): void {
  expandedChannelKey.value = ''
}

function positionChannelTabs(event: Event): void {
  const menu = channelMenu.value
  const target = (event.currentTarget as HTMLElement | null)?.closest(
    '.channel-menu-item',
  )

  if (!menu || !(target instanceof HTMLElement)) return

  const menuRect = menu.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  channelFlyoutTop.value = Math.max(0, targetRect.top - menuRect.top)

  void nextTick(() => {
    const flyout = channelFlyout.value
    if (!flyout) return

    const maxTop = Math.max(0, menu.clientHeight - flyout.offsetHeight)
    channelFlyoutTop.value = Math.min(channelFlyoutTop.value, maxTop)
  })
}

function showChannelTabs(channel: ResolvedChannel, event: Event): void {
  if (channel.tabs.length <= 1) {
    closeChannelTabs()
    return
  }

  expandedChannelKey.value = channel.channelKey
  positionChannelTabs(event)
}

function toggleChannel(channel: ResolvedChannel, event: Event): void {
  if (expandedChannelKey.value === channel.channelKey) {
    closeChannelTabs()
    return
  }

  showChannelTabs(channel, event)
}

function tabSharesRoute(channel: ResolvedChannel, tab: ResolvedTab): boolean {
  return channel.tabs.filter((item) => item.route === tab.route).length > 1
}

function navigateToTab(channel: ResolvedChannel, tab: ResolvedTab): void {
  if (!tab.route) return

  if (tabSharesRoute(channel, tab)) {
    if (route.path === tab.route && requestedTabKey.value === tab.tabKey) return

    void router.push({
      path: tab.route,
      query: { tab: tab.tabKey },
    })
    return
  }

  if (route.path !== tab.route || requestedTabKey.value) {
    void router.push(tab.route)
  }
}

function selectChannel(channel: ResolvedChannel): void {
  const tab = destinationTab(channel)

  if (tab) {
    selectTab(channel, tab)
    return
  }

  if (channel.route && channel.route !== route.path) {
    void router.push(channel.route)
  }

  closeDropdown()
}

function selectTab(channel: ResolvedChannel, tab: ResolvedTab): void {
  channelContentStore.setActiveTab(channel.channelKey, tab.tabKey)
  navigateToTab(channel, tab)
  closeDropdown()
}

function closeDropdown(): void {
  closeChannelTabs()
  if (typeof document === 'undefined') return

  const element = document.activeElement as HTMLElement | null
  element?.blur()
}
</script>

