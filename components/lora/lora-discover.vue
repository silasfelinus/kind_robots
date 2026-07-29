<!-- /components/lora/lora-discover.vue -->
<!--
  Discover — browse Civitai for new LoRAs and queue downloads into the library.
  Search hits /api/lora/browse (server-side proxy; owned rows flagged), each
  card can be one-click downloaded via /api/lora/download-request, which the
  home import agent claims → fetches → catalogs. Maturity follows the account
  opt-in; "hide owned" filters rows you already have.
-->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3">
    <header class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3">
      <div class="min-w-0">
        <h2 class="truncate text-lg font-bold text-base-content">
          Discover LoRAs
        </h2>
        <p class="text-sm text-base-content/60">
          Search Civitai and download straight into your library.
        </p>
      </div>

      <form
        class="grid gap-2 md:grid-cols-[auto_1fr_auto_auto]"
        @submit.prevent="runSearch(true)"
      >
        <select v-model="source" class="select select-bordered rounded-xl">
          <option value="civitai">Civitai</option>
          <option value="civarchive">CivArchive</option>
        </select>

        <input
          v-model="query"
          class="input input-bordered rounded-xl"
          :placeholder="
            source === 'civarchive'
              ? 'CivArchive model id or URL (recovers removed models)'
              : 'Search Civitai LoRAs'
          "
        />

        <select
          v-if="source === 'civitai'"
          v-model="baseModel"
          class="select select-bordered rounded-xl"
        >
          <option value="">All bases</option>
          <option value="Flux.1 D">Flux</option>
          <option value="SDXL 1.0">SDXL</option>
          <option value="Pony">Pony</option>
          <option value="SD 1.5">SD 1.5</option>
          <option value="Illustrious">Illustrious</option>
        </select>

        <button class="btn btn-primary rounded-xl" type="submit" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-sm" />
          <Icon v-else name="kind-icon:search" class="h-4 w-4" />
          {{ source === 'civarchive' ? 'Look up' : 'Search' }}
        </button>
      </form>

      <div class="flex flex-wrap items-center gap-4">
        <label
          v-if="canShowMature"
          class="label cursor-pointer justify-start gap-2 p-0"
        >
          <input
            v-model="includeMature"
            type="checkbox"
            class="toggle toggle-warning toggle-sm"
          />
          <span class="label-text text-sm">Include mature</span>
        </label>

        <label class="label cursor-pointer justify-start gap-2 p-0">
          <input
            v-model="hideOwned"
            type="checkbox"
            class="toggle toggle-sm"
          />
          <span class="label-text text-sm">Hide owned</span>
        </label>
      </div>
    </header>

    <div v-if="error" class="kr-note kr-note-error">
      {{ error }}
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      <article
        v-for="card in visibleCards"
        :key="card.civitaiModelVersionId"
        class="flex flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
      >
        <div class="relative h-40 w-full overflow-hidden bg-base-300">
          <img
            v-if="card.previewImageUrl"
            :src="card.previewImageUrl"
            :alt="card.name"
            class="h-full w-full object-cover"
            loading="lazy"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-base-content/40"
          >
            <Icon name="kind-icon:image" class="h-10 w-10" />
          </div>

          <div class="absolute left-2 top-2 flex flex-wrap gap-1">
            <span v-if="card.baseModel" class="badge badge-secondary badge-sm">
              {{ card.baseModel }}
            </span>
            <span v-if="card.isMature" class="badge badge-warning badge-sm">
              Mature
            </span>
          </div>

          <span
            v-if="card.owned"
            class="absolute right-2 top-2 badge badge-success badge-sm"
          >
            Owned
          </span>
        </div>

        <div class="flex flex-1 flex-col gap-2 p-3 text-center">
          <h3 class="line-clamp-2 text-sm font-black" :title="card.name">
            {{ card.name }}
          </h3>
          <p v-if="card.creator" class="text-xs text-base-content/50">
            by {{ card.creator }}
          </p>

          <button
            class="btn btn-sm mt-auto rounded-xl"
            :class="downloadButtonClass(card)"
            type="button"
            :disabled="!canQueue(card) || queuing === card.civitaiModelVersionId"
            @click="queueDownload(card)"
          >
            <span
              v-if="queuing === card.civitaiModelVersionId"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else :name="downloadButtonIcon(card)" class="h-4 w-4" />
            {{ downloadButtonLabel(card) }}
          </button>
        </div>
      </article>
    </div>

    <div
      v-if="!loading && !visibleCards.length"
      class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center"
    >
      <p class="font-bold">No results.</p>
      <p class="text-sm text-base-content/60">
        Try a different search or base model.
      </p>
    </div>

    <footer v-if="nextCursor" class="flex shrink-0 justify-center pt-1">
      <button
        class="btn btn-sm rounded-xl"
        type="button"
        :disabled="loading"
        @click="runSearch(false)"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm" />
        Load more
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'

