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

        <!-- t-032: the video list and "new video" fold into one row, so the
             stage gets the width. Silas: "name and pitch section is killing
             us with all that whitespace." -->
        <div class="kr-panel flex flex-wrap items-center gap-2 p-2">
          <select
            class="kr-input w-auto min-w-0 max-w-full flex-1 md:flex-none"
            aria-label="Music video"
            :value="store.current?.id ?? ''"
            @change="onSelect"
          >
            <option value="" disabled>
              {{ store.videos.length ? 'Pick a music video' : 'No videos yet' }}
            </option>
            <option
              v-for="video in store.videos"
              :key="video.id"
              :value="video.id"
            >
              {{ video.title }} ({{ video.status }})
            </option>
          </select>
          <template v-if="store.current">
            <span class="kr-badge-outline"
              >{{ store.current.doc.settings.durationSec }}s</span
            >
            <span class="kr-badge-outline"
              >{{ store.lyricLineCount }} lines</span
            >
            <span class="kr-badge-outline">
              {{ store.scenesWithImage }}/{{ store.sceneCount }} with art
            </span>
            <span class="kr-badge-outline">
              {{ store.current.doc.song ? 'Song ready' : 'No song' }}
            </span>
          </template>
          <span class="flex-1" />
          <button
            type="button"
            class="kr-btn"
            :aria-expanded="creating"
            @click="creating = !creating"
          >
            New video
          </button>
          <form
            v-if="creating"
            class="flex w-full flex-wrap items-center gap-2"
            @submit.prevent="onCreate"
          >
            <input
              v-model="newTitle"
              class="kr-input w-full md:w-64"
              type="text"
              maxlength="255"
              placeholder="Title"
              aria-label="New video title"
            />
            <input
              v-model="newPitch"
              class="kr-input min-w-0 flex-1"
              type="text"
              maxlength="4000"
              placeholder="Pitch: a neon-lit lullaby for sleepy robots…"
              aria-label="New video pitch"
            />
            <button
              type="submit"
              class="kr-btn kr-btn-primary"
              :disabled="store.saving"
            >
              Create
            </button>
          </form>
          <div v-if="creating" class="flex w-full flex-wrap items-center gap-2">
            <span class="kr-text-dim-sm">Or start fully set up:</span>
            <select
              v-model="specKey"
              class="kr-input w-auto min-w-0 flex-1 md:flex-none"
              aria-label="Prepared spec"
            >
              <option v-for="spec in specs" :key="spec.key" :value="spec.key">
                {{ spec.title }}: {{ spec.summary }}
              </option>
            </select>
            <button
              type="button"
              class="kr-btn"
              :disabled="store.saving || !specKey"
              @click="onImport"
            >
              Create from spec
            </button>
          </div>
        </div>

        <div v-if="notice" class="kr-note flex items-center gap-3 p-3">
          <span class="flex-1">{{ notice }}</span>
          <button type="button" class="kr-btn" @click="notice = ''">
            Dismiss
          </button>
        </div>

        <div
          v-if="!store.current"
          class="kr-panel grid min-h-40 place-items-center text-center"
        >
          <p class="kr-text-dim-sm">
            Pick a music video above, or press New video.
          </p>
        </div>

        <!-- On a large screen the stage and the scenes each take half. -->
        <section v-else class="grid gap-4 xl:grid-cols-2">
          <div class="min-w-0 space-y-3">
            <MusicVideoBriefPanel />
            <MusicVideoProducePanel />
            <MusicVideoPipelineBar />
            <MusicVideoSongPanel />
            <details class="kr-panel p-2">
              <summary class="kr-text-dim-sm cursor-pointer">
                Lyrics by section (each scene also edits its own lines)
              </summary>
              <MusicVideoLyricsEditor class="mt-2" />
            </details>
            <details
              v-if="store.current.doc.song || store.current.doc.scenes.length"
              class="kr-panel p-2"
            >
              <summary class="kr-text-dim-sm cursor-pointer">Timeline</summary>
              <MusicVideoTimelineEditor
                :key="store.current.id"
                class="mt-2"
                :doc="store.current.doc"
                :saving="store.saving"
                @save="store.saveTimeline($event)"
              />
            </details>
            <details class="kr-panel p-2">
              <summary class="kr-text-dim-sm cursor-pointer">
                Animation presets
              </summary>
              <MusicVideoMotionPresets class="mt-2" />
            </details>
          </div>
          <div class="min-w-0">
            <MusicVideoSceneGrid />
            <p
              v-if="!store.current.doc.scenes.length"
              class="kr-panel kr-text-dim-sm p-4 text-center"
            >
              No scenes yet. Produce plans them, or use the pipeline's Plan
              scenes step.
            </p>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'
import { useUserStore } from '@/stores/userStore'
import { MUSIC_VIDEO_SPECS } from '@/utils/musicVideoSpecs'

const store = useMusicVideoStore()
const userStore = useUserStore()
const ready = ref(false)
const creating = ref(false)
const newTitle = ref('')
const newPitch = ref('')
const specs = MUSIC_VIDEO_SPECS
const specKey = ref(MUSIC_VIDEO_SPECS[0]?.key ?? '')
const notice = ref('')

function onSelect(event: Event) {
  const id = Number((event.target as HTMLSelectElement).value)
  if (Number.isInteger(id) && id > 0) void store.select(id)
}

async function onCreate() {
  if (await store.create(newTitle.value, newPitch.value)) {
    newTitle.value = ''
    newPitch.value = ''
    creating.value = false
  }
}

async function onImport() {
  const message = await store.importSpec(specKey.value)
  if (message) {
    notice.value = `${message} Press Produce to render it.`
    creating.value = false
  }
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
