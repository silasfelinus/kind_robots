<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTarotStudioStore } from '~/stores/tarotStudioStore'
import type { TarotCardRecord } from '~/types/tarotStudio'

const props = defineProps<{ card: TarotCardRecord }>()
const emit = defineEmits<{ revise: [designId: number] }>()

const store = useTarotStudioStore()
const designId = ref<number | null>(null)

const variants = computed(() => store.artForCard(props.card.id))
const usableDesigns = computed(() =>
  store.designs.filter((design) => design.status !== 'ARCHIVED'),
)

watch(
  () => [props.card.id, store.approvedDesign?.id] as const,
  () => {
    designId.value =
      store.approvedDesign?.id ?? usableDesigns.value[0]?.id ?? null
  },
  { immediate: true },
)

function designTitle(id: number | null) {
  return store.designById(id)?.title ?? 'Unknown design'
}
</script>

<template>
  <section class="space-y-2" aria-label="Card art variants">
    <div class="flex flex-wrap items-end gap-2">
      <label class="form-control min-w-0 flex-1 text-xs">
        <span class="mb-1 block font-bold">Render with design</span>
        <select
          v-model="designId"
          class="select select-bordered select-sm w-full"
        >
          <option
            v-for="design in usableDesigns"
            :key="design.id"
            :value="design.id"
          >
            {{ design.title }}{{ design.status === 'APPROVED' ? ' ✓' : '' }}
          </option>
        </select>
      </label>
      <button
        class="btn btn-secondary btn-sm"
        type="button"
        :disabled="store.saving || designId === null"
        @click="designId !== null && emit('revise', designId)"
      >
        Save &amp; submit revision
      </button>
    </div>

    <p v-if="!variants.length" class="text-[11px] opacity-60">
      No art yet. Submit a revision, or generate the full set from the approved
      design.
    </p>
    <div v-else class="grid grid-cols-3 gap-2">
      <figure
        v-for="entry in variants"
        :key="entry.id"
        class="min-w-0 rounded-xl border p-1"
        :class="
          card.selectedArtId === entry.id
            ? 'border-primary bg-primary/10'
            : 'border-base-content/10'
        "
      >
        <img
          v-if="entry.status === 'RENDERED' || entry.status === 'REJECTED'"
          :src="store.artUrl(entry)"
          :alt="`${card.title} variant ${entry.id}`"
          class="aspect-[2/3] w-full rounded-lg object-cover"
          :class="{ 'opacity-40': entry.status === 'REJECTED' }"
          loading="lazy"
        />
        <div
          v-else
          class="grid aspect-[2/3] w-full place-content-center rounded-lg bg-base-300 p-1 text-center text-[10px]"
          :title="entry.error || ''"
        >
          <span v-if="entry.status === 'FAILED'" class="font-bold text-error">
            Failed
          </span>
          <span v-else class="loading loading-dots loading-sm mx-auto" />
          <span class="opacity-60">{{ entry.status }}</span>
        </div>
        <figcaption class="mt-1 space-y-1 text-[10px]">
          <span class="block truncate opacity-70">
            {{ designTitle(entry.designId) }} ·
            {{ entry.purpose.toLowerCase() }}
          </span>
          <span
            v-if="card.selectedArtId === entry.id"
            class="badge badge-primary badge-xs"
          >
            default
          </span>
          <div v-if="entry.status === 'RENDERED'" class="flex flex-wrap gap-1">
            <button
              v-if="card.selectedArtId !== entry.id"
              class="btn btn-ghost btn-xs px-1"
              type="button"
              @click="store.selectArt(card.id, entry.id)"
            >
              Make default
            </button>
            <button
              v-if="
                !(card.selectedArtId === entry.id && card.status === 'APPROVED')
              "
              class="btn btn-success btn-xs px-1"
              type="button"
              @click="store.selectArt(card.id, entry.id, true)"
            >
              Approve
            </button>
            <button
              v-if="card.selectedArtId !== entry.id"
              class="btn btn-ghost btn-xs px-1 text-error"
              type="button"
              @click="store.setArtStatus(entry.id, 'REJECTED')"
            >
              Reject
            </button>
          </div>
          <button
            v-else-if="entry.status === 'REJECTED'"
            class="btn btn-ghost btn-xs px-1"
            type="button"
            @click="store.setArtStatus(entry.id, 'RENDERED')"
          >
            Restore
          </button>
        </figcaption>
      </figure>
    </div>
  </section>
</template>
