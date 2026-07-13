<!-- /components/navigation/workspace-header.vue -->
<template>
  <header
    class="relative z-30 mb-2 shrink-0 overflow-visible rounded-2xl border border-base-300/70 bg-base-100/95 shadow-sm backdrop-blur"
  >
    <fx-region region="header" />

    <div
      class="flex min-h-12 min-w-0 items-center gap-1.5 px-1.5 py-1.5 sm:gap-2 sm:px-2 xl:min-h-16 xl:gap-3 xl:px-3"
    >
      <button
        v-if="showBackButton"
        type="button"
        class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl border border-base-300 bg-base-100"
        aria-label="Go back"
        title="Go back"
        @click="goBack"
      >
        <Icon name="kind-icon:arrow-left" class="h-5 w-5" />
      </button>

      <channel-select class="shrink-0" />

      <section
        class="relative flex h-10 min-h-10 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-xl border border-base-300 bg-base-100 px-2 shadow-sm sm:h-11 sm:min-h-11 xl:h-14 xl:min-h-14 xl:gap-2.5 xl:px-3"
      >
        <img
          v-if="activeTabConfig.image"
          :src="activeTabConfig.image"
          :alt="activeTabConfig.title || activeTabConfig.label"
          class="absolute inset-0 -z-10 h-full w-full object-cover opacity-15 xl:opacity-20"
        />

        <span
          class="absolute inset-0 -z-10 bg-linear-to-r from-base-100/95 via-base-100/80 to-base-100/40"
        />

        <span
          class="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-base-200 sm:h-9 sm:w-9 xl:h-10 xl:w-10"
        >
          <img
            v-if="activeTabConfig.image"
            :src="activeTabConfig.image"
            :alt="activeTabConfig.title || activeTabConfig.label"
            class="h-full w-full object-cover"
          />
          <span
            class="absolute inset-0 flex items-center justify-center bg-base-content/20"
          >
            <Icon
              :name="activeTabConfig.icon || fallbackIcon"
              class="h-4 w-4 text-base-100 drop-shadow xl:h-5 xl:w-5"
            />
          </span>
        </span>

        <span class="flex min-w-0 flex-1 flex-col items-start leading-tight">
          <span
            v-if="shellTitle"
            class="max-w-full truncate text-[0.58rem] font-black uppercase tracking-wide text-primary/70"
          >
            {{ shellTitle }}
          </span>

          <span
            class="max-w-full truncate text-sm font-black sm:text-base xl:text-lg"
          >
            {{ activeTitle }}
          </span>
        </span>
      </section>

      <section
        class="header-control-strip flex shrink-0 items-center gap-1 sm:gap-1.5"
      >
        <server-selector class="header-control-item min-w-0" />
        <login-switcher class="header-control-item min-w-0" />
        <mana-widget class="shrink-0" />
      </section>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isDashboardKey } from '@/stores/helpers/dashboardHelper'
import type { ResolvedTab } from '@/stores/helpers/channelContent'
import { useChannelContentStore } from '@/stores/channelContentStore'
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'
import { useSheetStore } from '@/stores/sheetStore'

const fallbackIcon = 'kind-icon:sparkles'

const channelContentStore = useChannelContentStore()
const navStore = useNavStore()
const pageStore = usePageStore()
const sheetStore = useSheetStore()
const router = useRouter()
const route = useRoute()

await channelContentStore.initialize()

const resolvedLocation = computed(() =>
  channelContentStore.resolveLocation({
    channelKey: pageStore.channelKey,
    tabKey: pageStore.tabKey,
    dashboardKey: pageStore.dashboardKey,
    dashboardTab: pageStore.dashboardTab,
    path: route.path,
  }),
)

const resolvedChannel = computed(() => resolvedLocation.value?.channel ?? null)
const resolvedTabs = computed(() => resolvedChannel.value?.tabs ?? [])

const shellTitle = computed(
  () =>
    resolvedChannel.value?.room ||
    pageStore.room ||
    pageStore.title ||
    'Kind Robots',
)

const shellSummary = computed(
  () => pageStore.subtitle || pageStore.description || '',
)

const showBackButton = computed(() => navStore.canGoBack)

const activeTabKey = computed(() => {
  const channel = resolvedChannel.value
  if (!channel) return ''

  const locatedTab = resolvedLocation.value?.tab
  const locatedOnChildRoute =
    locatedTab &&
    locatedTab.route === route.path &&
    locatedTab.route !== channel.route

  if (locatedOnChildRoute) return locatedTab.tabKey

  const stored = channelContentStore.getActiveTab(channel.channelKey)
  if (stored && channel.tabs.some((tab) => tab.tabKey === stored)) return stored

  return locatedTab?.tabKey || channel.defaultTab || channel.tabs[0]?.tabKey || ''
})

