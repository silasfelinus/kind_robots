<template>
  <section
    class="title-console relative isolate flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-base-content/15 bg-base-300 shadow-2xl"
    aria-labelledby="shifting-lands-title-heading"
    data-testid="shifting-lands-title"
  >
    <img
      src="/shifting-lands/endings/unnamed-road.webp"
      alt=""
      class="title-backdrop absolute inset-0 -z-10 size-full object-cover object-[30%_center]"
    />
    <div
      class="absolute inset-0 -z-10 bg-gradient-to-b from-black/10 via-black/30 to-black/85"
    />
    <div
      class="flex min-h-0 flex-1 flex-col justify-between gap-4 p-4 text-white sm:p-8"
    >
      <header class="max-w-xl">
        <h2
          id="shifting-lands-title-heading"
          class="font-serif text-4xl font-black leading-none drop-shadow-lg sm:text-6xl"
        >
          Zuzu: Shifting Lands
        </h2>
        <p class="mt-3 max-w-md text-sm font-semibold drop-shadow sm:text-base">
          Five lands rearrange themselves behind you. Choose who walks, and
          every card you turn decides what the road remembers.
        </p>
      </header>

      <nav
        class="grid w-full max-w-md gap-2 sm:max-w-lg"
        aria-label="Title menu"
      >
        <button
          v-if="hasJourney"
          type="button"
          class="flex items-center gap-3 rounded-2xl border border-warning/60 bg-base-100/90 p-2 text-left text-base-content shadow-xl transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary"
          data-testid="shifting-lands-title-continue"
          @click="$emit('continue')"
        >
          <img
            :src="characterPortrait(game.character)"
            :alt="game.character.name"
            class="size-16 shrink-0 rounded-xl object-cover sm:size-20"
          />
          <span class="min-w-0 flex-1">
            <span
              class="block text-[11px] font-black uppercase tracking-widest text-warning"
              >{{ game.finished ? 'Your ending' : 'Continue' }}</span
            >
            <span class="block truncate font-serif text-xl font-black">{{
              game.character.name
            }}</span>
            <span class="block truncate text-xs opacity-75"
              >Land {{ game.state.landIndex + 1 }}/5 ·
              {{ game.currentLand.name }}</span
            >
          </span>
          <Icon name="kind-icon:arrow-right" class="size-6 shrink-0" />
        </button>
        <button
          type="button"
          class="btn h-auto min-h-12 rounded-2xl"
          :class="hasJourney ? 'btn-outline bg-base-100/80' : 'btn-primary'"
          data-testid="shifting-lands-title-new"
          @click="$emit('newJourney')"
        >
          <Icon name="kind-icon:map" class="size-5 shrink-0" />
          New journey
        </button>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="btn btn-outline relative h-auto min-h-12 rounded-2xl bg-base-100/80"
            data-testid="shifting-lands-title-scrapbook"
            @click="$emit('scrapbook')"
          >
            <Icon name="kind-icon:gallery" class="size-5 shrink-0" />
            Scrapbook
            <span
              class="badge badge-sm badge-warning absolute -right-1 -top-2 font-black"
              :aria-label="`${game.scrapbookTotals.found} of ${game.scrapbookTotals.total} endings found`"
              >{{ game.scrapbookTotals.found }}/{{
                game.scrapbookTotals.total
              }}</span
            >
          </button>
          <button
            type="button"
            class="btn btn-outline h-auto min-h-12 rounded-2xl bg-base-100/80"
            data-testid="shifting-lands-title-achievements"
            @click="$emit('achievements')"
          >
            <Icon name="kind-icon:trophy" class="size-5 shrink-0" />
            Achievements
          </button>
        </div>
      </nav>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useShiftingLandsJourneyStore } from '~/stores/shiftingLandsJourneyStore'
import { characterPortrait } from '~/utils/shiftingLands/characters'

defineEmits<{
  continue: []
  newJourney: []
  scrapbook: []
  achievements: []
}>()
const game = useShiftingLandsJourneyStore()
const hasJourney = computed(() => !game.needsCharacter && !game.restoreWarning)
</script>

<style scoped>
@keyframes title-drift {
  from {
    transform: scale(1.06) translateX(-1.5%);
  }
  to {
    transform: scale(1.06) translateX(1.5%);
  }
}
.title-backdrop {
  animation: title-drift 40s ease-in-out infinite alternate;
}
:global(.journey-reduced-motion) .title-backdrop {
  animation: none;
}
@media (prefers-reduced-motion: reduce) {
  .title-backdrop {
    animation: none;
  }
}
</style>
