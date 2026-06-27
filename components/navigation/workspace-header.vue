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

      <channel-select class="header-control-item min-w-0 shrink-0" />

      <div v-if="resolvedTabs.length" class="dropdown min-w-0 flex-1 xl:hidden">
        <button
          tabindex="0"
          type="button"
          class="btn flex h-10 min-h-10 w-full max-w-full items-center justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-2 shadow-sm sm:h-11 sm:min-h-11"
        >
          <span
            class="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-base-200 sm:h-9 sm:w-9"
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
                class="h-4 w-4 text-base-100 drop-shadow sm:h-5 sm:w-5"
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

            <span class="max-w-full truncate text-sm font-black sm:text-base">
              {{ activeTitle }}
            </span>
          </span>
        </button>

        <ul
          tabindex="0"
          class="menu dropdown-content z-110 mt-2 max-h-80 w-[min(24rem,calc(100vw-1rem))] flex-nowrap overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-2 shadow-2xl"
        >
          <li v-for="tab in resolvedTabs" :key="tab.key">
            <button
              type="button"
              class="flex min-h-12 items-center gap-2 rounded-xl"
              :class="
                activeTabKey === tab.key
                  ? 'active bg-primary text-primary-content'
                  : ''
              "
              @click="selectTabFromDropdown(tab.key)"
            >
              <span
                class="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-base-200"
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
                <span class="max-w-full truncate text-sm font-black">
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
        class="flex min-w-0 flex-1 flex-col justify-center leading-tight xl:max-w-80 xl:shrink-0 xl:flex-none"
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

      <nav
        v-if="resolvedTabs.length"
        class="hidden min-w-0 flex-1 items-stretch overflow-hidden rounded-2xl bg-base-200/70 p-1 xl:flex xl:min-h-13"
        aria-label="Dashboard tabs"
      >
        <div class="grid min-w-0 flex-1 gap-1" :class="desktopTabGridClass">
          <button
            v-for="tab in resolvedTabs"
            :key="tab.key"
            type="button"
            class="group relative isolate flex min-h-11 min-w-0 items-center gap-2 overflow-hidden rounded-xl border px-2 py-1 text-left font-black normal-case leading-tight transition-all hover:-translate-y-0.5 hover:shadow-md"
            :class="
              activeTabKey === tab.key
                ? 'border-primary bg-primary text-primary-content shadow-sm'
                : 'border-base-300 bg-base-100 text-base-content hover:border-primary/40'
            "
            @click="setTab(tab.key)"
          >
            <img
              v-if="tab.image"
              :src="tab.image"
              :alt="tab.title || tab.label"
              class="absolute inset-0 -z-10 h-full w-full object-cover opacity-25 transition-all duration-300 group-hover:scale-105 group-hover:opacity-45"
              :class="activeTabKey === tab.key ? 'opacity-40' : ''"
            />

            <span
              class="absolute inset-0 -z-10 bg-linear-to-r from-base-100/95 via-base-100/80 to-base-100/45"
              :class="
                activeTabKey === tab.key
                  ? 'from-primary via-primary/90 to-primary/55'
                  : ''
              "
            />

            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border backdrop-blur-sm"
              :class="
                activeTabKey === tab.key
                  ? 'border-primary-content/40 bg-primary-content/20 text-primary-content'
                  : 'border-base-300 bg-base-100/80 text-base-content'
              "
            >
              <Icon :name="tab.icon || fallbackIcon" class="h-4 w-4 shrink-0" />
            </span>

            <span class="min-w-0 flex-1 truncate text-sm drop-shadow-sm 2xl:text-base">
              {{ tab.label }}
            </span>
          </button>
        </div>
      </nav>

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

const desktopTabGridClass = computed(() => {
  const count = resolvedTabs.value.length

  if (count >= 7) return 'grid-cols-4 grid-rows-2'
  if (count >= 6) return 'grid-cols-3 grid-rows-2'
  if (count === 5) return 'grid-cols-5'
  if (count === 4) return 'grid-cols-4'
  if (count === 3) return 'grid-cols-3'
  if (count === 2) return 'grid-cols-2'

  return 'grid-cols-1'
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
    min-height: 2.5rem;
    height: 2.5rem;
    min-width: 2.5rem;
    width: 2.5rem;
  }

  .header-control-strip :deep(.login-switcher-avatar),
  .header-control-item :deep(.login-switcher-avatar) {
    width: 2.5rem;
    min-width: 2.5rem;
    height: 2.5rem;
    min-height: 2.5rem;
  }
}
</style>
