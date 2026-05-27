<!--
  ~/components/content/stage/stage-message-card.vue
  ---------------------------------------------------------------------------
  One transcript entry. Renders differently per `kind`:
    - stage / narrator : centered italic banner
    - director         : muted footnote (hidden steering note)
    - user             : right-aligned bubble with user avatar
    - speaker          : left-aligned bubble with participant portrait
  Empty content during stream renders a loading shimmer.
  ---------------------------------------------------------------------------
-->
<template>
  <!-- Stage opening / narrator beat -->
  <div
    v-if="entry.kind === 'stage' || entry.kind === 'narrator'"
    class="self-center text-xs italic opacity-70 max-w-prose text-center px-3 py-1 bg-base-200 rounded-full"
  >
    — {{ entry.content }} —
  </div>

  <!-- Director nudge (hidden steering — show muted) -->
  <div
    v-else-if="entry.kind === 'director'"
    class="self-center text-[10px] uppercase tracking-wider opacity-40 italic px-2"
  >
    director: {{ entry.content }}
  </div>

  <!-- User interjection -->
  <div
    v-else-if="entry.kind === 'user'"
    class="self-end max-w-[80%] flex flex-row-reverse items-start gap-2"
  >
    <div
      class="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0"
    >
      <Icon name="mdi:account" class="w-4 h-4" />
    </div>
    <div class="bg-secondary/20 rounded-2xl px-3 py-2 text-sm">
      <div class="text-xs opacity-60 mb-0.5">{{ entry.speakerLabel }}</div>
      <div class="whitespace-pre-wrap">{{ entry.content }}</div>
    </div>
  </div>

  <!-- Speaker line -->
  <div v-else class="self-start max-w-[80%] flex items-start gap-2">
    <div
      class="w-10 h-10 rounded-full bg-base-300 overflow-hidden shrink-0 flex items-center justify-center"
    >
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="entry.speakerLabel"
        class="w-full h-full object-cover"
      />
      <Icon v-else name="mdi:account-voice" class="w-5 h-5 opacity-60" />
    </div>
    <div class="bg-base-200 rounded-2xl px-3 py-2 text-sm min-w-[6ch]">
      <div class="text-xs font-semibold opacity-80 mb-0.5">
        {{ entry.speakerLabel }}
      </div>
      <div v-if="entry.content" class="whitespace-pre-wrap">
        {{ entry.content }}
      </div>
      <div v-else class="opacity-50 italic text-xs">
        <span class="loading loading-dots loading-xs"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StageTranscriptEntry } from '@/stores/helpers/stageHelper'

const props = defineProps<{
  entry: StageTranscriptEntry
  resolveImage?: (artImageId: number | null) => string | null
}>()

const imageUrl = computed<string | null>(() => {
  if (props.entry.speakerImagePath) return props.entry.speakerImagePath

  if (!props.entry.speakerArtImageId) return null

  return props.resolveImage
    ? props.resolveImage(props.entry.speakerArtImageId)
    : null
})
</script>
