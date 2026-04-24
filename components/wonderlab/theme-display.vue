<!-- /components/wonderlab/theme-display.vue -->
<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="group in colorGroups"
      :key="group.label"
      class="flex flex-col gap-1.5"
    >
      <p
        class="font-mono text-[9px] uppercase tracking-widest text-base-content/30"
      >
        {{ group.label }}
      </p>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="swatch in group.swatches"
          :key="swatch.key"
          class="flex flex-col items-center gap-1"
        >
          <span
            class="block rounded-full border border-base-300 shadow-sm"
            :class="[swatch.bgClass, size === 'sm' ? 'h-6 w-6' : 'h-8 w-8']"
          />
          <span
            class="font-mono text-[9px] text-base-content/50 max-w-[4rem] text-center leading-tight"
          >
            {{ swatch.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ size?: 'sm' | 'md' }>()

const colorGroups = [
  {
    label: 'Brand',
    swatches: [
      { key: 'primary', label: 'primary', bgClass: 'bg-primary' },
      {
        key: 'primary-content',
        label: 'primary-content',
        bgClass: 'bg-primary-content',
      },
      { key: 'secondary', label: 'secondary', bgClass: 'bg-secondary' },
      {
        key: 'secondary-content',
        label: 'sec-content',
        bgClass: 'bg-secondary-content',
      },
      { key: 'accent', label: 'accent', bgClass: 'bg-accent' },
      {
        key: 'accent-content',
        label: 'acc-content',
        bgClass: 'bg-accent-content',
      },
    ],
  },
  {
    label: 'Neutral & Base',
    swatches: [
      { key: 'neutral', label: 'neutral', bgClass: 'bg-neutral' },
      {
        key: 'neutral-content',
        label: 'neut-content',
        bgClass: 'bg-neutral-content',
      },
      { key: 'base-100', label: 'base-100', bgClass: 'bg-base-100' },
      { key: 'base-200', label: 'base-200', bgClass: 'bg-base-200' },
      { key: 'base-300', label: 'base-300', bgClass: 'bg-base-300' },
      {
        key: 'base-content',
        label: 'base-content',
        bgClass: 'bg-base-content',
      },
    ],
  },
  {
    label: 'Semantic',
    swatches: [
      { key: 'info', label: 'info', bgClass: 'bg-info' },
      {
        key: 'info-content',
        label: 'info-content',
        bgClass: 'bg-info-content',
      },
      { key: 'success', label: 'success', bgClass: 'bg-success' },
      {
        key: 'success-content',
        label: 'succ-content',
        bgClass: 'bg-success-content',
      },
      { key: 'warning', label: 'warning', bgClass: 'bg-warning' },
      {
        key: 'warning-content',
        label: 'warn-content',
        bgClass: 'bg-warning-content',
      },
      { key: 'error', label: 'error', bgClass: 'bg-error' },
      {
        key: 'error-content',
        label: 'err-content',
        bgClass: 'bg-error-content',
      },
    ],
  },
]
</script>
