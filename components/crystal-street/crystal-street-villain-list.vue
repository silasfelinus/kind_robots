<template>
  <div>
    <p class="mb-2 text-xs opacity-75" aria-live="polite">
      {{ faced.length }}/{{ VILLAINS.length }} nightmares met
    </p>
    <ul
      class="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2 @3xl:grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]"
      :aria-label="label"
    >
      <li v-for="v in faced" :key="v.id">
        <button
          type="button"
          class="cs-card w-full overflow-hidden text-left"
          :class="modelValue === v.id ? 'ring-2 ring-primary' : ''"
          :aria-pressed="modelValue === v.id"
          :data-testid="`cs-villain-${v.id}`"
          @click="$emit('update:modelValue', v.id)"
        >
          <crystal-street-art
            frame="aspect-[4/5]"
            kind="villain"
            :seed="v.id"
            :src="`/crystal-street/villains/${v.id}-portrait.webp`"
            :palette="v.palette"
            :sigil="v.sigil"
            :alt="v.name"
          />
          <span class="block truncate px-1.5 pt-1 cs-label font-semibold">
            {{ v.name }}
          </span>
          <span class="flex gap-0.5 px-1.5 pb-1.5" aria-hidden="true">
            <span
              v-for="tier in ENDING_TIERS"
              :key="tier"
              class="h-1.5 flex-1 rounded-full"
              :class="
                found(v.id, tier) ? `cs-bar-${tier}` : 'bg-base-content/15'
              "
            />
          </span>
        </button>
      </li>
      <li v-for="slot in unfaced" :key="`locked-${slot}`">
        <crystal-street-locked-silhouette kind="nightmare" />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import { discoveryProgress } from '~/utils/crystalStreet/menu'
import { ENDING_TIERS, VILLAINS, endingKey } from '~/utils/crystalStreet/rules'
import type { EndingTier } from '~/utils/crystalStreet/types'

defineProps<{ modelValue: string; label: string }>()
defineEmits<{ 'update:modelValue': [string] }>()

const store = useCrystalStreetStore()
const progress = computed(() => discoveryProgress(VILLAINS, store.metVillains))
const faced = computed(() => progress.value.discovered)
const unfaced = computed(() => progress.value.missing)
const found = (id: string, tier: EndingTier) =>
  store.scrapbook.endings.includes(endingKey(id, tier))
</script>
