<!-- /components/builder/builder-preset-input.vue -->
<template>
  <div v-if="step" class="flex min-h-0 flex-col gap-4">
    <div
      v-if="step.choices?.length"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      <button
        v-for="choice in step.choices"
        :key="choiceKey(choice)"
        type="button"
        class="group relative overflow-hidden rounded-2xl border-2 bg-base-200 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        :class="choiceClass(choice)"
        @click="handleChoice(choice)"
      >
        <div class="aspect-4/5 overflow-hidden bg-base-300">
          <img
            v-if="choice.image"
            :src="choice.image"
            :alt="choice.label"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          <div
            v-else
            class="flex h-full w-full items-center justify-center text-primary/60"
          >
            <Icon :name="choice.icon || iconName" class="h-14 w-14" />
          </div>
        </div>

        <div
          class="flex min-h-16 items-center justify-center bg-base-100/95 p-3 text-center"
        >
          <p
            class="text-sm font-black leading-tight text-base-content sm:text-base"
          >
            {{ choice.label }}
          </p>
        </div>

        <div
          v-if="isSelected(choice)"
          class="absolute right-2 top-2 rounded-full bg-primary p-1.5 text-primary-content shadow"
        >
          <Icon name="kind-icon:check" class="h-4 w-4" />
        </div>
      </button>
    </div>

    <div
      v-if="expandedListOptions.length"
      class="rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <p
        class="mb-2 text-xs font-black uppercase tracking-widest text-base-content/50"
      >
        More options
      </p>

      <div class="flex max-h-60 flex-wrap gap-2 overflow-y-auto pr-1">
        <button
          v-for="option in expandedListOptions"
          :key="option"
          type="button"
          class="btn btn-xs rounded-xl"
          :class="
            store.activeStepValue === option
              ? 'btn-primary'
              : 'btn-ghost border border-base-300'
          "
          @click="store.selectPresetChoice(step.key, option)"
        >
          {{ option }}
        </button>
      </div>
    </div>

    <label v-if="showCustom || hasCustomChoice" class="form-control">
      <div class="label pb-1">
        <span class="label-text font-bold">Custom value</span>
      </div>

      <input
        :value="store.stagedValues[step.key] ?? ''"
        type="text"
        class="input input-bordered rounded-2xl bg-base-100 focus:border-primary"
        :placeholder="step.placeholder || 'Write your own...'"
        @input="
          store.setStagedValue(
            step.key,
            ($event.target as HTMLInputElement).value,
          )
        "
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'
import type { BuilderChoice } from '@/stores/helpers/builderCards'

const store = useBuilderStore()
const showCustom = ref(false)
const expandedListOptions = ref<string[]>([])

const step = computed(() => store.activeStep)
const iconName = computed(() => store.activeCard?.icon || 'kind-icon:cards')

const selectedValues = computed(() =>
  step.value ? (store.selectedChoiceValues[step.value.key] ?? []) : [],
)

const hasCustomChoice = computed(() =>
  Boolean(step.value?.choices?.some((choice) => choice.opensCustom)),
)

function choiceKey(choice: BuilderChoice): string {
  return `${choice.label}-${choice.value || choice.opensCustom || choice.opensList}`
}

function isSelected(choice: BuilderChoice): boolean {
  if (!step.value) return false
  if (step.value.multiSelect) return selectedValues.value.includes(choice.value)
  return Boolean(choice.value && store.activeStepValue === choice.value)
}

function choiceClass(choice: BuilderChoice): string {
  if (isSelected(choice)) {
    return 'border-primary bg-primary/10 shadow shadow-primary/20'
  }

  return 'border-base-300 hover:border-primary/60'
}

function handleChoice(choice: BuilderChoice): void {
  if (!step.value) return

  if (choice.opensCustom) {
    showCustom.value = true
    expandedListOptions.value = []
    return
  }

  if (choice.opensList) {
    expandedListOptions.value = choice.listOptions ?? []
    showCustom.value = false
    return
  }

  store.selectPresetChoice(step.value.key, choice.value)

  store.activeSelectionPreview = {
    key: choice.value || choice.label,
    stepKey: step.value.key,
    label: choice.label,
    value: choice.value,
    field: step.value.field,
    image: choice.image ?? null,
    icon: choice.icon || iconName.value,
    description: choice.subtext ?? '',
    narrative: step.value.narrative,
    tags: [],
  }
}
</script>
