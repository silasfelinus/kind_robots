<template>
  <article
    v-if="store.activeCard && store.activeStep"
    class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
  >
    <section
      class="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    >
      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <div class="flex min-h-full flex-col gap-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p
                class="text-xs font-black uppercase tracking-widest text-primary/70"
              >
                {{ store.activeCard.label }} · Step
                {{ store.activeStepIndex + 1 }} of
                {{ store.activeCard.steps.length }}
              </p>

              <h2 class="text-2xl font-black leading-tight text-base-content">
                {{ store.activeStep.title }}
              </h2>

              <p
                v-if="store.activeStep.narrative"
                class="mt-2 text-sm leading-relaxed text-base-content/65"
              >
                {{ store.activeStep.narrative }}
              </p>
            </div>

            <button
              type="button"
              class="btn btn-sm btn-ghost shrink-0 rounded-xl"
              @click="store.cancelCard()"
            >
              <Icon name="kind-icon:x" class="h-4 w-4" />
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <span
              v-for="step in store.activeCard.steps"
              :key="step.key"
              class="badge rounded-xl"
              :class="
                step.key === store.activeStep.key
                  ? 'badge-primary'
                  : 'badge-outline'
              "
            >
              {{ step.title }}
            </span>
          </div>

          <builder-input />

          <div class="min-h-4 flex-1" />
        </div>
      </div>

      <div class="shrink-0 border-t border-base-300 bg-base-100 p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex gap-2">
            <button
              type="button"
              class="btn btn-sm rounded-xl"
              :disabled="store.isFirstStep"
              @click="store.prevStep()"
            >
              <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
              Back
            </button>

            <button
              v-if="!store.isLastStep"
              type="button"
              class="btn btn-sm btn-primary rounded-xl"
              @click="store.nextStep()"
            >
              Next
              <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
            </button>

            <button
              v-else
              type="button"
              class="btn btn-sm btn-primary rounded-xl"
              :disabled="!store.canFinish"
              @click="store.finishCard()"
            >
              <Icon name="kind-icon:check" class="h-4 w-4" />
              Finish card
            </button>
          </div>

          <button
            v-if="canSuggest"
            type="button"
            class="btn btn-sm btn-ghost rounded-xl border border-base-300"
            :disabled="store.isSuggesting"
            @click="store.callSuggest()"
          >
            <span
              v-if="store.isSuggesting"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
            Suggest
          </button>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()

const canSuggest = computed(() => {
  const step = store.activeStep
  return Boolean(step?.needsLLM || step?.suggestField || step?.field)
})
</script>
