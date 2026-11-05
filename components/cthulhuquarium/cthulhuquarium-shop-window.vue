<!-- components/cthulhuquarium/cthulhuquarium-shop-window.vue
     What a visitor who is not signed in sees: the shop's own display tank,
     alive, through the window -- a curated cast drawn from every movement
     mode and plate -- with Charlotte at the door. The game itself needs an
     account, because a tank is persisted server-side; this is the reason to
     make one. -->
<template>
  <div class="cq-window flex flex-col gap-3">
    <div class="cq-window-stage">
      <cthulhuquarium-tank-view
        :occupants="occupants"
        background-key="parlour"
        :decor="[]"
      />
      <div class="cq-window-title pointer-events-none" aria-hidden="true">
        <span class="cq-window-overline">Portsmouth · After closing</span>
        <span class="font-serif text-3xl font-black leading-none sm:text-5xl">
          Cthulhuquarium
        </span>
      </div>
    </div>

    <div class="cq-window-door">
      <img
        :src="portraitFor('charlotte', 'welcome') ?? undefined"
        alt="Charlotte Fishmonger"
        class="-mt-16 h-40 w-28 shrink-0 object-contain object-bottom drop-shadow-xl"
      />
      <div class="flex min-w-60 flex-1 flex-col gap-2">
        <p class="font-serif text-base leading-snug">
          Come in, come in, out of all that. Whatever it is out there, it will
          keep. The first creature is on the house, darling; the tank is yours
          the moment you have a name I can write in the book.
        </p>
        <p class="text-xs italic opacity-60">
          Charlotte Fishmonger, of the Portsmouth Fishmongers
        </p>
      </div>
      <NuxtLink to="/login" class="cq-window-cta btn btn-primary min-h-12">
        Step inside
        <Icon name="kind-icon:chevron-right" class="kr-icon-4" />
      </NuxtLink>
    </div>

    <section aria-label="How the tank plays" class="cq-window-steps">
      <article v-for="step in steps" :key="step.title" class="cq-window-step">
        <div class="cq-window-step-art">
          <img v-if="step.art" :src="step.art" alt="" loading="lazy" />
          <span class="cq-window-step-icon">
            <Icon :name="step.icon" class="size-4" />
          </span>
        </div>
        <div class="flex flex-col gap-1 p-3 pt-5">
          <h3 class="font-serif text-base font-black">{{ step.title }}</h3>
          <p class="text-xs leading-snug opacity-75">{{ step.body }}</p>
        </div>
      </article>
    </section>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
      <div
        v-for="occupant in occupants"
        :key="occupant.id"
        class="flex flex-col items-center gap-1 rounded-2xl border border-base-300 bg-base-100 p-2"
      >
        <cthulhuquarium-sprite
          :slug="occupant.slug"
          :label="occupant.name"
          :size="72"
          class="size-18"
        />
        <p class="truncate text-center text-xs font-bold">
          {{ occupant.name }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { artByName, plateArt, portraitFor } from '~/utils/cthulhuquariumArt'
import { CTHULHUQUARIUM_SPECIES } from '~/utils/cthulhuquariumCanon.generated'

const SHOWCASE = [
  'guppy-common',
  'gravel-tetra',
  'penny-bream',
  'drifting-bell',
  'lamplight-angler',
  'bailiff-eel',
  'ledger-crab',
  'pane-limpet',
  'rainbow-nudibranch',
  'folding-fry',
  'kitchen-perch',
  'glass-shrimp',
]

const steps = [
  {
    title: 'Tap the coins',
    body: 'Every fed creature drops coins. Catch them before they fade.',
    icon: 'kind-icon:coin',
    art: plateArt('upgrade-drops'),
  },
  {
    title: 'Keep them fed',
    body: 'Feed the hungry and Clean the glass, and the tank pays you back.',
    icon: 'kind-icon:fish',
    art: plateArt('upgrade-food'),
  },
  {
    title: 'Fill the book',
    body: 'Buy strange new specimens daily. Every one you keep opens more of the shop.',
    icon: 'kind-icon:book',
    art: artByName('ichthyonomicon'),
  },
]

const occupants = computed(() =>
  SHOWCASE.flatMap((slug, index) => {
    const species = CTHULHUQUARIUM_SPECIES[slug]
    return species
      ? [
          {
            id: index + 1,
            slug,
            name: species.name,
            behavior: species.behavior,
            size: species.size,
            hue: species.hue,
            hunger: 100,
          },
        ]
      : []
  }),
)
</script>

<style scoped>
.cq-window-stage {
  position: relative;
}
.cq-window-title {
  position: absolute;
  top: clamp(0.75rem, 3vw, 1.5rem);
  left: clamp(0.75rem, 3vw, 1.75rem);
  display: grid;
  gap: 0.3rem;
  color: white;
  filter: drop-shadow(0 0.25rem 0.8rem rgb(0 0 0 / 0.9));
}
.cq-window-overline {
  color: var(--color-primary);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.cq-window-door {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid
    color-mix(in oklab, var(--color-primary) 30%, var(--color-base-300));
  border-radius: 1.25rem;
  background: var(--color-base-100);
  box-shadow: 0 1rem 2.5rem rgb(0 0 0 / 0.3);
}
.cq-window-cta {
  border-radius: 999px;
  box-shadow:
    inset 0 -3px 0 rgb(0 0 0 / 0.2),
    0 0 1.25rem color-mix(in oklab, var(--color-primary) 35%, transparent);
}
.cq-window-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.6rem;
}
.cq-window-step {
  overflow: hidden;
  border: 1px solid var(--color-base-300);
  border-radius: 1rem;
  background: var(--color-base-100);
}
.cq-window-step-art {
  position: relative;
  aspect-ratio: 16 / 7;
  background: var(--color-base-300);
}
.cq-window-step-art img {
  height: 100%;
  width: 100%;
  object-fit: cover;
}
.cq-window-step-icon {
  position: absolute;
  bottom: -0.9rem;
  left: 0.75rem;
  display: grid;
  height: 2rem;
  width: 2rem;
  place-items: center;
  border: 1px solid color-mix(in oklab, var(--color-secondary) 60%, transparent);
  border-radius: 999px;
  background: var(--color-base-200);
  color: var(--color-secondary);
}
</style>
