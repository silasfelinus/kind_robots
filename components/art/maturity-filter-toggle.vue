<!-- /components/art/maturity-filter-toggle.vue -->
<template>
  <div
    class="flex items-center gap-1 rounded-lg border border-base-300 bg-base-100 p-1"
    role="group"
    :aria-label="ariaLabel"
  >
    <span class="kr-text-dim-xs-70 px-1 font-bold">Show</span>
    <button
      v-for="option in MATURITY_FILTER_OPTIONS"
      :key="option.value"
      type="button"
      class="btn btn-xs rounded-md"
      :class="
        modelValue === option.value
          ? 'btn-primary'
          : 'btn-ghost text-base-content/60'
      "
      :aria-pressed="modelValue === option.value"
      :disabled="disabled"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { GalleryMaturityFilter } from '@/stores/artCollectionBrowseStore'

withDefaults(
  defineProps<{
    modelValue: GalleryMaturityFilter
    ariaLabel?: string
    disabled?: boolean
  }>(),
  {
    ariaLabel: 'Maturity filter',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: GalleryMaturityFilter]
}>()

const MATURITY_FILTER_OPTIONS: readonly {
  value: GalleryMaturityFilter
  label: string
}[] = [
  { value: 'all', label: 'Both' },
  { value: 'mature', label: 'Mature' },
  { value: 'safe', label: 'Not mature' },
]
</script>
