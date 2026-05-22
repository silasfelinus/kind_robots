<!-- /components/content/composition/composition-manager.vue -->
<template>
  <dashboard-shell
    dashboard-key="composition"
    title="Composition Manager"
    :summary="managerSummary"
    :loading="isLoading"
    :error="managerError"
    loading-message="Loading compositions..."
    nav-grid-class="xl:grid-cols-4"
    @refresh="refreshAll"
  >
    <template #default="{ activeTab: currentTab }">
      <section v-if="currentTab === 'overview'" class="flex flex-col gap-4">
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

      <composition-gallery
        v-else-if="currentTab === 'gallery'"
        variant="dashboard"
        title="All Compositions"
        subtitle="Select, add, edit, or delete compositions."
      />

      <add-composition
        v-else-if="currentTab === 'add'"
        mode="add"
        @saved="handleSaved"
      />

      <composition-interact v-else-if="currentTab === 'synthesize'" />

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCompositionStore } from '@/stores/compositionStore'
import type { Composition } from '@/stores/compositionStore'

const compositionStore = useCompositionStore()

const isLoading = ref(false)
const managerError = ref<string | null>(null)

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
