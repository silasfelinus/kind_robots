<!-- /components/music-video/music-video-song-panel.vue -->
<template>
  <section class="kr-panel space-y-2 p-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="kr-text-black-xl text-base-content">Song</h2>
      <span class="kr-text-dim-sm">{{ label }}</span>
    </div>

    <audio
      v-if="songSrc"
      :src="songSrc"
      class="w-full"
      controls
      preload="metadata"
      aria-label="The music video's song"
    />

    <div class="flex flex-wrap items-center gap-2">
      <label
        class="kr-btn"
        :class="{
          'pointer-events-none opacity-50': store.saving || store.busyAction,
        }"
      >
        <input
          type="file"
          accept="audio/mpeg,audio/wav,.mp3,.wav"
          class="hidden"
          :disabled="store.saving || Boolean(store.busyAction)"
          @change="onSongFile"
        />
        Upload song (MP3 or WAV)
      </label>
      <span class="kr-text-dim-sm">
        Or generate one with ACE-Step in the pipeline above.
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
// music-video/t-027: the song, playable on the page, with the upload that used
// to sit loose in the admin page.
import { computed } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'

const store = useMusicVideoStore()

const song = computed(() => store.current?.doc.song ?? null)
const songSrc = computed(() =>
  song.value?.artImageId
    ? (store.previewUrls[song.value.artImageId] ?? '')
    : '',
)

const label = computed(() => {
  const value = song.value
  const job = store.songJob
  if (job && ['PENDING', 'RUNNING'].includes(job.status)) {
    return `Generating (job ${job.id}, ${job.status.toLowerCase()})…`
  }
  if (!value) return 'No song yet.'
  const length = value.durationSec ? ` · ${Math.round(value.durationSec)}s` : ''
  return value.source === 'upload'
    ? `Uploaded song${length}`
    : `ACE-Step song${length}`
})

async function onSongFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await store.uploadSong(file)
  input.value = ''
}
</script>