const fallbackTab: ResolvedTab = {
  key: 'overview',
  channelKey: 'home',
  tabKey: 'overview',
  dashboardKey: '',
  dashboardTab: '',
  label: pageStore.title || 'Overview',
  title: pageStore.title || 'Overview',
  room: pageStore.room || 'Kind Robots',
  subtitle: shellSummary.value,
  description: shellSummary.value,
  summary: shellSummary.value,
  narrative: shellSummary.value || pageStore.title || 'Overview',
  tooltip: pageStore.tooltip,
  icon: fallbackIcon,
  image: pageStore.image || '',
  route: pageStore.currentPage?.path || '/',
  component: '',
  modelType: '',
  sort: 0,
  cards: null,
  tutorial: null,
  requiredBeforeNext: [],
  requiredRole: '',
  requiredPermission: '',
  loadingMessage: pageStore.loadingMessage || 'Loading…',
  refreshLabel: pageStore.refreshLabel || 'Refresh',
  dottiTip: pageStore.dottiTip,
  amiTip: pageStore.amiTip,
}

const activeTabConfig = computed<ResolvedTab>(() => {
  return (
    resolvedTabs.value.find((tab) => tab.tabKey === activeTabKey.value) ??
    resolvedTabs.value[0] ??
    fallbackTab
  )
})

const activeTitle = computed(
  () =>
    activeTabConfig.value.title ||
    activeTabConfig.value.label ||
    pageStore.title,
)

watch(
  () => ({
    channelKey: resolvedChannel.value?.channelKey || '',
    tabKey: resolvedLocation.value?.tab?.tabKey || '',
    path: route.path,
  }),
  ({ channelKey, tabKey }) => {
    if (!channelKey || !tabKey) return

    const tab = resolvedTabs.value.find((item) => item.tabKey === tabKey)
    if (!tab) return

    channelContentStore.setActiveTab(channelKey, tabKey)
    syncLegacyTab(tab, 'workspace-header route sync')
    setSheetFromTab(tab)
  },
  { immediate: true },
)

function syncLegacyTab(tab: ResolvedTab, reason: string): void {
  if (!tab.dashboardKey || !isDashboardKey(tab.dashboardKey)) return

  const legacyTabs = navStore.getDashboardTabs(tab.dashboardKey)
  const legacyTab = tab.dashboardTab || tab.tabKey

  if (!legacyTabs.some((item) => item.key === legacyTab)) return

  navStore.setDashboardTab(tab.dashboardKey, legacyTab, reason)
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

function goBack(): void {
  const path = navStore.backPath

  if (path) {
    void router.push(path)
    return
  }

  router.back()
}
</script>

<style scoped>
.header-control-strip :deep(.btn),
.header-control-item :deep(.btn) {
  min-height: 2.25rem;
  height: 2.25rem;
  min-width: 2.25rem;
  width: 2.25rem;
  padding-left: 0;
  padding-right: 0;
  gap: 0;
}

.header-control-strip :deep(.btn .control-label),
.header-control-strip :deep(.btn > .badge),
.header-control-item :deep(.btn .control-label),
.header-control-item :deep(.btn > .badge) {
  display: none;
}

.header-control-strip :deep(.mana-icon),
.header-control-strip :deep(.iconify),
.header-control-strip :deep(svg),
.header-control-item :deep(.mana-icon),
.header-control-item :deep(.iconify),
.header-control-item :deep(svg) {
  display: inline-flex;
  flex-shrink: 0;
}

.header-control-strip :deep(.login-switcher),
.header-control-item :deep(.login-switcher) {
  width: 100%;
  justify-self: center;
}

.header-control-strip :deep(.login-switcher-avatar),
.header-control-item :deep(.login-switcher-avatar) {
  width: 2.25rem;
  min-width: 2.25rem;
  height: 2.25rem;
  min-height: 2.25rem;
  aspect-ratio: 1 / 1;
  border-radius: 9999px;
  padding-left: 0;
  padding-right: 0;
}

.header-control-strip :deep(.mana-widget .btn) {
  width: auto;
  min-width: 2.25rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  gap: 0.25rem;
}

@media (min-width: 1280px) {
  .header-control-strip :deep(.btn),
  .header-control-item :deep(.btn) {
    min-height: 2.75rem;
    height: 2.75rem;
    min-width: 2.75rem;
    width: 2.75rem;
  }

  .header-control-strip :deep(.mana-widget .btn) {
    width: auto;
    min-width: 2.75rem;
    padding-left: 0.625rem;
    padding-right: 0.625rem;
  }

  .header-control-strip :deep(.login-switcher-avatar),
  .header-control-item :deep(.login-switcher-avatar) {
    width: 2.75rem;
    min-width: 2.75rem;
    height: 2.75rem;
    min-height: 2.75rem;
  }
}
</style>
