<!-- /components/content/navigation/dashboard-shell.vue -->
<template>
  <div
    class="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-base-200 p-3 sm:p-4"
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
              <p v-if="shellTitle" class="text-sm font-bold text-primary/70">
                {{ shellTitle }}
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
                :title="shellRefreshLabel"
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
      </header>
    </transition>

    <transition name="fade-up">
      <div
        v-if="loading"
        class="relative z-30 mb-3 flex shrink-0 items-center gap-2 rounded-xl border border-info/30 bg-info/10 px-4 py-2.5 text-sm font-medium text-info"
      >
        <Icon name="kind-icon:spinner" class="h-4 w-4 animate-spin" />
        {{ shellLoadingMessage }}
      </div>
    </transition>

    <transition name="fade-up">
      <div
        v-if="error"
        class="relative z-30 mb-3 flex shrink-0 items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm font-medium text-error"
      >
        <Icon name="kind-icon:alert" class="h-4 w-4 shrink-0" />
        {{ error }}
      </div>
    </transition>

    <section class="relative z-0 min-h-0 flex-1 overflow-hidden">
      <main
        class="flex h-full min-h-0 overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm"
      >
        <section
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4"
        >
          <slot
            :active-tab="normalizedActiveTab"
            :active-tab-config="activeTabConfig"
            :set-tab="setTab"
          />
        </section>
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
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'

const fallbackIcon = 'kind-icon:sparkles'
const storageKey = 'kind-dashboard-shell-show-header'
const logPrefix = '[dashboard-shell]'

const props = withDefaults(
  defineProps<{
    title?: string
    summary?: string
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
    title: '',
    summary: '',
    tabs: () => [],
    activeTab: '',
    loading: false,
    loadingMessage: '',
    error: null,
    showRefresh: true,
    refreshLabel: '',
    navZClass: 'z-30',
    navGridClass: '',
  },
)

const emit = defineEmits<{
  refresh: []
}>()

const navStore = useNavStore()
const pageStore = usePageStore()

const showHeader = ref(true)
const mounted = ref(false)
const dashboardTabsHydrated = ref(false)
const lastFrontMatterTabSync = ref('')

const shellTitle = computed(() => {
  return props.title || pageStore.room || pageStore.title || 'Kind Robots'
})

const shellSummary = computed(() => {
  return props.summary || pageStore.subtitle || pageStore.description || ''
})

const shellLoadingMessage = computed(() => {
  return props.loadingMessage || pageStore.loadingMessage || 'Loading…'
})

const shellRefreshLabel = computed(() => {
  return props.refreshLabel || pageStore.refreshLabel || 'Refresh'
})

const shellDashboardKey = computed(() => {
  return pageStore.dashboardKey || ''
})

const shellActiveTab = computed(() => {
  return props.activeTab || pageStore.dashboardTab || ''
})

const resolvedDashboardKey = computed<DashboardKey | null>(() => {
  const key = shellDashboardKey.value.trim()

  if (!key) return null

  if (!isDashboardKey(key)) {
    console.warn(`${logPrefix} Invalid dashboard key from pageStore`, {
      key,
      pageDashboardKey: pageStore.dashboardKey,
      pageDashboardTab: pageStore.dashboardTab,
    })

    return null
  }

  return key
})

const resolvedTabs = computed<DashboardTabConfig[]>(() => {
  const key = resolvedDashboardKey.value

  if (!key) {
    return props.tabs
  }

  try {
    const tabs = navStore.getDashboardTabs(key)

    if (!Array.isArray(tabs)) {
      console.warn(`${logPrefix} getDashboardTabs did not return an array`, {
        key,
        tabs,
      })

      return props.tabs
    }

    return tabs
  } catch (error) {
    console.error(`${logPrefix} Failed to resolve dashboard tabs`, error)
    return props.tabs
  }
})

const requestedActiveTab = computed(() => {
  const key = resolvedDashboardKey.value

  if (!key) {
    return shellActiveTab.value
  }

  try {
    return navStore.getDashboardTab(key) || shellActiveTab.value
  } catch (error) {
    console.error(`${logPrefix} Failed to resolve active tab`, error)
    return shellActiveTab.value
  }
})

