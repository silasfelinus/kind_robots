<template>
  <section
    class="@container mt-6 rounded-2xl border border-amber-300/30 bg-slate-950/60 p-3 sm:p-5"
    aria-label="Private production art review"
    data-testid="capes-production-gallery"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-[11px] font-black uppercase tracking-widest text-amber-300">
          Delivered ArtImage receipts / private review
        </p>
        <h3 class="mt-1 text-xl font-black">Three heroes, fourteen production plates</h3>
        <p class="mt-1 max-w-2xl text-xs leading-5 text-slate-300">
          These records have DONE ArtImage IDs in Conductor's Unstable Diffusers ledger.
          Thumbnails only appear after authenticated media retrieval succeeds.
          A source receipt alone never proves an image is attached in the game.
        </p>
      </div>
      <span class="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-300">
        Private · {{ artForSelected.length }} plates
      </span>
    </div>
    <div class="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Production cast">
      <button
        v-for="person in CAPES_PRODUCTION_IDENTITIES"
        :key="person.signature"
        type="button"
        role="tab"
        :aria-selected="selected === person.signature"
        :data-testid="'capes-production-' + person.signature"
        class="rounded-lg border px-3 py-2 text-left text-sm font-bold transition-colors"
        :class="
          selected === person.signature
            ? 'border-amber-300 bg-amber-300/20 text-amber-100'
            : 'border-slate-600 bg-slate-900 text-slate-200 hover:border-amber-300'
        "
        @click="selected = person.signature"
      >
        {{ person.label }}
        <small class="block text-[10px] font-normal">{{ person.subtitle }}</small>
      </button>
    </div>
    <div class="mt-4 grid grid-cols-1 gap-3 @sm:grid-cols-2 @xl:grid-cols-3">
      <figure
        v-for="item in artForSelected"
        :key="item.key"
        class="min-w-0 overflow-hidden rounded-xl border border-slate-600/70 bg-slate-900"
        :class="{ '@sm:col-span-2': item.size === '1536x768' }"
        :data-testid="'capes-production-plate-' + item.key"
      >
        <div
          class="relative grid place-items-center overflow-hidden bg-slate-800/60"
          :class="item.size === '1536x768' ? 'aspect-[2/1]' : 'aspect-[3/4]'"
        >
          <img
            v-if="store.productionImageFor(item.artImageId)"
            :src="store.productionImageFor(item.artImageId)"
            :alt="item.title"
            class="h-full w-full object-contain"
            loading="lazy"
          />
          <div v-else class="p-4 text-center text-xs text-slate-300" role="status">
            <span class="block text-2xl text-amber-300" aria-hidden="true">✦</span>
            Private preview unavailable or loading
            <span class="mt-1 block text-[10px] text-slate-400">
              ArtImage #{{ item.artImageId }} · delivery unverified
            </span>
          </div>
        </div>
        <figcaption class="space-y-1 p-3">
          <strong class="block text-sm">{{ item.title }}</strong>
          <span class="block text-[11px] text-slate-300">
            {{ item.size }} · Job #{{ item.artJobId }} · ArtImage #{{ item.artImageId }}
          </span>
          <code class="block break-all text-[10px] text-amber-100/80">
            {{ item.asset }}
          </code>
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCapesStyleCheckStore } from '~/stores/capesStyleCheckStore'
import {
  CAPES_PRODUCTION_IDENTITIES,
  capesProductionFor,
} from '~/utils/capesProductionArt'

const store = useCapesStyleCheckStore()
const selected = ref<(typeof CAPES_PRODUCTION_IDENTITIES)[number]['signature']>(
  'accident-earth',
)
const artForSelected = computed(() => capesProductionFor(selected.value))
watch(
  selected,
  (signature) => {
    void store.loadProductionImages(signature)
  },
  { immediate: true },
)
</script>
