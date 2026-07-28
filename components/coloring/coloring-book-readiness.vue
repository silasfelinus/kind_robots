<template>
  <section class="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <header class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <icon name="kind-icon:check" class="size-6 text-success" />
          <h3 class="text-2xl font-black">Book readiness</h3>
        </div>
        <p class="mt-1 max-w-3xl text-sm text-base-content/55">
          Every interior page gets one explicit next action. Covers remain separate
          production blockers until they have their own canonical workflow.
        </p>
      </div>
      <span class="badge badge-outline rounded-2xl">
        {{ totalFinalPairs }}/{{ totalInteriors }} final interior pairs
      </span>
    </header>

    <div class="grid gap-3 lg:grid-cols-3">
      <button
        v-for="item in bookSummaries"
        :key="item.book.slug"
        type="button"
        class="rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        :class="
          studio.selectedBookSlug === item.book.slug
            ? 'border-primary bg-primary/10'
            : 'border-base-300 bg-base-100'
        "
        @click="studio.selectBook(item.book.slug)"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-widest text-base-content/40">
              Book {{ item.book.order }}
            </p>
            <h4 class="text-xl font-black">{{ item.book.title }}</h4>
          </div>
          <span
            class="badge rounded-2xl"
            :class="item.summary.printReady ? 'badge-success' : 'badge-warning'"
          >
            {{ item.summary.printReady ? 'Print ready' : 'In production' }}
          </span>
        </div>

        <progress
          class="progress progress-primary my-3 w-full"
          :value="item.summary.final"
          :max="item.summary.total || 1"
        />

        <div class="grid grid-cols-4 gap-2 text-center text-xs">
          <div class="rounded-2xl bg-base-200 p-2">
            <p class="font-black">{{ item.summary.final }}</p>
            <p class="text-base-content/45">Final</p>
          </div>
          <div class="rounded-2xl bg-base-200 p-2">
            <p class="font-black">{{ item.summary.finalize }}</p>
            <p class="text-base-content/45">Finalize</p>
          </div>
          <div class="rounded-2xl bg-base-200 p-2">
            <p class="font-black">
              {{ item.summary.acceptColor + item.summary.acceptBw }}
            </p>
            <p class="text-base-content/45">Accept</p>
          </div>
          <div class="rounded-2xl bg-base-200 p-2">
            <p class="font-black text-error">{{ item.summary.blocked }}</p>
            <p class="text-base-content/45">Blocked</p>
          </div>
        </div>

        <div class="mt-3 flex items-center gap-2 text-xs font-semibold text-warning">
          <icon name="kind-icon:book" class="size-4" />
          Cover workflow not managed yet
        </div>
      </button>
    </div>

    <div v-if="selectedBook && selectedSummary" class="flex flex-col gap-4">
      <div
        class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200/40 p-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h4 class="text-xl font-black">{{ selectedBook.title }} interiors</h4>
          <p class="text-sm text-base-content/50">
            {{ selectedSummary.actionable }} pages still need an action;
            {{ selectedSummary.final }} are finalized.
          </p>
        </div>
        <select
          v-model="filter"
          class="select select-bordered rounded-2xl"
          aria-label="Filter coloring-book readiness"
        >
          <option value="actionable">Actionable pages</option>
          <option value="blocked">Blocked only</option>
          <option value="accept">Waiting for acceptance</option>
          <option value="generate">Waiting for generation</option>
          <option value="finalize">Ready to finalize</option>
          <option value="final">Final pages</option>
          <option value="all">All pages</option>
        </select>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="entry in filteredEntries"
          :key="entry.proposal.id"
          type="button"
          class="flex flex-col gap-3 rounded-3xl border border-base-300 bg-base-100 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
          @click="openProposal(entry.proposal.id)"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-widest text-base-content/40">
                Slot {{ entry.proposal.slot }} · {{ entry.proposal.id }}
              </p>
              <h5 class="font-black">{{ entry.proposal.title }}</h5>
            </div>
            <span class="badge badge-sm rounded-2xl" :class="readinessTone(entry.readiness.key)">
              {{ entry.readiness.label }}
            </span>
          </div>

          <p class="line-clamp-3 text-xs leading-relaxed text-base-content/55">
            {{ entry.readiness.detail }}
          </p>

          <div class="mt-auto flex items-center justify-between gap-2 text-xs">
            <span class="text-base-content/40">
              {{ entry.proposal.accepted.color ? 'Color accepted' : 'Color pending' }} ·
              {{ entry.proposal.accepted.bw ? 'B&W accepted' : 'B&W pending' }}
            </span>
            <span class="font-black text-primary">Open →</span>
          </div>
        </button>
      </div>

      <div
        v-if="!filteredEntries.length"
        class="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-5 text-center text-sm text-base-content/50"
      >
        No pages match this readiness filter.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { ColoringBookProposal } from '~/types/coloringBookStudio'
import {
  proposalReadiness,
  readinessTone,
  summarizeBookReadiness,
  type ColoringBookProposalReadiness,
} from '@/utils/coloringBookReadiness'
import { useColoringBookStudioStore } from '@/stores/coloringBookStudioStore'

type ReadinessFilter =
  | 'actionable'
  | 'blocked'
  | 'accept'
  | 'generate'
  | 'finalize'
  | 'final'
  | 'all'

type ReadinessEntry = {
  proposal: ColoringBookProposal
  readiness: ColoringBookProposalReadiness
}

const studio = useColoringBookStudioStore()
const filter = ref<ReadinessFilter>('actionable')

const bookSummaries = computed(() =>
  studio.books.map((book) => ({
    book,
    summary: summarizeBookReadiness(book, studio.productionStates),
  })),
)

const selectedBook = computed(() => studio.selectedBook)
const selectedSummary = computed(() => {
  const book = selectedBook.value
  return book ? summarizeBookReadiness(book, studio.productionStates) : null
})

const totalInteriors = computed(() =>
  bookSummaries.value.reduce((total, item) => total + item.summary.total, 0),
)

const totalFinalPairs = computed(() =>
  bookSummaries.value.reduce((total, item) => total + item.summary.final, 0),
)

const selectedEntries = computed<ReadinessEntry[]>(() => {
  const book = selectedBook.value
  if (!book) return []
  return book.proposals.map((proposal) => ({
    proposal,
    readiness: proposalReadiness(
      book.slug,
      proposal,
      studio.productionStates[`${book.slug}:${proposal.id}`] ?? null,
    ),
  }))
})

const filteredEntries = computed(() =>
  selectedEntries.value.filter((entry) => {
    const key = entry.readiness.key
    if (filter.value === 'all') return true
    if (filter.value === 'actionable') return entry.readiness.actionable
    if (filter.value === 'blocked') return key === 'blocked' || key === 'needs-prompt'
    if (filter.value === 'accept') return key === 'accept-color' || key === 'accept-bw'
    if (filter.value === 'generate') return key === 'needs-color' || key === 'needs-bw'
    return key === filter.value
  }),
)

watch(
  () => studio.selectedBookSlug,
  () => {
    filter.value = 'actionable'
  },
)

async function openProposal(proposalId: string): Promise<void> {
  studio.selectProposal(proposalId)
  await nextTick()
  document.getElementById('coloring-production-actions')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}
</script>
