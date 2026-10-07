<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-5 p-4 md:p-6">
      <!-- Controls only: the shell's workspace-header renders the title and
           subtitle from content/channels/projects/music-video.md (THE HEADER RULE). -->
      <header class="kr-toolbar justify-end">
        <button
          v-if="userStore.isLoggedIn && !store.current"
          type="button"
          class="kr-btn kr-btn-primary"
          :aria-expanded="creating"
          @click="creating = !creating"
        >
          <icon name="kind-icon:plus" class="kr-icon-4" />
          New video
        </button>
        <button
          type="button"
          class="kr-btn"
          :disabled="store.loading"
          @click="onRefresh"
        >
          <span v-if="store.loading" class="kr-spinner-xs" />
          Refresh
        </button>
      </header>

      <div v-if="!ready" class="grid min-h-60 place-items-center kr-panel">
        <span class="kr-spinner-lg-primary" />
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

        <div v-if="notice" class="kr-note flex items-center gap-3 p-3">
          <span class="flex-1">{{ notice }}</span>
          <button type="button" class="kr-btn" @click="notice = ''">
            Dismiss
          </button>
        </div>

        <div
          v-if="creating && !store.current"
          class="kr-panel flex flex-wrap items-center gap-2 p-2"
        >
          <form
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
          <div
            v-if="userStore.isAdmin"
            class="flex w-full flex-wrap items-center gap-2"
          >
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
            <label
              class="flex items-center gap-1 text-sm"
              title="Pick up the song and stills of a copy of this spec that was deleted"
            >
              <input
                v-model="reuseDeleted"
                type="checkbox"
                class="checkbox checkbox-xs"
              />
              Reuse song and art from a deleted copy
            </label>
          </div>
          <p v-else class="kr-text-dim-sm w-full">
            Rendering is admin-only for now, so a new video starts as a draft
            that keeps your pitch and settings.
          </p>
        </div>

        <MusicVideoGallery v-if="!store.current" />

        <template v-else>
          <div class="kr-panel flex flex-wrap items-center gap-2 p-2">
            <button type="button" class="kr-btn" @click="store.close()">
              <icon name="kind-icon:arrow-left" class="kr-icon-4" />
              All videos
            </button>
            <h2 class="kr-text-bold-lg min-w-0 truncate">
              {{ store.current.title }}
            </h2>
            <template v-if="store.canProduce">
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
            <MusicVideoActions v-if="store.canProduce" :video="editorTarget" />
          </div>

          <!-- On a large screen the stage and the scenes each take half. -->
          <section v-if="store.canProduce" class="grid gap-4 xl:grid-cols-2">
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
                <summary class="kr-text-dim-sm cursor-pointer">
                  Timeline
                </summary>
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

          <MusicVideoViewer v-else />
        </template>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
// Silas, 2026-10-07: "Move music video tab to Play. Created videos should be
// a gallery on front page." The page opens on the gallery; an open video is
// the full editor for an admin who owns it, and a viewer for everyone else.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'
import { useUserStore } from '@/stores/userStore'
import { MUSIC_VIDEO_SPECS } from '@/utils/musicVideoSpecs'

const store = useMusicVideoStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const ready = ref(false)
const creating = ref(false)
const newTitle = ref('')
const newPitch = ref('')
const specs = MUSIC_VIDEO_SPECS
const specKey = ref(MUSIC_VIDEO_SPECS[0]?.key ?? '')
const reuseDeleted = ref(false)
const notice = ref('')

const editorTarget = computed(() => ({
  id: store.current?.id ?? 0,
  title: store.current?.title ?? '',
  isOwner: store.isOwner,
  isPublic: store.current?.isPublic ?? true,
}))

function routeVideoId(): number | null {
  const id = Number(route.query.video)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function onRefresh() {
  await store.loadList()
  if (store.current) await store.select(store.current.id)
}

async function onCreate() {
  if (await store.create(newTitle.value, newPitch.value)) {
    newTitle.value = ''
    newPitch.value = ''
    creating.value = false
  }
}

async function onImport() {
  const message = await store.importSpec(specKey.value, reuseDeleted.value)
  if (message) {
    notice.value = `${message} Press Produce to render it.`
    creating.value = false
  }
}

watch(
  () => store.current?.id ?? null,
  (id) => {
    if (!ready.value || id === routeVideoId()) return
    const query = { ...route.query }
    if (id) query.video = String(id)
    else delete query.video
    void router.replace({ query })
  },
)

watch(routeVideoId, (id) => {
  if (!ready.value) return
  if (id && id !== store.current?.id) void store.select(id)
  else if (!id && store.current) store.close()
})

onMounted(async () => {
  await userStore.initialize()
  await store.loadList()
  const id = routeVideoId()
  if (id && id !== store.current?.id) await store.select(id)
  // Renders finish on the Comfy box while the page is open; check on them.
  store.startWatching()
  ready.value = true
})

onBeforeUnmount(() => store.stopWatching())
</script>
