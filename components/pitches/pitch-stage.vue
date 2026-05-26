<!-- components/pitch/pitch-stage.vue -->
<!-- Active card display for the pitch builder. -->
<template>
  <div class="flex h-full flex-col">
    <!-- No active card -->
    <div
      v-if="!store.activeCard"
      class="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <Icon name="kind-icon:layers" class="h-12 w-12 text-base-content/20" />
      <div>
        <p class="text-lg font-black text-base-content/40">No card selected</p>
        <p class="mt-1 text-sm text-base-content/30">
          Pick a card from the tray below to start building your pitch.
        </p>
      </div>
      <button
        v-if="store.visibleCards.length"
        type="button"
        class="btn btn-primary btn-sm rounded-xl"
        @click="store.selectCard('type')"
      >
        Start building
      </button>
    </div>

    <!-- Active card -->
    <template v-else>
      <!-- Hero image -->
      <div class="relative h-36 w-full shrink-0 overflow-hidden bg-base-300">
        <img
          v-if="store.activeCard.heroImage"
          :src="store.activeCard.heroImage"
          :alt="store.activeCard.label"
          class="h-full w-full object-cover opacity-60"
        />
        <div
          class="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-base-100 p-5"
        >
          <p
            class="text-xs font-bold uppercase tracking-widest text-primary/70"
          >
            {{ store.activeCard.label }}
          </p>
          <h2 class="text-2xl font-black leading-tight text-base-content">
            {{ store.activeCard.title }}
          </h2>
          <p class="mt-0.5 text-sm text-base-content/60">
            {{ store.activeCard.tagline }}
          </p>
        </div>
      </div>

      <!-- Step content -->
      <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <!-- Step narrative -->
        <p
          v-if="store.activeStep?.narrative"
          class="text-sm leading-relaxed text-base-content/70"
        >
          {{ store.activeStep.narrative }}
        </p>

        <!-- Preset choices -->
        <adventure-preset v-if="store.activeStep?.inputType === 'preset'" />

        <!-- Text input -->
        <pitch-text v-else-if="store.activeStep?.inputType === 'text'" />

        <!-- Icon picker -->
        <pitch-icon v-else-if="store.activeStep?.inputType === 'icon'" />

        <!-- Art step -->
        <adventure-art v-else-if="store.activeStep?.inputType === 'art'" />
      </div>

      <!-- Step footer: back / skip / finish -->
      <div
        class="flex shrink-0 items-center justify-between border-t border-base-300 px-5 py-3"
      >
        <div class="flex gap-2">
          <button
            v-if="!store.isFirstStep"
            type="button"
            class="btn btn-ghost btn-sm rounded-xl"
            @click="store.prevStep()"
          >
            <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
            Back
          </button>
          <button
            v-if="store.activeCard?.steps[0]?.optional"
            type="button"
            class="btn btn-ghost btn-sm rounded-xl text-base-content/40"
            @click="store.skipCard()"
          >
            Skip
          </button>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-sm rounded-xl gap-1.5"
          @click="store.finishCard()"
        >
          {{ store.isLastStep ? 'Done' : 'Next' }}
          <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { usePitchBuilderStore } from '@/stores/pitchBuilderStore'
const store = usePitchBuilderStore()
</script>
