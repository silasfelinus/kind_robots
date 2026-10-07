<!-- /components/music-video/music-video-viewer.vue -->
<template>
  <section
    v-if="video"
    class="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
  >
    <div class="min-w-0 space-y-3">
      <video
        v-if="hasFinal"
        :key="video.id"
        :src="store.videoUrl(video.id)"
        :poster="posterFailed ? undefined : store.posterUrl(video.id)"
        class="aspect-video w-full rounded-2xl bg-black"
        controls
        playsinline
        preload="metadata"
        :aria-label="video.title"
      />
      <div
        v-else
        class="relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/40 via-secondary/30 to-accent/40"
      >
        <img
          v-if="!posterFailed"
          :src="store.posterUrl(video.id)"
          :alt="video.title"
          class="absolute inset-0 h-full w-full object-cover"
          @error="posterFailed = true"
        />
        <p
          class="absolute inset-x-3 bottom-3 rounded-xl bg-base-100/85 p-3 text-sm"
        >
          No final cut yet.
          <template v-if="store.isOwner">
            Rendering is admin-only for now, so this draft keeps your pitch and
            settings until it can be produced.
          </template>
        </p>
      </div>
      <div class="kr-panel space-y-2 p-3">
        <p class="kr-text-dim-xs">
          {{ store.isOwner ? 'Yours' : `by ${ownerName}` }} ·
          {{ settings?.durationSec }}s · {{ settings?.aspect }}
          <template v-if="settings?.genre"> · {{ settings.genre }}</template>
          <template v-if="settings?.mood"> · {{ settings.mood }}</template>
        </p>
        <p v-if="video.doc.pitch" class="whitespace-pre-line text-sm">
          {{ video.doc.pitch }}
        </p>
        <MusicVideoActions :video="actionTarget" />
      </div>
    </div>

    <div class="min-w-0 space-y-3">
      <MusicVideoBriefPanel v-if="store.isOwner" />
      <div v-if="sections.length" class="kr-panel space-y-3 p-3">
        <h2 class="kr-text-bold-sm">Lyrics</h2>
        <div v-for="section in sections" :key="section.id" class="space-y-0.5">
          <p class="kr-text-eyebrow">{{ section.kind }}</p>
          <p
            v-for="(line, index) in section.lines"
            :key="index"
            class="text-sm"
          >
            {{ line }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'

const store = useMusicVideoStore()
const posterFailed = ref(false)

const video = computed(() => store.current)
const settings = computed(() => store.current?.doc.settings)
const sections = computed(() =>
  (store.current?.doc.lyrics.sections ?? []).filter(
    (section) => section.lines.length,
  ),
)
const hasFinal = computed(() =>
  store.currentSummary
    ? store.currentSummary.hasFinal
    : Boolean(store.current?.finalArtImageId),
)
const ownerName = computed(
  () => store.currentSummary?.ownerName || 'a Kind Robot',
)
const actionTarget = computed(() => ({
  id: store.current?.id ?? 0,
  title: store.current?.title ?? '',
  isOwner: store.isOwner,
  isPublic: store.current?.isPublic ?? true,
}))

watch(
  () => store.current?.id,
  () => (posterFailed.value = false),
)
</script>
