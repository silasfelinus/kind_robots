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

    <section class="flex flex-col gap-3 rounded-2xl border border-base-300 p-3">
      <div class="flex flex-col gap-1">
        <p class="kr-text-black-base">House checkpoint</p>
        <p class="kr-text-dim-xs">
          The comic is drawn in the house lane: its column comes first and the
          main Render button uses it. Other active lanes are for comparison.
          Leave steps, guidance and sampler blank to use the checkpoint family's
          profile.
        </p>
      </div>

      <div
        v-for="(lane, index) in lanes"
        :key="lane.key"
        class="flex flex-col gap-2 rounded-xl border p-2"
        :class="lane.primary ? 'border-primary' : 'border-base-300'"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span
            v-if="lane.primary"
            class="kr-badge-primary-sm flex items-center gap-1"
          >
            <icon name="kind-icon:crown" class="kr-icon-3" />
            House
          </span>
          <button
            v-else
            type="button"
            class="kr-btn btn-ghost btn-xs"
            :disabled="!lane.active"
            @click="makePrimary(index)"
          >
            Make house lane
          </button>
          <input
            v-model="lane.label"
            class="kr-input-sm min-w-0 flex-1 font-semibold"
            :aria-label="`Label for ${lane.key}`"
          />
          <label class="flex items-center gap-1 text-xs">
            <input
              v-model="lane.active"
              type="checkbox"
              class="kr-checkbox-primary-sm"
            />
            Active
          </label>
          <button
            type="button"
            class="kr-btn btn-ghost btn-xs"
            :disabled="lane.primary"
            :aria-label="`Remove ${lane.label}`"
            @click="removeLane(index)"
          >
            <icon name="kind-icon:trash" class="kr-icon-4" />
          </button>
        </div>
        <p class="kr-text-dim-xs break-all">
          {{ lane.engine
          }}{{ lane.checkpoint ? ` · ${lane.checkpoint}` : '' }} ·
          {{ lane.promptStyle }}
        </p>
        <div
          v-if="lane.engine === 'comfy'"
          class="grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))]"
        >
          <label class="flex flex-col gap-1 text-xs"
            >Steps
            <input
              v-model.number="lane.steps"
              type="number"
              min="1"
              max="80"
              placeholder="profile"
              class="kr-input-sm"
            />
          </label>
          <label class="flex flex-col gap-1 text-xs"
            >Guidance
            <input
              v-model.number="lane.cfg"
              type="number"
              min="1"
              max="20"
              step="0.5"
              placeholder="profile"
              class="kr-input-sm"
            />
          </label>
          <label class="flex flex-col gap-1 text-xs"
            >Sampler
            <select v-model="lane.sampler" class="kr-select-sm">
              <option :value="null">Profile</option>
              <option v-for="name in samplers" :key="name" :value="name">
                {{ name }}
              </option>
            </select>
          </label>
        </div>
      </div>

      <div
        class="flex flex-col gap-2 rounded-xl border border-dashed border-base-300 p-2"
      >
        <p class="text-xs font-semibold">Add a checkpoint lane</p>
        <select
          v-model="newLane.path"
          class="kr-select-sm"
          aria-label="Known checkpoint"
          @focus="studio.loadCheckpointOptions()"
        >
          <option value="">Pick a known checkpoint…</option>
          <option
            v-for="option in studio.checkpointOptions"
            :key="option.path"
            :value="option.path"
          >
            {{ option.familyLabel }} · {{ option.path }}
          </option>
        </select>
        <input
          v-model="newLane.path"
          class="kr-input-sm"
          placeholder="or type a path, e.g. Illustrious/novaFurryXL_v180B.safetensors"
          aria-label="Checkpoint path"
        />
        <input
          v-model="newLane.label"
          class="kr-input-sm"
          placeholder="Lane label (optional)"
          aria-label="New lane label"
        />
        <p v-if="newLaneProblem" class="text-xs text-error">
          {{ newLaneProblem }}
        </p>
        <button
          type="button"
          class="kr-btn btn-outline btn-sm self-start"
          :disabled="!newLane.path.trim() || Boolean(newLaneProblem)"
          @click="addLane"
        >
          <icon name="kind-icon:plus" class="kr-icon-4" />
          Add lane
        </button>
      </div>
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
import {
  COMIC_LANE_SAMPLERS,
  comicCheckpointProblem,
  type ComicLane,
} from '~/utils/comicLanes'

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

const samplers = COMIC_LANE_SAMPLERS
const newLane = reactive({ path: '', label: '' })

function laneSignature(list: ComicLane[]) {
  return JSON.stringify(
    list.map((lane) => ({
      ...lane,
      steps: lane.steps || null,
      cfg: lane.cfg || null,
      sampler: lane.sampler || null,
    })),
  )
}
const lanesChanged = computed(
  () =>
    laneSignature(lanes.value) !== laneSignature(studio.series?.lanes ?? []),
)

const newLaneProblem = computed(() => {
  const path = newLane.path.trim()
  if (!path) return null
  if (!/\.(safetensors|ckpt)$/i.test(path))
    return 'Use the checkpoint path under models/checkpoints, ending in .safetensors.'
  if (lanes.value.some((lane) => lane.checkpoint === path))
    return 'That checkpoint already has a lane.'
  return comicCheckpointProblem(path)
})

function makePrimary(index: number) {
  lanes.value = lanes.value.map((lane, position) => ({
    ...lane,
    primary: position === index,
  }))
}

function removeLane(index: number) {
  lanes.value = lanes.value.filter((_, position) => position !== index)
}

function laneKeyFor(path: string) {
  const base =
    (path.split('/').pop() ?? path)
      .replace(/\.(safetensors|ckpt)$/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'lane'
  let key = base
  let suffix = 2
  while (lanes.value.some((lane) => lane.key === key))
    key = `${base}-${suffix++}`
  return key
}

function addLane() {
  const path = newLane.path.trim()
  if (!path || newLaneProblem.value) return
  const house = lanes.value.find(
    (lane) => lane.primary && lane.engine === 'comfy',
  )
  lanes.value = [
    ...lanes.value,
    {
      key: laneKeyFor(path),
      label:
        newLane.label.trim() ||
        (path.split('/').pop() ?? path).replace(/\.(safetensors|ckpt)$/i, ''),
      engine: 'comfy',
      checkpoint: path,
      promptStyle: 'tags',
      prefix: house?.prefix ?? null,
      suffix: house?.suffix ?? null,
      steps: null,
      cfg: null,
      sampler: null,
      primary: false,
      active: true,
    },
  ]
  newLane.path = ''
  newLane.label = ''
}
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
