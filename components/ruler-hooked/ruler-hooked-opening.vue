<!-- The coronation: a once-per-reign painted slideshow. Each beat is a
     full-bleed painting with a storybook caption; the last is Quill. -->
<template>
  <section class="rh-screen rh-opening" aria-label="Coronation">
    <Transition name="rh-slide" mode="out-in">
      <RulerHookedArt
        :key="step"
        class="rh-backdrop"
        :candidates="beatArt"
        eager
        :position="beat.sceneRegion ? 'center 55%' : 'center 20%'"
      />
    </Transition>
    <div class="rh-opening__veil" aria-hidden="true" />
    <div class="rh-opening__caption rh-parchment">
      <p class="rh-eyebrow">
        {{ beat.heading }} · {{ step + 1 }} / {{ beats.length }}
      </p>
      <p class="rh-opening__text">{{ beat.text }}</p>
      <p v-if="!beat.sceneRegion" class="rh-opening__by">
        {{ narratorName }}, the Steward
      </p>
      <div class="rh-actions">
        <button
          type="button"
          class="rh-btn rh-btn--gold rh-btn--big"
          @click="advance"
        >
          {{ isLast ? 'Take up the rod' : 'Next' }}
        </button>
        <button v-if="step > 0" type="button" class="rh-btn" @click="step -= 1">
          Back
        </button>
        <button type="button" class="rh-opening__skip" @click="emit('skip')">
          Skip
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RULER_HOOKED_OPENING } from '~/utils/rulerHooked/opening'
import {
  characterCandidates,
  vistaCandidates,
  art,
} from '~/utils/rulerHooked/artLibrary'
import { useRulerHookedStore } from '~/stores/rulerHookedStore'

const emit = defineEmits<{ skip: []; done: [] }>()

const store = useRulerHookedStore()
const beats = RULER_HOOKED_OPENING.beats
const step = ref(0)
const beat = computed(() => beats[step.value] ?? beats[0]!)
const isLast = computed(() => step.value === beats.length - 1)

function advance() {
  if (isLast.value) emit('done')
  else step.value += 1
}

const beatArt = computed(() => {
  const region = beat.value.sceneRegion
  if (region) {
    return [
      ...vistaCandidates(region, store.scene?.regionStates[region], 'golden'),
      art('lake-clear-day'),
    ]
  }
  return [
    ...characterCandidates(RULER_HOOKED_OPENING.narratorSlug),
    art('lake-clear-day'),
  ]
})

const narratorName = computed(
  () =>
    store.bundle.characters.find(
      (c) => c.slug === RULER_HOOKED_OPENING.narratorSlug,
    )?.name ?? 'Quill',
)
</script>

<style scoped>
.rh-opening__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 45%, rgb(37 11 31 / 0.65));
  pointer-events: none;
}
.rh-opening__caption {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: clamp(0.75rem, 3cqi, 2rem);
  translate: -50% 0;
  width: min(42rem, calc(100% - 1.5rem));
  display: grid;
  gap: 0.5rem;
}
.rh-opening__text {
  font-family: var(--rh-display);
  font-size: clamp(1rem, 2.2cqi, 1.3rem);
  line-height: 1.4;
}
.rh-opening__by {
  font-style: italic;
  opacity: 0.75;
}
.rh-opening__skip {
  margin-left: auto;
  text-decoration: underline;
  opacity: 0.7;
  min-height: 2.5rem;
}
.rh-slide-enter-active,
.rh-slide-leave-active {
  transition:
    opacity 450ms ease,
    transform 900ms ease;
}
.rh-slide-enter-from {
  opacity: 0;
  transform: scale(1.04);
}
.rh-slide-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .rh-slide-enter-active,
  .rh-slide-leave-active {
    transition: none;
  }
}
</style>
