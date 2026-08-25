<template>
  <section class="space-y-4">
    <div class="kr-panel flex flex-wrap items-end gap-3 p-4">
      <label class="form-control min-w-60 gap-1">
        <span class="text-xs font-bold text-base-content/55">Book</span>
        <select
          :value="store.selectedBookSlug"
          class="select select-bordered select-sm rounded-xl"
          @change="store.selectBook(eventValue($event))"
        >
          <option v-for="book in store.books" :key="book.slug" :value="book.slug">
            {{ book.title }} · {{ book.counts.acceptedColor }}/{{ book.counts.total }} color accepted
          </option>
        </select>
      </label>

      <label class="form-control min-w-56 flex-1 gap-1">
        <span class="text-xs font-bold text-base-content/55">Find a page</span>
        <input
          v-model="search"
          type="search"
          class="input input-bordered input-sm rounded-xl"
          placeholder="title, prompt, notes..."
        />
      </label>

      <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 px-3 py-2 text-sm font-bold">
        <input v-model="hideFinal" type="checkbox" class="checkbox checkbox-sm" />
        Hide final pairs
      </label>

      <button
        class="btn btn-sm rounded-xl"
        type="button"
        :disabled="store.loading"
        @click="refresh"
      >
        <span v-if="store.loading" class="loading loading-spinner loading-xs" />
        Refresh
      </button>
    </div>

    <div v-if="notice" class="alert border border-info/25 bg-info/10">
      <span>{{ notice }}</span>
      <button class="btn btn-ghost btn-xs" type="button" @click="notice = ''">Dismiss</button>
    </div>
    <div v-if="error" class="alert border border-error/25 bg-error/10">
      <span>{{ error }}</span>
      <button class="btn btn-ghost btn-xs" type="button" @click="error = ''">Dismiss</button>
    </div>

    <div v-if="store.loading && !store.books.length" class="grid min-h-64 place-items-center kr-panel">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div
      v-else-if="!visibleProposals.length"
      class="grid min-h-52 place-items-center rounded-2xl border border-dashed border-base-300 bg-base-100/50 p-8 text-center"
    >
      <p class="font-black">No pages match this view.</p>
    </div>

    <div
      v-else
      class="grid gap-4"
      style="grid-template-columns: repeat(auto-fill, minmax(min(540px, 100%), 1fr))"
    >
      <article
        v-for="proposal in visibleProposals"
        :key="proposal.id"
        class="kr-panel min-w-0 overflow-hidden"
      >
        <div class="relative bg-base-300">
          <div class="grid grid-cols-2 gap-px">
            <figure class="relative min-w-0 bg-base-200">
              <div class="aspect-[17/22] w-full overflow-hidden">
                <img
                  v-if="proposal.colorUrl"
                  :src="proposal.colorUrl"
                  :alt="`${proposal.title} color candidate`"
                  class="size-full object-contain"
                  loading="lazy"
                />
                <div v-else class="grid size-full place-items-center text-base-content/30">
                  <div class="text-center">
                    <Icon name="kind-icon:image" class="mx-auto size-10" />
                    <p class="mt-2 text-xs font-bold">No color candidate</p>
                  </div>
                </div>
              </div>
              <figcaption class="absolute bottom-3 left-3 badge border-0 bg-base-100/90 font-black shadow-sm backdrop-blur">
                Color
              </figcaption>
            </figure>

            <figure class="relative min-w-0 bg-base-200">
              <div class="aspect-[17/22] w-full overflow-hidden">
                <img
                  v-if="bwDisplayUrl(proposal)"
                  :src="bwDisplayUrl(proposal) || ''"
                  :alt="`${proposal.title} black and white candidate`"
                  class="size-full object-contain grayscale"
                  loading="lazy"
                />
                <div v-else class="grid size-full place-items-center text-base-content/30">
                  <div class="text-center">
                    <Icon name="kind-icon:image" class="mx-auto size-10" />
                    <p class="mt-2 text-xs font-bold">No B&amp;W candidate</p>
                  </div>
                </div>
              </div>
              <figcaption class="absolute bottom-3 left-3 badge border-0 bg-base-100/90 font-black shadow-sm backdrop-blur">
                B&amp;W
              </figcaption>
            </figure>
          </div>

          <div class="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <span class="badge border-0 bg-base-100/90 font-black shadow-sm backdrop-blur">
              {{ proposal.id }}
            </span>
            <span class="badge border-0 shadow-sm" :class="stageBadge(proposal)">
              {{ stageLabel(proposal) }}
            </span>
          </div>
        </div>

        <div class="space-y-4 p-4">
          <div>
            <p class="text-[11px] font-black uppercase tracking-wider text-primary">
              Slot {{ proposal.slot }}
            </p>
            <h2 class="mt-1 text-xl font-black leading-tight">{{ proposal.title }}</h2>
            <p v-if="proposal.notes.length" class="mt-2 line-clamp-2 text-xs leading-5 text-base-content/55">
              {{ proposal.notes.join(' · ') }}
            </p>
          </div>

          <div v-if="proposal.inspirations.length" class="flex gap-2 overflow-x-auto pb-1">
            <figure
              v-for="asset in proposal.inspirations"
              :key="`${proposal.id}:${asset.path}`"
              class="w-16 shrink-0"
            >
              <img
                v-if="asset.url"
                :src="asset.url"
                :alt="asset.kind"
                class="aspect-square w-full rounded-lg object-cover"
                loading="lazy"
              />
              <div
                v-else
                class="grid aspect-square w-full place-items-center rounded-lg bg-base-200 text-[10px] text-base-content/35"
              >
                reference
              </div>
            </figure>
          </div>

          <label class="form-control gap-1">
            <span class="text-xs font-black">Pitch / art prompt</span>
            <textarea
              v-model="drafts[proposal.id]"
              class="textarea textarea-bordered min-h-28 rounded-xl text-sm leading-5"
              :readonly="!userStore.isAdmin"
            />
          </label>

          <div v-if="userStore.isAdmin" class="flex flex-wrap gap-2">
            <button
              class="btn btn-primary btn-sm rounded-xl"
              type="button"
              :disabled="store.savingPrompt || !promptChanged(proposal)"
              @click="savePrompt(proposal.id)"
            >
              Save prompt
            </button>
            <button
              class="btn btn-sm rounded-xl"
              type="button"
              :disabled="store.requestingAction"
              @click="render(proposal.id, 'color')"
            >
              New color
            </button>
            <button
              v-if="proposal.accepted.color"
              class="btn btn-sm rounded-xl"
              type="button"
              :disabled="store.requestingAction"
              @click="render(proposal.id, 'bw')"
            >
              New B&amp;W
            </button>
            <button
              v-if="colorCandidatePath(proposal)"
              class="btn btn-success btn-outline btn-sm rounded-xl"
              type="button"
              :disabled="store.requestingAction"
              @click="acceptColor(proposal.id, colorCandidatePath(proposal) || '')"
            >
              Accept color
            </button>
            <button
              v-if="bwCandidatePath(proposal)"
              class="btn btn-success btn-outline btn-sm rounded-xl"
              type="button"
              :disabled="store.requestingAction"
              @click="acceptBw(proposal.id, bwCandidatePath(proposal) || '')"
            >
              Accept B&amp;W
            </button>
            <button
              v-if="proposal.accepted.color && proposal.accepted.bw && !(proposal.final.color && proposal.final.bw)"
              class="btn btn-success btn-sm rounded-xl"
              type="button"
              :disabled="store.requestingAction"
              @click="finalize(proposal.id)"
            >
              Finalize pair
            </button>
          </div>

          <div v-else class="flex items-center gap-2 text-xs text-base-content/45">
            <Icon name="kind-icon:lock" class="size-4" />
            Production edits are admin-only.
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type {
  ColoringBookProductionState,
  ColoringBookProposal,
} from '~/types/coloringBookStudio'
import { useColoringBookStudioStore } from '@/stores/coloringBookStudioStore'
import { useUserStore } from '@/stores/userStore'

