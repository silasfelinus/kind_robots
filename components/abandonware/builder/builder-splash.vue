<!-- /components/builder/builder-splash.vue -->
<!--
  Polished landing page for the card-deck builder.
  Drop-in replacement — uses the same builderStore API you already have:
    store.activeConfig.label · store.splash.* · store.cards · store.visibleCards
    store.selectCard(key) · store.randomCard()
  Art comes straight from your adventureCards.ts (deckImage / flourish / icon / label).
-->
<template>
  <section
    class="relative grid min-h-full gap-6 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,440px)] lg:p-8"
  >
    <!-- ambient wash: primary in one corner, secondary in the other -->
    <div
      class="pointer-events-none absolute inset-0 opacity-80"
      style="
        background:
          radial-gradient(
            120% 120% at 100% 0%,
            color-mix(in oklab, var(--color-primary) 10%, transparent),
            transparent 45%
          ),
          radial-gradient(
            120% 120% at 0% 100%,
            color-mix(in oklab, var(--color-secondary) 8%, transparent),
            transparent 45%
          );
      "
    />

    <!-- ── Left: copy ─────────────────────────────────────────────── -->
    <div class="relative z-10 flex min-w-0 flex-col justify-center gap-5">
      <div class="flex items-center gap-3">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        >
          <Icon name="kind-icon:sparkles" class="h-7 w-7" />
        </div>
        <div class="min-w-0">
          <p
            class="text-xs font-black uppercase tracking-[0.22em] text-primary/70"
          >
            {{ store.activeConfig.label }}
          </p>
          <h1
            class="builder-display text-4xl font-black leading-[0.92] text-base-content md:text-6xl"
          >
            {{ store.splash.title }}
          </h1>
        </div>
      </div>

      <p
        v-if="store.splash.subtitle"
        class="text-xl font-bold text-secondary md:text-2xl"
      >
        {{ store.splash.subtitle }}
      </p>
      <p
        class="max-w-2xl text-base leading-relaxed text-base-content/65 md:text-lg"
      >
        {{ store.splash.description }}
      </p>

      <div class="flex flex-wrap gap-2.5">
        <button
          type="button"
          class="btn btn-primary gap-2 rounded-2xl px-5 text-base"
          @click="startBuilder"
        >
          <Icon name="kind-icon:play" class="h-4 w-4" />
          {{ store.splash.ctaLabel || 'Start building' }}
        </button>
        <button
          type="button"
          class="btn btn-ghost gap-2 rounded-2xl border border-base-300 px-5 text-base"
          @click="store.randomCard()"
        >
          <Icon name="kind-icon:dice" class="h-4 w-4" />
          {{ store.splash.secondaryLabel || 'Surprise me' }}
        </button>
      </div>

      <!-- card-label chips: a quick read of the whole deck -->
      <div class="mt-1 flex flex-wrap gap-1.5">
        <span
          v-for="card in store.cards"
          :key="card.key"
          class="inline-flex items-center gap-1.5 rounded-full border border-base-300 bg-base-200 px-2.5 py-1 text-xs font-bold text-base-content/55"
        >
          <span class="text-sm leading-none text-primary/70">{{
            card.flourish
          }}</span>
          {{ card.label }}
        </span>
      </div>
    </div>

    <!-- ── Right: fanned deck of real card art ───────────────────── -->
    <div
      class="relative z-10 hidden min-h-80 overflow-hidden rounded-2xl lg:block"
    >
      <div class="absolute inset-0">
        <div
          v-for="(card, i) in fanCards"
          :key="card.key"
          class="splash-card absolute overflow-hidden rounded-2xl border border-base-300 bg-base-200 shadow-xl"
          :style="fanStyle(i)"
        >
          <img
            v-if="card.deckImage"
            :src="card.deckImage"
            :alt="card.label"
            class="h-full w-full object-cover"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-7xl text-base-content/15"
          >
            {{ card.flourish }}
          </div>
          <div
            class="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-linear-to-t from-base-100/90 to-transparent px-3 py-2"
          >
            <Icon :name="card.icon" class="h-3.5 w-3.5 text-primary" />
            <span
              class="text-xs font-black uppercase tracking-widest text-base-content/80"
            >
              {{ card.label }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()

// First three cards make the fan. Swap for hero cards if you prefer.
const fanCards = computed(() => (store.cards ?? []).slice(0, 3))

function fanStyle(i: number) {
  return {
    inset: '14px',
    transform: `rotate(${(i - 1) * 5}deg) translate(${(i - 1) * 16}px, ${i * 6}px)`,
    zIndex: String(3 - i),
  }
}

function startBuilder(): void {
  const first = store.visibleCards[0]
  if (first) store.selectCard(first.key)
}
</script>

<style scoped>
.builder-display {
  font-family: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -0.01em;
}

.splash-card {
  transition: transform 0.35s cubic-bezier(0.3, 0.7, 0.4, 1);
}
.splash-card:hover {
  transform: rotate(0deg) translate(0, -6px) scale(1.02) !important;
  z-index: 9 !important;
}
</style>
