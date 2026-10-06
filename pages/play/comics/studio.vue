<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden p-2 md:p-3">
    <div class="kr-toolbar">
      <select
        v-if="studio.seriesList.length"
        :value="studio.series?.id ?? ''"
        class="kr-select-sm"
        aria-label="Series"
        @change="onSeriesChange"
      >
        <option
          v-for="item in studio.seriesList"
          :key="item.id"
          :value="item.id"
        >
          {{ item.title }}
        </option>
      </select>
      <form
        v-if="creating || !studio.seriesList.length"
        class="flex gap-2"
        @submit.prevent="createSeries"
      >
        <input
          v-model="newSeriesTitle"
          class="kr-input-sm"
          placeholder="New series title"
          aria-label="New series title"
        />
        <button
          type="submit"
          class="kr-btn btn-primary btn-sm"
          :disabled="!newSeriesTitle.trim() || studio.saving"
        >
          Create
        </button>
      </form>
      <button
        v-else
        type="button"
        class="kr-btn btn-ghost btn-sm"
        @click="creating = true"
      >
        <icon name="kind-icon:plus" class="kr-icon-4" /> Series
      </button>
      <div v-if="studio.series" class="join">
        <button
          v-for="tab in tabs"
          :key="tab.mode"
          type="button"
          class="kr-btn join-item btn-sm"
          :class="studio.mode === tab.mode ? 'btn-primary' : 'btn-ghost'"
          @click="setMode(tab.mode)"
        >
          <icon :name="tab.icon" class="kr-icon-4" /> {{ tab.label }}
        </button>
      </div>
      <button
        v-if="studio.primaryLane"
        type="button"
        class="kr-badge-primary-sm flex items-center gap-1"
        title="House checkpoint: change it in Notes"
        @click="setMode('notes')"
      >
        <icon name="kind-icon:crown" class="kr-icon-3" />
        {{ studio.primaryLane.label }}
      </button>
      <span v-if="studio.activeCount" class="badge badge-info"
        >{{ studio.activeCount }} rendering</span
      >
      <div class="ml-auto flex items-center gap-2">
        <select
          v-model="pane"
          class="kr-select-sm lg:hidden"
          aria-label="Show pane"
        >
          <option value="rail">
            {{ studio.mode === 'composer' ? 'Art shelf' : 'Entities' }}
          </option>
          <option value="center">
            {{
              studio.mode === 'composer'
                ? 'Pages'
                : studio.mode === 'notes'
                  ? 'Notes'
                  : studio.mode === 'cast'
                    ? 'Cast'
                    : 'Board'
            }}
          </option>
          <option value="inspector">Details</option>
        </select>
        <button
          type="button"
          class="kr-btn btn-ghost btn-sm"
          :disabled="studio.loading"
          @click="studio.refresh()"
        >
          <span v-if="studio.loading" class="kr-spinner-xs" />
          <icon v-else name="kind-icon:refresh" class="kr-icon-4" />
        </button>
      </div>
    </div>

    <div v-if="!ready" class="grid flex-1 place-items-center">
      <span class="kr-spinner-lg-primary" />
    </div>
    <div
      v-else-if="!userStore.isAdmin"
      class="kr-note kr-note-error p-8 text-center"
    >
      <p class="kr-text-black-xl">Administrator access required</p>
      <p class="kr-text-dim-sm mt-2">The Comic Studio is Silas's workspace.</p>
    </div>
    <template v-else>
      <div
        v-if="studio.error"
        class="kr-note kr-note-error flex items-center justify-between gap-2 text-sm"
      >
        <span>{{ studio.error }}</span>
        <button
          type="button"
          class="kr-btn btn-ghost btn-xs"
          @click="studio.setError(null)"
        >
          Dismiss
        </button>
      </div>

      <comic-editor-desk v-if="studio.series" />

      <div
        class="kr-panes grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)_22rem]"
      >
        <section
          class="kr-pane-scroll rounded-2xl bg-base-200/60 p-3"
          :class="pane === 'rail' ? '' : 'hidden lg:block'"
        >
          <comic-studio-rail />
        </section>
        <section
          class="kr-pane-scroll rounded-2xl p-1"
          :class="pane === 'center' ? '' : 'hidden lg:block'"
        >
          <div
            v-if="!studio.series && !studio.loading"
            class="kr-note flex flex-col gap-2 p-6"
          >
            <p class="kr-text-black-xl">No comic series yet</p>
            <p class="kr-text-dim-sm">
              Name a series above to start one, or seed one from Conductor with
              <code>scripts/import_comic_studio.py --live</code>, which brings
              in the cast sheets, the vetted renders and the issue notes.
            </p>
          </div>
          <comic-cast-sheets v-else-if="studio.mode === 'cast'" />
          <comic-slot-board v-else-if="studio.mode === 'board'" />
          <comic-issue-composer v-else-if="studio.mode === 'composer'" />
          <comic-series-notes v-else />
        </section>
        <section
          class="kr-pane-scroll rounded-2xl bg-base-200/60 p-3"
          :class="pane === 'inspector' ? '' : 'hidden lg:block'"
        >
          <comic-panel-inspector v-if="studio.mode === 'composer'" />
          <comic-entity-notes v-else />
        </section>
      </div>
    </template>

    <comic-attempt-lightbox />
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useComicStudioStore,
  type ComicStudioMode,
} from '@/stores/comicStudioStore'
import { useUserStore } from '@/stores/userStore'

const studio = useComicStudioStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const ready = computed(() => userStore.initialized)
const pane = ref<'rail' | 'center' | 'inspector'>('center')
const creating = ref(false)
const newSeriesTitle = ref('')

const tabs: Array<{ mode: ComicStudioMode; label: string; icon: string }> = [
  { mode: 'cast', label: 'Cast', icon: 'kind-icon:users' },
  { mode: 'board', label: 'Board', icon: 'kind-icon:grid' },
  { mode: 'composer', label: 'Pages', icon: 'kind-icon:layers' },
  { mode: 'notes', label: 'Notes', icon: 'kind-icon:book-open' },
]

function setMode(mode: ComicStudioMode) {
  studio.mode = mode
  void router.replace({ query: { ...route.query, mode } })
}

function onSeriesChange(event: Event) {
  const id = Number((event.target as HTMLSelectElement).value)
  if (id) void studio.openSeries(id)
}

async function createSeries() {
  const title = newSeriesTitle.value.trim()
  if (!title) return
  if (await studio.createSeries(title)) {
    newSeriesTitle.value = ''
    creating.value = false
  }
}

async function start() {
  if (!userStore.isAdmin) return
  const mode = String(route.query.mode || '')
  if (
    mode === 'cast' ||
    mode === 'board' ||
    mode === 'composer' ||
    mode === 'notes'
  )
    studio.mode = mode
  studio.loadAutoEditor()
  await studio.initialize(
    typeof route.query.series === 'string' ? route.query.series : null,
  )
}

watch(ready, (value) => {
  if (value) void start()
})

watch(
  () => studio.series?.slug,
  (slug) => {
    if (slug && route.query.series !== slug)
      void router.replace({ query: { ...route.query, series: slug } })
  },
)

onMounted(() => {
  if (ready.value) void start()
})

onBeforeUnmount(() => {
  studio.stopPolling()
  void studio.flushLayout()
})
</script>
