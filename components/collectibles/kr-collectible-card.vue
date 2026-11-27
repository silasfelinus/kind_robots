<script setup lang="ts">
import { computed } from 'vue'
import type { CollectibleRarity } from '~/utils/collectibles/types'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    rarity?: CollectibleRarity | 'back'
    imageUrl?: string | null
    locked?: boolean
    count?: number
  }>(),
  { subtitle: '', rarity: 'common', imageUrl: null, locked: false, count: 0 },
)

const RARITY_LABEL: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  back: 'Card back',
}

const label = computed(() => RARITY_LABEL[props.rarity] ?? '')
</script>

<template>
  <figure
    class="kr-collectible relative min-w-0"
    :data-rarity="rarity"
    :class="{ 'is-locked': locked }"
    :aria-label="locked ? `Locked ${label} card` : `${title}, ${label}`"
  >
    <div
      class="kr-collectible-face relative aspect-[2/3] overflow-hidden rounded-xl"
    >
      <img
        v-if="imageUrl && !locked"
        :src="imageUrl"
        :alt="`${title} art`"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="kr-collectible-fallback absolute inset-0 grid place-items-center p-2 text-center"
      >
        <span class="text-3xl" aria-hidden="true">{{
          locked ? '?' : '✦'
        }}</span>
      </div>
      <span
        v-if="count > 1 && !locked"
        class="badge badge-neutral badge-xs absolute right-1 top-1"
      >
        ×{{ count }}
      </span>
    </div>
    <figcaption class="mt-1 text-center leading-tight">
      <span class="block truncate text-[11px] font-bold">
        {{ locked ? '???' : title }}
      </span>
      <span
        class="kr-collectible-rarity block text-[9px] uppercase tracking-widest"
      >
        {{ label }}
      </span>
    </figcaption>
  </figure>
</template>

<style scoped>
.kr-collectible {
  --rarity: var(--color-base-content);
}

.kr-collectible[data-rarity='uncommon'] {
  --rarity: var(--color-success);
}

.kr-collectible[data-rarity='rare'] {
  --rarity: var(--color-info);
}

.kr-collectible[data-rarity='epic'] {
  --rarity: var(--color-secondary);
}

.kr-collectible[data-rarity='legendary'] {
  --rarity: var(--color-warning);
}

.kr-collectible[data-rarity='back'] {
  --rarity: var(--color-primary);
}

.kr-collectible-face {
  background: var(--color-base-300);
  box-shadow:
    0 0 0 2px color-mix(in oklch, var(--rarity) 70%, transparent),
    0 4px 14px color-mix(in oklch, var(--rarity) 30%, transparent);
}

.kr-collectible[data-rarity='legendary'] .kr-collectible-face,
.kr-collectible[data-rarity='epic'] .kr-collectible-face {
  box-shadow:
    0 0 0 2px var(--rarity),
    0 0 22px color-mix(in oklch, var(--rarity) 55%, transparent);
}

.kr-collectible-fallback {
  color: color-mix(in oklch, var(--rarity) 80%, var(--color-base-content));
  background:
    radial-gradient(
      circle at 50% 40%,
      color-mix(in oklch, var(--rarity) 30%, transparent),
      transparent 65%
    ),
    var(--color-base-300);
}

.kr-collectible.is-locked .kr-collectible-face {
  filter: grayscale(1);
  opacity: 0.55;
}

.kr-collectible-rarity {
  color: var(--rarity);
}
</style>
