<template>
  <nav class="@container flex shrink-0 items-center gap-2" :aria-label="label">
    <div
      role="tablist"
      :aria-label="label"
      class="flex min-w-0 flex-1 gap-1 rounded-full border border-base-300 bg-base-200 p-1 shadow-sm"
      @keydown="onKey"
    >
      <button
        v-for="tab in tabs"
        :id="`${idPrefix}-${tab.key}-tab`"
        :key="tab.key"
        ref="buttons"
        type="button"
        role="tab"
        :aria-selected="modelValue === tab.key"
        :aria-controls="`${idPrefix}-${tab.key}`"
        :tabindex="modelValue === tab.key ? 0 : -1"
        class="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-2 py-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary @lg:px-4"
        :class="
          modelValue === tab.key
            ? 'bg-primary text-primary-content shadow'
            : 'text-base-content/70 hover:bg-base-300 hover:text-base-content'
        "
        @click="emit('update:modelValue', tab.key)"
      >
        <Icon
          v-if="tab.icon"
          :name="tab.icon"
          class="h-5 w-5 shrink-0"
          aria-hidden="true"
        />
        <span
          :class="
            tab.icon ? 'sr-only @md:not-sr-only @md:truncate' : 'truncate'
          "
        >
          {{ tab.label }}
        </span>
      </button>
    </div>
    <slot />
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export type ConsoleTab = { key: string; label: string; icon?: string }

const props = defineProps<{
  tabs: readonly ConsoleTab[]
  modelValue: string
  label: string
  idPrefix: string
}>()
const emit = defineEmits<{ 'update:modelValue': [key: string] }>()
const buttons = ref<HTMLButtonElement[]>([])

function onKey(event: KeyboardEvent) {
  const index = props.tabs.findIndex((tab) => tab.key === props.modelValue)
  const last = props.tabs.length - 1
  const next =
    event.key === 'ArrowRight'
      ? (index + 1) % props.tabs.length
      : event.key === 'ArrowLeft'
        ? (index + last) % props.tabs.length
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? last
            : -1
  if (next < 0) return
  event.preventDefault()
  emit('update:modelValue', props.tabs[next]!.key)
  buttons.value[next]?.focus()
}
</script>
