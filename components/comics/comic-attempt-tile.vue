<template>
  <button
    type="button"
    draggable="true"
    class="group relative block w-full overflow-hidden rounded-2xl border bg-base-300 text-left transition hover:border-primary"
    :class="[ringClass, compact ? 'aspect-square' : 'aspect-[4/3]']"
    :title="title"
    @click="studio.lightboxAttemptId = attempt.id"
    @dragstart="studio.beginDrag({ type: 'attempt', id: attempt.id })"
    @dragend="studio.endDrag()"
  >
    <img
      v-if="attempt.thumbUrl"
      :src="attempt.thumbUrl"
      :alt="title"
      class="h-full w-full object-cover"
      loading="lazy"
      draggable="false"
    />
    <div v-else class="grid h-full place-items-center p-2 text-center">
      <span
        v-if="display === 'queued' || display === 'rendering'"
        class="kr-spinner-xs"
      />
      <icon v-else name="kind-icon:image" class="kr-icon-4 opacity-40" />
      <span class="mt-1 text-[10px] font-semibold uppercase opacity-70">{{
        statusLabel
      }}</span>
    </div>
    <span
      v-if="attempt.verdict !== 'none'"
      class="badge badge-xs absolute left-1 top-1"
      :class="verdictBadge"
      >{{ verdictLabel }}</span
    >
    <span
      v-if="!compact"
      class="badge badge-xs absolute bottom-1 left-1 bg-base-100/80"
      >{{ laneLabel }}</span
    >
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'
import type { ComicAttemptDto } from '~/types/comicStudio'
import { comicDisplayStatus } from '~/utils/comicStudio'

const props = defineProps<{ attempt: ComicAttemptDto; compact?: boolean }>()
const studio = useComicStudioStore()

const display = computed(() => comicDisplayStatus(props.attempt))
const laneLabel = computed(
  () =>
    studio.lanes.find((lane) => lane.key === props.attempt.laneKey)?.label ??
    props.attempt.laneKey,
)
const statusLabel = computed(
  () =>
    ({
      queued: 'Queued',
      rendering: 'Rendering',
      ready: 'Ready',
      undelivered: 'Not delivered',
      failed: 'Failed',
    })[display.value],
)
const verdictLabel = computed(
  () =>
    ({ liked: 'Liked', rejected: 'Rejected', selected: 'Final', none: '' })[
      props.attempt.verdict
    ] ?? '',
)
const verdictBadge = computed(
  () =>
    ({
      liked: 'badge-success',
      rejected: 'badge-error',
      selected: 'badge-primary',
      none: '',
    })[props.attempt.verdict] ?? '',
)
const ringClass = computed(() => {
  if (props.attempt.verdict === 'selected')
    return 'border-primary ring-2 ring-primary'
  if (props.attempt.verdict === 'rejected') return 'border-error/50 opacity-60'
  if (props.attempt.verdict === 'liked') return 'border-success'
  return 'border-base-300'
})
const title = computed(
  () =>
    `${laneLabel.value} · ${statusLabel.value}${props.attempt.error ? ` · ${props.attempt.error}` : ''}`,
)
</script>
