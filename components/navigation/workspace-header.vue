<!-- /components/content/navigation/workspace-header.vue -->
<template>
  <header
    class="relative z-50 mb-2 shrink-0 overflow-visible rounded-2xl border border-base-300/70 bg-base-100/95 shadow-sm backdrop-blur"
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

      <!-- Unified tab selector — same layout at every breakpoint, scales up on larger screens -->
      <div v-if="resolvedTabs.length" class="dropdown min-w-0 flex-1">
        <button
          tabindex="0"
          type="button"
          class="btn relative flex h-10 min-h-10 w-full max-w-full items-center gap-2 overflow-hidden rounded-xl border border-base-300 bg-base-100 px-2 shadow-sm sm:h-11 sm:min-h-11 xl:h-14 xl:min-h-14 xl:gap-2.5 xl:px-3"
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

            <span class="max-w-full truncate text-sm font-black sm:text-base xl:text-lg">
              {{ activeTitle }}
            </span>
          </span>

          <Icon
            name="kind-icon:chevron-down"
            class="h-3.5 w-3.5 shrink-0 text-base-content/50 xl:h-4 xl:w-4"
          />
        </button>

        <ul
          tabindex="0"
          class="menu dropdown-content z-110 mt-2 max-h-80 w-[min(24rem,calc(100vw-1rem))] flex-nowrap overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-2 shadow-2xl"
        >
          <li v-for="tab in resolvedTabs" :key="tab.key">
            <button
              type="button"
              class="flex min-h-12 items-center gap-2 rounded-xl xl:min-h-14"
              :class="
                activeTabKey === tab.key
                  ? 'active bg-primary text-primary-content'
                  : ''
              "
              @click="selectTabFromDropdown(tab.key)"
            >
              <span
                class="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-base-200 xl:h-10 xl:w-10"
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
                    :name="tab.icon || fallbackIcon"
                    class="h-4 w-4 text-base-100 drop-shadow"
                  />
                </span>
              </span>

              <span class="flex min-w-0 flex-col items-start">
                <span class="max-w-full truncate text-sm font-black xl:text-base">
                  {{ tab.label }}
                </span>

                <span
                  v-if="tab.summary"
                  class="line-clamp-1 text-xs font-medium opacity-70"
                >
                  {{ tab.summary }}
                </span>
              </span>
            </button>
          </li>
        </ul>
      </div>

      <section
        v-else
        class="flex min-w-0 flex-1 flex-col justify-center leading-tight"
      >
        <p
          v-if="shellTitle"
          class="truncate text-[0.58rem] font-black uppercase tracking-wide text-primary/70 xl:text-xs"
        >
          {{ shellTitle }}
        </p>

        <h1 class="truncate text-sm font-black text-base-content sm:text-base xl:text-xl">
          {{ activeTitle }}
        </h1>
      </section>

      <section class="header-control-strip flex shrink-0 items-center gap-1 sm:gap-1.5">
        <server-selector class="header-control-item min-w-0" />
        <login-switcher class="header-control-item min-w-0" />
        <mana-widget class="header-control-item min-w-0" />
      </section>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  isDashboardKey,
  type DashboardKey,
  type DashboardTabConfig,
} from '@/stores/helpers/dashboardHelper'
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'

const fallbackIcon = 'kind-icon:sparkles'

const navStore = useNavStore()
const pageStore = usePageStore()
const router = useRouter()

const shellTitle = computed(
  () => pageStore.room || pageStore.title || 'Kind Robots',
)

const shellSummary = computed(
  () => pageStore.subtitle || pageStore.description || '',
)

const showBackButton = computed(() => navStore.canGoBack)

const resolvedDashboardKey = computed<DashboardKey | null>(() => {
  const shellKey = navStore.dashboardShell.dashboardKey

  if (shellKey && isDashboardKey(shellKey)) {
    return shellKey
  }

  const pageKey = (pageStore.dashboardKey || '').trim()

  return pageKey && isDashboardKey(pageKey) ? pageKey : null
})

const resolvedTabs = computed<DashboardTabConfig[]>(() => {
  const key = resolvedDashboardKey.value
  return key ? navStore.getDashboardTabs(key) : []
})

const routeRequestedTabKey = computed(() => {
  const tabKey = (pageStore.dashboardTab || '').trim()
  if (!tabKey) return ''

  const tabExists = resolvedTabs.value.some((tab) => tab.key === tabKey)
  return tabExists ? tabKey : ''
})

const activeTabKey = computed(() => {
  const key = resolvedDashboardKey.value
  if (!key) return ''

  const storedTab = navStore.getDashboardTab(key)

  const storedTabExists = resolvedTabs.value.some(
    (tab) => tab.key === storedTab,
  )

  if (storedTabExists) {
    return storedTab
  }

  const contentTab = navStore.dashboardShell.activeTabHint

  const contentTabExists = resolvedTabs.value.some(
    (tab) => tab.key === contentTab,
  )

  if (contentTabExists) {
    return contentTab
  }

  return resolvedTabs.value[0]?.key || ''
})

const activeTabConfig = computed<DashboardTabConfig>(() => {
  const matched = resolvedTabs.value.find(
    (tab) => tab.key === activeTabKey.value,
  )

  if (matched) return matched

  const firstTab = resolvedTabs.value[0]

  if (firstTab) return firstTab

  const title = pageStore.title || 'Overview'
  const summary = shellSummary.value || ''

  return {
    key: activeTabKey.value || 'overview',
    label: title,
    icon: fallbackIcon,
    title,
    summary,
    narrative: summary || title,
    image: pageStore.image || '',
    route: pageStore.currentPage?.path || '/',
  }
})

const activeTitle = computed(
  () =>
    activeTabConfig.value.title ||
    activeTabConfig.value.label ||
    pageStore.title,
)

watch(
  () => ({
    dashboardKey: resolvedDashboardKey.value,
    dashboardTab: routeRequestedTabKey.value,
  }),
  ({ dashboardKey, dashboardTab }) => {
    if (!dashboardKey || !dashboardTab) return

    const currentTab = navStore.getDashboardTab(dashboardKey)
    if (currentTab === dashboardTab) return

    navStore.setDashboardTab(
      dashboardKey,
      dashboardTab,
      'dashboard-header route-enforced tab',
    )
  },
  { immediate: true },
)

function selectTabFromDropdown(tabKey: string): void {
  setTab(tabKey)

  if (typeof document !== 'undefined') {
    const el = document.activeElement as HTMLElement | null
    el?.blur()
  }
}

function setTab(tabKey: string): void {
  const key = resolvedDashboardKey.value
  if (!key) return

  navStore.setDashboardTab(key, tabKey, 'dashboard-header tab button')
}

function goBack(): void {
  const path = navStore.backPath

  if (path) {
    router.push(path)
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

@media (min-width: 1280px) {
  .header-control-strip :deep(.btn),
  .header-control-item :deep(.btn) {
    min-height: 2.75rem;
    height: 2.75rem;
    min-width: 2.75rem;
    width: 2.75rem;
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