type DiscoverCard = {
  civitaiModelId: number
  civitaiModelVersionId: number
  name: string
  baseModel: string
  previewImageUrl: string | null
  downloadUrl: string | null
  fileName: string | null
  creator: string | null
  isMature: boolean
  source: 'CIVITAI' | 'CIVARCHIVE'
  owned: boolean
  updatable: boolean
}

type BrowseResponse = {
  items: DiscoverCard[]
  nextCursor: string | null
}

const userStore = useUserStore()

const query = ref('')
const source = ref<'civitai' | 'civarchive'>('civitai')
const baseModel = ref('')
const includeMature = ref(false)
const hideOwned = ref(false)

const cards = ref<DiscoverCard[]>([])
const nextCursor = ref<string | null>(null)
const loading = ref(false)
const error = ref('')
const queuing = ref<number | null>(null)
const queuedIds = ref<Set<number>>(new Set())

const canShowMature = computed(() => userStore.showMature)

const visibleCards = computed(() => {
  if (!hideOwned.value) return cards.value
  return cards.value.filter((card) => !card.owned && !isQueued(card))
})

function isQueued(card: DiscoverCard): boolean {
  return queuedIds.value.has(card.civitaiModelVersionId)
}

// Civitai cards are always downloadable (the agent builds the by-version URL);
// CivArchive cards need an explicit downloadUrl from the archive.
function isDownloadable(card: DiscoverCard): boolean {
  return card.source === 'CIVITAI' || Boolean(card.downloadUrl)
}

function canQueue(card: DiscoverCard): boolean {
  return !card.owned && !isQueued(card) && isDownloadable(card)
}

function downloadButtonClass(card: DiscoverCard): string {
  if (card.owned) return 'btn-ghost'
  if (isQueued(card)) return 'btn-success btn-outline'
  if (card.updatable) return 'btn-warning'
  if (!isDownloadable(card)) return 'btn-ghost'
  return 'btn-primary'
}

function downloadButtonIcon(card: DiscoverCard): string {
  if (card.owned || isQueued(card)) return 'kind-icon:check'
  if (card.updatable) return 'kind-icon:refresh-cw'
  return 'kind-icon:download'
}

function downloadButtonLabel(card: DiscoverCard): string {
  if (card.owned) return 'Owned'
  if (isQueued(card)) return 'Queued'
  if (!isDownloadable(card)) return 'No link'
  if (card.updatable) return 'Update'
  return 'Download'
}

async function runSearch(reset: boolean) {
  if (loading.value) return

  loading.value = true
  error.value = ''

  if (reset) {
    cards.value = []
    nextCursor.value = null
  }

  try {
    const params = new URLSearchParams()
    params.set('source', source.value)
    if (query.value.trim()) params.set('q', query.value.trim())
    if (source.value === 'civitai') {
      if (baseModel.value) params.set('baseModel', baseModel.value)
      if (includeMature.value && canShowMature.value) params.set('nsfw', 'true')
      if (!reset && nextCursor.value) params.set('cursor', nextCursor.value)
    }

    const res = await performFetch<BrowseResponse>(
      `/api/lora/browse?${params.toString()}`,
    )

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Search failed.')
    }

    cards.value = reset ? res.data.items : [...cards.value, ...res.data.items]
    nextCursor.value = res.data.nextCursor
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Search failed.'
  } finally {
    loading.value = false
  }
}

async function queueDownload(card: DiscoverCard) {
  if (card.owned || isQueued(card) || queuing.value) return

  queuing.value = card.civitaiModelVersionId

  try {
    const res = await performFetch<{ alreadyOwned?: boolean }>(
      '/api/lora/download-request',
      {
        method: 'POST',
        body: JSON.stringify({
          source: card.source,
          civitaiModelId: card.civitaiModelId,
          civitaiModelVersionId: card.civitaiModelVersionId,
          downloadUrl: card.downloadUrl,
          fileName: card.fileName,
          label: card.name,
          isMature: card.isMature,
        }),
      },
    )

    if (!res.success) {
      throw new Error(res.message || 'Could not queue the download.')
    }

    // Mark queued (or owned) so the button reflects state immediately.
    queuedIds.value = new Set(queuedIds.value).add(card.civitaiModelVersionId)
    if (res.data?.alreadyOwned) card.owned = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not queue the download.'
  } finally {
    queuing.value = null
  }
}
</script>
