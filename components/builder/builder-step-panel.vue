<!-- /components/builder/builder-step-panel.vue -->
<template>
  <article
    v-if="store.activeCard && store.activeStep"
    class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
  >
    <section
      class="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    >
      <template v-if="store.activeSelectionPreview">
        <div class="flex h-full min-h-0 flex-col overflow-hidden">
          <section
            class="grid h-full min-h-0 flex-1 overflow-hidden rounded-2xl border border-primary/30 bg-base-100 shadow-xl lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]"
          >
            <figure class="relative min-h-0 overflow-hidden bg-base-300">
              <img
                v-if="store.activeSelectionPreview.image"
                :src="store.activeSelectionPreview.image"
                :alt="store.activeSelectionPreview.label"
                class="h-full max-h-[42dvh] w-full object-cover sm:max-h-[48dvh] lg:max-h-none lg:object-cover"
                loading="eager"
              />

              <div
                v-else
                class="flex h-full min-h-64 items-center justify-center bg-base-200 text-primary/60"
              >
                <Icon
                  :name="
                    store.activeSelectionPreview.icon ||
                    store.activeCard?.icon ||
                    'kind-icon:cards'
                  "
                  class="h-24 w-24"
                />
              </div>

              <div
                class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-base-100/90 to-transparent lg:hidden"
              />
            </figure>

            <section
              class="flex min-h-0 flex-col justify-between gap-4 p-4 sm:p-5 lg:p-6"
            >
              <div class="min-h-0">
                <div class="mb-3 flex items-center gap-2">
                  <span
                    class="rounded-full bg-primary/15 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary"
                  >
                    Confirm choice
                  </span>

                  <span
                    v-if="store.activeCard?.label"
                    class="hidden rounded-full bg-base-200 px-3 py-1 text-xs font-bold text-base-content/60 sm:inline-flex"
                  >
                    {{ store.activeCard.label }}
                  </span>
                </div>

                <h2
                  class="text-4xl font-black leading-none text-base-content sm:text-5xl lg:text-6xl"
                >
                  {{ store.activeSelectionPreview.label }}
                </h2>

                <p
                  v-if="store.activeSelectionPreview.description"
                  class="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-base-content/75 sm:text-lg lg:text-xl"
                >
                  {{ store.activeSelectionPreview.description }}
                </p>

                <p
                  v-if="store.activeSelectionPreview.narrative"
                  class="mt-4 hidden max-w-2xl text-sm leading-relaxed text-base-content/55 sm:block lg:text-base"
                >
                  {{ store.activeSelectionPreview.narrative }}
                </p>
              </div>

              <div
                class="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center"
              >
                <button
                  type="button"
                  class="btn btn-ghost rounded-2xl border border-base-300"
                  @click="store.activeSelectionPreview = null"
                >
                  <Icon name="kind-icon:back" class="h-4 w-4" />
                  Back
                </button>

                <button
                  type="button"
                  class="btn btn-primary rounded-2xl sm:min-w-44"
                  :disabled="!store.canFinish"
                  @click="store.confirmSelectionPreview()"
                >
                  <Icon name="kind-icon:check" class="h-4 w-4" />
                  Confirm
                </button>
              </div>
            </section>
          </section>
        </div>
      </template>

      <template v-else>
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
      </template>
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
