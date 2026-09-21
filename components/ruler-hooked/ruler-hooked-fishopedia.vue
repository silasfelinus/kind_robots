<template>
  <details class="fishopedia-shell collapse collapse-arrow kr-panel-flat">
    <summary
      class="collapse-title flex items-center justify-between gap-3 pr-12 font-bold"
    >
      <span>📖 Fishopedia</span>
      <span class="kr-badge-outline">{{ discoveredCountLabel }}</span>
    </summary>

    <div class="collapse-content">
      <p class="mb-3 text-xs opacity-60">
        Unknown species stay hidden until caught. Discovered entries remember
        your best specimen and why that creature could exist in this reign.
      </p>

      <div class="fishopedia-grid grid gap-3">
        <article
          v-for="fish in roster"
          :key="fish.slug"
          class="min-h-32 kr-panel-tint-compact-50"
        >
          <template v-if="entryFor(fish.slug)">
            <div class="flex gap-3">
              <img
                v-if="!brokenImages[fish.slug]"
                :src="fishBestiaryImageSrc(fish.slug)"
                :alt="fish.name"
                class="aspect-square w-16 shrink-0 rounded-lg border border-base-300 bg-base-100 object-cover"
                loading="lazy"
                @error="brokenImages[fish.slug] = true"
              />
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="kr-badge-xs"
                    :class="affinityClass(fish.affinity)"
                    >{{ fish.affinity }}</span
                  >
                  <span class="kr-badge-outline-xs">{{ fish.rarity }}</span>
                  <span class="text-xs opacity-50"
                    >×{{ entryFor(fish.slug)!.countCaught }}</span
                  >
                </div>
                <h4 class="mt-2 font-black">{{ fish.name }}</h4>
                <p class="mt-1 text-xs opacity-75">{{ fish.fishopediaNote }}</p>
              </div>
            </div>
            <dl class="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt class="opacity-50">Best size</dt>
                <dd class="font-semibold">
                  {{ formatSize(entryFor(fish.slug)!.bestSizeCm) }}
                </dd>
              </div>
              <div>
                <dt class="opacity-50">Best quality</dt>
                <dd class="font-semibold">
                  {{ entryFor(fish.slug)!.bestQualityScore }}/100
                </dd>
              </div>
            </dl>
            <p class="mt-2 border-t border-base-300 pt-2 text-xs opacity-60">
              {{ fish.consequenceReveal }}
            </p>
          </template>

          <template v-else>
            <div class="flex h-full min-h-24 items-center gap-3 opacity-50">
              <div
                class="flex size-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-current text-2xl"
              >
                <Icon name="kind-icon:lock" class="kr-icon-6" />
              </div>
              <div>
                <p class="font-bold">Sealed specimen</p>
                <p class="text-xs">
                  Its place in this version of the lake has not been discovered.
                </p>
              </div>
            </div>
          </template>
        </article>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import type { FishAffinity, RunSave } from '~/types/ruler-hooked'
import {
  RULER_HOOKED_FISH,
  fishBestiaryImageSrc,
} from '~/utils/rulerHooked/fish'

const props = defineProps<{ save: RunSave }>()
const roster = RULER_HOOKED_FISH

// A species' bestiary art may not have rendered yet (ruler-hooked/t-019
// batches land over time) — hide the <img> on failure rather than a broken-
// image icon, same pattern as ruler-hooked-cosmetics-picker.vue.
const brokenImages = reactive<Record<string, boolean>>({})
const discoveredCount = computed(
  () => Object.keys(props.save.fishopedia).length,
)
const discoveredCountLabel = computed(() => {
  const count = discoveredCount.value
  if (count === 0) return 'No species discovered yet'
  if (count === 1) return '1 species discovered'
  return `${count} species discovered`
})

function entryFor(slug: string) {
  return props.save.fishopedia[slug]
}

function affinityClass(affinity: FishAffinity): string {
  return {
    GOOD: 'badge-success',
    NEUTRAL: 'badge-ghost',
    EVIL: 'badge-error',
  }[affinity]
}

function formatSize(cm: number): string {
  if (cm >= 100) return `${(cm / 100).toFixed(cm >= 1000 ? 1 : 2)} m`
  return `${cm.toFixed(1)} cm`
}
</script>

<style scoped>
.fishopedia-shell {
  container-type: inline-size;
}

.fishopedia-grid {
  grid-template-columns: minmax(0, 1fr);
}

@container (min-width: 32rem) {
  .fishopedia-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
