<!-- /components/ui/kr-stat-tile.vue -->
<template>
  <article
    class="stat rounded-2xl border border-base-300 bg-base-100 shadow-sm"
  >
    <div class="stat-title">{{ title }}</div>
    <div class="stat-value" :class="toneClass">{{ value }}</div>
    <div v-if="desc" class="stat-desc">{{ desc }}</div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    value: string | number
    desc?: string
    tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  }>(),
  {
    desc: '',
    tone: undefined,
  },
)

const toneClass = computed(() => (props.tone ? `text-${props.tone}` : ''))
</script>
