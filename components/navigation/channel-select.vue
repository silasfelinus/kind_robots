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

    <ul
      tabindex="0"
      class="menu dropdown-content z-110 mt-2 max-h-[min(38rem,calc(100dvh-5rem))] w-[min(22rem,calc(100vw-1rem))] flex-nowrap overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-2 shadow-2xl"
    >
      <li
        v-for="channel in visibleChannels"
        :key="channel.channelKey"
        class="channel-menu-item"
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

            <span class="flex min-w-0 flex-1 flex-col items-start leading-tight">
              <span class="max-w-full truncate text-sm font-black xl:text-base">
                {{ channel.label }}
              </span>
              <span class="max-w-full truncate text-xs font-semibold opacity-65">
                {{ destinationTab(channel)?.label || channel.title }}
              </span>
            </span>
          </button>

          <button
            v-if="channel.tabs.length > 1"
            type="button"
            class="flex w-10 shrink-0 items-center justify-center border-l border-current/10"
            :aria-label="`Show ${channel.label} tabs`"
            :aria-expanded="expandedChannelKey === channel.channelKey"
            @click.stop="toggleChannel(channel.channelKey)"
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

        <ul
          v-if="channel.tabs.length > 1"
          class="channel-submenu menu ml-5 mt-1 border-l border-base-300 pl-2"
          :class="
            expandedChannelKey === channel.channelKey
              ? 'channel-submenu-open'
              : ''
          "
        >
          <li v-for="tab in channel.tabs" :key="tab.tabKey">
            <button
              type="button"
              class="flex min-h-11 items-center gap-2 rounded-xl"
              :class="
                isActiveTab(channel, tab)
                  ? 'active bg-secondary text-secondary-content'
                  : ''
              "
              @click="selectTab(channel, tab)"
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
                    :name="tab.icon || channel.icon"
                    class="h-4 w-4 text-base-100 drop-shadow"
                  />
                </span>
              </span>

              <span class="flex min-w-0 flex-1 flex-col items-start leading-tight">
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
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isDashboardKey } from '@/stores/helpers/dashboardHelper'
import type {
  ResolvedChannel,
  ResolvedTab,
} from '@/stores/helpers/channelContent'
import { useChannelContentStore } from '@/stores/channelContentStore'
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'
import { useSheetStore } from '@/stores/sheetStore'

const route = useRoute()
const router = useRouter()
const navStore = useNavStore()
const pageStore = usePageStore()
const sheetStore = useSheetStore()
const channelContentStore = useChannelContentStore()
const expandedChannelKey = ref('')

await channelContentStore.initialize()

const visibleChannels = computed(() => channelContentStore.visibleChannels)

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

const resolvedLocation = computed(() =>
  channelContentStore.resolveLocation({
    channelKey: pageStore.channelKey,
    tabKey: pageStore.tabKey,
    dashboardKey: pageStore.dashboardKey,
    dashboardTab: pageStore.dashboardTab,
    path: route.path,
  }),
)

const activeChannel = computed<ResolvedChannel>(() => {
  return resolvedLocation.value?.channel ?? visibleChannels.value[0] ?? fallbackChannel
})

const activeTab = computed<ResolvedTab | null>(() => {
  const channel = activeChannel.value
  const locatedTab = resolvedLocation.value?.tab
  const locatedOnChildRoute =
    locatedTab &&
    locatedTab.route === route.path &&
    locatedTab.route !== channel.route

  if (locatedOnChildRoute) return locatedTab

  const storedTabKey = channelContentStore.getActiveTab(channel.channelKey)

  return (
    channel.tabs.find((tab) => tab.tabKey === storedTabKey) ??
    locatedTab ??
    channel.tabs.find((tab) => tab.tabKey === channel.defaultTab) ??
    channel.tabs[0] ??
    null
  )
})

watch(
  () => activeChannel.value.channelKey,
  (channelKey) => {
    expandedChannelKey.value = channelKey
  },
  { immediate: true },
)

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

function toggleChannel(channelKey: string): void {
  expandedChannelKey.value =
    expandedChannelKey.value === channelKey ? '' : channelKey
}

function syncLegacyTab(tab: ResolvedTab): void {
  if (!tab.dashboardKey || !isDashboardKey(tab.dashboardKey)) return

  const legacyTabs = navStore.getDashboardTabs(tab.dashboardKey)
  const legacyTab = tab.dashboardTab || tab.tabKey

  if (!legacyTabs.some((item) => item.key === legacyTab)) return

  navStore.setDashboardTab(tab.dashboardKey, legacyTab, 'channel submenu navigation')
}

function setSheetFromTab(tab: ResolvedTab): void {
  sheetStore.setSheetFromTab({
    key: tab.tabKey,
    label: tab.label,
    title: tab.title,
    summary: tab.summary,
    description: tab.description,
    narrative: tab.narrative,
    icon: tab.icon,
    image: tab.image,
  })
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
  syncLegacyTab(tab)
  setSheetFromTab(tab)

  if (tab.route && tab.route !== route.path) {
    void router.push(tab.route)
  }

  closeDropdown()
}

function closeDropdown(): void {
  if (typeof document === 'undefined') return

  const element = document.activeElement as HTMLElement | null
  element?.blur()
}
</script>

<style scoped>
.channel-submenu {
  display: none;
}

.channel-submenu-open,
.channel-menu-item:focus-within > .channel-submenu {
  display: flex;
}

@media (hover: hover) and (pointer: fine) {
  .channel-menu-item:hover > .channel-submenu {
    display: flex;
  }
}
</style>
