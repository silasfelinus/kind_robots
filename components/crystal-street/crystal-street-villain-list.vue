<template>
  <ul
    class="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2 @3xl:grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]"
    :aria-label="label"
  >
    <li v-for="v in VILLAINS" :key="v.id">
      <button
        type="button"
        class="cs-card w-full overflow-hidden text-left"
        :class="[
          modelValue === v.id ? 'ring-2 ring-primary' : '',
          met(v.id) ? '' : 'opacity-60',
        ]"
        :aria-pressed="modelValue === v.id"
        :data-testid="`cs-villain-${v.id}`"
        @click="$emit('update:modelValue', v.id)"
      >
        <crystal-street-art
          frame="aspect-[4/5]"
          :kind="met(v.id) ? 'villain' : 'night'"
          :seed="met(v.id) ? v.id : `locked:${v.id}`"
          :src="
            met(v.id) ? `/crystal-street/villains/${v.id}-portrait.webp` : ''
          "
          :palette="met(v.id) ? v.palette : []"
          :sigil="met(v.id) ? v.sigil : '?'"
          :alt="met(v.id) ? v.name : 'A nightmare you have not faced'"
        />
        <span class="block truncate px-1.5 pt-1 text-[11px] font-semibold">
          {{ met(v.id) ? v.name : '???' }}
        </span>
        <span class="flex gap-0.5 px-1.5 pb-1.5" aria-hidden="true">
          <span
            v-for="tier in ENDING_TIERS"
            :key="tier"
            class="h-1.5 flex-1 rounded-full"
            :class="found(v.id, tier) ? `cs-bar-${tier}` : 'bg-base-content/15'"
          />
        </span>
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import { ENDING_TIERS, VILLAINS, endingKey } from '~/utils/crystalStreet/rules'
import type { EndingTier } from '~/utils/crystalStreet/types'

defineProps<{ modelValue: string; label: string }>()
defineEmits<{ 'update:modelValue': [string] }>()

const store = useCrystalStreetStore()
const met = (id: string) => store.metVillains.has(id)
const found = (id: string, tier: EndingTier) =>
  store.scrapbook.endings.includes(endingKey(id, tier))
</script>
