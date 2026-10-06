<!-- /components/music-video/music-video-image-picker.vue -->
<template>
  <div class="kr-panel space-y-2 p-2">
    <div class="flex flex-wrap items-center gap-1">
      <label
        class="kr-btn kr-btn-xs"
        :class="{ 'pointer-events-none opacity-50': disabled }"
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          class="hidden"
          :disabled="disabled"
          @change="onUpload"
        />
        Upload
      </label>
      <input
        v-model.number="artImageId"
        class="kr-input w-20 text-xs"
        type="number"
        min="1"
        placeholder="Art #"
        aria-label="Use an ArtImage id"
      />
      <button
        type="button"
        class="kr-btn kr-btn-xs"
        :disabled="disabled || !artImageId"
        @click="emit('pick', Number(artImageId))"
      >
        Use
      </button>
      <span class="flex-1" />
      <button type="button" class="kr-btn kr-btn-xs" @click="emit('close')">
        Close
      </button>
    </div>

    <p class="kr-text-dim-sm">Recent art jobs</p>
    <div v-if="store.loadingRecentArt" class="kr-spinner-xs" />
    <p v-else-if="!store.recentArt.length" class="kr-text-dim-sm">
      No finished images yet.
    </p>
    <ul v-else class="grid max-h-56 grid-cols-4 gap-1 overflow-y-auto">
      <li v-for="art in store.recentArt" :key="art.artImageId">
        <button
          type="button"
          class="block w-full overflow-hidden rounded border border-base-300 hover:border-primary"
          :disabled="disabled"
          :title="art.prompt || `Art #${art.artImageId}`"
          @click="emit('pick', art.artImageId)"
        >
          <img
            v-if="store.previewUrls[art.artImageId]"
            :src="store.previewUrls[art.artImageId]"
            :alt="art.prompt || `Art #${art.artImageId}`"
            class="aspect-square w-full object-cover"
            loading="lazy"
          />
          <span
            v-else
            class="kr-text-dim-sm grid aspect-square place-items-center"
          >
            #{{ art.artImageId }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// music-video/t-032. Silas, 2026-10-06: "replace image should give us a choice
// from uploading or selecting from recent artjobs."
import { onMounted, ref } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'

defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{
  pick: [artImageId: number]
  upload: [file: File]
  close: []
}>()

const store = useMusicVideoStore()
const artImageId = ref<number | ''>('')

function onUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('upload', file)
  input.value = ''
}

onMounted(() => {
  if (!store.recentArt.length) void store.loadRecentArt()
})
</script>
