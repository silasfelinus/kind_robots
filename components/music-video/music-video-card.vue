<!-- /components/music-video/music-video-card.vue -->
<template>
  <article
    class="group overflow-hidden rounded-2xl border border-base-300 bg-base-200 shadow-sm transition hover:border-primary hover:shadow-md"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
    @focusin="hovering = true"
    @focusout="hovering = false"
  >
    <button
      type="button"
      class="relative block aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/40 via-secondary/30 to-accent/40"
      :aria-label="`Open ${video.title}`"
      @click="store.select(video.id)"
    >
      <img
        v-if="!posterFailed"
        :src="store.posterUrl(video.id)"
        :alt="video.title"
        class="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        @error="posterFailed = true"
      />
      <div
        v-else
        class="absolute inset-0 grid place-items-center text-base-content/70"
      >
        <icon name="kind-icon:video" class="kr-icon-12" />
      </div>
      <video
        v-if="video.hasFinal && hovering"
        :src="store.videoUrl(video.id)"
        class="absolute inset-0 h-full w-full bg-black object-cover"
        autoplay
        muted
        loop
        playsinline
        preload="none"
      />
      <span
        v-if="video.hasFinal"
        class="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-base-100/80 text-primary shadow transition group-hover:opacity-0"
      >
        <icon name="kind-icon:play" class="kr-icon-5" />
      </span>
      <span class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span v-if="!video.hasFinal" class="kr-badge-warning-xs">
          {{ video.status === 'DRAFT' ? 'Draft' : 'In production' }}
        </span>
        <span
          v-if="video.isOwner && !video.isPublic"
          class="kr-badge-neutral-xs"
        >
          <icon name="kind-icon:lock" class="kr-icon-3" />
          Private
        </span>
      </span>
    </button>
    <div class="space-y-2 p-3">
      <div class="min-w-0">
        <h3 class="kr-text-bold-sm truncate" :title="video.title">
          {{ video.title }}
        </h3>
        <p class="kr-text-dim-xs truncate">
          {{
            video.isOwner ? 'Yours' : `by ${video.ownerName || 'a Kind Robot'}`
          }}
          · {{ updated }}
        </p>
      </div>
      <MusicVideoActions :video="video" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useMusicVideoStore,
  type MusicVideoSummary,
} from '@/stores/musicVideoStore'

const props = defineProps<{ video: MusicVideoSummary }>()

const store = useMusicVideoStore()
const hovering = ref(false)
const posterFailed = ref(false)

const updated = computed(() =>
  new Date(props.video.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }),
)
</script>
