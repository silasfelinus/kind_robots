<template>
  <button
    type="button"
    data-nav
    class="pf-art-card pf-focusable"
    :class="selected ? 'pf-art-card-on' : ''"
    :aria-label="`${title}${label ? `, ${label}` : ''}`"
    :aria-pressed="selected"
    @click="$emit('select')"
  >
    <span class="pf-art-card-frame">
      <img
        v-if="imageUrl && !broken"
        :src="imageUrl"
        alt=""
        loading="lazy"
        class="pf-art-card-img"
        @error="broken = true"
      />
      <span v-else-if="prompt" class="pf-art-card-prompt">
        <span class="pf-kicker text-[0.55rem] text-secondary">Prompt</span>
        <span class="line-clamp-6">{{ prompt }}</span>
      </span>
      <span v-else class="pf-art-card-empty">
        <span class="pf-kicker text-[0.55rem] opacity-70">No art yet</span>
        <span class="text-xs opacity-60">{{ emptyText }}</span>
      </span>
      <span v-if="badge" class="pf-art-card-badge">{{ badge }}</span>
    </span>
    <span class="pf-art-card-text">
      <span class="pf-label line-clamp-2 text-sm">{{ title }}</span>
      <span
        v-if="label"
        class="pf-kicker line-clamp-1 text-[0.55rem] opacity-60"
        >{{ label }}</span
      >
      <span
        v-if="subtitle"
        class="line-clamp-2 text-xs leading-snug opacity-75"
        >{{ subtitle }}</span
      >
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// An art-first card: the picture, else its authored prompt, else an honest
// "no art yet". Used by the design board and the catalogue.
const props = withDefaults(
  defineProps<{
    title: string
    label?: string
    subtitle?: string
    imageUrl?: string | null
    prompt?: string | null
    badge?: string
    selected?: boolean
    emptyText?: string
  }>(),
  {
    label: '',
    subtitle: '',
    imageUrl: null,
    prompt: null,
    badge: '',
    selected: false,
    emptyText: 'Write a prompt to render it.',
  },
)
defineEmits<{ select: [] }>()

const broken = ref(false)
watch(
  () => props.imageUrl,
  () => (broken.value = false),
)
</script>
