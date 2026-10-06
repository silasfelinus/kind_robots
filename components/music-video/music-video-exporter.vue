<template>
  <section class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <h2 class="kr-text-black-xl text-base-content">Export MP4</h2>
      <span v-if="!supported" class="kr-text-dim-sm">
        This browser has no WebCodecs; use a current Chrome or Edge.
      </span>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="kr-btn kr-btn-primary"
        :disabled="!canExport || busy"
        @click="onExport"
      >
        {{ busy ? 'Exporting…' : 'Export MP4' }}
      </button>
      <button v-if="busy" type="button" class="kr-btn" @click="onCancel">
        Cancel
      </button>
      <span class="kr-text-dim-sm">{{ status }}</span>
    </div>
    <progress
      v-if="busy"
      class="progress w-full"
      :value="Math.round(fraction * 100)"
      max="100"
    />
    <a
      v-if="downloadUrl"
      :href="downloadUrl"
      :download="downloadName"
      class="kr-btn"
    >
      Download {{ downloadName }}
    </a>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { MusicVideoDoc } from '@/utils/musicVideoDoc'
import { finalVideoFileName } from '@/utils/musicVideoFinal'
import { useUserStore } from '@/stores/userStore'
import {
  exportMusicVideoMp4,
  webCodecsSupported,
} from '@/stores/helpers/musicVideoExporter'

defineOptions({ name: 'MusicVideoExporter' })

const props = defineProps<{
  videoId: number
  title: string
  doc: MusicVideoDoc
  /** artImageId -> loaded path, from the music video store. */
  previewUrls: Record<number, string>
}>()

const userStore = useUserStore()
const busy = ref(false)
const fraction = ref(0)
const status = ref('')
const downloadUrl = ref('')
let controller: AbortController | null = null

const supported = import.meta.client ? webCodecsSupported() : true
const withArt = computed(
  () => props.doc.scenes.filter((s) => s.image.artImageId).length,
)
const canExport = computed(() => supported && props.doc.scenes.length > 0)
const downloadName = computed(() =>
  finalVideoFileName(props.videoId, props.title),
)

function revoke() {
  if (downloadUrl.value) URL.revokeObjectURL(downloadUrl.value)
  downloadUrl.value = ''
}

/*
 * The song's bytes come through the file route, never ArtImage.imagePath. A
 * generated song stays in the database (audio jobs are not offloaded), so its
 * imagePath is empty -- and reading that made songUrl null, which the exporter
 * took as "no song" and wrote a silent MP4 (Silas, 2026-10-06: "the demo is
 * playing the images but something isn't connecting the audio"). The route
 * serves private bytes to the Bearer header onExport() already sends, and
 * redirects to the stored path when there is one.
 */
function songUrl(): string | null {
  const id = props.doc.song?.artImageId
  return id ? `/api/art/images/${id}/file` : null
}

async function onExport() {
  revoke()
  busy.value = true
  fraction.value = 0
  controller = new AbortController()
  try {
    const token = userStore.token || userStore.user?.token || ''
    const headers = new Headers()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const sceneArt = new Map(
      props.doc.scenes.map((s) => [
        s.id,
        s.image.artImageId
          ? (props.previewUrls[s.image.artImageId] ?? null)
          : null,
      ]),
    )
    const song = songUrl()
    if (props.doc.song && !song) {
      throw new Error(
        'The song is not finished yet, so the export would be silent. Try again once it is ready.',
      )
    }
    const blob = await exportMusicVideoMp4({
      doc: props.doc,
      songUrl: song,
      imageUrlFor: (sceneId) => sceneArt.get(sceneId) ?? null,
      clipUrlFor: (sceneId) => {
        const scene = props.doc.scenes.find((s) => s.id === sceneId)
        const clipId = scene?.motion.clipArtImageId
        return clipId ? `/api/art/images/${clipId}/file` : null
      },
      headers,
      signal: controller.signal,
      onProgress: (f, label) => {
        fraction.value = f
        status.value = label
      },
    })
    downloadUrl.value = URL.createObjectURL(blob)
    status.value = `Done: ${(blob.size / 1_048_576).toFixed(1)} MB, ${withArt.value}/${props.doc.scenes.length} scenes with art`
  } catch (e) {
    status.value =
      e instanceof DOMException && e.name === 'AbortError'
        ? 'Export cancelled.'
        : e instanceof Error
          ? e.message
          : 'Export failed.'
  } finally {
    busy.value = false
    controller = null
  }
}

function onCancel() {
  controller?.abort()
}

onBeforeUnmount(() => {
  controller?.abort()
  revoke()
})
</script>
