<!-- /components/content/navigation/workspace-header.vue -->
<template>
  <div class="relative z-40 shrink-0 overflow-visible">
    <!--
      COMPACT HEADER
      A single minimal row: small page image, tab dropdown, channel dropdown,
      the rail controls (server / login / mana), and the expand toggle.
      Default below xl; also what the full header collapses into.
    -->
    <transition name="header-toggle">
      <header
        v-if="compact"
        class="relative z-50 mb-3 shrink-0 overflow-visible rounded-2xl bg-base-100 shadow-sm"
      >
        <fx-region region="header" />

        <div
          class="flex min-h-14 min-w-0 items-center gap-2 p-1.5 sm:gap-3 sm:p-2"
        >
          <!-- Small page image opens the full header -->
          <button
            type="button"
            title="Expand header"
            aria-label="Expand header"
            class="group relative size-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-base-300 sm:size-12"
            @click="expandHeader"
          >
            <page-image
              class="h-full w-full rounded-xl object-cover transition-opacity group-hover:opacity-60"
            />

            <span
              class="absolute inset-0 flex items-center justify-center rounded-xl bg-base-content/0 opacity-0 transition-all group-hover:bg-base-content/15 group-hover:opacity-100"
            >
              <Icon
                name="kind-icon:expand"
                class="h-4 w-4 text-base-content drop-shadow"
              />
            </span>
          </button>

          <!-- Tab dropdown (reuses the same control as the lg-hidden full view) -->
          <div v-if="resolvedTabs.length" class="dropdown min-w-0 flex-1">
            <button
              tabindex="0"
              type="button"
              class="btn flex h-11 min-h-11 w-full max-w-full items-center justify-between gap-2 rounded-xl bg-base-100 px-2 shadow-sm"
            >
              <span class="flex min-w-0 items-center gap-2">
                <span
                  class="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-lg"
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
                      class="h-4 w-4 text-base-100 drop-shadow"
                    />
                  </span>
                </span>

                <span class="min-w-0 truncate text-sm font-black">
                  {{ activeTitle }}
                </span>
              </span>

              <Icon
                name="kind-icon:chevron-down"
                class="h-4 w-4 shrink-0 opacity-80"
              />
            </button>

            <ul
              tabindex="0"
              class="menu dropdown-content z-110 mt-2 max-h-80 w-[min(22rem,calc(100vw-2rem))] flex-nowrap overflow-y-auto rounded-2xl bg-base-100 p-2 shadow-xl"
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
                    <span class="min-w-0 truncate text-sm font-black">
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

          <!-- No tabs: show the title inline so the row is never empty -->
          <div v-else class="flex min-w-0 flex-1 flex-col justify-center">
            <p
              v-if="shellTitle"
              class="truncate text-[0.6rem] font-black uppercase tracking-wide text-primary/70"
            >
              {{ shellTitle }}
            </p>

            <h1 class="truncate text-base font-black leading-tight">
              {{ activeTitle }}
            </h1>
          </div>

          <!-- Channel dropdown + rail controls, condensed -->
          <div
            class="header-control-compact flex shrink-0 items-center gap-1 sm:gap-1.5"
          >
            <channel-select class="min-w-0" />
            <server-selector class="min-w-0" />
            <login-switcher class="min-w-0" />
            <mana-widget class="min-w-0" />
          </div>

          <!-- Expand toggle -->
          <button
            type="button"
            title="Expand header"
            aria-label="Expand header"
            class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl"
            @click="expandHeader"
          >
            <Icon name="kind-icon:chevron-down" class="h-4 w-4" />
          </button>
        </div>
      </header>
    </transition>

    <!--
      FULL HEADER
      The rich layout: page image, title block, tab nav, control rail.
      Default at xl. The image button (and a collapse affordance) drop back
      to compact.
    -->
    <transition name="header-slide">
      <header
        v-if="!compact"
        class="relative z-40 mb-3 shrink-0 overflow-visible rounded-2xl bg-base-100 shadow-sm"
      >
        <fx-region region="header" />

        <div
          class="flex min-h-20 min-w-0 items-stretch gap-2 p-2 sm:min-h-28 sm:gap-3 sm:p-3 lg:min-h-36 lg:gap-4 lg:p-4 xl:min-h-40"
        >
          <button
            type="button"
            title="Collapse header"
            aria-label="Collapse header"
            class="group relative size-14 shrink-0 self-center overflow-hidden rounded-2xl ring-1 ring-base-300 sm:size-20 lg:size-32 xl:size-36"
            @click="collapseHeader"
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
            <button
              tabindex="0"
              type="button"
              class="btn flex h-14 min-h-14 w-full max-w-full items-center justify-between gap-2 rounded-2xl bg-base-100 px-2 shadow-sm"
            >
              <span class="flex min-w-0 items-center gap-2">
                <span
                  class="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl"
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
                      class="h-5 w-5 text-base-100 drop-shadow"
                    />
                  </span>
                </span>

                <span class="flex min-w-0 flex-col items-start leading-tight">
                  <span
                    v-if="shellTitle"
                    class="truncate text-[0.6rem] font-bold uppercase tracking-wide text-primary/70"
                  >
                    {{ shellTitle }}
                  </span>

                  <span class="min-w-0 truncate text-sm font-black">
                    {{ activeTitle }}
                  </span>
                </span>
              </span>

              <Icon
                name="kind-icon:chevron-down"
                class="h-4 w-4 shrink-0 opacity-80"
              />
            </button>

            <ul
              tabindex="0"
              class="menu dropdown-content z-40 mt-2 max-h-80 w-[min(22rem,calc(100vw-2rem))] flex-nowrap overflow-y-auto rounded-2xl bg-base-100 p-2 shadow-xl"
            >
              <li v-for="tab in resolvedTabs" :key="tab.key">
                <button
                  type="button"
                  class="flex min-h-14 items-center gap-2 rounded-xl"
                  :class="
                    activeTabKey === tab.key
                      ? 'active bg-primary text-primary-content'
                      : ''
                  "
                  @click="selectTabFromDropdown(tab.key)"
                >
                  <span
                    class="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-base-200"
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
                    <span class="min-w-0 truncate text-sm font-black">
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
            class="hidden min-w-0 flex-1 items-stretch overflow-hidden rounded-2xl bg-base-200/70 p-1.5 lg:flex"
            aria-label="Dashboard tabs"
          >
            <div
              class="grid min-h-0 w-full min-w-0 gap-1.5"
              :class="desktopTabGridClass"
            >
              <button
                v-for="tab in resolvedTabs"
                :key="tab.key"
                class="group relative isolate flex h-full min-h-0 w-full min-w-0 items-stretch overflow-hidden rounded-xl border px-2 py-2 text-center font-black normal-case leading-tight transition-all hover:-translate-y-0.5 hover:shadow-md"
                type="button"
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
                  class="absolute inset-0 -z-10 h-full w-full object-cover opacity-35 transition-all duration-300 group-hover:scale-105 group-hover:opacity-50"
                  :class="activeTabKey === tab.key ? 'opacity-45' : ''"
                />

                <span
                  class="absolute inset-0 -z-10 bg-linear-to-b from-base-100/20 via-base-100/65 to-base-100/95"
                  :class="
                    activeTabKey === tab.key
                      ? 'from-primary/20 via-primary/70 to-primary'
                      : ''
                  "
                />

                <span
                  class="flex min-h-0 w-full min-w-0 flex-col items-center justify-center gap-1"
                >
                  <span
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border backdrop-blur-sm xl:h-9 xl:w-9 2xl:h-10 2xl:w-10"
                    :class="
                      activeTabKey === tab.key
                        ? 'border-primary-content/40 bg-primary-content/20 text-primary-content'
                        : 'border-base-300 bg-base-100/80 text-base-content'
                    "
                  >
                    <Icon
                      :name="tab.icon || fallbackIcon"
                      class="h-4 w-4 shrink-0 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6"
                    />
                  </span>

                  <span
                    class="max-w-full truncate text-xs drop-shadow-sm xl:text-sm 2xl:text-base"
                  >
                    {{ tab.label }}
                  </span>
                </span>
              </button>
            </div>
          </nav>

          <div v-else class="hidden min-w-0 flex-1 lg:block" />

          <section
            class="header-control-rail flex w-21 shrink-0 self-stretch sm:w-44 lg:w-44 xl:w-48 2xl:w-52"
          >
            <div
              class="header-control-grid grid min-h-0 w-full grid-cols-2 grid-rows-2 gap-1 overflow-visible rounded-2xl p-1 sm:gap-2 sm:p-2"
            >
              <channel-select class="min-w-0" />
              <server-selector class="min-w-0" />
              <login-switcher class="min-w-0" />
              <mana-widget class="min-w-0" />
            </div>
          </section>
        </div>
      </header>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

