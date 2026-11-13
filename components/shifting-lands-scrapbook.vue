<template>
  <section
    class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-base-content/15 bg-base-200 shadow-2xl"
    aria-labelledby="shifting-lands-scrapbook-heading"
    data-testid="shifting-lands-scrapbook"
  >
    <header
      class="flex shrink-0 items-center gap-2 border-b border-base-content/10 px-3 py-2 sm:px-4"
    >
      <h2
        id="shifting-lands-scrapbook-heading"
        class="mr-auto font-serif text-xl font-black sm:text-2xl"
      >
        Scrapbook
      </h2>
      <p
        class="badge badge-warning gap-1 whitespace-nowrap font-black sm:badge-lg"
      >
        {{ game.scrapbookTotals.found }} of {{ game.scrapbookTotals.total }}
        <span class="sr-only sm:not-sr-only">endings</span> found
      </p>
      <button
        type="button"
        class="btn btn-square btn-ghost btn-sm"
        aria-label="Close scrapbook"
        data-testid="shifting-lands-scrapbook-close"
        @click="$emit('close')"
      >
        <Icon name="kind-icon:x" class="size-5" />
      </button>
    </header>

    <div class="kr-scroll space-y-6 p-3 sm:p-4">
      <section aria-labelledby="scrapbook-travelers-heading">
        <div class="mb-2 flex items-baseline justify-between gap-2">
          <h3
            id="scrapbook-travelers-heading"
            class="font-serif text-lg font-black"
          >
            Travelers' own endings
          </h3>
          <span class="text-xs font-bold opacity-70"
            >{{ travelerFound }} of {{ travelerTotal }}</span
          >
        </div>
        <ul class="traveler-grid grid gap-3">
          <li
            v-for="page in game.personalScrapbookPages"
            :key="page.characterId"
            class="flex min-w-0 flex-col gap-2 rounded-2xl border border-base-content/10 bg-base-100 p-2"
            :data-testid="`scrapbook-traveler-${page.characterId}`"
          >
            <div class="flex items-center gap-2">
              <img
                :src="portraitOf(page.characterId)"
                :alt="page.name"
                class="size-12 shrink-0 rounded-xl object-cover"
                loading="lazy"
              />
              <div class="min-w-0">
                <p class="truncate font-serif font-black">{{ page.name }}</p>
                <p class="text-xs opacity-70">
                  {{ page.found }} of {{ page.total }} endings
                </p>
              </div>
            </div>
            <ul class="grid grid-cols-3 gap-1.5">
              <li
                v-for="ending in page.endings"
                :key="ending.id"
                class="min-w-0"
              >
                <figure
                  class="relative aspect-[3/4] overflow-hidden rounded-xl border bg-base-300"
                  :class="
                    ending.found
                      ? 'border-warning/60'
                      : 'border-base-content/10'
                  "
                >
                  <img
                    :src="ending.plate ?? portraitOf(page.characterId)"
                    :alt="
                      ending.found
                        ? ending.title
                        : `An undiscovered ${ending.tone} ending`
                    "
                    class="size-full object-cover"
                    :class="
                      !ending.found
                        ? 'locked-silhouette'
                        : ending.plate
                          ? ''
                          : 'opacity-55 grayscale-[40%]'
                    "
                    loading="lazy"
                  />
                  <span
                    v-if="!ending.found"
                    class="absolute inset-0 grid place-items-center font-serif text-xl font-black text-white/80"
                    aria-hidden="true"
                    >???</span
                  >
                  <figcaption
                    class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1 pb-1 pt-4 text-[10px] leading-tight text-white"
                  >
                    <span class="block font-black uppercase tracking-wider">{{
                      ending.tone
                    }}</span>
                    <span v-if="ending.found" class="line-clamp-2 block">{{
                      ending.title
                    }}</span>
                  </figcaption>
                </figure>
              </li>
            </ul>
          </li>
        </ul>
      </section>

      <section aria-labelledby="scrapbook-shared-heading">
        <div class="mb-2 flex items-baseline justify-between gap-2">
          <h3
            id="scrapbook-shared-heading"
            class="font-serif text-lg font-black"
          >
            Endings of the road
          </h3>
          <span class="text-xs font-bold opacity-70"
            >{{ game.sharedScrapbookPage.found }} of
            {{ game.sharedScrapbookPage.total }}</span
          >
        </div>
        <ul class="plate-grid grid gap-2">
          <li
            v-for="ending in game.sharedScrapbookPage.endings"
            :key="ending.id"
            class="min-w-0"
            :data-testid="`scrapbook-shared-${ending.id}`"
          >
            <figure
              class="relative aspect-[16/10] overflow-hidden rounded-xl border bg-base-300"
              :class="
                ending.found ? 'border-warning/60' : 'border-base-content/10'
              "
            >
              <img
                :src="ending.plate"
                :alt="ending.found ? ending.title : 'An undiscovered ending'"
                class="size-full object-cover"
                :class="ending.found ? '' : 'locked-silhouette'"
                loading="lazy"
              />
              <span
                v-if="!ending.found"
                class="absolute inset-0 grid place-items-center font-serif text-2xl font-black text-white/80"
                aria-hidden="true"
                >???</span
              >
              <figcaption
                v-if="ending.found"
                class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pb-1.5 pt-5 text-xs font-bold leading-tight text-white"
              >
                {{ ending.title }}
              </figcaption>
            </figure>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useShiftingLandsJourneyStore } from '~/stores/shiftingLandsJourneyStore'
import {
  CUSTOM_PORTRAIT_FALLBACK,
  PREMADE_CHARACTERS,
  characterPortrait,
} from '~/utils/shiftingLands/characters'

defineEmits<{ close: [] }>()
const game = useShiftingLandsJourneyStore()
const portraits = new Map(
  PREMADE_CHARACTERS.map((entry) => [entry.id, characterPortrait(entry)]),
)
const portraitOf = (id: string) => portraits.get(id) ?? CUSTOM_PORTRAIT_FALLBACK
const travelerFound = computed(() =>
  game.personalScrapbookPages.reduce((sum, page) => sum + page.found, 0),
)
const travelerTotal = computed(() =>
  game.personalScrapbookPages.reduce((sum, page) => sum + page.total, 0),
)
</script>

<style scoped>
.traveler-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
}
.plate-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(46%, 11rem), 1fr));
}
.locked-silhouette {
  filter: blur(8px) grayscale(1) brightness(0.35);
  transform: scale(1.15);
}
</style>
