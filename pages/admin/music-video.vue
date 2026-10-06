<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-5 p-4 md:p-6">
      <!-- Controls only: the shell's workspace-header renders the title and
           subtitle from content/channels/admin/music-video.md (THE HEADER RULE). -->
      <header class="kr-toolbar justify-end">
        <span class="kr-badge-outline">Admin only</span>
        <button
          type="button"
          class="kr-btn"
          :disabled="store.loading || !userStore.isAdmin"
          @click="store.loadList()"
        >
          <span v-if="store.loading" class="kr-spinner-xs" />
          Refresh
        </button>
      </header>

      <div v-if="!ready" class="grid min-h-60 place-items-center kr-panel">
        <span class="kr-spinner-lg-primary" />
      </div>

      <div
        v-else-if="!userStore.isAdmin"
        class="kr-note kr-note-error p-8 text-center font-normal"
      >
        <p class="kr-text-black-xl text-base-content">
          Administrator access required
        </p>
        <p class="kr-text-dim-sm mt-2">
          Music videos queue substantial local GPU work, so this surface is
          admin-only.
        </p>
      </div>

      <template v-else>
        <div
          v-if="store.error"
          class="kr-note kr-note-error flex items-center gap-3 p-3"
        >
          <span class="flex-1">{{ store.error }}</span>
          <button type="button" class="kr-btn" @click="store.clearError()">
            Dismiss
          </button>
        </div>

        <section
          class="grid gap-4 xl:grid-cols-[minmax(260px,0.32fr)_minmax(0,1fr)]"
        >
          <aside class="kr-panel space-y-4 p-4 md:p-5">
            <form class="space-y-3" @submit.prevent="onCreate">
              <label class="block space-y-1">
                <span class="kr-text-dim-sm">New video title</span>
                <input
                  v-model="newTitle"
                  class="kr-input w-full"
                  type="text"
                  maxlength="255"
                  placeholder="Untitled music video"
                />
              </label>
              <label class="block space-y-1">
                <span class="kr-text-dim-sm">Pitch</span>
                <textarea
                  v-model="newPitch"
                  class="kr-input w-full"
                  rows="3"
                  maxlength="4000"
                  placeholder="A neon-lit lullaby for sleepy robots…"
                />
              </label>
              <button
                type="submit"
                class="kr-btn kr-btn-primary w-full"
                :disabled="store.saving"
              >
                Create music video
              </button>
            </form>

            <ul class="space-y-2">
              <li v-for="video in store.videos" :key="video.id">
                <button
                  type="button"
                  class="kr-btn w-full justify-between text-left"
                  :class="{ 'kr-btn-primary': store.current?.id === video.id }"
                  @click="store.select(video.id)"
                >
                  <span class="truncate">{{ video.title }}</span>
                  <span class="kr-badge-outline">{{ video.status }}</span>
                </button>
              </li>
              <li v-if="!store.videos.length" class="kr-text-dim-sm">
                No music videos yet. Pitch your first one above.
              </li>
            </ul>
          </aside>

          <section class="kr-panel space-y-4 p-4 md:p-5">
            <div
              v-if="!store.current"
              class="grid min-h-60 place-items-center text-center"
            >
              <p class="kr-text-dim-sm">
                Select or create a music video to see its stage.
              </p>
            </div>

            <template v-else>
              <figure v-if="finalPreview" class="overflow-hidden rounded-xl">
                <img
                  :src="finalPreview"
                  alt="Final cut still"
                  class="aspect-video w-full object-cover"
                  loading="lazy"
                />
              </figure>

              <div class="flex flex-wrap gap-2">
                <span class="kr-badge-outline">{{ store.current.status }}</span>
                <span class="kr-badge-outline">{{
                  store.current.doc.settings.aspect
                }}</span>
                <span class="kr-badge-outline"
                  >{{ store.current.doc.settings.durationSec }}s</span
                >
                <span class="kr-badge-outline"
                  >{{ store.lyricLineCount }} lyric lines</span
                >
                <span class="kr-badge-outline">
                  {{ store.scenesWithImage }}/{{ store.sceneCount }} scenes with
                  art
                </span>
                <span class="kr-badge-outline">
                  {{ store.current.doc.song ? 'Song ready' : 'No song yet' }}
                </span>
              </div>

              <MusicVideoPipelineBar />

              <MusicVideoSongPanel />

              <MusicVideoTimelineEditor
                v-if="store.current.doc.song || store.current.doc.scenes.length"
                :key="store.current.id"
                :doc="store.current.doc"
                :saving="store.saving"
                @save="store.saveTimeline($event)"
              />

              <MusicVideoExporter
                v-if="store.current.doc.scenes.length"
                :key="`export-${store.current.id}`"
                :video-id="store.current.id"
                :title="store.current.title"
                :doc="store.current.doc"
                :preview-urls="store.previewUrls"
              />

              <form class="space-y-3" @submit.prevent="onSave">
                <label class="block space-y-1">
                  <span class="kr-text-dim-sm">Title</span>
                  <input
                    v-model="title"
                    class="kr-input w-full"
                    type="text"
                    maxlength="255"
                  />
                </label>
                <label class="block space-y-1">
                  <span class="kr-text-dim-sm">Pitch</span>
                  <textarea
                    v-model="pitch"
                    class="kr-input w-full"
                    rows="4"
                    maxlength="4000"
                  />
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    class="kr-btn kr-btn-primary"
                    :disabled="store.saving"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    class="kr-btn"
                    :disabled="store.saving"
                    @click="onDelete"
                  >
                    Delete
                  </button>
                </div>
              </form>

              <MusicVideoSceneGrid />

              <MusicVideoSettingsPanel />
            </template>
          </section>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'
import { useUserStore } from '@/stores/userStore'

const store = useMusicVideoStore()
const userStore = useUserStore()
const ready = ref(false)
const newTitle = ref('')
const newPitch = ref('')
const title = ref('')
const pitch = ref('')

const finalPreview = computed(() =>
  store.current?.finalArtImageId
    ? (store.previewUrls[store.current.finalArtImageId] ?? null)
    : null,
)

watch(
  () => store.current,
  (video) => {
    title.value = video?.title ?? ''
    pitch.value = video?.doc.pitch ?? ''
  },
  { immediate: true },
)

async function onCreate() {
  if (await store.create(newTitle.value, newPitch.value)) {
    newTitle.value = ''
    newPitch.value = ''
  }
}

async function onSave() {
  await store.savePitch(title.value, pitch.value)
}

async function onDelete() {
  if (!store.current) return
  if (
    !window.confirm(`Delete "${store.current.title}"? This cannot be undone.`)
  )
    return
  await store.remove(store.current.id)
}

onMounted(async () => {
  await userStore.initialize()
  if (userStore.isAdmin) {
    await store.loadList()
    // Renders finish on the Comfy box while the page is open; check on them.
    store.startWatching()
  }
  ready.value = true
})

onBeforeUnmount(() => store.stopWatching())
</script>
