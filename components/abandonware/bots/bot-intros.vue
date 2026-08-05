<!-- /components/bots/bot-intros.vue -->
<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="btn btn-ghost btn-sm gap-1.5 rounded-xl border border-base-300"
        :disabled="!canGenerate || isSuggesting"
        @click="generateIntro"
      >
        <span v-if="isSuggesting" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
        Generate from prompt
      </button>

      <p class="text-xs text-base-content/40">
        {{ fieldLabel }}
      </p>
    </div>

    <div
      class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div class="flex items-center justify-between">
        <span
          class="text-xs font-black uppercase tracking-widest text-primary/70"
        >
          {{ fieldLabel }}
        </span>
      </div>

      <textarea
        :value="introText"
        class="textarea textarea-bordered w-full resize-none rounded-xl bg-base-200 text-sm leading-relaxed focus:border-primary focus:outline-none"
        rows="4"
        :placeholder="placeholder"
        @input="setIntro(($event.target as HTMLTextAreaElement).value)"
      />

      <button
        type="button"
        class="btn btn-ghost btn-xs self-start rounded-xl border border-base-300 text-xs"
        :disabled="isSuggesting"
        @click="generateIntro"
      >
        <Icon name="kind-icon:sparkles" class="h-3 w-3" />
        {{ introText.trim() ? 'Refine' : 'Generate' }}
      </button>
    </div>

    <p v-if="builder.lastError" class="text-xs text-error">
      {{ builder.lastError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const props = withDefaults(
  defineProps<{
    field?: 'botIntro' | 'userIntro'
  }>(),
  {
    field: 'botIntro',
  },
)

const builder = useBuilderStore()

const isSuggesting = computed(() => {
  return Boolean(builder.isSuggesting || builder.isSaving)
})

const introText = computed(() => {
  const value = builder.sheet[props.field]

  return typeof value === 'string' ? value : ''
})

const fieldLabel = computed(() => {
  return props.field === 'userIntro' ? 'User opener' : 'Bot opener'
})

const placeholder = computed(() => {
  return props.field === 'userIntro'
    ? 'The kind of thing a user might say to start the interaction...'
    : 'Hello! I am here to help you build something interesting...'
})

const canGenerate = computed(() => {
  return Boolean(sheetText('prompt').trim() || sheetText('name').trim())
})

function sheetText(key: string): string {
  const value = builder.sheet[key]

  return typeof value === 'string' ? value : ''
}

function setIntro(value: string) {
  builder.updateSheet({
    [props.field]: value,
  })
}

async function generateIntro() {
  const result = await builder.callSuggest(
    props.field,
    props.field,
    introText.value,
  )

  if (!result.success || !result.message) return

  setIntro(result.message)
}
</script>
