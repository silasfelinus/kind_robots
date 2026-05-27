<!-- components/scenarios/scenario-stage.vue -->
<template>
  <div class="flex h-full flex-col">
    <div
      v-if="!builder.activeCard"
      class="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <Icon name="kind-icon:layers" class="h-12 w-12 text-base-content/20" />
      <div>
        <p class="text-lg font-black text-base-content/40">No card selected</p>
        <p class="mt-1 text-sm text-base-content/30">
          Pick a card from the tray below.
        </p>
      </div>
      <button
        v-if="builder.visibleCards.length"
        type="button"
        class="btn btn-primary btn-sm rounded-xl"
        @click="builder.selectCard('genre')"
      >
        Start building
      </button>
    </div>

    <template v-else>
      <!-- Hero -->
      <div class="relative h-36 w-full shrink-0 overflow-hidden bg-base-300">
        <img
          v-if="builder.activeCard.heroImage"
          :src="builder.activeCard.heroImage"
          :alt="builder.activeCard.label"
          class="h-full w-full object-cover opacity-60"
        />
        <div
          class="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-base-100 p-5"
        >
          <p
            class="text-xs font-bold uppercase tracking-widest text-primary/70"
          >
            {{ builder.activeCard.label }}
          </p>
          <h2 class="text-2xl font-black leading-tight">
            {{ builder.activeCard.title }}
          </h2>
          <p class="mt-0.5 text-sm text-base-content/60">
            {{ builder.activeCard.tagline }}
          </p>
        </div>
      </div>

      <!-- Step content -->
      <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <p
          v-if="builder.activeStep?.narrative"
          class="text-sm leading-relaxed text-base-content/70"
        >
          {{ builder.activeStep.narrative }}
        </p>

        <!-- Genre: preset + multi-select chips -->
        <template
          v-if="
            builder.activeStep?.inputType === 'preset' &&
            builder.activeCard.key === 'genre'
          "
        >
          <div v-if="selectedGenres.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="g in selectedGenres"
              :key="g"
              class="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary"
            >
              {{ g }}
              <button type="button" @click="builder.removeGenre(g)">
                <Icon name="kind-icon:x" class="h-3 w-3" />
              </button>
            </span>
          </div>
          <adventure-preset />
          <!-- Finish genre card manually since auto-advance is disabled for multi-select -->
          <button
            type="button"
            class="btn btn-sm btn-outline rounded-xl self-start gap-1.5"
            @click="builder.finishCard()"
          >
            <Icon name="kind-icon:check" class="h-4 w-4" />
            Confirm genres
          </button>
        </template>

        <!-- Intros -->
        <scenario-intros
          v-else-if="builder.activeStep?.inputType === 'intros'"
        />

        <!-- Classification -->
        <scenario-classification
          v-else-if="builder.activeStep?.inputType === 'classification'"
        />

        <!-- Text / long -->
        <scenario-text
          v-else-if="
            builder.activeStep?.inputType === 'text' ||
            builder.activeStep?.inputType === 'long'
          "
        />

        <!-- Art -->
        <adventure-art v-else-if="builder.activeStep?.inputType === 'art'" />
      </div>

      <!-- Footer -->
      <div
        class="flex shrink-0 items-center justify-between border-t border-base-300 px-5 py-3"
      >
        <div class="flex gap-2">
          <button
            v-if="!builder.isFirstStep"
            type="button"
            class="btn btn-ghost btn-sm rounded-xl"
            @click="builder.prevStep()"
          >
            <Icon name="kind-icon:arrow-left" class="h-4 w-4" /> Back
          </button>
          <button
            v-if="!builder.activeCard?.required"
            type="button"
            class="btn btn-ghost btn-sm rounded-xl text-base-content/40"
            @click="builder.skipCard()"
          >
            Skip
          </button>
        </div>
        <!-- Don't show Next/Done on genre or intros cards — they have their own confirm -->
        <button
          v-if="builder.activeCard.key !== 'genre'"
          type="button"
          class="btn btn-primary btn-sm rounded-xl gap-1.5"
          @click="builder.finishCard()"
        >
          {{ builder.isLastStep ? 'Done' : 'Next' }}
          <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useScenarioBuilderStore } from '@/stores/scenarioBuilderStore'

const builder = useScenarioBuilderStore()

const selectedGenres = computed(() => {
  const raw =
    builder.stagedValues['scenarioGenre'] ?? builder.scenarioForm.genres ?? ''
  return typeof raw === 'string' && raw
    ? raw
        .split(', ')
        .map((s: string) => s.trim())
        .filter(Boolean)
    : []
})
</script>
