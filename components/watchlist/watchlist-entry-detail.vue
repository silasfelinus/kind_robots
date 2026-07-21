<!-- /components/watchlist/watchlist-entry-detail.vue -->
<!--
  Entry Detail panel for the Media Watchlist browse view (media-watchlist/t-010,
  BROWSE-UX.md §3/§5). Renders the selected entry's header, a private markdown
  review editor with auto-save draft + explicit Publish action, and any external
  links. Talks to PATCH /api/media-entries/:id. Admin-gated by the parent
  (watchlist-browse.vue) -- this component assumes it's only ever mounted for
  an admin viewer.
-->
<template>
  <section
    class="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :disabled="isSavingStar"
          @click="toggleStarred"
        >
          <Icon
            name="kind-icon:star"
            class="size-4"
            :class="entry.starred ? 'text-warning' : 'text-base-content/25'"
          />
        </button>
        <h2 class="truncate text-lg font-black text-base-content">
          {{ entry.title }}
        </h2>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <span class="badge badge-ghost badge-sm rounded-lg">{{
          entry.mediaType
        }}</span>
        <slot name="close" />
      </div>
    </div>

    <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-base-content/70">
      <div>
        <dt class="text-xs font-semibold uppercase text-base-content/45">
          Consumed
        </dt>
        <dd>{{ consumedLabel }}</dd>
      </div>
      <div v-if="entry.year">
        <dt class="text-xs font-semibold uppercase text-base-content/45">
          Year
        </dt>
        <dd>{{ entry.year }}</dd>
      </div>
      <div class="col-span-2">
        <dt class="text-xs font-semibold uppercase text-base-content/45">
          Rating
        </dt>
        <dd class="mt-0.5 flex items-center gap-1.5">
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-lg px-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :disabled="isSavingRating || (entry.rating ?? 0) <= 1"
            aria-label="Lower rating"
            @click="stepRating(-1)"
          >
            <Icon name="kind-icon:minus" class="size-3" />
          </button>
          <span
            class="min-w-[3.5rem] text-center text-sm font-semibold text-base-content"
          >
            {{ entry.rating ? `${entry.rating} / 10` : 'Unrated' }}
          </span>
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-lg px-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :disabled="isSavingRating || (entry.rating ?? 0) >= 10"
            aria-label="Raise rating"
            @click="stepRating(1)"
          >
            <Icon name="kind-icon:plus" class="size-3" />
          </button>
          <button
            v-if="entry.rating"
            type="button"
            class="btn btn-ghost btn-xs rounded-lg px-1.5 text-base-content/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :disabled="isSavingRating"
            aria-label="Clear rating"
            @click="clearRating"
          >
            <Icon name="kind-icon:close" class="size-3" />
          </button>
        </dd>
      </div>
    </dl>

    <!-- Review editor -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h3
          class="text-xs font-black uppercase tracking-wide text-base-content/60"
        >
          Review
        </h3>
        <span
          v-if="entry.reviewPublic"
          class="badge badge-success badge-sm gap-1 rounded-lg"
        >
          <Icon name="kind-icon:check" class="size-3" />
          Published
        </span>
        <span
          v-else-if="saveState !== 'idle'"
          class="text-xs text-base-content/45"
        >
          {{ saveStateLabel }}
        </span>
      </div>

      <textarea
        v-model="draft"
        rows="6"
        maxlength="4000"
        placeholder="Private notes — markdown supported. Auto-saves as you type."
        class="textarea textarea-bordered w-full rounded-2xl text-sm"
        @input="scheduleAutoSave"
      />

      <div class="flex items-center justify-between">
        <span class="text-xs text-base-content/40"
          >{{ draft.length }} / 4000</span
        >
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :disabled="saveState === 'saving' || draft === entry.review"
            @click="saveDraft"
          >
            Save now
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :disabled="entry.reviewPublic || isPublishing || !draft.trim()"
            @click="publish"
          >
            <span
              v-if="isPublishing"
              class="loading loading-spinner loading-xs"
            />
            {{ entry.reviewPublic ? 'Published' : 'Publish' }}
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="text-xs text-error">{{ errorMessage }}</p>
    </div>

    <!-- External links -->
    <div v-if="entry.externalUrl" class="flex flex-col gap-1">
      <h3
        class="text-xs font-black uppercase tracking-wide text-base-content/60"
      >
        External links
      </h3>
      <a
        :href="entry.externalUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="link link-primary text-sm"
      >
        {{ entry.externalId || entry.externalUrl }}
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import type { MediaType } from '~/prisma/generated/prisma/client'

