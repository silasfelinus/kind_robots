<template>
  <label class="flex cursor-pointer items-center justify-between gap-4 py-3">
    <span>
      <span class="block font-semibold">Show maturity toggle in header</span>
      <span class="block text-xs text-base-content/60">
        Add a quick 18+ visibility control to the workspace header. This
        preference stays in this browser.
      </span>
    </span>

    <input
      type="checkbox"
      class="toggle toggle-warning shrink-0"
      :checked="showDashboardMaturityToggle"
      @change="onChange"
    />
  </label>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMaturityPreferenceStore } from '@/stores/maturityPreferenceStore'

const maturityPreferenceStore = useMaturityPreferenceStore()

const showDashboardMaturityToggle = computed(
  () => maturityPreferenceStore.showDashboardMaturityToggle,
)

function onChange(event: Event): void {
  maturityPreferenceStore.setShowDashboardMaturityToggle(
    (event.target as HTMLInputElement).checked,
  )
}

onMounted(() => {
  maturityPreferenceStore.initialize()
})
</script>
