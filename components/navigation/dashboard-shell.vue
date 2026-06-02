<!-- /components/content/navigation/dashboard-shell.vue -->
<template>
  <div
    class="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-base-200 p-3 sm:p-4"
  >
    <transition name="fade-up">
      <button
        v-if="!showHeader"
        class="absolute left-1 top-1 z-50 flex items-center gap-1.5 rounded-xl border border-base-300 bg-base-100 px-2.5 py-1.5 text-xs font-bold text-base-content shadow-md backdrop-blur transition-all hover:border-primary hover:text-primary active:scale-95"
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
        class="relative mb-3 shrink-0 overflow-visible rounded-xl border border-base-300 bg-base-100 shadow-sm"
        :class="navZClass"
      >
        <div class="flex flex-col gap-3 p-3 lg:p-4">
          <div class="flex items-start gap-3">
            <button
              type="button"
              title="Hide header"
              class="group relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-base-300 sm:h-20 sm:w-20"
              @click="toggleHeader"
            >
              <page-image
                class="h-full w-full rounded-2xl transition-opacity group-hover:opacity-60"
              />
              <span
                class="absolute inset-0 flex items-center justify-center rounded-2xl bg-base-content/0 opacity-0 transition-all group-hover:bg-base-content/15 group-hover:opacity-100"
              >
                <Icon
                  name="kind-icon:collapse"
                  class="h-5 w-5 text-base-content drop-shadow"
                />
              </span>
            </button>

            <div class="min-w-0 flex-1 pt-0.5">
              <p
                v-if="title"
                class="truncate text-[0.6rem] font-bold uppercase tracking-[0.22em] text-base-content/40"
              >
                {{ title }}
              </p>
              <h1
                class="truncate text-xl font-black leading-tight text-base-content sm:text-2xl"
              >
                {{ activeTitle }}
              </h1>
              <p
                v-if="activeSummary"
                class="mt-0.5 line-clamp-2 text-sm text-base-content/55"
              >
                {{ activeSummary }}
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-1.5 pt-0.5">
              <slot
                name="actions"
                :active-tab="normalizedActiveTab"
                :active-tab-config="activeTabConfig"
              />

              <channel-select />
              <server-selector />
              <mana-widget />

              <button
                v-if="showRefresh"
                class="btn btn-sm btn-ghost rounded-xl border border-base-300 bg-base-100"
                type="button"
                :disabled="loading"
                :title="refreshLabel"
                @click="emit('refresh')"
              >
                <Icon
                  name="kind-icon:refresh"
                  class="h-4 w-4"
                  :class="loading ? 'animate-spin' : ''"
                />
              </button>
            </div>
          </div>

          <div
            v-if="resolvedTabs.length"
            class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-stretch gap-1.5"
          >
            <button
              type="button"
              class="btn btn-sm min-h-9 rounded-xl border border-base-300"
              :class="
                leftSidebarOpen
                  ? 'btn-primary shadow-sm'
                  : 'btn-ghost bg-base-100 hover:bg-base-200'
              "
              :title="leftSidebarOpen ? 'Hide left panel' : 'Show left panel'"
              :aria-pressed="leftSidebarOpen"
              @click="displayStore.toggleLeftSidebar()"
            >
              <Icon
                :name="
                  leftSidebarOpen
                    ? 'kind-icon:panel-left-close'
                    : 'kind-icon:panel-left-open'
                "
                class="h-4 w-4"
              />
            </button>

            <nav class="grid min-w-0 gap-1.5" :class="resolvedNavGridClass">
              <button
                v-for="tab in resolvedTabs"
                :key="tab.key"
                class="btn btn-sm min-h-9 justify-start rounded-xl transition-all"
                type="button"
                :class="
                  normalizedActiveTab === tab.key
                    ? 'btn-primary shadow-sm'
                    : 'btn-ghost border border-base-300 bg-base-100 hover:bg-base-200'
                "
                @click="setTab(tab.key)"
              >
                <Icon
                  :name="tab.icon || fallbackIcon"
                  class="h-4 w-4 shrink-0"
                />
                <span class="min-w-0 truncate">{{ tab.label }}</span>
              </button>
            </nav>

            <button
              type="button"
              class="btn btn-sm min-h-9 rounded-xl border border-base-300"
              :class="
                rightSidebarOpen
                  ? 'btn-secondary shadow-sm'
                  : 'btn-ghost bg-base-100 hover:bg-base-200'
              "
              :title="
                rightSidebarOpen ? 'Hide right panel' : 'Show right panel'
              "
              :aria-pressed="rightSidebarOpen"
              @click="displayStore.toggleRightSidebar()"
            >
              <Icon
                :name="
                  rightSidebarOpen
                    ? 'kind-icon:panel-right-close'
                    : 'kind-icon:panel-right-open'
                "
                class="h-4 w-4"
              />
            </button>
          </div>
        </div>
      </header>
    </transition>

    <transition name="fade-up">
      <div
        v-if="loading"
        class="relative z-40 mb-3 flex shrink-0 items-center gap-2 rounded-xl border border-info/30 bg-info/10 px-4 py-2.5 text-sm font-medium text-info"
      >
        <Icon name="kind-icon:spinner" class="h-4 w-4 animate-spin" />
        {{ loadingMessage }}
      </div>
    </transition>

    <transition name="fade-up">
      <div
        v-if="error"
        class="relative z-40 mb-3 flex shrink-0 items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm font-medium text-error"
      >
        <Icon name="kind-icon:alert" class="h-4 w-4 shrink-0" />
        {{ error }}
      </div>
    </transition>

    <section
      class="relative z-0 grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden"
      :class="contentGridClass"
    >
      <transition name="fade-up">
        <aside
          v-if="leftSidebarOpen"
          class="min-h-0 overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm"
        >
          <div class="h-full min-h-0 overflow-y-auto overscroll-contain p-3">
            <slot
              name="left"
              :active-tab="normalizedActiveTab"
              :active-tab-config="activeTabConfig"
              :set-tab="setTab"
            >
              <splash-tutorial />
            </slot>
          </div>
        </aside>
      </transition>

      <main
        class="min-h-0 overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm"
      >
        <div class="h-full min-h-0 overflow-hidden">
          <slot
            :active-tab="normalizedActiveTab"
            :active-tab-config="activeTabConfig"
            :set-tab="setTab"
          />
        </div>
      </main>

      <transition name="fade-up">
        <aside
          v-if="rightSidebarOpen"
          class="min-h-0 overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm"
        >
          <div class="h-full min-h-0 overflow-y-auto overscroll-contain p-3">
            <slot
              name="right"
              :active-tab="normalizedActiveTab"
              :active-tab-config="activeTabConfig"
              :set-tab="setTab"
            >
              <user-panel />
            </slot>
          </div>
        </aside>
      </transition>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  isDashboardKey,
  type DashboardKey,
  type DashboardTabConfig,
} from '@/stores/helpers/dashboardHelper'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore } from '@/stores/navStore'

