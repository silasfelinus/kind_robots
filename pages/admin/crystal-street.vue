<template>
  <main
    class="kr-surface cs @container h-full min-h-0 overflow-hidden bg-base-200 px-2 py-2 text-base-content sm:px-3"
    :class="run?.phase === 'night' ? 'cs-night' : 'cs-day'"
    data-theme="crystal-street"
    data-layout="console-fixed"
  >
    <p
      v-if="store.storageWarning"
      class="kr-note kr-note-error p-2 text-sm"
      role="alert"
    >
      {{ store.storageWarning }}
    </p>

    <header
      v-if="store.loaded && run && view !== 'title'"
      class="kr-toolbar cs-bar"
    >
      <button
        type="button"
        class="cs-brand"
        aria-label="Back to the title screen"
        @click="view = 'title'"
      >
        <span class="cs-display hidden text-sm leading-none @3xl:block"
          >Crystal Street</span
        >
        <span class="text-[11px] font-bold uppercase tracking-widest">
          {{
            run.ending
              ? 'Week over'
              : `Day ${run.day} · ${run.phase === 'night' ? 'Night' : 'Day'}`
          }}
        </span>
      </button>
      <div class="flex items-center gap-2 text-xs" aria-label="Your state">
        <span class="cs-meter" :title="`Nerve ${run.nerve} of ${MAX_NERVE}`">
          <icon name="kind-icon:heart" class="h-4 w-4 text-primary" />
          <strong>{{ run.nerve }}</strong>
          <span class="sr-only">nerve</span>
        </span>
        <span class="cs-meter" :title="`Dread ${run.dread} of ${MAX_DREAD}`">
          <icon name="kind-icon:ghost" class="h-4 w-4 text-secondary" />
          <span class="cs-dread" aria-hidden="true">
            <span :style="{ width: `${run.dread * 10}%` }" />
          </span>
          <span class="sr-only">dread {{ run.dread }}</span>
        </span>
        <span class="cs-meter hidden @md:flex" title="Quarters">
          <icon name="kind-icon:coin" class="h-4 w-4 text-accent" />{{
            run.quarters
          }}
        </span>
        <span class="cs-meter hidden @lg:flex" title="Night wins">
          <icon name="kind-icon:dice" class="h-4 w-4" />{{ run.wins }}
        </span>
      </div>
      <nav class="ml-auto flex gap-1" aria-label="Game panels">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          type="button"
          class="btn btn-xs rounded-2xl @3xl:btn-sm"
          :class="view === tab.id ? 'btn-primary' : 'btn-ghost'"
          :aria-pressed="view === tab.id"
          @click="view = tab.id"
        >
          <icon :name="tab.icon" class="h-4 w-4" />
          <span class="hidden @2xl:inline">{{ tab.label }}</span>
          <span v-if="tab.id === 'crew'" class="text-[10px]">{{
            run.crew.length
          }}</span>
          <span v-if="tab.id === 'case'" class="text-[10px]"
            >{{ run.clues.length }}/3</span
          >
        </button>
      </nav>
    </header>

    <div v-if="!store.loaded" class="kr-stage" aria-hidden="true" />
    <div v-else class="kr-stage">
      <crystal-street-title
        v-if="view === 'title' || !run"
        @resume="view = 'stage'"
        @started="view = 'stage'"
        @scrapbook="view = 'scrapbook'"
      />
      <crystal-street-scrapbook v-else-if="view === 'scrapbook'" />
      <crystal-street-crew v-else-if="view === 'crew'" />
      <crystal-street-case v-else-if="view === 'case'" />
      <crystal-street-pack v-else-if="view === 'pack'" />
      <crystal-street-ending
        v-else-if="run.ending"
        @again="view = 'title'"
        @scrapbook="view = 'scrapbook'"
      />
      <div
        v-else-if="arrival"
        class="cs-frame kr-stage relative overflow-hidden"
      >
        <crystal-street-art
          class="absolute inset-0"
          frame="h-full"
          kind="villain"
          :seed="villain!.id"
          :src="`/crystal-street/villains/${villain!.id}-poster.webp`"
          :palette="villain!.palette"
          :sigil="villain!.sigil"
          :alt="villain!.poster"
        />
        <div
          class="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/90 to-transparent p-4 text-white"
        >
          <p class="cs-kicker text-secondary">
            Saturday night. Something wakes under Crystal Street.
          </p>
          <h2 class="cs-display text-3xl leading-tight sm:text-5xl">
            {{ villain!.name }}
          </h2>
          <p class="text-sm uppercase tracking-widest opacity-80">
            {{ villain!.epithet }}
          </p>
          <p class="max-w-2xl">{{ villain!.logline }}</p>
          <p class="cs-quote max-w-2xl">“{{ villain!.taunts[0] }}”</p>
          <button
            type="button"
            class="btn btn-primary btn-sm rounded-2xl"
            data-testid="cs-face-night"
            @click="arrivalSeen = run.seed"
          >
            Face the night
          </button>
        </div>
      </div>
      <crystal-street-encounter v-else-if="store.encounter" />
      <crystal-street-map v-else />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import { MAX_DREAD, MAX_NERVE } from '~/utils/crystalStreet/rules'