// ---------------------------------------------------------------------------
// Header density (full vs compact)
//
// - Default full at xl, compact below xl.
// - The image button and the chevron toggle flip between the two, in both
//   directions, at every breakpoint.
// - This state is the header's OWN concern. It does NOT touch the workspace
//   hand or its toggle.
// - A user choice (collapse/expand) sticks; we only auto-seed from the
//   breakpoint until the user has expressed a preference.
// ---------------------------------------------------------------------------
const HEADER_COMPACT_KEY = 'kindrobots:header-compact'

const compact = ref(true)
const userTouched = ref(false)

let xlMedia: MediaQueryList | null = null

function applyBreakpointDefault(): void {
  if (userTouched.value) return
  // Full at xl, compact below.
  compact.value = !(xlMedia?.matches ?? false)
}

function persistCompact(value: boolean): void {
  if (!import.meta.client) return
  window.localStorage.setItem(HEADER_COMPACT_KEY, value ? 'true' : 'false')
}

function setCompact(value: boolean): void {
  compact.value = value
  userTouched.value = true
  persistCompact(value)
}

function collapseHeader(): void {
  setCompact(true)
}

function expandHeader(): void {
  setCompact(false)
}

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

onMounted(() => {
  if (!import.meta.client) return

  // Restore an explicit user preference first; otherwise seed from breakpoint.
  const stored = window.localStorage.getItem(HEADER_COMPACT_KEY)

  if (stored === 'true' || stored === 'false') {
    compact.value = stored === 'true'
    userTouched.value = true
  }

  xlMedia = window.matchMedia('(min-width: 1280px)')
  applyBreakpointDefault()
  xlMedia.addEventListener('change', applyBreakpointDefault)
})

