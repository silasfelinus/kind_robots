<template>
  <section
    class="flex min-w-0 flex-col gap-2 rounded-2xl border border-base-300 bg-base-200 p-2"
  >
    <header class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <p class="truncate text-sm font-bold">{{ lane.label }}</p>
        <p class="kr-text-dim-xs truncate">{{ subtitle }}</p>
      </div>
      <span v-if="activeCount" class="badge badge-info badge-sm"
        >{{ activeCount }} in flight</span
      >
    </header>
    <comic-attempt-tile v-if="hero" :attempt="hero" />
    <div
      v-else
      class="grid aspect-[4/3] place-items-center rounded-2xl border border-dashed border-base-300 text-center"
    >
      <p class="kr-text-dim-xs px-4">No render on this lane yet.</p>
    </div>
    <div v-if="hero" class="flex flex-wrap items-center gap-1">
      <button
        type="button"
        class="kr-btn btn-xs"
        :class="hero.verdict === 'liked' ? 'btn-success' : 'btn-ghost'"
        title="Like"
        @click="studio.setVerdict(hero.id, 'liked')"
      >
        <icon name="kind-icon:heart" class="kr-icon-4" />
      </button>
      <button
        type="button"
        class="kr-btn btn-xs"
        :class="hero.verdict === 'rejected' ? 'btn-error' : 'btn-ghost'"
        title="Reject"
        @click="studio.setVerdict(hero.id, 'rejected')"
      >
        <icon name="kind-icon:x-circle" class="kr-icon-4" />
      </button>
      <button
        type="button"
        class="kr-btn btn-xs"
        :class="hero.verdict === 'selected' ? 'btn-primary' : 'btn-ghost'"
        title="Make this the final pick for the slot"
        @click="studio.setVerdict(hero.id, 'selected')"
      >
        <icon name="kind-icon:crown" class="kr-icon-4" />
      </button>
      <button
        v-if="hero.status === 'FAILED' && hero.artJobId"
        type="button"
        class="kr-btn btn-ghost btn-xs"
        title="Retry the same ArtJob"
        @click="studio.retryAttempt(hero.id)"
      >
        <icon name="kind-icon:refresh" class="kr-icon-4" />
      </button>
    </div>
    <button
      type="button"
      class="kr-btn btn-primary btn-sm mt-auto"
      :disabled="busy || activeCount >= maxActive"
      @click="emit('render', lane.key)"
    >
      <span v-if="busy" class="kr-spinner-xs" />
      <icon v-else name="kind-icon:sparkles" class="kr-icon-4" />
      {{ dirty ? 'Save & new' : 'New' }} {{ lane.label }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'
import type { ComicSlotDto } from '~/types/comicStudio'
import { COMIC_MAX_ACTIVE_PER_LANE, type ComicLane } from '~/utils/comicLanes'
import { isComicActiveStatus } from '~/utils/comicStudio'

const props = defineProps<{
  subject: ComicSlotDto
  lane: ComicLane
  dirty?: boolean
}>()
const emit = defineEmits<{ render: [laneKey: string] }>()
const studio = useComicStudioStore()

const maxActive = COMIC_MAX_ACTIVE_PER_LANE
const hero = computed(() => studio.laneHero(props.subject.id, props.lane.key))
const activeCount = computed(
  () =>
    studio
      .attemptsFor(props.subject.id)
      .filter(
        (attempt) =>
          attempt.laneKey === props.lane.key &&
          isComicActiveStatus(attempt.status),
      ).length,
)
const busy = computed(() => studio.renderingSlotIds.includes(props.subject.id))
const subtitle = computed(() => {
  const checkpoint = props.lane.checkpoint
    ?.split('/')
    .pop()
    ?.replace(/\.safetensors$/, '')
  return `${props.lane.promptStyle === 'tags' ? 'tag prompt' : 'prose prompt'}${checkpoint ? ` · ${checkpoint}` : ''}`
})
</script>
