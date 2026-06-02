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

          <nav
            v-if="resolvedTabs.length"
            class="grid min-w-0 gap-1.5"
            :class="resolvedNavGridClass"
          >
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
              <Icon :name="tab.icon || fallbackIcon" class="h-4 w-4 shrink-0" />
              <span class="min-w-0 truncate">{{ tab.label }}</span>
            </button>
          </nav>
        </div>

        <!-- Toggles flank the header's bottom corners, floating outside it -->
        <button
          type="button"
          class="absolute -bottom-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-base-300 shadow-md backdrop-blur transition-all hover:scale-105 active:scale-95"
          :class="
            leftSidebarOpen
              ? 'bg-primary text-primary-content'
              : 'bg-base-100 text-base-content hover:border-primary hover:text-primary'
          "
          :title="leftSidebarOpen ? 'Hide left panel' : 'Show left panel'"
          :aria-pressed="leftSidebarOpen"
          @click="displayStore.toggleLeftSidebar()"
        >
          <Icon name="kind-icon:sheet" class="h-4 w-4" />
        </button>

        <button
          type="button"
          class="absolute -bottom-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-base-300 shadow-md backdrop-blur transition-all hover:scale-105 active:scale-95"
          :class="
            rightSidebarOpen
              ? 'bg-secondary text-secondary-content'
              : 'bg-base-100 text-base-content hover:border-secondary hover:text-secondary'
          "
          :title="rightSidebarOpen ? 'Hide help panel' : 'Show help panel'"
          :aria-pressed="rightSidebarOpen"
          @click="displayStore.toggleRightSidebar()"
        >
          <Icon name="kind-icon:question-mark" class="h-4 w-4" />
        </button>
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

    <section class="relative z-0 min-h-0 flex-1 overflow-hidden">
      <main
        class="h-full min-h-0 overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm"
      >
        <div class="h-full min-h-0 overflow-hidden">
          <slot
            :active-tab="normalizedActiveTab"
            :active-tab-config="activeTabConfig"
            :set-tab="setTab"
          />
        </div>
      </main>
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
