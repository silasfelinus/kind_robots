<!-- /components/pages/storybook-library-page.vue -->
<template>
  <section class="kr-surface">
    <header
      class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-(--kr-surface-raised) p-3 shadow-sm"
    >
      <div class="min-w-0">
        <p
          class="kr-text-eyebrow-bold text-[0.7rem] tracking-wide text-primary/70"
        >
          Story library
        </p>
        <p class="kr-text-dim-sm mt-0.5">
          {{ storyStore.recentStories.length }} saved
          {{ storyStore.recentStories.length === 1 ? 'story' : 'stories' }} on
          this account
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

          <div class="dropdown dropdown-end">
            <button
              type="button"
              tabindex="0"
              class="btn btn-ghost btn-sm rounded-xl border border-base-300"
              aria-haspopup="menu"
            >
              <Icon name="kind-icon:download" class="size-4" /> Export
            </button>
            <ul
              tabindex="0"
              class="menu dropdown-content z-20 mt-2 w-44 kr-panel-flat p-2 shadow-xl"
            >
              <li>
                <button
                  type="button"
                  @click="downloadStory(undefined, 'markdown'); closeExportMenu()"
                >
                  Markdown
                </button>
              </li>
              <li>
                <button
                  type="button"
                  @click="downloadStory(undefined, 'json'); closeExportMenu()"
                >
                  JSON
                </button>
              </li>
            </ul>
          </div>

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
            <Icon name="kind-icon:alert" class="size-4" /> Restart from the
            beginning?
          </button>

          <button
            v-if="!newStoryArmed"
            type="button"
            class="kr-btn-primary"
            :disabled="storyStore.isWeaving"
            @click="newStoryArmed = true"
          >
            <Icon name="kind-icon:plus" class="size-4" /> New story
          </button>
          <button
            v-else
            type="button"
            class="btn btn-warning btn-sm rounded-xl"
            :disabled="storyStore.isWeaving"
            @click="startNewStory"
            @blur="newStoryArmed = false"
          >
            <Icon name="kind-icon:alert" class="size-4" /> Discard this tale?
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
          <h2 class="kr-text-black-lg">Recent stories</h2>
          <p class="kr-text-dim-xs-55 mt-1 leading-relaxed">
            Open an existing branch, duplicate it safely, or export a portable
            copy.
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
                :class="
                  story.status === 'complete'
                    ? 'badge-success'
                    : 'badge-primary'
                "
              >
                {{ story.status }}
              </span>
            </div>
            <p
              class="kr-text-dim-xs-55 mt-1 line-clamp-2 leading-relaxed"
            >
              {{ story.bible.premise }}
            </p>
            <p class="mt-2 text-[0.68rem] text-base-content/40">
              {{ story.beats.length }} scene{{
                story.beats.length === 1 ? '' : 's'
              }}
              · updated {{ formatStoryDate(story.updatedAt) }}
            </p>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              class="kr-btn-xs btn-primary"
              @click="openStory(story.id)"
            >
              {{ story.status === 'complete' ? 'Open' : 'Resume' }}
            </button>
            <button
              type="button"
              class="kr-btn-xs btn-ghost border border-base-300"
              @click="duplicateStory(story.id)"
            >
              Duplicate
            </button>
            <button
              type="button"
              class="kr-btn-xs btn-ghost border border-base-300"
              @click="downloadStory(story.id, 'markdown')"
            >
              Export
            </button>
          </div>
        </article>
      </div>

      <div
        v-else
        class="kr-panel-flat border-dashed bg-base-100/70 p-5 text-center"
      >
        <p class="font-bold">No saved stories yet</p>
        <p class="kr-text-dim-xs mt-1">
          Your first Storybook session will appear here automatically.
        </p>
      </div>
    </section>

    <div class="min-h-0 flex-1 overflow-hidden">
      <StorybookVisualSetup v-if="!storyStore.session" />
      <div v-show="storyStore.session" class="size-full">
        <StorybookPage />
      </div>
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
const newStoryArmed = ref(false)

const SEED_QUERY_KEYS = new Set([
  'scenario',
  'location',
  'character',
  'facet',
  'reward',
])

function queryStoryId(): string | null {
  return typeof route.query.story === 'string' ? route.query.story : null
}

function updateStoryQuery(sessionId: string | null): void {
  const query = Object.fromEntries(
    Object.entries(route.query).filter(([key]) => !SEED_QUERY_KEYS.has(key)),
  )
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

function closeExportMenu(): void {
  if (typeof document === 'undefined') return
  const element = document.activeElement as HTMLElement | null
  element?.blur()
}

function startNewStory(): void {
  if (storyStore.isWeaving) return
  newStoryArmed.value = false
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
        year:
          date.getFullYear() === new Date().getFullYear()
            ? undefined
            : 'numeric',
      }).format(date)
}

watch(
  () => storyStore.session?.id ?? null,
  (sessionId) => {
    restartArmed.value = false
    newStoryArmed.value = false
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
  if (directId && directId !== storyStore.session?.id) {
    storyStore.openStory(directId)
  }
  libraryOpen.value = !storyStore.session && storyStore.recentStories.length > 0
  if (storyStore.session && !directId) updateStoryQuery(storyStore.session.id)
})
</script>
