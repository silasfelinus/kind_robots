<!-- /components/builder/builder-text-input.vue -->
<template>
  <label v-if="step" class="form-control">
    <div class="label pb-1">
      <span class="label-text font-bold">{{ step.inputLabel || step.title }}</span>
      <span class="label-text-alt text-base-content/40">{{ value.length }} chars</span>
    </div>

    <textarea
      v-if="step.inputType === 'long'"
      :value="value"
      class="textarea textarea-bordered min-h-40 rounded-2xl bg-base-100 leading-relaxed focus:border-primary"
      :placeholder="step.placeholder || 'Type here...'
      "
      @input="updateValue"
    />

    <input
      v-else
      :value="value"
      type="text"
      class="input input-bordered rounded-2xl bg-base-100 focus:border-primary"
      :placeholder="step.placeholder || 'Type here...'
      "
      @input="updateValue"
    />
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()
const step = computed(() => store.activeStep)
const value = computed(() => (step.value ? store.stagedValues[step.value.key] ?? '' : ''))

function updateValue(event: Event): void {
  if (!step.value) return
  store.setStagedValue(step.value.key, (event.target as HTMLInputElement | HTMLTextAreaElement).value)
}
</script>
