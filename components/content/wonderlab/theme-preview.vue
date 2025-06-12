<!-- /components/content/themes/theme-preview.vue -->
<template>
  <div
    class="border rounded-xl p-6 space-y-4 transition-all duration-300"
    :style="inlineStyle"
  >
    <h3 class="text-lg font-bold">Live Preview</h3>

    <div class="flex gap-2 flex-wrap">
      <button class="btn btn-base-100 btn-sm">Base-100</button>
      <button class="btn btn-primary btn-sm">Primary</button>
      <button class="btn btn-secondary btn-sm">Secondary</button>
      <button class="btn btn-accent btn-sm">Accent</button>
      <button class="btn btn-info btn-sm">Info</button>
      <button class="btn btn-success btn-sm">Success</button>
      <button class="btn btn-warning btn-sm">Warning</button>
      <button class="btn btn-error btn-sm">Error</button>
    </div>

    <div class="bg-base-100 p-4 rounded-box border border-base-300 space-y-3 text-base-content">
      <p class="text-sm">
        This card uses <code class="text-xs">--radius-box</code>,
        <code class="text-xs">--border</code>, and
        <code class="text-xs">--shadow</code>.
      </p>
      <input
        class="input input-bordered w-full"
        placeholder="Example input"
        readonly
      />
      <progress
        class="progress w-full progress-primary"
        value="40"
        max="100"
      />
      <div class="flex justify-between text-xs text-base-content/70">
        <span>Font: <code>{{ textBase }}</code></span>
        <span>Padding: <code>{{ paddingCard }}</code></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, computed } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import { isValidColor } from '~/stores/helpers/themeHelper'

const themeStore = useThemeStore()
const themeValues = computed(() => themeStore.themeForm?.values || {})

const textBase = computed(() => themeValues.value['--text-base'] || 'default')
const paddingCard = computed(() => themeValues.value['--padding-card'] || 'default')

// ⚠️ KEY FIX: avoid inline computed in style binding
const inlineStyle = ref('padding: 1rem')

watchEffect(() => {
  const entries = themeValues.value
  const styleVars = Object.entries(entries)
    .filter(([, val]) => isValidColor(val))
    .map(([key, val]) => `${key}: ${val}`)
    .join('; ')

  inlineStyle.value =
    `padding: 1rem; ${styleVars}; ` +
    `border-radius: var(--radius-box, 0.5rem); ` +
    `border-width: var(--border, 1px); ` +
    `box-shadow: var(--shadow, 0 1px 2px rgba(0, 0, 0, 0.1));`
})
</script>
