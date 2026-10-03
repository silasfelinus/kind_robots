<template>
  <div v-if="studio.series" class="flex flex-col gap-4">
    <section class="flex flex-col gap-2">
      <input
        v-model="draft.title"
        class="kr-input font-bold"
        aria-label="Series title"
      />
      <label class="flex flex-col gap-1 text-xs"
        >Series notes (story, world, factions, plot seeds)
        <textarea v-model="draft.notes" class="kr-textarea min-h-72 text-sm" />
      </label>
    </section>

    <section class="flex flex-col gap-2 rounded-2xl border border-base-300 p-3">
      <p class="kr-text-black-base">Style added to every render</p>
      <div
        class="grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))]"
      >
        <label class="flex flex-col gap-1 text-xs"
          >Prose style
          <textarea
            v-model="draft.styleProse"
            class="kr-textarea min-h-20 text-sm"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs"
          >Tag style
          <textarea
            v-model="draft.styleTags"
            class="kr-textarea min-h-20 text-sm"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs"
          >Default negative (SDXL family)
          <textarea
            v-model="draft.negativeTags"
            class="kr-textarea min-h-20 text-sm"
          />
        </label>
      </div>
      <label class="flex items-center gap-2 text-xs">
        <input
          v-model="draft.isPublicArt"
          type="checkbox"
          class="kr-checkbox-primary-sm"
        />
        New renders are public in the Kind Robots gallery
      </label>
    </section>

    <section class="flex flex-col gap-2 rounded-2xl border border-base-300 p-3">
      <p class="kr-text-black-base">Lanes</p>
      <p class="kr-text-dim-xs">
        Active lanes get a column on every subject. Steps and guidance come from
        each checkpoint family's profile.
      </p>
      <label
        v-for="lane in lanes"
        :key="lane.key"
        class="flex items-center gap-2 text-sm"
      >
        <input
          v-model="lane.active"
          type="checkbox"
          class="kr-checkbox-primary-sm"
        />
        <span class="font-semibold">{{ lane.label }}</span>
        <span class="kr-text-dim-xs truncate"
          >{{ lane.engine
          }}{{ lane.checkpoint ? ` · ${lane.checkpoint}` : '' }} ·
          {{ lane.promptStyle }}</span
        >
      </label>
    </section>

    <button
      type="button"
      class="kr-btn btn-primary btn-sm self-start"
      :disabled="!dirty"
      @click="save"
    >
      Save series
    </button>

    <section
      v-for="issue in studio.issues"
      :key="issue.id"
      class="flex flex-col gap-2 rounded-2xl border border-base-300 p-3"
    >
      <p class="kr-text-black-base">Issue {{ issue.number }} notes</p>
      <textarea
        :value="issue.notes ?? ''"
        class="kr-textarea min-h-32 text-sm"
        :aria-label="`Issue ${issue.number} notes`"
        @change="saveIssueNotes(issue.id, $event)"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'
import type { ComicSeriesDto } from '~/types/comicStudio'
import type { ComicLane } from '~/utils/comicLanes'

const studio = useComicStudioStore()

function fromSeries(series: ComicSeriesDto | null) {
  return {
    title: series?.title ?? '',
    notes: series?.notes ?? '',
    styleProse: series?.styleProse ?? '',
    styleTags: series?.styleTags ?? '',
    negativeTags: series?.negativeTags ?? '',
    isPublicArt: series?.isPublicArt ?? false,
  }
}
const draft = reactive(fromSeries(studio.series))
const lanes = ref<ComicLane[]>(
  (studio.series?.lanes ?? []).map((lane) => ({ ...lane })),
)
watch(
  () => studio.series,
  (series) => {
    Object.assign(draft, fromSeries(series))
    lanes.value = (series?.lanes ?? []).map((lane) => ({ ...lane }))
  },
)

const lanesChanged = computed(() =>
  lanes.value.some(
    (lane, index) => lane.active !== studio.series?.lanes[index]?.active,
  ),
)
const dirty = computed(() => {
  const original = fromSeries(studio.series)
  return (
    lanesChanged.value ||
    (Object.keys(original) as Array<keyof typeof original>).some(
      (key) => draft[key] !== original[key],
    )
  )
})

function save() {
  void studio.saveSeries({
    ...draft,
    ...(lanesChanged.value ? { lanes: lanes.value } : {}),
  })
}

function saveIssueNotes(issueId: number, event: Event) {
  void studio.saveIssue(issueId, {
    notes: (event.target as HTMLTextAreaElement).value,
  })
}
</script>
