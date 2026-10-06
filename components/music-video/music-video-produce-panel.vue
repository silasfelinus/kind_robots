<!-- /components/music-video/music-video-produce-panel.vue -->
<template>
  <section class="kr-panel space-y-3 p-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="kr-text-black-xl text-base-content">Produce</h2>
      <span class="kr-text-dim-sm">
        Pitch to finished video: fills the brief, writes lyrics, makes the song,
        plans and renders the scenes, animates the scenes set to "Animated
        clip", then exports and attaches the final cut.
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        v-if="!store.producing"
        type="button"
        class="kr-btn kr-btn-primary"
        :disabled="
          !store.current?.doc.pitch.trim() || Boolean(store.busyAction)
        "
        @click="onProduce"
      >
        {{ hasFinal ? 'Produce again' : 'Produce' }}
      </button>
      <button
        v-else
        type="button"
        class="kr-btn"
        @click="store.stopProduce('Stopped. Press Produce to carry on.')"
      >
        Stop
      </button>
      <button
        type="button"
        class="kr-btn"
        :disabled="!readyToExport || Boolean(store.busyAction)"
        :title="
          readyToExport
            ? 'Render the final cut in this browser and attach it'
            : 'Every scene needs an image and the song must be ready'
        "
        @click="store.exportAndAttach()"
      >
        <span v-if="store.busyAction === 'export'" class="kr-spinner-xs" />
        {{ hasFinal ? 'Re-export final cut' : 'Export final cut' }}
      </button>
      <span v-if="store.producing" class="kr-badge-outline">
        <span class="kr-spinner-xs" />
        {{ store.produceStage || 'Working' }}
      </span>
      <span v-else-if="store.produceStage" class="kr-text-dim-sm">
        {{ store.produceStage }}
      </span>
    </div>

    <progress
      v-if="store.busyAction === 'export'"
      class="progress progress-primary w-full"
      :value="Math.round(store.exportProgress * 100)"
      max="100"
    />

    <p class="kr-text-dim-sm">
      Renders run on the Comfy box, so a full video takes a while. Keep this
      page open: it checks every 15 seconds and picks up again after a reload.
    </p>

    <video
      v-if="finalSrc"
      :src="finalSrc"
      class="aspect-video w-full rounded-xl bg-black"
      controls
      preload="metadata"
      aria-label="Final cut"
    />
  </section>
</template>

<script setup lang="ts">
// music-video/t-031: one button from pitch to an attached final cut.
import { computed } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'

const store = useMusicVideoStore()

const hasFinal = computed(() => Boolean(store.current?.finalArtImageId))
const finalSrc = computed(() => {
  const id = store.current?.finalArtImageId
  return id ? (store.previewUrls[id] ?? '') : ''
})
const readyToExport = computed(() => {
  const doc = store.current?.doc
  return Boolean(
    doc?.song?.artImageId &&
    doc.scenes.length &&
    doc.scenes.every((scene) => scene.image.artImageId),
  )
})

function onProduce() {
  const doc = store.current?.doc
  const clips = doc?.scenes.filter((s) => s.motion.kind === 'clip').length ?? 0
  const message = [
    'Produce this video now?',
    'It fills any missing steps and queues renders on the Comfy box.',
    clips
      ? `${clips} scene${clips === 1 ? ' is' : 's are'} set to animate; each clip can take a long time.`
      : 'No scenes are set to animate; every scene will pan and zoom.',
    hasFinal.value ? 'The current final cut will be replaced.' : '',
  ]
    .filter(Boolean)
    .join('\n\n')
  if (window.confirm(message)) store.startProduce()
}
</script>
