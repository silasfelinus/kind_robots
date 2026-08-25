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
            {{ book.title }} · {{ book.counts.finalPairs }}/{{ book.counts.total }} final
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

      <button class="btn btn-sm rounded-xl" type="button" :disabled="store.loading" @click="refresh">
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

    <div v-if="store.loading" class="grid min-h-64 place-items-center kr-panel">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div
      v-else-if="!visibleProposals.length"
      class="grid min-h-52 place-items-center rounded-2xl border border-dashed border-base-300 bg-base-100/50 p-8 text-center"
    >
      <p class="font-black">No pages match this view.</p>
    </div>

    <div v-else class="flex flex-wrap items-start gap-4">
      <article
        v-for="proposal in visibleProposals"
        :key="proposal.id"
        class="kr-panel min-w-0 flex-[1_1_28rem] overflow-hidden"
      >
        <div class="border-b border-base-300 bg-base-200/60 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-[11px] font-black uppercase tracking-wider text-primary">Slot {{ proposal.slot }}</p>
              <h2 class="mt-1 text-xl font-black">{{ proposal.title }}</h2>
            </div>
            <span
              class="badge badge-sm"
              :class="proposal.final.color && proposal.final.bw ? 'badge-success' : 'badge-outline'"
            >
              {{ proposal.final.color && proposal.final.bw ? 'final' : proposal.queue.status }}
            </span>
          </div>
          <p v-if="proposal.notes.length" class="mt-2 text-xs leading-5 text-base-content/55">
            {{ proposal.notes.join(' · ') }}
          </p>
        </div>

        <div class="space-y-4 p-4">
          <div class="grid grid-cols-2 gap-2">
            <figure class="overflow-hidden rounded-xl bg-base-200">
              <div class="aspect-square">
                <img
                  v-if="proposal.colorUrl"
                  :src="proposal.colorUrl"
                  :alt="`${proposal.title} color candidate`"
                  class="size-full object-cover"
                />
                <div v-else class="grid size-full place-items-center text-xs text-base-content/35">
                  No color candidate
                </div>
              </div>
              <figcaption class="flex items-center justify-between gap-2 p-2 text-[11px] font-black">
                <span>COLOR</span>
                <span class="opacity-50">{{ proposal.accepted.color ? 'accepted' : 'candidate' }}</span>
              </figcaption>
            </figure>

            <figure class="overflow-hidden rounded-xl bg-base-200">
              <div class="aspect-square">
                <img
                  v-if="proposal.bwUrl"
                  :src="proposal.bwUrl"
                  :alt="`${proposal.title} black and white candidate`"
                  class="size-full object-cover"
                />
                <div v-else class="grid size-full place-items-center text-xs text-base-content/35">
                  No B&amp;W candidate
                </div>
              </div>
              <figcaption class="flex items-center justify-between gap-2 p-2 text-[11px] font-black">
                <span>BLACK + WHITE</span>
                <span class="opacity-50">{{ proposal.accepted.bw ? 'accepted' : 'candidate' }}</span>
              </figcaption>
            </figure>
          </div>

          <div v-if="proposal.inspirations.length" class="flex gap-2 overflow-x-auto pb-1">
            <figure v-for="asset in proposal.inspirations" :key="asset.path" class="w-20 shrink-0">
              <img
                v-if="asset.url"
                :src="asset.url"
                :alt="asset.kind"
                class="aspect-square w-full rounded-lg object-cover"
              />
              <div v-else class="grid aspect-square w-full place-items-center rounded-lg bg-base-200 text-[10px] text-base-content/35">
                reference
              </div>
            </figure>
          </div>

          <label class="form-control gap-1">
            <span class="text-xs font-black">Pitch / art prompt</span>
            <textarea
              v-model="drafts[proposal.id]"
              class="textarea textarea-bordered min-h-32 rounded-xl text-sm leading-5"
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button class="btn btn-primary btn-sm rounded-xl" type="button" :disabled="store.savingPrompt" @click="savePrompt(proposal.id)">
              Save prompt
            </button>
            <button class="btn btn-sm rounded-xl" type="button" :disabled="store.requestingAction" @click="render(proposal.id, 'color')">
              New color
            </button>
            <button class="btn btn-sm rounded-xl" type="button" :disabled="store.requestingAction" @click="render(proposal.id, 'bw')">
              New B&amp;W
            </button>
            <button
              v-if="proposal.colorPath"
              class="btn btn-success btn-outline btn-sm rounded-xl"
              type="button"
              :disabled="store.requestingAction"
              @click="acceptColor(proposal.id, proposal.colorPath)"
            >
              Accept color
            </button>
            <button
              v-if="proposal.bwPath"
              class="btn btn-success btn-outline btn-sm rounded-xl"
              type="button"
              :disabled="store.requestingAction"
              @click="acceptBw(proposal.id, proposal.bwPath)"
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
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { ColoringBookProposal } from '~/types/coloringBookStudio'
import { useColoringBookStudioStore } from '@/stores/coloringBookStudioStore'

const store = useColoringBookStudioStore()
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

onMounted(refresh)

async function refresh() {
  error.value = ''
  await store.fetchStudio()
  for (const book of store.books) {
    for (const proposal of book.proposals) {
      drafts[proposal.id] = proposal.prompt
    }
  }
  if (store.error) error.value = store.error
}

function eventValue(event: Event): string {
  return (event.target as HTMLSelectElement).value
}

function select(proposalId: string) {
  store.selectProposal(proposalId)
}

async function savePrompt(proposalId: string) {
  select(proposalId)
  const ok = await store.savePrompt(drafts[proposalId] || '')
  if (ok) {
    notice.value = store.message || 'Prompt saved.'
    await refresh()
  } else if (store.error) error.value = store.error
}

async function render(proposalId: string, variant: 'color' | 'bw') {
  select(proposalId)
  const ok = variant === 'color'
    ? await store.requestColorRender(true, 'Requested from Curation Studio')
    : await store.requestBw(true, 'Requested from Curation Studio')
  if (ok) notice.value = store.message || `${variant} render requested.`
  else if (store.error) error.value = store.error
}

async function acceptColor(proposalId: string, sourcePath: string) {
  select(proposalId)
  if (await store.acceptColor('Accepted from Curation Studio', sourcePath)) {
    notice.value = store.message || 'Color candidate accepted.'
  } else if (store.error) error.value = store.error
}

async function acceptBw(proposalId: string, sourcePath: string) {
  select(proposalId)
  if (await store.acceptBw('Accepted from Curation Studio', sourcePath)) {
    notice.value = store.message || 'B&W candidate accepted.'
  } else if (store.error) error.value = store.error
}

async function finalize(proposalId: string) {
  select(proposalId)
  if (await store.finalizePair('Finalized from Curation Studio')) {
    notice.value = store.message || 'Pair finalized.'
  } else if (store.error) error.value = store.error
}
</script>