const resolvedNavGridClass = computed(() => {
  if (props.navGridClass.trim()) return props.navGridClass
  return 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
})

const fallbackTab = computed<DashboardTabConfig>(() => {
  const firstTab = resolvedTabs.value[0]
  const requested = requestedActiveTab.value

  return {
    key: requested || firstTab?.key || 'overview',
    label: firstTab?.label || requested || 'Overview',
    icon: firstTab?.icon || fallbackIcon,
    title: firstTab?.title || firstTab?.label || requested || pageStore.title,
    summary: firstTab?.summary || shellSummary.value,
  }
})

const activeTabConfig = computed<DashboardTabConfig>(() => {
  const requested = requestedActiveTab.value.trim()

  if (requested) {
    const matched = resolvedTabs.value.find((tab) => tab.key === requested)

    if (matched) {
      return matched
    }

    return {
      key: requested,
      label: requested,
      icon: fallbackIcon,
      title: requested,
      summary: shellSummary.value,
    }
  }

  return resolvedTabs.value[0] ?? fallbackTab.value
})

const normalizedActiveTab = computed(() => {
  return requestedActiveTab.value || activeTabConfig.value.key
})

const activeTitle = computed(() => {
  return (
    activeTabConfig.value.title ||
    activeTabConfig.value.label ||
    pageStore.title
  )
})

const activeSummary = computed(() => {
  return activeTabConfig.value.summary || shellSummary.value
})

function logPageDashboardState(label: string) {
  if (!import.meta.client) return

  console.groupCollapsed(`${logPrefix} ${label}`)
  console.log('mounted:', mounted.value)
  console.log('dashboardTabsHydrated:', dashboardTabsHydrated.value)
  console.log('pageStore.title:', pageStore.title)
  console.log('pageStore.room:', pageStore.room)
  console.log('pageStore.subtitle:', pageStore.subtitle)
  console.log('pageStore.description:', pageStore.description)
  console.log('pageStore.dashboardKey:', pageStore.dashboardKey)
  console.log('pageStore.dashboardTab:', pageStore.dashboardTab)
  console.log('shellDashboardKey:', shellDashboardKey.value)
  console.log('shellActiveTab:', shellActiveTab.value)
  console.log('resolvedDashboardKey:', resolvedDashboardKey.value)
  console.log('requestedActiveTab:', requestedActiveTab.value)
  console.log('normalizedActiveTab:', normalizedActiveTab.value)
  console.log('resolvedTabs:', resolvedTabs.value)
  console.groupEnd()
}

function setTab(tabKey: string, source = 'dashboard-shell tab button') {
  const key = resolvedDashboardKey.value

  console.log(`${logPrefix} setTab requested`, {
    key,
    tabKey,
    source,
    currentTab: key ? navStore.getDashboardTab(key) : '',
  })

  if (!key) {
    console.warn(
      `${logPrefix} setTab skipped because dashboard key is missing`,
      {
        tabKey,
        source,
        pageDashboardKey: pageStore.dashboardKey,
        pageDashboardTab: pageStore.dashboardTab,
      },
    )

    return
  }

  try {
    const currentTab = navStore.getDashboardTab(key)

    if (currentTab === tabKey) {
      console.log(`${logPrefix} setTab skipped because tab is already active`, {
        key,
        tabKey,
        source,
      })

      return
    }

    navStore.setDashboardTab(key, tabKey, source)

    console.log(`${logPrefix} setTab complete`, {
      key,
      tabKey,
      source,
      nextTab: navStore.getDashboardTab(key),
    })
  } catch (error) {
    console.error(`${logPrefix} Failed to set tab`, error)
  }
}

function toggleHeader() {
  showHeader.value = !showHeader.value

  console.log(`${logPrefix} toggleHeader`, {
    showHeader: showHeader.value,
  })
}

