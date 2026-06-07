<!-- /components/content/composition/composition-manager.vue -->
<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden">
    <div
      v-if="isLoading || managerError"
      class="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-sm shadow"
    >
      <p
        class="min-w-0 flex-1 text-base-content/70"
        :class="managerError ? 'text-error' : ''"
      >
        {{ managerError || managerSummary }}
      </p>

      <button
        type="button"
        class="btn btn-sm rounded-2xl"
        :class="managerError ? 'btn-error' : 'btn-ghost'"
        :disabled="isLoading"
        @click="refreshAll"
      >
        <Icon
          name="kind-icon:refresh"
          class="h-4 w-4"
          :class="isLoading ? 'animate-spin' : ''"
        />
        Refresh
      </button>
    </div>

    <section
      v-if="activeTab === 'overview'"
      class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
    >
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <composition-gallery
            variant="row"
            title="Compositions"
            :show-controls="false"
            :show-toolbar="true"
            :compact="true"
          />
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <composition-interact />
        </div>
      </div>
    </section>

    <section
      v-else-if="activeTab === 'gallery'"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <composition-gallery
        variant="dashboard"
        title="All Compositions"
        subtitle="Select, add, edit, or delete compositions."
      />
    </section>

    <section
      v-else-if="activeTab === 'add'"
      class="flex min-h-0 flex-1 flex-col overflow-y-auto"
    >
      <add-composition mode="add" @saved="handleSaved" />
    </section>

    <section
      v-else-if="activeTab === 'synthesize'"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <composition-interact />
    </section>

    <div
      v-else
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Unknown tab: {{ activeTab }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCompositionStore } from '@/stores/compositionStore'
import type { Composition } from '@/stores/compositionStore'
import { useNavStore } from '@/stores/navStore'

type CompositionTab = 'overview' | 'gallery' | 'add' | 'synthesize'

const compositionStore = useCompositionStore()
const navStore = useNavStore()

const defaultDashboardKey = 'composition'
const defaultTab: CompositionTab = 'overview'
const validTabs: CompositionTab[] = ['overview', 'gallery', 'add', 'synthesize']

const isLoading = ref(false)
const managerError = ref<string | null>(null)

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const activeTab = computed<CompositionTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey.value)

  if (validTabs.includes(selectedTab as CompositionTab)) {
    return selectedTab as CompositionTab
  }

  return defaultTab
})

const managerSummary = computed(() => {
  const count = compositionStore.items.length
  const synthesized = (compositionStore.items as Composition[]).filter(
    (composition: Composition) => {
      return composition.narrativeText || composition.artPrompt
    },
  ).length
  const selected = compositionStore.selected?.title || 'none'

  return `${count} compositions (${synthesized} synthesized). Current: ${selected}.`
})

async function loadAll(force = false) {
  isLoading.value = true
  managerError.value = null

  try {
    await compositionStore.initialize({ force, fetchRemote: true })
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load compositions.'
  } finally {
    isLoading.value = false
  }
}

async function refreshAll() {
  await loadAll(true)
}

async function handleSaved() {
  await loadAll(true)
}

onMounted(async () => {
  await loadAll()
})
</script>
