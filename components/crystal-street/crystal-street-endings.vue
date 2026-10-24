<template>
  <section
    class="kr-panes grid-cols-1 grid-rows-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-3 @3xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] @3xl:grid-rows-1"
    aria-label="Endings"
  >
    <div class="kr-pane cs-frame">
      <div class="kr-toolbar px-3 pt-3">
        <h2 class="cs-display text-xl">Endings</h2>
        <span class="cs-pill cs-pill-good ml-auto"
          >{{ store.scrapbook.endings.length }}/{{ VILLAINS.length * 4 }}</span
        >
      </div>
      <div class="kr-pane-scroll p-3">
        <crystal-street-villain-list
          v-model="selected"
          label="Choose a nightmare"
        />
      </div>
    </div>

    <div class="kr-pane cs-frame" data-testid="cs-endings-reel">
      <div class="kr-toolbar px-3 pt-3">
        <h3 class="cs-display truncate text-lg">
          {{ met && villain ? villain.name : '???' }}
        </h3>
        <span class="ml-auto text-xs opacity-75">{{ foundCount }}/4 found</span>
      </div>
      <div class="kr-pane-scroll space-y-3 p-3">
        <figure
          v-if="villain && met"
          class="cs-polaroid mx-auto w-full max-w-56"
          data-testid="cs-ending-photo"
        >
          <crystal-street-art
            frame="aspect-[3/4]"
            kind="ending"
            :seed="`${villain.id}:photo`"
            :src="`/crystal-street/villains/${villain.id}-ending.webp`"
            :palette="villain.palette"
            :sigil="villain.sigil"
            :alt="villain.endingPhoto"
          />
          <figcaption class="mt-1 text-center text-xs font-semibold">
            {{ villain.name }}, the last photo
          </figcaption>
        </figure>
        <ul class="grid grid-cols-1 gap-3 @xl:grid-cols-2">
          <li
            v-for="tier in ENDING_TIERS"
            :key="tier"
            class="cs-card overflow-hidden"
          >
            <crystal-street-art
              v-if="villain && found(tier)"
              frame="aspect-[16/9]"
              kind="ending"
              :seed="`${villain.id}:${tier}`"
              :src="`/crystal-street/endings/${villain.id}-${tier}.webp`"
              :palette="villain.palette"
              :sigil="villain.sigil"
              :alt="villain.endings[tier].art"
            >
              <span
                class="cs-stamp absolute left-2 top-2"
                :class="`cs-stamp-${tier}`"
                >{{ TIER_LABELS[tier] }}</span
              >
            </crystal-street-art>
            <div
              v-else
              class="grid aspect-[16/9] place-items-center bg-black/60 p-3 text-center text-white"
            >
              <span>
                <span
                  class="cs-stamp inline-block"
                  :class="`cs-stamp-${tier}`"
                  >{{ TIER_LABELS[tier] }}</span
                >
                <span class="mt-2 block text-xs opacity-80">Not found yet</span>
              </span>
            </div>
            <div class="space-y-1 p-3">
              <template v-if="villain && found(tier)">
                <p class="font-semibold leading-tight">
                  {{ villain.endings[tier].title }}
                </p>
                <p class="text-sm leading-relaxed">
                  {{ villain.endings[tier].text }}
                </p>
              </template>
              <p v-else class="text-sm opacity-80">
                {{ TIER_HOW[tier] }}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import {
  ENDING_TIERS,
  TIER_HOW,
  TIER_LABELS,
  VILLAINS,
  endingKey,
  villainById,
} from '~/utils/crystalStreet/rules'
import type { EndingTier } from '~/utils/crystalStreet/types'

const props = defineProps<{ initial?: string }>()

const store = useCrystalStreetStore()
const selected = ref(
  props.initial ??
    VILLAINS.find((v) => store.metVillains.has(v.id))?.id ??
    VILLAINS[0]!.id,
)
const villain = computed(() => villainById(selected.value))
const met = computed(() => store.metVillains.has(selected.value))
const found = (tier: EndingTier) =>
  store.scrapbook.endings.includes(endingKey(selected.value, tier))
const foundCount = computed(() => ENDING_TIERS.filter(found).length)
</script>
