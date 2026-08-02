<!-- /components/narrative/kr-choice-list.vue -->
<!--
  One pick-one list, shared by every conversational surface.

  Silas, 2026-08-02: "a lot of these are just going to be variations of each
  other, so the more we can work on modular pieces for things like chat windows,
  multiple choice returns, and image presentations, the better."

  This replaces at least three separate implementations of the same idea:
  kr-narrator-stage's quick-topic buttons, workspace-narrator's per-message
  `followups` row, and the scenarios choice-* trio. They differed in styling and
  in nothing else that mattered.

  Purely presentational — it owns no store and no fetch, so it drops into a
  narrator stage, a chat bubble, or a scenario editor without dragging state
  along. All colour comes from daisyUI semantic tokens, so it inherits whichever
  reading mode the surrounding subtree declares (see useStorymakerMode) with no
  per-mode branching here.
-->
<template>
  <div
    v-if="choices.length"
    :class="[
      'flex gap-2',
      layout === 'stack' ? 'flex-col' : 'flex-wrap items-center',
    ]"
    role="group"
    :aria-label="label"
  >
    <p v-if="heading" class="w-full text-sm font-bold text-base-content/70">
      {{ heading }}
    </p>

    <button
      v-for="(choice, index) in choices"
      :key="choice.key"
      type="button"
      :class="[
        'flex items-center gap-3 rounded-xl border-2 border-base-300 bg-base-100 text-left transition',
        'hover:-translate-y-0.5 hover:border-primary/50',
        'disabled:pointer-events-none disabled:opacity-50',
        layout === 'stack' ? 'w-full px-4 py-3' : 'px-3 py-2',
        selectedKey === choice.key ? 'border-primary ring-2 ring-primary/30' : '',
      ]"
      :disabled="disabled || choice.disabled"
      :aria-pressed="selectedKey === choice.key"
      @click="emit('select', choice)"
    >
      <!-- The index badge is the storybook gesture: a numbered choice reads as
           a page you turn to, not a form control. Hidden in row layout, where
           the buttons sit inline as quick topics. -->
      <span
        v-if="layout === 'stack' && showIndex"
        class="grid size-7 shrink-0 place-items-center rounded-full bg-primary/12 text-sm font-bold text-primary"
        aria-hidden="true"
      >
        {{ index + 1 }}
      </span>

      <Icon
        v-else-if="choice.icon"
        :name="choice.icon"
        class="size-4 shrink-0 text-primary"
      />

      <span class="min-w-0">
        <span class="block text-sm font-semibold text-base-content">
          {{ choice.label }}
        </span>
        <span
          v-if="choice.hint"
          class="mt-0.5 block text-sm italic text-base-content/55"
        >
          {{ choice.hint }}
        </span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
export type NarrativeChoice = {
  key: string
  label: string
  hint?: string
  icon?: string
  disabled?: boolean
}

withDefaults(
  defineProps<{
    choices: NarrativeChoice[]
    /** 'stack' for a narration's numbered options, 'row' for inline quick topics. */
    layout?: 'stack' | 'row'
    heading?: string
    selectedKey?: string | null
    disabled?: boolean
    showIndex?: boolean
    label?: string
  }>(),
  {
    layout: 'stack',
    heading: '',
    selectedKey: null,
    disabled: false,
    showIndex: true,
    label: 'Choices',
  },
)

const emit = defineEmits<{ select: [choice: NarrativeChoice] }>()
</script>