const store = useColoringBookStudioStore()
const userStore = useUserStore()
const search = ref('')
const hideFinal = ref(false)
const notice = ref('')
const error = ref('')
const drafts = reactive<Record<string, string>>({})

const visibleProposals = computed<ColoringBookProposal[]>(() => {
  const query = search.value.trim().toLowerCase()
  return (store.selectedBook?.proposals || []).filter((proposal) => {
    if (hideFinal.value && proposal.final.color && proposal.final.bw) return false
    if (!query) return true
    return [proposal.title, proposal.id, proposal.prompt, ...proposal.notes]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

onMounted(async () => {
  await userStore.initialize()
  await refresh()
})

async function refresh(): Promise<void> {
  error.value = ''
  await store.fetchStudio()
  syncDrafts()
  if (store.error) error.value = store.error
}

function syncDrafts(): void {
  for (const book of store.books) {
    for (const proposal of book.proposals) {
      drafts[proposal.id] = proposal.prompt
    }
  }
}

function eventValue(event: Event): string {
  return (event.target as HTMLSelectElement).value
}

function productionState(proposalId: string): ColoringBookProductionState | null {
  return store.productionStates[`${store.selectedBookSlug}:${proposalId}`] ?? null
}

function bwDisplayUrl(proposal: ColoringBookProposal): string | null {
  return productionState(proposal.id)?.bwUrl || proposal.bwUrl
}

function colorCandidatePath(proposal: ColoringBookProposal): string | null {
  if (proposal.accepted.color || proposal.final.color) return null
  return proposal.queue.renderedPath
}

function bwCandidatePath(proposal: ColoringBookProposal): string | null {
  if (proposal.accepted.bw || proposal.final.bw) return null
  return productionState(proposal.id)?.bwRenderedPath ?? null
}

function promptChanged(proposal: ColoringBookProposal): boolean {
  return (drafts[proposal.id] || '').trim() !== proposal.prompt.trim()
}

function stageLabel(proposal: ColoringBookProposal): string {
  if (proposal.final.color && proposal.final.bw) return 'Final pair'
  if (proposal.accepted.color && proposal.accepted.bw) return 'Ready to finalize'
  if (bwCandidatePath(proposal)) return 'Accept B&W'
  if (proposal.accepted.color) return 'Build B&W'
  if (colorCandidatePath(proposal)) return 'Accept color'
  if (proposal.queue.status === 'pending' || proposal.queue.status === 'running') {
    return 'Rendering color'
  }
  if (proposal.queue.status === 'needs_review' || proposal.queue.semanticGateError) {
    return 'Needs review'
  }
  return 'Needs color'
}

function stageBadge(proposal: ColoringBookProposal): string {
  if (proposal.final.color && proposal.final.bw) return 'badge-success'
  if (proposal.accepted.color && proposal.accepted.bw) return 'badge-success'
  if (proposal.queue.status === 'needs_review' || proposal.queue.semanticGateError) {
    return 'badge-warning'
  }
  if (proposal.queue.status === 'pending' || proposal.queue.status === 'running') {
    return 'badge-info'
  }
  return 'badge-neutral'
}

function select(proposalId: string): void {
  store.selectProposal(proposalId)
}

async function savePrompt(proposalId: string): Promise<void> {
  select(proposalId)
  const ok = await store.savePrompt(drafts[proposalId] || '')
  if (ok) {
    notice.value = store.message || 'Prompt saved.'
    syncDrafts()
  } else if (store.error) {
    error.value = store.error
  }
}

async function render(proposalId: string, variant: 'color' | 'bw'): Promise<void> {
  select(proposalId)
  const ok =
    variant === 'color'
      ? await store.requestColorRender(true, 'Requested from Coloring Book curation')
      : await store.requestBw(true, 'Requested from Coloring Book curation')
  if (ok) {
    notice.value = store.message || `${variant} render requested.`
    syncDrafts()
  } else if (store.error) {
    error.value = store.error
  }
}

async function acceptColor(proposalId: string, sourcePath: string): Promise<void> {
  select(proposalId)
  if (await store.acceptColor('Accepted from Coloring Book curation', sourcePath)) {
    notice.value = store.message || 'Color candidate accepted.'
    syncDrafts()
  } else if (store.error) {
    error.value = store.error
  }
}

async function acceptBw(proposalId: string, sourcePath: string): Promise<void> {
  select(proposalId)
  if (await store.acceptBw('Accepted from Coloring Book curation', sourcePath)) {
    notice.value = store.message || 'B&W candidate accepted.'
    syncDrafts()
  } else if (store.error) {
    error.value = store.error
  }
}

async function finalize(proposalId: string): Promise<void> {
  select(proposalId)
  if (await store.finalizePair('Finalized from Coloring Book curation')) {
    notice.value = store.message || 'Pair finalized.'
    syncDrafts()
  } else if (store.error) {
    error.value = store.error
  }
}
</script>
