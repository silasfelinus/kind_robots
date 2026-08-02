<!-- /components/narrative/narrative-response-composer.vue -->
<template>
  <form
    class="space-y-2 rounded-2xl border border-base-300 bg-base-200/50 p-3"
    :aria-busy="loading"
    @submit.prevent="submit()"
  >
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ loading ? 'Generating the next scene.' : 'The response field is ready.' }}
    </p>

    <!-- The suggested-response row was a fourth hand-rolled pick-one list. It
         is kr-choice-list now, which keeps the named group (role="group" +
         aria-label, where this had fieldset + sr-only legend) and gives the
         composer the same choice affordance every other surface renders. -->
    <kr-choice-list
      layout="row"
      label="Suggested responses"
      :choices="optionChoices"
      :disabled="disabled || loading"
      :show-index="false"
      @select="submit($event.label)"
    />

    <div class="flex items-end gap-2">
      <label :for="textareaId" class="sr-only">Your response</label>
      <textarea
        :id="textareaId"
        ref="textareaElement"
        :value="modelValue"
        rows="2"
        class="textarea textarea-bordered min-h-0 w-full flex-1 rounded-xl text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70"
        :placeholder="placeholder"
        :disabled="disabled || loading"
        :aria-describedby="hint ? hintId : undefined"
        @input="updateValue"
        @keydown.enter.exact.prevent="submit()"
      />
      <button
        type="submit"
        class="btn btn-secondary rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 motion-reduce:transform-none motion-reduce:transition-none"
        :disabled="disabled || loading || !modelValue.trim()"
        :aria-label="buttonLabel"
      >
        <span
          v-if="loading"
          class="loading loading-spinner loading-sm motion-reduce:hidden"
          aria-hidden="true"
        />
        <Icon v-else :name="icon" class="size-4" aria-hidden="true" />
        <span class="hidden sm:inline">{{ buttonLabel }}</span>
      </button>
    </div>

    <p
      v-if="hint"
      :id="hintId"
      class="text-[0.7rem] leading-relaxed text-base-content/45"
    >
      {{ hint }}
    </p>
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    options?: string[]
    disabled?: boolean
    loading?: boolean
    placeholder?: string
    buttonLabel?: string
    icon?: string
    hint?: string
  }>(),
  {
    options: () => [],
    disabled: false,
    loading: false,
    placeholder: 'What do you do?',
    buttonLabel: 'Continue',
    icon: 'kind-icon:sparkles',
    hint: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: [value: string]
}>()

// Suggested responses arrive as plain strings; the shared list speaks
// {key,label}. Adapt here rather than widening every caller.
const optionChoices = computed(() =>
  props.options.map((option) => ({ key: option, label: option })),
)

const fieldId = useId()
const textareaId = `${fieldId}-response`
const hintId = `${fieldId}-hint`
const textareaElement = ref<HTMLTextAreaElement | null>(null)

watch(
  () => [props.loading, props.disabled] as const,
  async ([loading, disabled], previous) => {
    const wasLoading = previous?.[0] ?? false
    if (!wasLoading || loading || disabled) return
    await nextTick()
    textareaElement.value?.focus({ preventScroll: true })
  },
)

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

function submit(value = props.modelValue) {
  const text = value.trim()
  if (!text || props.disabled || props.loading) return
  emit('submit', text)
}
</script>