onBeforeUnmount(() => {
  xlMedia?.removeEventListener('change', applyBreakpointDefault)
})
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

/* Compact control row: keep the rail widgets square and tight. */
.header-control-compact :deep(.btn) {
  min-height: 2.25rem;
  height: 2.25rem;
  min-width: 2.25rem;
  width: 2.25rem;
  padding-left: 0;
  padding-right: 0;
  gap: 0;
}

.header-control-compact :deep(.btn .control-label),
.header-control-compact :deep(.btn > .badge) {
  display: none;
}

.header-control-compact :deep(.mana-icon),
.header-control-compact :deep(.iconify),
.header-control-compact :deep(svg) {
  display: inline-flex;
  flex-shrink: 0;
}

.header-control-grid :deep(.btn) {
  min-height: 2.25rem;
  height: 2.25rem;
  width: 100%;
  min-width: 0;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.header-control-grid :deep(.btn-circle),
.header-control-grid :deep(.btn-square) {
  width: 100%;
  min-width: 0;
  aspect-ratio: 1 / 1;
  padding-left: 0;
  padding-right: 0;
}

.header-control-grid :deep(.btn > span) {
  max-width: 100%;
}

.header-control-grid :deep(.mana-icon),
.header-control-grid :deep(.iconify),
.header-control-grid :deep(svg) {
  display: inline-flex;
  flex-shrink: 0;
}

@media (max-width: 639px) {
  .header-control-grid :deep(.btn) {
    width: 2.25rem;
    min-width: 2.25rem;
    padding-left: 0;
    padding-right: 0;
    gap: 0;
  }

  .header-control-grid :deep(.btn .control-label),
  .header-control-grid :deep(.btn > .badge) {
    display: none;
  }

  .header-control-grid :deep(.mana-icon),
  .header-control-grid :deep(.iconify),
  .header-control-grid :deep(svg) {
    display: inline-flex;
  }
}
</style>