const fallbackIcon = 'kind-icon:sparkles'
const storageKey = 'kind-dashboard-shell-show-header'

const props = withDefaults(
  defineProps<{
    title?: string
    summary?: string
    dashboardKey?: DashboardKey | string | null
    tabs?: DashboardTabConfig[]
    activeTab?: string
    loading?: boolean
    loadingMessage?: string
    error?: string | null
    showRefresh?: boolean
    refreshLabel?: string
    navZClass?: string
    navGridClass?: string
    leftSidebarWidth?: string
    rightSidebarWidth?: string
  }>(),
  {
    title: 'Dashboard',
    summary: '',
    dashboardKey: null,
    tabs: () => [],
    activeTab: '',
    loading: false,
    loadingMessage: 'Loading…',
    error: null,
    showRefresh: true,
    refreshLabel: 'Refresh',
    navZClass: 'z-40',
    navGridClass: '',
    leftSidebarWidth: '18rem',
    rightSidebarWidth: '20rem',
  },
)

const emit = defineEmits<{
  'set-tab': [tab: string]
  refresh: []
}>()

const navStore = useNavStore()
const displayStore = useDisplayStore()

const showHeader = ref(true)

const leftSidebarOpen = computed(() => {
  return displayStore.sidebarLeftState !== 'hidden'
})

