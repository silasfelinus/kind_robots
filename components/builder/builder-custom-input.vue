<!-- /components/builder/builder-custom-input.vue -->
<template>
  <div v-if="step" class="rounded-2xl border border-base-300 bg-base-100 p-4">
    <label class="form-control">
      <div class="label pb-1">
        <span class="label-text font-bold">{{ step.inputLabel || step.title }}</span>
        <span class="label-text-alt text-base-content/40">{{ step.inputType }}</span>
      </div>
      <textarea
        :value="value"
        class="textarea textarea-bordered min-h-32 rounded-2xl bg-base-100 leading-relaxed focus:border-primary"
        :placeholder="step.placeholder || 'This custom input type needs a dedicated component later.'"
        @input="updateValue"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()
const step = computed(() => store.activeStep)
const value = computed(() => step.value ? store.stagedValues[step.value.key] ?? '' : '')

function updateValue(event: Event): void {
  if (!step.value) return
  store.setStagedValue(step.value.key, (event.target as HTMLTextAreaElement).value)
}
</script>
