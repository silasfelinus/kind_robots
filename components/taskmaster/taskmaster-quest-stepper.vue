<template>
  <nav
    class="taskmaster-stepper relative z-20 grid grid-cols-3 overflow-hidden rounded-2xl border border-base-300/80 bg-base-100/90 p-1.5 shadow-xl backdrop-blur-xl"
    aria-label="Quest progress"
  >
    <div
      v-for="(step, index) in steps"
      :key="step.key"
      class="relative flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-2 text-center transition sm:justify-start sm:px-3"
      :class="index <= activeIndex ? 'text-base-content' : 'text-base-content/40'"
      :aria-current="step.key === active ? 'step' : undefined"
    >
      <span
        class="flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-black shadow-sm"
        :class="
          step.key === active
            ? 'border-secondary bg-secondary text-secondary-content'
            : index < activeIndex
              ? 'border-success bg-success text-success-content'
              : 'border-base-300 bg-base-200'
        "
      >
        <Icon
          v-if="index < activeIndex"
          name="kind-icon:check"
          class="size-3.5"
        />
        <template v-else>{{ index + 1 }}</template>
      </span>
      <span class="min-w-0">
        <span class="block truncate text-[0.7rem] font-black sm:text-xs">
          {{ step.label }}
        </span>
        <span class="hidden truncate text-[0.62rem] text-base-content/50 lg:block">
          {{ step.helper }}
        </span>
      </span>
      <span
        v-if="index < steps.length - 1"
        class="absolute -right-1 top-1/2 hidden h-px w-2 bg-base-300 sm:block"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type QuestStep = 'objective' | 'recipe' | 'review'

const props = withDefaults(
  defineProps<{
    active?: QuestStep
  }>(),
  {
    active: 'objective',
  },
)

const steps: Array<{ key: QuestStep; label: string; helper: string }> = [
  { key: 'objective', label: 'Objective', helper: 'Name the real target' },
  { key: 'recipe', label: 'Recipe', helper: 'Shape the adventure' },
  { key: 'review', label: 'Review', helper: 'Check before acting' },
]

const activeIndex = computed(() =>
  Math.max(
    0,
    steps.findIndex((step) => step.key === props.active),
  ),
)
</script>
