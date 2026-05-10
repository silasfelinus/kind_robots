<!-- /components/content/navigation/dashboard-shell.vue -->
<template>
  <div
    class="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-base-200 p-3 sm:p-4"
  >
    <header
      class="relative mb-4 flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md sm:p-4"
      :class="navZClass"
    >
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="min-w-0">
          <p
            v-if="title"
            class="mb-1 text-xs font-bold uppercase tracking-[0.24em] text-base-content/50"
          >
            {{ title }}
          </p>

          <h1
            class="inline-flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-2xl font-bold text-primary-content md:text-3xl"
          >
            <Icon
              :name="activeTabConfig.icon || fallbackIcon"
              class="h-6 w-6"
            />
            {{ activeTitle }}
          </h1>

          <p
            v-if="activeSummary"
            class="mt-2 max-w-4xl text-sm text-base-content/70 sm:text-base"
          >
            {{ activeSummary }}
          </p>

          <p
            v-else-if="summary"
            class="mt-2 max-w-4xl text-sm text-base-content/70 sm:text-base"
          >
            {{ summary }}
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <slot
            name="actions"
            :active-tab="normalizedActiveTab"
            :active-tab-config="activeTabConfig"
          />

          <button
            v-if="showRefresh"
            class="btn btn-sm btn-secondary rounded-xl"
            type="button"
            :disabled="loading"
            @click="emit('refresh')"
          >
            <Icon name="kind-icon:refresh" class="h-4 w-4" />
            {{ refreshLabel }}
          </button>
        </div>
      </div>

      <nav
        v-if="tabs.length"
        class="relative grid grid-cols-2 gap-2 md:grid-cols-3"
        :class="[navGridClass, navZClass]"
      >
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="btn btn-sm rounded-xl"
          type="button"
          :class="normalizedActiveTab === tab.key ? 'btn-primary' : 'btn-ghost'"
          @click="emit('set-tab', tab.key)"
        >
          <Icon :name="tab.icon || fallbackIcon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
      </nav>
    </header>

    <div
      v-if="loading"
      class="relative z-40 mb-4 shrink-0 rounded-2xl border border-info/40 bg-info/10 p-4 text-info"
    >
      {{ loadingMessage }}
    </div>

    <div
      v-if="error"
      class="relative z-40 mb-4 shrink-0 rounded-2xl border border-error/40 bg-error/10 p-4 text-error"
    >
      {{ error }}
    </div>

    <main
      class="relative z-0 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md sm:p-4"
    >
      <slot
        :active-tab="normalizedActiveTab"
        :active-tab-config="activeTabConfig"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardTabConfig } from '@/stores/helpers/dashboardHelper'

const fallbackIcon = 'kind-icon:sparkles'

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
    navGridClass?: string
    navZClass?: string
  }>(),
  {
    title: 'Dashboard',
    summary: '',
    tabs: () => [],
    activeTab: '',
    loading: false,
    loadingMessage: 'Loading...',
    error: null,
    showRefresh: true,
    refreshLabel: 'Refresh DB',
    navGridClass: 'xl:grid-cols-6',
    navZClass: 'z-40',
  },
)

const emit = defineEmits<{
  'set-tab': [tab: string]
  refresh: []
}>()

const fallbackTab = computed<DashboardTabConfig>(() => {
  const key = props.activeTab || props.tabs[0]?.key || 'overview'
  const label = props.activeTab || props.tabs[0]?.label || 'Overview'

  return {
    key,
    label,
    icon: fallbackIcon,
    title: label,
    summary: '',
  }
})

const activeTabConfig = computed<DashboardTabConfig>(() => {
  return (
    props.tabs.find((tab) => tab.key === props.activeTab) ??
    props.tabs[0] ??
    fallbackTab.value
  )
})

const normalizedActiveTab = computed(() => activeTabConfig.value.key)

const activeTitle = computed(() => {
  return activeTabConfig.value.title || activeTabConfig.value.label
})

const activeSummary = computed(() => {
  return activeTabConfig.value.summary || props.summary || ''
})
</script>
