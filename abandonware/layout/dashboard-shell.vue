<!-- /components/content/navigation/dashboard-shell.vue -->
<template>
  <div
    class="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-base-200 p-4"
  >
    <header class="mb-4 flex shrink-0 flex-col gap-3">
      <div class="min-w-0 text-center">
        <h1
          class="inline-block rounded-2xl bg-primary px-3 py-2 text-2xl font-bold text-primary-content md:text-3xl"
        >
          {{ title }}
        </h1>

        <p v-if="summary" class="mt-2 text-sm text-base-content/70">
          {{ summary }}
        </p>
      </div>

      <nav
        v-if="tabs.length"
        class="grid grid-cols-2 gap-2 md:grid-cols-3"
        :class="navGridClass"
      >
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="btn btn-sm rounded-xl"
          type="button"
          :class="activeTab === tab.key ? 'btn-primary' : 'btn-ghost'"
          @click="emit('set-tab', tab.key)"
        >
          <Icon :name="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
      </nav>
    </header>

    <div
      v-if="loading"
      class="mb-4 shrink-0 rounded-2xl border border-info/40 bg-info/10 p-4 text-info"
    >
      {{ loadingMessage }}
    </div>

    <div
      v-if="error"
      class="mb-4 shrink-0 rounded-2xl border border-error/40 bg-error/10 p-4 text-error"
    >
      {{ error }}
    </div>

    <main
      class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
      <div
        v-if="showSectionHeader"
        class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 class="text-xl font-bold text-base-content">
            {{ activeTitle }}
          </h2>

          <p v-if="activeSummary" class="text-sm text-base-content/70">
            {{ activeSummary }}
          </p>
        </div>

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

      <slot :active-tab="activeTab" :active-tab-config="activeTabConfig" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardTabConfig } from '@/stores/helpers/dashboardHelper'

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
    showSectionHeader?: boolean
    navGridClass?: string
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
    showSectionHeader: true,
    navGridClass: 'xl:grid-cols-6',
  },
)

const emit = defineEmits<{
  'set-tab': [tab: string]
  refresh: []
}>()

const activeTabConfig = computed<DashboardTabConfig>(() => {
  return (
    props.tabs.find((tab) => tab.key === props.activeTab) ??
    props.tabs[0] ?? {
      key: props.activeTab || 'overview',
      label: props.activeTab || 'Overview',
      icon: 'kind-icon:sparkles',
      title: props.activeTab || 'Overview',
      summary: '',
    }
  )
})

const activeTitle = computed(
  () => activeTabConfig.value.title || activeTabConfig.value.label,
)

const activeSummary = computed(() => activeTabConfig.value.summary || '')
</script>
