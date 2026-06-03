<!-- components/adventure/adventure-stage.vue -->
<!--
  The center hero zone of the adventure builder.
  Layout (top to bottom):
    ① Full-bleed card/step hero image with gradient overlay
    ② Card title + step title
    ③ Narrative prose
    ④ adventure-choices (routed input panel)
    ⑤ Nav: Back / Suggest / Next / Finish / Cancel

  No props. No emits. Pure store-driven display.
  LLM suggest for needsLLM steps is delegated to adventure-text internally;
  this component handles the non-LLM suggest dispatch for non-text steps.
-->
<template>
  <div
    class="stage relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl"
  >
    <!-- ① Hero image -->
    <div class="hero-image-zone relative shrink-0 overflow-hidden">
      <Transition name="hero-crossfade" mode="out-in">
        <img
          v-if="heroImage"
          :key="heroImage"
          :src="heroImage"
          :alt="activeCard?.title ?? 'Adventure card'"
          class="h-full w-full object-cover"
        />

        <!-- Fallback: atmospheric gradient with flourish -->
        <div
          v-else
          :key="`fallback-${activeCard?.key ?? 'empty'}`"
          class="flex h-full w-full items-center justify-center bg-base-300"
        >
          <span
            class="text-9xl opacity-10 select-none transition-all duration-500"
            :style="{ fontSize: '8rem' }"
          >
            {{ activeCard?.flourish ?? '✦' }}
          </span>
        </div>
      </Transition>

      <!-- Gradient overlay — heavier at the bottom where text begins -->
      <div
        class="absolute inset-0 bg-linear-to-b from-transparent via-base-100/40 to-base-100"
      />

      <!-- Card label chip — top left -->
      <div
        v-if="activeCard"
        class="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-base-100/70 px-3 py-1 backdrop-blur-sm"
      >
        <Icon :name="activeCard.icon" class="h-3.5 w-3.5 text-primary" />
        <span
          class="text-xs font-black uppercase tracking-wider text-base-content/80"
        >
          {{ activeCard.label }}
        </span>
      </div>

      <!-- Step progress dots — top right -->
      <div
        v-if="activeCard && activeCard.steps.length > 1"
        class="absolute right-4 top-4 flex gap-1.5"
      >
        <div
          v-for="(step, i) in activeCard.steps"
          :key="step.key"
          class="h-1.5 rounded-full transition-all duration-300"
          :class="[
            i === store.activeStepIndex
              ? 'w-5 bg-primary shadow-sm shadow-primary/50'
              : i < store.activeStepIndex
                ? 'w-1.5 bg-primary/50'
                : 'w-1.5 bg-white/30',
          ]"
        />
      </div>
    </div>

    <!-- ②③ Title + narrative -->
    <div class="narrative-zone shrink-0 px-5 pt-4">
      <Transition name="narrative-slide" mode="out-in">
        <div :key="`narrative-${activeStep?.key ?? 'empty'}`">
          <!-- Step title (smaller, secondary) -->
          <p
            v-if="
              activeCard && activeStep && activeCard.title !== activeStep.title
            "
            class="text-xs font-bold uppercase tracking-[0.2em] text-primary/70"
          >
            {{ activeStep.title }}
          </p>

          <!-- Card title (main heading) -->
          <h2
            class="mt-0.5 text-2xl font-black leading-tight text-base-content"
          >
            {{ activeStep?.title ?? activeCard?.title ?? 'Choose your path' }}
          </h2>

          <!-- Narrative prose -->
          <p
            class="mt-2 text-sm leading-relaxed text-base-content/65 line-clamp-3"
          >
            {{ activeStep?.narrative ?? activeCard?.narrative ?? '' }}
          </p>
        </div>
      </Transition>
    </div>

    <!-- ④ Input panel -->
    <div class="input-zone min-h-0 flex-1 overflow-y-auto px-5 py-4">
      <Transition name="input-fade" mode="out-in">
        <adventure-choices
          v-if="activeCard"
          :key="`choices-${activeStep?.key ?? 'empty'}`"
        />

        <!-- No active card -->
        <div
          v-else
          class="flex h-full flex-col items-center justify-center gap-4 py-12 text-center"
        >
          <span class="text-6xl opacity-20 select-none">{{
            ambientFlourish
          }}</span>
          <div>
            <p class="font-black text-base-content/40">The deck awaits.</p>
            <p class="mt-1 text-sm text-base-content/30">
              Select a card from the hand below to begin.
            </p>
          </div>

          <button
            v-if="store.visibleCards.length"
            type="button"
            class="btn btn-primary rounded-2xl gap-2 mt-2"
            @click="store.randomCard"
          >
            <Icon name="kind-icon:dice" class="h-4 w-4" />
            Draw a card
          </button>
        </div>
      </Transition>
    </div>

    <!-- ⑤ Nav bar -->
    <Transition name="nav-slide">
      <footer
        v-if="activeCard"
        class="nav-bar shrink-0 border-t border-base-300 bg-base-100/95 px-4 py-3 backdrop-blur-sm"
      >
        <div class="flex flex-wrap items-center gap-2">
          <!-- Back -->
          <button
            v-if="!store.isFirstStep"
            type="button"
            class="btn btn-sm btn-ghost gap-1.5 rounded-xl"
            @click="store.prevStep"
          >
            <Icon name="kind-icon:arrow-left" class="h-3.5 w-3.5" />
            Back
          </button>

          <!-- Spacer -->
          <div class="flex-1" />

          <!-- Suggest (non-LLM steps only — LLM steps handle suggest internally) -->
          <button
            v-if="showSuggestButton"
            type="button"
            class="btn btn-sm btn-ghost gap-1.5 rounded-xl border border-base-300 hover:border-secondary hover:bg-secondary/10"
            @click="store.suggestCurrentStep"
          >
            <Icon name="kind-icon:dice" class="h-3.5 w-3.5" />
            Suggest
          </button>

          <!-- Cancel -->
          <button
            type="button"
            class="btn btn-sm btn-ghost gap-1.5 rounded-xl text-base-content/50 hover:text-error"
            @click="store.cancelCard"
          >
            <Icon name="kind-icon:x" class="h-3.5 w-3.5" />
            Cancel
          </button>

          <!-- Next / Finish -->
          <button
            v-if="!store.isLastStep"
            type="button"
            class="btn btn-sm btn-primary gap-1.5 rounded-xl"
            @click="store.nextStep"
          >
            Next
            <Icon name="kind-icon:arrow-right" class="h-3.5 w-3.5" />
          </button>

          <button
            v-else
            type="button"
            class="btn btn-sm btn-primary gap-1.5 rounded-xl"
            :disabled="!store.canFinish"
            @click="store.finishCard"
          >
            <Icon name="kind-icon:check" class="h-3.5 w-3.5" />
            {{ finishLabel }}
          </button>
        </div>

        <!-- Save error -->
        <Transition name="fade">
          <p v-if="store.saveError" class="mt-2 text-xs text-error">
            {{ store.saveError }}
          </p>
        </Transition>
      </footer>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAdventureStore } from '@/stores/adventureStore'

