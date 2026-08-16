<!-- /components/pages/storybook-library-page.vue -->
<template>
  <section class="kr-surface">
    <header
      class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-(--kr-surface-raised) p-3 shadow-sm"
    >
      <div class="min-w-0">
        <p class="text-[0.7rem] font-bold uppercase tracking-wide text-primary/70">
          Story library
        </p>
        <p class="mt-0.5 text-sm text-base-content/60">
          {{ storyStore.recentStories.length }} saved
          {{ storyStore.recentStories.length === 1 ? 'story' : 'stories' }} on this account
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl border border-base-300"
          :aria-expanded="libraryOpen"
          @click="libraryOpen = !libraryOpen"
        >
          <Icon name="kind-icon:book" class="size-4" />
          {{ libraryOpen ? 'Hide library' : 'Recent stories' }}
        </button>

        <template v-if="storyStore.session">
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl border border-base-300"
            :disabled="storyStore.isWeaving"
            @click="duplicateCurrent"
          >
            <Icon name="kind-icon:copy" class="size-4" /> Duplicate
          </button>

          <details class="dropdown dropdown-end">
            <summary class="btn btn-ghost btn-sm rounded-xl border border-base-300">
              <Icon name="kind-icon:download" class="size-4" /> Export
            </summary>
            <ul
              class="menu dropdown-content z-20 mt-2 w-44 kr-panel-flat p-2 shadow-xl"
            >
              <li><button type="button" @click="downloadStory(undefined, 'markdown')">Markdown</button></li>
              <li><button type="button" @click="downloadStory(undefined, 'json')">JSON</button></li>
            </ul>
          </details>

          <button
            v-if="!restartArmed"
            type="button"
            class="btn btn-ghost btn-sm rounded-xl border border-base-300"
            :disabled="storyStore.isWeaving"
            @click="restartArmed = true"
          >
            <Icon name="kind-icon:refresh" class="size-4" /> Restart
          </button>
          <button
            v-else
            type="button"
            class="btn btn-warning btn-sm rounded-xl"
            :disabled="storyStore.isWeaving"
            @click="restartCurrent"
            @blur="restartArmed = false"
          >
            <Icon name="kind-icon:alert" class="size-4" /> Restart from the beginning?
          </button>

          <button
            type="button"
            class="btn btn-primary btn-sm rounded-xl"
            :disabled="storyStore.isWeaving"
            @click="startNewStory"
          >
            <Icon name="kind-icon:plus" class="size-4" /> New story
          </button>
        </template>
      </div>
    </header>

    <section
      v-if="libraryOpen"
      class="max-h-[42dvh] shrink-0 space-y-3 overflow-y-auto rounded-2xl border border-primary/20 bg-primary/5 p-4"
    >
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 class="text-lg font-black">Recent stories</h2>
          <p class="mt-1 text-xs leading-relaxed text-base-content/55">
            Open an existing branch, duplicate it safely, or export a portable copy.
          </p>
        </div>
        <span class="badge badge-ghost rounded-xl">
          Up to 20 recent sessions
        </span>
      </div>

      <div
        v-if="storyStore.recentStories.length"
        class="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
      >
        <article
          v-for="story in storyStore.recentStories"
          :key="story.id"
          class="kr-panel-flat flex min-w-0 flex-col p-3"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <h3 class="truncate font-black">{{ story.bible.title }}</h3>
              <span
                class="badge badge-sm rounded-xl"
                :class="story.status === 'complete' ? 'badge-success' : 'badge-primary'"
              >
                {{ story.status }}
              </span>
            </div>
            <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-base-content/55">
              {{ story.bible.premise }}
            </p>
            <p class="mt-2 text-[0.68rem] text-base-content/40">
              {{ story.beats.length }} scene{{ story.beats.length === 1 ? '' : 's' }} ·
              updated {{ formatStoryDate(story.updatedAt) }}
            </p>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-primary btn-xs rounded-xl"
              @click="openStory(story.id)"
            >
              {{ story.status === 'complete' ? 'Open' : 'Resume' }}
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-xl border border-base-300"
              @click="duplicateStory(story.id)"
            >
              Duplicate
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-xl border border-base-300"
              @click="downloadStory(story.id, 'markdown')"
            >
              Export
            </button>
          </div>
        </article>
      </div>

      <div
        v-else
        class="rounded-2xl border border-dashed border-base-300 bg-base-100/70 p-5 text-center"
      >
        <p class="font-bold">No saved stories yet</p>
        <p class="mt-1 text-xs text-base-content/50">
          Your first Storybook session will appear here automatically.
        </p>
      </div>
    </section>

    <div class="min-h-0 flex-1 overflow-hidden">
      <StorybookPage />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStorybookStore } from '@/stores/storybookStore'

