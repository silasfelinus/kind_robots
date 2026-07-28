<template>
  <section
    v-if="proposal"
    class="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
  >
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <icon name="kind-icon:history" class="size-5 text-secondary" />
          <h3 class="text-xl font-black">Candidate history</h3>
        </div>
        <p class="mt-1 text-sm text-base-content/55">
          Archived revisions and rejected candidates for {{ proposal.id }}. Nothing
          disappears merely because the next attempt has better cheekbones.
        </p>
      </div>
      <div class="join self-start">
        <button
          v-for="option in filters"
          :key="option.value"
          type="button"
          class="btn btn-sm join-item"
          :class="filter === option.value ? 'btn-secondary' : 'btn-ghost'"
          @click="filter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </header>

    <div
      v-if="!filteredHistory.length"
      class="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-5 text-center text-sm text-base-content/50"
    >
      No {{ filter === 'all' ? '' : `${filter} ` }}revision or rejection records yet.
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="item in filteredHistory"
        :key="item.id"
        class="overflow-hidden rounded-3xl border border-base-300 bg-base-100"
      >
        <a
          v-if="item.url"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="block aspect-[2/3] bg-base-200"
        >
          <img
            :src="item.url"
            :alt="`${proposal.title} ${historyLabel(item.kind)}`"
            class="size-full object-contain"
            :class="item.variant === 'bw' ? 'grayscale' : ''"
          />
        </a>
        <div
          v-else
          class="flex aspect-[2/3] items-center justify-center bg-base-200 text-base-content/30"
        >
          <icon name="kind-icon:image-off" class="size-12" />
        </div>

        <div class="flex flex-col gap-3 p-4">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="badge rounded-2xl"
              :class="item.variant === 'color' ? 'badge-primary' : 'badge-secondary'"
            >
              {{ item.variant === 'color' ? 'Color' : 'B&W' }}
            </span>
            <span class="badge badge-outline rounded-2xl">
              {{ historyLabel(item.kind) }}
            </span>
            <span v-if="item.score !== null" class="badge badge-info rounded-2xl">
              Score {{ item.score }}
            </span>
          </div>

          <div>
            <p class="text-sm font-black">
              {{ item.status || item.verdict || historyLabel(item.kind) }}
            </p>
            <p v-if="item.createdAt" class="text-xs text-base-content/45">
              {{ formatDate(item.createdAt) }}
            </p>
          </div>

          <p v-if="item.path" class="break-all text-xs text-base-content/45">
            {{ item.path }}
          </p>

          <div class="flex flex-wrap gap-2 text-xs">
            <span v-if="item.artImageId" class="badge badge-ghost rounded-2xl">
              ArtImage {{ item.artImageId }}
            </span>
            <span v-if="item.seed !== null" class="badge badge-ghost rounded-2xl">
              Seed {{ item.seed }}
            </span>
            <span v-if="item.engine" class="badge badge-ghost rounded-2xl">
              {{ item.engine }}
            </span>
            <span v-if="item.verdict" class="badge badge-ghost rounded-2xl">
              {{ item.verdict }}
            </span>
          </div>

          <ul
            v-if="item.reasons.length"
            class="list-disc space-y-1 pl-5 text-xs text-warning"
          >
            <li v-for="reason in item.reasons" :key="reason">
              {{ reason }}
            </li>
          </ul>

          <a
            v-if="item.url"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline btn-sm mt-auto rounded-2xl"
          >
            <icon name="kind-icon:external-link" class="size-4" />
            Open archived image
          </a>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  ColoringBookHistoryKind,
  ColoringBookVariant,
} from '~/types/coloringBookStudio'
import { useColoringBookStudioStore } from '@/stores/coloringBookStudioStore'

type HistoryFilter = 'all' | ColoringBookVariant

const studio = useColoringBookStudioStore()
const filter = ref<HistoryFilter>('all')

const filters: { label: string; value: HistoryFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Color', value: 'color' },
  { label: 'B&W', value: 'bw' },
]

const proposal = computed(() => studio.selectedProposal)
const production = computed(() => studio.selectedProductionState)
const filteredHistory = computed(() => {
  const history = production.value?.history ?? []
  return filter.value === 'all'
    ? history
    : history.filter((item) => item.variant === filter.value)
})

watch(
  () => `${studio.selectedBookSlug}:${studio.selectedProposalId}`,
  () => {
    filter.value = 'all'
  },
)

function historyLabel(kind: ColoringBookHistoryKind): string {
  if (kind === 'semantic-rejection') return 'Semantic rejection'
  if (kind === 'mechanical-rejection') return 'Mechanical rejection'
  if (kind === 'unverified') return 'Unverified candidate'
  return 'Archived revision'
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
</script>
