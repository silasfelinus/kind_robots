<!-- /components/narrative/narrative-response-composer.vue -->
<template>
  <form
    class="space-y-2 rounded-2xl border border-base-300 bg-base-200/50 p-3"
    @submit.prevent="submit()"
  >
    <div v-if="options.length" class="flex flex-wrap gap-2">
      <button
        v-for="option in options"
        :key="option"
        type="button"
        class="btn btn-sm rounded-xl border border-secondary/30 bg-secondary/10 text-left normal-case hover:border-secondary/60 hover:bg-secondary/20"
        :disabled="disabled || loading"
        @click="submit(option)"
      >
        {{ option }}
      </button>
    </div>

    <div class="flex items-end gap-2">
      <textarea
        :value="modelValue"
        rows="2"
        class="textarea textarea-bordered min-h-0 w-full flex-1 rounded-xl text-sm leading-relaxed"
        :placeholder="placeholder"
        :disabled="disabled || loading"
        @input="updateValue"
        @keydown.enter.exact.prevent="submit()"
      />
      <button
        type="submit"
        class="btn btn-secondary rounded-xl"
        :disabled="disabled || loading || !modelValue.trim()"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm" />
        <Icon v-else :name="icon" class="size-4" />
        <span class="hidden sm:inline">{{ buttonLabel }}</span>
      </button>
    </div>

    <p v-if="hint" class="text-[0.7rem] leading-relaxed text-base-content/45">
      {{ hint }}
    </p>
  </form>
</template>

<script setup lang="ts">
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

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

function submit(value = props.modelValue) {
  const text = value.trim()
  if (!text || props.disabled || props.loading) return
  emit('submit', text)
}
</script>