export type MediaEntryDetail = {
  id: number
  title: string
  mediaType: MediaType
  starred: boolean
  year: number | null
  watchedMonth: number | null
  watchedDay: number | null
  dateRaw: string | null
  review: string | null
  reviewPublic: boolean
  rating: number | null
  externalId: string | null
  externalUrl: string | null
}

type MediaEntryPatchResponse = {
  success: boolean
  data: MediaEntryDetail
}

const props = defineProps<{ entry: MediaEntryDetail }>()
const emit = defineEmits<{ (e: 'updated', entry: MediaEntryDetail): void }>()

const draft = ref(props.entry.review ?? '')
const saveState = ref<'idle' | 'saving' | 'saved'>('idle')
const isPublishing = ref(false)
const isSavingStar = ref(false)
const isSavingRating = ref(false)
const errorMessage = ref('')

// Reset local draft state whenever a different entry is selected.
watch(
  () => props.entry.id,
  () => {
    draft.value = props.entry.review ?? ''
    saveState.value = 'idle'
    errorMessage.value = ''
  },
)

const saveStateLabel = computed(() => {
  if (saveState.value === 'saving') return 'Saving…'
  if (saveState.value === 'saved') return 'Saved'
  return ''
})

const consumedLabel = computed(() => {
  if (!props.entry.watchedMonth) return 'Date unknown'
  const month = new Date(2000, props.entry.watchedMonth - 1, 1).toLocaleString(
    'en-US',
    { month: 'long' },
  )
  return props.entry.watchedDay ? `${month} ${props.entry.watchedDay}` : month
})

let autoSaveTimer: ReturnType<typeof setTimeout> | undefined

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    void saveDraft()
  }, 1200)
}

async function patch(
  body: Record<string, unknown>,
): Promise<MediaEntryDetail | null> {
  errorMessage.value = ''
  try {
    const res = await $fetch<MediaEntryPatchResponse>(
      `/api/media-entries/${props.entry.id}`,
      { method: 'PATCH', body },
    )
    if (!res?.success) throw new Error('Update failed.')
    emit('updated', res.data)
    return res.data
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to save.'
    return null
  }
}

async function saveDraft() {
  if (draft.value === (props.entry.review ?? '')) return
  saveState.value = 'saving'
  const result = await patch({ review: draft.value })
  saveState.value = result ? 'saved' : 'idle'
}

async function publish() {
  if (!draft.value.trim()) return
  isPublishing.value = true
  // Save the latest draft text in the same request that flips the flag, so
  // publishing never ships a stale review a debounce cycle behind.
  await patch({ review: draft.value, publish: true })
  isPublishing.value = false
}

async function toggleStarred() {
  isSavingStar.value = true
  await patch({ starred: !props.entry.starred })
  isSavingStar.value = false
}

async function stepRating(delta: 1 | -1) {
  const next = Math.min(10, Math.max(1, (props.entry.rating ?? 0) + delta))
  isSavingRating.value = true
  await patch({ rating: next })
  isSavingRating.value = false
}

async function clearRating() {
  isSavingRating.value = true
  await patch({ rating: null })
  isSavingRating.value = false
}

onBeforeUnmount(() => {
  clearTimeout(autoSaveTimer)
})
</script>