const storyStore = useStorybookStore()
const route = useRoute()
const router = useRouter()

const libraryOpen = ref(false)
const restartArmed = ref(false)

function queryStoryId(): string | null {
  return typeof route.query.story === 'string' ? route.query.story : null
}

function updateStoryQuery(sessionId: string | null): void {
  const query = { ...route.query }
  if (sessionId) query.story = sessionId
  else delete query.story
  void router.replace({ query })
}

function openStory(sessionId: string): void {
  if (!storyStore.openStory(sessionId)) return
  libraryOpen.value = false
  updateStoryQuery(sessionId)
}

function duplicateStory(sessionId: string): void {
  const duplicateId = storyStore.duplicateStory(sessionId)
  if (!duplicateId) return
  libraryOpen.value = false
  updateStoryQuery(duplicateId)
}

function duplicateCurrent(): void {
  const duplicateId = storyStore.duplicateStory()
  if (duplicateId) updateStoryQuery(duplicateId)
}

async function restartCurrent(): Promise<void> {
  restartArmed.value = false
  const restartedId = await storyStore.restartStory()
  if (restartedId) updateStoryQuery(restartedId)
}

function triggerDownload(payload: {
  filename: string
  mimeType: string
  content: string
}): void {
  const blob = new Blob([payload.content], {
    type: `${payload.mimeType};charset=utf-8`,
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = payload.filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function downloadStory(
  sessionId?: string,
  format: 'markdown' | 'json' = 'markdown',
): void {
  const payload = storyStore.buildExport(sessionId, format)
  if (payload) triggerDownload(payload)
}

function startNewStory(): void {
  if (storyStore.isWeaving) return
  storyStore.archiveCurrent()
  storyStore.resetSession()
  libraryOpen.value = false
  updateStoryQuery(null)
}

function formatStoryDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'recently'
    : new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
      }).format(date)
}

watch(
  () => storyStore.session?.id ?? null,
  (sessionId) => {
    if (sessionId !== queryStoryId()) updateStoryQuery(sessionId)
  },
)

watch(
  () => route.query.story,
  (value) => {
    if (typeof value !== 'string' || value === storyStore.session?.id) return
    openStory(value)
  },
)

onMounted(() => {
  storyStore.restoreFromLocalStorage()
  storyStore.initializeLibrary()
  const directId = queryStoryId()
  // Only call openStory() when it would actually SWITCH sessions. On a plain
  // reload mid-story, restoreFromLocalStorage() above already restored the
  // live session, and updateStoryQuery() keeps ?story= in sync with it while
  // playing -- so directId equals storyStore.session.id on every ordinary
  // refresh, not just some rare cross-story navigation. Calling openStory()
  // anyway re-clones the just-restored session and, critically, invokes
  // resumeNarrativeArtJobs() a SECOND time on top of the one
  // restoreFromLocalStorage() already performed. For any beat whose art job
  // enqueue never reached the server before the reload (status still
  // 'queueing', no jobId yet -- a real window between the optimistic status
  // update and the resolved POST), both resume() calls independently find no
  // existing job and independently submit one, generating and billing two
  // illustrations for a single beat. The watcher below already guards the
  // same call this way (`value === storyStore.session?.id`); mount just
  // never matched it.
  if (directId && directId !== storyStore.session?.id) {
    storyStore.openStory(directId)
  }
  libraryOpen.value = !storyStore.session && storyStore.recentStories.length > 0
  if (storyStore.session && !directId) updateStoryQuery(storyStore.session.id)
})
</script>
