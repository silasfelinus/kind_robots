<!-- /components/gallery/prompt-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <input
        v-model="query"
        type="search"
        placeholder="Search prompts…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <div v-if="isInitializing" class="picker-loading">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div v-else-if="filtered.length === 0" class="picker-empty">
      <span>🪄</span> No prompts found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="prompt in filtered"
        :key="prompt.id"
        class="picker-row"
        :class="{
          'picker-row--active': promptStore.selectedPrompt?.id === prompt.id,
        }"
        @click="selectPrompt(prompt.id)"
      >
        <span class="picker-icon">🪄</span>

        <span class="picker-label">
          <span class="picker-name">
            {{ promptTitle(prompt) }}
          </span>
          <span class="picker-sub">
            {{ promptPreview(prompt.prompt) }}
          </span>
        </span>

        <button
          class="picker-action btn btn-xs rounded-full"
          :class="
            promptStore.selectedPrompt?.id === prompt.id
              ? 'btn-primary'
              : 'btn-ghost'
          "
          @click.stop="selectPrompt(prompt.id)"
        >
          Open
        </button>
      </li>
    </ul>

    <div
      v-if="promptStore.selectedPrompt"
      class="mt-3 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <div class="flex items-start gap-3">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-base-200 text-xl"
        >
          🪄
        </div>

        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-bold">
            {{ promptTitle(promptStore.selectedPrompt) }}
          </div>
          <div class="mt-1 text-xs leading-snug opacity-70">
            {{
              promptStore.selectedPrompt.prompt || 'No prompt text available.'
            }}
          </div>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button
          class="btn btn-xs btn-primary rounded-full"
          @click="usePrompt(promptStore.selectedPrompt.prompt)"
        >
          Use Prompt
        </button>

        <button
          class="btn btn-xs btn-outline rounded-full"
          @click="promptStore.clearPrompt()"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePromptStore } from '@/stores/promptStore'
import type { Prompt } from '~/prisma/generated/prisma/client'

const promptStore = usePromptStore()
const query = ref('')
const isInitializing = ref(false)

const allPrompts = computed<Prompt[]>(() => promptStore.prompts ?? [])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()

  if (!q) return allPrompts.value

  return allPrompts.value.filter((prompt) => {
    const title = promptTitle(prompt).toLowerCase()
    const body = (prompt.prompt || '').toLowerCase()
    return title.includes(q) || body.includes(q)
  })
})

onMounted(async () => {
  if (!promptStore.prompts?.length) {
    isInitializing.value = true
    try {
      await promptStore.initialize()
    } finally {
      isInitializing.value = false
    }
  }
})

async function selectPrompt(promptId: number) {
  await promptStore.selectPrompt(promptId)
}

function promptTitle(prompt: Prompt) {
  return extractPromptTitle(prompt.prompt) || `Prompt #${prompt.id}`
}

function promptPreview(text: string) {
  const cleaned = text.trim()
  return cleaned.length > 72 ? `${cleaned.slice(0, 72)}…` : cleaned
}

function extractPromptTitle(text: string) {
  const firstSegment = text.split('|')[0]?.replace(/\s+/g, ' ').trim()

  if (!firstSegment) return ''

  return firstSegment.length > 36
    ? `${firstSegment.slice(0, 36)}…`
    : firstSegment
}

function usePrompt(text: string) {
  promptStore.currentPrompt = text
  promptStore.addPromptToArray(text)
}
</script>