function loadHeaderPreference() {
  if (!import.meta.client) return

  console.log(`${logPrefix} loading header preference`)

  try {
    const saved = localStorage.getItem(storageKey)

    console.log(`${logPrefix} header preference value`, {
      storageKey,
      saved,
    })

    if (saved === 'true') {
      showHeader.value = true
      return
    }

    if (saved === 'false') {
      showHeader.value = false
    }
  } catch (error) {
    console.error(`${logPrefix} Failed to load header preference`, error)
  } finally {
    console.log(`${logPrefix} loaded header preference`, {
      showHeader: showHeader.value,
    })
  }
}

function saveHeaderPreference(value: boolean) {
  if (!import.meta.client) return

  try {
    localStorage.setItem(storageKey, String(value))

    console.log(`${logPrefix} saved header preference`, {
      storageKey,
      value,
    })
  } catch (error) {
    console.error(`${logPrefix} Failed to save header preference`, error)
  }
}

function hydrateDashboardTabsOnce() {
  if (!import.meta.client) return

  if (dashboardTabsHydrated.value) {
    console.log(`${logPrefix} hydrateDashboardTabs skipped, already hydrated`)
    return
  }

  const key = resolvedDashboardKey.value

  if (!key) {
    console.log(
      `${logPrefix} hydrateDashboardTabs skipped, no page dashboard key`,
      {
        pageDashboardKey: pageStore.dashboardKey,
        pageDashboardTab: pageStore.dashboardTab,
      },
    )

    return
  }

  console.log(`${logPrefix} hydrating dashboard tabs`, {
    key,
    pageDashboardTab: pageStore.dashboardTab,
  })

  try {
    navStore.hydrateDashboardTabs(true)
    dashboardTabsHydrated.value = true

    console.log(`${logPrefix} hydrated dashboard tabs`, {
      key,
      currentTab: navStore.getDashboardTab(key),
      pageDashboardTab: pageStore.dashboardTab,
    })
  } catch (error) {
    console.error(`${logPrefix} Failed to hydrate dashboard tabs`, error)
  }
}

function syncFrontMatterTab() {
  if (!import.meta.client) return

  const key = resolvedDashboardKey.value
  const tab = pageStore.dashboardTab
  const syncKey = `${key || 'none'}:${tab || 'none'}`

  console.log(`${logPrefix} syncFrontMatterTab requested`, {
    key,
    tab,
    syncKey,
    lastFrontMatterTabSync: lastFrontMatterTabSync.value,
  })

  if (!mounted.value) {
    console.log(`${logPrefix} syncFrontMatterTab skipped before mount`)
    return
  }

  if (!key || !tab) {
    console.log(
      `${logPrefix} syncFrontMatterTab skipped, missing page key or tab`,
      {
        pageDashboardKey: pageStore.dashboardKey,
        pageDashboardTab: pageStore.dashboardTab,
      },
    )

    return
  }

  if (lastFrontMatterTabSync.value === syncKey) {
    console.log(`${logPrefix} syncFrontMatterTab skipped, already synced`, {
      syncKey,
    })

    return
  }

  lastFrontMatterTabSync.value = syncKey
  setTab(tab, 'page front matter dashboardTab')
}

watch(showHeader, (value) => {
  saveHeaderPreference(value)
})

watch(
  () => [pageStore.dashboardKey, pageStore.dashboardTab] as const,
  () => {
    logPageDashboardState('page dashboard changed')
    hydrateDashboardTabsOnce()
    syncFrontMatterTab()
  },
  { flush: 'post' },
)

onMounted(() => {
  mounted.value = true

  console.groupCollapsed(`${logPrefix} mounted`)
  console.log('props:', props)
  console.log('pageStore snapshot:', {
    title: pageStore.title,
    room: pageStore.room,
    subtitle: pageStore.subtitle,
    description: pageStore.description,
    dashboardKey: pageStore.dashboardKey,
    dashboardTab: pageStore.dashboardTab,
    loadingMessage: pageStore.loadingMessage,
    refreshLabel: pageStore.refreshLabel,
  })
  console.groupEnd()

  loadHeaderPreference()
  hydrateDashboardTabsOnce()
  syncFrontMatterTab()
  logPageDashboardState('mounted state')
})
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
