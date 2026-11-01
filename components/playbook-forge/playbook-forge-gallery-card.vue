<template>
  <button
    type="button"
    data-nav
    class="pf-art-card pf-focusable h-full w-full"
    :class="selected ? 'pf-art-card-on' : ''"
    :aria-label="`${entry.title}, ${STATUS_LABEL[status]}`"
    :aria-pressed="selected"
    @click="$emit('select')"
  >
    <span class="pf-art-card-frame">
      <img
        v-if="entry.imageUrl && !broken"
        :src="entry.imageUrl"
        alt=""
        loading="lazy"
        class="pf-art-card-img"
        @error="broken = true"
      />
      <PlaybookArt
        v-else-if="entry.scene"
        :title="entry.title"
        :scene="entry.scene"
        :art="entry.art"
        :kind="entry.kind"
        class="absolute inset-0"
      />
      <span v-else-if="entry.prompt" class="pf-art-card-prompt">
        <span class="pf-kicker text-[0.55rem] text-secondary">Prompt</span>
        <span class="line-clamp-6">{{ entry.prompt }}</span>
      </span>
      <span v-else-if="status === 'no-picture'" class="pf-art-card-empty">
        <span class="pf-kicker text-[0.55rem] opacity-70">Text only</span>
        <span class="text-xs opacity-60">The game shows no picture here.</span>
      </span>
      <span v-else class="pf-art-card-empty">
        <span class="pf-kicker text-[0.55rem] opacity-70">No prompt yet</span>
        <span class="text-xs opacity-60">Write one, or ask the agents.</span>
      </span>
      <span class="pf-art-card-badge" :class="TONE[status]">{{
        STATUS_LABEL[status]
      }}</span>
      <span
        v-if="notes"
        class="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 text-[0.65rem] font-bold text-white"
        :aria-label="`${notes} open notes`"
        >{{ notes }} ✎</span
      >
    </span>
    <span class="pf-art-card-text">
      <span class="pf-label line-clamp-2 text-sm">{{ entry.title }}</span>
      <span
        v-if="entry.place"
        class="pf-kicker line-clamp-1 text-[0.55rem] opacity-60"
        >{{ entry.place }}</span
      >
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  STATUS_LABEL,
  entryStatus,
  type GalleryEntry,
  type GalleryStatus,
} from '~/utils/playbookForge/gallery'

// One beat in the gallery: its painting (or Ecotone's drawn scene), else its
// prompt, else an honest "no prompt yet", with where it stands and its notes.
const props = defineProps<{
  entry: GalleryEntry
  selected?: boolean
  notes?: number
}>()
defineEmits<{ select: [] }>()

const TONE: Record<GalleryStatus, string> = {
  painted: 'text-success',
  'no-picture': 'opacity-70',
  'not-wired': 'text-warning',
  rendering: 'text-info',
  failed: 'text-error',
  'no-prompt': 'text-warning',
  unpainted: '',
}
const status = computed(() => entryStatus(props.entry))
const broken = ref(false)
watch(
  () => props.entry.imageUrl,
  () => (broken.value = false),
)
</script>
