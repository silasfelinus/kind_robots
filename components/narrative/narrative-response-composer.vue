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

    <fieldset v-if="options.length" class="flex flex-wrap gap-2">
      <legend class="sr-only">Suggested responses</legend>
      <button
        v-for="option in options"
        :key="option"
        type="button"
        class="btn btn-sm rounded-xl border border-secondary/30 bg-secondary/10 text-left normal-case hover:border-secondary/60 hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 motion-reduce:transform-none motion-reduce:transition-none"
        :disabled="disabled || loading"
        @click="submit(option)"
      >
        {{ option }}
      </button>
    </fieldset>

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
import { nextTick, ref, useId, watch } from 'vue'

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