const store = useAdventureStore()

// ── Derived display values ──────────────────────────────────────────────────

const activeCard = computed(() => store.activeCard)
const activeStep = computed(() => store.activeStep)

/** Step hero image overrides card hero image */
const heroImage = computed(
  () => activeStep.value?.heroImage ?? activeCard.value?.heroImage ?? null,
)

/** Suggest button is shown for non-LLM, non-text steps.
 *  Text/long steps have their own suggest button inside adventure-text.
 *  Art steps handle their own suggestion flow.
 */
const showSuggestButton = computed(() => {
  const type = activeStep.value?.inputType
  return type === 'stats' || type === 'reward'
})

const finishLabel = computed(() => {
  const type = activeStep.value?.inputType
  if (type === 'art') return 'Save Portrait'
  if (type === 'reward') return 'Choose Skill'
  if (type === 'stats') return 'Lock In'
  return 'Add to Sheet'
})

// Cycling flourishes for the empty state
const FLOURISHES = ['⚜', '✒', '❦', '☾', '✦', '♛', '§', '✧', '✶', '❋', '▣']
const ambientFlourish = computed(() => {
  const completed = Object.keys(store.completedCards).length
  return FLOURISHES[completed % FLOURISHES.length] ?? '✦'
})
</script>

<style scoped>
/* Hero image zone — fixed height, grows on larger screens */
.hero-image-zone {
  height: 180px;
}
@media (min-height: 700px) {
  .hero-image-zone {
    height: 220px;
  }
}
@media (min-height: 900px) {
  .hero-image-zone {
    height: 260px;
  }
}

/* Hero crossfade */
.hero-crossfade-enter-active {
  transition: opacity 400ms ease;
}
.hero-crossfade-leave-active {
  transition: opacity 200ms ease;
  position: absolute;
  inset: 0;
}
.hero-crossfade-enter-from,
.hero-crossfade-leave-to {
  opacity: 0;
}

/* Narrative slide */
.narrative-slide-enter-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}
.narrative-slide-leave-active {
  transition: opacity 120ms ease;
}
.narrative-slide-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.narrative-slide-leave-to {
  opacity: 0;
}

/* Input crossfade */
.input-fade-enter-active {
  transition: opacity 200ms ease;
  transition-delay: 60ms;
}
.input-fade-leave-active {
  transition: opacity 120ms ease;
}
.input-fade-enter-from,
.input-fade-leave-to {
  opacity: 0;
}

/* Nav slide up */
.nav-slide-enter-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}
.nav-slide-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.nav-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.nav-slide-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
