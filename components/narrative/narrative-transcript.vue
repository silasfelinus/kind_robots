<!-- /components/narrative/narrative-transcript.vue -->
<template>
  <section class="space-y-3" aria-live="polite" :aria-busy="isStreaming">
    <div
      v-if="!beats.length && !isStreaming"
      class="rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-5 text-center text-sm text-base-content/50"
    >
      {{ emptyLabel }}
    </div>

    <article v-for="beat in beats" :key="beat.id" class="space-y-2">
      <div
        class="whitespace-pre-line rounded-2xl border border-base-300 bg-base-200/60 p-4 text-sm leading-relaxed"
      >
        {{ beat.narrative }}
      </div>
      <div
        v-if="beat.answer?.text"
        class="ml-4 rounded-2xl border border-secondary/30 bg-secondary/10 p-3 text-sm leading-relaxed sm:ml-8"
      >
        {{ beat.answer.text }}
      </div>
      <slot name="after-beat" :beat="beat" />
    </article>

    <div
      v-if="isStreaming"
      class="whitespace-pre-line rounded-2xl border border-dashed border-secondary/40 bg-base-200/40 p-4 text-sm leading-relaxed"
    >
      <template v-if="visibleStreamingText">{{ visibleStreamingText }}</template>
      <span v-else class="flex items-center gap-2 text-base-content/60">
        <span class="loading loading-dots loading-sm" />
        {{ streamingLabel }}
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    beats: {
      id: string
      narrative: string
      answer?: { text: string } | null
    }[]
    isStreaming?: boolean
    streamingText?: string
    streamingLabel?: string
    emptyLabel?: string
  }>(),
  {
    isStreaming: false,
    streamingText: '',
    streamingLabel: 'The narrator is building the next scene…',
    emptyLabel: 'The story will appear here once it begins.',
  },
)

const visibleStreamingText = computed(() => {
  const text = props.streamingText
  const marker = '[STORY_STATE]'
  const markerIndex = text.indexOf(marker)
  if (markerIndex >= 0) return text.slice(0, markerIndex).trimEnd()

  const lastLineBreak = text.lastIndexOf('\n')
  const partialLine = text.slice(lastLineBreak + 1).trim()
  if (partialLine.startsWith('[') && marker.startsWith(partialLine)) {
    return text.slice(0, Math.max(0, lastLineBreak)).trimEnd()
  }
  return text
})
</script>