const rightSidebarOpen = computed(() => {
  return displayStore.sidebarRightState !== 'hidden'
})

const resolvedDashboardKey = computed<DashboardKey | null>(() => {
  const key = (props.dashboardKey ?? '').trim()
  if (!key || !isDashboardKey(key)) return null
  return key
})

const resolvedTabs = computed<DashboardTabConfig[]>(() => {
  const dashboardKey = resolvedDashboardKey.value
  if (dashboardKey) return navStore.getDashboardTabs(dashboardKey)
  return props.tabs
})

const resolvedNavGridClass = computed(() => {
  if (props.navGridClass.trim()) return props.navGridClass
  return 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
})

const requestedActiveTab = computed(() => {
  const dashboardKey = resolvedDashboardKey.value
  if (dashboardKey) return navStore.getDashboardTab(dashboardKey)
  return props.activeTab
})

const fallbackTab = computed<DashboardTabConfig>(() => {
  const firstTab = resolvedTabs.value[0]
  const requested = requestedActiveTab.value
  return {
    key: requested || firstTab?.key || 'overview',
    label: firstTab?.label || requested || 'Overview',
    icon: firstTab?.icon || fallbackIcon,
    title: firstTab?.title || firstTab?.label || requested || 'Overview',
    summary: firstTab?.summary || props.summary || '',
  }
})

const activeTabConfig = computed<DashboardTabConfig>(() => {
  const requested = (requestedActiveTab.value || '').trim()
  if (requested) {
    const matched = resolvedTabs.value.find((tab) => tab.key === requested)
    if (matched) return matched
    return {
      key: requested,
      label: requested,
      icon: fallbackIcon,
      title: requested,
      summary: props.summary || '',
    }
  }
  return resolvedTabs.value[0] ?? fallbackTab.value
})

const normalizedActiveTab = computed(() => {
  return requestedActiveTab.value || activeTabConfig.value.key
})

const activeTitle = computed(() => {
  return activeTabConfig.value.title || activeTabConfig.value.label
})

const activeSummary = computed(() => {
  return activeTabConfig.value.summary || props.summary || ''
})

const contentGridClass = computed(() => {
  if (leftSidebarOpen.value && rightSidebarOpen.value) {
    return `lg:grid-cols-[${props.leftSidebarWidth}_minmax(0,1fr)] xl:grid-cols-[${props.leftSidebarWidth}_minmax(0,1fr)_${props.rightSidebarWidth}]`
  }

  if (leftSidebarOpen.value) {
    return `lg:grid-cols-[${props.leftSidebarWidth}_minmax(0,1fr)]`
  }

  if (rightSidebarOpen.value) {
    return `xl:grid-cols-[minmax(0,1fr)_${props.rightSidebarWidth}]`
  }

  return 'grid-cols-1'
})

function setTab(tabKey: string) {
  const dashboardKey = resolvedDashboardKey.value
  if (dashboardKey) {
    const savedTab = navStore.setDashboardTab(
      dashboardKey,
      tabKey,
      'dashboard-shell tab button',
    )
    emit('set-tab', savedTab)
    return
  }
  emit('set-tab', tabKey)
}

function toggleHeader() {
  showHeader.value = !showHeader.value
}

function loadHeaderPreference() {
  if (!import.meta.client) return
  const saved = localStorage.getItem(storageKey)
  if (saved === 'true') {
    showHeader.value = true
    return
  }
  if (saved === 'false') showHeader.value = false
}

watch(showHeader, (value) => {
  if (!import.meta.client) return
  localStorage.setItem(storageKey, String(value))
})

onMounted(() => {
  loadHeaderPreference()
  const dashboardKey = resolvedDashboardKey.value
  if (dashboardKey) navStore.hydrateDashboardTabs(true)
})
</script>
