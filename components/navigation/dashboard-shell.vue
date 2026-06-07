<!-- /components/content/navigation/dashboard-shell.vue -->
<template>
  <div
    class="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-base-200 p-3 sm:p-4"
  >
    <transition name="fade-up">
      <button
        v-if="!showHeader"
        class="absolute left-1 top-1 z-30 flex items-center gap-1.5 rounded-xl border border-base-300 bg-base-100 px-2.5 py-1.5 text-xs font-bold text-base-content shadow-md backdrop-blur transition-all hover:border-primary hover:text-primary active:scale-95"
        type="button"
        title="Show header"
        @click="toggleHeader"
      >
        <Icon name="kind-icon:expand" class="h-3.5 w-3.5" />
        <span>Show</span>
      </button>
    </transition>

    <transition name="fade-up">
      <header
        v-if="showHeader"
        class="relative z-30 mb-3 shrink-0 overflow-visible rounded-2xl border border-base-300 bg-base-100 shadow-sm"
      >
           <div class="flex min-w-0 items-stretch gap-3 p-3 lg:gap-4 lg:p-4">
          <button
            type="button"
            title="Hide header"
            class="group relative h-20 w-20 shrink-0 self-stretch overflow-hidden rounded-2xl ring-1 ring-base-300 sm:h-24 sm:w-24 lg:min-h-24 lg:w-28"
            @click="toggleHeader"
          >
            <page-image
              class="h-full w-full rounded-2xl object-cover transition-opacity group-hover:opacity-60"
            />

            <span
              class="absolute inset-0 flex items-center justify-center rounded-2xl bg-base-content/0 opacity-0 transition-all group-hover:bg-base-content/15 group-hover:opacity-100"
            >
              <Icon
                name="kind-icon:collapse"
                class="h-6 w-6 text-base-content drop-shadow"
              />
            </span>
          </button>

          <section
            class="flex w-48 min-w-0 shrink-0 flex-col justify-center self-stretch sm:w-56 lg:w-72"
          >
            <p
              v-if="shellTitle"
              class="truncate text-sm font-black uppercase tracking-wide text-primary/70 sm:text-base"
            >
              {{ shellTitle }}
            </p>

            <h1
              class="truncate text-2xl font-black leading-tight text-base-content sm:text-3xl lg:text-4xl"
            >
              {{ activeTitle }}
            </h1>

            <p
              v-if="activeSummary"
              class="mt-1 line-clamp-3 text-sm font-medium leading-snug text-base-content/60 sm:text-base"
            >
              {{ activeSummary }}
            </p>
          </section>

                <nav
            v-if="resolvedTabs.length"
            class="flex min-w-0 flex-1 flex-wrap content-center items-center gap-2 self-stretch"
          >
            <button
              v-for="tab in resolvedTabs"
              :key="tab.key"
              class="btn btn-sm min-w-0 shrink justify-start rounded-xl px-2.5 py-1.5 text-left transition-all"
              type="button"
              :class="
                activeTabKey === tab.key
                  ? 'btn-primary shadow-sm'
                  : 'btn-ghost border border-base-300 bg-base-100 hover:bg-base-200'
              "
              @click="setTab(tab.key)"
            >
              <Icon :name="tab.icon || fallbackIcon" class="h-4 w-4 shrink-0" />
              <span class="min-w-0 truncate text-sm font-bold md:text-md lg:text-lg xl:text-xl">
                {{ tab.label }}
              </span>
            </button>
          </nav>

          <div v-else class="min-w-0 flex-1" />

          <section class="flex shrink-0 flex-col gap-2 self-stretch lg:min-w-44">
            <div
              class="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 rounded-2xl border border-base-300 bg-base-200/50 p-2"
            >
              <slot
                name="actions"
                :active-tab="activeTabKey"
                :active-tab-config="activeTabConfig"
              />

              <channel-select />
              <server-selector />
            </div>

            <div
              class="flex min-w-0 items-center justify-end rounded-2xl border border-base-300 bg-base-200/50 p-2"
            >
              <mana-widget />
            </div>
          </section>
        </div>

      </header>
    </transition>

    <section class="relative z-0 min-h-0 flex-1 overflow-hidden">
      <main
        class="flex h-full min-h-0 overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm"
      >
        <section class="min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
          <slot
            :active-tab="activeTabKey"
            :active-tab-config="activeTabConfig"
            :set-tab="setTab"
          />
        </section>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

const showHeader = ref(true)

const shellTitle = computed(
  () => pageStore.room || pageStore.title || 'Kind Robots',
)

const shellSummary = computed(
  () => pageStore.subtitle || pageStore.description || '',
)

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

  const contentTab = navStore.dashboardShell.activeTabHint

  const contentTabExists = resolvedTabs.value.some(
    (tab) => tab.key === contentTab,
  )

  if (contentTabExists) {
    return contentTab
  }

  return navStore.getDashboardTab(key)
})

const activeTabConfig = computed<DashboardTabConfig>(() => {
  const matched = resolvedTabs.value.find(
    (tab) => tab.key === activeTabKey.value,
  )

  return (
    matched ??
    resolvedTabs.value[0] ?? {
      key: activeTabKey.value || 'overview',
      label: 'Overview',
      icon: fallbackIcon,
      title: pageStore.title,
      summary: shellSummary.value,
    }
  )
})

const activeTitle = computed(
  () =>
    activeTabConfig.value.title ||
    activeTabConfig.value.label ||
    pageStore.title,
)

const activeSummary = computed(
  () => activeTabConfig.value.summary || shellSummary.value,
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
      'dashboard-shell route-enforced tab',
    )
  },
  { immediate: true },
)

function setTab(tabKey: string): void {
  const key = resolvedDashboardKey.value
  if (!key) return

  navStore.setDashboardTab(key, tabKey, 'dashboard-shell tab button')
}

function toggleHeader(): void {
  showHeader.value = !showHeader.value
}
</script>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
</style>