type View = 'title' | 'stage' | 'crew' | 'case' | 'pack' | 'scrapbook'

const TABS: { id: View; label: string; icon: string }[] = [
  { id: 'stage', label: 'Play', icon: 'kind-icon:map' },
  { id: 'crew', label: 'Crew', icon: 'kind-icon:users' },
  { id: 'case', label: 'Case', icon: 'kind-icon:search' },
  { id: 'pack', label: 'Pack', icon: 'kind-icon:bag' },
  { id: 'scrapbook', label: 'Scrapbook', icon: 'kind-icon:book' },
]

useHead({ title: 'Nightmare on Crystal Street' })

const store = useCrystalStreetStore()
const run = computed(() => store.run)
const villain = computed(() => store.villain)
const view = ref<View>('title')
const arrivalSeen = ref('')
const arrival = computed(
  () =>
    !!run.value &&
    run.value.phase === 'night' &&
    run.value.day === 1 &&
    run.value.log.every((l) => l.phase === 'day') &&
    arrivalSeen.value !== run.value.seed,
)

onMounted(() => {
  store.load()
  if (store.run && !store.run.ending) view.value = 'stage'
})
</script>

<style>
.cs .cs-frame {
  border-radius: 1rem;
  border: 1px solid color-mix(in oklch, var(--color-primary) 35%, transparent);
  background: color-mix(in oklch, var(--color-base-100) 92%, transparent);
  box-shadow:
    0 0 0 1px color-mix(in oklch, var(--color-secondary) 12%, transparent),
    0 10px 30px -12px color-mix(in oklch, var(--color-primary) 45%, transparent);
}
.cs .cs-poster {
  background: linear-gradient(#0d0221, #2a0a4a 45%, #7a1268 75%, #ff3d8b);
}
.cs.cs-night {
  background:
    radial-gradient(
      circle at 80% 0%,
      color-mix(in oklch, var(--color-primary) 22%, transparent),
      transparent 55%
    ),
    var(--color-base-200);
}
.cs.cs-day {
  background:
    radial-gradient(
      circle at 20% 0%,
      color-mix(in oklch, var(--color-secondary) 18%, transparent),
      transparent 55%
    ),
    var(--color-base-200);
}
.cs .cs-display {
  font-family: Impact, 'Arial Black', 'Helvetica Neue', sans-serif;
  letter-spacing: 0.02em;
  color: var(--color-accent);
  text-shadow: 0 0 12px
    color-mix(in oklch, var(--color-primary) 60%, transparent);
}
.cs .cs-kicker {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-secondary);
}
.cs .cs-bar {
  border-radius: 1rem;
  padding: 0.35rem 0.5rem;
  background: color-mix(in oklch, var(--color-base-100) 90%, transparent);
  border: 1px solid color-mix(in oklch, var(--color-primary) 30%, transparent);
}
.cs .cs-brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  padding: 0.2rem 0.6rem;
  border-radius: 0.8rem;
  background: color-mix(in oklch, var(--color-primary) 18%, transparent);
}
.cs .cs-meter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.cs .cs-dread {
  display: block;
  width: 3rem;
  height: 0.45rem;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-content) 15%, transparent);
  overflow: hidden;
}
.cs .cs-dread > span {
  display: block;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-secondary),
    var(--color-primary)
  );
}
.cs .cs-choice {
  display: block;
  border-radius: 1rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid color-mix(in oklch, var(--color-secondary) 35%, transparent);
  background: color-mix(in oklch, var(--color-base-300) 55%, transparent);
  transition:
    transform 120ms ease,
    border-color 120ms ease;
}
.cs .cs-choice:hover:not(:disabled),
.cs .cs-choice:focus-visible {
  border-color: var(--color-primary);
  transform: translateY(-1px);
}
.cs .cs-choice:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.cs .cs-card {
  border-radius: 1rem;
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 15%, transparent);
  background: color-mix(in oklch, var(--color-base-300) 45%, transparent);
}
.cs .cs-pill {
  display: inline-block;
  border-radius: 999px;
  padding: 0.05rem 0.5rem;
  font-size: 0.68rem;
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 25%, transparent);
}
.cs .cs-pill-good {
  border-color: var(--color-success);
  color: var(--color-success);
}
.cs .cs-pill-bad {
  border-color: var(--color-error);
  color: var(--color-error);
}
.cs .cs-pill-info,
.cs .cs-pill-odds {
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}
.cs .cs-tag {
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  background: rgb(0 0 0 / 0.6);
  color: #fff;
}
.cs .cs-tag-ward {
  background: color-mix(in oklch, var(--color-success) 70%, black);
}
.cs .cs-die {
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.6rem;
  font-weight: 800;
  font-size: 1.1rem;
  background: #fff;
  color: #1b0b33;
  box-shadow: 0 4px 0 rgb(0 0 0 / 0.4);
}
.cs .cs-die-win {
  outline: 3px solid var(--color-success);
}
.cs .cs-die-lose {
  outline: 3px solid var(--color-error);
}
.cs .cs-verdict {
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.cs .cs-verdict-win {
  color: var(--color-success);
}
.cs .cs-verdict-lose {
  color: var(--color-error);
}
.cs .cs-quote {
  font-style: italic;
  border-left: 3px solid var(--color-primary);
  padding-left: 0.6rem;
}
.cs .cs-stamp {
  border-radius: 0.6rem;
  padding: 0.25rem 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  transform: rotate(-4deg);
  background: rgb(0 0 0 / 0.7);
  border: 2px solid currentColor;
}
.cs .cs-stamp-best {
  color: var(--color-accent);
}
.cs .cs-bar-best {
  background-color: var(--color-accent);
}
.cs .cs-stamp-good {
  color: var(--color-success);
}
.cs .cs-bar-good {
  background-color: var(--color-success);
}
.cs .cs-stamp-bittersweet {
  color: var(--color-secondary);
}
.cs .cs-bar-bittersweet {
  background-color: var(--color-secondary);
}
.cs .cs-stamp-bad {
  color: var(--color-error);
}
.cs .cs-bar-bad {
  background-color: var(--color-error);
}
.cs .cs-polaroid {
  background: #f8f4ec;
  color: #1b0b33;
  padding: 0.6rem 0.6rem 0.9rem;
  border-radius: 0.4rem;
  box-shadow: 0 8px 18px rgb(0 0 0 / 0.45);
}
.cs .cs-polaroid:nth-child(odd) {
  transform: rotate(-1.2deg);
}
.cs .cs-polaroid:nth-child(even) {
  transform: rotate(1deg);
}
@media (prefers-reduced-motion: reduce) {
  .cs .cs-choice {
    transition: none;
  }
}
</style>
