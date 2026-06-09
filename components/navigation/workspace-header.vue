<!-- /components/content/navigation/workspace-header.vue -->
<template>
  <div class="relative z-30 shrink-0 overflow-visible">
    <transition name="header-toggle">
      <button
        v-if="chromeMinimized"
        class="absolute left-1 top-1 z-30 flex items-center gap-1.5 rounded-xl border border-base-300 bg-base-100 px-2.5 py-1.5 text-xs font-bold text-base-content shadow-md backdrop-blur transition-all hover:border-primary hover:text-primary active:scale-95"
        type="button"
        title="Show header and footer"
        @click="toggleChrome"
      >
        <Icon name="kind-icon:expand" class="h-3.5 w-3.5" />
        <span>Show</span>
      </button>
    </transition>

    <transition name="header-slide">
      <header
        v-if="!chromeMinimized"
        class="relative z-30 mb-3 shrink-0 overflow-visible rounded-2xl border border-base-300 bg-base-100 shadow-sm"
      >
        <div
          class="flex min-h-20 min-w-0 items-stretch gap-2 p-2 sm:min-h-28 sm:gap-3 sm:p-3 lg:min-h-36 lg:gap-4 lg:p-4 xl:min-h-40"
        >
          <button
            type="button"
            title="Hide header and footer"
            class="group relative size-14 shrink-0 self-center overflow-hidden rounded-2xl ring-1 ring-base-300 sm:size-20 lg:size-32 xl:size-36"
            @click="toggleChrome"
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
            class="hidden min-w-0 shrink-0 flex-col justify-center self-stretch lg:flex lg:w-52 xl:w-64 2xl:w-72"
          >
            <p
              v-if="shellTitle"
              class="truncate text-xs font-black uppercase tracking-wide text-primary/70 sm:text-sm"
            >
              {{ shellTitle }}
            </p>

            <h1
              class="truncate text-3xl font-black leading-tight text-base-content lg:text-4xl"
            >
              {{ activeTitle }}
            </h1>

            <p
              v-if="activeSummary"
              class="mt-1 line-clamp-3 text-xs font-medium leading-snug text-base-content/60 sm:text-sm lg:text-[0.95rem]"
            >
              {{ activeSummary }}
            </p>
          </section>

          <div
            v-if="resolvedTabs.length"
            class="dropdown min-w-0 flex-1 self-center lg:hidden"
          >
            <div
              tabindex="0"
              role="button"
              class="btn btn-primary h-12 min-h-12 w-full min-w-0 justify-between rounded-xl px-3 shadow-sm"
            >
              <span class="flex min-w-0 items-center gap-2">
                <Icon
                  :name="activeTabConfig.icon || fallbackIcon"
                  class="h-5 w-5 shrink-0"
                />

                <span class="flex min-w-0 flex-col items-start leading-tight">
                  <span
                    v-if="shellTitle"
                    class="truncate text-[0.6rem] font-bold uppercase tracking-wide text-primary-content/70"
                  >
                    {{ shellTitle }}
                  </span>

                  <span class="min-w-0 truncate text-sm font-bold">
                    {{ activeTitle }}
                  </span>
                </span>
              </span>

              <Icon
                name="kind-icon:chevron-down"
                class="h-4 w-4 shrink-0 opacity-80"
              />
            </div>

            <ul
              tabindex="0"
              class="menu dropdown-content z-50 mt-2 max-h-72 w-72 flex-nowrap overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl"
            >
              <li v-for="tab in resolvedTabs" :key="tab.key">
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-xl"
                  :class="
                    activeTabKey === tab.key
                      ? 'active bg-primary text-primary-content'
                      : ''
                  "
                  @click="selectTabFromDropdown(tab.key)"
                >
                  <Icon
                    :name="tab.icon || fallbackIcon"
                    class="h-4 w-4 shrink-0"
                  />

                  <span class="min-w-0 truncate text-sm font-bold">
                    {{ tab.title || tab.label }}
                  </span>
                </button>
              </li>
            </ul>
          </div>

          <section
            v-else
            class="flex min-w-0 flex-1 flex-col justify-center self-center lg:hidden"
          >
            <p
              v-if="shellTitle"
              class="truncate text-[0.6rem] font-black uppercase tracking-wide text-primary/70"
            >
              {{ shellTitle }}
            </p>

            <h1
              class="truncate text-lg font-black leading-tight text-base-content sm:text-2xl"
            >
              {{ activeTitle }}
            </h1>
          </section>

          <nav
            v-if="resolvedTabs.length"
            class="hidden min-w-0 flex-1 items-stretch overflow-hidden rounded-2xl border border-base-300 bg-base-200/70 p-1.5 lg:flex"
            aria-label="Dashboard tabs"
          >
            <div
              class="grid min-h-0 w-full min-w-0 grid-cols-2 gap-1.5 lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none"
            >
              <button
                v-for="tab in resolvedTabs"
                :key="tab.key"
                class="btn h-full min-h-0 w-full min-w-0 justify-center rounded-xl border border-transparent px-2 py-2 text-center text-sm font-black normal-case leading-tight transition-all xl:px-3 xl:text-base 2xl:text-lg"
                type="button"
                :class="
                  activeTabKey === tab.key
                    ? 'btn-primary shadow-sm'
                    : 'btn-ghost bg-base-100/70 hover:border-primary/30 hover:bg-base-100'
                "
                @click="setTab(tab.key)"
              >
                <span
                  class="flex min-w-0 flex-col items-center justify-center gap-1 xl:gap-1.5"
                >
                  <Icon
                    :name="tab.icon || fallbackIcon"
                    class="h-5 w-5 shrink-0 xl:h-6 xl:w-6 2xl:h-7 2xl:w-7"
                  />

                  <span class="max-w-full truncate">
                    {{ tab.label }}
                  </span>
                </span>
              </button>
            </div>
          </nav>

          <div v-else class="hidden min-w-0 flex-1 lg:block" />

          <section
            class="header-control-rail flex w-auto shrink-0 flex-col gap-1 self-stretch sm:w-44 sm:gap-2 lg:w-44 xl:w-48 2xl:w-52"
          >
            <div
              class="header-icon-strip flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-1 overflow-visible rounded-2xl border border-base-300 bg-base-200/50 p-1 sm:gap-2 sm:overflow-hidden sm:p-2"
            >
              <channel-select class="shrink-0" />
              <server-selector class="shrink-0" />
              <mana-widget class="shrink-0 lg:hidden" />
            </div>

            <div
              class="hidden min-w-0 items-center justify-end overflow-visible rounded-2xl border border-base-300 bg-base-200/50 p-1 sm:overflow-hidden sm:p-2 lg:flex"
            >
              <mana-widget />
            </div>
          </section>
        </div>
      </header>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import {
  isDashboardKey,
  type DashboardKey,
  type DashboardTabConfig,
} from '@/stores/helpers/dashboardHelper'
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'

