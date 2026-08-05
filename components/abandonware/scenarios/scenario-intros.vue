<!-- /components/scenarios/scenario-intros.vue -->
<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="btn btn-ghost btn-sm gap-1.5 rounded-xl border border-base-300"
        :disabled="!canGenerate || isSuggesting"
        @click="generateAllIntros"
      >
        <span v-if="isSuggesting" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
        Generate all from description
      </button>

      <p class="text-xs text-base-content/40">
        {{ introEntries.length }}/5 intros
      </p>
    </div>

    <div
      v-for="(intro, index) in introEntries"
      :key="index"
      class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div class="flex items-center justify-between">
        <span
          class="text-xs font-black uppercase tracking-widest text-primary/70"
        >
          Intro {{ index + 1 }}
        </span>

        <button
          v-if="introEntries.length > 1"
          type="button"
          class="text-base-content/30 transition-colors hover:text-error"
          @click="removeIntro(index)"
        >
          <Icon name="kind-icon:x" class="h-3.5 w-3.5" />
        </button>
      </div>

      <textarea
        :value="intro"
        class="textarea textarea-bordered w-full resize-none rounded-xl bg-base-200 text-sm leading-relaxed focus:border-primary focus:outline-none"
        rows="4"
        :placeholder="
          index === 0
            ? 'TITLE IN CAPS: The situation opens dramatically with...'
            : `Intro ${index + 1}: Another way into the scenario...`
        "
        @input="setIntro(index, ($event.target as HTMLTextAreaElement).value)"
      />

      <button
        type="button"
        class="btn btn-ghost btn-xs self-start rounded-xl border border-base-300 text-xs"
        :disabled="isSuggesting"
        @click="refineIntro(index, intro)"
      >
        <Icon name="kind-icon:sparkles" class="h-3 w-3" />
        {{ intro.trim() ? 'Refine' : 'Generate' }}
      </button>
    </div>

    <button
      v-if="introEntries.length < 5"
      type="button"
      class="btn btn-ghost btn-sm w-full gap-1.5 rounded-xl border border-dashed border-base-300 hover:border-primary/40"
      @click="addIntro"
    >
      <Icon name="kind-icon:plus" class="h-4 w-4" />
      Add another intro
    </button>

    <p v-if="builder.lastError" class="text-xs text-error">
      {{ builder.lastError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const builder = useBuilderStore()

const isSuggesting = computed(() => {
  return Boolean(builder.isSuggesting || builder.isSaving)
})

const introEntries = computed<string[]>(() => {
  const value = builder.sheet.intros

  if (Array.isArray(value)) {
    const entries = value.filter((entry): entry is string => {
      return typeof entry === 'string'
    })

    return entries.length ? entries.slice(0, 5) : ['']
  }

  if (typeof value === 'string') {
    const entries = value
      .split('\n---\n')
      .map((entry) => entry.trim())
      .filter(Boolean)

    return entries.length ? entries.slice(0, 5) : ['']
  }

  return ['']
})

const canGenerate = computed(() => {
  return Boolean(sheetText('description').trim() || sheetText('title').trim())
})

function sheetText(key: string): string {
  const value = builder.sheet[key]

  return typeof value === 'string' ? value : ''
}

function writeIntros(entries: string[]) {
  builder.updateSheet({
    intros: entries.slice(0, 5),
  })
}

function setIntro(index: number, value: string) {
  const entries = [...introEntries.value]

  entries[index] = value
  writeIntros(entries)
}

function addIntro() {
  if (introEntries.value.length >= 5) return

  writeIntros([...introEntries.value, ''])
}

function removeIntro(index: number) {
  const entries = introEntries.value.filter((_, entryIndex) => {
    return entryIndex !== index
  })

  writeIntros(entries.length ? entries : [''])
}

async function refineIntro(index: number, current: string) {
  builder.updateSheet({
    intros: introEntries.value,
  })

  const result = await builder.callSuggest('intros', 'intros', current)

  if (!result.success || !result.message) return

  setIntro(index, result.message)
}

async function generateAllIntros() {
  const result = await builder.callSuggest(
    'intros',
    'intros',
    introEntries.value.join('\n---\n'),
  )

  if (!result.success || !result.message) return

  const entries = result.message
    .split(/\n---\n|\n\d+\.\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 5)

  writeIntros(entries.length ? entries : [result.message.trim()])
}
</script>
