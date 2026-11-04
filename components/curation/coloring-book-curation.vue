<template>
  <section class="@container space-y-4">
    <div class="kr-panel flex flex-wrap items-end gap-3 p-4">
      <label class="kr-form-field min-w-60">
        <span class="kr-text-dim-xs-55 font-bold">Book</span>
        <select
          :value="store.selectedBookSlug"
          class="kr-select-sm"
          @change="store.selectBook(eventValue($event))"
        >
          <option
            v-for="book in store.books"
            :key="book.slug"
            :value="book.slug"
          >
            {{ book.title }} · {{ book.counts.acceptedColor }}/{{
              book.counts.total
            }}
            color accepted
          </option>
        </select>
      </label>

      <label class="kr-form-field min-w-56 flex-1">
        <span class="kr-text-dim-xs-55 font-bold">Find a page</span>
        <input
          v-model="search"
          type="search"
          class="kr-input-sm"
          placeholder="title, prompt, notes..."
        />
      </label>

      <label
        class="kr-text-bold-sm flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 px-3 py-2"
      >
        <input
          v-model="hideFinal"
          type="checkbox"
          class="checkbox checkbox-sm"
        />
        Hide final pairs
      </label>

      <button
        class="kr-btn"
        type="button"
        :disabled="store.loading"
        @click="refresh"
      >
        <span v-if="store.loading" class="kr-spinner-xs" />
        Refresh
      </button>
    </div>

    <div
      v-if="notice || error"
      class="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      <div
        v-if="notice"
        class="alert border border-info/25 bg-base-100 py-2 text-sm shadow-lg"
      >
        <span>{{ notice }}</span>
        <button
          class="kr-btn-ghost-xs-plain"
          type="button"
          @click="notice = ''"
        >
          Dismiss
        </button>
      </div>
      <div
        v-if="error"
        class="alert border border-error/40 bg-base-100 py-2 text-sm shadow-lg"
      >
        <span>{{ error }}</span>
        <button class="kr-btn-ghost-xs-plain" type="button" @click="error = ''">
          Dismiss
        </button>
      </div>
    </div>

    <div
      v-if="store.loading && !store.books.length"
      class="grid min-h-64 place-items-center kr-panel"
    >
      <span class="kr-spinner-lg-primary" />
    </div>

    <div
      v-else-if="!visibleProposals.length"
      class="grid min-h-52 place-items-center kr-panel-flat border-dashed bg-base-100/50 p-8 text-center"
    >
      <p class="font-black">No pages match this view.</p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-4 @3xl:grid-cols-2 @7xl:grid-cols-3"
    >
      <coloring-book-page-card
        v-for="proposal in visibleProposals"
        :key="`${store.selectedBookSlug}:${proposal.id}`"
        :book-slug="store.selectedBookSlug"
        :proposal="proposal"
        :production="productionState(proposal.id)"
        :is-admin="userStore.isAdmin"
        @notice="notice = $event"
        @error="error = $event"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

const visibleProposals = computed<ColoringBookProposal[]>(() => {
  const query = search.value.trim().toLowerCase()
  return (store.selectedBook?.proposals || []).filter((proposal) => {
    if (hideFinal.value && proposal.final.color && proposal.final.bw)
      return false
    if (!query) return true
    return [
      proposal.title,
      proposal.id,
      proposal.prompt,
      proposal.concept?.sourceLineage ?? '',
      proposal.concept?.recast ?? '',
      ...proposal.notes,
    ]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

onMounted(async () => {
  await userStore.initialize()
  await refresh()
  if (userStore.isAdmin) await store.fetchRenderOptions()
})

async function refresh(): Promise<void> {
  error.value = ''
  await store.fetchStudio()
  if (store.error) error.value = store.error
}

function eventValue(event: Event): string {
  return (event.target as HTMLSelectElement).value
}

function productionState(
  proposalId: string,
): ColoringBookProductionState | null {
  return (
    store.productionStates[`${store.selectedBookSlug}:${proposalId}`] ?? null
  )
}
</script>