const props = withDefaults(
  defineProps<{
    chromeMinimized?: boolean
  }>(),
  {
    chromeMinimized: false,
  },
)

const emit = defineEmits<{
  toggleChrome: []
}>()

const fallbackIcon = 'kind-icon:sparkles'

const navStore = useNavStore()
const pageStore = usePageStore()

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

function toggleChrome(): void {
  emit('toggleChrome')
}
</script>

<style scoped>
.header-slide-enter-active,
.header-slide-leave-active {
  transform-origin: top center;
  transition:
    opacity 220ms ease,
    transform 220ms ease,
    max-height 220ms ease,
    margin-bottom 220ms ease;
  will-change: opacity, transform, max-height, margin-bottom;
}

.header-slide-enter-from,
.header-slide-leave-to {
  max-height: 0;
  margin-bottom: 0;
  opacity: 0;
  transform: translateY(-1rem) scaleY(0.96);
}

.header-slide-enter-to,
.header-slide-leave-from {
  max-height: 14rem;
  margin-bottom: 0.75rem;
  opacity: 1;
  transform: translateY(0) scaleY(1);
}

.header-toggle-enter-active,
.header-toggle-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.header-toggle-enter-from,
.header-toggle-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.header-toggle-enter-to,
.header-toggle-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.header-icon-strip :deep(.btn) {
  min-height: 2.25rem;
  height: 2.25rem;
}

@media (max-width: 639px) {
  .header-icon-strip :deep(.btn) {
    width: 2.25rem;
    min-width: 2.25rem;
    padding-left: 0;
    padding-right: 0;
    gap: 0;
  }

  .header-icon-strip :deep(.btn > span:not(.loading):not(.mana-icon)) {
    display: none;
  }

  .header-icon-strip :deep(.btn > .badge) {
    display: none;
  }

  .header-icon-strip :deep(.mana-icon) {
    display: inline-flex;
  }

  .header-icon-strip :deep(svg) {
    display: inline-block;
  }
}
</style>